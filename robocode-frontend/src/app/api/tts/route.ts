import { cookies, headers } from "next/headers";
import { SESSION_COOKIE } from "@/lib/api/client";

const BASE = process.env.BACKEND_URL ?? "http://localhost:4000";

/** Proxy TTS to the backend (AWS Polly), forwarding the session, returning mp3. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { text?: string; voice?: string };
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const h = await headers();

  const out: Record<string, string> = { "content-type": "application/json" };
  if (token) out.authorization = `Bearer ${token}`;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) out["x-forwarded-host"] = host;
  const tenant = h.get("x-tenant");
  if (tenant) out["x-tenant"] = tenant;
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip");
  if (ip) out["x-forwarded-for"] = ip;

  const res = await fetch(`${BASE}/tts`, {
    method: "POST",
    headers: out,
    body: JSON.stringify({ text: body.text, voice: body.voice }),
    cache: "no-store",
  });
  if (!res.ok) {
    return new Response(await res.text().catch(() => "TTS failed"), { status: res.status });
  }
  const buf = await res.arrayBuffer();
  return new Response(buf, { status: 200, headers: { "content-type": "audio/mpeg", "cache-control": "no-store" } });
}
