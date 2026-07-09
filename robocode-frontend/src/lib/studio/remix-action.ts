"use server";

import { redirect } from "next/navigation";
import { apiPost } from "@/lib/api/client";

/**
 * Clone a shared/public project into the caller's own account (backend
 * `ProjectsService.remix` credits the original author, once per remixer),
 * then jump straight into the new project's Studio. Mirrors `createProject`'s
 * redirect-on-success shape — callers should let the `NEXT_REDIRECT` throw
 * bubble (see `unstable_rethrow` in the Studio toolbar) rather than treating
 * it as a failure.
 */
export async function remixProject(sourceId: string) {
  const { id } = await apiPost<{ id: string }>(`/projects/${sourceId}/remix`);
  redirect(`/studio/${id}`);
}
