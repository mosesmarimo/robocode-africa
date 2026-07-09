// Smoke test for GoDaddyService's dry-run safety. No test framework (repo
// convention): hand-rolled PASS/FAIL checks. Stubs global.fetch to throw so
// any accidental network call fails loudly, then asserts every mutating
// method returns { dryRun: true, changed: false } with creds unset AND that
// fetch was never invoked.
//
// Run: cd robocode-backend && npx tsx src/modules/publish/godaddy.smoke.ts
import { GoDaddyService } from "./godaddy.service";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
  }
}

async function main() {
  // Ensure creds are unset regardless of the shell's env (dry-run is the
  // scenario under test).
  delete process.env.GODADDY_API_KEY;
  delete process.env.GODADDY_API_SECRET;

  let fetchCalls = 0;
  const originalFetch = global.fetch;
  global.fetch = async (...args: unknown[]) => {
    fetchCalls++;
    throw new Error(`fetch should never be called in dry-run, but was called with: ${JSON.stringify(args)}`);
  };

  try {
    const godaddy = new GoDaddyService();

    check("(a) isLive() is false with creds unset", godaddy.isLive() === false);

    const wildcard = await godaddy.ensureWildcard("robocode.studio", { type: "A", value: "1.2.3.4" });
    check("(b) ensureWildcard returns dryRun:true", wildcard.dryRun === true, JSON.stringify(wildcard));
    check("(b) ensureWildcard returns changed:false", wildcard.changed === false, JSON.stringify(wildcard));

    const upsert = await godaddy.upsertRecord("robocode.studio", "A", "myproj", "1.2.3.4");
    check("(c) upsertRecord returns dryRun:true", upsert.dryRun === true, JSON.stringify(upsert));
    check("(c) upsertRecord returns changed:false", upsert.changed === false, JSON.stringify(upsert));

    const del = await godaddy.deleteRecord("robocode.studio", "A", "myproj");
    check("(d) deleteRecord returns dryRun:true", del.dryRun === true, JSON.stringify(del));
    check("(d) deleteRecord returns changed:false", del.changed === false, JSON.stringify(del));

    const record = await godaddy.getRecord("robocode.studio", "A", "myproj");
    check("(e) getRecord returns null in dry-run", record === null, JSON.stringify(record));

    check("(f) fetch was never invoked across all dry-run calls", fetchCalls === 0, `fetchCalls=${fetchCalls}`);

    // --- (g) isLive() flips true once both creds are set (does not itself call fetch) ---
    process.env.GODADDY_API_KEY = "test-key";
    process.env.GODADDY_API_SECRET = "test-secret";
    check("(g) isLive() is true once both creds are set", godaddy.isLive() === true);
    delete process.env.GODADDY_API_KEY;
    delete process.env.GODADDY_API_SECRET;
  } finally {
    global.fetch = originalFetch;
  }

  if (failures > 0) {
    console.log(`\n${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\nAll smoke checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
