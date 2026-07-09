// Headless smoke run for the jailed docker code runner. No test framework:
// hardcoded fixtures per language plus three security probes, exercising the
// real SandboxService (spawns real `docker run` processes — the Docker
// images from Task 3 must be built locally: robocode-sandbox-{base,go,rust,csharp}).
//
// Gated on Docker being present: if `docker` isn't on PATH, prints SKIP and
// exits 0 so CI/dev environments without Docker don't fail the build.
//
// Run: cd robocode-backend && npx tsx src/modules/run/smoke.ts
import { spawnSync } from "node:child_process";
import { SandboxService, IMAGE_BY_LANG, type SandboxFile, type SandboxRunResult } from "./sandbox.service";
import { runExecuteSchema, type RunLanguage } from "./dto";
import { RunService, RateLimitExceededError } from "./run.service";
import { gradeOutput } from "../../sim/grader";
import type { AuthUser } from "../../auth/auth-user.type";

let failures = 0;
function check(name: string, cond: boolean, detail: string) {
  if (cond) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}: ${detail}`);
  }
}

async function main() {
  // --- Kill-switch probe: RUN_SANDBOX_DISABLED short-circuits before Docker -
  // Runs regardless of whether Docker is installed (that's the point of the
  // kill-switch). Uses a SandboxService stand-in whose `run()` throws if ever
  // invoked, so a false negative (falling through to a real/fake Docker
  // spawn) fails loudly instead of silently passing.
  {
    class ThrowingSandboxService extends SandboxService {
      async run(): Promise<SandboxRunResult> {
        throw new Error("SandboxService.run() must not be called when RUN_SANDBOX_DISABLED is set");
      }
    }
    const disabledRunService = new RunService(new ThrowingSandboxService());
    const fakeUser = { id: "smoke-killswitch-user" } as unknown as AuthUser;
    const fakeFiles: SandboxFile[] = [{ name: "main.py", content: 'print("hi")\n' }];

    process.env.RUN_SANDBOX_DISABLED = "1";
    try {
      const run = await disabledRunService.execute(fakeUser, "python", fakeFiles);
      check(
        "kill-switch probe: configured=false, no Docker spawn",
        run.configured === false && run.ok === false && run.engine === "server",
        `configured=${run.configured} ok=${run.ok} text=${run.text}`,
      );
    } finally {
      delete process.env.RUN_SANDBOX_DISABLED;
    }
  }

  const probe = spawnSync("docker", ["--version"], { stdio: "ignore" });
  if (probe.error) {
    console.log("SKIP: docker not on PATH — server sandbox smoke skipped (Docker-independent checks above still count).");
    if (failures > 0) {
      console.log(`\n${failures} failure(s)`);
      process.exit(1);
    }
    process.exit(0);
  }

  const sandbox = new SandboxService();

  // --- Per-language hello-world -------------------------------------------
  const fixtures: { language: RunLanguage; files: SandboxFile[]; expect: string }[] = [
    { language: "python", files: [{ name: "main.py", content: 'print("hello-python")\n' }], expect: "hello-python" },
    { language: "javascript", files: [{ name: "main.js", content: 'console.log("hello-javascript");\n' }], expect: "hello-javascript" },
    {
      language: "typescript",
      files: [{ name: "main.ts", content: 'const s: string = "hello-typescript";\nconsole.log(s);\n' }],
      expect: "hello-typescript",
    },
    {
      language: "cpp",
      files: [{ name: "main.cpp", content: '#include <iostream>\nint main() { std::cout << "hello-cpp"; return 0; }\n' }],
      expect: "hello-cpp",
    },
    {
      language: "go",
      files: [{ name: "main.go", content: 'package main\nimport "fmt"\nfunc main() { fmt.Print("hello-go") }\n' }],
      expect: "hello-go",
    },
    { language: "rust", files: [{ name: "main.rs", content: 'fn main() { print!("hello-rust"); }\n' }], expect: "hello-rust" },
    {
      language: "csharp",
      files: [{ name: "main.cs", content: 'using System;\nclass P { static void Main() { Console.Write("hello-csharp"); } }\n' }],
      expect: "hello-csharp",
    },
    { language: "sql", files: [{ name: "main.sql", content: "SELECT 'hello-sql';\n" }], expect: "hello-sql" },
  ];

  for (const fx of fixtures) {
    try {
      const result = await sandbox.run(fx.language, fx.files);
      check(
        `${fx.language} hello-world`,
        !result.error && result.output.includes(fx.expect),
        `error=${result.error} durationMs=${result.durationMs} output=${JSON.stringify(result.output).slice(0, 400)}`,
      );
    } catch (e) {
      check(`${fx.language} hello-world`, false, `threw: ${(e as Error).message}`);
    }
  }

  // --- Security probe: timeout ---------------------------------------------
  // An infinite loop must be killed by our own wallMs timer (the container
  // does not self-terminate), and the probe must return within wallMs + slack
  // rather than hanging forever.
  {
    const wallMs = IMAGE_BY_LANG.python.wallMs;
    const start = Date.now();
    const result = await sandbox.run("python", [{ name: "main.py", content: "while True:\n    pass\n" }]);
    const elapsed = Date.now() - start;
    check("timeout probe: reported as error", result.error === true, `error=${result.error}`);
    check("timeout probe: exceeded message", /exceeded/i.test(result.output), `output=${JSON.stringify(result.output)}`);
    check("timeout probe: bounded duration", elapsed < wallMs + 5_000, `elapsed=${elapsed}ms wallMs=${wallMs}ms`);
  }

  // --- Security probe: pids-limit (fork bomb) -------------------------------
  // A fork bomb must hit --pids-limit=128 (fork() starts failing with
  // EAGAIN/OSError) rather than exhausting the host; the probe must still
  // return (bounded by wallMs at worst) rather than hang.
  {
    const wallMs = IMAGE_BY_LANG.python.wallMs;
    const forkBomb = [
      "import os, sys",
      "try:",
      "    while True:",
      "        os.fork()",
      "except Exception:",
      "    pass",
      "sys.exit(1)",
      "",
    ].join("\n");
    const start = Date.now();
    const result = await sandbox.run("python", [{ name: "main.py", content: forkBomb }]);
    const elapsed = Date.now() - start;
    check("pids probe: returned (didn't hang)", elapsed < wallMs + 5_000, `elapsed=${elapsed}ms wallMs=${wallMs}ms`);
    check("pids probe: reported as error", result.error === true, `error=${result.error} output=${JSON.stringify(result.output).slice(0, 300)}`);
  }

  // --- Security probe: network -----------------------------------------------
  // --network=none must block all outbound network access.
  {
    const netProbe = [
      "import urllib.request",
      "try:",
      "    urllib.request.urlopen('http://example.com', timeout=5)",
      "    print('NETWORK-REACHED')",
      "except Exception as e:",
      "    print('NETWORK-BLOCKED', e)",
      "",
    ].join("\n");
    const result = await sandbox.run("python", [{ name: "main.py", content: netProbe }]);
    check(
      "network probe: blocked",
      result.output.includes("NETWORK-BLOCKED") && !result.output.includes("NETWORK-REACHED"),
      `output=${JSON.stringify(result.output)}`,
    );
  }

  // --- Security probe: leading-hyphen filename rejected at the DTO layer ----
  // A file/entry name like `-hack.py` must never reach run.sh, where it could
  // be misread as a CLI flag by the toolchain (e.g. `python3 -hack.py`). The
  // Zod schema must reject it before the request ever reaches SandboxService.
  {
    const parsed = runExecuteSchema.safeParse({
      language: "python",
      files: [{ name: "-hack.py", content: 'print("should never run")\n' }],
      entry: "-hack.py",
    });
    check("DTO probe: leading-hyphen name rejected", !parsed.success, `success=${parsed.success}`);
  }

  // --- Security probe: entry must reference a provided file -----------------
  // `entry` pointing at a name absent from `files` must be rejected too —
  // otherwise it's an arbitrary attacker-controlled string handed straight to
  // the in-container toolchain as an argument.
  {
    const parsed = runExecuteSchema.safeParse({
      language: "python",
      files: [{ name: "main.py", content: 'print("hi")\n' }],
      entry: "other.py",
    });
    check("DTO probe: entry not in files rejected", !parsed.success, `success=${parsed.success}`);
  }

  // --- Grading integration: RunService.execute + gradeOutput (Task 7) -------
  // Exercises the same path CompetitionsService.submitSolution takes for a
  // coding-language challenge: run a submission through RunService (rate
  // limiter + semaphore + SandboxService), then grade the captured stdout
  // against task-style check rules, the same shape stored on Task.checks.
  {
    const runService = new RunService(sandbox);
    const fakeUser = { id: "smoke-grading-user" } as unknown as AuthUser;
    const code = 'print("hello-grading")\nprint(2 + 3)\n';
    const checks = {
      rules: [
        { type: "stdout_contains" as const, value: "hello-grading" },
        { type: "stdout_contains" as const, value: "5" },
      ],
    };
    const run = await runService.execute(fakeUser, "python", [{ name: "main.py", content: code }]);
    check("grading integration: sandbox configured", run.configured === true, `configured=${run.configured} text=${run.text}`);
    const runError = run.ok && !run.error ? undefined : (run.text || "Could not run your code.");
    const result = gradeOutput(run.output, checks, runError);
    check("grading integration: submission passes grading", result.passed === true, `result=${JSON.stringify(result)}`);
  }

  // --- Grading integration: rate-limit fallback (code review fix) ----------
  // Mirrors CompetitionsService.submitSolution's catch: when RunService.execute
  // throws RateLimitExceededError (the caller already spent their interactive
  // Studio "Run" budget), grading must catch *only* that error and fall back
  // to the AI runner instead of crashing the submission. Uses a fake
  // SandboxService (no real docker calls) so the 10-runs/60s window can be
  // exhausted quickly and deterministically, independent of the Docker probe
  // above.
  {
    class FakeSandboxService extends SandboxService {
      async run(): Promise<SandboxRunResult> {
        return { output: "fake-output", error: false, durationMs: 1 };
      }
    }
    const fakeRunService = new RunService(new FakeSandboxService());
    const fakeUser = { id: "smoke-ratelimit-user" } as unknown as AuthUser;
    const fakeFiles: SandboxFile[] = [{ name: "main.py", content: 'print("hi")\n' }];

    // Exhaust the 10-runs/60s window for this user.
    for (let i = 0; i < 10; i++) {
      await fakeRunService.execute(fakeUser, "python", fakeFiles);
    }

    // The 11th call within the window must throw RateLimitExceededError.
    let threw: unknown;
    try {
      await fakeRunService.execute(fakeUser, "python", fakeFiles);
    } catch (e) {
      threw = e;
    }
    check(
      "rate-limit probe: 11th run throws RateLimitExceededError",
      threw instanceof RateLimitExceededError,
      `threw=${threw}`,
    );

    // submitSolution's catch (mirrored here) must swallow *only* that error
    // and still produce a graded result via the AI-fallback path — never
    // rethrowing and never crashing the submission.
    let engine: "server" | "ai" | undefined;
    let rethrew = false;
    try {
      try {
        const run = await fakeRunService.execute(fakeUser, "python", fakeFiles);
        if (run.configured) engine = "server";
      } catch (err) {
        if (!(err instanceof RateLimitExceededError)) throw err;
        // Rate-limited: fall through to the AI-simulated runtime below.
      }
      if (engine !== "server") {
        engine = "ai"; // stand-in for `await this.ai.runCode(...)` — grading still completes.
      }
    } catch {
      rethrew = true;
    }
    check(
      "rate-limit probe: grading catch falls back to AI without rethrowing",
      !rethrew && engine === "ai",
      `rethrew=${rethrew} engine=${engine}`,
    );
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
