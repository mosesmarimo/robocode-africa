import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "./jwt.service";
import { can, type Capability } from "../domain/roles";
import { CAPABILITY_KEY, IS_PUBLIC_KEY, REQUIRE_ACTIVE_KEY } from "./decorators";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private tokenFrom(req: Request): string | null {
    const auth = req.headers["authorization"];
    if (auth && auth.startsWith("Bearer ")) return auth.slice(7).trim();
    const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.rc_session;
    return cookie ?? null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets);
    const req = context.switchToHttp().getRequest<Request>();

    const token = this.tokenFrom(req);
    if (token) {
      const session = await this.jwt.verify(token);
      if (session) {
        const user = await this.prisma.user.findUnique({
          where: { id: session.uid },
          include: { tenant: true },
        });
        // Token revocation: a password change bumps the user's tokenVersion, so
        // any JWT minted before that (lower/absent tv) no longer authenticates.
        // Tokens issued before this field existed carry no tv → treated as 0,
        // matching the default so existing sessions survive the rollout. A
        // revoked token simply doesn't authenticate (falls through to the public
        // check / 401) rather than throwing — so a stale token on a public route
        // like /auth/login doesn't block re-login.
        const tokenCurrent = !!user && (session.tv ?? 0) === user.tokenVersion;
        if (user && tokenCurrent && user.status !== "suspended" && user.status !== "rejected") {
          // A suspended tenant must not let its (otherwise active) users in —
          // suspendTenant only flips Tenant.status, so enforce it here.
          if (user.tenant?.status === "suspended") {
            throw new ForbiddenException("TENANT_SUSPENDED");
          }
          (req as Request & { user?: unknown }).user = user;

          const requireActive = this.reflector.getAllAndOverride<boolean>(REQUIRE_ACTIVE_KEY, targets);
          if (requireActive && user.status !== "active") {
            throw new ForbiddenException("PENDING_APPROVAL");
          }
          const cap = this.reflector.getAllAndOverride<Capability>(CAPABILITY_KEY, targets);
          if (cap && !can(user.role, cap)) {
            throw new ForbiddenException("FORBIDDEN");
          }
          return true;
        }
      }
    }

    if (isPublic) return true;
    throw new UnauthorizedException("UNAUTHENTICATED");
  }
}
