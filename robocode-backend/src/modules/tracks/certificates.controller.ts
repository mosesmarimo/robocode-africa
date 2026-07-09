import { Controller, Get, Param } from "@nestjs/common";
import { TracksService } from "./tracks.service";
import { CurrentUser, Public, RequireActive } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";

@Controller("certificates")
export class CertificatesController {
  constructor(private readonly tracks: TracksService) {}

  /** /app/badges (certificates panel) — the current user's earned certificates. */
  @RequireActive()
  @Get()
  mine(@CurrentUser() user: AuthUser) {
    return this.tracks.myCertificates(user.id);
  }

  /** PUBLIC verify page: no auth, PII-safe (first name + last initial only). */
  @Public()
  @Get("verify/:code")
  verify(@Param("code") code: string) {
    return this.tracks.verifyCertificate(code);
  }
}
