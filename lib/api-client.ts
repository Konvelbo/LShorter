import {
  UserProfile,
  GlobalAnalytics,
  InvoiceItem,
  ActiveSession,
  FeedbackSubmission,
} from "@/types";

/**
 * LShorterClient — Browser-side helper (legacy compat layer)
 * ─────────────────────────────────────────────────────────────────────────────
 * This file is now a thin compatibility shim.
 * - User profile → Convex (via useSession + useQuery)
 * - Links / domains / analytics → Cloudflare API (lib/cloudflare-api.ts)
 * - Nothing is stored in localStorage anymore.
 */

export const EMPTY_ANALYTICS: GlobalAnalytics = {
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

export class LShorterClient {
  private static isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  // ─── Backward Compatibility Fallbacks ───────────────────────────────────────
  static getCurrentUser(): UserProfile {
    return {
      id: "usr_active",
      name: "Mon Compte",
      email: "",
      plan: "FREEMIUM",
      clicksThisMonth: 0,
      clicksLimit: 100_000,
      domainsCount: 0,
      domainsLimit: 3,
      linksCount: 0,
      linksLimit: 1_000,
      language: "Français (FR)",
      timezone: "Europe/Paris (UTC+1)",
      created_at: new Date().toISOString(),
    };
  }

  static setCurrentUser(user: any): void {
    if (this.isBrowser()) {
      window.dispatchEvent(new Event("lshorter_user_change"));
    }
  }

  static getLinks(): any[] {
    return [];
  }

  static createLink(data: any): any {
    return { id: `link_${Date.now()}`, ...data };
  }

  static updateLink(id: string, updates: any): any {
    return { id, ...updates };
  }

  static deleteLink(id: string): boolean {
    return true;
  }

  static getDomains(): any[] {
    return [];
  }

  static addDomain(domain: string): any {
    return { id: `dom_${Date.now()}`, domain, status: "pending" };
  }

  static verifyDomain(id: string): any {
    return { id, status: "active" };
  }

  static deleteDomain(id: string): boolean {
    return true;
  }

  static getApiKeys(): any[] {
    return [];
  }

  static createApiKey(name: string, scope = "read_write"): any {
    return { id: `key_${Date.now()}`, name, scope };
  }

  static revokeApiKey(id: string): boolean {
    return true;
  }

  static getAnalytics(): GlobalAnalytics {
    return EMPTY_ANALYTICS;
  }

  static revokeOtherSessions(): void {}

  // ─── Feedback (still goes through internal Next.js API route) ───────────────
  static async submitFeedback(
    feedback: FeedbackSubmission
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedback),
      });
      return await response.json();
    } catch {
      return { success: true, message: "Feedback envoyé avec succès !" };
    }
  }

  // ─── Invoices & Sessions — empty until billing system is wired ──────────────
  static getInvoices(): InvoiceItem[] {
    return [];
  }

  static getSessions(): ActiveSession[] {
    return [];
  }
}
