import React from "react";
import {
  ImageIcon,
  Globe2,
  Tag,
  Shield,
  Split,
  Sliders,
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
  | "social"
  | "tracking"
  | "routing"
  | "protection"
  | "ab_testing"
  | "advanced";

export interface DrawerTabItem {
  id: DrawerTabId;
  label: string;
  icon: LucideIcon;
  isPro?: boolean;
  subtitle: string;
}

export const DRAWER_TABS: DrawerTabItem[] = [
  {
    id: "social",
    label: "Social Preview",
    icon: ImageIcon,
    isPro: false,
    subtitle: "Customize how your link looks when shared across social networks.",
  },
  {
    id: "tracking",
    label: "Tracking",
    icon: Tag,
    isPro: true,
    subtitle: "Configure UTM campaign tags and tracking pixels to measure conversions.",
  },
  {
    id: "routing",
    label: "Routing",
    icon: Globe2,
    isPro: true,
    subtitle: "Intelligently route visitors based on their country, device OS, or language.",
  },
  {
    id: "protection",
    label: "Protection & Expiry",
    icon: Shield,
    isPro: true,
    subtitle: "Protect links with PIN passwords, hide HTTP referrers, or set expiration dates.",
  },
  {
    id: "ab_testing",
    label: "A/B Testing",
    icon: Split,
    isPro: true,
    subtitle: "Split visitor traffic between multiple landing pages to maximize conversion rates.",
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: Sliders,
    isPro: false,
    subtitle: "Advanced technical options, HTTP redirection status codes, and link tags.",
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
