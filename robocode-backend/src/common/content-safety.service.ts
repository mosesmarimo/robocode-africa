import { Injectable } from "@nestjs/common";

/**
 * Lightweight, synchronous content safety filter for all user-generated text
 * (team chat, social posts, comments). Promoted out of teams.service.ts so every
 * surface shares one implementation. Blocks basic profanity and PII (emails /
 * phone numbers) — the latter is a safeguarding requirement for a minor-facing
 * platform (no swapping contact details to move off-platform).
 *
 * This is intentionally conservative and cheap. Blocked content is still
 * persisted (status = "blocked") so a moderation case can be opened and staff
 * can audit it; it is just hidden from other users.
 */

const BANNED_WORDS = [
  "idiot",
  "stupid",
  "dumb",
  "hate",
  "kill",
  "die",
  "ugly",
  "loser",
  "shut up",
  "crap",
  "damn",
  "hell",
  "bastard",
  "moron",
  "freak",
];

// Email pattern: something@something.tld
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
// Phone: 7+ consecutive digits (with optional separators)
const PHONE_RE = /(\+?\d[\s\-.]?){7,}/;

export type SafetyVerdict = "clean" | "blocked";

@Injectable()
export class ContentSafetyService {
  /** Returns "clean" or "blocked" for a piece of user text. */
  check(body: string): SafetyVerdict {
    const lower = body.toLowerCase();
    for (const word of BANNED_WORDS) {
      // word-boundary aware: the word surrounded by non-alpha or string ends
      if (new RegExp(`(?<![a-z])${word}(?![a-z])`, "i").test(lower)) {
        return "blocked";
      }
    }
    if (EMAIL_RE.test(body) || PHONE_RE.test(body)) {
      return "blocked";
    }
    return "clean";
  }
}
