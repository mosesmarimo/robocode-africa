import { Injectable, Logger } from "@nestjs/common";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import * as tarStream from "tar-stream";
import type { RunLanguage } from "./dto";

export interface SandboxFile {
  name: string;
  content: string;
}

export interface SandboxRunResult {
  output: string;
  error: boolean;
  durationMs: number;
}

interface ImageSpec {
  /** Docker image tag built by sandbox/build-images.sh (Task 3). */
  image: string;
  /** --memory value. */
  mem: string;
  /** Wall-clock budget in ms before we `docker kill` the container. */
  wallMs: number;
}

/**
 * Which image / resource envelope each language runs under. cpp/python/
 * javascript/typescript/sql share the lightweight Alpine base image; go gets
 * its own (Go toolchain) image at the same envelope; rust/csharp compile
 * slower and get a larger memory/time budget.
 */
export const IMAGE_BY_LANG: Record<RunLanguage, ImageSpec> = {
  cpp: { image: "robocode-sandbox-base", mem: "256m", wallMs: 10_000 },
  python: { image: "robocode-sandbox-base", mem: "256m", wallMs: 10_000 },
  javascript: { image: "robocode-sandbox-base", mem: "256m", wallMs: 10_000 },
  typescript: { image: "robocode-sandbox-base", mem: "256m", wallMs: 10_000 },
  sql: { image: "robocode-sandbox-base", mem: "256m", wallMs: 10_000 },
  go: { image: "robocode-sandbox-go", mem: "256m", wallMs: 10_000 },
  rust: { image: "robocode-sandbox-rust", mem: "512m", wallMs: 20_000 },
  csharp: { image: "robocode-sandbox-csharp", mem: "512m", wallMs: 20_000 },
};

const OUTPUT_CAP = 64_000;

/**
 * Spawns a single jailed `docker run` per code execution. See
 * `sandbox/README.md` (Task 3) for why every flag below is load-bearing —
 * in particular the tmpfs `uid=65534,gid=65534,mode=1777`, without which
 * `tar -xf -` in run.sh fails with Permission denied under the unprivileged
 * user.
 *
 * No shell is ever invoked: `spawn("docker", [...argv])` passes each argument
 * as a discrete array element, so file/entry names can never be interpreted
 * as additional flags or break out of their argument position, regardless of
 * their content (the Zod schema further restricts them to a safe charset
 * before they ever reach here).
 */
@Injectable()
export class SandboxService {
  private readonly logger = new Logger(SandboxService.name);

  /** Build an in-memory tar of the project files (no temp files on disk). */
  private buildTar(files: SandboxFile[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const pack = tarStream.pack();
      const chunks: Buffer[] = [];
      pack.on("data", (c: Buffer) => chunks.push(c));
      pack.on("end", () => resolve(Buffer.concat(chunks)));
      pack.on("error", reject);
      for (const f of files) {
        pack.entry({ name: f.name }, f.content, (err) => {
          if (err) pack.destroy(err);
        });
      }
      pack.finalize();
    });
  }

  async run(language: RunLanguage, files: SandboxFile[], entry?: string): Promise<SandboxRunResult> {
    const spec = IMAGE_BY_LANG[language];
    if (!spec) throw new Error(`unsupported language: ${language}`);
    const entryName = entry || files[0]?.name;
    if (!entryName) throw new Error("no entry file provided");

    const tarBuffer = await this.buildTar(files);
    const containerName = `run-${randomUUID()}`;
    const args = [
      "run",
      "--rm",
      "-i",
      "--network=none",
      "--cap-drop=ALL",
      "--security-opt=no-new-privileges",
      "--user",
      "65534:65534",
      "--read-only",
      "--tmpfs",
      "/work:rw,exec,size=64m,uid=65534,gid=65534,mode=1777",
      "--tmpfs",
      "/tmp:rw,noexec,size=32m,uid=65534,gid=65534,mode=1777",
      "--pids-limit=128",
      "--cpus=1",
      `--memory=${spec.mem}`,
      "--name",
      containerName,
      spec.image,
      "/run.sh",
      language,
      entryName,
    ];

    const start = Date.now();

    return new Promise((resolve, reject) => {
      const child = spawn("docker", args, { stdio: ["pipe", "pipe", "pipe"] });

      let settled = false;
      let timedOut = false;
      const chunks: Buffer[] = [];
      let total = 0;
      let capped = false;

      const append = (buf: Buffer) => {
        if (capped) return;
        total += buf.length;
        if (total > OUTPUT_CAP) {
          const allowed = OUTPUT_CAP - (total - buf.length);
          if (allowed > 0) chunks.push(buf.subarray(0, allowed));
          chunks.push(Buffer.from("\n… output truncated"));
          capped = true;
          return;
        }
        chunks.push(buf);
      };

      child.stdout.on("data", append);
      child.stderr.on("data", append);
      // A dead/erroring stdin (e.g. the process already exited) must not crash
      // the process with an unhandled 'error' event — the 'close' handler
      // below still fires and resolves the promise either way.
      child.stdin.on("error", () => {});

      const timer = setTimeout(() => {
        timedOut = true;
        // Kill by container name, not by killing `child` — killing the
        // spawned `docker run` client process only detaches from the
        // container (it keeps running with --rm cleaning it up on its own
        // schedule, if ever); `docker kill <name>` is what actually stops it.
        const killer = spawn("docker", ["kill", containerName], { stdio: "ignore" });
        killer.on("error", (err) => this.logger.warn(`docker kill ${containerName} failed to spawn: ${err.message}`));
      }, spec.wallMs);

      child.on("error", (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });

      child.on("close", (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        const durationMs = Date.now() - start;
        let output = Buffer.concat(chunks).toString("utf8");
        let error = code !== 0;
        if (timedOut) {
          output = output ? `${output}\n⏱ exceeded time limit` : "⏱ exceeded time limit";
          error = true;
        } else if (code === 137) {
          output = output ? `${output}\n💥 ran out of memory` : "💥 ran out of memory";
          error = true;
        }
        resolve({ output, error, durationMs });
      });

      child.stdin.write(tarBuffer, () => {
        child.stdin.end();
      });
    });
  }
}
