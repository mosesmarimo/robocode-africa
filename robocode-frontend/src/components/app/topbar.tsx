import Link from "next/link";
import { Bell, Flame, Shield, Snowflake } from "lucide-react";
import { MobileNav } from "@/components/app/mobile-nav";
import { UserMenu } from "@/components/app/user-menu";
import { PointsPill } from "@/components/app/points-pill";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { navForRole } from "@/lib/nav";

export function Topbar({
  name,
  email,
  role,
  points,
  streak,
  unread,
  brandName,
}: {
  name: string;
  email: string;
  role: string;
  points: number;
  streak: { count: number; embers?: number; frozenUntil?: string };
  unread: number;
  brandName: string;
}) {
  const embers = streak.embers ?? 0;
  // frozenUntil is a YYYY-MM-DD (UTC) date; string comparison against "today" works
  // lexically for this format. Only show the indicator while the freeze is still active.
  const todayUtc = new Date().toISOString().slice(0, 10);
  const isFrozen = !!streak.frozenUntil && streak.frozenUntil >= todayUtc;
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <MobileNav sections={navForRole(role)} brandName={brandName} />
      <div className="flex-1" />
      {streak.count >= 2 && (
        <div
          className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold sm:flex"
          title={`${streak.count}-day streak`}
        >
          <span className="flex items-center gap-1">
            <Flame className="size-4 text-orange-500" aria-hidden />
            {streak.count}
          </span>
          {embers > 0 && (
            <span
              className="flex items-center gap-0.5 text-sky-500"
              title="Embers protect your streak — miss a day and an ember keeps it alive."
            >
              <Shield className="size-3.5" aria-hidden />
              <span className="text-[11px]">×{embers}</span>
            </span>
          )}
          {isFrozen && (
            <span className="flex items-center text-sky-400" title="Streak freeze active — a missed day won't break your streak right now.">
              <Snowflake className="size-3.5" aria-hidden />
            </span>
          )}
        </div>
      )}
      {role === "student" && <PointsPill points={points} />}
      <ThemeToggle />
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
