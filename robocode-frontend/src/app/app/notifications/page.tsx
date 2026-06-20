import { Bell, Award, TrendingUp, UserCheck, Info } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { apiGet } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelative } from "@/lib/utils";
import { MarkAllReadButton } from "@/components/notifications/notif-actions";

export const metadata = { title: "Notifications" };

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

function notifIcon(type: string) {
  switch (type) {
    case "approval":
      return <UserCheck className="size-5" />;
    case "badge":
      return <Award className="size-5" />;
    case "level_up":
      return <TrendingUp className="size-5" />;
    default:
      return <Info className="size-5" />;
  }
}

function notifIconTone(type: string) {
  switch (type) {
    case "approval":
      return "bg-success/15 text-success";
    case "badge":
      return "bg-accent/18 text-accent-foreground";
    case "level_up":
      return "bg-primary/12 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default async function NotificationsPage() {
  await getPageUser();

  const { notifications, unreadCount } = await apiGet<NotificationsResponse>("/notifications");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
              : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Bell className="size-7" />
          </span>
          <p className="font-medium">No notifications yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            When something happens — a badge earned, a level up, or an approval — it will appear here.
          </p>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-4 px-5 py-4 transition-colors",
                  !n.readAt && "bg-primary/5"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl",
                    notifIconTone(n.type)
                  )}
                  aria-hidden
                >
                  {notifIcon(n.type)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium leading-snug">{n.title}</p>
                    {!n.readAt && (
                      <span
                        className="inline-block size-2 shrink-0 rounded-full bg-primary"
                        aria-label="Unread"
                      />
                    )}
                  </div>
                  {n.body && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {formatRelative(n.createdAt)}
                  </p>
                </div>

                <Badge
                  variant="muted"
                  className="mt-0.5 shrink-0 capitalize"
                >
                  {n.type.replace(/_/g, " ")}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
