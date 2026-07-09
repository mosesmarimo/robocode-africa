import { Controller, Get, Param } from "@nestjs/common";
import { TracksService } from "./tracks.service";
import { CurrentUser, RequireActive } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";

@Controller("tracks")
export class TracksController {
  constructor(private readonly tracks: TracksService) {}

  /** /app/tracks — published tracks with derived progress + certificate. */
  @RequireActive()
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.tracks.listTracks(user.id);
  }

  // NOTE: must be declared before ":slug" below, or Nest would match
  // "for-task" as a track slug.
  /** /app/challenges/[slug] post-pass nudge — tracks containing this task. */
  @RequireActive()
  @Get("for-task/:taskId")
  forTask(@CurrentUser() user: AuthUser, @Param("taskId") taskId: string) {
    return this.tracks.getTracksForTask(user.id, taskId);
  }

  /** /app/tracks/[slug] — a single track's items with done/current state. */
  @RequireActive()
  @Get(":slug")
  getOne(@CurrentUser() user: AuthUser, @Param("slug") slug: string) {
    return this.tracks.getTrack(user.id, slug);
  }
}
