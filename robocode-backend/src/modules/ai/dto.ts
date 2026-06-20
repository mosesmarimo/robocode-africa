import { z } from "zod";

/** ValidateInput — ported from the old `src/lib/ai/deepseek.ts`. */
export const validateInputSchema = z.object({
  title: z.string(),
  board: z.string(),
  components: z.array(z.string()),
  connections: z.array(z.object({ from: z.string(), to: z.string() })),
  code: z.string(),
  readme: z.string(),
  /** PNG data URL of the circuit diagram */
  image: z.string().optional(),
});

export type ValidateInput = z.infer<typeof validateInputSchema>;

export interface AiResult {
  ok: boolean;
  configured: boolean;
  text: string;
}

// Back-compat alias
export type ValidateResult = AiResult;
