import { notFound } from "next/navigation";
import { Globe, Check, Clock, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { getCurrentUser, getPageUser } from "@/lib/auth/current-user";
import { can } from "@/lib/domain/roles";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ROOT_DOMAIN } from "@/lib/domain/constants";

export const metadata = { title: "Domain Settings" };

export default async function DomainPage() {
  const user = (await getPageUser());
  if (!can(user.role, "tenant.manage")) notFound();

  const [tenant, domains] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: user.tenantId } }),
    prisma.domain.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!tenant) notFound();

  const subdomain = `${tenant.slug}.${ROOT_DOMAIN}`;
  const customDomain = domains.find((d) => d.type === "custom");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Domain Settings</h1>
          <p className="text-muted-foreground">
            Manage your school&apos;s web address and custom domain configuration.
          </p>
        </div>
        <span className="grid size-12 place-items-center rounded-xl bg-primary/12 text-primary">
          <Globe className="size-6" />
        </span>
      </div>

      {/* Subdomain card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="size-5 text-success" />
            Your school subdomain
          </CardTitle>
          <CardDescription>
            This is your permanent, always-active address — it works even without a custom domain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" />
              <span className="font-mono font-semibold text-foreground">{subdomain}</span>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton value={`https://${subdomain}`} />
              <a
                href={`https://${subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open school portal in new tab"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Share this link with your students and teachers so they can always access the portal.
          </p>
        </CardContent>
      </Card>

      {/* Custom domain status */}
      {customDomain && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              Custom domain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4">
              <span className="font-mono font-medium">{customDomain.hostname}</span>
              <DomainStatusBadge status={customDomain.sslStatus} verified={customDomain.verified} />
            </div>
            {customDomain.txtToken && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Verification TXT record:</p>
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3 font-mono text-xs">
                  <span className="flex-1 break-all">{customDomain.txtToken}</span>
                  <CopyButton value={customDomain.txtToken} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Custom domain setup guide */}
      <Card>
        <CardHeader>
          <CardTitle>Connect a custom domain</CardTitle>
          <CardDescription>
            Point your own domain (e.g. <span className="font-mono">learn.myschool.ac.zw</span>) to
            your RoboCode.Africa portal in three steps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Step
            number={1}
            title="Add a CNAME record"
            description="Log in to your domain registrar (e.g. GoDaddy, Namecheap, Cloudflare) and create a CNAME record:"
          >
            <DnsTable
              rows={[
                { type: "CNAME", name: "learn", value: `proxy.${ROOT_DOMAIN}`, ttl: "3600" },
              ]}
            />
            <p className="text-xs text-muted-foreground">
              Replace <span className="font-mono">learn</span> with whichever subdomain you want
              (e.g. <span className="font-mono">robotics</span> or{" "}
              <span className="font-mono">@</span> for the apex domain).
            </p>
          </Step>

          <Separator />

          <Step
            number={2}
            title="Add a TXT verification record"
            description="Add this TXT record so we can confirm ownership of your domain:"
          >
            <DnsTable
              rows={[
                {
                  type: "TXT",
                  name: "_robocode-verify",
                  value: customDomain?.txtToken ?? "robocode-verify=<your-token>",
                  ttl: "3600",
                },
              ]}
            />
            <p className="text-xs text-muted-foreground">
              Your unique verification token will appear once you submit your domain to our support
              team.
            </p>
          </Step>

          <Separator />

          <Step
            number={3}
            title="Contact support"
            description="Email us at support@robocode.africa with your custom domain. We'll verify the DNS records, provision an SSL certificate, and activate your domain — typically within 24 hours."
          />

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                DNS changes can take up to 48 hours to propagate worldwide. Your subdomain{" "}
                <span className="font-mono font-medium">{subdomain}</span> always stays active in
                the meantime.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components (server-renderable)
// ---------------------------------------------------------------------------

function DomainStatusBadge({ status, verified }: { status: string; verified: boolean }) {
  if (!verified) return <Badge variant="warning">Unverified</Badge>;
  if (status === "active") return <Badge variant="success">SSL Active</Badge>;
  if (status === "failed") return <Badge variant="destructive">SSL Failed</Badge>;
  return (
    <Badge variant="secondary">
      <Clock className="size-3" /> Pending
    </Badge>
  );
}

function Step({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex shrink-0 flex-col items-center">
        <span className="grid size-8 place-items-center rounded-full bg-primary/12 text-sm font-bold text-primary">
          {number}
        </span>
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function DnsTable({
  rows,
}: {
  rows: { type: string; name: string; value: string; ttl: string }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted text-left">
            {["Type", "Name", "Value", "TTL"].map((h) => (
              <th key={h} className="px-4 py-2 font-semibold text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-4 py-2.5 font-mono font-medium text-primary">{row.type}</td>
              <td className="px-4 py-2.5 font-mono">{row.name}</td>
              <td className="px-4 py-2.5 max-w-xs break-all font-mono text-xs">{row.value}</td>
              <td className="px-4 py-2.5 font-mono text-muted-foreground">{row.ttl}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// CopyButton needs interactivity — but since this is a Server Component file,
// we can't use "use client" here. We render a native <button> with a data attr
// and use an inline script for the copy interaction, keeping the page RSC.
function CopyButton({ value }: { value: string }) {
  return (
    <button
      aria-label="Copy to clipboard"
      title="Copy"
      data-copy={value}
      onClick={undefined}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-ring"
      // Use an inline onClick script pattern via data attribute — handled by a
      // small hydrated script below. We avoid splitting a file just for this.
      suppressHydrationWarning
    >
      <Copy className="size-4" />
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `(function(){var b=document.currentScript.parentElement;b.addEventListener('click',function(){navigator.clipboard.writeText(b.dataset.copy||'');b.setAttribute('aria-label','Copied!');setTimeout(function(){b.setAttribute('aria-label','Copy to clipboard');},2000);});})();`,
        }}
      />
    </button>
  );
}
