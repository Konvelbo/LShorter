export interface DocCodeSnippet {
  language: string;
  filename: string;
  code: string;
  tabs?: { name: string; code: string; language?: string }[];
}

export interface DocFeature {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  readTime: string;
  overview: string[];
  keyPoints: { title: string; description: string }[];
  codeSnippets: {
    title: string;
    description: string;
    snippet: DocCodeSnippet;
  }[];
  responseSample?: {
    title: string;
    description: string;
    json: string;
  };
  bestPractices: string[];
}

export const DOC_FEATURES: DocFeature[] = [
  {
    slug: "sdk-quickstart",
    title: "Quickstart & Official SDK",
    subtitle: "Integrate intelligent URL shortening and link management in minutes with the official lshorter-api package.",
    description: "Complete installation guide, API key setup, and first request to create and manage short links in TypeScript / JavaScript.",
    image: "/marketing-FCI/cosmos_1739739224.jpeg",
    readTime: "3 min read",
    overview: [
      "The lshorter-api Node.js and TypeScript SDK provides a fully typed, intuitive, and resilient interface for all LShorter platform features.",
      "Engineered with zero unnecessary dependencies, it supports Node.js, Next.js (Server Components and Server Actions), Cloudflare Workers, Vercel Edge Functions, and Bun."
    ],
    keyPoints: [
      {
        title: "Full TypeScript Typing",
        description: "Benefit from comprehensive autocompletion for routing parameters, expiration dates, PIN codes, and tags."
      },
      {
        title: "Automatic Retry Handling",
        description: "Built-in exponential backoff retry policy to seamlessly absorb network micro-outages without service interruption."
      },
      {
        title: "Dual CJS / ESM Support",
        description: "Instantly compatible with modern ESM architectures and legacy CommonJS codebases."
      }
    ],
    codeSnippets: [
      {
        title: "1. Package Installation",
        description: "Install lshorter-api via your preferred package manager:",
        snippet: {
          language: "bash",
          filename: "Terminal",
          code: "npm install lshorter-api",
          tabs: [
            { name: "npm", code: "npm install lshorter-api", language: "bash" },
            { name: "pnpm", code: "pnpm add lshorter-api", language: "bash" },
            { name: "yarn", code: "yarn add lshorter-api", language: "bash" },
            { name: "bun", code: "bun add lshorter-api", language: "bash" },
          ]
        }
      },
      {
        title: "2. Client Initialization",
        description: "Create a client instance by providing your secret API key:",
        snippet: {
          language: "typescript",
          filename: "lib/lshorter.ts",
          code: `import { LShorter } from "lshorter-api";

export const lshorter = new LShorter({
  apiKey: process.env.LSHORTER_API_KEY!,
  endpoint: "https://lsho.cc/api/v1", // Optional (default)
});`
        }
      },
      {
        title: "3. Creating Your First Link",
        description: "Generate a custom short link with campaign metadata:",
        snippet: {
          language: "typescript",
          filename: "create-short-link.ts",
          code: `import { lshorter } from "@/lib/lshorter";

async function main() {
  const link = await lshorter.links.create({
    url: "https://my-domain.com/technical-docs-v2",
    slug: "guide-2026",
    tags: ["onboarding", "dev-doc"],
  });

  console.log("Short link generated:", link.shortUrl);
  // Output: https://lsho.cc/guide-2026
}

main().catch(console.error);`
        }
      },
      {
        title: "4. Conversion Tracking & Revenue Attribution (amount & count)",
        description: "Record a customer purchase amount and attribute it to the originating click:",
        snippet: {
          language: "typescript",
          filename: "track-conversion.ts",
          code: `import { lshorter } from "@/lib/lshorter";

// Record a completed sale with its revenue amount and customer avatar
await lshorter.track.conversion({
  eventName: "purchase",
  amount: 49.0, // Real revenue collected in USD/EUR
  currency: "USD",
  linkId: "link_89f023ab912",
  clickId: "clk_9921ab01", // Captured from the short link visit
  customer: {
    email: "customer@example.com",
    name: "Alex Johnson",
    avatarUrl: "https://example.com/photos/alex.jpg" // Customer avatar displayed in dashboard
  }
});

// Read atomic click counters and total revenue
const stats = await lshorter.analytics.get("guide-2026");
console.log("Total clicks count:", stats.totalClicks);
console.log("Cumulative tracked revenue (amount):", stats.trackedRevenue, "USD");
console.log("Average earnings per click (EPC):", (stats.trackedRevenue / stats.totalClicks).toFixed(2), "USD/click");`
        }
      },
      {
        title: "5. User Profile, Email & Full Name (FullName)",
        description: "Query GET /api/v1/users/me endpoint to fetch email, full name, and quotas:",
        snippet: {
          language: "typescript",
          filename: "get-profile.ts",
          code: `import { lshorter } from "@/lib/lshorter";

// Retrieve authenticated user profile
const profile = await lshorter.users.me();

console.log("ID:", profile.id);
console.log("Email:", profile.email);
console.log("Full Name:", profile.fullName);
console.log("Plan:", profile.plan);
console.log("Clicks consumed this month:", profile.clicksThisMonth);
console.log("Created links count:", profile.linksCount);
console.log("Connected domains:", profile.domainsCount);`
        }
      }
    ],
    responseSample: {
      title: "Returned Response Structure",
      description: "Standardized JSON object returned upon link creation with counters and revenue:",
      json: `{
  "id": "link_89f023ab912",
  "slug": "guide-2026",
  "shortUrl": "https://lsho.cc/guide-2026",
  "targetUrl": "https://my-domain.com/technical-docs-v2",
  "createdAt": "2026-09-12T14:30:00.000Z",
  "status": "active",
  "clicksCount": 142,
  "uniqueClicks": 118,
  "conversionsCount": 12,
  "trackedRevenue": 588.0,
  "currency": "USD",
  "tags": ["onboarding", "dev-doc"]
}`
    },
    bestPractices: [
      "Always store your API key in an environment variable (e.g., LSHORTER_API_KEY) and never commit it to public Git repositories.",
      "Reuse a single LShorter client instance to take advantage of HTTP Keep-Alive connection pooling.",
      "Systematically handle try/catch blocks to gracefully catch network errors or already reserved slugs."
    ]
  },
  {
    slug: "geo-routing",
    title: "Dynamic Routing & Edge Geolocation",
    subtitle: "Redirect visitors to contextual URLs based on their origin country with ultra-low latency.",
    description: "Guide to configuring country-based geographic redirection rules (ISO 3166-1) evaluated directly on the global Edge network.",
    image: "/marketing-FCI/cosmos_1746304416.jpeg",
    readTime: "4 min read",
    overview: [
      "Geographic routing optimizes user experience and conversion rates by serving localized content (language, currency, catalog) from a single shared link.",
      "Rules evaluation happens directly at Edge nodes during DNS resolution and TLS handshake, ensuring average redirection times under 15 milliseconds."
    ],
    keyPoints: [
      {
        title: "Closest-to-User Resolution",
        description: "The visitor's country is detected from the Edge IP header with zero extra proxy latency."
      },
      {
        title: "Permanent Fallback URL",
        description: "If the visitor's country does not match any specific rule, they are automatically routed to the default fallback URL."
      },
      {
        title: "Granular ISO Code Control",
        description: "Define rules for any 2-letter country code (e.g., US, UK, FR, DE, JP, CA, AU)."
      }
    ],
    codeSnippets: [
      {
        title: "1. Configuring Routing via SDK",
        description: "Attach country-based redirection rules to an existing link:",
        snippet: {
          language: "typescript",
          filename: "set-geo-routing.ts",
          code: `import { lshorter } from "@/lib/lshorter";

await lshorter.links.updateRouting("global-promo", {
  fallbackUrl: "https://store.com/global",
  rules: [
    {
      country: "US",
      targetUrl: "https://store.com/us/fall-sale",
    },
    {
      country: "GB",
      targetUrl: "https://store.com/uk/autumn-sale",
    },
    {
      country: "DE",
      targetUrl: "https://store.com/de/herbst-angebote",
    },
    {
      country: "FR",
      targetUrl: "https://store.com/fr/offres-automne",
    },
  ],
});`
        }
      },
      {
        title: "2. Equivalent Configuration via cURL",
        description: "Send a PATCH request to update the routing rules:",
        snippet: {
          language: "bash",
          filename: "curl-geo-routing.sh",
          code: `curl -X PATCH https://lsho.cc/api/v1/links/global-promo/routing \\
  -H "Authorization: Bearer $LSHORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fallbackUrl": "https://store.com/global",
    "rules": [
      { "country": "US", "targetUrl": "https://store.com/us/fall-sale" },
      { "country": "GB", "targetUrl": "https://store.com/uk/autumn-sale" },
      { "country": "FR", "targetUrl": "https://store.com/fr/offres-automne" }
    ]
  }'`
        }
      }
    ],
    responseSample: {
      title: "Applied Rules Confirmation",
      description: "Structure returned after updating geographic routing rules:",
      json: `{
  "slug": "global-promo",
  "routingEnabled": true,
  "fallbackUrl": "https://store.com/global",
  "rulesCount": 3,
  "activeCountries": ["US", "GB", "FR"],
  "updatedAt": "2026-09-12T14:45:10.000Z"
}`
    },
    bestPractices: [
      "Ensure your fallback URL is always functional and globally accessible.",
      "To test your rules without a VPN, you can pass the X-Override-Country header during staging tests.",
      "Regularly review uncovered countries in your metrics to add new strategic routes."
    ]
  },
  {
    slug: "pin-protection",
    title: "Advanced Security & PIN Code Protection",
    subtitle: "Protect confidential documents and private links with a 4-digit PIN code verified on the fly.",
    description: "Technical guide to setting up PIN codes on short links, blocking unauthorized access, and countering brute-force attacks.",
    image: "/marketing-FCI/cosmos_1796978290.jpeg",
    readTime: "3 min read",
    overview: [
      "PIN code protection adds an instant access control layer without requiring complex user accounts or heavy OAuth flows.",
      "When a visitor opens a protected link, a secure interface prompts them for the PIN. If verified, an ephemeral session token is granted and redirection occurs."
    ],
    keyPoints: [
      {
        title: "Cryptographic PIN Hashing",
        description: "PIN codes are never stored in plaintext in the database; they are securely salted and hashed."
      },
      {
        title: "Anti-Bruteforce Defense",
        description: "After 5 consecutive failed attempts, the source IP address is temporarily suspended for 15 minutes."
      },
      {
        title: "Ephemeral Session",
        description: "Once validated, redirection takes place immediately without unnecessary session persistence."
      }
    ],
    codeSnippets: [
      {
        title: "1. Creating a PIN-Protected Link",
        description: "Specify the pinCode property when creating the link:",
        snippet: {
          language: "typescript",
          filename: "create-pin-link.ts",
          code: `import { lshorter } from "@/lib/lshorter";

const secureLink = await lshorter.links.create({
  url: "https://drive.my-company.com/q3-financial-report.pdf",
  slug: "finance-q3",
  pinCode: "8492", // 4-digit PIN required
  tags: ["confidential", "executive"],
});

console.log("Protected link generated:", secureLink.shortUrl);
// Output: https://lsho.cc/finance-q3`
        }
      },
      {
        title: "2. Updating or Removing the PIN Code",
        description: "Update the PIN code anytime or disable protection:",
        snippet: {
          language: "typescript",
          filename: "update-pin.ts",
          code: `import { lshorter } from "@/lib/lshorter";

// Update PIN code
await lshorter.links.updateSecurity("finance-q3", {
  pinCode: "9102",
});

// Or remove PIN code (make link public)
await lshorter.links.updateSecurity("finance-q3", {
  pinCode: null,
});`
        }
      }
    ],
    responseSample: {
      title: "Protected Object Structure",
      description: "The isProtected field confirms the security state without exposing the raw code:",
      json: `{
  "id": "link_sec_991823ab",
  "slug": "finance-q3",
  "shortUrl": "https://lsho.cc/finance-q3",
  "isProtected": true,
  "maxAttempts": 5,
  "status": "active"
}`
    },
    bestPractices: [
      "Avoid trivial PINs like 0000 or 1234 for sensitive resources.",
      "Share the PIN code through a separate communication channel from the short link (e.g., SMS for PIN, email for link).",
      "Combine PIN code protection with an expiration date for maximum defense."
    ]
  },
  {
    slug: "realtime-analytics",
    title: "Real-Time Telemetry & Metrics",
    subtitle: "Explore audience data with surgical precision without compromising user privacy.",
    description: "Complete guide on LShorter telemetry: click volumes, geographic breakdown, operating systems, browsers, and API integration.",
    image: "/marketing-FCI/cosmos_549824580.jpeg",
    readTime: "4 min read",
    overview: [
      "Every interaction with your short links produces instant metrics aggregated at the Edge. No personally identifiable information is stored, ensuring native GDPR and international privacy compliance.",
      "Redirection counters (count) and financial conversion amounts (amount) synchronize in real time via REST API to power your dashboards, automation alerts, or profitability tracking systems (ROI/EPC)."
    ],
    keyPoints: [
      {
        title: "Atomic Click Counters (Count)",
        description: "Every click is counted atomically at the Edge (totalClicks) and split between raw volume and cookieless unique visitors (uniqueVisitors)."
      },
      {
        title: "Monetary Metrics & Revenue (Amount)",
        description: "Track cumulative revenue (trackedRevenue), average order value (AOV), and earnings per click (EPC = total revenue / total clicks)."
      },
      {
        title: "Multi-Dimensional Segmentation",
        description: "Analyze performance by country, city, device type (mobile, desktop, tablet), OS, and browser."
      },
      {
        title: "Referrer Tracking",
        description: "Pinpoint exact traffic sources (Twitter/X, LinkedIn, newsletters, search engines)."
      }
    ],
    codeSnippets: [
      {
        title: "1. Fetching Statistics via SDK",
        description: "Query comprehensive metrics for a specific link:",
        snippet: {
          language: "typescript",
          filename: "get-analytics.ts",
          code: `import { lshorter } from "@/lib/lshorter";

const stats = await lshorter.analytics.get("launch-2026", {
  period: "30d", // 24h, 7d, 30d, 90d, all
});

console.log("Total Clicks:", stats.totalClicks);
console.log("Top Countries:", stats.topCountries);
console.log("Device Breakdown:", stats.devices);`
        }
      },
      {
        title: "2. Raw cURL Request",
        description: "REST call to extract telemetry data:",
        snippet: {
          language: "bash",
          filename: "curl-analytics.sh",
          code: `curl -X GET "https://lsho.cc/api/v1/analytics/launch-2026?period=30d" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY"`
        }
      },
      {
        title: "3. Revenue & EPC Analysis (Amount & Count)",
        description: "Extract return on investment and EPC from your sales links:",
        snippet: {
          language: "typescript",
          filename: "get-roi-metrics.ts",
          code: `import { lshorter } from "@/lib/lshorter";

const roi = await lshorter.analytics.getRevenue("launch-2026", {
  currency: "USD",
});

console.log("Clicks counter (count):", roi.totalClicks);
console.log("Completed orders:", roi.conversionsCount);
console.log("Total revenue generated (amount):", roi.trackedRevenue, "USD");
console.log("Average Order Value (AOV):", (roi.trackedRevenue / roi.conversionsCount).toFixed(2), "USD");
console.log("Earnings Per Click (EPC):", roi.epc.toFixed(2), "USD/click");`
        }
      }
    ],
    responseSample: {
      title: "Full Analytics Response Format (Count & Amount)",
      description: "Returned JSON payload including visit counts and financial amounts:",
      json: `{
  "slug": "launch-2026",
  "period": "30d",
  "totalClicks": 3482,
  "uniqueVisitors": 2910,
  "conversionsCount": 87,
  "conversionRate": 2.5,
  "trackedRevenue": 4263.0,
  "currency": "USD",
  "epc": 1.22,
  "averageOrderValue": 49.0,
  "topCountries": [
    { "code": "US", "name": "United States", "clicks": 1420, "percentage": 40.7 },
    { "code": "GB", "name": "United Kingdom", "clicks": 890, "percentage": 25.5 },
    { "code": "DE", "name": "Germany", "clicks": 450, "percentage": 12.9 },
    { "code": "FR", "name": "France", "clicks": 310, "percentage": 8.9 }
  ],
  "devices": {
    "mobile": 2180,
    "desktop": 1150,
    "tablet": 152
  },
  "browsers": [
    { "name": "Chrome", "clicks": 1940 },
    { "name": "Safari", "clicks": 1120 },
    { "name": "Firefox", "clicks": 422 }
  ],
  "referrers": [
    { "source": "t.co", "clicks": 1200 },
    { "source": "linkedin.com", "clicks": 840 },
    { "source": "direct", "clicks": 950 }
  ]
}`
    },
    bestPractices: [
      "Use the period parameter to filter custom date ranges tailored to campaign reporting.",
      "Leverage device breakdown metrics (mobile vs. desktop) to optimize target landing pages.",
      "Combine link tags with the analytics API to compare acquisition channel performance."
    ]
  },
  {
    slug: "click-limits-and-expiration",
    title: "Click Limits & Scheduled Expiration",
    subtitle: "Control link lifespans with automated access caps and precise expiration timestamps.",
    description: "Guide to configuring maximum click ceilings (flash sales) and automated expiration schedules on your short links.",
    image: "/marketing-FCI/cosmos_2136974997.jpeg",
    readTime: "3 min read",
    overview: [
      "Limitation and expiration features automate the conclusion of marketing campaigns, limited promo deals, or restricted beta invites without manual intervention.",
      "Every visit triggers an atomic increment of clicksCount directly on Cloudflare Edge nodes. Once a limit is reached (clicksCount >= maxClicks) or the expiration date passes, the link instantly transitions in under 10ms to inactive status or redirects to a fallback URL."
    ],
    keyPoints: [
      {
        title: "Lock-Free Atomic Counter (Count)",
        description: "Edge atomic increment eliminates race conditions during simultaneous traffic spikes (e.g., 50,000 clicks/second)."
      },
      {
        title: "Real-Time remainingClicks Calculation",
        description: "remainingClicks = Math.max(0, maxClicks - clicksCount). Powers urgency badges (e.g., 'Only 7 spots remaining!')."
      },
      {
        title: "ISO 8601 Timestamps",
        description: "Set an exact universal expiration date and time (UTC)."
      },
      {
        title: "Customizable Fallback Redirect",
        description: "Redirect to an 'Offer Ended' page or display the clean native expired screen."
      }
    ],
    codeSnippets: [
      {
        title: "1. Creating with Click Limit and Expiration",
        description: "Configure maxClicks and expiresAt simultaneously:",
        snippet: {
          language: "typescript",
          filename: "create-limited-link.ts",
          code: `import { lshorter } from "@/lib/lshorter";

const limitedLink = await lshorter.links.create({
  url: "https://events.com/vip-registration",
  slug: "vip-flash",
  maxClicks: 250, // Deactivates after 250 clicks
  expiresAt: new Date("2026-10-31T23:59:59Z"),
  expiredRedirectUrl: "https://events.com/waitlist", // Redirect after expiration
  tags: ["flash-sale", "vip"],
});

console.log("Time-limited short link created:", limitedLink.shortUrl);`
        }
      },
      {
        title: "2. Reactivating or Extending a Link",
        description: "Increase the click quota or extend the deadline anytime:",
        snippet: {
          language: "typescript",
          filename: "extend-link.ts",
          code: `import { lshorter } from "@/lib/lshorter";

// Extend quota to 500 clicks and push back expiration date
await lshorter.links.update("vip-flash", {
  maxClicks: 500,
  expiresAt: new Date("2026-11-15T23:59:59Z"),
});`
        }
      },
      {
        title: "3. Checking Counter and Remaining Clicks (remainingClicks)",
        description: "Monitor quota consumption in real time for user interfaces:",
        snippet: {
          language: "typescript",
          filename: "check-remaining-clicks.ts",
          code: `import { lshorter } from "@/lib/lshorter";

const linkStatus = await lshorter.links.get("vip-flash");

console.log("Consumed clicks counter (count):", linkStatus.clicksCount); // e.g. 243
console.log("Max authorized limit (maxClicks):", linkStatus.maxClicks); // 250
console.log("Remaining clicks / spots:", linkStatus.remainingClicks); // 7
console.log("Current link status:", linkStatus.isExpired ? "Expired" : "Active");`
        }
      }
    ],
    responseSample: {
      title: "Link Details with Quota and Atomic Counters",
      description: "Remaining click count (remainingClicks) is computed automatically on the fly:",
      json: `{
  "id": "link_lim_481029",
  "slug": "vip-flash",
  "shortUrl": "https://lsho.cc/vip-flash",
  "clicksCount": 243,
  "maxClicks": 250,
  "remainingClicks": 7,
  "expiresAt": "2026-10-31T23:59:59.000Z",
  "isExpired": false,
  "status": "active"
}`
    },
    bestPractices: [
      "Always provide an expiredRedirectUrl to never lose traffic after expiration.",
      "Ensure timestamps are passed in standard UTC format to prevent timezone offset bugs.",
      "Pair click thresholds with webhooks to receive alerts when 80% quota is reached."
    ]
  },
  {
    slug: "url-masking",
    title: "Source URL Masking & Privacy (Cloaking)",
    subtitle: "Preserve brand consistency and mask complex destination URLs in the browser address bar.",
    description: "Guide to enabling URL Cloaking to keep your branded short domain visible during navigation.",
    image: "/marketing-FCI/cosmos_227768569.jpeg",
    readTime: "3 min read",
    overview: [
      "URL Cloaking displays destination page content while keeping the branded short domain in the browser address bar.",
      "This technique is popular for lengthy affiliate links, forms hosted on third-party platforms (Notion, Typeform, Airtable), and white-label redirects."
    ],
    keyPoints: [
      {
        title: "Brand Preservation",
        description: "Visitors constantly see your clean brand domain instead of a lengthy technical URL."
      },
      {
        title: "Dynamic Titles & Metadata",
        description: "Customize browser tab title and favicon to match your brand identity."
      },
      {
        title: "Secure Sandboxing",
        description: "Safe containerization with sandbox security policies protecting visitor data."
      }
    ],
    codeSnippets: [
      {
        title: "1. Enabling URL Masking",
        description: "Set the maskUrl flag to true during link creation:",
        snippet: {
          language: "typescript",
          filename: "create-masked-link.ts",
          code: `import { lshorter } from "@/lib/lshorter";

const maskedLink = await lshorter.links.create({
  url: "https://partner-affiliate-network.com/ref?aff_id=992834&campaign=summer",
  slug: "partner-deal",
  maskUrl: true,
  pageTitle: "Exclusive Partner Offer | LShorter",
});

console.log("Masked short link generated:", maskedLink.shortUrl);
// Output: https://lsho.cc/partner-deal`
        }
      }
    ],
    responseSample: {
      title: "Response with Masked Status",
      description: "The maskUrl indicator confirms iframe encapsulation:",
      json: `{
  "id": "link_msk_1029481",
  "slug": "partner-deal",
  "shortUrl": "https://lsho.cc/partner-deal",
  "maskUrl": true,
  "pageTitle": "Exclusive Partner Offer | LShorter",
  "status": "active"
}`
    },
    bestPractices: [
      "Ensure target websites allow embedding (no strict X-Frame-Options: DENY header).",
      "Set a clear pageTitle so the browser tab accurately reflects presented content.",
      "Verify mobile viewports to ensure seamless responsive navigation."
    ]
  },
  {
    slug: "dynamic-qr-codes",
    title: "Dynamic QR Code Generation",
    subtitle: "Create and export high-resolution vector QR codes linked to destinations editable anytime.",
    description: "Complete guide on vector SVG and PNG QR code generation, fully customizable and connected in real-time to redirection telemetry.",
    image: "/marketing-FCI/cosmos_302657415.jpeg",
    readTime: "3 min read",
    overview: [
      "A dynamic LShorter QR code encodes the permanent short URL rather than the final destination. You can change destination URLs anytime, even after physical materials (business cards, posters, packaging) are printed.",
      "Every physical scan is recorded in real-time telemetry with mobile scan differentiation."
    ],
    keyPoints: [
      {
        title: "Editable Without Re-Printing",
        description: "Change the target URL of a printed QR code in one click from dashboard or API."
      },
      {
        title: "Vector SVG & PNG Formats",
        description: "Export infinite vector SVG for high-definition print or PNG for digital displays."
      },
      {
        title: "Error Correction Levels",
        description: "Support for L, M, Q, H redundancy levels for reliable scanning even if partially obscured."
      }
    ],
    codeSnippets: [
      {
        title: "1. Generating QR Codes via API",
        description: "Download QR codes in SVG or PNG format:",
        snippet: {
          language: "typescript",
          filename: "get-qr-code.ts",
          code: `import { lshorter } from "@/lib/lshorter";
import fs from "node:fs/promises";

// Fetch QR code in vector SVG format
const qrSvg = await lshorter.qr.generate("launch-2026", {
  format: "svg",
  size: 512,
  errorCorrectionLevel: "H", // High error tolerance
  darkColor: "#ff6600", // Custom brand color
  lightColor: "#FAF7F2",
});

await fs.writeFile("qr-launch.svg", qrSvg);
console.log("Vector SVG QR Code exported successfully!");`
        }
      },
      {
        title: "2. cURL Request for Integration",
        description: "Fetch raw QR code binary image directly:",
        snippet: {
          language: "bash",
          filename: "curl-qr.sh",
          code: `curl -X GET "https://lsho.cc/api/v1/qr/launch-2026?format=png&size=600" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY" \\
  --output qr-launch.png`
        }
      }
    ],
    responseSample: {
      title: "QR Code Export Confirmation",
      description: "Binary data or SVG string returned according to requested format.",
      json: `{
  "slug": "launch-2026",
  "format": "svg",
  "size": 512,
  "qrUrl": "https://lsho.cc/qr/launch-2026.svg"
}`
    },
    bestPractices: [
      "Use error correction level H when embedding a custom brand logo in the center.",
      "Prefer SVG vector format for large-scale print runs to avoid pixelation.",
      "Always test QR code readability across multiple smartphone models before physical production."
    ]
  },
  {
    slug: "webhooks-and-events",
    title: "Webhooks & Real-Time Events",
    subtitle: "Connect microservices and automate workflows with instant HTTP notifications.",
    description: "Guide to registering webhook endpoints, validating HMAC signatures, and reacting to click and expiration events.",
    image: "/marketing-FCI/cosmos_938538719.jpeg",
    readTime: "4 min read",
    overview: [
      "LShorter webhooks notify your backend in real time whenever an event occurs on your links (click logged, limit reached, link expired).",
      "All payloads are signed with a secret HMAC-SHA256 key ensuring absolute authenticity of incoming data."
    ],
    keyPoints: [
      {
        title: "Supported Events",
        description: "link.clicked, link.limit_reached, link.expired, link.created, link.deleted."
      },
      {
        title: "HMAC-SHA256 Signatures",
        description: "X-LShorter-Signature header to cryptographically verify webhook origin."
      },
      {
        title: "Fault Tolerance & Retries",
        description: "Automatic retry with exponential backoff if your receiver returns a 5xx error."
      }
    ],
    codeSnippets: [
      {
        title: "1. Setting up a Webhook Receiver (Node.js / Next.js)",
        description: "Validate signature and process incoming event:",
        snippet: {
          language: "typescript",
          filename: "app/api/webhooks/lshorter/route.ts",
          code: `import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

const WEBHOOK_SECRET = process.env.LSHORTER_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-lshorter-signature");

  // 1. Verify HMAC signature
  const expectedSig = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSig) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2. Process event
  const event = JSON.parse(rawBody);

  switch (event.type) {
    case "link.clicked":
      console.log(\`Click registered on \${event.data.slug} from \${event.data.country}\`);
      break;
    case "link.limit_reached":
      console.warn(\`Click limit reached for link \${event.data.slug}\`);
      break;
  }

  return NextResponse.json({ received: true });
}`
        }
      }
    ],
    responseSample: {
      title: "Webhook Payload Example",
      description: "JSON payload dispatched on a link.clicked event:",
      json: `{
  "id": "evt_883019283",
  "type": "link.clicked",
  "createdAt": "2026-09-12T15:02:14.000Z",
  "data": {
    "linkId": "link_89f023ab912",
    "slug": "guide-2026",
    "country": "US",
    "device": "desktop",
    "browser": "Chrome",
    "ipMasked": "82.64.***.***",
    "timestamp": 1789244534000
  }
}`
    },
    bestPractices: [
      "Respond with HTTP 200 quickly (under 3 seconds) and offload long-running jobs to background queues.",
      "Systematically verify cryptographic signatures before processing webhook payloads.",
      "Implement idempotent handlers using event.id to avoid duplicate processing on retries."
    ]
  },
  {
    slug: "conversion-tracking-amount-count",
    title: "Conversion Tracking & Financial Metrics (Amount & Count)",
    subtitle: "Track actual revenue generated by each short link, calculate EPC, and measure marketing campaign ROI.",
    description: "Comprehensive technical guide on revenue attribution (amount), Edge atomic counters (clicksCount, uniqueClicks, maxClicks), average order value (AOV), and earnings per click (EPC).",
    image: "/marketing-FCI/cosmos_1739739224.jpeg",
    readTime: "5 min read",
    overview: [
      "The LShorter conversion tracking engine directly associates monetary amounts (amount) and currencies (currency) with short link clicks. You can pinpoint exactly which link drives revenue, which channel is most profitable, and your average gain per visitor.",
      "On the counters side (count), each redirection is incremented atomically at the Edge without locking for absolute accuracy even during viral spikes (50,000+ clicks/sec), with GDPR-compliant cookieless unique visitor deduplication."
    ],
    keyPoints: [
      {
        title: "Accurate Attribution via clickId",
        description: "Every visit receives an ephemeral token (e.g., clk_9921ab01) passed to your checkout funnel (Stripe, Shopify, WooCommerce) to tie orders to the source link."
      },
      {
        title: "Revenue Recording (amount & currency)",
        description: "Pass exact received amount (e.g., amount: 49.0, currency: 'USD') to instantly update trackedRevenue."
      },
      {
        title: "Automated EPC Calculation (Earnings Per Click)",
        description: "The core ROI metric: EPC = trackedRevenue / totalClicks. Compare ad acquisition cost (CPC) with actual revenue immediately."
      },
      {
        title: "Edge Atomic Counters (clicksCount & maxClicks)",
        description: "High-frequency instant increments and automated threshold closures (remainingClicks) with zero database bottleneck."
      }
    ],
    codeSnippets: [
      {
        title: "1. Capturing clickId During Redirection",
        description: "Retrieve the clickId token injected into your landing page URL by LShorter:",
        snippet: {
          language: "typescript",
          filename: "app/checkout/page.tsx",
          code: `// In your Next.js / React component or page
export default function CheckoutPage({ searchParams }: { searchParams: { ref?: string } }) {
  // The clickId passed from the short link (e.g., ?ref=clk_9921ab01)
  const clickId = searchParams.ref || null;

  // Store it in session or shopping cart
  if (clickId && typeof window !== "undefined") {
    sessionStorage.setItem("lshorter_click_id", clickId);
  }

  return <div>Checkout Flow...</div>;
}`
        }
      },
      {
        title: "2. Sending Conversion & Paid Amount (amount)",
        description: "Call the LShorter API on payment confirmation to attribute revenue:",
        snippet: {
          language: "typescript",
          filename: "app/api/webhooks/stripe/route.ts",
          code: `import { lshorter } from "@/lib/lshorter";

// On Stripe / Shopify payment confirmation (checkout.session.completed)
export async function handlePaymentSuccess(session: any) {
  const clickId = session.metadata?.clickId; // clk_9921ab01
  const amountPaid = session.amount_total / 100; // e.g. 49.00 USD

  await lshorter.track.conversion({
    eventName: "purchase",
    amount: amountPaid, // Decimal amount
    currency: "USD",
    clickId: clickId,
    orderId: session.id,
    customer: {
      email: session.customer_details?.email,
      name: session.customer_details?.name,
    },
  });

  console.log(\`Conversion of \${amountPaid} USD successfully attributed to click \${clickId}\`);
}`
        }
      },
      {
        title: "3. Querying Counters (count) and Cumulative Revenue",
        description: "View click totals, generated revenue amounts, and EPC via the SDK:",
        snippet: {
          language: "typescript",
          filename: "check-link-revenue.ts",
          code: `import { lshorter } from "@/lib/lshorter";

// Retrieve complete sales metrics
const revenueStats = await lshorter.analytics.getRevenue("summer-sale-2026", {
  period: "30d",
  currency: "USD",
});

console.log("Raw clicks count (clicksCount):", revenueStats.totalClicks); // 2,500
console.log("Deduplicated unique visitors (uniqueClicks):", revenueStats.uniqueClicks); // 2,100
console.log("Confirmed orders count:", revenueStats.conversionsCount); // 68
console.log("Conversion rate:", revenueStats.conversionRate.toFixed(2) + "%"); // 2.72%
console.log("Total revenue generated (amount):", revenueStats.trackedRevenue, "USD"); // 3,332.00 USD
console.log("Average Order Value (AOV):", revenueStats.averageOrderValue.toFixed(2), "USD"); // 49.00 USD
console.log("Earnings Per Click (EPC):", revenueStats.epc.toFixed(2), "USD / click"); // 1.33 USD / click`
        }
      }
    ],
    responseSample: {
      title: "Conversion & Revenue Response Structure",
      description: "Comprehensive JSON payload with atomic counters, financial amounts, and performance ratios:",
      json: `{
  "slug": "summer-sale-2026",
  "linkId": "link_89f023ab912",
  "currency": "USD",
  "counts": {
    "clicksCount": 2500,
    "uniqueClicks": 2100,
    "conversionsCount": 68,
    "maxClicks": 5000,
    "remainingClicks": 2500
  },
  "financials": {
    "trackedRevenue": 3332.00,
    "currency": "USD",
    "conversionRate": 2.72,
    "averageOrderValue": 49.00,
    "earningsPerClick": 1.33
  },
  "recentConversions": [
    {
      "conversionId": "conv_77192",
      "clickId": "clk_9921ab01",
      "amount": 49.00,
      "currency": "USD",
      "timestamp": "2026-09-12T16:20:00.000Z",
      "country": "US"
    }
  ]
}`
    },
    bestPractices: [
      "Always pass clickId in checkout metadata (e.g., Stripe session metadata) to preserve attribution across delayed payments.",
      "Regularly compare EPC with CPC to immediately pause unprofitable ad campaigns.",
      "Use the currency field to handle multi-currency conversions for global sales (USD, EUR, GBP, etc.)."
    ]
  },
  {
    slug: "ab-testing-routing",
    title: "Percentage Routing & A/B Testing",
    subtitle: "Intelligently distribute click traffic across landing page variants to maximize conversion rates.",
    description: "Comprehensive guide to configuring Edge-based A/B tests: percentage split weighting, real-time comparison, and zero-flicker instant switching.",
    image: "/marketing-FCI/cosmos_1746304416.jpeg",
    readTime: "4 min read",
    overview: [
      "Percentage routing (A/B Testing) directs a defined proportion of traffic to different page variations (e.g., 50% to Variant A, 50% to Variant B, or 70% / 15% / 15%).",
      "Routing decisions execute directly on Cloudflare Edge servers during network handshake, with zero client scripts or visible layout flicker."
    ],
    keyPoints: [
      {
        title: "Weighted Edge Distribution",
        description: "Define custom percentage weights (sum = 100%) between the primary URL and A/B variations."
      },
      {
        title: "Zero Flicker",
        description: "Routing happens before HTML page load, eliminating visual shifts for visitors."
      },
      {
        title: "Comparative Conversion Analytics",
        description: "Analyze click volumes, conversion rates, and revenue generated by each variant in your dashboard."
      }
    ],
    codeSnippets: [
      {
        title: "1. Configuring an A/B Test via SDK",
        description: "Associate variations with their respective percentage weights:",
        snippet: {
          language: "typescript",
          filename: "create-ab-test.ts",
          code: `import { lshorter } from "@/lib/lshorter";

const abLink = await lshorter.links.create({
  url: "https://your-store.com/landing-a",
  slug: "promo-split",
  mainWeight: 50, // 50% to landing A
  abVariations: [
    {
      id: "var_b",
      targetUrl: "https://your-store.com/landing-b",
      weight: 50, // 50% to landing B
      name: "Variant B (Green Button)",
    },
  ],
  tags: ["ab-test", "marketing-q4"],
});

console.log("A/B Testing short link active:", abLink.shortUrl);
// Output: https://lsho.cc/promo-split`
        }
      },
      {
        title: "2. Live Weight Adjustments",
        description: "Adjust traffic distribution during active campaigns without modifying the shared link:",
        snippet: {
          language: "typescript",
          filename: "update-ab-weights.ts",
          code: `import { lshorter } from "@/lib/lshorter";

// Allocate 80% to winning variant and 20% to legacy
await lshorter.links.update("promo-split", {
  mainWeight: 20,
  abVariations: [
    {
      id: "var_b",
      targetUrl: "https://your-store.com/landing-b",
      weight: 80,
      name: "Variant B (Winner)",
    },
  ],
});`
        }
      }
    ],
    responseSample: {
      title: "A/B Testing Link Structure",
      description: "Payload confirming percentage routing weights:",
      json: `{
  "id": "link_ab_991823",
  "slug": "promo-split",
  "shortUrl": "https://lsho.cc/promo-split",
  "targetUrl": "https://your-store.com/landing-a",
  "mainWeight": 50,
  "abVariations": [
    {
      "id": "var_b",
      "targetUrl": "https://your-store.com/landing-b",
      "weight": 50,
      "name": "Variant B (Green Button)",
      "clicksCount": 128
    }
  ],
  "status": "active"
}`
    },
    bestPractices: [
      "Run your A/B test until reaching statistically significant sample sizes (at least 500 to 1,000 clicks per variant).",
      "Test only one major hypothesis at a time (headline, CTA, or pricing) to isolate impactful factors.",
      "Review conversion metrics per variation in the LShorter dashboard before declaring a winner."
    ]
  },
  {
    slug: "social-sharing-opengraph",
    title: "Social Sharing & Dynamic Open Graph Cards",
    subtitle: "Customize how your links appear when shared on WhatsApp, Twitter/X, LinkedIn, Telegram, and Facebook.",
    description: "Guide to injecting custom Open Graph metadata (og:title, og:description, og:image) and Twitter Cards into every short link for maximum social CTR.",
    image: "/marketing-FCI/cosmos_549824580.jpeg",
    readTime: "3 min read",
    overview: [
      "When a shortened link is shared across messaging apps or social networks (WhatsApp, LinkedIn, Twitter/X, Discord, Slack), crawlers scrape Open Graph tags to render a rich link preview card.",
      "LShorter dynamically serves custom Open Graph metadata on the fly from Cloudflare's Edge network, guaranteeing immediate, crisp previews across all distribution channels."
    ],
    keyPoints: [
      {
        title: "Custom Banners and Titles",
        description: "Set catchy titles, tailored descriptions, and HD 1200x630px images for your campaign."
      },
      {
        title: "Twitter Cards & Instant Messengers",
        description: "Native summary_large_image support for Twitter/X, WhatsApp, and Telegram."
      },
      {
        title: "High-Speed CDN Hosting",
        description: "Upload banner assets directly to our globally distributed CDN with edge caching."
      }
    ],
    codeSnippets: [
      {
        title: "1. Creating a Link with Open Graph Metadata",
        description: "Specify metaTitle, ogDescription, and ogImage properties:",
        snippet: {
          language: "typescript",
          filename: "create-og-link.ts",
          code: `import { lshorter } from "@/lib/lshorter";

const link = await lshorter.links.create({
  url: "https://my-product.com/special-deal",
  slug: "discover-2026",
  metaTitle: "Discover Our 2026 Collection — Limited Edition",
  ogDescription: "Get 20% off your first order today with promo code WELCOME.",
  ogImage: "https://my-product.com/images/og-banner-1200x630.jpg",
  tags: ["social-media", "og-campaign"],
});

console.log("Social-optimized short link created:", link.shortUrl);
// Output: https://lsho.cc/discover-2026`
        }
      }
    ],
    responseSample: {
      title: "Open Graph Metadata Structure",
      description: "Enriched tags served to social media preview crawlers:",
      json: `{
  "id": "link_og_481902",
  "slug": "discover-2026",
  "shortUrl": "https://lsho.cc/discover-2026",
  "targetUrl": "https://my-product.com/special-deal",
  "metaTitle": "Discover Our 2026 Collection — Limited Edition",
  "ogDescription": "Get 20% off your first order today with promo code WELCOME.",
  "ogImage": "https://my-product.com/images/og-banner-1200x630.jpg",
  "twitterCard": "summary_large_image",
  "status": "active"
}`
    },
    bestPractices: [
      "Use 1200 x 630 pixel images with a 1.91:1 aspect ratio for optimal sharpness across Facebook, LinkedIn, and Twitter.",
      "Keep Open Graph titles under 60 characters to prevent truncation on mobile screens.",
      "Validate previews with official debugging tools (Twitter Card Validator, LinkedIn Post Inspector) prior to publishing."
    ]
  }
];

export function getAllDocFeatures(): DocFeature[] {
  return DOC_FEATURES;
}

export function getDocFeatureBySlug(slug: string): DocFeature | undefined {
  return DOC_FEATURES.find((feature) => feature.slug === slug);
}
