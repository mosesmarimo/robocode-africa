import "server-only";
import { cookies, headers } from "next/headers";

const BASE = process.env.BACKEND_URL ?? "http://localhost:4000";
export const SESSION_COOKIE = "rc_session";

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Build headers that authenticate the call and carry the tenant host. */
async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const tenant = h.get("x-tenant") ?? "";
  const out: Record<string, string> = { "content-type": "application/json", ...extra };
  if (token) out["authorization"] = `Bearer ${token}`;
  if (host) out["x-forwarded-host"] = host;
  if (tenant) out["x-tenant"] = tenant;
  // Forward the real client IP so the backend rate-limiter keys per user, not
  // per this server (all RSC/server-action calls originate from 127.0.0.1).
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip");
  if (ip) out["x-forwarded-for"] = ip;
  return out;
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    if (data && typeof data === "object" && "message" in data) {
      const m = (data as { message: unknown }).message;
      message = Array.isArray(m) ? m.join(", ") : String(m);
    }
    const fieldErrors =
      data && typeof data === "object" && "fieldErrors" in data
        ? ((data as { fieldErrors?: Record<string, string> }).fieldErrors ?? undefined)
        : undefined;
    throw new ApiError(res.status, message, fieldErrors);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** GET a JSON resource. Throws ApiError on non-2xx. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: await authHeaders(), cache: "no-store" });
  return parse<T>(res);
}

/** GET, returning null on 401/404 instead of throwing (handy for optional reads). */
export async function apiGetOrNull<T>(path: string): Promise<T | null> {
  try {
    return await apiGet<T>(path);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 404)) return null;
    throw e;
  }
}

/**
 * GET a `@Public()` backend endpoint WITHOUT forwarding the viewer's own
 * session — no `Authorization: Bearer`, no `x-tenant`/`x-forwarded-host`.
 * Use this (never `apiGet`/`apiGetOrNull`) for routes meant to be fully
 * anonymous (e.g. the published-project `_site` render): those helpers
 * forward the current visitor's cookie-derived JWT even to `@Public()`
 * routes, and JwtAuthGuard resolves+attaches that user regardless of
 * `@Public()` — so a logged-in (or stale-session) viewer's own account state
 * (e.g. a suspended tenant) can leak into, or even break, a request that has
 * nothing to do with them. Mirrors apiGetOrNull's null-on-401/404 behavior.
 */
export async function apiGetPublic<T>(path: string): Promise<T | null> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "content-type": "application/json" },
    cache: "no-store",
  });
  try {
    return await parse<T>(res);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 404)) return null;
    throw e;
  }
}

async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: await authHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  return parse<T>(res);
}

export const apiPost = <T>(path: string, body?: unknown) => send<T>("POST", path, body);
export const apiPut = <T>(path: string, body?: unknown) => send<T>("PUT", path, body);
export const apiPatch = <T>(path: string, body?: unknown) => send<T>("PATCH", path, body);
export const apiDelete = <T>(path: string, body?: unknown) => send<T>("DELETE", path, body);

/** A login response carries the JWT to store in the session cookie. */
export interface LoginResult<U = unknown> {
  ok: boolean;
  token: string;
  user: U;
  redirect?: string;
}

/** The real client IP from the incoming request, to forward to the backend rate-limiter. */
async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "";
}

/** POST /auth/login without a session (used by the login action before a cookie exists). */
export async function apiLogin<U = unknown>(body: unknown, host: string, tenant?: string): Promise<LoginResult<U>> {
  const headersOut: Record<string, string> = { "content-type": "application/json" };
  if (host) headersOut["x-forwarded-host"] = host;
  if (tenant) headersOut["x-tenant"] = tenant;
  const ip = await clientIp();
  if (ip) headersOut["x-forwarded-for"] = ip;
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: headersOut,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return parse<LoginResult<U>>(res);
}

/** POST a public endpoint (signup/consent) carrying the tenant host but no session. */
export async function apiPublic<T>(path: string, body: unknown, host: string, tenant?: string): Promise<T> {
  const headersOut: Record<string, string> = { "content-type": "application/json" };
  if (host) headersOut["x-forwarded-host"] = host;
  if (tenant) headersOut["x-tenant"] = tenant;
  const ip = await clientIp();
  if (ip) headersOut["x-forwarded-for"] = ip;
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headersOut,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return parse<T>(res);
}
