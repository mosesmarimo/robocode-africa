import { NextResponse, type NextRequest } from "next/server";

const ROOT = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000").split(":")[0];
const PROTECTED = ["/app", "/studio"];

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const host = (req.headers.get("host") ?? "").split(":")[0];

  // Resolve tenant subdomain and forward as a header for server components.
  let tenant = "";
  if (host && host !== ROOT && host !== "localhost" && host !== "127.0.0.1") {
    if (host.endsWith("." + ROOT)) tenant = host.slice(0, -("." + ROOT).length);
  }
  // Dev convenience: ?tenant=slug sets a cookie used to emulate subdomains on localhost.
  const forced = url.searchParams.get("tenant");

  const requestHeaders = new Headers(req.headers);
  const cookieTenant = req.cookies.get("rc_tenant")?.value;
  const effective = tenant || forced || cookieTenant || "";
  if (effective) requestHeaders.set("x-tenant", effective);

  const needsAuth = PROTECTED.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"));
  if (needsAuth && !req.cookies.get("rc_session")) {
    const to = new URL("/login", req.url);
    to.searchParams.set("next", url.pathname);
    return NextResponse.redirect(to);
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  if (forced) res.cookies.set("rc_tenant", forced, { path: "/" });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
