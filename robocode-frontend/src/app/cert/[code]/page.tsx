import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { apiGetPublic } from "@/lib/api/client";
import { formatDay } from "@/lib/utils";
import { APP_NAME, ROOT_ORIGIN } from "@/lib/domain/constants";
import { PrintButton } from "./print-button";

// PUBLIC certificate verify/share page — lives outside `/app` (no sidebar
// chrome, no auth) so anyone with a certificate code (or its /cert/{code}
// link) can view and print it. Fetches via apiGetPublic (never forwards the
// viewer's own session — see src/lib/api/client.ts's doc comment on why that
// matters for a fully anonymous route) and mirrors the chromeless precedent
// in src/app/%5Fsite/[domain]/[subdomain]/page.tsx.

interface VerifyResult {
  valid: true;
  code: string;
  title: string;
  holder: string;
  trackSlug: string | null;
  issuedAt: string;
}

async function fetchCertificate(code: string): Promise<VerifyResult | null> {
  return apiGetPublic<VerifyResult>(`/certificates/verify/${encodeURIComponent(code)}`);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const cert = await fetchCertificate(code);
  if (!cert) return { title: "Certificate not found" };
  return { title: `RoboCode Certificate — ${cert.title}` };
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cert = await fetchCertificate(code);
  if (!cert) notFound();

  const verifyUrl = `${ROOT_ORIGIN}/cert/${cert.code}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 print:bg-white print:p-0">
      <div className="w-full max-w-2xl space-y-5">
        {/* Note: only Tailwind-generated utilities (never the hand-rolled
            @layer utilities helpers like .bg-dots/.text-gradient/.card-shadow)
            are mixed with print: overrides below — same-specificity custom
            CSS declared later in globals.css would otherwise win the cascade
            over an earlier-declared print: media rule and silently defeat it. */}
        <div className="rounded-2xl border-2 border-primary/30 bg-card p-10 text-center shadow-lg print:border-black print:bg-white print:shadow-none sm:p-14">
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md print:hidden">
            <GraduationCap className="size-8" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground print:text-black">
            Certificate of Completion
          </p>

          <h1 className="mt-6 text-balance font-display text-4xl font-bold text-foreground print:text-black">
            {cert.holder}
          </h1>

          <p className="mt-4 text-muted-foreground print:text-black">has successfully completed</p>
          <p className="mt-1 text-balance font-display text-2xl font-semibold text-foreground print:text-black">
            {cert.title}
          </p>

          <p className="mt-6 text-sm text-muted-foreground print:text-black">
            Issued {formatDay(cert.issuedAt, { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <div className="mx-auto mt-8 h-px w-24 bg-border print:bg-black" />

          <div className="mt-6 space-y-1 text-xs text-muted-foreground print:text-black">
            <p>
              Verify code: <span className="font-mono font-medium text-foreground print:text-black">{cert.code}</span>
            </p>
            <p className="break-all">{verifyUrl}</p>
          </div>

          <p className="mt-6 text-sm font-medium text-primary print:text-black">
            Verified by {APP_NAME} ✓ — robocode.africa
          </p>
        </div>

        <div className="flex justify-center print:hidden">
          <PrintButton />
        </div>
      </div>
    </div>
  );
}
