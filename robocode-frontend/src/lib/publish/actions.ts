"use server";

// Server Actions for the publish-to-web feature. Marked "use server" (rather
// than plain `import "server-only"`) because publish-dialog.tsx (a client
// component) calls the publish/unpublish/check/domains actions added here
// directly — "use server" is the mechanism that makes that safe: Next
// replaces client-side references with a fetch stub at build time, so
// there's no risk of the "client component importing a server-only module"
// 500 a plain server-only module would cause. getPublishedSite below is only
// ever called from Server Components, but lives in the same file for the
// same reason every other Studio server call lives in one file (see
// src/lib/studio/actions.ts).
import { apiGet, apiGetOrNull, apiGetPublic, apiPost, ApiError } from "@/lib/api/client";

export interface PublishedSiteFile {
  name: string;
  content: string;
}

export interface PublishAvailability {
  available: boolean;
  reason?: string;
}

/** Current publish state of a project, for the Publish dialog's initial render. */
export interface ProjectPublishState {
  domain: string | null;
  subdomain: string | null;
  url: string | null;
}

/** The public, PII-free render payload for a published project — mirrors the
 * backend's PublishedProjectPayload (robocode-backend/src/modules/publish/dto.ts). */
export interface PublishedSite {
  title: string;
  kind: string;
  boardType: string;
  diagram: unknown;
  files: PublishedSiteFile[];
  ownerDisplayName: string;
  ownerReferralCode: string | null;
  updatedAt: string;
}

/**
 * PUBLIC: resolve a published project's render payload by (domain,
 * subdomain). Returns null if nothing is published there — an unknown name,
 * an unpublished/taken-down project, or an unsupported domain all resolve
 * the same way (backend 404s all three) — so callers render one friendly
 * "not published" state rather than distinguishing failure reasons.
 *
 * Uses `apiGetPublic` (NOT `apiGet`/`apiGetOrNull`) — this is the one call in
 * this file that must never carry the viewer's own session: `/published` is
 * `@Public()` and takes `domain`/`subdomain` as explicit query params (no
 * tenant/host inference needed), so there's nothing for an Authorization
 * header or x-tenant to legitimately do here. Forwarding them anyway (the
 * previous bug) meant a logged-in visitor's own JWT was sent on a request
 * that has nothing to do with their account — and since JwtAuthGuard resolves
 * +attaches that user even on `@Public()` routes, a visitor whose own tenant
 * happened to be suspended would get a 403 loading someone else's published
 * site, purely from their unrelated session being forwarded.
 */
export async function getPublishedSite(domain: string, subdomain: string): Promise<PublishedSite | null> {
  const qs = new URLSearchParams({ domain, subdomain }).toString();
  return apiGetPublic<PublishedSite>(`/published?${qs}`);
}

/** Domains a project can be published to (server-driven, so the frontend
 * never hardcodes its own copy of the backend's PUBLISH_DOMAINS list). */
export async function listPublishDomains(): Promise<string[]> {
  const r = await apiGet<{ domains: string[] }>("/publish/domains");
  return r.domains;
}

/** Live availability check for the Publish dialog's debounced subdomain input. */
export async function checkPublishAvailability(domain: string, subdomain: string): Promise<PublishAvailability> {
  const qs = new URLSearchParams({ domain, subdomain }).toString();
  return apiGet<PublishAvailability>(`/publish/check?${qs}`);
}

/** Current publish state of a project (for the dialog's initial render —
 * "already published, show the URL" vs. "not published, show the picker"). */
export async function getProjectPublishState(projectId: string): Promise<ProjectPublishState> {
  const data = await apiGetOrNull<{ project: { publishDomain: string | null; subdomain: string | null } }>(
    `/projects/${projectId}`,
  );
  const domain = data?.project.publishDomain ?? null;
  const subdomain = data?.project.subdomain ?? null;
  return { domain, subdomain, url: domain && subdomain ? `https://${subdomain}.${domain}` : null };
}

/** Publish a project (owner-only, rate-limited server-side). Errors (bad
 * name, name taken, rate-limited, not-owner) surface as `{ ok: false, error }`
 * rather than throwing, so the dialog can show them inline. */
export async function publishProject(
  projectId: string,
  domain: string,
  subdomain: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const r = await apiPost<{ url: string }>(`/projects/${projectId}/publish`, { domain, subdomain });
    return { ok: true, url: r.url };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    throw e;
  }
}

/** Unpublish a project (owner-only) — frees the name and reverts visibility to private. */
export async function unpublishProject(projectId: string): Promise<{ ok: boolean }> {
  return apiPost<{ ok: true }>(`/projects/${projectId}/unpublish`);
}
