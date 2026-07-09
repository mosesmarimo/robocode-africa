import "server-only";

// Server-only reads for Learning Tracks (curated course+challenge paths) and
// the certificates issued on completion — mirrors
// robocode-backend/src/modules/tracks/tracks.service.ts response shapes
// exactly. Progress is always derived on the backend; these types are a
// read-only projection, never written back.
import { apiGet, apiGetOrNull } from "@/lib/api/client";

/** GET /tracks — one row per published track, for the index page's cards. */
export interface TrackSummary {
  slug: string;
  title: string;
  description: string;
  track: string;
  language: string | null;
  level: string;
  icon: string | null;
  itemCount: number;
  doneCount: number;
  certificate: { code: string; issuedAt: string } | null;
}

/** A single step in a track's roadmap — either a course or a challenge. */
export interface TrackDetailItem {
  type: "course" | "challenge";
  slug: string;
  title: string;
  language: string | null;
  level?: string;
  difficulty?: string;
  done: boolean;
  /** The first not-done item — the roadmap's soft "next up" pointer. */
  current: boolean;
}

/** GET /tracks/:slug — a track's full roadmap with per-item done/current state. */
export interface TrackDetail {
  slug: string;
  title: string;
  description: string;
  track: string;
  language: string | null;
  level: string;
  icon: string | null;
  progress: { done: number; total: number; percent: number };
  certificate: { code: string; issuedAt: string } | null;
  items: TrackDetailItem[];
}

/** GET /certificates — one row per certificate the current user has earned (used by Task 5). */
export interface MyCertificate {
  code: string;
  title: string;
  kind: string;
  trackSlug: string | null;
  issuedAt: string;
}

/** Published tracks with derived progress + certificate (if earned), in backend order. */
export async function getTracks(): Promise<TrackSummary[]> {
  const { tracks } = await apiGet<{ tracks: TrackSummary[] }>("/tracks");
  return tracks;
}

/** A single track's roadmap, or null if the slug is unknown/unpublished (404). */
export async function getTrack(slug: string): Promise<TrackDetail | null> {
  return apiGetOrNull<TrackDetail>(`/tracks/${encodeURIComponent(slug)}`);
}
