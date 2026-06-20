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

/** POST /auth/login without a session (used by the login action before a cookie exists). */
export async function apiLogin<U = unknown>(body: unknown, host: string, tenant?: string): Promise<LoginResult<U>> {
  const headersOut: Record<string, string> = { "content-type": "application/json" };
  if (host) headersOut["x-forwarded-host"] = host;
  if (tenant) headersOut["x-tenant"] = tenant;
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
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headersOut,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return parse<T>(res);
}
