"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DrawerSwitch } from "../drawer-switch";

interface SectionAdvancedProps {
  redirectType: "302" | "301" | "307";
  setRedirectType: (type: "302" | "301" | "307") => void;
  passParams: boolean;
  setPassParams: React.Dispatch<React.SetStateAction<boolean>>;
  isActive?: boolean;
  setIsActive?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SectionAdvanced({
  redirectType,
  setRedirectType,
  passParams,
  setPassParams,
  isActive = true,
  setIsActive,
}: SectionAdvancedProps) {
  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#131417] dark:text-[#f1f2f4]">
          Advanced
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Redirect status codes, query parameters forwarding, and link availability status.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-[#22242a]">
        {/* 1. HTTP REDIRECTION CODE */}
        <div className="py-4">
          <label className="block text-sm font-semibold text-zinc-900 dark:text-[#f1f2f4] mb-2">
            Redirect type
          </label>
          <div className="flex gap-1.5 p-1 rounded-lg bg-zinc-100 dark:bg-[#16181d] border border-zinc-200 dark:border-[#22242a]">
            {[
              { code: "302", label: "302 Temporary" },
              { code: "301", label: "301 Permanent" },
              { code: "307", label: "307 Strict" },
            ].map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setRedirectType(item.code as any)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all text-center cursor-pointer",
                  redirectType === item.code
                    ? "bg-white dark:bg-[#0e0f12] text-zinc-900 dark:text-[#f1f2f4] shadow-sm border border-[#1d5fe0] dark:border-[#3b82f6] font-semibold"
                    : "text-zinc-600 dark:text-[#8a8f9a] hover:text-zinc-900 dark:hover:text-[#f1f2f4]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
            {redirectType === "302" &&
              "302 keeps click counts accurate and avoids aggressive browser caching. Recommended for most links."}
            {redirectType === "301" &&
              "301 passes SEO link equity permanently. Browsers cache this redirect locally."}
            {redirectType === "307" &&
              "307 strictly preserves HTTP method (GET, POST). Ideal for webhooks and APIs."}
          </p>
        </div>

        {/* 2. FORWARD QUERY PARAMETERS */}
        <div className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-sm font-semibold text-zinc-900 dark:text-[#f1f2f4]">
                Forward query parameters
              </span>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Pass ?ref=… and additional query strings on to the destination URL.
              </p>
            </div>
            <DrawerSwitch
              checked={passParams}
              onChange={setPassParams}
              aria-label="Toggle query parameter forwarding"
            />
          </div>
        </div>

        {/* 3. LINK IS ACTIVE */}
        {setIsActive && (
          <div className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-semibold text-zinc-900 dark:text-[#f1f2f4]">
                  Link is active
                </span>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  Turn off to pause the redirect and show a suspension notice.
                </p>
              </div>
              <DrawerSwitch
                checked={isActive}
                onChange={setIsActive}
                aria-label="Toggle active status"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export { SectionAdvanced as SectionBannerAdvanced };
