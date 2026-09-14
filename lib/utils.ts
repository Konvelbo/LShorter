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
    return n.toLocaleString("en-US");
  }
  return n.toString();
}

export function formatCurrency(amount?: number | null, currency: string = "EUR"): string {
  const a = amount === undefined || amount === null || isNaN(Number(amount)) ? 0 : Number(amount);
  return new Intl.NumberFormat("en-US", {
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
      return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    }
    if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
    }
    if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
    }
    if (diffMin > 0) {
      return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
    }
    return "just now";
  } catch {
    return dateString;
  }
}

const COUNTRY_NAMES: Record<string, string> = {
  BF: "Burkina Faso",
  FR: "France",
  US: "United States",
  CI: "Ivory Coast",
  SN: "Senegal",
  CM: "Cameroon",
  CA: "Canada",
  DE: "Germany",
  GB: "United Kingdom",
  BE: "Belgium",
  CH: "Switzerland",
  MA: "Morocco",
  TN: "Tunisia",
  DZ: "Algeria",
  ES: "Spain",
  IT: "Italy",
  PT: "Portugal",
  NG: "Nigeria",
  GA: "Gabon",
  CD: "DR Congo",
  MG: "Madagascar",
  JP: "Japan",
  BR: "Brazil",
  AE: "United Arab Emirates",
  IN: "India",
  AU: "Australia",
  ZA: "South Africa",
};

export function getCountryName(code?: string | null): string {
  if (!code) return "Unknown";
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
