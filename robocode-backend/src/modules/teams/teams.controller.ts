import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { TeamsService } from "./teams.service";
import { CurrentUser, RequireActive } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { ZodPipe } from "../../common/zod.pipe";
import {
  createTeamSchema,
  type CreateTeamInput,
  postMessageSchema,
  type PostMessageInput,
} from "./dto";

@Controller("teams")
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  // =========================================================================
  // READS — one per teams page
  // =========================================================================

  /** /app/teams — the user's teams + browsable teams in scope (tenant-scoped). */
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.teams.listTeams(user);
  }

  /** /app/teams/[id] — a single team with members, points, projects + chat. */
  @Get(":id")
  getOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.teams.getTeam(user, id);
  }

  // =========================================================================
  // MUTATIONS — one per old action function
  // =========================================================================

  /** createTeam — create a team; the creator becomes captain. */
  @RequireActive()
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(createTeamSchema)) body: CreateTeamInput,
  ) {
    return this.teams.createTeam(user, body.name, body.description);
  }

  /** joinTeam — join an existing team in your school. */
  @RequireActive()
  @Post(":id/join")
  join(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.teams.joinTeam(user, id);
  }

  /**
   * leaveTeam — leave a team. Also covers the inline "use server" action in the
   * old teams/[id] page (which simply called `leaveTeam(id)`).
   */
  @RequireActive()
  @Post(":id/leave")
  leave(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.teams.leaveTeam(user, id);
  }

  /** postMessage — post a chat message to a team (active members only). */
  @RequireActive()
  @Post(":id/messages")
  postMessage(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodPipe(postMessageSchema)) body: PostMessageInput,
  ) {
    return this.teams.postMessage(user, id, body.body);
  }
}
