"use server";

import { revalidatePath } from "next/cache";
import { apiPost } from "@/lib/api/client";

export async function markAllRead() {
  await apiPost("/notifications/read-all");
  revalidatePath("/app/notifications");
}

export async function markRead(id: string) {
  await apiPost("/notifications/" + id + "/read");
  revalidatePath("/app/notifications");
}
