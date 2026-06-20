"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function updateProfile({
  displayName,
  locale,
  avatarSeed,
}: {
  displayName: string;
  locale: string;
  avatarSeed: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const user = (await getCurrentUser())!;

  const trimmed = displayName.trim();
  if (!trimmed) {
    return { success: false, error: "Display name cannot be empty." };
  }
  if (trimmed.length > 64) {
    return { success: false, error: "Display name must be 64 characters or fewer." };
  }

  const validLocales = ["en", "sn", "nd", "sw", "zu", "fr", "pt"];
  if (!validLocales.includes(locale)) {
    return { success: false, error: "Invalid language selection." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: trimmed,
      locale,
      avatarSeed: avatarSeed.trim() || user.avatarSeed,
    },
  });

  revalidatePath("/app/profile");
  revalidatePath("/app/settings");

  return { success: true };
}
