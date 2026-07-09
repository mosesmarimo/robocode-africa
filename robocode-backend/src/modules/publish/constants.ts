/** Domains a project may be published to, user's choice. Configurable via env
 * for staging/test, defaults to the two production domains. */
export const PUBLISH_DOMAINS: string[] = (
  process.env.PUBLISH_DOMAINS ?? "robocode.studio,robocode.africa"
)
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

/** DNS record the wildcard (`*.<domain>`) should point at — the ingress IP (A) or a CNAME target. */
export const PUBLISH_TARGET_TYPE: "A" | "CNAME" = process.env.PUBLISH_TARGET_TYPE === "CNAME" ? "CNAME" : "A";
export const PUBLISH_TARGET_VALUE: string = process.env.PUBLISH_TARGET_VALUE ?? "";

/** Subdomain name shape: DNS-label-safe, lowercase letters/digits/hyphens,
 * cannot start/end with a hyphen, 3–30 chars. */
export const SUBDOMAIN_NAME_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

/**
 * Names that must never be claimable as a published project subdomain —
 * platform infra hostnames, common auth/admin surfaces, and words that would
 * be confusing or impersonation-prone if squatted (school/teacher/etc).
 */
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "app",
  "admin",
  "administrator",
  "mail",
  "smtp",
  "ftp",
  "ns1",
  "ns2",
  "robocode",
  "robocodeafrica",
  "studio",
  "africa",
  "staging",
  "dev",
  "test",
  "assets",
  "static",
  "cdn",
  "docs",
  "help",
  "support",
  "status",
  "blog",
  "shop",
  "store",
  "billing",
  "pay",
  "payments",
  "login",
  "logout",
  "signup",
  "register",
  "auth",
  "account",
  "accounts",
  "dashboard",
  "portal",
  "school",
  "schools",
  "teacher",
  "teachers",
  "student",
  "students",
  "parent",
  "parents",
  "moderator",
  "moderators",
  "moderation",
  "root",
  "localhost",
  "null",
  "undefined",
]);

/**
 * Youth-safe profanity/safeguarding blocklist for public, kid-facing
 * <name>.robocode.* URLs. Matched as a SUBSTRING of the (hyphen-stripped)
 * candidate name — deliberately conservative for a minor-facing platform,
 * at the cost of occasionally rejecting an innocuous name that happens to
 * contain a blocked substring.
 */
export const PROFANITY_BLOCKLIST = new Set([
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "cunt",
  "dick",
  "piss",
  "cock",
  "pussy",
  "slut",
  "whore",
  "nigger",
  "nigga",
  "fag",
  "faggot",
  "retard",
  "rape",
  "porn",
  "nude",
  "naked",
  "hitler",
  "nazi",
  "suicide",
]);
