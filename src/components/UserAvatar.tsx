import { cn } from "@/lib/utils";
import { getDeterministicColor, getInitials } from "@/lib/avatarUtils";

interface UserAvatarProps {
  src?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Seed for deterministic fallback color (userId or email) */
  seed?: string;
}

const sizeClasses: Record<string, string> = {
  xs: "w-4 h-4 text-[8px]",
  sm: "w-5 h-5 text-[9px]",
  md: "w-6 h-6 text-[10px]",
  lg: "w-7 h-7 text-[10px]",
  xl: "w-8 h-8 text-[11px]",
};

const profileSizes: Record<string, string> = {
  profile: "w-16 h-16 md:w-20 md:h-20 text-xl",
  modal: "w-16 h-16 text-lg",
};

const UserAvatar = ({ src, name, size = "md", className, seed }: UserAvatarProps) => {
  const initials = getInitials(name);
  const sizeClass = sizeClasses[size] || profileSizes[size] || sizeClasses.md;
  const { bg, fg } = getDeterministicColor(seed || name);

  if (src) {
    return (
      <img
        src={src}
        alt={name || "User"}
        className={cn("rounded-full object-cover flex-shrink-0", sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold flex-shrink-0",
        sizeClass,
        className
      )}
      style={{ backgroundColor: bg, color: fg }}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
