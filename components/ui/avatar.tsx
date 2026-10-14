"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cn } from "@/lib/utils";

function Avatar({
  className,
  size = "default",
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: "default" | "sm" | "lg";
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex size-8 shrink-0 rounded-[10px] select-none overflow-hidden data-[size=lg]:size-10 data-[size=sm]:size-6",
        className,
      )}
      {...props}
    />
  );
}

export function getDiceBearAvatar(seed?: string | null): string {
  const cleanSeed = (seed || "lshorter-user").toString().trim() || "lshorter-user";
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(cleanSeed)}`;
}

function AvatarImage({
  className,
  src,
  alt,
  ...props
}: AvatarPrimitive.Image.Props & { seed?: string }) {
  if (!src || (typeof src === "string" && src.trim().length === 0)) {
    return null;
  }

  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      src={src}
      alt={alt || "Avatar"}
      className={cn(
        "aspect-square size-full rounded-[10px] object-cover",
        className,
      )}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  children,
  ...props
}: AvatarPrimitive.Fallback.Props & { seed?: string }) {
  const seedVal = props.seed;
  const fallbackText = React.useMemo(() => {
    if (typeof children === "string" && children.trim().length > 0) {
      return children.trim();
    }
    if (seedVal && typeof seedVal === "string" && seedVal.trim().length > 0) {
      const clean = seedVal.trim().replace(/^https?:\/\//i, "");
      const parts = clean.split(/[@\s._-]+/).filter(Boolean);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return clean.slice(0, 2).toUpperCase();
    }
    return null;
  }, [children, seedVal]);

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-[10px] bg-gradient-to-tr from-[#0066FF] to-[#7592FF] text-white font-bold tracking-wider select-none overflow-hidden text-xs uppercase",
        className,
      )}
      {...props}
    >
      {fallbackText ? (
        <span>{fallbackText}</span>
      ) : children ? (
        children
      ) : (
        <span className="text-[10px]">LS</span>
      )}
    </AvatarPrimitive.Fallback>
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
};

