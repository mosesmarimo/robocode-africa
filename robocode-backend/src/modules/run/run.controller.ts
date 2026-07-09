import { Body, Controller, HttpException, HttpStatus, Post } from "@nestjs/common";
import { RunService, RateLimitExceededError } from "./run.service";
import { ZodPipe } from "../../common/zod.pipe";
import { RequireActive, CurrentUser } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { runExecuteSchema, type RunExecuteInput } from "./dto";

// JwtAuthGuard is registered globally (see app.module.ts) so every route here
// already requires authentication; RequireActive additionally blocks users
// pending approval / suspended from spending sandbox capacity.
@Controller("run")
export class RunController {
  constructor(private readonly runService: RunService) {}

  /** Run a (multi-file) project in the jailed docker sandbox. */
  @RequireActive()
  @Post("execute")
  async execute(@CurrentUser() user: AuthUser, @Body(new ZodPipe(runExecuteSchema)) body: RunExecuteInput) {
    try {
      return await this.runService.execute(user, body.language, body.files, body.entry);
    } catch (e) {
      if (e instanceof RateLimitExceededError) {
        throw new HttpException(e.message, HttpStatus.TOO_MANY_REQUESTS);
      }
      throw e;
    }
  }
}
