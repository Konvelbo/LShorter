"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function getDiceBearAvatar(seed?: string | null): string {
  const cleanSeed = (seed || "lshorter-user").toString().trim() || "lshorter-user";
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(cleanSeed)}`;
}

type AvatarStatus = "idle" | "loading" | "loaded" | "error";

interface AvatarContextValue {
  status: AvatarStatus;
  setStatus: React.Dispatch<React.SetStateAction<AvatarStatus>>;
}

const AvatarContext = React.createContext<AvatarContextValue | null>(null);

function useAvatarContext() {
  return React.useContext(AvatarContext);
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "sm" | "lg";
}

function Avatar({
  className,
  size = "default",
  children,
  ...props
}: AvatarProps) {
  const [status, setStatus] = React.useState<AvatarStatus>("idle");

  return (
    <AvatarContext.Provider value={{ status, setStatus }}>
      <div
        data-slot="avatar"
        data-size={size}
        className={cn(
          "group/avatar relative flex size-8 shrink-0 rounded-[10px] select-none overflow-hidden data-[size=lg]:size-10 data-[size=sm]:size-6",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </AvatarContext.Provider>
  );
}

export interface AvatarImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  seed?: string;
}

function AvatarImage({
  className,
  src,
  alt = "Avatar",
  seed,
  onLoad,
  onError,
  ...props
}: AvatarImageProps) {
  const context = useAvatarContext();
  const setStatus = context?.setStatus;
  const imgRef = React.useRef<HTMLImageElement>(null);

  const primarySrc = typeof src === "string" ? src.trim() : "";
  const fallbackSrc = seed ? getDiceBearAvatar(seed) : "";
  const [currentSrc, setCurrentSrc] = React.useState<string>(primarySrc || fallbackSrc);

  React.useEffect(() => {
    const nextSrc = primarySrc || fallbackSrc;
    setCurrentSrc(nextSrc);
    if (nextSrc) {
      setStatus?.("loading");
    } else {
      setStatus?.("idle");
    }
  }, [primarySrc, fallbackSrc, setStatus]);

  React.useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setStatus?.("loaded");
    }
  }, [currentSrc, setStatus]);

  if (!currentSrc || context?.status === "error") {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      data-slot="avatar-image"
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      loading="eager"
      decoding="async"
      onLoad={(e) => {
        setStatus?.("loaded");
        onLoad?.(e);
      }}
      onError={(e) => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          setStatus?.("loading");
        } else {
          setStatus?.("error");
          onError?.(e);
        }
      }}
      className={cn(
        "aspect-square size-full rounded-[10px] object-cover transition-opacity duration-150",
        context?.status === "loaded" ? "opacity-100" : "opacity-0",
        className
      )}
      {...props}
    />
  );
}

export interface AvatarFallbackProps
  extends React.HTMLAttributes<HTMLDivElement> {
  seed?: string;
}

function AvatarFallback({
  className,
  children,
  seed,
  ...props
}: AvatarFallbackProps) {
  const context = useAvatarContext();

  if (context?.status === "loaded") {
    return null;
  }

  const fallbackText = React.useMemo(() => {
    if (typeof children === "string" && children.trim().length > 0) {
      return children.trim();
    }
    if (React.isValidElement(children) && typeof (children.props as any)?.children === "string") {
      const inner = (children.props as any).children.trim();
      if (inner.length > 0) return inner;
    }
    if (seed && typeof seed === "string" && seed.trim().length > 0) {
      const clean = seed.trim().replace(/^https?:\/\//i, "");
      const parts = clean.split(/[@\s._-]+/).filter(Boolean);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return clean.slice(0, 2).toUpperCase();
    }
    return null;
  }, [children, seed]);

  return (
    <div
      data-slot="avatar-fallback"
      suppressHydrationWarning
      className={cn(
        "flex size-full items-center justify-center rounded-[10px] bg-gradient-to-tr from-[#0066FF] to-[#7592FF] text-white font-bold tracking-wider select-none overflow-hidden text-xs uppercase",
        className
      )}
      {...props}
    >
      {fallbackText ? (
        <span suppressHydrationWarning>{fallbackText}</span>
      ) : children ? (
        typeof children === "string" ? (
          <span suppressHydrationWarning>{children}</span>
        ) : (
          children
        )
      ) : (
        <span suppressHydrationWarning className="text-[10px]">
          LS
        </span>
      )}
    </div>
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
        className
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
        className
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
        className
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
