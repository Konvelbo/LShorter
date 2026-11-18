"use client";

import * as React from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  BarChart3,
  Globe2,
  DollarSign,
  MonitorSmartphone,
  QrCode,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BorderBeam } from "@/components/ui/border-beam";
import { withScreenshotCacheBuster } from "@/lib/themed-screenshots";

export interface HeroShowcaseTab {
  id: string;
  title: string;
  icon: React.ReactNode;
  image: {
    light: string;
    dark: string;
    alt: string;
  };
}

export const DEFAULT_HERO_SHOWCASE_TABS: HeroShowcaseTab[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    image: {
      light: withScreenshotCacheBuster(
        "/screenshots/light/dashboard/dashboard_normal_4k.webp"
      ),
      dark: withScreenshotCacheBuster(
        "/screenshots/dark/dashboard/dashboard_normal_4k.webp"
      ),
      alt: "LShorter Main Dashboard Overview",
    },
  },
  {
    id: "traffic-overview",
    title: "Traffic Overview",
    icon: <BarChart3 className="w-4 h-4 shrink-0" />,
    image: {
      light: withScreenshotCacheBuster(
        "/screenshots/light/analytics/analytics_normal_4k.webp"
      ),
      dark: withScreenshotCacheBuster(
        "/screenshots/dark/analytics/analytics_normal_4k.webp"
      ),
      alt: "LShorter Analytics Traffic Overview",
    },
  },
  {
    id: "geo",
    title: "Geo Analytics",
    icon: <Globe2 className="w-4 h-4 shrink-0" />,
    image: {
      light: withScreenshotCacheBuster(
        "/screenshots/light/geo/geo_normal_4k.webp"
      ),
      dark: withScreenshotCacheBuster(
        "/screenshots/dark/geo/geo_normal_4k.webp"
      ),
      alt: "LShorter Geographic & Continental Analytics",
    },
  },
  {
    id: "revenue",
    title: "Revenue",
    icon: <DollarSign className="w-4 h-4 shrink-0" />,
    image: {
      light: withScreenshotCacheBuster(
        "/screenshots/light/revenue/revenue_normal_4k.webp"
      ),
      dark: withScreenshotCacheBuster(
        "/screenshots/dark/revenue/revenue_normal_4k.webp"
      ),
      alt: "LShorter In-Depth Revenue & Conversion Analytics",
    },
  },
  {
    id: "devices",
    title: "Devices",
    icon: <MonitorSmartphone className="w-4 h-4 shrink-0" />,
    image: {
      light: withScreenshotCacheBuster(
        "/screenshots/light/devices/devices_normal_4k.webp"
      ),
      dark: withScreenshotCacheBuster(
        "/screenshots/dark/devices/devices_normal_4k.webp"
      ),
      alt: "LShorter Devices, Screens & Browsers Analytics",
    },
  },
  {
    id: "qr-studio",
    title: "QR Code Studio",
    icon: <QrCode className="w-4 h-4 shrink-0" />,
    image: {
      light: withScreenshotCacheBuster(
        "/screenshots/light/qr_studio/qr_studio_normal_4k.webp"
      ),
      dark: withScreenshotCacheBuster(
        "/screenshots/dark/qr_studio/qr_studio_normal_4k.webp"
      ),
      alt: "LShorter QR Code Customization Studio",
    },
  },
  {
    id: "links",
    title: "Short Links",
    icon: <Link2 className="w-4 h-4 shrink-0" />,
    image: {
      light: withScreenshotCacheBuster(
        "/screenshots/light/links/links_normal_4k.webp"
      ),
      dark: withScreenshotCacheBuster(
        "/screenshots/dark/links/links_normal_4k.webp"
      ),
      alt: "LShorter Short Links & Edge Routing Data Table",
    },
  },
];

export interface Hero195ShowcaseProps {
  tabs?: HeroShowcaseTab[];
  className?: string;
}

export function Hero195Showcase({
  tabs = DEFAULT_HERO_SHOWCASE_TABS,
  className,
}: Hero195ShowcaseProps) {
  const [activeTab, setActiveTab] = React.useState(tabs[0]?.id || "dashboard");

  return (
    <div className={cn("relative z-10 w-full", className)}>
      <Tabs
        defaultValue={tabs[0]?.id}
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        {/* Hero-195 Tab Triggers Bar */}
        <div className="relative z-20 flex justify-center px-2">
          <TabsList
            aria-label="Platform showcase views"
            className="mx-auto mb-5 sm:mb-6 flex h-auto w-full sm:w-fit max-w-full justify-start sm:flex-wrap sm:justify-center overflow-x-auto no-scrollbar gap-1.5 rounded-[10px] border border-zinc-200/90 dark:border-white/10 bg-zinc-100/90 dark:bg-[#141418]/90 p-1.5 backdrop-blur-md shadow-xs"
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="group relative flex items-center gap-2 rounded-[8px] border border-transparent px-3 sm:px-3.5 py-2 text-xs sm:text-[13px] font-medium text-zinc-600 dark:text-zinc-400 transition-all hover:text-zinc-950 dark:hover:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-[#1f1f25] data-[state=active]:text-zinc-950 dark:data-[state=active]:text-white data-[state=active]:shadow-xs data-[state=active]:border-zinc-200/80 dark:data-[state=active]:border-white/10 shrink-0 cursor-pointer"
              >
                <span className="text-zinc-500 dark:text-zinc-400 group-data-[state=active]:text-[#0066FF] dark:group-data-[state=active]:text-[#5294FF] transition-colors">
                  {tab.icon}
                </span>
                <span>{tab.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Hero-195 Framed Preview Container with BorderBeam */}
        <div className="relative isolate z-10">
          <div className="relative z-10">
            {tabs.map((tab, index) => (
              <TabsContent
                key={tab.id}
                value={tab.id}
                className="relative m-0 -mx-px rounded-[10px] bg-white dark:bg-[#09090b] p-1.5 sm:p-2 border border-zinc-200/90 dark:border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_28px_70px_rgba(0,0,0,0.75)]"
              >
                <div className="relative overflow-hidden rounded-[8px] border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#09090b]">
                  <Image
                    src={tab.image.light}
                    alt={tab.image.alt}
                    width={1920}
                    height={1080}
                    priority={index === 0}
                    loading="eager"
                    unoptimized
                    sizes="(max-width: 1280px) 100vw, 1248px"
                    className="w-full h-auto block dark:hidden object-top opacity-100"
                  />
                  <Image
                    src={tab.image.dark}
                    alt={tab.image.alt}
                    width={1920}
                    height={1080}
                    priority={index === 0}
                    loading="eager"
                    unoptimized
                    sizes="(max-width: 1280px) 100vw, 1248px"
                    className="w-full h-auto hidden dark:block object-top opacity-100"
                  />
                </div>
                <BorderBeam
                  duration={8}
                  size={200}
                  borderWidth={2}
                  colorFrom="#ffaa40"
                  colorTo="#9c40ff"
                />
              </TabsContent>
            ))}
          </div>

          {/* Hero-195 Architectural Framing Grid Lines */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-1/5 top-0 -z-10 h-px bg-zinc-200 dark:bg-white/12 [mask-image:linear-gradient(to_right,transparent_1%,black_10%,black_90%,transparent_99%)]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-1/5 bottom-0 -z-10 h-px bg-zinc-200 dark:bg-white/12 [mask-image:linear-gradient(to_right,transparent_1%,black_10%,black_90%,transparent_99%)]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-1/5 top-12 -z-10 h-px border-t border-dashed border-zinc-200 dark:border-white/10 [mask-image:linear-gradient(to_right,transparent_1%,black_10%,black_90%,transparent_99%)]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-1/5 bottom-12 -z-10 h-px border-t border-dashed border-zinc-200 dark:border-white/10 [mask-image:linear-gradient(to_right,transparent_1%,black_10%,black_90%,transparent_99%)]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-y-1/5 left-1/6 -z-10 w-px border-r border-dashed border-zinc-200 dark:border-white/10 [mask-image:linear-gradient(to_bottom,transparent_1%,black_10%,black_90%,transparent_99%)]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-y-1/5 right-1/6 -z-10 w-px border-r border-dashed border-zinc-200 dark:border-white/10 [mask-image:linear-gradient(to_bottom,transparent_1%,black_10%,black_90%,transparent_99%)]"
          />
        </div>
      </Tabs>
    </div>
  );
}

export const Hero195 = Hero195Showcase;
export default Hero195Showcase;
