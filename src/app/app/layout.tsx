import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { brandFromTenant } from "@/lib/tenant";
import { BrandStyle } from "@/components/brand-style";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status !== "active") redirect("/pending");

  const brand = brandFromTenant(user.tenant?.branding);
  const brandName = user.tenant?.name ?? "RoboCode.Africa";
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });

  return (
    <div className="flex min-h-screen">
      <BrandStyle brand={brand} />
      <Sidebar role={user.role} brandName={brandName} logoUrl={brand.logoUrl} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          name={user.displayName}
          email={user.email}
          role={user.role}
          points={user.roboPoints}
          unread={unread}
          brandName={brandName}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
