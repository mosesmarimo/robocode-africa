import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Tenant } from "@prisma/client";
import { nanoid } from "nanoid";
import { PrismaService } from "../prisma/prisma.service";
import { NotifyService } from "../common/notify.service";
import { JwtService } from "./jwt.service";
import { hashPassword, verifyPassword } from "./password.util";
import type { StudentSignupInput, SchoolSignupInput, LoginInput } from "../domain/validation";
import type { AuthUser } from "./auth-user.type";

/** Public-safe projection of a user (no password hash). */
export function publicUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    tenantId: user.tenantId,
    isMinor: user.isMinor,
    avatarSeed: user.avatarSeed,
    roboPoints: user.roboPoints,
    level: user.level,
    locale: user.locale,
    tenant: user.tenant
      ? { id: user.tenant.id, slug: user.tenant.slug, name: user.tenant.name, isPlatform: user.tenant.isPlatform, branding: user.tenant.branding }
      : null,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: NotifyService,
    private readonly jwt: JwtService,
  ) {}

  private async notifyApprovers(tenantId: string, isPlatform: boolean, subject: string) {
    const roles = isPlatform ? ["super_admin", "moderator"] : ["school_admin"];
    const approvers = await this.prisma.user.findMany({
      where: { tenantId, role: { in: roles }, status: "active" },
      select: { id: true },
    });
    await Promise.all(
      approvers.map((a) =>
        this.notifier.notify({ userId: a.id, type: "approval", title: "New signup awaiting approval", body: subject }),
      ),
    );
  }

  async studentSignup(data: StudentSignupInput, tenant: Tenant | null) {
    if (!tenant) throw new BadRequestException({ message: "Could not resolve the school. Please try again." });

    const existing = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: data.email } },
    });
    if (existing) throw new BadRequestException({ message: "An account with this email already exists.", fieldErrors: { email: "An account with this email already exists." } });

    const age = new Date().getFullYear() - data.birthYear;
    const isMinor = age < 18;
    const needsConsent = age < 13;

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: data.email,
        displayName: data.displayName,
        passwordHash: await hashPassword(data.password),
        role: "student",
        status: "pending",
        isMinor,
        birthYear: data.birthYear,
        guardianEmail: data.guardianEmail || null,
        avatarSeed: nanoid(8),
      },
    });

    await this.prisma.approvalRequest.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        type: tenant.isPlatform ? "student_direct" : "student_school",
      },
    });

    if (needsConsent && data.guardianEmail) {
      const token = nanoid(24);
      await this.prisma.consentRecord.create({
        data: { userId: user.id, guardianEmail: data.guardianEmail, token },
      });
      await this.notifier.sendEmail(
        data.guardianEmail,
        "Approve your child's RoboCode.Africa account",
        `Please confirm consent: ${process.env.ROOT_DOMAIN}/consent/${token}`,
      );
    }

    await this.notifyApprovers(
      tenant.id,
      tenant.isPlatform,
      `${data.displayName} (${data.email}) requested a student account.`,
    );

    return { ok: true, redirect: "/pending" };
  }

  async schoolSignup(data: SchoolSignupInput) {
    const slugTaken = await this.prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (slugTaken) throw new BadRequestException({ message: "That subdomain is taken.", fieldErrors: { slug: "That subdomain is taken." } });

    const tenant = await this.prisma.tenant.create({
      data: {
        slug: data.slug,
        name: data.schoolName,
        status: "pending",
        branding: { tagline: `${data.schoolName} · powered by RoboCode.Africa` },
        policies: { autoApprove: false },
      },
    });
    await this.prisma.domain.create({
      data: { tenantId: tenant.id, hostname: `${data.slug}.${process.env.ROOT_DOMAIN}`, type: "subdomain", verified: true },
    });

    const admin = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: data.email,
        displayName: data.adminName,
        passwordHash: await hashPassword(data.password),
        role: "school_admin",
        status: "pending",
        isMinor: false,
        avatarSeed: nanoid(8),
      },
    });
    await this.prisma.approvalRequest.create({
      data: { userId: admin.id, tenantId: tenant.id, type: "teacher" },
    });

    const platform = await this.prisma.tenant.findFirst({ where: { isPlatform: true } });
    if (platform) {
      await this.notifyApprovers(platform.id, true, `New school "${data.schoolName}" registered and awaits approval.`);
    }

    return { ok: true, redirect: "/pending?school=1" };
  }

  async login(data: LoginInput, tenant: Tenant | null) {
    let user = tenant
      ? await this.prisma.user.findUnique({ where: { tenantId_email: { tenantId: tenant.id, email: data.email } } })
      : null;
    if (!user) user = await this.prisma.user.findFirst({ where: { email: data.email } });

    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      throw new UnauthorizedException({ message: "Incorrect email or password." });
    }
    if (user.status === "pending") throw new UnauthorizedException({ message: "Your account is awaiting approval." });
    if (user.status === "suspended") throw new UnauthorizedException({ message: "This account has been suspended." });
    if (user.status === "rejected") throw new UnauthorizedException({ message: "This account request was declined." });

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = await this.jwt.sign({ uid: user.id, role: user.role, tid: user.tenantId });
    const full = await this.prisma.user.findUnique({ where: { id: user.id }, include: { tenant: true } });
    return { ok: true, token, user: publicUser(full as AuthUser), redirect: "/app" };
  }
}
