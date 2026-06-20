import { notFound } from "next/navigation";
import { Palette } from "lucide-react";
import { getCurrentUser, getPageUser } from "@/lib/auth/current-user";
import { can } from "@/lib/domain/roles";
import { prisma } from "@/lib/prisma";
import { BrandingForm } from "@/components/school/branding-form";

export const metadata = { title: "School Branding" };

export default async function BrandingPage() {
  const user = (await getPageUser());
  if (!can(user.role, "tenant.manage")) notFound();

  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
  if (!tenant) notFound();

  const branding = (tenant.branding ?? {}) as {
    primary?: string;
    secondary?: string;
    accent?: string;
    tagline?: string;
    logoUrl?: string;
  };

  const initial = {
    primary: branding.primary ?? "#6d28d9",
    secondary: branding.secondary ?? "#0ea5e9",
    accent: branding.accent ?? "#f59e0b",
    tagline: branding.tagline ?? "",
    logoUrl: branding.logoUrl ?? "",
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">School Branding</h1>
          <p className="text-muted-foreground">
            Personalise your school&apos;s portal with your colours, logo and tagline.
          </p>
        </div>
        <span className="grid size-12 place-items-center rounded-xl bg-primary/12 text-primary">
          <Palette className="size-6" />
        </span>
      </div>

      <BrandingForm schoolName={tenant.name} initial={initial} />
    </div>
  );
}
