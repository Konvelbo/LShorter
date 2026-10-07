export interface VisitorGeo {
  countryCode: string;
  city: string;
  rawIp: string;
}

export interface VisitorDetails {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  continent: string;
  device: "mobile" | "tablet" | "desktop";
  os: "ios" | "android" | "windows" | "macos" | "linux" | "other";
  browser: "chrome" | "safari" | "firefox" | "edge" | "opera" | "samsung" | "brave" | "other";
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
}

export interface RuleCondition {
  type: string;
  operator: string;
  value: string;
}

export interface RoutingRule {
  conditions?: RuleCondition[];
  conditionType?: string;
  condition_type?: string;
  operator?: string;
  conditionValue?: string;
  condition_value?: string;
  destinationUrl?: string;
  destination_url?: string;
  url?: string;
  targetUrl?: string;
  target_url?: string;
}

export interface LinkMetadata {
  id?: string;
  userId?: string;
  slug: string;
  targetUrl?: string;
  target_url?: string;
  domain?: string;
  domainName?: string;
  domain_name?: string;
  isActive?: boolean;
  is_active?: number | boolean;
  expiresAt?: string;
  expires_at?: string;
  clicks?: number;
  clicks_count?: number;
  maxClicks?: number;
  max_clicks?: number;
  fallbackUrl?: string;
  fallback_url?: string;
  password?: string;
  has_password?: boolean;
  is_password_protected?: boolean;
  isCloaked?: boolean;
  is_cloaked?: number | boolean;
  pathLockMode?: "off" | "strict" | "funnel" | string;
  path_lock_mode?: "off" | "strict" | "funnel" | string;
  pathLockPrefix?: string;
  path_lock_prefix?: string;
  pathLockMessage?: string;
  path_lock_message?: string;
  pathLockPassword?: string;
  path_lock_password?: string;
  routingRules?: RoutingRule[] | string;
  routing_rules?: RoutingRule[] | string;
  abVariations?: Array<{ url: string; weight: number }> | string;
  ab_variations?: Array<{ url: string; weight: number }> | string;
  mainWeight?: number;
  main_weight?: number;
  redirectType?: "301" | "302" | "307" | string;
  redirect_type?: "301" | "302" | "307" | string;
  passParams?: boolean;
  pass_params?: boolean;
  ogTitle?: string;
  og_title?: string;
  metaTitle?: string;
  meta_title?: string;
  ogDescription?: string;
  og_description?: string;
  ogImage?: string;
  og_image?: string;
  bannerUrl?: string;
  banner_url?: string;
  bannerStyle?: "default_banner" | "large_banner" | string;
  banner_style?: "default_banner" | "large_banner" | string;
  twitterCard?: "summary" | "summary_large_image" | string;
  twitter_card?: "summary" | "summary_large_image" | string;
  [key: string]: any;
}

export type ProtectionDecision =
  | { type: "allowed" }
  | { type: "redirect"; url: string; status: number };
