import "server-only";
import { cookies } from "next/headers";

/** Captures a `?ref=CODE` from a `/join` link until the visitor signs up. */
export const REF_COOKIE = "rc_ref";

// Matches the backend's studentSignup `ref` field (`z.string().max(16)`).
const MAX_LEN = 16;

/** Read the pending referral code, if any (Server Components or Server Functions). */
export async function getRefCookie(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(REF_COOKIE)?.value;
  return value ? value.slice(0, MAX_LEN) : null;
}

/** Stash a referral code for 30 days (Server Functions / Route Handlers only). */
export async function setRefCookie(code: string) {
  const jar = await cookies();
  jar.set(REF_COOKIE, code.slice(0, MAX_LEN), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Clear the pending referral code once it's been captured by a signup. */
export async function clearRefCookie() {
  const jar = await cookies();
  jar.delete(REF_COOKIE);
}
