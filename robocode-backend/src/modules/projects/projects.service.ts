import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { PrismaService } from "../../prisma/prisma.service";
import { PointsService } from "../../common/points.service";
import { NotifyService } from "../../common/notify.service";
import { AiService } from "../ai/ai.service";
import { isStaff } from "../../domain/roles";
import { POINTS } from "../../domain/constants";
import type { AuthUser } from "../../auth/auth-user.type";
import type { CreateProjectInput, SaveProjectInput, FileInput } from "./dto";

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
    private readonly notify: NotifyService,
    private readonly ai: AiService,
  ) {}

  // ---------------------------------------------------------------------------
  // Reads (port of the RSC pages' direct Prisma queries)
  // ---------------------------------------------------------------------------

  /**
   * Projects landing page data: the current user's projects (most recent first)
   * plus a handful of starter templates visible to them (public or their
   * tenant's). Mirrors `app/projects/page.tsx`.
   */
  async listProjects(user: AuthUser) {
    const [projects, templates, codingTemplates] = await Promise.all([
      this.prisma.project.findMany({
        where: { ownerId: user.id },
        orderBy: { updatedAt: "desc" },
        // Bound the list and omit the heavy `diagram` JSON — the landing page
        // only needs these summary fields.
        take: 60,
        select: {
          id: true,
          title: true,
          description: true,
          kind: true,
          boardType: true,
          thumbnail: true,
          visibility: true,
          isTemplate: true,
          updatedAt: true,
        },
      }),
      this.prisma.project.findMany({
        where: {
          isTemplate: true,
          kind: { not: "coding" },
          OR: [{ visibility: "public" }, { tenantId: user.tenantId }],
        },
        // Was `take: 6` — too small to show 5+ starter templates per board (Uno/ESP32/
        // Pico) once the full set exists (see prisma/seed-robotics-templates.ts). Ordered
        // by board then title so the per-board grouping in the UI is stable.
        orderBy: [{ boardType: "asc" }, { title: "asc" }],
        take: 60,
        select: {
          id: true,
          title: true,
          description: true,
          kind: true,
          boardType: true,
          thumbnail: true,
          visibility: true,
          isTemplate: true,
          updatedAt: true,
        },
      }),
      this.prisma.project.findMany({
        where: {
          isTemplate: true,
          kind: "coding",
          OR: [{ visibility: "public" }, { tenantId: user.tenantId }],
        },
        orderBy: { title: "asc" },
        take: 60,
        select: {
          id: true,
          title: true,
          description: true,
          kind: true,
          // first file → lets the UI label the language
          codeFiles: { select: { filename: true }, take: 1 },
        },
      }),
    ]);

    return { projects, templates, codingTemplates };
  }

  /**
   * Load a project for the Studio: the project + its code files, enforcing read
   * access (owner, staff in same tenant, shared in tenant, or public). Mirrors
   * the visibility gate in `studio/[projectId]/page.tsx`.
   */
  async getProject(user: AuthUser, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { codeFiles: true },
    });
    if (!project) throw new NotFoundException("NOT_FOUND");
    if (!this.canRead(user, project)) throw new NotFoundException("NOT_FOUND");

    return { project };
  }

  /**
   * Read access: owner, staff in the same tenant, shared-in-tenant
   * (`visibility !== "private"` and same tenant), or fully public. Used
   * directly by `getProject` (404s on failure, to avoid leaking existence of
   * private projects) and as the base case for `canRemix` (which additionally
   * allows a share-linked or published project — see there).
   */
  private canRead(
    user: AuthUser,
    project: { ownerId: string; tenantId: string; visibility: string },
  ): boolean {
    const owner = project.ownerId === user.id;
    const staffSameTenant = isStaff(user.role) && project.tenantId === user.tenantId;
    const sharedInTenant = project.visibility !== "private" && project.tenantId === user.tenantId;
    const isPublic = project.visibility === "public";
    return owner || staffSameTenant || sharedInTenant || isPublic;
  }

  // ---------------------------------------------------------------------------
  // Mutations (port of `lib/studio/actions.ts`)
  // ---------------------------------------------------------------------------

  /**
   * Editing rights: the owner, or staff within the same tenant. Mirrors the old
   * `canEdit` helper (throws FORBIDDEN otherwise).
   */
  private canEdit(user: AuthUser, projectOwnerId: string, projectTenantId: string) {
    if (user.id === projectOwnerId) return;
    if (isStaff(user.role) && user.tenantId === projectTenantId) return;
    throw new ForbiddenException("FORBIDDEN");
  }

  /**
   * Persist editor files: upsert each by (projectId, filename), skipping the
   * synthetic/derived "diagram.json" tab. Mirrors the old `persistFiles`.
   *
   * Batched: fetch all of the project's existing files in one query, then run
   * every update/create in a single transaction. This collapses the old 2N
   * sequential round-trips (a findFirst + update/create per file) into one read
   * plus one atomic batch, so a partial failure can't leave files half-saved.
   */
  private async persistFiles(projectId: string, files: FileInput[]) {
    const toSave = files.filter((f) => f.name !== "diagram.json"); // skip synthetic tab
    if (toSave.length === 0) return;

    const existingFiles = await this.prisma.codeFile.findMany({
      where: { projectId },
      select: { id: true, filename: true },
    });
    const existingByName = new Map(existingFiles.map((e) => [e.filename, e.id]));

    const ops = toSave.map((f) => {
      const id = existingByName.get(f.name);
      return id
        ? this.prisma.codeFile.update({
            where: { id },
            data: { content: f.content, language: f.language },
          })
        : this.prisma.codeFile.create({
            data: { projectId, filename: f.name, language: f.language, content: f.content },
          });
    });

    await this.prisma.$transaction(ops);
  }

  /** Save an existing project (title/board/diagram + files). Mirrors `saveProject`. */
  async saveProject(user: AuthUser, projectId: string, input: SaveProjectInput) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException("NOT_FOUND");
    this.canEdit(user, project.ownerId, project.tenantId);

    await this.prisma.project.update({
      where: { id: project.id },
      data: {
        title: input.title,
        boardType: input.board,
        diagram: input.diagram as Prisma.InputJsonValue,
        ...(input.kind ? { kind: input.kind } : {}),
      },
    });
    await this.persistFiles(project.id, input.files);
    this.autoRank(user, project.id); // background AI rank on save
    return { ok: true };
  }

  /**
   * Create a project, seed it with the given files (or a starter sketch),
   * award create points + the "first-steps" badge. Mirrors `createProject`.
   */
  async createProject(user: AuthUser, input: CreateProjectInput) {
    const project = await this.prisma.project.create({
      data: {
        ownerId: user.id,
        tenantId: user.tenantId,
        title: input.title || "Untitled Project",
        kind: input.kind ?? "robotics",
        boardType: input.board,
        diagram: input.diagram as Prisma.InputJsonValue,
        visibility: "private",
      },
    });
    await this.persistFiles(
      project.id,
      input.files.length
        ? input.files
        : [{ name: "sketch.ino", language: "arduino", content: "" }],
    );
    await this.points.awardPoints({
      userId: user.id,
      delta: POINTS.PROJECT_CREATE,
      reason: "Created a project",
      refType: "project",
      refId: project.id,
      idemKey: `proj-create-${project.id}`,
    });
    await this.points.awardBadge(user.id, "first-steps");
    this.autoRank(user, project.id); // background AI rank on create
    return { ok: true, projectId: project.id, redirect: `/studio/${project.id}` };
  }

  /**
   * Record a simulation run and award first-simulation points + the
   * "blink-master" badge (idempotent). Mirrors `recordSimulationRun`.
   */
  async recordSimulationRun(user: AuthUser, projectId: string) {
    // Verify the caller may edit this project before recording a run (prevents
    // cross-tenant pollution + points farming against arbitrary project ids).
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException("NOT_FOUND");
    this.canEdit(user, project.ownerId, project.tenantId);

    await this.prisma.simulationRun.create({ data: { projectId, status: "ok" } });
    await this.points.awardPoints({
      userId: user.id,
      delta: POINTS.FIRST_SIMULATION,
      reason: "First simulation",
      refType: "project",
      refId: projectId,
      idemKey: `first-sim-${user.id}`,
    });
    await this.points.awardBadge(user.id, "blink-master");
    return { ok: true };
  }

  /**
   * Remix authorization: `canRead` (owner, staff-in-tenant, tenant-shared, or
   * public) PLUS the two other ways a project is legitimately reachable for
   * remixing even while `visibility: "private"` (the default — there is no UI
   * to flip it to "public"):
   *   - it has an active read-only share link (`shareId != null`) — this is
   *     the only path that reaches `readonly-studio-app.tsx`'s "Remix in
   *     Studio" button, so without this check remix 403s almost every time; or
   *   - it's published to a subdomain (`subdomain` + `publishDomain` both set).
   * A purely-private, unshared, unpublished project the caller doesn't own
   * still correctly 403s — there's nothing shared to remix.
   */
  private canRemix(
    user: AuthUser,
    project: {
      ownerId: string;
      tenantId: string;
      visibility: string;
      shareId: string | null;
      subdomain: string | null;
      publishDomain: string | null;
    },
  ): boolean {
    if (this.canRead(user, project)) return true;
    if (project.shareId != null) return true;
    if (project.subdomain != null && project.publishDomain != null) return true;
    return false;
  }

  /**
   * Remix ("Open in Studio" from a shared/public project or share link):
   * clone a project the caller can read or that is shared/published (see
   * `canRemix`) into a brand-new project they own, copying
   * title/files/diagram/board and tagging it with `remixedFromId`. Rewards
   * the ORIGINAL author (never the remixer) +10 RoboPoints, idempotently per
   * remixer (`remix:<sourceId>:<remixerId>`) so a second remix of the same
   * source by the same user doesn't re-pay — and the notification is
   * likewise only sent the first time (checked against the same idemKey
   * before awarding), so a repeat remix never sends a misleading "+10
   * RoboPoints!" message for a reward that didn't happen. Skipped entirely
   * when remixing your own project — no self-payout, no "your project was
   * remixed" notification about yourself.
   */
  async remix(user: AuthUser, sourceId: string): Promise<{ id: string }> {
    const source = await this.prisma.project.findUnique({
      where: { id: sourceId },
      include: { codeFiles: true },
    });
    if (!source) throw new NotFoundException("NOT_FOUND");
    if (!this.canRemix(user, source)) {
      throw new ForbiddenException("This project is private.");
    }

    const remixed = await this.prisma.project.create({
      data: {
        ownerId: user.id,
        tenantId: user.tenantId,
        title: `${source.title} (remix)`,
        kind: source.kind,
        boardType: source.boardType,
        diagram: source.diagram as Prisma.InputJsonValue,
        visibility: "private",
        remixedFromId: source.id,
      },
    });

    const files: FileInput[] = source.codeFiles.length
      ? source.codeFiles.map((f) => ({ name: f.filename, language: f.language, content: f.content }))
      : [{ name: "sketch.ino", language: "arduino", content: "" }];
    await this.persistFiles(remixed.id, files);

    if (source.ownerId !== user.id) {
      const idemKey = `remix:${sourceId}:${user.id}`;
      // Check before awarding so the notification only fires the first time
      // this remixer remixes this source — a repeat remix still creates a
      // new project, but must not re-notify a reward that awardPoints will
      // (correctly) no-op on.
      const alreadyRewarded = await this.prisma.roboPointLedger.findUnique({ where: { idemKey } });
      await this.points.awardPoints({
        userId: source.ownerId,
        delta: POINTS.PROJECT_REMIX_AUTHOR,
        reason: "Your project was remixed",
        refType: "project",
        refId: remixed.id,
        idemKey,
      });
      if (!alreadyRewarded) {
        await this.notify.notify({
          userId: source.ownerId,
          type: "remix",
          title: "Your project was remixed!",
          body: `${user.displayName} remixed "${source.title}" — +${POINTS.PROJECT_REMIX_AUTHOR} RoboPoints!`,
        });
      }
    }

    return { id: remixed.id };
  }

  // ---------------------------------------------------------------------------
  // Public sharing
  // ---------------------------------------------------------------------------

  /** Create (or return) a public read-only share link slug for a project. */
  async shareProject(user: AuthUser, projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException("NOT_FOUND");
    this.canEdit(user, project.ownerId, project.tenantId);
    let shareId = project.shareId;
    if (!shareId) {
      shareId = nanoid(12);
      await this.prisma.project.update({ where: { id: project.id }, data: { shareId } });
    }
    return { ok: true, shareId };
  }

  /**
   * Public, unauthenticated read-only view of a shared project (no owner/tenant
   * data). `id` IS included (unlike owner/tenant fields) — it's not sensitive
   * (just this project's primary key, same as any authenticated project view
   * exposes) and the web client needs it to call `POST /projects/:id/remix`
   * ("Remix in Studio" from the read-only share page).
   */
  async getSharedProject(shareId: string) {
    if (!shareId) throw new NotFoundException("NOT_FOUND");
    const project = await this.prisma.project.findUnique({
      where: { shareId },
      include: { codeFiles: true },
    });
    if (!project) throw new NotFoundException("NOT_FOUND");
    return {
      project: {
        id: project.id,
        title: project.title,
        boardType: project.boardType,
        diagram: project.diagram,
        codeFiles: project.codeFiles.map((f) => ({ filename: f.filename, language: f.language, content: f.content })),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // AI ranking + points
  // ---------------------------------------------------------------------------

  /** Auto-rank after a save: fire-and-forget so it never slows down or fails the
   * save. The AI score + leaderboard update a few seconds later in the background. */
  private autoRank(user: AuthUser, projectId: string) {
    void this.scoreProject(user, projectId).catch(() => {
      /* background ranking is best-effort */
    });
  }

  /** Score a project with AI (4 dimensions), store the rank, and award the owner
   * quality points (once per project). */
  async scoreProject(user: AuthUser, projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, include: { codeFiles: true } });
    if (!project) throw new NotFoundException("NOT_FOUND");
    this.canEdit(user, project.ownerId, project.tenantId);

    const code = project.codeFiles
      .filter((f) => f.filename !== "diagram.json")
      .map((f) => `// ${f.filename}\n${f.content}`)
      .join("\n\n");

    const r = await this.ai.scoreProject(user, {
      title: project.title,
      description: project.description,
      kind: project.kind,
      board: project.boardType,
      code,
    });
    if (!r.ok || !r.score) return { ok: false as const, error: r.text || "Couldn't rank this project." };

    await this.prisma.project.update({
      where: { id: project.id },
      data: { aiScore: r.score.overall, aiScoreData: r.score as unknown as Prisma.InputJsonValue, scoredAt: new Date() },
    });

    // Reward the owner for a well-built project (once; quality-scaled).
    const award = Math.max(5, Math.round(r.score.overall / 4));
    await this.points.awardPoints({
      userId: project.ownerId,
      delta: award,
      reason: "Project ranked by AI",
      refType: "project",
      refId: project.id,
      idemKey: `proj-score-${project.id}`,
    });
    await this.points.awardBadge(project.ownerId, "rising-star");

    return { ok: true as const, score: r.score, pointsAwarded: award };
  }

  /** Leaderboard: top AI-ranked projects visible to the user (public or same school). */
  async topProjects(user: AuthUser) {
    const projects = await this.prisma.project.findMany({
      where: {
        aiScore: { not: null },
        isTemplate: false,
        OR: [{ visibility: "public" }, { tenantId: user.tenantId }],
      },
      orderBy: { aiScore: "desc" },
      take: 25,
      select: {
        id: true,
        title: true,
        description: true,
        kind: true,
        boardType: true,
        aiScore: true,
        aiScoreData: true,
        visibility: true,
        owner: { select: { id: true, displayName: true, avatarSeed: true } },
      },
    });
    return { projects };
  }
}
