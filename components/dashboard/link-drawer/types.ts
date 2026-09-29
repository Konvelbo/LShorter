import React from "react";
import {
  Link2,
  Share2,
  Globe2,
  Shield,
  Split,
  Sliders,
  CheckCircle2,
  LucideIcon,
} from "lucide-react";
import { ShortLink } from "@/types";

export interface LinkDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  link?: ShortLink | null;
  initialUrl?: string;
  onSuccess?: (link: ShortLink) => void;
}

export type DrawerTabId =
  | "link"
  | "social_tracking"
  | "routing"
  | "protection"
  | "ab_testing"
  | "advanced"
  | "review";

export interface DrawerTabItem {
  id: DrawerTabId;
  label: string;
  icon: LucideIcon;
  isPro?: boolean;
  subtitle: string;
}

export const DRAWER_TABS: DrawerTabItem[] = [
  {
    id: "link",
    label: "Link",
    icon: Link2,
    isPro: false,
    subtitle: "Paste the destination URL and choose your short link.",
  },
  {
    id: "social_tracking",
    label: "Social media & tracking",
    icon: Share2,
    isPro: false,
    subtitle: "Customize social cards and add UTM campaign parameters.",
  },
  {
    id: "routing",
    label: "Routing",
    icon: Globe2,
    isPro: true,
    subtitle: "Send visitors elsewhere dynamically by country, device, or language.",
  },
  {
    id: "protection",
    label: "Protection & expiry",
    icon: Shield,
    isPro: true,
    subtitle: "Protect links with password, expiry date, click limits, or PathLock™.",
  },
  {
    id: "ab_testing",
    label: "A/B Testing",
    icon: Split,
    isPro: true,
    subtitle: "Split visitor traffic between multiple landing page variations.",
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: Sliders,
    isPro: false,
    subtitle: "Redirect HTTP status codes, query parameters, and link tags.",
  },
  {
    id: "review",
    label: "Review",
    icon: CheckCircle2,
    isPro: false,
    subtitle: "Check the summary of all options, then finalize your link.",
  },
];

// Backward-compatibility export
export interface DrawerSectionItem {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  label: string;
  icon: LucideIcon;
}

export const DRAWER_SECTIONS: DrawerSectionItem[] = DRAWER_TABS.map((tab, idx) => ({
  id: tab.id,
  number: idx + 1,
  title: `${idx + 1}. ${tab.label.toUpperCase()}`,
  subtitle: tab.subtitle,
  label: tab.label,
  icon: tab.icon,
}));
