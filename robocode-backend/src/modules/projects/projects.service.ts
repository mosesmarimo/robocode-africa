import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { PointsService } from "../../common/points.service";
import { isStaff } from "../../domain/roles";
import { POINTS } from "../../domain/constants";
import type { AuthUser } from "../../auth/auth-user.type";
import type { CreateProjectInput, SaveProjectInput, FileInput } from "./dto";

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
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
    const [projects, templates] = await Promise.all([
      this.prisma.project.findMany({
        where: { ownerId: user.id },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.project.findMany({
        where: {
          isTemplate: true,
          OR: [{ visibility: "public" }, { tenantId: user.tenantId }],
        },
        take: 6,
      }),
    ]);

    return { projects, templates };
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

    const owner = project.ownerId === user.id;
    const staffSameTenant = isStaff(user.role) && project.tenantId === user.tenantId;
    const sharedInTenant =
      project.visibility !== "private" && project.tenantId === user.tenantId;
    const isPublic = project.visibility === "public";
    if (!(owner || staffSameTenant || sharedInTenant || isPublic)) {
      throw new NotFoundException("NOT_FOUND");
    }

    return { project };
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
   */
  private async persistFiles(projectId: string, files: FileInput[]) {
    for (const f of files) {
      if (f.name === "diagram.json") continue; // synthetic/derived tab
      const existing = await this.prisma.codeFile.findFirst({
        where: { projectId, filename: f.name },
      });
      if (existing) {
        await this.prisma.codeFile.update({
          where: { id: existing.id },
          data: { content: f.content, language: f.language },
        });
      } else {
        await this.prisma.codeFile.create({
          data: { projectId, filename: f.name, language: f.language, content: f.content },
        });
      }
    }
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
      },
    });
    await this.persistFiles(project.id, input.files);
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
    return { ok: true, projectId: project.id, redirect: `/studio/${project.id}` };
  }

  /**
   * Record a simulation run and award first-simulation points + the
   * "blink-master" badge (idempotent). Mirrors `recordSimulationRun`.
   */
  async recordSimulationRun(user: AuthUser, projectId: string) {
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
}
