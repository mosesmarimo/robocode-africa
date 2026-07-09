import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { ZodPipe } from "../../common/zod.pipe";
import { RequireActive, CurrentUser, Public } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import {
  createProjectSchema,
  type CreateProjectInput,
  saveProjectSchema,
  type SaveProjectInput,
} from "./dto";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  // --- Reads ---------------------------------------------------------------

  /** Projects landing: the user's projects + visible starter templates. */
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.projects.listProjects(user);
  }

  /** Leaderboard: top AI-ranked projects. (Declared before :id so it isn't shadowed.) */
  @Get("top")
  top(@CurrentUser() user: AuthUser) {
    return this.projects.topProjects(user);
  }

  /** Load a project for the Studio (project + codeFiles), enforcing read access. */
  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.projects.getProject(user, id);
  }

  // --- Mutations -----------------------------------------------------------

  /** Create a project (awards points + badge). Mirrors `createProject`. */
  @RequireActive()
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(createProjectSchema)) body: CreateProjectInput,
  ) {
    return this.projects.createProject(user, body);
  }

  /** Save a project (owner or staff in same tenant). Mirrors `saveProject`. */
  @RequireActive()
  @Put(":id")
  save(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodPipe(saveProjectSchema)) body: SaveProjectInput,
  ) {
    return this.projects.saveProject(user, id, body);
  }

  /** Record a simulation run (awards points + badge). Mirrors `recordSimulationRun`. */
  @RequireActive()
  @Post(":id/simulation-run")
  simulationRun(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.projects.recordSimulationRun(user, id);
  }

  /** Create/return a public read-only share link slug (owner or staff in tenant). */
  @RequireActive()
  @Post(":id/share")
  share(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.projects.shareProject(user, id);
  }

  /** Remix a shared/public project into a new project owned by the caller (rewards + notifies the original author, once per remixer). */
  @RequireActive()
  @Post(":id/remix")
  remix(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.projects.remix(user, id);
  }

  /** Rank the project with AI (4 dimensions) + award quality points. */
  @RequireActive()
  @Post(":id/score")
  score(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.projects.scoreProject(user, id);
  }
}

/** Public, unauthenticated read-only access to shared projects. */
@Controller("public/projects")
export class PublicProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Public()
  @Get(":shareId")
  shared(@Param("shareId") shareId: string) {
    return this.projects.getSharedProject(shareId);
  }
}
