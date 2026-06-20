import "server-only";

// DeepSeek integration (mirrors the ZivoCloud-Backend setup: same env var, model & endpoint).
const ENDPOINT = "https://api.deepseek.com/chat/completions";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";

export interface ValidateInput {
  title: string;
  board: string;
  components: string[];
  connections: { from: string; to: string }[];
  code: string;
  readme: string;
  /** PNG data URL of the circuit diagram */
  image?: string;
}

export interface AiResult {
  ok: boolean;
  configured: boolean;
  text: string;
}

const VALIDATE_SYSTEM =
  "You are an expert electronics and Arduino tutor reviewing a student's circuit on RoboCode.Africa, " +
  "a safe learning platform for young students. You are given the project, the components, how they are wired " +
  "(pin to pin), the code, and a screenshot of the circuit diagram. Validate that: (1) the wiring is sensible " +
  "for these components (power/ground present, resistors where needed, correct signal pins), and (2) the code " +
  "matches the wiring. Be encouraging, age-appropriate, concise, and specific. Reply in short GitHub-flavoured " +
  "Markdown with exactly these sections: '### Verdict' (one line), '### Issues' (a bullet list, or 'None found'), " +
  "and '### Suggestions' (a short bullet list). Never mention Wokwi.";

const DESCRIBE_SYSTEM =
  "You write an engaging, clear, kid-friendly project description for a RoboCode.Africa robotics project, " +
  "based on the components, wiring, code and the attached diagram screenshot. Output GitHub-flavoured Markdown with: " +
  "a single '# Title' line, a one-paragraph intro, '## What it does', '## Components' (bullet list), " +
  "'## How it's wired' (brief, mention the key pins), and '## How the code works' (a few short bullets). " +
  "Keep it accurate to the actual circuit, encouraging, and suitable for primary/high-school students. Never mention Wokwi.";

function buildUserText(input: ValidateInput): string {
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

async function runChat(system: string, input: ValidateInput): Promise<AiResult> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    return {
      ok: false,
      configured: false,
      text: "AI isn't configured yet. Set **DEEPSEEK_API_KEY** in the server environment to enable it.",
    };
  }
  const user = buildUserText(input);
  const userContent = input.image
    ? [
        { type: "text", text: user + "\n\nA rendered screenshot of the circuit diagram is attached." },
        { type: "image_url", image_url: { url: input.image } },
      ]
    : user;

  const doFetch = (content: unknown) =>
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content },
        ],
        stream: false,
      }),
    });

  try {
    let res = await doFetch(userContent);
    if (!res.ok && input.image) res = await doFetch(user); // text-only fallback if vision unsupported
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, configured: true, text: `DeepSeek request failed (HTTP ${res.status}). ${detail.slice(0, 200)}` };
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data?.choices?.[0]?.message?.content?.trim() || "No content returned.";
    return { ok: true, configured: true, text };
  } catch (e) {
    return { ok: false, configured: true, text: `Could not reach DeepSeek: ${(e as Error).message}` };
  }
}

export function validateCircuit(input: ValidateInput): Promise<AiResult> {
  return runChat(VALIDATE_SYSTEM, input);
}

export function describeCircuit(input: ValidateInput): Promise<AiResult> {
  return runChat(DESCRIBE_SYSTEM, input);
}

// Back-compat alias
export type ValidateResult = AiResult;
