import { notFound } from "next/navigation";
import { Palette } from "lucide-react";
import { apiGet, ApiError } from "@/lib/api/client";
import { BrandingForm } from "@/components/school/branding-form";

export const metadata = { title: "School Branding" };

interface BrandingData {
  schoolName: string;
  initial: {
    primary: string;
    secondary: string;
    accent: string;
    tagline: string;
    logoUrl: string;
  };
}

export default async function BrandingPage() {
  let data: BrandingData;
  try {
    data = await apiGet<BrandingData>("/school/branding");
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const { schoolName, initial } = data;

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

      <BrandingForm schoolName={schoolName} initial={initial} />
    </div>
  );
}
