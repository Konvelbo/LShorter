export interface DocApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
  default?: string;
}

export interface DocApiEndpoint {
  name: string;
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  path: string;
  description: string;
  authentication?: string;
  rateLimit?: string;
  headers?: DocApiParameter[];
  pathParams?: DocApiParameter[];
  queryParams?: DocApiParameter[];
  bodyParams?: DocApiParameter[];
  codeExamples?: {
    name: string;
    language: string;
    code: string;
  }[];
  responses?: {
    status: number;
    statusText: string;
    description: string;
    json: string;
  }[];
  errorCodes?: {
    status: number;
    code: string;
    description: string;
  }[];
}

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
  apiEndpoints?: DocApiEndpoint[];
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
    title: "Quickstart & REST API Reference",
    subtitle: "Integrate intelligent edge link shortening, real-time analytics, and conversion tracking with our high-performance REST API and TypeScript SDK.",
    description: "Complete REST API reference, base URLs, authentication headers, rate limits, SDK quickstart, and endpoint catalog for developers.",
    image: "/marketing-FCI/cosmos_1739739224.jpeg",
    readTime: "5 min read",
    overview: [
      "The LShorter REST API provides programmatic access to all link management, edge routing, privacy cloaking, conversion attribution, and telemetry features of the LShorter platform.",
      "All requests are routed to Cloudflare's global edge network (over 300+ data centers worldwide) to guarantee sub-15ms response times, 99.99% availability, and automatic TLS 1.3 encryption.",
      "Developers can interact directly via standard HTTP requests or use the official typed Node.js / TypeScript SDK (lshorter-api)."
    ],
    keyPoints: [
      {
        title: "Standard REST & JSON",
        description: "Predictable resource-oriented URLs, standard HTTP methods (GET, POST, PATCH, DELETE), and JSON-encoded request & response bodies."
      },
      {
        title: "Bearer Token Authentication",
        description: "Secure every request with the Authorization: Bearer <API_KEY> header. Manage keys and scopes directly from your developer dashboard."
      },
      {
        title: "High Throughput & Rate Limits",
        description: "Generous rate limits of 1,000 requests per minute per API key, with real-time rate limit headers included in every HTTP response."
      },
      {
        title: "Global Edge Execution",
        description: "Redirection logic, geolocation resolution, and atomic click counters execute directly in V8 isolates at the Edge without origin latency."
      }
    ],
    apiEndpoints: [
      {
        name: "Create Short Link",
        method: "POST",
        path: "/api/v1/links",
        description: "Creates a new shortened URL with optional custom slug, tags, expiration timestamp, maximum click limits, PIN protection, URL cloaking, and geographic routing rules.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "1,000 req / min",
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer token containing your secret API key.", example: "Bearer lsho_live_89f023ab912" },
          { name: "Content-Type", type: "string", required: true, description: "Must be set to application/json.", example: "application/json" }
        ],
        bodyParams: [
          { name: "url", type: "string (url)", required: true, description: "The destination URL that visitors will be redirected to.", example: "https://my-store.com/summer-sale" },
          { name: "slug", type: "string", required: false, description: "Custom alias for the link. If omitted, a high-entropy 7-character string is generated automatically.", example: "summer-2026" },
          { name: "tags", type: "string[]", required: false, description: "Array of categorization tags for filtering analytics.", example: '["marketing", "summer-promo"]' },
          { name: "maxClicks", type: "number", required: false, description: "Maximum authorized clicks before the link automatically deactivates.", example: "500" },
          { name: "expiresAt", type: "string (ISO 8601)", required: false, description: "UTC expiration timestamp after which the link becomes inactive.", example: "2026-10-31T23:59:59Z" },
          { name: "expiredRedirectUrl", type: "string (url)", required: false, description: "Alternative fallback URL to redirect visitors to after the link expires.", example: "https://my-store.com/sale-ended" },
          { name: "pinCode", type: "string (4 digits)", required: false, description: "4-digit security PIN required to access the destination URL.", example: "8492" },
          { name: "maskUrl", type: "boolean", required: false, description: "When true, masks destination URL by serving content inside a branded iframe.", example: "false", default: "false" },
          { name: "metaTitle", type: "string", required: false, description: "Custom Open Graph / social media title.", example: "Exclusive Summer Offer" },
          { name: "ogDescription", type: "string", required: false, description: "Custom Open Graph description for social preview cards.", example: "Get 30% off our 2026 collection today." },
          { name: "ogImage", type: "string (url)", required: false, description: "Banner image URL (1200x630px) for social media previews.", example: "https://my-store.com/og-banner.jpg" }
        ],
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X POST "https://lsho.cc/api/v1/links" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://my-store.com/summer-sale",
    "slug": "summer-2026",
    "tags": ["marketing", "summer-promo"],
    "maxClicks": 500,
    "expiresAt": "2026-10-31T23:59:59Z"
  }'`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `import { LShorter } from "lshorter-api";

const lshorter = new LShorter({ apiKey: process.env.LSHORTER_API_KEY! });

const link = await lshorter.links.create({
  url: "https://my-store.com/summer-sale",
  slug: "summer-2026",
  tags: ["marketing", "summer-promo"],
  maxClicks: 500,
  expiresAt: new Date("2026-10-31T23:59:59Z"),
});

console.log("Short link:", link.shortUrl);`
          },
          {
            name: "Node.js (Fetch)",
            language: "javascript",
            code: `const response = await fetch("https://lsho.cc/api/v1/links", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${process.env.LSHORTER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "https://my-store.com/summer-sale",
    slug: "summer-2026",
    tags: ["marketing", "summer-promo"],
  }),
});

const data = await response.json();
console.log(data);`
          },
          {
            name: "Python (Requests)",
            language: "python",
            code: `import os
import requests

url = "https://lsho.cc/api/v1/links"
headers = {
    "Authorization": f"Bearer {os.environ.get('LSHORTER_API_KEY')}",
    "Content-Type": "application/json"
}
payload = {
    "url": "https://my-store.com/summer-sale",
    "slug": "summer-2026",
    "tags": ["marketing", "summer-promo"]
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`
          },
          {
            name: "Go",
            language: "go",
            code: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

func main() {
	payload := map[string]interface{}{
		"url":  "https://my-store.com/summer-sale",
		"slug": "summer-2026",
		"tags": []string{"marketing", "summer-promo"},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://lsho.cc/api/v1/links", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("LSHORTER_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println("Response Status:", resp.Status)
}`
          },
          {
            name: "PHP",
            language: "php",
            code: `<?php
$ch = curl_init("https://lsho.cc/api/v1/links");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . getenv("LSHORTER_API_KEY"),
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "url" => "https://my-store.com/summer-sale",
    "slug" => "summer-2026",
    "tags" => ["marketing", "summer-promo"]
]));

$response = curl_exec($ch);
curl_close($ch);
echo $response;`
          }
        ],
        responses: [
          {
            status: 201,
            statusText: "Created",
            description: "Short link created successfully.",
            json: `{
  "id": "link_89f023ab912",
  "slug": "summer-2026",
  "shortUrl": "https://lsho.cc/summer-2026",
  "targetUrl": "https://my-store.com/summer-sale",
  "domain": "lsho.cc",
  "clicksCount": 0,
  "uniqueClicks": 0,
  "maxClicks": 500,
  "remainingClicks": 500,
  "expiresAt": "2026-10-31T23:59:59.000Z",
  "isProtected": false,
  "maskUrl": false,
  "tags": ["marketing", "summer-promo"],
  "status": "active",
  "createdAt": "2026-09-17T12:00:00.000Z",
  "updatedAt": "2026-09-17T12:00:00.000Z"
}`
          }
        ],
        errorCodes: [
          { status: 400, code: "INVALID_URL", description: "The destination URL provided is invalid or malformed." },
          { status: 401, code: "UNAUTHORIZED", description: "Missing or invalid Bearer API key." },
          { status: 409, code: "SLUG_ALREADY_EXISTS", description: "The requested custom slug is already claimed by another link." },
          { status: 422, code: "INVALID_EXPIRATION", description: "expiresAt must be a valid future ISO 8601 timestamp." },
          { status: 429, code: "RATE_LIMIT_EXCEEDED", description: "You have exceeded your account's rate limit (1,000 req/min)." }
        ]
      },
      {
        name: "List Short Links",
        method: "GET",
        path: "/api/v1/links",
        description: "Retrieves a paginated list of all short links created under your organization, with optional search query, tag filters, and sort orders.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "1,000 req / min",
        queryParams: [
          { name: "page", type: "number", required: false, description: "Page number to retrieve.", example: "1", default: "1" },
          { name: "limit", type: "number", required: false, description: "Number of links per page (max 100).", example: "20", default: "20" },
          { name: "tag", type: "string", required: false, description: "Filter links by specific tag name.", example: "marketing" },
          { name: "search", type: "string", required: false, description: "Search query matching against slug or target URL.", example: "summer" },
          { name: "sortBy", type: "string (createdAt | clicksCount | remainingClicks)", required: false, description: "Sorting criteria.", example: "clicksCount", default: "createdAt" },
          { name: "order", type: "string (asc | desc)", required: false, description: "Sort direction.", example: "desc", default: "desc" }
        ],
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X GET "https://lsho.cc/api/v1/links?page=1&limit=20&tag=marketing" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY"`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `const links = await lshorter.links.list({
  page: 1,
  limit: 20,
  tag: "marketing",
  sortBy: "clicksCount",
  order: "desc",
});

console.log(\`Found \${links.total} links:\`, links.data);`
          }
        ],
        responses: [
          {
            status: 200,
            statusText: "OK",
            description: "List of short links returned with pagination metadata.",
            json: `{
  "data": [
    {
      "id": "link_89f023ab912",
      "slug": "summer-2026",
      "shortUrl": "https://lsho.cc/summer-2026",
      "targetUrl": "https://my-store.com/summer-sale",
      "clicksCount": 1420,
      "uniqueClicks": 1180,
      "tags": ["marketing", "summer-promo"],
      "status": "active",
      "createdAt": "2026-09-17T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}`
          }
        ]
      },
      {
        name: "Get User Profile & Limits",
        method: "GET",
        path: "/api/v1/users/me",
        description: "Returns the authenticated user profile, organization ID, email, full name, active subscription tier, and monthly usage quota limits.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "1,000 req / min",
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X GET "https://lsho.cc/api/v1/users/me" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY"`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `const me = await lshorter.users.me();
console.log("Logged in as:", me.fullName, \`(\${me.email})\`);
console.log("Monthly click usage:", me.clicksThisMonth, "/", me.planLimits.monthlyClicks);`
          }
        ],
        responses: [
          {
            status: 200,
            statusText: "OK",
            description: "Authenticated profile and quota telemetry.",
            json: `{
  "id": "usr_991823ab",
  "email": "developer@my-company.com",
  "fullName": "Sarah Connor",
  "organization": "Cyberdyne Corp",
  "plan": "enterprise",
  "clicksThisMonth": 482910,
  "linksCount": 384,
  "domainsCount": 4,
  "planLimits": {
    "monthlyClicks": 5000000,
    "customDomains": 10,
    "teamMembers": 25,
    "retentionDays": 365
  },
  "createdAt": "2025-01-10T09:00:00.000Z"
}`
          }
        ]
      }
    ],
    codeSnippets: [
      {
        title: "1. Official SDK Installation",
        description: "Install the official lshorter-api package using your favorite package manager:",
        snippet: {
          language: "bash",
          filename: "Terminal",
          code: "npm install lshorter-api",
          tabs: [
            { name: "npm", code: "npm install lshorter-api", language: "bash" },
            { name: "pnpm", code: "pnpm add lshorter-api", language: "bash" },
            { name: "yarn", code: "yarn add lshorter-api", language: "bash" },
            { name: "bun", code: "bun add lshorter-api", language: "bash" }
          ]
        }
      },
      {
        title: "2. Client Initialization",
        description: "Configure your LShorter client with your secret API key:",
        snippet: {
          language: "typescript",
          filename: "lib/lshorter.ts",
          code: `import { LShorter } from "lshorter-api";

export const lshorter = new LShorter({
  apiKey: process.env.LSHORTER_API_KEY!,
  endpoint: "https://lsho.cc/api/v1", // Optional custom endpoint
  timeout: 5000, // 5s request timeout
  maxRetries: 3, // Auto-retry on 5xx or network hiccups
});`
        }
      },
      {
        title: "3. Creating Your First Short Link",
        description: "Create a trackable short link with custom slug and tags:",
        snippet: {
          language: "typescript",
          filename: "create-link.ts",
          code: `import { lshorter } from "@/lib/lshorter";

const link = await lshorter.links.create({
  url: "https://my-store.com/summer-promo",
  slug: "summer-2026",
  tags: ["marketing", "summer-sale"],
});

console.log("Short URL generated:", link.shortUrl);
// Output: https://lsho.cc/summer-2026`
        }
      },
      {
        title: "4. Recording Conversion with Customer Avatar (avatarUrl & customerAvatar)",
        description: "Record a sale with customer profile photo / avatar displayed in live dashboards:",
        snippet: {
          language: "typescript",
          filename: "track-purchase.ts",
          code: `import { lshorter } from "@/lib/lshorter";

// Record monetary revenue and attribute it to the click with customer avatar
await lshorter.track.conversion({
  eventName: "purchase",
  amount: 49.00,
  currency: "USD",
  clickId: "clk_9921ab01", // Captured from the short link visit (?ref=clk_...)
  orderId: "ch_9921823ab",
  customer: {
    email: "alex@example.com",
    name: "Alex Johnson",
    avatarUrl: "https://lh3.googleusercontent.com/a/ACg8oc...", // Profile photo from Google OAuth or Gravatar
  },
});`
        }
      },
      {
        title: "5. Querying Real-Time Revenue & Clicks Telemetry",
        description: "Fetch live click counts, tracked revenue amount, and average earnings per click (EPC):",
        snippet: {
          language: "typescript",
          filename: "get-analytics.ts",
          code: `import { lshorter } from "@/lib/lshorter";

const stats = await lshorter.analytics.getRevenue("summer-2026", { period: "30d" });

console.log("Total Clicks:", stats.totalClicks);
console.log("Tracked Revenue:", stats.trackedRevenue, "USD");
console.log("Earnings Per Click (EPC):", stats.epc, "USD/click");`
        }
      }
    ],
    bestPractices: [
      "Keep your API key private: Store it in environment variables (LSHORTER_API_KEY) and never check it into public version control.",
      "Use HTTP Keep-Alive connection pooling across requests to minimize TLS handshake latency.",
      "Inspect rate limit headers (x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset) to proactively manage traffic spikes.",
      "Implement idempotent request handling when retrying POST endpoints."
    ]
  },
  {
    slug: "geo-routing",
    title: "Dynamic Routing & Edge Geolocation",
    subtitle: "Redirect visitors to contextual URLs based on their origin country with ultra-low latency.",
    description: "Guide and REST API reference for configuring country-based geographic redirection rules (ISO 3166-1) evaluated directly on Cloudflare Edge nodes.",
    image: "/marketing-FCI/cosmos_1746304416.jpeg",
    readTime: "4 min read",
    overview: [
      "Geographic routing optimizes user experience and conversion rates by serving localized content (language, currency, catalog) from a single shared link.",
      "Rules evaluation happens directly at Cloudflare Edge nodes during DNS resolution and TLS handshake, ensuring average redirection times under 15 milliseconds without backend server round-trips."
    ],
    keyPoints: [
      {
        title: "Closest-to-User Resolution",
        description: "The visitor's country is detected from the CF-IPCountry Edge header with zero extra proxy latency."
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
    apiEndpoints: [
      {
        name: "Update Geographic Routing Rules",
        method: "PATCH",
        path: "/api/v1/links/:id/routing",
        description: "Configures or updates country-specific destination rules and global fallback URL for a given short link.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "1,000 req / min",
        pathParams: [
          { name: "id", type: "string", required: true, description: "The short link ID or slug alias.", example: "global-promo" }
        ],
        bodyParams: [
          { name: "fallbackUrl", type: "string (url)", required: true, description: "Default URL used when visitor origin country has no matching rule.", example: "https://store.com/global" },
          { name: "rules", type: "object[]", required: true, description: "Array of country mapping rules.", example: '[{"country": "US", "targetUrl": "https://store.com/us"}, {"country": "DE", "targetUrl": "https://store.com/de"}]' },
          { name: "rules[].country", type: "string (ISO 3166-1 alpha-2)", required: true, description: "Two-letter uppercase country code.", example: "US" },
          { name: "rules[].targetUrl", type: "string (url)", required: true, description: "Target URL for visitors from this country.", example: "https://store.com/us/fall-sale" }
        ],
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X PATCH "https://lsho.cc/api/v1/links/global-promo/routing" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fallbackUrl": "https://store.com/global",
    "rules": [
      { "country": "US", "targetUrl": "https://store.com/us/fall-sale" },
      { "country": "GB", "targetUrl": "https://store.com/uk/autumn-sale" },
      { "country": "DE", "targetUrl": "https://store.com/de/herbst-angebote" },
      { "country": "FR", "targetUrl": "https://store.com/fr/offres-automne" }
    ]
  }'`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `import { lshorter } from "@/lib/lshorter";

await lshorter.links.updateRouting("global-promo", {
  fallbackUrl: "https://store.com/global",
  rules: [
    { country: "US", targetUrl: "https://store.com/us/fall-sale" },
    { country: "GB", targetUrl: "https://store.com/uk/autumn-sale" },
    { country: "DE", targetUrl: "https://store.com/de/herbst-angebote" },
    { country: "FR", targetUrl: "https://store.com/fr/offres-automne" },
  ],
});`
          },
          {
            name: "Python",
            language: "python",
            code: `import requests, os

requests.patch(
    "https://lsho.cc/api/v1/links/global-promo/routing",
    headers={"Authorization": f"Bearer {os.getenv('LSHORTER_API_KEY')}"},
    json={
        "fallbackUrl": "https://store.com/global",
        "rules": [
            {"country": "US", "targetUrl": "https://store.com/us/fall-sale"},
            {"country": "GB", "targetUrl": "https://store.com/uk/autumn-sale"}
        ]
    }
)`
          }
        ],
        responses: [
          {
            status: 200,
            statusText: "OK",
            description: "Routing configuration deployed immediately to all Edge nodes.",
            json: `{
  "slug": "global-promo",
  "routingEnabled": true,
  "fallbackUrl": "https://store.com/global",
  "rulesCount": 4,
  "activeCountries": ["US", "GB", "DE", "FR"],
  "updatedAt": "2026-09-17T12:15:00.000Z"
}`
          }
        ],
        errorCodes: [
          { status: 400, code: "INVALID_COUNTRY_CODE", description: "Country code must be a valid 2-letter uppercase ISO 3166-1 alpha-2 string." },
          { status: 404, code: "LINK_NOT_FOUND", description: "No link found matching the provided slug or ID." }
        ]
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
    { country: "US", targetUrl: "https://store.com/us/fall-sale" },
    { country: "GB", targetUrl: "https://store.com/uk/autumn-sale" },
    { country: "DE", targetUrl: "https://store.com/de/herbst-angebote" },
    { country: "FR", targetUrl: "https://store.com/fr/offres-automne" },
  ],
});`
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
  "rulesCount": 4,
  "activeCountries": ["US", "GB", "DE", "FR"],
  "updatedAt": "2026-09-17T12:15:00.000Z"
}`
    },
    bestPractices: [
      "Ensure your fallback URL is always functional and globally accessible.",
      "To test your rules in staging without a VPN, pass the X-Override-Country: US HTTP header in your test requests.",
      "Regularly review your unrouted countries in the real-time telemetry dashboard to add high-converting regions."
    ]
  },
  {
    slug: "pin-protection",
    title: "Advanced Security & PIN Code Protection",
    subtitle: "Protect confidential documents, pitch decks, and private links with a 4-digit PIN code verified on the fly.",
    description: "REST API guide and technical specification for setting up PIN codes on short links, blocking brute-force attacks, and granting ephemeral sessions.",
    image: "/marketing-FCI/cosmos_1796978290.jpeg",
    readTime: "3 min read",
    overview: [
      "PIN code protection adds an instant zero-friction access control barrier without requiring visitors to create complex accounts or navigate heavy OAuth flows.",
      "When a visitor opens a protected link, a lightweight, secure edge interface prompts them for the 4-digit PIN. Upon validation, an ephemeral session token is granted and redirection executes immediately."
    ],
    keyPoints: [
      {
        title: "Cryptographic PIN Hashing",
        description: "PIN codes are never stored in plaintext; they are securely salted and hashed using Argon2id / bcrypt."
      },
      {
        title: "Anti-Bruteforce Defense",
        description: "After 5 consecutive failed attempts, the visitor's IP address is temporarily locked out for 15 minutes."
      },
      {
        title: "Ephemeral Session Token",
        description: "Once validated, redirection takes place immediately with a short-lived cryptographically signed cookie."
      }
    ],
    apiEndpoints: [
      {
        name: "Update PIN Security Settings",
        method: "PATCH",
        path: "/api/v1/links/:id/security",
        description: "Enables, updates, or disables PIN code protection on a specific short link.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "1,000 req / min",
        pathParams: [
          { name: "id", type: "string", required: true, description: "Short link ID or slug alias.", example: "finance-q3" }
        ],
        bodyParams: [
          { name: "pinCode", type: "string | null", required: true, description: "4-digit PIN code string, or null to disable protection.", example: "8492" },
          { name: "maxAttempts", type: "number", required: false, description: "Maximum failed attempts allowed before temporary IP block.", example: "5", default: "5" }
        ],
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X PATCH "https://lsho.cc/api/v1/links/finance-q3/security" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "pinCode": "8492",
    "maxAttempts": 5
  }'`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `import { lshorter } from "@/lib/lshorter";

// Set or change PIN code
await lshorter.links.updateSecurity("finance-q3", {
  pinCode: "8492",
  maxAttempts: 5,
});

// Disable PIN protection
await lshorter.links.updateSecurity("finance-q3", {
  pinCode: null,
});`
          }
        ],
        responses: [
          {
            status: 200,
            statusText: "OK",
            description: "Security settings updated successfully.",
            json: `{
  "id": "link_sec_991823ab",
  "slug": "finance-q3",
  "shortUrl": "https://lsho.cc/finance-q3",
  "isProtected": true,
  "maxAttempts": 5,
  "status": "active",
  "updatedAt": "2026-09-17T12:20:00.000Z"
}`
          }
        ]
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
      "Avoid trivial PINs like 0000 or 1234 for sensitive financial documents or client proposals.",
      "Distribute the PIN code through an out-of-band communication channel (e.g. SMS / WhatsApp for PIN, Email for short link).",
      "Pair PIN protection with an expiration date (expiresAt) for defense-in-depth confidentiality."
    ]
  },
  {
    slug: "realtime-analytics",
    title: "Real-Time Telemetry & Metrics API",
    subtitle: "Extract rich audience analytics, geographic breakdown, device statistics, and click telemetry with millisecond precision.",
    description: "REST API reference for querying real-time telemetry: click volumes, deduplicated unique visitors, geographic distribution, operating systems, browsers, and referrers.",
    image: "/marketing-FCI/cosmos_549824580.jpeg",
    readTime: "4 min read",
    overview: [
      "Every interaction with your short links produces instant metrics aggregated at the Edge. No personally identifiable information (PII) is stored, ensuring native GDPR, CCPA, and PECR compliance.",
      "Redirection counters (count) and financial conversion amounts (amount) synchronize in real time via REST API to power live dashboards, automation alerts, or financial profitability tracking systems (ROI/EPC)."
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
    apiEndpoints: [
      {
        name: "Get Link Analytics",
        method: "GET",
        path: "/api/v1/analytics/:slug",
        description: "Retrieves aggregated click telemetry, country distribution, device breakdown, browser statistics, and top referring sources for a specific short link.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "1,000 req / min",
        pathParams: [
          { name: "slug", type: "string", required: true, description: "Short link slug alias.", example: "launch-2026" }
        ],
        queryParams: [
          { name: "period", type: "string (24h | 7d | 30d | 90d | all)", required: false, description: "Timeframe window for metrics aggregation.", example: "30d", default: "30d" },
          { name: "country", type: "string (ISO 3166-1 alpha-2)", required: false, description: "Filter statistics by a specific country code.", example: "US" },
          { name: "device", type: "string (mobile | desktop | tablet)", required: false, description: "Filter statistics by device type.", example: "mobile" }
        ],
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X GET "https://lsho.cc/api/v1/analytics/launch-2026?period=30d" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY"`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `import { lshorter } from "@/lib/lshorter";

const stats = await lshorter.analytics.get("launch-2026", {
  period: "30d",
});

console.log("Total Clicks:", stats.totalClicks);
console.log("Unique Visitors:", stats.uniqueVisitors);
console.log("Top Countries:", stats.topCountries);`
          },
          {
            name: "Python",
            language: "python",
            code: `import requests, os

resp = requests.get(
    "https://lsho.cc/api/v1/analytics/launch-2026",
    headers={"Authorization": f"Bearer {os.getenv('LSHORTER_API_KEY')}"},
    params={"period": "30d"}
)
print(resp.json())`
          }
        ],
        responses: [
          {
            status: 200,
            statusText: "OK",
            description: "Telemetry payload containing comprehensive traffic analysis.",
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
          }
        ]
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
      }
    ],
    bestPractices: [
      "Use the period query parameter to fetch exact time windows for automated weekly and monthly campaign reporting.",
      "Leverage mobile vs desktop breakdown to fine-tune your target page responsive design and load speed.",
      "Combine UTM parameters with the referrer telemetry to isolate paid ad performance from organic social traffic."
    ]
  },
  {
    slug: "click-limits-and-expiration",
    title: "Click Limits & Scheduled Expiration",
    subtitle: "Automate campaign closures with maximum click quotas (flash sales) and precise UTC expiration schedules.",
    description: "REST API guide to setting click caps (maxClicks), remaining click calculations (remainingClicks), and automated expired fallback redirection.",
    image: "/marketing-FCI/cosmos_2136974997.jpeg",
    readTime: "3 min read",
    overview: [
      "Limitation and expiration features automate the conclusion of marketing campaigns, limited promo deals, or restricted beta invites without requiring manual developer intervention.",
      "Every visit triggers an atomic increment of clicksCount directly on Cloudflare Edge nodes. Once a limit is reached (clicksCount >= maxClicks) or the expiration date passes, the link instantly transitions in under 10ms to inactive status or redirects to a fallback URL."
    ],
    keyPoints: [
      {
        title: "Lock-Free Atomic Counter (Count)",
        description: "Edge atomic increment eliminates race conditions during simultaneous viral traffic spikes (50,000+ clicks/second)."
      },
      {
        title: "Real-Time remainingClicks Calculation",
        description: "remainingClicks = Math.max(0, maxClicks - clicksCount). Powers live scarcity and urgency badges."
      },
      {
        title: "ISO 8601 UTC Timestamps",
        description: "Set an exact universal expiration date and time without timezone conversion issues."
      },
      {
        title: "Customizable Fallback Redirect",
        description: "Redirect to an 'Offer Ended' waitlist page or display a branded expired screen."
      }
    ],
    apiEndpoints: [
      {
        name: "Update Click Limits & Expiration",
        method: "PATCH",
        path: "/api/v1/links/:id/limits",
        description: "Updates the maximum click quota, expiration timestamp, or expired fallback URL for an active link.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "1,000 req / min",
        pathParams: [
          { name: "id", type: "string", required: true, description: "Short link slug or ID.", example: "vip-flash" }
        ],
        bodyParams: [
          { name: "maxClicks", type: "number | null", required: false, description: "Maximum authorized clicks, or null to remove the limit.", example: "500" },
          { name: "expiresAt", type: "string (ISO 8601) | null", required: false, description: "UTC expiration timestamp, or null to remove expiration.", example: "2026-11-15T23:59:59Z" },
          { name: "expiredRedirectUrl", type: "string (url)", required: false, description: "Destination URL after expiration.", example: "https://events.com/waitlist" }
        ],
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X PATCH "https://lsho.cc/api/v1/links/vip-flash/limits" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "maxClicks": 500,
    "expiresAt": "2026-11-15T23:59:59Z",
    "expiredRedirectUrl": "https://events.com/waitlist"
  }'`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `import { lshorter } from "@/lib/lshorter";

await lshorter.links.updateLimits("vip-flash", {
  maxClicks: 500,
  expiresAt: new Date("2026-11-15T23:59:59Z"),
  expiredRedirectUrl: "https://events.com/waitlist",
});`
          }
        ],
        responses: [
          {
            status: 200,
            statusText: "OK",
            description: "Updated limits applied across all global Edge points.",
            json: `{
  "id": "link_lim_481029",
  "slug": "vip-flash",
  "shortUrl": "https://lsho.cc/vip-flash",
  "clicksCount": 243,
  "maxClicks": 500,
  "remainingClicks": 257,
  "expiresAt": "2026-11-15T23:59:59.000Z",
  "expiredRedirectUrl": "https://events.com/waitlist",
  "isExpired": false,
  "status": "active"
}`
          }
        ]
      }
    ],
    codeSnippets: [
      {
        title: "1. Checking Atomic Counters and remainingClicks",
        description: "Monitor quota consumption in real time for customer user interfaces:",
        snippet: {
          language: "typescript",
          filename: "check-remaining-clicks.ts",
          code: `import { lshorter } from "@/lib/lshorter";

const linkStatus = await lshorter.links.get("vip-flash");

console.log("Consumed clicks counter (count):", linkStatus.clicksCount); // e.g. 243
console.log("Max authorized limit (maxClicks):", linkStatus.maxClicks); // 500
console.log("Remaining clicks / spots:", linkStatus.remainingClicks); // 257
console.log("Current link status:", linkStatus.isExpired ? "Expired" : "Active");`
        }
      }
    ],
    bestPractices: [
      "Always configure an expiredRedirectUrl so you never lose valuable customer traffic after your campaign ends.",
      "Ensure timestamps are passed in standard UTC (ISO 8601 with trailing Z) to avoid local daylight savings or timezone offset bugs.",
      "Subscribe to webhooks (link.limit_reached, link.expired) to receive automated notifications in Slack or Discord."
    ]
  },
  {
    slug: "url-masking",
    title: "Source URL Masking & Privacy (Cloaking)",
    subtitle: "Preserve brand consistency and mask complex affiliate or third-party destination URLs in the browser address bar.",
    description: "REST API guide to configuring URL cloaking, custom page titles, and sandbox iframe encapsulation.",
    image: "/marketing-FCI/cosmos_227768569.jpeg",
    readTime: "3 min read",
    overview: [
      "URL Cloaking displays destination page content while keeping your branded short domain in the visitor's browser address bar.",
      "This technique is widely used for lengthy affiliate referral links, forms hosted on third-party SaaS platforms (Typeform, Notion, Airtable), and white-label enterprise client portals."
    ],
    keyPoints: [
      {
        title: "Brand Preservation",
        description: "Visitors constantly see your clean brand domain instead of a lengthy technical URL."
      },
      {
        title: "Dynamic Titles & Favicons",
        description: "Customize browser tab titles and favicons to perfectly match your brand identity."
      },
      {
        title: "Secure Sandboxing",
        description: "Safe containerization with strict Content-Security-Policy (CSP) headers protecting visitor privacy."
      }
    ],
    apiEndpoints: [
      {
        name: "Enable URL Masking",
        method: "PATCH",
        path: "/api/v1/links/:id/masking",
        description: "Enables or disables URL cloaking and configures the embedded page title and favicon metadata.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "1,000 req / min",
        pathParams: [
          { name: "id", type: "string", required: true, description: "Short link slug or ID.", example: "partner-deal" }
        ],
        bodyParams: [
          { name: "maskUrl", type: "boolean", required: true, description: "Set to true to enable cloaking.", example: "true" },
          { name: "pageTitle", type: "string", required: false, description: "Custom HTML title displayed in the browser tab.", example: "Exclusive Partner Offer | LShorter" },
          { name: "faviconUrl", type: "string (url)", required: false, description: "Custom favicon image URL.", example: "https://my-brand.com/favicon.ico" }
        ],
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X PATCH "https://lsho.cc/api/v1/links/partner-deal/masking" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "maskUrl": true,
    "pageTitle": "Exclusive Partner Offer | LShorter",
    "faviconUrl": "https://my-brand.com/favicon.ico"
  }'`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `import { lshorter } from "@/lib/lshorter";

await lshorter.links.updateMasking("partner-deal", {
  maskUrl: true,
  pageTitle: "Exclusive Partner Offer | LShorter",
  faviconUrl: "https://my-brand.com/favicon.ico",
});`
          }
        ],
        responses: [
          {
            status: 200,
            statusText: "OK",
            description: "Masking parameters configured successfully.",
            json: `{
  "id": "link_msk_1029481",
  "slug": "partner-deal",
  "shortUrl": "https://lsho.cc/partner-deal",
  "maskUrl": true,
  "pageTitle": "Exclusive Partner Offer | LShorter",
  "faviconUrl": "https://my-brand.com/favicon.ico",
  "status": "active"
}`
          }
        ]
      }
    ],
    codeSnippets: [
      {
        title: "1. Creating a Masked Link",
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
    bestPractices: [
      "Ensure target destination websites allow iframe embedding (verify they do not send strict X-Frame-Options: DENY headers).",
      "Set a clear pageTitle so the browser tab accurately reflects presented content.",
      "Test responsive viewports on mobile devices to ensure embedded iframe content scrolls smoothly."
    ]
  },
  {
    slug: "dynamic-qr-codes",
    title: "Dynamic QR Code Generation API",
    subtitle: "Create, customize, and stream infinite-resolution vector SVG and PNG QR codes dynamically.",
    description: "REST API documentation for dynamic QR code generation, color styling, error correction levels, and real-time scan telemetry.",
    image: "/marketing-FCI/cosmos_302657415.jpeg",
    readTime: "3 min read",
    overview: [
      "A dynamic LShorter QR code encodes the permanent short URL rather than the final destination. You can update the target destination anytime via dashboard or API, even after millions of physical brochures, posters, or packaging materials have been printed.",
      "Every physical scan is recorded in real-time telemetry with mobile scan differentiation and geographic origin tracking."
    ],
    keyPoints: [
      {
        title: "Editable Without Re-Printing",
        description: "Change the target destination URL of a printed QR code in one click with zero downtime."
      },
      {
        title: "Vector SVG & High-Res PNG",
        description: "Export infinite-resolution vector SVG for billboards and print media or PNG for digital displays."
      },
      {
        title: "Error Correction Levels",
        description: "Support for L, M, Q, and H error correction levels, allowing reliable scans even with center logo overlays."
      }
    ],
    apiEndpoints: [
      {
        name: "Generate Dynamic QR Code",
        method: "GET",
        path: "/api/v1/qr/:slug",
        description: "Streams a customized dynamic QR code image in SVG or PNG format.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "1,000 req / min",
        pathParams: [
          { name: "slug", type: "string", required: true, description: "Short link slug alias.", example: "launch-2026" }
        ],
        queryParams: [
          { name: "format", type: "string (svg | png)", required: false, description: "Image output format.", example: "svg", default: "svg" },
          { name: "size", type: "number", required: false, description: "Image dimension in pixels (for PNG) or viewBox size (for SVG).", example: "512", default: "512" },
          { name: "errorCorrectionLevel", type: "string (L | M | Q | H)", required: false, description: "QR code redundancy level (H = 30% damage tolerance).", example: "H", default: "M" },
          { name: "darkColor", type: "string (hex)", required: false, description: "Hex color code for the foreground QR dots.", example: "#ff6600", default: "#000000" },
          { name: "lightColor", type: "string (hex)", required: false, description: "Hex color code for the background.", example: "#FAF7F2", default: "#ffffff" },
          { name: "margin", type: "number", required: false, description: "Quiet zone border margin width in modules.", example: "2", default: "2" }
        ],
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X GET "https://lsho.cc/api/v1/qr/launch-2026?format=svg&size=512&darkColor=%23ff6600" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY" \\
  --output qr-launch.svg`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `import { lshorter } from "@/lib/lshorter";
import fs from "node:fs/promises";

// Generate vector SVG QR code
const qrSvg = await lshorter.qr.generate("launch-2026", {
  format: "svg",
  size: 512,
  errorCorrectionLevel: "H",
  darkColor: "#ff6600",
  lightColor: "#FAF7F2",
});

await fs.writeFile("qr-launch.svg", qrSvg);`
          },
          {
            name: "Python",
            language: "python",
            code: `import requests, os

resp = requests.get(
    "https://lsho.cc/api/v1/qr/launch-2026",
    headers={"Authorization": f"Bearer {os.getenv('LSHORTER_API_KEY')}"},
    params={"format": "png", "size": 600, "darkColor": "#ff6600"}
)

with open("qr-launch.png", "wb") as f:
    f.write(resp.content)`
          }
        ],
        responses: [
          {
            status: 200,
            statusText: "OK",
            description: "Binary image payload (image/svg+xml or image/png).",
            json: `// Content-Type: image/svg+xml or image/png
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="100%" height="100%" fill="#FAF7F2"/>
  <path d="M0 0h140v140H0z..." fill="#ff6600"/>
</svg>`
          }
        ]
      }
    ],
    codeSnippets: [
      {
        title: "1. Generating QR Codes via SDK",
        description: "Download QR codes in SVG or PNG format:",
        snippet: {
          language: "typescript",
          filename: "get-qr-code.ts",
          code: `import { lshorter } from "@/lib/lshorter";
import fs from "node:fs/promises";

const qrSvg = await lshorter.qr.generate("launch-2026", {
  format: "svg",
  size: 512,
  errorCorrectionLevel: "H",
  darkColor: "#ff6600",
  lightColor: "#FAF7F2",
});

await fs.writeFile("qr-launch.svg", qrSvg);
console.log("Vector SVG QR Code exported successfully!");`
        }
      }
    ],
    bestPractices: [
      "Use error correction level 'H' (30% redundancy) whenever placing a custom brand logo or icon in the center of the QR code.",
      "Always choose SVG vector format for print and packaging designs to guarantee razor-sharp edges at any physical dimension.",
      "Test QR readability across both iOS (native Camera app) and Android scanner apps before initiating physical print production."
    ]
  },
  {
    slug: "webhooks-and-events",
    title: "Webhooks & Real-Time Events API",
    subtitle: "Subscribe to real-time event streams, receive instant HTTP notifications, and verify HMAC-SHA256 signatures.",
    description: "REST API guide for registering webhook endpoints, validating cryptographic signatures, and handling click, conversion, limit, and expiration events.",
    image: "/marketing-FCI/cosmos_938538719.jpeg",
    readTime: "4 min read",
    overview: [
      "LShorter webhooks notify your backend systems in real time whenever an event occurs on your short links (click registered, conversion recorded, quota reached, link expired).",
      "All outgoing HTTP POST payloads are cryptographically signed with an HMAC-SHA256 secret key via the x-lshorter-signature header to guarantee authenticity and prevent tampering."
    ],
    keyPoints: [
      {
        title: "Supported Event Types",
        description: "link.clicked, link.converted, link.limit_reached, link.expired, link.created, link.deleted."
      },
      {
        title: "Cryptographic HMAC-SHA256 Signatures",
        description: "Validate the x-lshorter-signature header to verify payload integrity before processing."
      },
      {
        title: "Exponential Backoff Retries",
        description: "Automatic retry schedule with exponential backoff if your webhook receiver returns a 5xx error or times out."
      }
    ],
    apiEndpoints: [
      {
        name: "Create Webhook Subscription",
        method: "POST",
        path: "/api/v1/webhooks",
        description: "Registers a new webhook endpoint URL to receive automated HTTP POST event notifications.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "1,000 req / min",
        bodyParams: [
          { name: "url", type: "string (https url)", required: true, description: "Your server endpoint URL where notifications will be sent.", example: "https://api.my-domain.com/webhooks/lshorter" },
          { name: "events", type: "string[]", required: true, description: "Array of event types to subscribe to.", example: '["link.clicked", "link.converted", "link.limit_reached"]' },
          { name: "description", type: "string", required: false, description: "Optional description for internal identification.", example: "Production conversion sync webhook" }
        ],
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X POST "https://lsho.cc/api/v1/webhooks" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://api.my-domain.com/webhooks/lshorter",
    "events": ["link.clicked", "link.converted", "link.limit_reached"],
    "description": "Production conversion sync webhook"
  }'`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `import { lshorter } from "@/lib/lshorter";

const webhook = await lshorter.webhooks.create({
  url: "https://api.my-domain.com/webhooks/lshorter",
  events: ["link.clicked", "link.converted", "link.limit_reached"],
});

console.log("Webhook registered with secret:", webhook.secret);`
          }
        ],
        responses: [
          {
            status: 201,
            statusText: "Created",
            description: "Webhook registered. Save the secret key for HMAC verification.",
            json: `{
  "id": "wh_883019283",
  "url": "https://api.my-domain.com/webhooks/lshorter",
  "events": ["link.clicked", "link.converted", "link.limit_reached"],
  "secret": "whsec_991823abf8923481239",
  "status": "active",
  "createdAt": "2026-09-17T12:30:00.000Z"
}`
          }
        ]
      }
    ],
    codeSnippets: [
      {
        title: "1. Verifying HMAC Signatures in Next.js / Node.js",
        description: "Cryptographically verify incoming webhook payloads before processing:",
        snippet: {
          language: "typescript",
          filename: "app/api/webhooks/lshorter/route.ts",
          code: `import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

const WEBHOOK_SECRET = process.env.LSHORTER_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-lshorter-signature");

  // 1. Verify HMAC-SHA256 signature
  const expectedSig = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSig) {
    return NextResponse.json({ error: "Invalid cryptographic signature" }, { status: 401 });
  }

  // 2. Process event
  const event = JSON.parse(rawBody);

  switch (event.type) {
    case "link.clicked":
      console.log(\`Click registered on \${event.data.slug} from \${event.data.country}\`);
      break;
    case "link.converted":
      console.log(\`Conversion of \${event.data.amount} \${event.data.currency} attributed!\`);
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
      description: "JSON payload dispatched on a link.clicked or link.converted event:",
      json: `{
  "id": "evt_883019283",
  "type": "link.clicked",
  "createdAt": "2026-09-17T12:35:00.000Z",
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
      "Respond quickly with an HTTP 200 OK (within 3,000ms) and offload lengthy business tasks to background queues (BullMQ, Celery, SQS).",
      "Always verify the HMAC-SHA256 signature before parsing or acting upon webhook JSON data.",
      "Store received event.id tokens to build idempotent event handlers that safely handle network retries."
    ]
  },
  {
    slug: "conversion-tracking-amount-count",
    title: "Conversion Tracking & Financial Metrics (Amount & Count)",
    subtitle: "Complete end-to-end guide to attributing monetary revenue (amount), calculating EPC and ROI, capturing clickId across checkout funnels, and handling multi-currency purchases and refunds.",
    description: "Exhaustive technical reference and implementation guide for revenue attribution (amount), Edge atomic counters (clicksCount, uniqueClicks, maxClicks), average order value (AOV), earnings per click (EPC), and payment gateway integrations (Stripe, Shopify, WooCommerce).",
    image: "/marketing-FCI/cosmos_1739739224.jpeg",
    readTime: "6 min read",
    overview: [
      "The LShorter Financial Conversion Engine provides exact, end-to-end monetary attribution by linking e-commerce revenue (amount) directly to the originating short link click (clickId). Whether you sell via Stripe, Shopify, LemonSqueezy, WooCommerce, or a custom checkout funnel, every dollar, euro, or pound is mathematically tied to its acquisition channel.",
      "On the telemetry side, click counters (clicksCount) and conversions (conversionsCount) are incremented lock-free at Cloudflare's Edge. The platform continuously computes critical financial efficiency KPIs: Earnings Per Click (EPC = trackedRevenue / totalClicks), Average Order Value (AOV = trackedRevenue / conversionsCount), and Conversion Rate (CR = conversionsCount / totalClicks * 100).",
      "The system natively handles multi-currency normalization (USD, EUR, GBP, CAD, JPY), partial or full refund deductions (POST /api/v1/track/refund) to keep financial reports clean, and delayed asynchronous payments."
    ],
    keyPoints: [
      {
        title: "Automated Click Attribution (clickId)",
        description: "When a visitor clicks an LShorter link, our Edge Worker automatically appends an ephemeral ref=clk_... token to the destination URL. This token is stored in the browser and passed to checkout."
      },
      {
        title: "Monetary Revenue Ingestion (amount & currency)",
        description: "Pass exact transaction amounts (e.g., amount: 49.00, currency: 'USD'). The API updates trackedRevenue atomically with zero lock contention even during viral flash sales."
      },
      {
        title: "Real-Time EPC & Profitability Formulas",
        description: "Earnings Per Click (EPC = trackedRevenue / totalClicks) lets you compare earnings directly against ad Cost Per Click (CPC). When EPC > CPC, your campaign is profitable."
      },
      {
        title: "Refund & Chargeback Adjustments",
        description: "Maintain pristine financial accounting: refund endpoints automatically deduct refunded amounts from trackedRevenue and update ROI calculations."
      },
      {
        title: "Cookieless Edge Deduplication",
        description: "GDPR and PECR compliant visitor tracking that accurately counts unique buyers and conversion events without violating user privacy laws."
      }
    ],
    codeSnippets: [
      {
        title: "1. Universal Client-Side Tracking Pixel (HTML / Webflow / Shopify / WordPress)",
        description: "Add this lightweight snippet to your website's <head> or footer to automatically capture the clickId from the URL and persist it in a 30-day cookie and localStorage:",
        snippet: {
          language: "javascript",
          filename: "lshorter-pixel.js",
          code: `<!-- LShorter Universal Attribution Pixel -->
<script>
(function() {
  // 1. Extract clickId parameter (?ref=clk_... or ?clickId=clk_...)
  const params = new URLSearchParams(window.location.search);
  const clickId = params.get("ref") || params.get("clickId");

  if (clickId) {
    // 2. Persist in sessionStorage and a 30-day first-party cookie
    sessionStorage.setItem("lshorter_click_id", clickId);
    document.cookie = "lshorter_click_id=" + encodeURIComponent(clickId) + "; path=/; max-age=" + (30 * 86400) + "; SameSite=Lax";
    
    // 3. Automatically populate any hidden input fields in forms
    document.querySelectorAll('input[name="clickId"], input[name="lshorter_click_id"]').forEach(function(el) {
      el.value = clickId;
    });
  }
})();
</script>`
        }
      },
      {
        title: "2. Next.js (App Router) & React Attribution Hook",
        description: "React hook to capture the clickId from Next.js useSearchParams and persist it across client routing:",
        snippet: {
          language: "typescript",
          filename: "hooks/use-lshorter-attribution.ts",
          code: `"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function useLShorterAttribution() {
  const searchParams = useSearchParams();
  const [clickId, setClickId] = useState<string | null>(null);

  useEffect(() => {
    // Check URL search params first, fallback to session storage
    const paramClickId = searchParams.get("ref") || searchParams.get("clickId");
    
    if (paramClickId) {
      sessionStorage.setItem("lshorter_click_id", paramClickId);
      setClickId(paramClickId);
    } else {
      const stored = sessionStorage.getItem("lshorter_click_id");
      if (stored) setClickId(stored);
    }
  }, [searchParams]);

  return { clickId };
}`
        }
      },
      {
        title: "3. Stripe Checkout Session & Webhook Ingestion",
        description: "Pass clickId and customer details into Stripe Checkout Session metadata, then attribute revenue upon payment in your webhook handler:",
        snippet: {
          language: "typescript",
          filename: "app/api/webhooks/stripe/route.ts",
          code: `import { NextRequest, NextResponse } from "next/server";
import { lshorter } from "@/lib/lshorter";
import Stripe from "stripe";
import crypto from "node:crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper: Gravatar from email
function getGravatarUrl(email?: string): string | undefined {
  if (!email) return undefined;
  const hash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  return \`https://www.gravatar.com/avatar/\${hash}?s=200&d=identicon\`;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err: any) {
    return NextResponse.json({ error: \`Webhook Error: \${err.message}\` }, { status: 400 });
  }

  // Handle successful checkout payment
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // 1. Extract clickId passed in session metadata or client_reference_id
    const clickId = session.metadata?.clickId || session.client_reference_id || undefined;
    const amountPaid = (session.amount_total || 0) / 100; // Convert cents to decimal dollars/euros
    const customerEmail = session.customer_details?.email || undefined;
    const customerName = session.customer_details?.name || undefined;
    const customerAvatar = session.metadata?.avatarUrl || getGravatarUrl(customerEmail);

    // 2. Report monetary conversion to LShorter API with customer avatar
    await lshorter.track.conversion({
      eventName: "purchase",
      amount: amountPaid, // e.g. 49.00
      currency: (session.currency || "USD").toUpperCase(),
      clickId: clickId,
      orderId: session.id,
      customer: {
        email: customerEmail,
        name: customerName,
        avatarUrl: customerAvatar, // Customer profile picture displayed in dashboard
      },
      customerAvatar: customerAvatar, // Top-level alias also supported
      metadata: {
        paymentIntent: session.payment_intent as string,
        customerCountry: session.customer_details?.address?.country,
      }
    });

    console.log(\`Successfully attributed \${amountPaid} \${session.currency} to clickId \${clickId}\`);
  }

  return NextResponse.json({ received: true });
}`
        }
      },
      {
        title: "4. Shopify / E-Commerce Webhook Ingestion with Customer Avatar",
        description: "Attributing orders created in Shopify store back to LShorter short links with customer avatar:",
        snippet: {
          language: "typescript",
          filename: "app/api/webhooks/shopify/route.ts",
          code: `import { NextRequest, NextResponse } from "next/server";
import { lshorter } from "@/lib/lshorter";

export async function POST(req: NextRequest) {
  const order = await req.json();

  // Find clickId in Shopify cart note attributes
  const clickIdAttr = order.note_attributes?.find(
    (attr: { name: string; value: string }) => attr.name === "clickId" || attr.name === "lshorter_click_id"
  );
  const clickId = clickIdAttr ? clickIdAttr.value : undefined;
  const totalAmount = parseFloat(order.total_price); // e.g. 89.50
  const customerEmail = order.email;
  const customerAvatar = order.customer?.avatar_url || \`https://www.gravatar.com/avatar/\${customerEmail}?d=identicon\`;

  await lshorter.track.conversion({
    eventName: "shopify_order",
    amount: totalAmount,
    currency: order.currency || "USD",
    clickId: clickId,
    orderId: String(order.id),
    customer: {
      email: customerEmail,
      name: order.customer ? \`\${order.customer.first_name} \${order.customer.last_name}\` : undefined,
      avatarUrl: customerAvatar,
    },
    customerAvatar: customerAvatar,
  });

  return NextResponse.json({ status: "success" });
}`
        }
      },
      {
        title: "5. Customer Avatar & Identity Resolution (customerAvatar & avatarUrl)",
        description: "Extract customer profile images from Google/GitHub OAuth, NextAuth, Clerk, or Gravatar and supply them to LShorter:",
        snippet: {
          language: "typescript",
          filename: "resolve-customer-avatar.ts",
          code: `import { lshorter } from "@/lib/lshorter";
import crypto from "node:crypto";

// 1. Helper function: Compute Gravatar URL from email
function getGravatar(email: string): string {
  const hash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  return \`https://www.gravatar.com/avatar/\${hash}?s=200&d=identicon\`;
}

// 2. Resolve avatar from OAuth session (NextAuth, Clerk, Supabase) or Gravatar
const userEmail = "alex.johnson@example.com";
const userAvatarUrl = session?.user?.image // NextAuth Google/GitHub profile picture
  || user?.imageUrl // Clerk Auth
  || getGravatar(userEmail); // Gravatar fallback

// 3. Track conversion with customer avatar
await lshorter.track.conversion({
  eventName: "purchase",
  amount: 49.00,
  currency: "USD",
  clickId: "clk_9921ab01",
  orderId: "ord_992812",
  customer: {
    name: "Alex Johnson",
    email: userEmail,
    avatarUrl: userAvatarUrl, // Photo displayed in real-time revenue telemetry
  },
  customerAvatar: userAvatarUrl, // Top-level alias
});

console.log("Conversion tracked with customer avatar:", userAvatarUrl);`
        }
      },
      {
        title: "6. Processing Partial & Full Refunds (track.refund)",
        description: "Deduct refunded amounts from cumulative link revenue to maintain accurate financial telemetry:",
        snippet: {
          language: "typescript",
          filename: "handle-refund.ts",
          code: `import { lshorter } from "@/lib/lshorter";

// Deduct a $49.00 customer refund
const refundResult = await lshorter.track.refund({
  orderId: "ch_9921823ab", // Same orderId passed during conversion
  amount: 49.00,
  currency: "USD",
  reason: "customer_requested_return",
  refundId: "re_3Nq..."
});

console.log("Updated tracked revenue:", refundResult.newTrackedRevenue, "USD");
console.log("Deducted amount:", refundResult.amountRefunded, "USD");`
        }
      },
      {
        title: "7. Querying Real-Time Financial Telemetry & EPC via SDK",
        description: "Read atomic click counters, cumulative revenue, AOV, and calculate campaign ROI:",
        snippet: {
          language: "typescript",
          filename: "get-roi-metrics.ts",
          code: `import { lshorter } from "@/lib/lshorter";

// Query financial telemetry for a marketing campaign
const roi = await lshorter.analytics.getRevenue("summer-sale-2026", {
  period: "30d",
  currency: "USD",
});

console.log("Total Clicks:", roi.totalClicks);
console.log("Unique Visitors:", roi.uniqueClicks);
console.log("Conversions Count:", roi.conversionsCount);
console.log("Conversion Rate:", roi.conversionRate.toFixed(2) + "%");
console.log("Tracked Revenue (Amount):", roi.trackedRevenue.toFixed(2), "USD");
console.log("Average Order Value (AOV):", roi.averageOrderValue.toFixed(2), "USD");
console.log("Earnings Per Click (EPC):", roi.epc.toFixed(2), "USD / click");

// Calculate Net Profit assuming $0.50 CPC advertising spend
const adSpend = roi.totalClicks * 0.50; // $1,250 ad spend
const netProfit = roi.trackedRevenue - adSpend; // $3,332 - $1,250 = $2,082
const roas = (roi.trackedRevenue / adSpend) * 100; // 266.5% Return on Ad Spend

console.log("Ad Spend:", adSpend.toFixed(2), "USD");
console.log("Net Profit:", netProfit.toFixed(2), "USD");
console.log("ROAS:", roas.toFixed(1) + "%");`
        }
      }
    ],
    apiEndpoints: [
      {
        name: "Record Conversion & Monetary Amount",
        method: "POST",
        path: "/api/v1/track/conversion",
        description: "Records a completed purchase, subscription, or conversion event with revenue amount, currency, and customer details attributed to a specific clickId.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "1,000 req / min",
        headers: [
          { name: "Authorization", type: "string", required: true, description: "Bearer token containing your API key.", example: "Bearer lsho_live_89f023ab912" },
          { name: "Content-Type", type: "string", required: true, description: "Must be set to application/json.", example: "application/json" }
        ],
        bodyParams: [
          { name: "eventName", type: "string", required: true, description: "Name of the conversion event (e.g. purchase, subscription, upsell).", example: "purchase" },
          { name: "amount", type: "number", required: true, description: "Decimal transaction revenue amount collected.", example: "49.00" },
          { name: "currency", type: "string (ISO 4217)", required: true, description: "Three-letter uppercase currency code (USD, EUR, GBP, CAD, JPY).", example: "USD" },
          { name: "clickId", type: "string", required: false, description: "Originating clickId token passed by the short link redirection.", example: "clk_9921ab01" },
          { name: "linkId", type: "string", required: false, description: "Short link ID or slug alias if clickId is not available.", example: "link_89f023ab912" },
          { name: "orderId", type: "string", required: false, description: "Your internal transaction or invoice ID for deduplication.", example: "ch_9921823ab" },
          { name: "customer", type: "object", required: false, description: "Customer metadata.", example: '{"email": "alex@example.com", "name": "Alex Johnson", "avatarUrl": "https://example.com/photos/alex.jpg"}' },
          { name: "customer.email", type: "string (email)", required: false, description: "Customer email address for LTV attribution.", example: "alex@example.com" },
          { name: "customer.name", type: "string", required: false, description: "Customer full name.", example: "Alex Johnson" },
          { name: "customer.avatarUrl", type: "string (url)", required: false, description: "Avatar image URL displayed in telemetry dashboards.", example: "https://example.com/photos/alex.jpg" },
          { name: "customerAvatar", type: "string (url)", required: false, description: "Top-level alias for customer avatar image URL (Gravatar, Google, Discord, GitHub).", example: "https://example.com/photos/alex.jpg" },
          { name: "metadata", type: "object", required: false, description: "Arbitrary JSON key-value metadata for downstream reporting.", example: '{"plan": "pro_annual", "coupon": "SUMMER30"}' }
        ],
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X POST "https://lsho.cc/api/v1/track/conversion" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "eventName": "purchase",
    "amount": 49.00,
    "currency": "USD",
    "clickId": "clk_9921ab01",
    "orderId": "ch_9921823ab",
    "customer": {
      "email": "customer@example.com",
      "name": "Alex Johnson",
      "avatarUrl": "https://example.com/photos/alex.jpg"
    },
    "metadata": {
      "plan": "pro_annual",
      "coupon": "SUMMER30"
    }
  }'`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `import { lshorter } from "@/lib/lshorter";

await lshorter.track.conversion({
  eventName: "purchase",
  amount: 49.00,
  currency: "USD",
  clickId: "clk_9921ab01",
  orderId: "ch_9921823ab",
  customer: {
    email: "customer@example.com",
    name: "Alex Johnson",
    avatarUrl: "https://example.com/photos/alex.jpg",
  },
});`
          },
          {
            name: "Node.js (Fetch)",
            language: "javascript",
            code: `const response = await fetch("https://lsho.cc/api/v1/track/conversion", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${process.env.LSHORTER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    eventName: "purchase",
    amount: 49.00,
    currency: "USD",
    clickId: "clk_9921ab01",
    orderId: "ch_9921823ab",
  }),
});

const data = await response.json();
console.log(data);`
          },
          {
            name: "Python",
            language: "python",
            code: `import requests, os

resp = requests.post(
    "https://lsho.cc/api/v1/track/conversion",
    headers={"Authorization": f"Bearer {os.getenv('LSHORTER_API_KEY')}"},
    json={
        "eventName": "purchase",
        "amount": 49.00,
        "currency": "USD",
        "clickId": "clk_9921ab01",
        "orderId": "ch_9921823ab"
    }
)
print(resp.json())`
          },
          {
            name: "PHP",
            language: "php",
            code: `<?php
$ch = curl_init("https://lsho.cc/api/v1/track/conversion");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . getenv("LSHORTER_API_KEY"),
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "eventName" => "purchase",
    "amount" => 49.00,
    "currency" => "USD",
    "clickId" => "clk_9921ab01",
    "orderId" => "ch_9921823ab"
]));

$response = curl_exec($ch);
curl_close($ch);
echo $response;`
          }
        ],
        responses: [
          {
            status: 201,
            statusText: "Created",
            description: "Conversion successfully recorded and financial metrics updated in real time.",
            json: `{
  "conversionId": "conv_77192",
  "clickId": "clk_9921ab01",
  "linkId": "link_89f023ab912",
  "slug": "summer-sale-2026",
  "amount": 49.00,
  "currency": "USD",
  "status": "attributed",
  "cumulativeTrackedRevenue": 3332.00,
  "updatedEpc": 1.33,
  "createdAt": "2026-09-17T12:40:00.000Z"
}`
          }
        ],
        errorCodes: [
          { status: 400, code: "INVALID_AMOUNT", description: "The amount parameter must be a positive decimal number." },
          { status: 400, code: "INVALID_CURRENCY", description: "Currency must be a valid 3-letter ISO 4217 uppercase code (e.g. USD, EUR, GBP)." },
          { status: 401, code: "UNAUTHORIZED", description: "Missing or invalid Bearer API key." },
          { status: 404, code: "CLICK_OR_LINK_NOT_FOUND", description: "Neither clickId nor linkId matched an active record." },
          { status: 409, code: "DUPLICATE_ORDER_ID", description: "A conversion with this orderId has already been recorded (idempotency protection)." }
        ]
      },
      {
        name: "Process Refund or Chargeback",
        method: "POST",
        path: "/api/v1/track/refund",
        description: "Deducts a full or partial refund amount from the link's cumulative revenue, adjusting EPC and AOV atomically.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "1,000 req / min",
        bodyParams: [
          { name: "orderId", type: "string", required: true, description: "The original orderId passed during conversion recording.", example: "ch_9921823ab" },
          { name: "amount", type: "number", required: true, description: "Refunded monetary amount.", example: "49.00" },
          { name: "currency", type: "string (ISO 4217)", required: false, description: "Currency code (defaults to original order currency).", example: "USD" },
          { name: "reason", type: "string", required: false, description: "Reason for refund (e.g. customer_return, fraud, cancelled).", example: "customer_requested_return" },
          { name: "refundId", type: "string", required: false, description: "Your payment gateway refund identifier.", example: "re_3Nq2182" }
        ],
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X POST "https://lsho.cc/api/v1/track/refund" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "orderId": "ch_9921823ab",
    "amount": 49.00,
    "reason": "customer_requested_return"
  }'`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `await lshorter.track.refund({
  orderId: "ch_9921823ab",
  amount: 49.00,
  reason: "customer_requested_return",
});`
          }
        ],
        responses: [
          {
            status: 200,
            statusText: "OK",
            description: "Refund applied and revenue metrics adjusted.",
            json: `{
  "refundId": "ref_992812",
  "orderId": "ch_9921823ab",
  "amountRefunded": 49.00,
  "currency": "USD",
  "newTrackedRevenue": 3283.00,
  "updatedEpc": 1.31,
  "status": "refunded",
  "updatedAt": "2026-09-17T13:00:00.000Z"
}`
          }
        ]
      },
      {
        name: "Get Financial & Revenue Telemetry",
        method: "GET",
        path: "/api/v1/analytics/:slug/revenue",
        description: "Retrieves monetary revenue totals, conversion counts, Average Order Value (AOV), and Earnings Per Click (EPC) for a short link.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "1,000 req / min",
        pathParams: [
          { name: "slug", type: "string", required: true, description: "Short link slug alias.", example: "summer-sale-2026" }
        ],
        queryParams: [
          { name: "period", type: "string (24h | 7d | 30d | 90d | all)", required: false, description: "Timeframe window for financial metrics.", example: "30d", default: "30d" },
          { name: "currency", type: "string", required: false, description: "Target currency for display conversion.", example: "USD", default: "USD" }
        ],
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X GET "https://lsho.cc/api/v1/analytics/summer-sale-2026/revenue?period=30d" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY"`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `const roi = await lshorter.analytics.getRevenue("summer-sale-2026", {
  period: "30d",
  currency: "USD",
});

console.log("Total Revenue (Amount):", roi.trackedRevenue, "USD");
console.log("Earnings Per Click (EPC):", roi.epc, "USD / click");`
          }
        ],
        responses: [
          {
            status: 200,
            statusText: "OK",
            description: "Comprehensive financial telemetry payload.",
            json: `{
  "slug": "summer-sale-2026",
  "period": "30d",
  "currency": "USD",
  "counts": {
    "totalClicks": 2500,
    "uniqueClicks": 2100,
    "conversionsCount": 68,
    "conversionRate": 2.72
  },
  "financials": {
    "trackedRevenue": 3332.00,
    "currency": "USD",
    "averageOrderValue": 49.00,
    "earningsPerClick": 1.33
  },
  "recentTransactions": [
    {
      "conversionId": "conv_77192",
      "orderId": "ch_9921823ab",
      "amount": 49.00,
      "currency": "USD",
      "customer": {
        "email": "customer@example.com",
        "name": "Alex Johnson",
        "avatarUrl": "https://example.com/photos/alex.jpg"
      },
      "timestamp": "2026-09-17T12:40:00.000Z"
    }
  ]
}`
          }
        ]
      }
    ],
    responseSample: {
      title: "Full Conversion & Financial Payload Example",
      description: "Structured JSON response returning atomic visit counts, financial revenue sums, EPC, and customer transactions:",
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
      "orderId": "ch_9921823ab",
      "amount": 49.00,
      "currency": "USD",
      "customer": {
        "name": "Alex Johnson",
        "email": "customer@example.com",
        "avatarUrl": "https://example.com/photos/alex.jpg"
      },
      "timestamp": "2026-09-17T12:40:00.000Z"
    }
  ]
}`
    },
    bestPractices: [
      "Always store clickId in payment metadata (e.g. Stripe Session Metadata, Shopify Cart Note) so async webhooks and retries never lose attribution.",
      "Pass numeric decimal amounts (e.g. 49.00 rather than 4900 cents) and standard 3-letter ISO uppercase currencies (USD, EUR, GBP).",
      "Subscribe to Stripe charge.refunded or Shopify refunds/create webhooks to call POST /api/v1/track/refund and maintain pristine financial accounting.",
      "Compare your EPC (Earnings Per Click) directly against your CPC (Cost Per Click) to automatically calculate Return on Ad Spend (ROAS)."
    ]
  },
  {
    slug: "ab-testing-routing",
    title: "Percentage Routing & A/B Testing API",
    subtitle: "Intelligently split click traffic across landing page variants to maximize conversion rates.",
    description: "REST API reference for configuring Edge-based A/B tests: percentage split weighting, variation telemetry, and instant switching.",
    image: "/marketing-FCI/cosmos_1746304416.jpeg",
    readTime: "4 min read",
    overview: [
      "Percentage routing (A/B Testing) directs a defined proportion of traffic to different page variations (e.g., 50% to Variant A, 50% to Variant B, or 70% / 15% / 15%).",
      "Routing decisions execute directly on Cloudflare Edge servers during the network handshake, with zero client scripts or visible layout flicker."
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
    apiEndpoints: [
      {
        name: "Configure A/B Test Routing",
        method: "PATCH",
        path: "/api/v1/links/:id/ab",
        description: "Configures or updates percentage traffic split weights across multiple landing page variants.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "1,000 req / min",
        pathParams: [
          { name: "id", type: "string", required: true, description: "Short link slug or ID.", example: "promo-split" }
        ],
        bodyParams: [
          { name: "mainWeight", type: "number", required: true, description: "Percentage of traffic sent to the primary target URL (0 to 100).", example: "50" },
          { name: "abVariations", type: "object[]", required: true, description: "Array of variant configurations.", example: '[{"id": "var_b", "targetUrl": "https://store.com/landing-b", "weight": 50, "name": "Variant B (Green Button)"}]' },
          { name: "abVariations[].id", type: "string", required: true, description: "Unique variant key.", example: "var_b" },
          { name: "abVariations[].targetUrl", type: "string (url)", required: true, description: "Destination URL for this variant.", example: "https://store.com/landing-b" },
          { name: "abVariations[].weight", type: "number", required: true, description: "Percentage weight allocated to this variant.", example: "50" },
          { name: "abVariations[].name", type: "string", required: false, description: "Human-readable label for dashboard comparison.", example: "Variant B (Green Button)" }
        ],
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X PATCH "https://lsho.cc/api/v1/links/promo-split/ab" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mainWeight": 50,
    "abVariations": [
      {
        "id": "var_b",
        "targetUrl": "https://store.com/landing-b",
        "weight": 50,
        "name": "Variant B (Green Button)"
      }
    ]
  }'`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `import { lshorter } from "@/lib/lshorter";

await lshorter.links.update("promo-split", {
  mainWeight: 50,
  abVariations: [
    {
      id: "var_b",
      targetUrl: "https://store.com/landing-b",
      weight: 50,
      name: "Variant B (Green Button)",
    },
  ],
});`
          }
        ],
        responses: [
          {
            status: 200,
            statusText: "OK",
            description: "A/B testing weights updated.",
            json: `{
  "id": "link_ab_991823",
  "slug": "promo-split",
  "shortUrl": "https://lsho.cc/promo-split",
  "mainWeight": 50,
  "abVariations": [
    {
      "id": "var_b",
      "targetUrl": "https://store.com/landing-b",
      "weight": 50,
      "name": "Variant B (Green Button)",
      "clicksCount": 0
    }
  ],
  "status": "active"
}`
          }
        ]
      }
    ],
    codeSnippets: [
      {
        title: "1. Creating an A/B Test via SDK",
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
      "Ensure total weight sums to exactly 100% (mainWeight + sum of variation weights = 100).",
      "Run tests until reaching statistically significant sample sizes (at least 500 to 1,000 clicks per variant).",
      "Test only one major variable per experiment (e.g. headline vs hero image) to clearly identify causality."
    ]
  },
  {
    slug: "social-sharing-opengraph",
    title: "Social Sharing & Dynamic Open Graph API",
    subtitle: "Customize how your links appear when shared on WhatsApp, Twitter/X, LinkedIn, Telegram, and Facebook.",
    description: "REST API guide for configuring custom Open Graph tags (og:title, og:description, og:image) and Twitter Cards served dynamically at the Edge.",
    image: "/marketing-FCI/cosmos_549824580.jpeg",
    readTime: "3 min read",
    overview: [
      "When a shortened link is shared across messaging apps or social networks (WhatsApp, LinkedIn, Twitter/X, Discord, Slack), web crawlers scrape Open Graph tags to render a rich link preview card.",
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
    apiEndpoints: [
      {
        name: "Update Open Graph Social Metadata",
        method: "PATCH",
        path: "/api/v1/links/:id/opengraph",
        description: "Updates the Open Graph title, description, and preview banner image for social crawlers.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "1,000 req / min",
        pathParams: [
          { name: "id", type: "string", required: true, description: "Short link slug or ID.", example: "discover-2026" }
        ],
        bodyParams: [
          { name: "metaTitle", type: "string", required: false, description: "Social card title (max 70 chars).", example: "Discover Our 2026 Collection — Limited Edition" },
          { name: "ogDescription", type: "string", required: false, description: "Social card description (max 200 chars).", example: "Get 20% off your first order today with promo code WELCOME." },
          { name: "ogImage", type: "string (url)", required: false, description: "Direct image URL with 1.91:1 aspect ratio (recommended 1200x630px).", example: "https://my-product.com/images/og-banner.jpg" },
          { name: "twitterCard", type: "string (summary | summary_large_image)", required: false, description: "Twitter card layout format.", example: "summary_large_image", default: "summary_large_image" }
        ],
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X PATCH "https://lsho.cc/api/v1/links/discover-2026/opengraph" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "metaTitle": "Discover Our 2026 Collection — Limited Edition",
    "ogDescription": "Get 20% off your first order today with promo code WELCOME.",
    "ogImage": "https://my-product.com/images/og-banner.jpg",
    "twitterCard": "summary_large_image"
  }'`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `import { lshorter } from "@/lib/lshorter";

await lshorter.links.updateOpenGraph("discover-2026", {
  metaTitle: "Discover Our 2026 Collection — Limited Edition",
  ogDescription: "Get 20% off your first order today with promo code WELCOME.",
  ogImage: "https://my-product.com/images/og-banner.jpg",
  twitterCard: "summary_large_image",
});`
          }
        ],
        responses: [
          {
            status: 200,
            statusText: "OK",
            description: "Open Graph metadata updated and edge cached.",
            json: `{
  "id": "link_og_481902",
  "slug": "discover-2026",
  "metaTitle": "Discover Our 2026 Collection — Limited Edition",
  "ogDescription": "Get 20% off your first order today with promo code WELCOME.",
  "ogImage": "https://my-product.com/images/og-banner.jpg",
  "twitterCard": "summary_large_image",
  "status": "active"
}`
          }
        ]
      }
    ],
    codeSnippets: [
      {
        title: "1. Creating a Link with Open Graph Metadata",
        description: "Specify metaTitle, ogDescription, and ogImage properties during link creation:",
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
