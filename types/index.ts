export type PlanType = 'FREEMIUM' | 'PRO' | 'BUSINESS';
export type TimeRange = 'day' | 'week' | 'month' | 'year';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan: PlanType;
  created_at: string;
  clicksThisMonth: number;
  clicksLimit: number; // 60,000 for Freemium, -1 for Pro/Business (unlimited)
  domainsCount: number;
  domainsLimit: number; // 3 for Freemium, 15 for Pro, -1 for Business (unlimited)
  linksCount: number;
  linksLimit: number; // 1,000 for Freemium, -1 for Pro/Business (unlimited)
  language?: string;
  timezone?: string;
  hasCompletedOnboarding?: boolean;
  onboarding?: {
    role: string;
    goal: string;
    source: string;
    workspaceName?: string;
    monthlyClicksEstimate: string;
    completedAt: string;
  };
}

export interface GeoTargeting {
  [countryCode: string]: string; // e.g. "FR": "https://example.fr"
}

export interface DeviceTargeting {
  ios?: string;
  android?: string;
  windows?: string;
  mac?: string;
  linux?: string;
  tablet?: string;
  mobile?: string;
  desktop?: string;
}

export interface ShortLink {
  id: string;
  userId: string;
  slug: string;
  domainName: string;
  shortUrl: string;
  targetUrl: string;
  qrCode?: string;
  qrCodeConfig?: string;
  clicksCount: number;
  uniqueClicks?: number;
  conversionsCount?: number;
  revenue?: number;
  routingRules?: any[] | string;
  geoTargeting?: GeoTargeting;
  deviceTargeting?: DeviceTargeting;
  password?: string;
  isPasswordProtected?: boolean;
  isCloaked?: boolean;
  metaTitle?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  hideReferrer?: boolean;
  tags?: string[];
  expiresAt?: string;
  maxClicks?: number;
  fallbackUrl?: string;
  isActive: boolean;
  created_at: string;
}

export interface ClickDataPoint {
  date: string;
  dayNumber: number;
  label?: string;
  clicks: number;
  uniqueClicks: number;
}

export interface CountryStat {
  code: string;
  name: string;
  count: number;
  percentage: number;
  lat: number;
  lng: number;
}

export interface CityStat {
  city: string;
  countryCode: string;
  countryName: string;
  count: number;
  percentage: number;
}

export interface DeviceStat {
  label: string; // 'ios' | 'android' | 'windows' | 'mac' | 'linux' | 'other'
  device?: string;
  name?: string;
  count: number;
  percentage: number;
}

export interface BrowserStat {
  name: string; // 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Opera'
  count: number;
  percentage: number;
}

export interface ReferrerStat {
  source: string; // 'Direct' | 'Google' | 'Facebook' | 'Twitter/X' | 'Instagram' | 'TikTok' | 'LinkedIn' | 'Email'
  name?: string;
  referrer?: string;
  clicks?: number;
  count: number;
  percentage: number;
}

export interface LiveClickEvent {
  id: string;
  linkId: string;
  slug: string;
  timestamp: string;
  ipMasked: string;
  countryCode: string;
  countryName: string;
  city: string;
  device: string;
  os?: string;
  browser: string;
  referrer: string;
  resolvedUrl: string;
  conversionAmount?: number;
}

export interface ConversionStat {
  conversions: number;
  revenue: number;
  currency: string;
}

export interface GlobalAnalytics {
  totalClicks: number;
  clicksGrowth: number;
  uniqueClicks: number;
  uniqueClicksGrowth: number;
  trackedRevenue: number;
  revenueGrowth: number;
  avgCtr: number;
  ctrGrowth: number;
  bounceRate: number;
  epc: number; // Earnings per click
  avgEngagementTime: string;
  clicksByDay: ClickDataPoint[];
  topCountries: CountryStat[];
  topCities: CityStat[];
  topDevices: DeviceStat[];
  topBrowsers: BrowserStat[];
  topReferrers: ReferrerStat[];
  liveClickEvents: LiveClickEvent[];
  recentConversions: Array<{
    id: string;
    eventName: string;
    amount: number;
    currency: string;
    customerEmail?: string;
    linkId: string;
    slug: string;
    created_at: string;
  }>;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  rawKey?: string;
  scope?: 'read' | 'read_write' | 'admin';
  created_at: string;
  lastUsedAt?: string;
  rateLimit?: string;
}

export interface CustomDomain {
  id: string;
  domain: string;
  status: 'active' | 'pending' | 'failed';
  linksCount: number;
  dnsRecords: Array<{
    type: 'CNAME' | 'TXT';
    name: string;
    value: string;
    ttl: number;
    note: string;
  }>;
  instructions: string[];
  created_at: string;
  sslExpiresAt?: string;
  isDefault?: boolean;
}

export type QRContentType = 'link' | 'text' | 'wifi' | 'email' | 'call' | 'sms';

export interface QRCodeConfig {
  contentType: QRContentType;
  content: {
    url?: string;
    text?: string;
    wifi?: {
      ssid: string;
      password?: string;
      encryption: 'WPA' | 'WEP' | 'nopass';
      hidden?: boolean;
    };
    email?: {
      address: string;
      subject?: string;
      body?: string;
    };
    call?: {
      phone: string;
    };
    sms?: {
      phone: string;
      message?: string;
    };
  };
  color: string;
  bgColor: string;
  size: number;
  includeQuietZone: boolean;
  logoUrl?: string;
  logoFile?: File | null;
}

export interface FeedbackSubmission {
  category: 'Question' | 'Bug' | 'Feature' | 'Other';
  email: string;
  message: string;
  pageContext: string;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  secretKey?: string;
  lastTriggeredAt?: string;
  lastStatus?: number;
  created_at: string;
}

export interface RetargetingPixel {
  id: string;
  platform: 'facebook' | 'google_tag' | 'tiktok' | 'linkedin';
  pixelId: string;
  name: string;
  isActive: boolean;
  eventsTrackedCount: number;
}

export interface InvoiceItem {
  id: string;
  number: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  planName: string;
  pdfUrl?: string;
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}
