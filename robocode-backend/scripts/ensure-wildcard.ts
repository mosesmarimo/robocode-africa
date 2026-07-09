/**
 * One-time (idempotent) script to point a domain's wildcard DNS record
 * (`*.<domain>`) at the app ingress, via the same `GoDaddyService` the
 * publish feature (`src/modules/publish`) uses at runtime.
 *
 * Today only `*.robocode.studio` needs this — `*.robocode.africa` already
 * has a wildcard record serving white-label tenant subdomains. See
 * docs/publish-ops.md for the full runbook.
 *
 * Usage:
 *   npx tsx scripts/ensure-wildcard.ts               # defaults to robocode.studio
 *   npx tsx scripts/ensure-wildcard.ts some-other.tld # or pass a domain explicitly
 *
 * Safety:
 *  - With GODADDY_API_KEY/GODADDY_API_SECRET unset (the default — see
 *    .env.example), this makes ZERO network calls: GoDaddyService.isLive()
 *    is false, so ensureWildcard() logs its intent and returns immediately.
 *    Mirrors the RUN_SANDBOX_DISABLED-style "off by default" convention used
 *    elsewhere in this repo.
 *  - Safe to run repeatedly once live: ensureWildcard() checks the existing
 *    record first and only PUTs when it's absent or different.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GoDaddyService, type DnsRecordType } from "../src/modules/publish/godaddy.service";

/**
 * Populate process.env from a `.env` file in the current working directory,
 * without overriding vars already set in the shell (same precedence as
 * dotenv's default `override: false`). This repo doesn't depend on the
 * `dotenv` package directly (it's only a transitive dep of @nestjs/config,
 * used by the Nest app itself via ConfigModule.forRoot) — standalone scripts
 * outside the Nest app follow the hand-rolled fallback already used by
 * `prisma/seed.ts` (see its `deepseekKey()` helper) rather than importing a
 * package that isn't a direct dependency.
 */
function loadDotEnvFallback(): void {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key || key in process.env) continue; // shell-exported values win
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function main() {
  loadDotEnvFallback();

  const domain = process.argv[2]?.trim() || "robocode.studio";
  const type: DnsRecordType = process.env.PUBLISH_TARGET_TYPE === "CNAME" ? "CNAME" : "A";
  const value = process.env.PUBLISH_TARGET_VALUE ?? "";
  const targetLabel = `${type} ${value || "(PUBLISH_TARGET_VALUE not set)"}`;

  const godaddy = new GoDaddyService();

  if (!godaddy.isLive()) {
    // ensureWildcard() itself no-ops here (zero network calls) — calling it
    // anyway keeps this script's behavior identical to the app's, and this
    // check just lets us print a clear one-line summary.
    await godaddy.ensureWildcard(domain, { type, value });
    console.log(`DRY RUN (set GODADDY_API_KEY/SECRET to go live) — would create *.${domain} -> ${targetLabel}`);
    return;
  }

  if (!value) {
    console.error(
      "GODADDY_API_KEY/SECRET are set (live mode) but PUBLISH_TARGET_VALUE is empty. " +
        "Set PUBLISH_TARGET_VALUE to the ingress IP (PUBLISH_TARGET_TYPE=A) or a CNAME target " +
        "(PUBLISH_TARGET_TYPE=CNAME) before running this script — refusing to PUT an empty record.",
    );
    process.exit(1);
    return;
  }

  try {
    const result = await godaddy.ensureWildcard(domain, { type, value });
    if (result.changed) {
      console.log(`LIVE — created/updated *.${domain} -> ${targetLabel}`);
    } else {
      console.log(`LIVE — *.${domain} -> ${targetLabel} already correct, no change made.`);
    }
  } catch (e) {
    console.error(`Failed to ensure wildcard for *.${domain}: ${(e as Error).message}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
