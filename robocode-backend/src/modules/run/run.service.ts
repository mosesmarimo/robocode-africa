import { Injectable, Logger } from "@nestjs/common";
import { SandboxService, type SandboxFile } from "./sandbox.service";
import type { RunLanguage, RunOutcome } from "./dto";
import type { AuthUser } from "../../auth/auth-user.type";

/** Thrown when a user exceeds the per-user run rate limit; the controller maps this to HTTP 429. */
export class RateLimitExceededError extends Error {}

const MAX_CONCURRENT_RUNS = 2;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

/**
 * A tiny counting semaphore. `acquire()` resolves immediately while under
 * `max`; once at capacity, callers queue on a FIFO of resolvers and are
 * handed the slot (not decremented-then-incremented — the count never drops
 * below `max` while anyone is waiting) as earlier holders `release()`.
 */
class Semaphore {
  private active = 0;
  private readonly waiters: Array<() => void> = [];

  constructor(private readonly max: number) {}

  acquire(): Promise<void> {
    if (this.active < this.max) {
      this.active++;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.waiters.push(resolve));
  }

  release(): void {
    const next = this.waiters.shift();
    if (next) {
      // Hand the slot directly to the next waiter; `active` is unchanged.
      next();
    } else {
      this.active--;
    }
  }
}

/** Per-key sliding-window rate limiter, in-memory (single-process; fine for this scale). */
class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  /** Returns true and records a hit if under the limit; returns false (no hit recorded) if over. */
  tryHit(key: string): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const existing = this.hits.get(key)?.filter((t) => t > cutoff) ?? [];
    if (existing.length >= this.max) {
      this.hits.set(key, existing);
      return false;
    }
    existing.push(now);
    this.hits.set(key, existing);
    return true;
  }
}

@Injectable()
export class RunService {
  private readonly logger = new Logger(RunService.name);
  private readonly semaphore = new Semaphore(MAX_CONCURRENT_RUNS);
  private readonly rateLimiter = new SlidingWindowRateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);

  constructor(private readonly sandbox: SandboxService) {}

  async execute(user: AuthUser, language: RunLanguage, files: SandboxFile[], entry?: string): Promise<RunOutcome> {
    // Ops kill-switch: lets prod disable the server tier without a deploy
    // (e.g. Docker misbehaving on the host) — short-circuit before touching
    // the rate limiter, semaphore, or Docker so every request falls straight
    // back to the AI-simulated runner. See docs/sandbox-ops.md.
    if (process.env.RUN_SANDBOX_DISABLED === "1" || process.env.RUN_SANDBOX_DISABLED === "true") {
      return { ok: false, configured: false, output: "", error: true, engine: "server", durationMs: 0, text: "Server runner disabled." };
    }

    if (!this.rateLimiter.tryHit(user.id)) {
      throw new RateLimitExceededError("Too many runs — wait a moment and try again.");
    }

    const start = Date.now();
    await this.semaphore.acquire();
    try {
      const result = await this.sandbox.run(language, files, entry);
      return {
        ok: true,
        configured: true,
        output: result.output,
        error: result.error,
        engine: "server",
        durationMs: result.durationMs,
      };
    } catch (e) {
      // Docker missing (ENOENT) or any other spawn-time failure: tell the
      // frontend the server runner isn't configured so it can fall back to
      // the AI-simulated runner instead of showing a hard error.
      this.logger.warn(`sandbox run failed, falling back: ${(e as Error).message}`);
      return {
        ok: false,
        configured: false,
        output: "",
        error: true,
        engine: "server",
        durationMs: Date.now() - start,
        text: "Server runner unavailable.",
      };
    } finally {
      this.semaphore.release();
    }
  }
}
