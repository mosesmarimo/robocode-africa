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

export interface ValidateResult {
  ok: boolean;
  configured: boolean;
  text: string;
}

const SYSTEM_PROMPT =
  "You are an expert electronics and Arduino tutor reviewing a student's circuit on RoboCode.Africa, " +
  "a safe learning platform for young students. You are given the project description, the list of components, " +
  "how they are wired (pin to pin), and the code. Validate that: (1) the wiring is sensible for these components " +
  "(power/ground present, resistors where needed, correct signal pins), and (2) the code matches the wiring " +
  "(pins used in code are actually connected to the right parts). Be encouraging and age-appropriate, concise, and specific. " +
  "Reply in short GitHub-flavoured Markdown with exactly these sections: '### Verdict' (one line), " +
  "'### Issues' (a bullet list, or 'None found'), and '### Suggestions' (a short bullet list).";

export async function validateCircuit(input: ValidateInput): Promise<ValidateResult> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    return {
      ok: false,
      configured: false,
      text: "AI validation isn't configured yet. Set **DEEPSEEK_API_KEY** in the server environment (the same key used by ZivoCloud-Backend) to enable it.",
    };
  }

  const user = [
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
    "",
    "Description:",
    input.readme.slice(0, 4000),
  ].join("\n");

  // Send the diagram screenshot alongside the text when available (multimodal).
  const userContent = input.image
    ? [
        { type: "text", text: user + "\n\nA rendered screenshot of the circuit diagram is attached — use it to check the layout and connections." },
        { type: "image_url", image_url: { url: input.image } },
      ]
    : user;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        stream: false,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, configured: true, text: `DeepSeek request failed (HTTP ${res.status}). ${detail.slice(0, 200)}` };
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data?.choices?.[0]?.message?.content?.trim() || "The validator returned no content.";
    return { ok: true, configured: true, text };
  } catch (e) {
    return { ok: false, configured: true, text: `Could not reach DeepSeek: ${(e as Error).message}` };
  }
}
