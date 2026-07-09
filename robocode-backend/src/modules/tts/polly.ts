import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

// Shared with zivocloud's Spelling Bee — same AWS Polly neural voices + creds.
export const POLLY_VOICES = [
  { id: "Ivy", label: "Ivy (Kids US)" },
  { id: "Justin", label: "Justin (Kids US)" },
  { id: "Kevin", label: "Kevin (Kids US)" },
  { id: "Joanna", label: "Joanna (US)" },
  { id: "Matthew", label: "Matthew (US)" },
  { id: "Ruth", label: "Ruth (US)" },
  { id: "Stephen", label: "Stephen (US)" },
  { id: "Amy", label: "Amy (UK)" },
  { id: "Brian", label: "Brian (UK)" },
] as const;

export type PollyVoiceId = (typeof POLLY_VOICES)[number]["id"];

// Clear, friendly default for reading explanations to students.
export const DEFAULT_VOICE_ID: PollyVoiceId = "Joanna";

const ALLOWED = new Set<string>(POLLY_VOICES.map((v) => v.id));
export function isValidVoiceId(id: string): id is PollyVoiceId {
  return ALLOWED.has(id);
}

let client: PollyClient | null = null;
export function getPollyClient(): PollyClient {
  if (!client) {
    client = new PollyClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

export async function synthesizeSpeech(
  polly: PollyClient,
  text: string,
  voiceId: PollyVoiceId = DEFAULT_VOICE_ID,
): Promise<Uint8Array> {
  const response = await polly.send(
    new SynthesizeSpeechCommand({ Text: text, VoiceId: voiceId, OutputFormat: "mp3", Engine: "neural" }),
  );
  if (!response.AudioStream) throw new Error("No audio stream in Polly response");
  return response.AudioStream.transformToByteArray();
}
