import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { brandFromTenant } from "@/lib/tenant";
import { BrandStyle } from "@/components/brand-style";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status !== "active") redirect("/pending");
  const brand = brandFromTenant(user.tenant?.branding);
  return (
    <>
      <BrandStyle brand={brand} />
      {children}
    </>
  );
}
