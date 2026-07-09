import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { ForbiddenException, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { can, isStaff } from "../../domain/roles";
import type { AuthUser } from "../../auth/auth-user.type";
import type { ValidateInput, AiResult, VibeInput, VibeResult, RunCodeResult, GenerateCodeResult, ExplainCodeResult, ValidateCodeResult, ScoreProjectResult } from "./dto";

// Human labels for the Coding Studio languages (for AI prompts).
const CODE_LANG_LABELS: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  html: "HTML",
  css: "CSS",
  typescript: "TypeScript",
  go: "Go",
  rust: "Rust",
  cpp: "C++",
  csharp: "C#",
  sql: "SQL",
};

// OpenAI-compatible chat completions (GLM by default; schools/users can override).
type AiConfig = { provider?: string; baseUrl?: string; model?: string; apiKey?: string };
type ResolvedAi = { baseUrl: string; model: string; apiKey: string; provider: string };

// Hard timeout on outbound AI provider requests (also mitigates a hung/slow
// school-configurable baseUrl tying up the server).
const AI_FETCH_TIMEOUT_MS = 90_000; // validate / describe
const AI_VIBE_TIMEOUT_MS = 180_000; // RoboVibe generates a full diagram + code + README

const VIBE_SYSTEM =
  "You are RoboVibe, an AI assistant on RoboCode.Africa (a safe robotics learning platform for " +
  "young students) that edits a student's robotics project from a natural-language instruction. You are " +
  "given the current project (board, diagram parts + wires, code, README), the available component catalog, " +
  "and the EXACT pin names of the board and of every existing part. Apply the requested change and return the " +
  "COMPLETE updated project.\n\n" +
  "Return ONLY one JSON object (no markdown, no commentary) with this exact shape:\n" +
  '{ "summary": string, "readme": string, "files": [ { "name": string, "content": string } ], ' +
  '"diagram": { "board": string, ' +
  '"parts": [ { "id": string, "type": string, "x": number, "y": number, "props"?: object } ], ' +
  '"wires": [ { "id": string, "from": string, "to": string, "color": string } ] } }\n\n' +
  "RULES:\n" +
  '- ALWAYS include the board part with id "mcu" and type "__board__:<board>"; keep its position.\n' +
  '- Reuse existing part ids when keeping a component; give new parts ids like "<catalogId>-<n>".\n' +
  '- A part "type" MUST be a catalog id from the provided list (e.g. "led","resistor","ultrasonic","servo","buzzer"). Never invent types.\n' +
  '- Wire endpoints are "partId:pinName". Use ONLY pin names from the provided board pins, existing-part pins, or catalog component pins. LEDs need a series resistor. Always wire power (5V/3V3/VCC) and ground (GND).\n' +
  "- Place new parts tidily to the right of the board: x from 480 stepping ~180, y from 80 stepping ~150; never overlap the board.\n" +
  "CODE (the \"files\" array) — this is the FULL source, ready to compile/run as-is:\n" +
  '- The FIRST file is the main sketch and MUST be named "<project-slug>.ino" (lower-kebab of the title) for Arduino/ESP32, or "main.py" for the Pico (MicroPython).\n' +
  "- Provide COMPLETE, compiling code — no placeholders, TODOs, or \"...\". The pins used in code MUST match the wiring exactly.\n" +
  "- Split into multiple files ONLY when it genuinely improves clarity (e.g. a reusable Button/Display class): add paired \"Name.h\" + \"Name.cpp\" and a \"config.h\" for pins/constants. Use #include \"Local.h\" for your own headers and #include <Library.h> for libraries. Small projects should stay a single .ino.\n" +
  '- If the sketch needs external Arduino libraries, add a "libraries.txt" file listing them, one per line (name as in the Library Manager).\n' +
  "- Keep code age-appropriate and well-commented, with Serial prints where useful.\n" +
  "- The README must accurately reflect the updated project: a '# Title', intro, '## What it does', '## Components', '## How it's wired', '## How the code works'.\n" +
  "- Make the SMALLEST change that satisfies the instruction; keep everything else intact. Never mention Wokwi.";

const VALIDATE_SYSTEM =
  "You are an expert electronics and Arduino tutor reviewing a student's circuit on RoboCode.Africa, " +
  "a safe learning platform for young students. You are given the project, the components, how they are wired " +
  "(pin to pin), the code, and a screenshot of the circuit diagram. Validate that: (1) the wiring is sensible " +
  "for these components (power/ground present, resistors where needed, correct signal pins), and (2) the code " +
  "matches the wiring. Be encouraging, age-appropriate, concise, and specific. Reply in short GitHub-flavoured " +
  "Markdown with exactly these sections: '### Verdict' (one line), '### Issues' (a bullet list, or 'None found'), " +
  "and '### Suggestions' (a short bullet list). Never mention Wokwi.";

const RUN_CODE_SYSTEM =
  "You are a precise, multi-language code execution engine for the RoboCode.Africa Coding Studio (a safe " +
  "learning platform for students). You are given a programming language and a project of one or more source " +
  "files (with an entry-point file). Behave EXACTLY like that language's real toolchain: compile/link/run the " +
  "whole project starting from the entry point; if it runs, produce its exact standard output (stdout); if it " +
  "fails to compile or hits a syntax/runtime error, produce the realistic compiler/interpreter error message " +
  "(with file name + line numbers where a real tool would show them).\n" +
  'Return ONLY one JSON object: { "output": string, "error": boolean }.\n' +
  "- `output`: the raw program stdout, OR the error text when it fails. Never include commentary or markdown fences.\n" +
  "- `error`: true ONLY when the project failed to compile/run; false for a clean run (even if output is empty).\n" +
  "- Assume no interactive stdin; if input is required, simulate sensible sample values. For SQL, show the resulting " +
  "rows as a simple text table. Keep output faithful to what the real toolchain would print.";

const GENERATE_CODE_SYSTEM =
  "You are RoboVibe Code, an AI coding tutor on RoboCode.Africa (a safe learning platform for primary and " +
  "high-school students). Given a target programming language and a plain-language description, write correct, " +
  "clean, COMPLETE and runnable code. For a simple request, return a single file; for anything that benefits from " +
  "structure (a small project), split it into multiple sensible files with an entry point first. Keep it " +
  "age-appropriate, well-structured and briefly commented.\n" +
  'Return ONLY one JSON object: { "files": [ { "name": string, "content": string } ] }. The FIRST file is the ' +
  "entry point. Use correct file extensions for the language. Provide COMPLETE file contents — no placeholders, " +
  "TODOs or \"...\". No commentary, no markdown fences.";

const SCORE_PROJECT_SYSTEM =
  "You are a fair, consistent, encouraging judge ranking student projects on RoboCode.Africa (robotics/" +
  "electronics circuits and coding projects by primary & high-school students). Rate the project on four " +
  "dimensions, each an integer 0–100:\n" +
  "- usefulness: does it do something genuinely useful or meaningful?\n" +
  "- innovation: how creative/clever is the idea or approach?\n" +
  "- originality: how distinct is it from a trivial textbook example?\n" +
  "- complexity: how much skill/effort does it demonstrate (age-appropriate)?\n" +
  "Be realistic but kind; a basic 'hello world' or single blinking LED scores low (10–30), a thoughtful " +
  "multi-part project scores high (70–95). Reserve 95+ for exceptional work.\n" +
  'Return ONLY one JSON object: { "usefulness", "innovation", "originality", "complexity", "overall", "summary" } ' +
  "where overall (0–100) is a weighted blend and summary is ONE encouraging sentence of feedback. No markdown, no commentary.";

const VALIDATE_CODE_SYSTEM =
  "You are a careful code reviewer on RoboCode.Africa helping a primary/high-school student check their code " +
  "BEFORE they run it. Given a programming language and a source file, check for syntax errors, obvious bugs, " +
  "missing imports/declarations, and common pitfalls. Be encouraging, concise and age-appropriate. Return " +
  "GitHub-flavoured Markdown with exactly: '### Verdict' (one line — e.g. 'Looks good — safe to run' or " +
  "'Found issues to fix first'), '### Issues' (a bullet list quoting the problem line in inline code, or " +
  "'None found'), and '### Suggestions' (a short bullet list, optional).";

const EXPLAIN_CODE_SYSTEM =
  "You are a friendly coding tutor on RoboCode.Africa explaining code to a primary/high-school student. " +
  "Given a programming language and a source file, explain what the code does, going through it line by line " +
  "(or in small logical groups for boilerplate). Be clear, encouraging and concise. Return GitHub-flavoured " +
  "Markdown: a one-sentence summary, then a bulleted, in-order walkthrough where each bullet quotes the line " +
  "(inline code) and explains it simply. No fluff, and don't restate the whole program at the end.";

const DESCRIBE_SYSTEM =
  "You write an engaging, clear, kid-friendly project description for a RoboCode.Africa robotics project, " +
  "based on the components, wiring, code and the attached diagram screenshot. Output GitHub-flavoured Markdown with: " +
  "a single '# Title' line, a one-paragraph intro, '## What it does', '## Components' (bullet list), " +
  "'## How it's wired' (brief, mention the key pins), and '## How the code works' (a few short bullets). " +
  "Keep it accurate to the actual circuit, encouraging, and suitable for primary/high-school students. Never mention Wokwi.";

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  // --- effective AI config resolution -------------------------------------
  private defaults(): ResolvedAi {
    return {
      provider: "glm",
      baseUrl: process.env.GLM_BASE_URL || "https://api.z.ai/api/paas/v4",
      model: process.env.GLM_MODEL || "glm-5.2",
      apiKey: process.env.GLM_API_KEY || "",
    };
  }

  /** A user belongs to a school when their tenant exists and isn't the platform. */
  private isSchoolUser(user?: AuthUser | null): boolean {
    return !!user?.tenant && !user.tenant.isPlatform;
  }

  /** Effective config: school config for school members, else the user's own, else platform default. */
  resolveConfig(user?: AuthUser | null): ResolvedAi {
    const d = this.defaults();
    const cfg = (this.isSchoolUser(user) ? user!.tenant!.aiConfig : user?.aiConfig) as AiConfig | null | undefined;
    const baseUrl = cfg?.baseUrl || d.baseUrl;
    // Key isolation: never forward the platform default key to a NON-default
    // baseUrl. If the user/school points at their own baseUrl but supplied no
    // apiKey, leave the key empty (treated as "not configured") so the platform
    // GLM_API_KEY can't be exfiltrated to an arbitrary endpoint.
    const isDefaultBase = baseUrl === d.baseUrl;
    const apiKey = cfg?.apiKey || (isDefaultBase ? d.apiKey : "");
    return {
      provider: cfg?.provider || d.provider,
      baseUrl,
      model: cfg?.model || d.model,
      apiKey,
    };
  }

  /** Private, loopback, link-local, multicast, and otherwise non-public IPs. */
  private isBlockedAddress(host: string): boolean {
    const normalized = host.toLowerCase().replace(/^\[|\]$/g, "");
    const family = isIP(normalized);
    if (family === 4) {
      const [a, b] = normalized.split(".").map((p) => Number(p));
      return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        a >= 224
      );
    }
    if (family === 6) {
      return (
        normalized === "::" ||
        normalized === "::1" ||
        normalized.startsWith("fc") ||
        normalized.startsWith("fd") ||
        normalized.startsWith("fe80:") ||
        normalized.startsWith("ff")
      );
    }
    return normalized === "localhost";
  }

  /**
   * SSRF guard for the (user/school-configurable) AI baseUrl. Rejects non-http(s)
   * schemes, bare internal-looking hostnames, IP literals in non-public ranges,
   * and DNS names that resolve to non-public ranges.
   */
  private async isAllowedBaseUrl(url: string): Promise<boolean> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return false;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (this.isBlockedAddress(host)) return false;
    // Bare hostnames with no dot (and not an IPv6 literal) are internal-looking.
    if (!host.includes(".") && !host.includes(":")) return false;
    if (isIP(host)) return true;

    try {
      const addresses = await lookup(host, { all: true, verbatim: true });
      return addresses.length > 0 && addresses.every((a) => !this.isBlockedAddress(a.address));
    } catch {
      return false;
    }
  }

  /**
   * True when the effective baseUrl is safe to call: either the platform default
   * (always trusted) or a custom URL that passes the SSRF allow-list.
   */
  private async isReachableBaseUrl(cfg: ResolvedAi): Promise<boolean> {
    if (cfg.baseUrl === this.defaults().baseUrl) return true;
    return this.isAllowedBaseUrl(cfg.baseUrl);
  }

  private buildUserText(input: ValidateInput): string {
    return [
      `Project: ${input.title}`,
      `Board: ${input.board}`,
      "",
      "Components:",
      ...(input.components.length ? input.components.map((c) => `- ${c}`) : ["- (none)"]),
      "",
      "Connections (pin -> pin):",
      ...(input.connections.length ? input.connections.map((c) => `- ${c.from} -> ${c.to}`) : ["- (none)"]),
      "",
      "Code (sketch.ino):",
      "```cpp",
      input.code.slice(0, 8000),
      "```",
    ].join("\n");
  }

  private endpointOf(cfg: ResolvedAi): string {
    return `${cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  }

  private async runChat(system: string, input: ValidateInput, cfg: ResolvedAi): Promise<AiResult> {
    if (!cfg.apiKey) {
      return {
        ok: false,
        configured: false,
        text: "AI isn't configured yet. Add an AI model and API key in Settings (or ask your school admin).",
      };
    }
    if (!(await this.isReachableBaseUrl(cfg))) {
      return { ok: false, configured: true, text: "AI provider not reachable (the configured AI URL is blocked)." };
    }
    const user = this.buildUserText(input);
    const userContent = input.image
      ? [
          { type: "text", text: user + "\n\nA rendered screenshot of the circuit diagram is attached." },
          { type: "image_url", image_url: { url: input.image } },
        ]
      : user;

    const doFetch = (content: unknown) =>
      fetch(this.endpointOf(cfg), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content },
          ],
          stream: false,
        }),
        // Bound the call so a slow/hung (or attacker-controlled) provider cannot
        // hold the request open indefinitely.
        signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
      });

    try {
      let res = await doFetch(userContent);
      if (!res.ok && input.image) res = await doFetch(user); // text-only fallback if vision unsupported
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return { ok: false, configured: true, text: `AI request failed (HTTP ${res.status}). ${detail.slice(0, 200)}` };
      }
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = data?.choices?.[0]?.message?.content?.trim() || "No content returned.";
      return { ok: true, configured: true, text };
    } catch (e) {
      return { ok: false, configured: true, text: `Could not reach the AI provider: ${(e as Error).message}` };
    }
  }

  validateCircuit(input: ValidateInput, user?: AuthUser | null): Promise<AiResult> {
    return this.runChat(VALIDATE_SYSTEM, input, this.resolveConfig(user));
  }

  describeCircuit(input: ValidateInput, user?: AuthUser | null): Promise<AiResult> {
    return this.runChat(DESCRIBE_SYSTEM, input, this.resolveConfig(user));
  }

  private buildVibeUserText(input: VibeInput): string {
    const catalog = input.catalog
      .map((c) => `- ${c.id} — ${c.name}${c.pins?.length ? ` — pins: ${c.pins.join(", ")}` : ""}`)
      .join("\n");
    const partPins = Object.entries(input.partPins)
      .map(([id, pins]) => `- ${id}: ${pins.join(", ")}`)
      .join("\n");
    return [
      `INSTRUCTION (the change to make): ${input.instruction}`,
      "",
      `Project: ${input.title}`,
      `Board: ${input.board}  (language: ${input.language ?? "arduino"})`,
      "",
      "Board pins (id \"mcu\"):",
      input.boardPins.length ? input.boardPins.join(", ") : "(unknown)",
      "",
      "Existing parts and their exact pins:",
      partPins || "(none)",
      "",
      "Component catalog you may ADD (use the id as the part \"type\"):",
      catalog,
      "",
      "Current diagram JSON:",
      "```json",
      JSON.stringify(input.diagram).slice(0, 12000),
      "```",
      "",
      "Current code:",
      "```",
      input.code.slice(0, 8000),
      "```",
      "",
      "Current README.md:",
      "```markdown",
      input.readme.slice(0, 6000),
      "```",
    ].join("\n");
  }

  async vibeCircuit(input: VibeInput, user?: AuthUser | null): Promise<VibeResult> {
    const cfg = this.resolveConfig(user);
    if (!cfg.apiKey) {
      return { ok: false, configured: false, text: "AI isn't configured yet. Add an AI model and API key in Settings (or ask your school admin)." };
    }
    if (!(await this.isReachableBaseUrl(cfg))) {
      return { ok: false, configured: true, text: "AI provider not reachable (the configured AI URL is blocked)." };
    }
    const prompt = this.buildVibeUserText(input);
    const doFetch = (content: unknown) =>
      fetch(this.endpointOf(cfg), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: "system", content: VIBE_SYSTEM },
            { role: "user", content },
          ],
          response_format: { type: "json_object" },
          stream: false,
        }),
        // Bound the call so a slow/hung (or attacker-controlled) provider cannot
        // hold the request open indefinitely. Vibe generation is heavier, so it
        // gets a longer budget than validate/describe.
        signal: AbortSignal.timeout(AI_VIBE_TIMEOUT_MS),
      });

    try {
      const withImage = input.image
        ? [
            { type: "text", text: prompt + "\n\nA rendered screenshot of the current circuit is attached for reference." },
            { type: "image_url", image_url: { url: input.image } },
          ]
        : prompt;
      let res = await doFetch(withImage);
      if (!res.ok && input.image) res = await doFetch(prompt); // text-only fallback if vision unsupported
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return { ok: false, configured: true, text: `RoboVibe request failed (HTTP ${res.status}). ${detail.slice(0, 200)}` };
      }
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const raw = data?.choices?.[0]?.message?.content?.trim() ?? "";
      const parsed = this.extractJson(raw);
      if (!parsed) return { ok: false, configured: true, text: "RoboVibe could not produce a valid project edit. Please rephrase your request." };
      const summary = typeof parsed.summary === "string" ? parsed.summary : "Applied your changes.";
      return { ok: true, configured: true, text: summary, result: parsed as VibeResult["result"] };
    } catch (e) {
      return { ok: false, configured: true, text: `Could not reach the AI provider (${cfg.provider}): ${(e as Error).message}` };
    }
  }

  // --- Coding Studio: AI as runtime + code generation + explanation --------

  /** Low-level chat call returning the raw assistant text (no image, optional JSON mode). */
  private async rawChat(system: string, prompt: string, cfg: ResolvedAi, json: boolean): Promise<string | null> {
    const res = await fetch(this.endpointOf(cfg), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        ...(json ? { response_format: { type: "json_object" } } : {}),
        stream: false,
      }),
      signal: AbortSignal.timeout(AI_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data?.choices?.[0]?.message?.content ?? "";
  }

  /**
   * Execute a (multi-file) project via the AI: returns stdout or a syntax/compile error.
   * FALLBACK-only path (badged "AI-simulated" in the UI) — used when the real jailed
   * Docker sandbox (RunService/SandboxService) is unavailable or disabled, not the
   * primary runner. See docs/sandbox-ops.md.
   */
  async runCode(
    user: AuthUser | null,
    language: string,
    files: { name: string; content: string }[],
    entry?: string,
  ): Promise<RunCodeResult> {
    const cfg = this.resolveConfig(user);
    if (!cfg.apiKey) {
      return { ok: false, configured: false, output: "", error: true, text: "AI isn't configured yet. Add an AI model and API key in Settings (or ask your school admin)." };
    }
    if (!(await this.isReachableBaseUrl(cfg))) {
      return { ok: false, configured: true, output: "", error: true, text: "AI provider not reachable (the configured AI URL is blocked)." };
    }
    const label = CODE_LANG_LABELS[language] ?? language;
    const entryName = entry || files[0]?.name;
    const project = files
      .map((f) => `--- FILE: ${f.name}${f.name === entryName ? " (entry point)" : ""} ---\n${f.content.slice(0, 16000)}`)
      .join("\n\n");
    const prompt = `Language: ${label}\nEntry point: ${entryName}\n\nProject files:\n${project}\n\nCompile and run the project, then return { "output", "error" } exactly as specified.`;
    try {
      const raw = (await this.rawChat(RUN_CODE_SYSTEM, prompt, cfg, true))?.trim();
      if (raw == null) return { ok: false, configured: true, output: "", error: true, text: "AI request failed." };
      const parsed = this.extractJson(raw);
      if (!parsed) return { ok: true, configured: true, output: raw, error: false };
      const output = typeof parsed.output === "string" ? parsed.output : String(parsed.output ?? "");
      return { ok: true, configured: true, output, error: !!parsed.error };
    } catch (e) {
      return { ok: false, configured: true, output: "", error: true, text: `Could not reach the AI provider (${cfg.provider}): ${(e as Error).message}` };
    }
  }

  /** RoboVibe for code — generate a single file or a small multi-file project. */
  async generateCode(user: AuthUser | null, language: string, instruction: string): Promise<GenerateCodeResult> {
    const cfg = this.resolveConfig(user);
    if (!cfg.apiKey) {
      return { ok: false, configured: false, text: "AI isn't configured yet. Add an AI model and API key in Settings (or ask your school admin)." };
    }
    if (!(await this.isReachableBaseUrl(cfg))) {
      return { ok: false, configured: true, text: "AI provider not reachable (the configured AI URL is blocked)." };
    }
    const label = CODE_LANG_LABELS[language] ?? language;
    const prompt = `Language: ${label}\n\nBuild this in ${label}:\n${instruction.slice(0, 4000)}\n\nReturn { "files": [ { "name", "content" } ] } with the entry point first.`;
    try {
      const raw = await this.rawChat(GENERATE_CODE_SYSTEM, prompt, cfg, true);
      if (raw == null) return { ok: false, configured: true, text: "AI request failed." };
      const parsed = this.extractJson(raw);
      const arr = parsed?.files;
      if (Array.isArray(arr) && arr.length) {
        const files = arr
          .filter((f): f is { name: string; content: string } => !!f && typeof (f as { name?: unknown }).name === "string" && typeof (f as { content?: unknown }).content === "string")
          .map((f) => ({ name: f.name, content: f.content }));
        if (files.length) return { ok: true, configured: true, files };
      }
      // Fallback: model returned plain code — wrap as a single file.
      return { ok: true, configured: true, files: [{ name: `main.${language === "cpp" ? "cpp" : language}`, content: this.stripCodeFences(raw) }] };
    } catch (e) {
      return { ok: false, configured: true, text: `Could not reach the AI provider (${cfg.provider}): ${(e as Error).message}` };
    }
  }

  /** Check read access for a project (mirrors the gate in ProjectsService.getProject). */
  private canReadProject(user: AuthUser, p: { ownerId: string; tenantId: string | null; visibility: string }): boolean {
    if (p.ownerId === user.id) return true;
    if (p.visibility === "public") return true;
    if (p.tenantId && p.tenantId === user.tenantId) return p.visibility !== "private" || isStaff(user.role);
    return false;
  }

  /** Code Explainer — line-by-line explanation of a source file. */
  async explainCode(user: AuthUser | null, language: string, code: string, filename?: string, projectId?: string): Promise<ExplainCodeResult> {
    const cfg = this.resolveConfig(user);
    const hash = createHash("sha256").update(code).digest("hex");

    // Try the persisted cache first.
    let codeFile: { id: string; explanation: string | null; explanationHash: string | null } | null = null;
    if (user && projectId && projectId !== "new" && filename) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true, tenantId: true, visibility: true },
      });
      if (project && this.canReadProject(user, project)) {
        codeFile = await this.prisma.codeFile.findFirst({
          where: { projectId, filename },
          select: { id: true, explanation: true, explanationHash: true },
        });
        if (codeFile?.explanation && codeFile.explanationHash === hash) {
          return { ok: true, configured: true, explanation: codeFile.explanation, cached: true };
        }
      }
    }

    if (!cfg.apiKey) {
      return { ok: false, configured: false, text: "AI isn't configured yet. Add an AI model and API key in Settings (or ask your school admin)." };
    }
    if (!(await this.isReachableBaseUrl(cfg))) {
      return { ok: false, configured: true, text: "AI provider not reachable (the configured AI URL is blocked)." };
    }
    const label = CODE_LANG_LABELS[language] ?? language;
    const prompt = `Language: ${label}${filename ? `\nFile: ${filename}` : ""}\n\nExplain this code line by line:\n\`\`\`\n${code.slice(0, 16000)}\n\`\`\``;
    try {
      const raw = (await this.rawChat(EXPLAIN_CODE_SYSTEM, prompt, cfg, false))?.trim();
      if (!raw) return { ok: false, configured: true, text: "AI request failed." };
      if (codeFile) {
        await this.prisma.codeFile.update({
          where: { id: codeFile.id },
          data: { explanation: raw, explanationHash: hash, explanationAt: new Date() },
        });
      }
      return { ok: true, configured: true, explanation: raw, cached: false };
    } catch (e) {
      return { ok: false, configured: true, text: `Could not reach the AI provider (${cfg.provider}): ${(e as Error).message}` };
    }
  }

  /** Validate with AI — review code for problems before running. */
  async validateCode(user: AuthUser | null, language: string, code: string, filename?: string): Promise<ValidateCodeResult> {
    const cfg = this.resolveConfig(user);
    if (!cfg.apiKey) {
      return { ok: false, configured: false, text: "AI isn't configured yet. Add an AI model and API key in Settings (or ask your school admin)." };
    }
    if (!(await this.isReachableBaseUrl(cfg))) {
      return { ok: false, configured: true, text: "AI provider not reachable (the configured AI URL is blocked)." };
    }
    const label = CODE_LANG_LABELS[language] ?? language;
    const prompt = `Language: ${label}${filename ? `\nFile: ${filename}` : ""}\n\nReview this code before it runs:\n\`\`\`\n${code.slice(0, 16000)}\n\`\`\``;
    try {
      const raw = (await this.rawChat(VALIDATE_CODE_SYSTEM, prompt, cfg, false))?.trim();
      if (!raw) return { ok: false, configured: true, text: "AI request failed." };
      return { ok: true, configured: true, result: raw };
    } catch (e) {
      return { ok: false, configured: true, text: `Could not reach the AI provider (${cfg.provider}): ${(e as Error).message}` };
    }
  }

  /** AI project ranking — score a project on usefulness/innovation/originality/complexity. */
  async scoreProject(
    user: AuthUser | null,
    input: { title: string; description?: string | null; kind?: string; board?: string; code: string },
  ): Promise<ScoreProjectResult> {
    const cfg = this.resolveConfig(user);
    if (!cfg.apiKey) {
      return { ok: false, configured: false, text: "AI isn't configured yet. Add an AI model and API key in Settings (or ask your school admin)." };
    }
    if (!(await this.isReachableBaseUrl(cfg))) {
      return { ok: false, configured: true, text: "AI provider not reachable (the configured AI URL is blocked)." };
    }
    const prompt = [
      `Project type: ${input.kind === "coding" ? "Coding project" : "Robotics / electronics project"}`,
      `Title: ${input.title}`,
      input.description ? `Description: ${input.description}` : "",
      input.kind !== "coding" && input.board ? `Board: ${input.board}` : "",
      "Code / source:",
      "```",
      (input.code || "").slice(0, 14000),
      "```",
      "",
      "Score it and return the JSON object as specified.",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      const raw = await this.rawChat(SCORE_PROJECT_SYSTEM, prompt, cfg, true);
      const parsed = raw ? this.extractJson(raw) : null;
      if (!parsed) return { ok: false, configured: true, text: "Couldn't score this project. Please try again." };
      const clamp = (v: unknown) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
      const usefulness = clamp(parsed.usefulness);
      const innovation = clamp(parsed.innovation);
      const originality = clamp(parsed.originality);
      const complexity = clamp(parsed.complexity);
      const overall = parsed.overall != null ? clamp(parsed.overall) : Math.round((usefulness + innovation + originality + complexity) / 4);
      const summary = typeof parsed.summary === "string" ? parsed.summary : "Nice work!";
      return { ok: true, configured: true, score: { usefulness, innovation, originality, complexity, overall, summary } };
    } catch (e) {
      return { ok: false, configured: true, text: `Could not reach the AI provider (${cfg.provider}): ${(e as Error).message}` };
    }
  }

  /** Strip a single leading/trailing ```lang fence the model may add around code. */
  private stripCodeFences(raw: string): string {
    const t = raw.trim();
    const m = t.match(/^```[a-zA-Z0-9+#]*\n([\s\S]*?)\n```$/);
    return (m ? m[1] : t).trim();
  }

  // --- AI config management (per school / per solo user) -------------------

  /** The current AI config + scope + whether the caller may edit it (key masked). */
  getConfig(user: AuthUser) {
    const school = this.isSchoolUser(user);
    const cfg = (school ? user.tenant!.aiConfig : user.aiConfig) as AiConfig | null;
    const eff = this.resolveConfig(user);
    return {
      scope: school ? "school" : "personal",
      schoolName: school ? user.tenant!.name : null,
      canEdit: school ? can(user.role, "tenant.manage") : true,
      config: {
        provider: cfg?.provider ?? null,
        baseUrl: cfg?.baseUrl ?? null,
        model: cfg?.model ?? null,
        hasKey: !!cfg?.apiKey,
      },
      effective: { provider: eff.provider, model: eff.model, baseUrl: eff.baseUrl },
      defaultModel: this.defaults().model,
    };
  }

  /** Update the school's config (tenant.manage only) or the solo user's own config. */
  async updateConfig(
    user: AuthUser,
    input: { provider?: string; baseUrl?: string; model?: string; apiKey?: string; clearKey?: boolean },
  ) {
    const school = this.isSchoolUser(user);
    if (school && !can(user.role, "tenant.manage")) {
      throw new ForbiddenException("Only a school admin can change the school's AI settings.");
    }
    const existing = (school ? user.tenant!.aiConfig : user.aiConfig) as AiConfig | null;
    const merged: AiConfig = { ...(existing ?? {}) };
    if (input.provider !== undefined) merged.provider = input.provider || undefined;
    if (input.baseUrl !== undefined) merged.baseUrl = input.baseUrl || undefined;
    if (input.model !== undefined) merged.model = input.model || undefined;
    if (input.clearKey) merged.apiKey = undefined;
    else if (input.apiKey) merged.apiKey = input.apiKey;

    const cleaned: AiConfig = {};
    for (const k of ["provider", "baseUrl", "model", "apiKey"] as const) if (merged[k]) cleaned[k] = merged[k];
    const data = cleaned as unknown as Prisma.InputJsonValue;

    if (school) {
      await this.prisma.tenant.update({ where: { id: user.tenantId }, data: { aiConfig: data } });
      user.tenant!.aiConfig = cleaned as never;
    } else {
      await this.prisma.user.update({ where: { id: user.id }, data: { aiConfig: data } });
      user.aiConfig = cleaned as never;
    }
    return this.getConfig(user);
  }

  /** Best-effort parse of the model's JSON (handles accidental code fences). */
  private extractJson(raw: string): Record<string, unknown> | null {
    if (!raw) return null;
    const candidates = [raw];
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) candidates.push(fence[1]);
    const brace = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    if (brace) candidates.push(brace);
    for (const c of candidates) {
      try {
        const obj = JSON.parse(c.trim());
        if (obj && typeof obj === "object") return obj as Record<string, unknown>;
      } catch {
        /* try next */
      }
    }
    return null;
  }
}
