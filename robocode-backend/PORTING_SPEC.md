# RoboCode backend porting spec (NestJS 11)

You are porting one domain from the OLD Next.js app into a NestJS module. The old code
lives in `robocode-frontend/src/` (server actions in `src/lib/<domain>/actions.ts`, and
RSC pages in `src/app/app/<area>/page.tsx` that read Prisma directly). Your job: expose a
REST API that covers BOTH the mutations (the action functions) AND the reads (every distinct
Prisma query the pages perform), so the frontend can later call HTTP instead of Prisma.

## Hard conventions (follow EXACTLY so everything compiles & is consistent)

- Files go in `robocode-backend/src/modules/<name>/`:
  - `<name>.module.ts`, `<name>.service.ts`, `<name>.controller.ts` (+ `dto.ts` if helpful).
- Controller prefix = the domain, e.g. `@Controller("teams")`. Routes are mounted at the
  backend root (NO global prefix); the web client reaches them via `/api/v1/<route>`.
- Imports use RELATIVE paths from `src/modules/<name>/` (e.g. `../../prisma/prisma.service`).
- Data access: inject `PrismaService` (from `../../prisma/prisma.service`).
- Global services available for injection (no import of their module needed — they're @Global):
  - `PrismaService` — `../../prisma/prisma.service`
  - `PointsService` — `../../common/points.service` (`awardPoints({userId,delta,reason,refType?,refId?,idemKey?,teamId?})`, `awardBadge(userId, code)`)
  - `NotifyService` — `../../common/notify.service` (`notify({userId,type?,title,body?,data?})`, `sendEmail(to,subject,body)`)
  - `TenantService` — `../../common/tenant.service` (`fromRequest(req)`, `getActiveTenant(host,forced?)`)
- Auth (a GLOBAL `JwtAuthGuard` runs on every route):
  - By default every route REQUIRES a valid logged-in user.
  - `@Public()` (from `../../auth/decorators`) → no auth required (still attaches user if a token is present).
  - `@RequireActive()` → user.status must be "active" (mirrors old `requireActiveUser()`).
  - `@RequireCapability("cap")` → checks role capability (mirrors old `requireCapability(cap)`).
  - `@CurrentUser() user: AuthUser` (decorator + type from `../../auth/decorators` and `../../auth/auth-user.type`) injects the authenticated user (includes `.tenant`). `AuthUser` has all User columns + `tenant`.
  - For tenant-scoped reads, get the tenant via `user.tenantId` / `user.tenant`, or `@Req() req` + `TenantService.fromRequest(req)` for public/unauth pages.
- Validation: use `ZodPipe` from `../../common/zod.pipe`: `@Body(new ZodPipe(mySchema)) body: MyInput`. Define zod schemas in the module or `dto.ts` (import `z` from "zod").
- Capability/role helpers: import `can`, `isStaff`, types from `../../domain/roles`. Points constants from `../../domain/constants`.
- NEVER return `passwordHash`. For user objects use a safe projection (id, email, displayName, role, status, tenantId, avatarSeed, roboPoints, level, isMinor, locale, + tenant summary). There is a `publicUser()` helper in `../../auth/auth.service` you may reuse/import.
- Replace old framework calls: `requireActiveUser()` → `@RequireActive()` + `@CurrentUser()`. `redirect(...)` (in mutations) → just `return { ok: true, redirect: "/path" }` (the client navigates). `throw new Error("FORBIDDEN")` → `throw new ForbiddenException("FORBIDDEN")`; `"NOT_FOUND"` → `NotFoundException`; bad input → `BadRequestException`.
- Mutations that took `(prevState, formData)` server-action signatures → accept a typed JSON body instead (extract the same fields). Return `{ ok: true, ...}` or `{ fieldErrors }` via `BadRequestException({message, fieldErrors})`.

## Output

1. Create the module/service/controller files (and dto.ts if needed) under `src/modules/<name>/`.
2. Return a concise MARKDOWN list of every endpoint you created in this exact format so the
   frontend client can be built to match:
   `METHOD /route — purpose — body: {fields} — returns: {shape}`
   Also note any capability/active requirements per route.

Do not modify files outside your module directory. Do not run builds. Keep code style close
to the original (comments, naming).
