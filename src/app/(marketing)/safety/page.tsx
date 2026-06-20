import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Bell,
  MessageSquare,
  Eye,
  Lock,
  Globe,
  AlertTriangle,
  FileText,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Safety & Privacy",
  description:
    "RoboCode.Africa's commitment to child safety — mandatory approvals, parental consent, moderated communication, data minimisation and COPPA/GDPR-K/POPIA compliance.",
};

const COMMITMENTS = [
  {
    icon: UserCheck,
    title: "Mandatory account approvals",
    badge: "Access control",
    badgeVariant: "default" as const,
    body: [
      "No student can access any content until a verified teacher or school administrator approves their account.",
      "Approval decisions are logged with a full audit trail — who approved, when and why.",
      "Rejected accounts receive a clear reason and can re-apply after correction.",
      "Platform moderators provide a secondary layer of oversight for all school tenants.",
    ],
  },
  {
    icon: Bell,
    title: "Parental consent for minors",
    badge: "COPPA / GDPR-K",
    badgeVariant: "secondary" as const,
    body: [
      "Any student who is under 13 (or where the platform is unable to verify age) triggers an automatic email to the guardian address provided at registration.",
      "The student account is locked to read-only until the guardian clicks the consent link.",
      "Guardians can revoke consent at any time, which immediately suspends the account.",
      "Consent records are stored securely and available on request.",
    ],
  },
  {
    icon: MessageSquare,
    title: "Moderated communication",
    badge: "Chat safety",
    badgeVariant: "success" as const,
    body: [
      "Team chat is the only in-platform communication channel — no direct messaging between students.",
      "All chat messages pass through a content-filter before delivery. Flagged messages are held for human review.",
      "Accounts that repeatedly send inappropriate content are automatically suspended pending admin review.",
      "No external links are rendered in chat — only plain text.",
    ],
  },
  {
    icon: Lock,
    title: "Data minimisation",
    badge: "Privacy by design",
    badgeVariant: "outline" as const,
    body: [
      "We collect only the fields required for learning: name, email, school, and learning progress.",
      "No advertising, no interest profiling, no third-party tracking pixels on any page used by students.",
      "Uploaded files (e.g. avatars) are scanned for malware and stored in isolated, access-controlled buckets.",
      "Data is encrypted at rest (AES-256) and in transit (TLS 1.3+).",
    ],
  },
  {
    icon: Eye,
    title: "Transparent audit trail",
    badge: "Accountability",
    badgeVariant: "muted" as const,
    body: [
      "Every meaningful action in the platform generates an immutable audit log entry — account changes, approvals, content actions, moderation decisions.",
      "School admins can access their tenant audit log at any time. Platform staff can access the global log.",
      "Logs are retained for a minimum of 12 months for compliance purposes.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Incident reporting & escalation",
    badge: "Rapid response",
    badgeVariant: "warning" as const,
    body: [
      "Any user can report a concern via the in-app flag button. Reports go directly to our moderation queue.",
      "Serious incidents (suspected abuse, harm to minors) are escalated to a dedicated safeguarding officer within 2 hours.",
      "We cooperate fully with lawful requests from law enforcement and child protection agencies.",
      "We publish a transparency report annually detailing moderation actions taken.",
    ],
  },
] as const;

const REGULATIONS = [
  {
    name: "COPPA",
    full: "Children's Online Privacy Protection Act (USA)",
    points: [
      "Parental consent required for children under 13",
      "No behavioural advertising to minors",
      "Parental access to and deletion of child data on request",
    ],
  },
  {
    name: "GDPR-K",
    full: "General Data Protection Regulation — child provisions (EU / UK)",
    points: [
      "Age-appropriate design enforced at platform level",
      "Data minimisation and purpose limitation",
      "Right to erasure ('right to be forgotten') supported",
    ],
  },
  {
    name: "POPIA",
    full: "Protection of Personal Information Act (South Africa)",
    points: [
      "Lawful processing with explicit consent",
      "Information Officer appointed",
      "Breach notification within 72 hours of discovery",
    ],
  },
  {
    name: "Zim DPA",
    full: "Data Protection Act 2021 (Zimbabwe)",
    points: [
      "Registration of processing activities with the Cyber & Data Protection Authority",
      "Cross-border transfer restrictions respected",
      "User rights to access, correction and deletion honoured",
    ],
  },
] as const;

export default function SafetyPage() {
  return (
    <div className="space-y-0">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-grid px-6 pb-16 pt-20 text-center">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-success/30 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <span className="mb-5 inline-grid size-16 place-items-center rounded-2xl bg-success/15 text-success shadow-lg">
            <ShieldCheck className="size-8" />
          </span>
          <Badge variant="success" className="mb-4 block w-fit mx-auto">Child safety first</Badge>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Safety &amp; Privacy
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            RoboCode.Africa was built from day one for young learners. Every architectural decision — accounts, communication, data storage — was designed to protect children, not as an afterthought.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
            {["COPPA", "GDPR-K", "POPIA", "Zim DPA"].map((r) => (
              <span key={r} className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-success" /> {r} aligned
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Commitments ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Our commitments to you</h2>
            <p className="mt-2 text-muted-foreground">
              Six pillars of child safety — each backed by technical controls, not just policy.
            </p>
          </div>
          <div className="space-y-6">
            {COMMITMENTS.map((c) => (
              <Card key={c.title} className="overflow-hidden transition-all hover:shadow-lg">
                <CardContent className="flex gap-5 p-6">
                  <span className="mt-0.5 grid size-12 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
                    <c.icon className="size-6" />
                  </span>
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                      <Badge variant={c.badgeVariant}>{c.badge}</Badge>
                    </div>
                    <ul className="space-y-2">
                      {c.body.map((point) => (
                        <li key={point} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* ── Regulatory compliance ── */}
      <section id="compliance" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 flex flex-col items-center gap-3 text-center">
            <span className="grid size-12 place-items-center rounded-xl bg-primary/12 text-primary">
              <Globe className="size-6" />
            </span>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Regulatory compliance</h2>
            <p className="max-w-xl text-muted-foreground">
              We operate across multiple jurisdictions and meet the child-protection provisions of each.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {REGULATIONS.map((r) => (
              <Card key={r.name} className="p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="default" className="mb-1">{r.name}</Badge>
                    <p className="text-xs text-muted-foreground leading-snug">{r.full}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                      {p}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            We regularly review our practices against evolving regulations and engage external legal counsel in each jurisdiction. Our full privacy policy is available at{" "}
            <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">/privacy</Link>.
          </p>
        </div>
      </section>

      {/* ── Contact & reporting ── */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h2 className="font-display text-2xl font-bold">Report a concern</h2>
            <p className="mt-2 text-muted-foreground">
              If you have witnessed or suspect any harm to a child on our platform, please contact us immediately.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: AlertTriangle,
                title: "In-app report",
                desc: "Use the flag button on any content or profile to file an instant report to our moderation queue.",
              },
              {
                icon: Phone,
                title: "Safeguarding officer",
                desc: "Email safety@robocode.africa — serious incidents are escalated within 2 hours, 24/7.",
              },
              {
                icon: FileText,
                title: "Data requests",
                desc: "Parents and guardians: email privacy@robocode.africa for access, correction or deletion of a child's data.",
              },
            ].map((item) => (
              <Card key={item.title} className="p-5 text-center">
                <span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-success/15 text-success">
                  <item.icon className="size-5" />
                </span>
                <h3 className="font-display text-sm font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Confident in our commitment?</h2>
          <p className="mt-3 text-muted-foreground">
            Join thousands of schools and families who trust RoboCode.Africa as a safe STEM learning environment.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="gradient" asChild>
              <Link href="/signup">Get started <ArrowRight className="size-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/for-schools">For schools</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
