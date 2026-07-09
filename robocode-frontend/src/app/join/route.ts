import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { setRefCookie } from "@/lib/referrals/ref-cookie";

/**
 * Invite-link landing: `/join?ref=CODE` from a referrer's share link or
 * `navigator.share`. Cookies can only be *set* from a Server Function or Route
 * Handler (not a Server Component render), so this is a Route Handler rather
 * than a page — it stashes the code for 30 days and hands off to signup,
 * which reads it back to show the "invited by a friend" banner and to credit
 * the referral once the account is approved.
 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (ref) await setRefCookie(ref);
  redirect("/signup");
}
