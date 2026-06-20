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
        if (user && user.status !== "suspended" && user.status !== "rejected") {
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
