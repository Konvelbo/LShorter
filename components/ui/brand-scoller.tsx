"use client";

import React from "react";
import { BsLinkedin } from "react-icons/bs";
import {
  SiDiscord,
  SiFacebook,
  SiGoogleads,
  SiGoogleanalytics,
  SiHubspot,
  SiInstagram,
  SiMeta,
  SiPinterest,
  SiReddit,
  SiSnapchat,
  SiSpotify,
  SiTelegram,
  SiThreads,
  SiTiktok,
  SiTwitch,
  SiX,
  SiYoutube,
} from "react-icons/si";
import { cn } from "@/lib/utils";

export interface BrandScrollerProps {
  showLabels?: boolean;
  iconSize?: number;
  duration?: string;
  className?: string;
}

const TRACKED_BRANDS: Array<{
  id: string;
  name: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: "x", name: "X", Icon: SiX },
  { id: "instagram", name: "Instagram", Icon: SiInstagram },
  { id: "tiktok", name: "TikTok", Icon: SiTiktok },
  { id: "youtube", name: "YouTube", Icon: SiYoutube },
  { id: "reddit", name: "Reddit", Icon: SiReddit },
  { id: "twitch", name: "Twitch", Icon: SiTwitch },
  { id: "spotify", name: "Spotify", Icon: SiSpotify },
  { id: "linkedin", name: "LinkedIn", Icon: BsLinkedin },
  { id: "pinterest", name: "Pinterest", Icon: SiPinterest },
  { id: "threads", name: "Threads", Icon: SiThreads },
  { id: "telegram", name: "Telegram", Icon: SiTelegram },
  { id: "discord", name: "Discord", Icon: SiDiscord },
  { id: "snapchat", name: "Snapchat", Icon: SiSnapchat },
  { id: "facebook", name: "Facebook", Icon: SiFacebook },
  { id: "meta", name: "Meta Ads", Icon: SiMeta },
  { id: "google-ads", name: "Google Ads", Icon: SiGoogleads },
  { id: "google-analytics", name: "Google Analytics", Icon: SiGoogleanalytics },
  { id: "hubspot", name: "HubSpot", Icon: SiHubspot },
];

function BrandRowItems({
  showLabels,
  iconSize,
  copyIndex,
}: {
  showLabels: boolean;
  iconSize: number;
  copyIndex: number;
}) {
  return (
    <>
      {TRACKED_BRANDS.map(({ id, name, Icon }) => (
        <div
          key={`${copyIndex}-${id}`}
          title={name}
          aria-label={copyIndex === 0 ? name : undefined}
          aria-hidden={copyIndex > 0 ? true : undefined}
          className={cn(
            "flex items-center shrink-0 text-[#312E81]/45 dark:text-[#C7D2FE]/45 hover:text-[#312E81]/90 dark:hover:text-white transition-all duration-200 hover:scale-110 select-none",
            showLabels ? "gap-3" : "justify-center"
          )}
        >
          <Icon size={iconSize} className="shrink-0" />
          {showLabels && (
            <p className="text-[15px] font-semibold tracking-[-0.01em] whitespace-nowrap">
              {name}
            </p>
          )}
        </div>
      ))}
    </>
  );
}

export const BrandScroller = ({
  showLabels = false,
  iconSize = 32,
  duration = "64s",
  className,
}: BrandScrollerProps) => {
  return (
    <div
      style={
        {
          "--duration": duration,
        } as React.CSSProperties
      }
      className={cn(
        "group flex overflow-hidden py-3 [--gap:4rem] sm:[--gap:5rem] gap-[var(--gap)] flex-row max-w-full [mask-image:linear-gradient(to_right,rgba(0,0,0,0),rgba(0,0,0,1)_10%,rgba(0,0,0,1)_90%,rgba(0,0,0,0))]",
        className
      )}
    >
      {Array(4)
        .fill(0)
        .map((_, i) => (
          <div
            className="flex shrink-0 justify-around gap-[var(--gap)] animate-brand-marquee flex-row"
            key={i}
          >
            <BrandRowItems
              showLabels={showLabels}
              iconSize={iconSize}
              copyIndex={i}
            />
          </div>
        ))}
    </div>
  );
};

export const BrandScrollerReverse = ({
  showLabels = false,
  iconSize = 32,
  duration = "64s",
  className,
}: BrandScrollerProps) => {
  return (
    <div
      style={
        {
          "--duration": duration,
        } as React.CSSProperties
      }
      className={cn(
        "group flex overflow-hidden py-3 [--gap:4rem] sm:[--gap:5rem] gap-[var(--gap)] flex-row max-w-full [mask-image:linear-gradient(to_right,rgba(0,0,0,0),rgba(0,0,0,1)_10%,rgba(0,0,0,1)_90%,rgba(0,0,0,0))]",
        className
      )}
    >
      {Array(4)
        .fill(0)
        .map((_, i) => (
          <div
            className="flex shrink-0 justify-around gap-[var(--gap)] animate-brand-marquee-reverse flex-row"
            key={i}
          >
            <BrandRowItems
              showLabels={showLabels}
              iconSize={iconSize}
              copyIndex={i}
            />
          </div>
        ))}
    </div>
  );
};

export default BrandScroller;
