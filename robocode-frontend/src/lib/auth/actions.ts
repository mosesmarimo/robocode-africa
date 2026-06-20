"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { apiLogin, apiPublic, ApiError } from "@/lib/api/client";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";

export type ActionState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

async function reqHost(): Promise<{ host: string; tenant: string }> {
  const h = await headers();
  return {
    host: h.get("x-forwarded-host") ?? h.get("host") ?? "",
    tenant: h.get("x-tenant") ?? "",
  };
}

function asState(e: unknown): ActionState {
  if (e instanceof ApiError) {
    if (e.fieldErrors && Object.keys(e.fieldErrors).length) return { fieldErrors: e.fieldErrors };
    return { error: e.message };
  }
  throw e; // redirect() throws — let it bubble
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { host, tenant } = await reqHost();
  let result: { token: string; redirect?: string };
  try {
    result = await apiLogin(
      { email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") },
      host,
      tenant,
    );
  } catch (e) {
    return asState(e);
  }
  await setSessionCookie(result.token);
  redirect(result.redirect ?? "/app");
}

export async function studentSignup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { host, tenant } = await reqHost();
  let result: { redirect?: string };
  try {
    result = await apiPublic(
      "/auth/student-signup",
      {
        displayName: String(formData.get("displayName") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        birthYear: String(formData.get("birthYear") ?? ""),
        guardianEmail: String(formData.get("guardianEmail") ?? ""),
      },
      host,
      tenant,
    );
  } catch (e) {
    return asState(e);
  }
  redirect(result.redirect ?? "/pending");
}

export async function schoolSignup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { host, tenant } = await reqHost();
  let result: { redirect?: string };
  try {
    result = await apiPublic(
      "/auth/school-signup",
      {
        schoolName: String(formData.get("schoolName") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        adminName: String(formData.get("adminName") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      },
      host,
      tenant,
    );
  } catch (e) {
    return asState(e);
  }
  redirect(result.redirect ?? "/pending?school=1");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/");
}
