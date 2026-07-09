import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, cn } from "@/lib/utils";

interface UserAvatarProps {
  user: { id?: string; displayName: string; avatarSeed?: string | null };
  size?: number;
  href?: string;
  className?: string;
}

/** Avatar + initials fallback. Optionally wraps in a link to the user's profile. */
export function UserAvatar({ user, size = 40, href, className }: UserAvatarProps) {
  const dimension = { width: size, height: size };
  const fontSize = size <= 28 ? "text-[10px]" : size >= 64 ? "text-xl" : "text-sm";

  const avatar = (
    <Avatar className={cn("shrink-0", className)} style={dimension}>
      <AvatarFallback className={cn("font-semibold", fontSize)}>
        {initials(user.displayName)}
      </AvatarFallback>
    </Avatar>
  );

  const link = href ?? (user.id ? `/app/u/${user.id}` : undefined);
  if (link) {
    return (
      <Link href={link} className="shrink-0">
        {avatar}
      </Link>
    );
  }
  return avatar;
}
