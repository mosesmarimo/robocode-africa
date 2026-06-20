"use server";

import { revalidatePath } from "next/cache";
import { apiPost, ApiError } from "@/lib/api/client";

// ---------------------------------------------------------------------------
// Student approvals
// ---------------------------------------------------------------------------

export async function approveStudent(userId: string) {
  try {
    await apiPost(`/school/students/${userId}/approve`);
  } catch (e) {
    if (e instanceof ApiError) {
      return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    }
    throw e;
  }

  revalidatePath("/app/school/approvals");
  revalidatePath("/app/school/members");
}

export async function rejectStudent(userId: string, reason?: string) {
  try {
    await apiPost(`/school/students/${userId}/reject`, { reason });
  } catch (e) {
    if (e instanceof ApiError) {
      return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    }
    throw e;
  }

  revalidatePath("/app/school/approvals");
  revalidatePath("/app/school/members");
}

// ---------------------------------------------------------------------------
// Member management
// ---------------------------------------------------------------------------

export async function suspendStudent(userId: string) {
  try {
    await apiPost(`/school/students/${userId}/suspend`);
  } catch (e) {
    if (e instanceof ApiError) {
      return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    }
    throw e;
  }

  revalidatePath("/app/school/members");
}

export async function reinstateStudent(userId: string) {
  try {
    await apiPost(`/school/students/${userId}/reinstate`);
  } catch (e) {
    if (e instanceof ApiError) {
      return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    }
    throw e;
  }

  revalidatePath("/app/school/members");
}

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------

type BrandingInput = {
  primary: string;
  secondary: string;
  accent: string;
  tagline: string;
  logoUrl?: string;
};

export async function updateBranding(input: BrandingInput) {
  try {
    await apiPost("/school/branding", {
      primary: input.primary,
      secondary: input.secondary,
      accent: input.accent,
      tagline: input.tagline,
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    }
    throw e;
  }

  revalidatePath("/app/school/branding");
  revalidatePath("/app");
}

// ---------------------------------------------------------------------------
// Policies
// ---------------------------------------------------------------------------

type PoliciesInput = {
  autoApprove: boolean;
};

export async function setPolicies(input: PoliciesInput) {
  try {
    await apiPost("/school/policies", { autoApprove: input.autoApprove });
  } catch (e) {
    if (e instanceof ApiError) {
      return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    }
    throw e;
  }

  revalidatePath("/app/school/approvals");
  revalidatePath("/app/school/members");
}
