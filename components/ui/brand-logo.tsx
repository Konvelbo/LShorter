"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export function BrandLogo({
  className = "",
  size = 32,
  showText = true,
  textClassName = "",
}: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 select-none", className)}>
      <div
        className="relative overflow-hidden rounded-[8px] shrink-0 shadow-xs"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.svg"
          alt="LShorter Logo"
          width={size}
          height={size}
          className="w-full h-full object-contain"
          priority
        />
      </div>
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight text-[17px]",
            textClassName
          )}
        >
          LShorter
        </span>
      )}
    </div>
  );
}

export function BrandLogoIcon({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[8px] shrink-0 shadow-xs",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.svg"
        alt="LShorter Logo"
        width={size}
        height={size}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
}
