import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { PublishService, PublishRateLimitError } from "./publish.service";
import { ZodPipe } from "../../common/zod.pipe";
import { RequireActive, CurrentUser, Public } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { publishSchema, type PublishInput } from "./dto";

// A single controller (no shared @Controller prefix) mirrors DashboardController:
// its routes span three different resource prefixes (publish/, projects/:id/, published).
@Controller()
export class PublishController {
  constructor(private readonly publish: PublishService) {}

  /** Domains a project may be published to. */
  @Get("publish/domains")
  domains() {
    return { domains: this.publish.listDomains() };
  }

  /** Check whether a name is available on a domain (format/reserved/profanity/taken/school-slug). */
  @Get("publish/check")
  check(@Query("domain") domain: string, @Query("subdomain") subdomain: string) {
    return this.publish.checkAvailability(domain ?? "", subdomain ?? "");
  }

  /** Publish a project to `<subdomain>.<domain>` (owner-only, rate-limited). */
  @RequireActive()
  @Post("projects/:id/publish")
  async publishProject(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodPipe(publishSchema)) body: PublishInput,
  ) {
    try {
      return await this.publish.publish(user, id, body.domain, body.subdomain);
    } catch (e) {
      if (e instanceof PublishRateLimitError) {
        throw new HttpException(e.message, HttpStatus.TOO_MANY_REQUESTS);
      }
      throw e;
    }
  }

  /** Unpublish a project (owner-only), freeing its name. */
  @RequireActive()
  @Post("projects/:id/unpublish")
  unpublishProject(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.publish.unpublish(user, id);
  }

  /** PUBLIC: render payload for a published project (no auth, no PII). */
  @Public()
  @Get("published")
  published(@Query("domain") domain: string, @Query("subdomain") subdomain: string) {
    return this.publish.resolvePublished(domain ?? "", subdomain ?? "");
  }
}
