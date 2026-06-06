import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveAvatarUrl, userInitials } from "@/lib/avatar";

type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
};

export function UserAvatar({ name, avatarUrl, className, fallbackClassName }: UserAvatarProps) {
  const src = resolveAvatarUrl(avatarUrl);

  return (
    <Avatar className={className}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback className={fallbackClassName}>{userInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
