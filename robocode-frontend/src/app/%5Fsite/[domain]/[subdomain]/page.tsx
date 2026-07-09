import type { Metadata } from "next";
import { getPublishedSite } from "@/lib/publish/actions";
import { getBoard } from "@/lib/domain/boards";
import { emptyDiagram, type Diagram } from "@/lib/domain/diagram";
import { generateReadme } from "@/lib/studio/readme";
import type { StudioFile } from "@/lib/studio/store";
import { PublishedSiteClient } from "@/components/site/published-site-client";
import { ROOT_ORIGIN, APP_NAME } from "@/lib/domain/constants";

/**
 * Monaco language id from a file extension — a local copy of
 * src/lib/studio/store.ts's langForFile(). That file has a top-level "use
 * client" directive, so its exports are client references when imported into
 * a Server Component: importing the *type* is fine, but actually CALLING the
 * function throws at runtime ("Attempted to call langForFile() from the
 * server but langForFile is on the client") even though `tsc` sees no
 * problem — /p/[shareId]/page.tsx does the same import, but is never bitten
 * because its call site is `f.language || langForFile(...)` and seeded/real
 * code files always have a language, so the call is short-circuited away.
 * This page calls it unconditionally (the published payload has no
 * `language` field at all), so it needs its own, non-"use client" copy.
 */
function inferLang(name: string): string {
  switch (name.split(".").pop()?.toLowerCase()) {
    case "ino":
    case "cpp":
    case "cc":
    case "h":
    case "hpp":
    case "c":
      return "cpp";
    case "py":
      return "python";
    case "json":
      return "json";
    case "md":
      return "markdown";
    default:
      return "plaintext";
  }
}

/**
 * Order files for display: sketch (.ino/.py) first, README last, the rest
 * between. Mirrors /p/[shareId]/page.tsx's buildFiles for a robotics
 * project, adapted for the published payload's simpler {name, content} shape
 * (no `language` field — inferred here via inferLang, see its doc comment).
 */
function buildStudioFiles(raw: { name: string; content: string }[], title: string, board: string, diagram: Diagram): StudioFile[] {
  const files: StudioFile[] = raw.map((f) => ({ name: f.name, language: inferLang(f.name), content: f.content }));
  if (!files.some((f) => f.name.endsWith(".ino") || f.name.endsWith(".py"))) {
    files.unshift({ name: "sketch.ino", language: "cpp", content: getBoard(board).starterCode });
  }
  if (!files.some((f) => f.name.toLowerCase() === "readme.md")) {
    files.push({ name: "README.md", language: "markdown", content: generateReadme(title, diagram) });
  }
  return files.sort((a, b) => {
    const rank = (n: string) => (n.endsWith(".ino") || n.endsWith(".py") ? 0 : n.toLowerCase() === "readme.md" ? 2 : 1);
    return rank(a.name) - rank(b.name);
  });
}

type SiteParams = { domain: string; subdomain: string };

export async function generateMetadata({ params }: { params: Promise<SiteParams> }): Promise<Metadata> {
  const { domain, subdomain } = await params;
  const site = await getPublishedSite(domain, subdomain);
  // Plain strings here flow through the root layout's `%s · ${APP_NAME}`
  // title template, so no need to append APP_NAME again ourselves.
  if (!site) return { title: "Not published" };
  return {
    title: site.title,
    description: `A project published on ${APP_NAME} by ${site.ownerDisplayName}.`,
  };
}

/** Friendly "not published" state for an unknown/unpublished/taken-down name — never a bare 404. */
function NotPublished() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div className="max-w-sm">
        <p className="text-lg font-semibold">This site isn&apos;t published.</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          The project may have been unpublished, or the address doesn&apos;t exist.
        </p>
        <a
          href={ROOT_ORIGIN}
          className="mt-5 inline-block rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white shadow-md"
        >
          Go to {APP_NAME}
        </a>
      </div>
    </div>
  );
}

export default async function PublishedSitePage({ params }: { params: Promise<SiteParams> }) {
  const { domain, subdomain } = await params;
  const site = await getPublishedSite(domain, subdomain);

  if (!site) return <NotPublished />;

  const diagram = (site.diagram as unknown as Diagram) ?? emptyDiagram(site.boardType);
  const joinHref = `${ROOT_ORIGIN}/join?ref=${encodeURIComponent(site.ownerReferralCode ?? "")}`;

  return (
    <PublishedSiteClient
      data={{
        title: site.title,
        kind: site.kind,
        board: site.boardType,
        diagram,
        studioFiles: site.kind === "robotics" ? buildStudioFiles(site.files, site.title, site.boardType, diagram) : [],
        codeFiles: site.files,
        joinHref,
      }}
    />
  );
}
