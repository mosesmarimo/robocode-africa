import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Tenant } from "@prisma/client";
import { nanoid } from "nanoid";
import { PrismaService } from "../prisma/prisma.service";
import { NotifyService } from "../common/notify.service";
import { StreakService } from "../common/streak.service";
import { JwtService } from "./jwt.service";
import { hashPassword, verifyPassword } from "./password.util";
import type { StudentSignupInput, SchoolSignupInput, LoginInput } from "../domain/validation";
import type { AuthUser } from "./auth-user.type";
import { ReferralsService } from "../modules/referrals/referrals.service";
import { FRONTEND_ORIGIN } from "../domain/constants";

/** Public-safe projection of a user (no password hash). */
export function publicUser(user: AuthUser) {
  const prefs = (user.prefs as Record<string, unknown> | null) ?? {};
  const streakPrefs = prefs.streak as { count?: number; embers?: number; frozenUntil?: string } | undefined;
  const streakCount = streakPrefs?.count ?? 0;
  const streakEmbers = streakPrefs?.embers ?? 0;
  const streakFrozenUntil = streakPrefs?.frozenUntil ?? null;
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
    tagline: user.tagline ?? null,
    bio: user.bio ?? null,
    // Surfaced so clients can force a password change after an admin reset.
    mustChangePassword: user.mustChangePassword,
    // Daily-active streak (see StreakService.touch) — 0/no embers if never touched.
    // `embers` absorb a single missed day; `frozenUntil` (if set) is a rarer
    // milestone-earned multi-day miss protection.
    streak: { count: streakCount, embers: streakEmbers, frozenUntil: streakFrozenUntil },
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
    private readonly referrals: ReferralsService,
    private readonly streak: StreakService,
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

    // Honour the school's auto-approval policy — but never auto-activate an
    // under-13 student before verifiable guardian consent (COPPA).
    const autoApprove =
      ((tenant.policies as { autoApprove?: boolean } | null)?.autoApprove ?? false) && !needsConsent;

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: data.email,
        displayName: data.displayName,
        passwordHash: await hashPassword(data.password),
        role: "student",
        status: autoApprove ? "active" : "pending",
        isMinor,
        birthYear: data.birthYear,
        guardianEmail: data.guardianEmail || null,
        avatarSeed: nanoid(8),
      },
    });

    // Capture the referral before anything else touches this user, so that an
    // autoApprove settlement below (or a later approval/consent path) always
    // finds the pending Referral already in place.
    if (data.ref) await this.referrals.recordSignup(user.id, data.ref);
    if (autoApprove) await this.referrals.settleIfActive(user.id);

    await this.prisma.approvalRequest.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        type: tenant.isPlatform ? "student_direct" : "student_school",
        ...(autoApprove ? { status: "approved", decidedAt: new Date() } : {}),
      },
    });

    if (needsConsent && data.guardianEmail) {
      const token = nanoid(24);
      await this.prisma.consentRecord.create({
        data: { userId: user.id, guardianEmail: data.guardianEmail, token },
      });
      // FRONTEND_ORIGIN (not ROOT_DOMAIN) — it carries a scheme, so the link
      // in the email is an absolute, clickable https URL. ROOT_DOMAIN is a
      // bare hostname meant for building tenant subdomains (see constants.ts).
      await this.notifier.sendEmail(
        data.guardianEmail,
        "Approve your child's RoboCode.Africa account",
        `Please confirm consent: ${FRONTEND_ORIGIN}/consent/${token}`,
      );
    }

    if (!autoApprove) {
      await this.notifyApprovers(
        tenant.id,
        tenant.isPlatform,
        `${data.displayName} (${data.email}) requested a student account.`,
      );
    }

    return { ok: true, redirect: autoApprove ? "/login" : "/pending" };
  }

  async schoolSignup(data: SchoolSignupInput) {
    const slugTaken = await this.prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (slugTaken) throw new BadRequestException({ message: "That subdomain is taken.", fieldErrors: { slug: "That subdomain is taken." } });

    // Reverse of PublishService.checkAvailability's "reserved-by-a-school"
    // guard: on robocode.africa the proxy resolves a published project's
    // subdomain BEFORE tenant validation, so a published project must also
    // win here — a new school tenant can't be created on a slug a published
    // project already occupies (it would otherwise be silently shadowed).
    const publishedCollision = await this.prisma.project.findFirst({
      where: { publishDomain: "robocode.africa", subdomain: data.slug },
      select: { id: true },
    });
    if (publishedCollision) throw new BadRequestException({ message: "That subdomain is taken.", fieldErrors: { slug: "That subdomain is taken." } });

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
    // An unresolved host (e.g. an unknown/misspelled subdomain) must not silently
    // authenticate against the platform tenant.
    if (!tenant) {
      throw new UnauthorizedException({ message: "We couldn't find that school. Check the address and try again." });
    }
    // Scope strictly to the resolved tenant — never search globally by email
    // (email is only unique per tenant, so a global lookup leaks across schools).
    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: data.email } },
    });

    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      throw new UnauthorizedException({ message: "Incorrect email or password." });
    }
    if (user.status === "pending") throw new UnauthorizedException({ message: "Your account is awaiting approval." });
    if (user.status === "suspended") throw new UnauthorizedException({ message: "This account has been suspended." });
    if (user.status === "rejected") throw new UnauthorizedException({ message: "This account request was declined." });
    // A suspended school disables access for all of its users, regardless of
    // individual account status (suspendTenant does not cascade to users).
    if (tenant?.status === "suspended") {
      throw new UnauthorizedException({ message: "This school's access has been suspended. Please contact support." });
    }
    // A reset-issued temporary password stops working once it expires — the user
    // must ask an admin to reset it again.
    if (user.mustChangePassword && user.tempPasswordExpiresAt && user.tempPasswordExpiresAt < new Date()) {
      throw new UnauthorizedException({ message: "Your temporary password has expired. Ask an administrator to reset it again." });
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    // Touch the daily-active streak before re-fetching the full user, so the
    // response's `streak` reflects today's bump (not yesterday's count).
    await this.streak.touch(user.id);
    const token = await this.jwt.sign({ uid: user.id, role: user.role, tid: user.tenantId, tv: user.tokenVersion });
    const full = await this.prisma.user.findUnique({ where: { id: user.id }, include: { tenant: true } });
    return { ok: true, token, user: publicUser(full as AuthUser), redirect: "/app" };
  }
}
