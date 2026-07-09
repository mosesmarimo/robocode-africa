import { NextResponse, type NextRequest } from "next/server";

const ROOT = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000").split(":")[0];
const PROTECTED = ["/app", "/studio"];

const IS_DEV = process.env.NODE_ENV !== "production";

// Domains a project can be published to (mirrors the backend's
// PUBLISH_DOMAINS, robocode-backend/src/modules/publish/constants.ts). The
// "studio" domains are every publish domain that ISN'T the platform's own
// tenant-hosting domain (ROOT, e.g. robocode.africa) — i.e. robocode.studio: a
// dedicated bare-project hosting domain with no tenant/school concept at all,
// where ANY subdomain always serves the published-site view (see the loop
// below). robocode.africa itself is NOT a studio domain — a subdomain there
// is a school tenant by default, and publishing is only a fallback (handled
// separately, alongside the tenant resolution it depends on).
const PUBLISH_DOMAINS = (process.env.NEXT_PUBLIC_PUBLISH_DOMAINS ?? "robocode.studio,robocode.africa")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);
const STUDIO_DOMAINS = PUBLISH_DOMAINS.filter((d) => d !== ROOT);

// Only used by the robocode.africa published-project fallback below (a
// backend round-trip proxy.ts otherwise never needs) — same default as
// src/lib/api/client.ts's BASE.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const host = (req.headers.get("host") ?? "").split(":")[0];

  // `/_site/<domain>/<subdomain>` is the public, chromeless published-site
  // route (the rewrite target both for studio domains below and the
  // robocode.africa published-project fallback) — it must never be caught by
  // the auth redirect further down, regardless of how it's reached (rewritten
  // to on a real subdomain, or visited directly, as the local repro scripts
  // do since a real subdomain host can't be spoofed without /etc/hosts).
  const isSitePath = url.pathname === "/_site" || url.pathname.startsWith("/_site/");

  // Studio-domain routing: `<sub>.<studioDomain>` (never the apex or `www`)
  // unconditionally rewrites to the published-site view. There's no tenant
  // concept on these domains, so no backend round-trip is needed here — the
  // _site route itself fetches the project and renders a friendly 404 if the
  // name isn't actually published.
  for (const domain of STUDIO_DOMAINS) {
    if (!host.endsWith("." + domain)) continue;
    const sub = host.slice(0, -("." + domain).length);
    if (!sub || sub === "www") continue;
    const rest = url.pathname === "/" ? "" : url.pathname;
    return NextResponse.rewrite(new URL(`/_site/${domain}/${sub}${rest}`, req.url));
  }

  // Resolve tenant subdomain and forward as a header for server components.
  let tenant = "";
  if (host && host !== ROOT && host !== "localhost" && host !== "127.0.0.1") {
    if (host.endsWith("." + ROOT)) tenant = host.slice(0, -("." + ROOT).length);
  }

  // robocode.africa published-project fallback: a subdomain here is a SCHOOL
  // TENANT by default (the flow below, entirely unchanged) — publishing a
  // project to this domain is only possible for a name that ISN'T an
  // existing tenant slug (enforced server-side at publish time, see
  // PublishService.checkAvailability's "reserved-by-a-school" check), so a
  // published match here can never exist for a real tenant subdomain and
  // this can never steal traffic from an actual school. That invariant is
  // what lets this be a single, unconditional lookup rather than "check
  // tenant, then check published" — they're mutually exclusive by
  // construction, so "tenant match always wins" holds automatically.
  // Skipped entirely off ROOT (dev: NEXT_PUBLIC_ROOT_DOMAIN is "localhost:..",
  // not a publish domain, so there's no real subdomain to check) and
  // best-effort (a backend hiccup here must never break the tenant flow —
  // any failure just falls through to the unchanged behavior below).
  if (tenant && PUBLISH_DOMAINS.includes(ROOT)) {
    try {
      const qs = new URLSearchParams({ domain: ROOT, subdomain: tenant }).toString();
      const res = await fetch(`${BACKEND_URL}/published?${qs}`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const rest = url.pathname === "/" ? "" : url.pathname;
        return NextResponse.rewrite(new URL(`/_site/${ROOT}/${tenant}${rest}`, req.url));
      }
    } catch {
      // best-effort; fall through to the normal tenant flow below.
    }
  }

  // Dev-only convenience: ?tenant=slug (persisted via the rc_tenant cookie)
  // emulates subdomains on localhost. This is attacker-settable, so it is
  // ignored in production AND whenever a real subdomain host is present — the
  // host always wins so a logged-in user can't override their tenant context.
  const forced = IS_DEV ? url.searchParams.get("tenant") : null;
  const cookieTenant = IS_DEV ? req.cookies.get("rc_tenant")?.value : undefined;

  const requestHeaders = new Headers(req.headers);
  // Drop any client-supplied x-tenant; only we set it from a trusted source.
  requestHeaders.delete("x-tenant");
  const effective = tenant || forced || cookieTenant || "";
  if (effective) requestHeaders.set("x-tenant", effective);

  const needsAuth = !isSitePath && PROTECTED.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"));
  if (needsAuth && !req.cookies.get("rc_session")) {
    const to = new URL("/login", req.url);
    to.searchParams.set("next", url.pathname);
    return NextResponse.redirect(to);
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  // Only persist the dev override cookie in dev, and never when the host
  // already identifies a tenant.
  if (IS_DEV && forced && !tenant) res.cookies.set("rc_tenant", forced, { path: "/" });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
