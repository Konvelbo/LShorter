import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num?: number | null): string {
  if (num === undefined || num === null || isNaN(Number(num))) {
    return "0";
  }
  const n = Number(num);
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (n >= 1_000) {
    return n.toLocaleString("fr-FR");
  }
  return n.toString();
}

export function formatCurrency(amount?: number | null, currency: string = "EUR"): string {
  const a = amount === undefined || amount === null || isNaN(Number(amount)) ? 0 : Number(amount);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(a);
}

export function formatDateRelative(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 30) {
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    }
    if (diffDay > 0) {
      return `il y a ${diffDay} jour${diffDay > 1 ? "s" : ""}`;
    }
    if (diffHour > 0) {
      return `il y a ${diffHour} heure${diffHour > 1 ? "s" : ""}`;
    }
    if (diffMin > 0) {
      return `il y a ${diffMin} minute${diffMin > 1 ? "s" : ""}`;
    }
    return "à l'instant";
  } catch {
    return dateString;
  }
}

const COUNTRY_NAMES: Record<string, string> = {
  BF: "Burkina Faso",
  FR: "France",
  US: "États-Unis",
  CI: "Côte d'Ivoire",
  SN: "Sénégal",
  CM: "Cameroun",
  CA: "Canada",
  DE: "Allemagne",
  GB: "Royaume-Uni",
  BE: "Belgique",
  CH: "Suisse",
  MA: "Maroc",
  TN: "Tunisie",
  DZ: "Algérie",
  ES: "Espagne",
  IT: "Italie",
  PT: "Portugal",
  NG: "Nigéria",
  GA: "Gabon",
  CD: "RDC",
  MG: "Madagascar",
  JP: "Japon",
  BR: "Brésil",
  AE: "Émirats Arabes Unis",
  IN: "Inde",
  AU: "Australie",
  ZA: "Afrique du Sud",
};

export function getCountryName(code?: string | null): string {
  if (!code) return "Inconnu";
  const upper = code.trim().toUpperCase();
  return COUNTRY_NAMES[upper] || upper;
}

export function generateRandomSlug(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
