import { SetMetadata, createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Capability } from "../domain/roles";

/** Mark a route as public (no auth required). */
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Require a capability on a route (checked by CapabilityGuard). */
export const CAPABILITY_KEY = "capability";
export const RequireCapability = (cap: Capability) => SetMetadata(CAPABILITY_KEY, cap);

/** Require active status (status === "active") on a route. */
export const REQUIRE_ACTIVE_KEY = "requireActive";
export const RequireActive = () => SetMetadata(REQUIRE_ACTIVE_KEY, true);

/** Inject the authenticated user (with tenant) attached by JwtAuthGuard. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.user;
});
