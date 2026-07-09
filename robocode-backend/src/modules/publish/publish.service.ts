import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { GoDaddyService } from "./godaddy.service";
import {
  PROFANITY_BLOCKLIST,
  PUBLISH_DOMAINS,
  PUBLISH_TARGET_TYPE,
  PUBLISH_TARGET_VALUE,
  RESERVED_SUBDOMAINS,
  SUBDOMAIN_NAME_RE,
} from "./constants";
import type { AuthUser } from "../../auth/auth-user.type";
import type { AvailabilityResult, PublishedProjectPayload } from "./dto";

/** Thrown when a user exceeds the per-user publish rate limit; the controller maps this to HTTP 429. */
export class PublishRateLimitError extends Error {}

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

/** Per-key sliding-window rate limiter, in-memory (mirrors run.service.ts's limiter). */
class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

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
export class PublishService {
  private readonly logger = new Logger(PublishService.name);
  private readonly rateLimiter = new SlidingWindowRateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);

  constructor(
    private readonly prisma: PrismaService,
    private readonly goDaddy: GoDaddyService,
  ) {}

  /** Domains a project may be published to (user picks one). */
  listDomains(): string[] {
    return PUBLISH_DOMAINS;
  }

  /** Format + reserved + profanity checks. Throws BadRequestException with a specific message on failure. */
  validateName(name: string): void {
    const n = (name ?? "").trim().toLowerCase();
    if (!SUBDOMAIN_NAME_RE.test(n)) {
      throw new BadRequestException(
        "Name must be 3-30 characters: lowercase letters, numbers, and hyphens, and can't start or end with a hyphen.",
      );
    }
    if (RESERVED_SUBDOMAINS.has(n)) {
      throw new BadRequestException("That name is reserved and can't be used.");
    }
    for (const bad of PROFANITY_BLOCKLIST) {
      if (n.includes(bad)) {
        throw new BadRequestException("That name isn't allowed — please choose another.");
      }
    }
  }

  /**
   * Format+reserved+profanity+not-taken(+not-a-school-slug-on-africa). Never
   * throws — validateName's exceptions are caught and surfaced as `reason`.
   */
  async checkAvailability(domain: string, name: string): Promise<AvailabilityResult> {
    const n = (name ?? "").trim().toLowerCase();

    if (!PUBLISH_DOMAINS.includes(domain)) {
      return { available: false, reason: "unsupported-domain" };
    }

    try {
      this.validateName(n);
    } catch (e) {
      return { available: false, reason: e instanceof Error ? e.message : "invalid-name" };
    }

    const taken = await this.prisma.project.findUnique({
      where: { publishDomain_subdomain: { publishDomain: domain, subdomain: n } },
      select: { id: true },
    });
    if (taken) {
      return { available: false, reason: "taken" };
    }

    // On robocode.africa, school TENANTS win — a published name can't collide
    // with an existing school's slug (e.g. springfield.robocode.africa is the
    // school, not up for grabs by a project).
    if (domain === "robocode.africa") {
      const tenant = await this.prisma.tenant.findUnique({ where: { slug: n }, select: { id: true } });
      if (tenant) {
        return { available: false, reason: "reserved-by-a-school" };
      }
    }

    return { available: true };
  }

  /**
   * Publish a project to `<subdomain>.<domain>`: owner-only, forces
   * visibility public, best-effort wildcard DNS (a DNS hiccup never fails the
   * publish). Rate-limited to 5/min/user.
   */
  async publish(user: AuthUser, projectId: string, domain: string, subdomain: string): Promise<{ url: string }> {
    if (!this.rateLimiter.tryHit(user.id)) {
      throw new PublishRateLimitError("Too many publish attempts — wait a moment and try again.");
    }

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException("NOT_FOUND");
    if (project.ownerId !== user.id) throw new ForbiddenException("FORBIDDEN");

    const name = (subdomain ?? "").trim().toLowerCase();
    const availability = await this.checkAvailability(domain, name);
    if (!availability.available) {
      throw new BadRequestException(availability.reason ?? "not-available");
    }

    try {
      await this.prisma.project.update({
        where: { id: project.id },
        data: {
          subdomain: name,
          publishDomain: domain,
          publishedAt: new Date(),
          visibility: "public",
        },
      });
    } catch (e) {
      // The earlier checkAvailability read can race with a concurrent publish
      // of the same (publishDomain, subdomain) pair; the DB's unique
      // constraint is the real guard, so surface its violation as a friendly
      // 400 instead of an uncaught 500.
      if (e && typeof e === "object" && (e as { code?: string }).code === "P2002") {
        throw new BadRequestException("That name was just taken — try another.");
      }
      throw e;
    }

    try {
      await this.goDaddy.ensureWildcard(domain, { type: PUBLISH_TARGET_TYPE, value: PUBLISH_TARGET_VALUE });
    } catch (e) {
      // Best-effort: DNS is reconciled later; a hiccup here must never fail publish.
      this.logger.warn(`ensureWildcard failed for ${domain}: ${(e as Error).message}`);
    }

    return { url: `https://${name}.${domain}` };
  }

  /**
   * Unpublish: owner-only, clears the three publish fields (frees the name)
   * AND reverts visibility to private — publish() is the only path that ever
   * sets visibility="public", so leaving it public here would keep the
   * project readable platform-wide by id and on the owner's public profile.
   * A separately-created shareId link is left untouched (it's an independent
   * sharing mechanism the owner controls on their own).
   */
  async unpublish(user: AuthUser, projectId: string): Promise<{ ok: true }> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException("NOT_FOUND");
    if (project.ownerId !== user.id) throw new ForbiddenException("FORBIDDEN");

    await this.prisma.project.update({
      where: { id: project.id },
      data: { subdomain: null, publishDomain: null, publishedAt: null, visibility: "private" },
    });
    return { ok: true };
  }

  /** Public, unauthenticated render payload for a published project — NO email/PII. */
  async resolvePublished(domain: string, subdomain: string): Promise<PublishedProjectPayload> {
    if (!PUBLISH_DOMAINS.includes(domain)) throw new NotFoundException("NOT_FOUND");
    const name = (subdomain ?? "").trim().toLowerCase();
    const project = await this.prisma.project.findFirst({
      where: { publishDomain: domain, subdomain: name, visibility: "public" },
      include: {
        owner: { select: { displayName: true, referralCode: true } },
        codeFiles: true,
      },
    });
    if (!project) throw new NotFoundException("NOT_FOUND");

    return {
      title: project.title,
      kind: project.kind,
      boardType: project.boardType,
      diagram: project.diagram,
      files: project.codeFiles.map((f) => ({ name: f.filename, content: f.content })),
      ownerDisplayName: project.owner.displayName,
      ownerReferralCode: project.owner.referralCode,
      updatedAt: project.updatedAt,
    };
  }

  /** Admin/mod takedown: clears the publish fields + opens a resolved ModerationCase for audit. */
  async takedown(domain: string, subdomain: string, actor: AuthUser, reason: string): Promise<{ ok: true }> {
    if (!PUBLISH_DOMAINS.includes(domain)) throw new BadRequestException("Unsupported publish domain.");
    const name = (subdomain ?? "").trim().toLowerCase();
    const project = await this.prisma.project.findFirst({
      where: { publishDomain: domain, subdomain: name },
    });
    if (!project) throw new NotFoundException("NOT_FOUND");

    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id: project.id },
        data: { subdomain: null, publishDomain: null, publishedAt: null, visibility: "private" },
      }),
      this.prisma.moderationCase.create({
        data: {
          tenantId: project.tenantId,
          reporterId: actor.id,
          targetType: "Project",
          targetId: project.id,
          reason,
          status: "resolved",
          resolvedById: actor.id,
        },
      }),
    ]);

    return { ok: true };
  }
}
