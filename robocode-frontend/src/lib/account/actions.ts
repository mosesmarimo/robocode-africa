"use server";

import { revalidatePath } from "next/cache";
import { apiPut, ApiError } from "@/lib/api/client";

export async function updateProfile({
  displayName,
  locale,
  avatarSeed,
}: {
  displayName: string;
  locale: string;
  avatarSeed: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await apiPut("/account/profile", { displayName, locale, avatarSeed });
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
