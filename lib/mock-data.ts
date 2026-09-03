import {
  UserProfile,
  ShortLink,
  GlobalAnalytics,
  CustomDomain,
  ApiKeyItem,
  WebhookConfig,
  RetargetingPixel,
  InvoiceItem,
  ActiveSession,
  LiveClickEvent,
  ClickDataPoint,
  TimeRange
} from "@/types";

// ─── Empty initial state (no mock data) ──────────────────────────────────────

export const initialUser: UserProfile = {
  id: "",
  name: "",
  email: "",
  avatarUrl: undefined,
  plan: "FREEMIUM",
  created_at: new Date().toISOString(),
  clicksThisMonth: 0,
  clicksLimit: 100_000,
  domainsCount: 0,
  domainsLimit: 3,
  linksCount: 0,
  linksLimit: 1_000,
  language: "Français (FR)",
  timezone: "Europe/Paris (UTC+1)",
};

export const initialLinks: ShortLink[] = [];

export const initialAnalytics: GlobalAnalytics = {
  totalClicks: 0,
  clicksGrowth: 0,
  uniqueClicks: 0,
  uniqueClicksGrowth: 0,
  trackedRevenue: 0,
  revenueGrowth: 0,
  avgCtr: 0,
  ctrGrowth: 0,
  bounceRate: 0,
  epc: 0,
  avgEngagementTime: "0s",
  clicksByDay: [],
  topCountries: [],
  topCities: [],
  topDevices: [],
  topBrowsers: [],
  topReferrers: [],
  liveClickEvents: [],
  recentConversions: [],
};

export const initialDomains: CustomDomain[] = [];
export const initialApiKeys: ApiKeyItem[] = [];
export const initialInvoices: InvoiceItem[] = [];   // No fake invoices
export const initialSessions: ActiveSession[] = [];  // No fake sessions
export const initialWebhooks: WebhookConfig[] = [];
export const initialPixels: RetargetingPixel[] = [];

export function getClicksDataForRange(range: TimeRange, linkId?: string): ClickDataPoint[] {
  return [];
}
