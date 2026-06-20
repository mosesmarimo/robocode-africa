import Link from "next/link";
import { Bell } from "lucide-react";
import { MobileNav } from "@/components/app/mobile-nav";
import { UserMenu } from "@/components/app/user-menu";
import { PointsPill } from "@/components/app/points-pill";
import { navForRole } from "@/lib/nav";

export function Topbar({
  name,
  email,
  role,
  points,
  unread,
  brandName,
}: {
  name: string;
  email: string;
  role: string;
  points: number;
  unread: number;
  brandName: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <MobileNav sections={navForRole(role)} brandName={brandName} />
      <div className="flex-1" />
      {role === "student" && <PointsPill points={points} />}
      <Link
        href="/app/notifications"
        className="relative grid size-10 place-items-center rounded-full hover:bg-muted"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
      <UserMenu name={name} email={email} role={role} />
    </header>
  );
}
