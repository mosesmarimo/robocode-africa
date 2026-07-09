"use server";

import { revalidatePath } from "next/cache";
import { apiPut, ApiError } from "@/lib/api/client";

export async function updateProfile({
  displayName,
  locale,
  avatarSeed,
  tagline,
  bio,
}: {
  displayName: string;
  locale: string;
  avatarSeed: string;
  tagline?: string;
  bio?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await apiPut("/account/profile", { displayName, locale, avatarSeed, tagline, bio });
  } catch (e) {
    if (e instanceof ApiError) {
      return { success: false, error: e.message };
    }
    throw e;
  }

  revalidatePath("/app/profile");
  revalidatePath("/app/settings");

  return { success: true };
}

export async function updateAiConfig(input: {
  provider?: string;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  clearKey?: boolean;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await apiPut("/ai/config", input);
  } catch (e) {
    if (e instanceof ApiError) return { success: false, error: e.message };
    throw e;
  }
  revalidatePath("/app/settings");
  return { success: true };
}
