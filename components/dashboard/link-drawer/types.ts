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
    subtitle: "Personnalisez l'apparence de votre lien lors des partages sur les réseaux sociaux.",
  },
  {
    id: "tracking",
    label: "Tracking",
    icon: Tag,
    isPro: true,
    subtitle: "Configurez vos paramètres UTM et pixels de suivi pour mesurer vos campagnes.",
  },
  {
    id: "routing",
    label: "Routing",
    icon: Globe2,
    isPro: true,
    subtitle: "Redirigez intelligemment vos visiteurs selon leur pays, appareil ou langue.",
  },
  {
    id: "protection",
    label: "Protection & Expiry",
    icon: Shield,
    isPro: true,
    subtitle: "Sécurisez votre lien par mot de passe, masquez le référent ou définissez une date d'expiration.",
  },
  {
    id: "ab_testing",
    label: "A/B Testing",
    icon: Split,
    isPro: true,
    subtitle: "Divisez le trafic entre différentes destinations pour optimiser vos conversions.",
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: Sliders,
    isPro: false,
    subtitle: "Options techniques avancées, codes de redirection HTTP et classification.",
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
