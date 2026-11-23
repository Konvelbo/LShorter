import type { Locale } from "@/lib/i18n/types";

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
    subtitle: "Integrate intelligent edge link shortening, real-time analytics, and conversion tracking with our REST API and official TypeScript, Python, Rust, Go, and PHP SDKs.",
    description: "Complete REST API reference, base URLs, authentication headers, rate limits, multi-language SDK quickstart (JS/TS, Python, Rust, Go, PHP), and endpoint catalog for developers.",
    image: "/screenshots/dashboard/dashboardwithsidbare_dark1.webp",
    readTime: "5 min read",
    overview: [
      "The LShorter REST API provides programmatic access to all link management, edge routing, privacy masking, conversion attribution, and telemetry features of the LShorter platform.",
      "All requests are routed to Cloudflare's global edge network (over 300+ data centers worldwide) to guarantee sub-15ms response times, 99.99% availability, and automatic TLS 1.3 encryption.",
      "Developers can interact directly via standard HTTP requests or use our official typed SDKs for TypeScript/JavaScript (lshorter-api), Python (lshorter-api), Rust (lshorter-api), Go (github.com/Konvelbo/LShorter-api/sdks/go), and PHP (lshorter/lshorter-api)."
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
        title: "Tiered Rate Limits",
        description: "Adaptive rate limits from 60 to 1,400 requests per minute based on your plan (Starter: 60, Pro: 200, Business: 600, Enterprise: 1,400), with real-time rate limit headers included in every HTTP response."
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
        description: "Creates a new shortened URL with optional custom slug, tags, expiration timestamp, maximum click limits, PIN protection, branded URL masking, and geographic routing rules.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "60 to 1,400 req/min (by plan)",
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
    "targetUrl": "https://my-store.com/summer-sale",
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
  targetUrl: "https://my-store.com/summer-sale",
  slug: "summer-2026",
  tags: ["marketing", "summer-promo"],
  maxClicks: 500,
  expiresAt: "2026-10-31T23:59:59Z",
});

console.log("Short link:", link.shortUrl);`
          },
          {
            name: "Python SDK",
            language: "python",
            code: `import os
from lshorter import LShorter

lsh = LShorter(api_key=os.environ["LSHORTER_API_KEY"])

link = lsh.links.create({
    "targetUrl": "https://my-store.com/summer-sale",
    "slug": "summer-2026",
    "tags": ["marketing", "summer-promo"],
    "maxClicks": 500,
    "expiresAt": "2026-10-31T23:59:59Z",
})

print("Short link:", link["shortUrl"])`
          },
          {
            name: "Rust SDK",
            language: "rust",
            code: `use lshorter::{CreateLinkOptions, LShorter};

#[tokio::main]
async fn main() -> lshorter::Result<()> {
    let client = LShorter::new(std::env::var("LSHORTER_API_KEY").unwrap());

    let link = client.links().create(&CreateLinkOptions {
        target_url: "https://my-store.com/summer-sale".into(),
        slug: Some("summer-2026".into()),
        tags: Some(vec!["marketing".into(), "summer-promo".into()]),
        max_clicks: Some(500),
        expires_at: Some("2026-10-31T23:59:59Z".into()),
        ..Default::default()
    }).await?;

    println!("Short link: {}", link.short_url);
    Ok(())
}`
          },
          {
            name: "Go SDK",
            language: "go",
            code: `package main

import (
	"context"
	"fmt"
	"log"
	"os"

	lshorter "github.com/Konvelbo/LShorter-api/sdks/go"
)

func main() {
	client := lshorter.New(os.Getenv("LSHORTER_API_KEY"))
	maxClicks := 500

	link, err := client.Links.Create(context.Background(), lshorter.CreateLinkOptions{
		TargetURL: "https://my-store.com/summer-sale",
		Slug:      "summer-2026",
		Tags:      []string{"marketing", "summer-promo"},
		MaxClicks: &maxClicks,
		ExpiresAt: "2026-10-31T23:59:59Z",
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Short link:", link.ShortURL)
}`
          },
          {
            name: "PHP SDK",
            language: "php",
            code: `<?php
require __DIR__ . "/vendor/autoload.php";

use LShorter\\LShorter;

$lsh = new LShorter(getenv("LSHORTER_API_KEY"));

$link = $lsh->links->create([
    "targetUrl" => "https://my-store.com/summer-sale",
    "slug" => "summer-2026",
    "tags" => ["marketing", "summer-promo"],
    "maxClicks" => 500,
    "expiresAt" => "2026-10-31T23:59:59Z",
]);

echo "Short link: " . $link["shortUrl"] . PHP_EOL;`
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
          { status: 429, code: "RATE_LIMIT_EXCEEDED", description: "You have exceeded your account's rate limit for your current plan." }
        ]
      },
      {
        name: "List Short Links",
        method: "GET",
        path: "/api/v1/links",
        description: "Retrieves a paginated list of all short links created under your organization, with optional search query, tag filters, and sort orders.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "60 to 1,400 req/min (by plan)",
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
            code: `curl -X GET "https://lsho.cc/api/v1/links?page=1&limit=20" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY"`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `const links = await lshorter.links.list({
  page: 1,
  limit: 20,
});

console.log(\`Found \${links.pagination.total} links:\`, links.data);`
          },
          {
            name: "Python SDK",
            language: "python",
            code: `links = lsh.links.list(page=1, limit=20)
print(f"Found {links['pagination']['total']} links:", links["data"])`
          },
          {
            name: "Rust SDK",
            language: "rust",
            code: `let links = client.links().list(Some(1), Some(20)).await?;
println!("Found {} links", links.pagination.total);`
          },
          {
            name: "Go SDK",
            language: "go",
            code: `links, err := client.Links.List(ctx, 1, 20)
if err != nil {
	log.Fatal(err)
}
fmt.Printf("Found %d links\\n", links.Pagination.Total)`
          },
          {
            name: "PHP SDK",
            language: "php",
            code: `$links = $lsh->links->list(page: 1, limit: 20);
echo "Found " . $links["pagination"]["total"] . " links" . PHP_EOL;`
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
      }
    ],
    codeSnippets: [
      {
        title: "1. Official SDK Installation (JS/TS, Python, Rust, Go & PHP)",
        description: "Install the official LShorter SDK for your stack using your favorite package manager:",
        snippet: {
          language: "bash",
          filename: "Terminal",
          code: "npm install lshorter-api",
          tabs: [
            { name: "npm", code: "npm install lshorter-api", language: "bash" },
            { name: "pnpm", code: "pnpm add lshorter-api", language: "bash" },
            { name: "yarn", code: "yarn add lshorter-api", language: "bash" },
            { name: "bun", code: "bun add lshorter-api", language: "bash" },
            { name: "Python (pip)", code: "pip install lshorter-api", language: "bash" },
            { name: "Rust (cargo)", code: "cargo add lshorter-api", language: "bash" },
            { name: "Go", code: "go get github.com/Konvelbo/LShorter-api/sdks/go", language: "bash" },
            { name: "PHP (composer)", code: "composer require lshorter/lshorter-api", language: "bash" }
          ]
        }
      },
      {
        title: "2. Client Initialization",
        description: "Configure your LShorter client with your secret API key across any supported language:",
        snippet: {
          language: "typescript",
          filename: "lib/lshorter.ts",
          code: `import { LShorter } from "lshorter-api";

export const lshorter = new LShorter({
  apiKey: process.env.LSHORTER_API_KEY!,
});`,
          tabs: [
            {
              name: "TypeScript",
              language: "typescript",
              code: `import { LShorter } from "lshorter-api";

export const lshorter = new LShorter({
  apiKey: process.env.LSHORTER_API_KEY!,
  // Optional: custom baseUrl (defaults to https://lsho.cc)
  baseUrl: "https://lsho.cc",
});`
            },
            {
              name: "Python",
              language: "python",
              code: `import os
from lshorter import LShorter

lsh = LShorter(
    api_key=os.environ["LSHORTER_API_KEY"],
    # Optional custom base URL & timeout
    base_url="https://lsho.cc",
    timeout=15.0,
)`
            },
            {
              name: "Rust",
              language: "rust",
              code: `use lshorter::LShorter;

let api_key = std::env::var("LSHORTER_API_KEY")
    .expect("LSHORTER_API_KEY must be set");
let client = LShorter::new(api_key);`
            },
            {
              name: "Go",
              language: "go",
              code: `import (
	"os"
	lshorter "github.com/Konvelbo/LShorter-api/sdks/go"
)

client := lshorter.New(os.Getenv("LSHORTER_API_KEY"))`
            },
            {
              name: "PHP",
              language: "php",
              code: `<?php
require __DIR__ . "/vendor/autoload.php";

use LShorter\\LShorter;

$lsh = new LShorter(getenv("LSHORTER_API_KEY"));`
            }
          ]
        }
      },
      {
        title: "3. Creating Your First Short Link",
        description: "Create a trackable short link with custom slug, geo-targeting, and retargeting pixels:",
        snippet: {
          language: "typescript",
          filename: "create-link.ts",
          code: `import { lshorter } from "@/lib/lshorter";

const link = await lshorter.links.create({
  targetUrl: "https://my-store.com/summer-promo",
  slug: "summer-2026",
  tags: ["marketing", "summer-sale"],
  pixels: ["px_meta_main"],
});

console.log("Short URL generated:", link.shortUrl);`,
          tabs: [
            {
              name: "TypeScript",
              language: "typescript",
              code: `const link = await lshorter.links.create({
  targetUrl: "https://my-store.com/summer-promo",
  slug: "summer-2026",
  tags: ["marketing", "summer-sale"],
  pixels: ["px_meta_main"],
});

console.log("Short URL generated:", link.shortUrl);`
            },
            {
              name: "Python",
              language: "python",
              code: `link = lsh.links.create({
    "targetUrl": "https://my-store.com/summer-promo",
    "slug": "summer-2026",
    "tags": ["marketing", "summer-sale"],
    "pixels": ["px_meta_main"],
})

print("Short URL generated:", link["shortUrl"])`
            },
            {
              name: "Rust",
              language: "rust",
              code: `use lshorter::CreateLinkOptions;

let link = client.links().create(&CreateLinkOptions {
    target_url: "https://my-store.com/summer-promo".into(),
    slug: Some("summer-2026".into()),
    tags: Some(vec!["marketing".into(), "summer-sale".into()]),
    pixels: Some(vec!["px_meta_main".into()]),
    ..Default::default()
}).await?;

println!("Short URL generated: {}", link.short_url);`
            },
            {
              name: "Go",
              language: "go",
              code: `link, err := client.Links.Create(ctx, lshorter.CreateLinkOptions{
	TargetURL: "https://my-store.com/summer-promo",
	Slug:      "summer-2026",
	Tags:      []string{"marketing", "summer-sale"},
	Pixels:    []string{"px_meta_main"},
})
if err != nil {
	log.Fatal(err)
}
fmt.Println("Short URL generated:", link.ShortURL)`
            },
            {
              name: "PHP",
              language: "php",
              code: `$link = $lsh->links->create([
    "targetUrl" => "https://my-store.com/summer-promo",
    "slug" => "summer-2026",
    "tags" => ["marketing", "summer-sale"],
    "pixels" => ["px_meta_main"],
]);

echo "Short URL generated: " . $link["shortUrl"] . PHP_EOL;`
            }
          ]
        }
      },
      {
        title: "4. Recording Conversion with Customer Avatar (avatarUrl & customerAvatar)",
        description: "Record a sale with customer profile photo / avatar displayed in live dashboards:",
        snippet: {
          language: "typescript",
          filename: "track-purchase.ts",
          code: `await lshorter.track.conversion({
  eventName: "purchase",
  amount: 49.00,
  currency: "EUR",
  linkId: "link_01",
  clickId: "clk_9921ab01",
  customer: {
    id: "usr_123",
    email: "alex@example.com",
    name: "Alex Johnson",
    avatarUrl: "https://example.com/avatars/alex.jpg",
  },
});`,
          tabs: [
            {
              name: "TypeScript",
              language: "typescript",
              code: `await lshorter.track.conversion({
  eventName: "purchase",
  amount: 49.00,
  currency: "EUR",
  linkId: "link_01",
  clickId: "clk_9921ab01",
  customer: {
    id: "usr_123",
    email: "alex@example.com",
    name: "Alex Johnson",
    avatarUrl: "https://example.com/avatars/alex.jpg",
  },
});`
            },
            {
              name: "Python",
              language: "python",
              code: `lsh.track.conversion(
    event_name="purchase",
    amount=49.00,
    currency="EUR",
    link_id="link_01",
    click_id="clk_9921ab01",
    customer={
        "id": "usr_123",
        "email": "alex@example.com",
        "name": "Alex Johnson",
        "avatarUrl": "https://example.com/avatars/alex.jpg",
    },
)`
            },
            {
              name: "Rust",
              language: "rust",
              code: `use lshorter::{CustomerInput, TrackConversionOptions};

client.track().conversion(&TrackConversionOptions {
    event_name: "purchase".into(),
    link_id: "link_01".into(),
    amount: 49.00,
    currency: Some("EUR".into()),
    click_id: Some("clk_9921ab01".into()),
    customer: Some(CustomerInput {
        id: Some("usr_123".into()),
        email: Some("alex@example.com".into()),
        name: Some("Alex Johnson".into()),
        avatar_url: Some("https://example.com/avatars/alex.jpg".into()),
    }),
}).await?;`
            },
            {
              name: "Go",
              language: "go",
              code: `_, err := client.Track.Conversion(ctx, lshorter.TrackConversionOptions{
	EventName: "purchase",
	Amount:    49.00,
	Currency:  "EUR",
	LinkID:    "link_01",
	ClickID:   "clk_9921ab01",
	Customer: &lshorter.CustomerInput{
		ID:        "usr_123",
		Email:     "alex@example.com",
		Name:      "Alex Johnson",
		AvatarURL: "https://example.com/avatars/alex.jpg",
	},
})`
            },
            {
              name: "PHP",
              language: "php",
              code: `$lsh->track->conversion([
    "eventName" => "purchase",
    "amount" => 49.00,
    "currency" => "EUR",
    "linkId" => "link_01",
    "clickId" => "clk_9921ab01",
    "customer" => [
        "id" => "usr_123",
        "email" => "alex@example.com",
        "name" => "Alex Johnson",
        "avatarUrl" => "https://example.com/avatars/alex.jpg",
    ],
]);`
            }
          ]
        }
      },
      {
        title: "5. Querying Real-Time Revenue & Clicks Telemetry",
        description: "Fetch live click counts, tracked revenue amount, and average earnings per click (EPC):",
        snippet: {
          language: "typescript",
          filename: "get-analytics.ts",
          code: `const stats = await lshorter.analytics.dashboard({ linkId: "link_01" });

console.log("Total Clicks:", stats.totalClicks);
console.log("Tracked Revenue:", stats.trackedRevenue, "EUR");
console.log("Earnings Per Click (EPC):", stats.epc);`,
          tabs: [
            {
              name: "TypeScript",
              language: "typescript",
              code: `const stats = await lshorter.analytics.dashboard({ linkId: "link_01" });

console.log("Total Clicks:", stats.totalClicks);
console.log("Tracked Revenue:", stats.trackedRevenue, "EUR");
console.log("Earnings Per Click (EPC):", stats.epc);`
            },
            {
              name: "Python",
              language: "python",
              code: `stats = lsh.analytics.dashboard(link_id="link_01")

print("Total Clicks:", stats["totalClicks"])
print("Tracked Revenue:", stats["trackedRevenue"], "EUR")
print("Top Countries:", lsh.analytics.top(link_id="link_01")["topCountries"])`
            },
            {
              name: "Rust",
              language: "rust",
              code: `let stats = client.analytics().dashboard(Some("link_01"), None, None).await?;

println!("Total Clicks: {}", stats.total_clicks);
println!("Tracked Revenue: {} EUR", stats.tracked_revenue);`
            },
            {
              name: "Go",
              language: "go",
              code: `stats, err := client.Analytics.Dashboard(ctx, "link_01", "", "")
if err != nil {
	log.Fatal(err)
}
fmt.Printf("Clicks: %d | Revenue: %.2f EUR\\n", stats.TotalClicks, stats.TrackedRevenue)`
            },
            {
              name: "PHP",
              language: "php",
              code: `$stats = $lsh->analytics->dashboard(linkId: "link_01");

echo "Total Clicks: " . $stats["totalClicks"] . PHP_EOL;
echo "Tracked Revenue: " . $stats["trackedRevenue"] . " EUR" . PHP_EOL;`
            }
          ]
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
    subtitle: "Redirect visitors to contextual URLs based on their origin country or continent with ultra-low latency.",
    description: "Guide and REST API reference for configuring country and continent geographic redirection rules (ISO 3166-1) evaluated directly on Cloudflare Edge nodes.",
    image: "/screenshots/geo/geowithsidbare.png",
    readTime: "4 min read",
    overview: [
      "Geographic routing optimizes user experience and conversion rates by serving localized content (language, currency, catalog) by country or continent from a single shared link.",
      "Rules evaluation happens directly at Cloudflare Edge nodes during DNS resolution and TLS handshake, ensuring average redirection times under 15 milliseconds without backend server round-trips.",
      "Dynamic routing and geo targeting are exclusive to paid plans (Pro, Business, and Enterprise). Free tier links redirect unconditionally to the primary destination URL."
    ],
    keyPoints: [
      {
        title: "Closest-to-User Resolution",
        description: "The visitor's country and continent are detected from the CF-IPCountry Edge header with zero extra proxy latency."
      },
      {
        title: "Permanent Fallback URL",
        description: "If the visitor's country or continent does not match any specific rule, they are automatically routed to the default fallback URL."
      },
      {
        title: "Country & Continent Targeting",
        description: "Define rules for any 2-letter country code (e.g., US, UK, FR, DE, JP, CA, AU) or continent region."
      }
    ],
    apiEndpoints: [
      {
        name: "Update Geographic Routing Rules",
        method: "PATCH",
        path: "/api/v1/links/:id/routing",
        description: "Configures or updates country-specific destination rules and global fallback URL for a given short link.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "60 to 1,400 req/min (by plan)",
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
          { status: 403, code: "PLAN_UPGRADE_REQUIRED", description: "Dynamic routing and geo targeting require an active paid subscription (Pro, Business, or Enterprise)." },
          { status: 404, code: "LINK_NOT_FOUND", description: "No link found matching the provided slug or ID." }
        ]
      }
    ],
    codeSnippets: [
      {
        title: "1. Configuring Geo & Device Routing via SDK",
        description: "Attach country-based and device-based redirection rules across any official SDK:",
        snippet: {
          language: "typescript",
          filename: "set-geo-routing.ts",
          code: `await lshorter.links.update("link_global_promo", {
  fallbackUrl: "https://store.com/global",
  geoTargeting: {
    US: "https://store.com/us/fall-sale",
    GB: "https://store.com/uk/autumn-sale",
    DE: "https://store.com/de/herbst-angebote",
    FR: "https://store.com/fr/offres-automne",
  },
});`,
          tabs: [
            {
              name: "TypeScript",
              language: "typescript",
              code: `await lshorter.links.update("link_global_promo", {
  fallbackUrl: "https://store.com/global",
  geoTargeting: {
    US: "https://store.com/us/fall-sale",
    GB: "https://store.com/uk/autumn-sale",
    DE: "https://store.com/de/herbst-angebote",
    FR: "https://store.com/fr/offres-automne",
  },
});`
            },
            {
              name: "Python",
              language: "python",
              code: `lsh.links.update("link_global_promo", {
    "fallbackUrl": "https://store.com/global",
    "geoTargeting": {
        "US": "https://store.com/us/fall-sale",
        "GB": "https://store.com/uk/autumn-sale",
        "DE": "https://store.com/de/herbst-angebote",
        "FR": "https://store.com/fr/offres-automne",
    },
})`
            },
            {
              name: "Rust",
              language: "rust",
              code: `client.links().update("link_global_promo", &serde_json::json!({
    "fallbackUrl": "https://store.com/global",
    "geoTargeting": {
        "US": "https://store.com/us/fall-sale",
        "FR": "https://store.com/fr/offres-automne",
    },
})).await?;`
            },
            {
              name: "Go",
              language: "go",
              code: `_, err := client.Links.Update(ctx, "link_global_promo", lshorter.CreateLinkOptions{
	FallbackURL: "https://store.com/global",
	GeoTargeting: map[string]string{
		"US": "https://store.com/us/fall-sale",
		"FR": "https://store.com/fr/offres-automne",
	},
})`
            },
            {
              name: "PHP",
              language: "php",
              code: `$lsh->links->update("link_global_promo", [
    "fallbackUrl" => "https://store.com/global",
    "geoTargeting" => [
        "US" => "https://store.com/us/fall-sale",
        "FR" => "https://store.com/fr/offres-automne",
    ],
]);`
            }
          ]
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
    image: "/screenshots/drawer/niveau4-1.png",
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
        rateLimit: "60 to 1,400 req/min (by plan)",
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
    image: "/screenshots/geo2/geo1.png",
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
        description: "Analyze performance by country, continent, device type (mobile, desktop, tablet), OS, and browser."
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
        rateLimit: "60 to 1,400 req/min (by plan)",
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
        description: "Query comprehensive real-time metrics for a specific link in TypeScript, Python, Rust, Go, or PHP:",
        snippet: {
          language: "typescript",
          filename: "get-analytics.ts",
          code: `const stats = await lshorter.analytics.dashboard({ linkId: "launch-2026" });

console.log("Total Clicks:", stats.totalClicks);
console.log("Top Countries:", stats.topCountries);
console.log("Top Devices:", stats.topDevices);`,
          tabs: [
            {
              name: "TypeScript",
              language: "typescript",
              code: `const stats = await lshorter.analytics.dashboard({ linkId: "launch-2026" });

console.log("Total Clicks:", stats.totalClicks);
console.log("Top Countries:", stats.topCountries);
console.log("Top Devices:", stats.topDevices);`
            },
            {
              name: "Python",
              language: "python",
              code: `stats = lsh.analytics.dashboard(link_id="launch-2026")
top = lsh.analytics.top(link_id="launch-2026")

print("Total Clicks:", stats["totalClicks"])
print("Top Countries:", top["topCountries"])
print("Top Devices:", top["topDevices"])`
            },
            {
              name: "Rust",
              language: "rust",
              code: `let stats = client.analytics().dashboard(Some("launch-2026"), None, None).await?;
let top = client.analytics().top(Some("launch-2026")).await?;

println!("Total Clicks: {}", stats.total_clicks);
println!("Top Breakdown: {top}");`
            },
            {
              name: "Go",
              language: "go",
              code: `stats, err := client.Analytics.Dashboard(ctx, "launch-2026", "", "")
if err != nil {
	log.Fatal(err)
}
fmt.Println("Total Clicks:", stats.TotalClicks)`
            },
            {
              name: "PHP",
              language: "php",
              code: `$stats = $lsh->analytics->dashboard(linkId: "launch-2026");
$top = $lsh->analytics->top(linkId: "launch-2026");

echo "Total Clicks: " . $stats["totalClicks"] . PHP_EOL;`
            }
          ]
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
    image: "/screenshots/drawer/niveau3.png",
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
        rateLimit: "60 to 1,400 req/min (by plan)",
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
    title: "Branded URL Masking & White-Label Embedding",
    subtitle: "Preserve brand consistency and mask complex affiliate or third-party destination URLs in the browser address bar.",
    description: "REST API guide to configuring branded URL masking, custom page titles, and sandbox iframe encapsulation.",
    image: "/screenshots/domaine/niveau.png",
    readTime: "3 min read",
    overview: [
      "Branded URL Masking displays destination page content while keeping your branded domain in the visitor's browser address bar.",
      "This technique is widely used for forms hosted on third-party SaaS platforms (Typeform, Notion, Airtable), and white-label enterprise client portals."
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
        description: "Enables or disables branded URL masking and configures the embedded page title and favicon metadata.",
        authentication: "Bearer <API_KEY>",
        rateLimit: "60 to 1,400 req/min (by plan)",
        pathParams: [
          { name: "id", type: "string", required: true, description: "Short link slug or ID.", example: "partner-deal" }
        ],
        bodyParams: [
          { name: "maskUrl", type: "boolean", required: true, description: "Set to true to enable branded masking.", example: "true" },
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
    image: "/screenshots/qr-code/page1.png",
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
        rateLimit: "60 to 1,400 req/min (by plan)",
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
    image: "/screenshots/webhooks/niveau.png",
    readTime: "4 min read",
    overview: [
      "LShorter webhooks notify your backend systems in real time whenever an event occurs on your short links (click registered, conversion recorded, QR scanned, link updated or deleted).",
      "All outgoing HTTP POST payloads are cryptographically signed with an HMAC-SHA256 secret key via the x-lshorter-signature header to guarantee authenticity and prevent tampering.",
      "Webhook subscriptions can be created, listed, updated, and deleted either from the LShorter dashboard (Settings > Webhooks) or programmatically via the SDK or REST API (Pro, Business, and Enterprise plans, with anti-SSRF validation and strict per-account isolation)."
    ],
    keyPoints: [
      {
        title: "Supported Event Types",
        description: "click.created, click.unique, conversion.created, link.created, link.updated, link.deleted, link.expired, qr.scanned, target.reached."
      },
      {
        title: "Cryptographic HMAC-SHA256 Signatures",
        description: "Validate the x-lshorter-signature header to verify payload integrity before processing."
      },
      {
        title: "Full Dashboard & SDK Management (Pro+)",
        description: "Create, list, update, pause, and delete signed webhook subscriptions programmatically via lsh.webhooks.create(...) or from Settings > Webhooks."
      },
      {
        title: "Exponential Backoff Retries",
        description: "Automatic retry schedule with exponential backoff if your webhook receiver returns a 5xx error or times out."
      }
    ],
    apiEndpoints: [
      {
        name: "Create & List Webhook Subscriptions",
        method: "POST",
        path: "/api/v1/webhooks",
        description: "Registers a new signed webhook endpoint (requires PRO, BUSINESS, or ENTERPRISE plan; protected by anti-SSRF, anti-loop, and per-account quota enforcement).",
        authentication: "Bearer <API_KEY>",
        rateLimit: "20 req/min on creation",
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X POST "https://lsho.cc/api/v1/webhooks" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://api.my-domain.com/webhooks/lshorter","events":["click.created","conversion.created","qr.scanned"]}'`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `import { LShorter } from "lshorter-api";

const lshorter = new LShorter({ apiKey: process.env.LSHORTER_API_KEY! });

const created = await lshorter.webhooks.create({
  url: "https://api.my-domain.com/webhooks/lshorter",
  events: ["click.created", "conversion.created", "qr.scanned"],
});
const webhooks = await lshorter.webhooks.list();
console.log("Created & active webhooks:", created, webhooks);`
          }
        ],
        responses: [
          {
            status: 200,
            statusText: "OK",
            description: "List of registered webhook endpoints and their subscribed events.",
            json: `{
  "webhooks": [
    {
      "id": "wh_883019283",
      "url": "https://api.my-domain.com/webhooks/lshorter",
      "events": ["link.clicked", "link.converted", "link.limit_reached"],
      "isActive": true,
      "createdAt": "2026-09-17T12:30:00.000Z"
    }
  ]
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
    image: "/screenshots/revenue/page1.png",
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
        rateLimit: "60 to 1,400 req/min (by plan)",
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
        rateLimit: "60 to 1,400 req/min (by plan)",
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
        rateLimit: "60 to 1,400 req/min (by plan)",
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
    image: "/screenshots/stream/page1.png",
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
        rateLimit: "60 to 1,400 req/min (by plan)",
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
    image: "/screenshots/drawer/niveau6.png",
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
        rateLimit: "60 to 1,400 req/min (by plan)",
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
  },
  {
    slug: "path-lock",
    title: "PathLock™ Restricted Browsing & Funnel Isolation",
    subtitle: "Lock visitors strictly into a designated landing page or sales funnel, preventing unauthorized directory exploration with instant edge security gating.",
    description: "Prevent distraction, isolate conversion funnels, and gate unapproved subpath exploration using PathLock™ Strict and Funnel modes.",
    image: "/screenshots/drawer/niveau4-2.png",
    readTime: "4 min read",
    overview: [
      "PathLock™ is an exclusive PRO security and anti-distraction feature designed for marketing teams, affiliate publishers, and funnel architects.",
      "When enabled, PathLock™ displays the destination within a responsive, isolated viewer container equipped with an edge security gate.",
      "Strict Single-Page mode prevents visitors from exploring other site directories (e.g. browsing the store catalog when shared a single product validation page).",
      "Funnel & Subpaths mode permits seamless progression through multi-step funnels (e.g., /checkout, /confirmation, /upsell) while blocking escape routes outside the authorized prefix."
    ],
    keyPoints: [
      {
        title: "Strict Single-Page Isolation",
        description: "Locks visitor access strictly to the exact target path. Any attempt to navigate outside immediately triggers the Gate blocking screen."
      },
      {
        title: "Funnel & Subpaths Scope",
        description: "Permits all nested child routes (e.g. /funnel/step-1, /funnel/checkout) while safeguarding against broader domain exploration."
      },
      {
        title: "Preserved Anchors & Query Parameters",
        description: "In-page smooth scrolling (#features, #pricing) and tracking query parameters (UTMs, affiliate tokens) remain 100% operational."
      },
      {
        title: "Collapsible Topbar",
        description: "Offers visitors an unobtrusive experience with smooth collapsible topbar and an instant floating recovery pill."
      }
    ],
    apiEndpoints: [
      {
        name: "Create Link with PathLock™",
        method: "POST",
        path: "/api/v1/links",
        description: "Create a short link configured with PathLock™ single-page or funnel isolation.",
        authentication: "Bearer Token required",
        rateLimit: "60 to 1,400 req/min (by plan)",
        bodyParams: [
          {
            name: "pathLockMode",
            type: "string",
            required: false,
            description: "PathLock restriction mode: 'off' | 'strict' | 'funnel'. (PRO plan)",
            example: "strict",
            default: "off"
          },
          {
            name: "pathLockPrefix",
            type: "string",
            required: false,
            description: "Authorized URL path prefix to whitelist for visitor browsing.",
            example: "product-page"
          },
          {
            name: "pathLockMessage",
            type: "string",
            required: false,
            description: "Custom notice message presented when visitor triggers security gate.",
            example: "Navigation restricted to this presentation page."
          }
        ],
        codeExamples: [
          {
            name: "cURL",
            language: "bash",
            code: `curl -X POST "https://lsho.cc/api/v1/links" \\
  -H "Authorization: Bearer $LSHORTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "targetUrl": "https://brand.com/exclusive-deal",
    "slug": "deal-2026",
    "pathLockMode": "strict",
    "pathLockPrefix": "exclusive-deal",
    "pathLockMessage": "Access is restricted to this exclusive presentation."
  }'`
          },
          {
            name: "TypeScript SDK",
            language: "typescript",
            code: `import { lshorter } from "@/lib/lshorter";

const link = await lshorter.links.create({
  targetUrl: "https://brand.com/exclusive-deal",
  slug: "deal-2026",
  pathLockMode: "strict",
  pathLockPrefix: "exclusive-deal",
  pathLockMessage: "Access is restricted to this exclusive presentation.",
});`
          }
        ],
        responses: [
          {
            status: 201,
            statusText: "Created",
            description: "PathLocked short link successfully created.",
            json: `{
  "id": "link_pl_98124",
  "slug": "deal-2026",
  "shortUrl": "https://lsho.cc/deal-2026",
  "targetUrl": "https://brand.com/exclusive-deal",
  "pathLockMode": "strict",
  "pathLockPrefix": "exclusive-deal",
  "pathLockMessage": "Access is restricted to this exclusive presentation."
}`
          }
        ]
      }
    ],
    codeSnippets: [
      {
        title: "1. Configuring PathLock™ Funnel Mode",
        description: "Authorize an entire checkout funnel while barring visitors from exploring outside pages:",
        snippet: {
          language: "typescript",
          filename: "pathlock-funnel.ts",
          code: `const link = await lshorter.links.create({
  targetUrl: "https://shop.com/checkout/step-1",
  slug: "secure-checkout",
  pathLockMode: "funnel",
  pathLockPrefix: "checkout",
  pathLockMessage: "Please complete your order within this secure funnel.",
});`,
          tabs: [
            {
              name: "TypeScript",
              language: "typescript",
              code: `const link = await lshorter.links.create({
  targetUrl: "https://shop.com/checkout/step-1",
  slug: "secure-checkout",
  pathLockMode: "funnel",
  pathLockPrefix: "checkout",
  pathLockMessage: "Please complete your order within this secure funnel.",
});`
            },
            {
              name: "Python",
              language: "python",
              code: `link = lsh.links.create({
    "targetUrl": "https://shop.com/checkout/step-1",
    "slug": "secure-checkout",
    "pathLockMode": "funnel",
    "pathLockPrefix": "checkout",
    "pathLockMessage": "Please complete your order within this secure funnel.",
})`
            },
            {
              name: "Rust",
              language: "rust",
              code: `let link = client.links().create(&CreateLinkOptions {
    target_url: "https://shop.com/checkout/step-1".into(),
    slug: Some("secure-checkout".into()),
    path_lock_mode: Some("funnel".into()),
    path_lock_prefix: Some("checkout".into()),
    path_lock_message: Some("Please complete your order within this secure funnel.".into()),
    ..Default::default()
}).await?;`
            },
            {
              name: "Go",
              language: "go",
              code: `link, err := client.Links.Create(ctx, lshorter.CreateLinkOptions{
	TargetURL:       "https://shop.com/checkout/step-1",
	Slug:            "secure-checkout",
	PathLockMode:    "funnel",
	PathLockPrefix:  "checkout",
	PathLockMessage: "Please complete your order within this secure funnel.",
})`
            },
            {
              name: "PHP",
              language: "php",
              code: `$link = $lsh->links->create([
    "targetUrl" => "https://shop.com/checkout/step-1",
    "slug" => "secure-checkout",
    "pathLockMode" => "funnel",
    "pathLockPrefix" => "checkout",
    "pathLockMessage" => "Please complete your order within this secure funnel.",
]);`
            }
          ]
        }
      }
    ],
    responseSample: {
      title: "PathLock Link Payload",
      description: "Link configuration with active PathLock isolation:",
      json: `{
  "id": "link_pl_98124",
  "slug": "secure-checkout",
  "shortUrl": "https://lsho.cc/secure-checkout",
  "targetUrl": "https://shop.com/checkout/step-1",
  "pathLockMode": "funnel",
  "pathLockPrefix": "checkout",
  "pathLockMessage": "Please complete your order within this secure funnel.",
  "isCloaked": true
}`
    },
    bestPractices: [
      "Use 'Strict Single-Page' when sharing one-off product reviews, NDAs, or partner validations.",
      "Use 'Funnel & Subpaths' with a common root prefix (e.g., 'checkout' or 'webinar') to permit natural multi-step user flows.",
      "Provide a friendly, context-specific block message so visitors understand why wider site navigation was gated."
    ]
  }
];

export interface DocCategoryMeta {
  tag: string;
  color: string;
  date: string;
}

export const DOC_CATEGORIES: Record<
  string,
  { en: string; fr: string; color: string; date: string }
> = {
  "sdk-quickstart": {
    en: "SDK & API",
    fr: "SDK & API",
    color: "bg-emerald-500",
    date: "v1.2",
  },
  "geo-routing": {
    en: "Edge Routing",
    fr: "Routage Edge",
    color: "bg-brand",
    date: "09/12",
  },
  "ab-testing-routing": {
    en: "A/B Testing",
    fr: "Tests A/B",
    color: "bg-orange-500",
    date: "09/10",
  },
  "pin-protection": {
    en: "Security",
    fr: "Sécurité",
    color: "bg-amber-500",
    date: "09/08",
  },
  "realtime-analytics": {
    en: "Analytics",
    fr: "Analytique",
    color: "bg-purple-500",
    date: "09/04",
  },
  "conversion-tracking-amount-count": {
    en: "Conversions & EPC",
    fr: "Conversions & EPC",
    color: "bg-emerald-600",
    date: "09/01",
  },
  "click-limits-and-expiration": {
    en: "Limits",
    fr: "Limites",
    color: "bg-rose-500",
    date: "08/28",
  },
  "url-masking": {
    en: "Brand Masking",
    fr: "Masquage de marque",
    color: "bg-sky-500",
    date: "08/20",
  },
  "dynamic-qr-codes": {
    en: "QR Codes",
    fr: "QR Codes",
    color: "bg-indigo-500",
    date: "08/14",
  },
  "social-sharing-opengraph": {
    en: "Open Graph",
    fr: "Open Graph",
    color: "bg-pink-500",
    date: "08/08",
  },
  "webhooks-and-events": {
    en: "Webhooks",
    fr: "Webhooks",
    color: "bg-emerald-400",
    date: "08/02",
  },
  "path-lock": {
    en: "PathLock™",
    fr: "PathLock™",
    color: "bg-violet-500",
    date: "09/14",
  },
};

export function getLocalizedDocCategories(
  locale: Locale = "en"
): Record<string, DocCategoryMeta> {
  const isFr = locale === "fr";
  const result: Record<string, DocCategoryMeta> = {};
  for (const [slug, meta] of Object.entries(DOC_CATEGORIES)) {
    result[slug] = {
      tag: isFr ? meta.fr : meta.en,
      color: meta.color,
      date: meta.date,
    };
  }
  return result;
}

interface DocApiEndpointTranslation {
  name: string;
  description: string;
  authentication?: string;
  rateLimit?: string;
  headers?: Record<string, string>;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string>;
  bodyParams?: Record<string, string>;
  responses?: string[];
  errorCodes?: Record<string, string>;
}

interface DocFeatureTranslation {
  title: string;
  subtitle: string;
  description: string;
  readTime: string;
  overview: string[];
  keyPoints: { title: string; description: string }[];
  apiEndpoints?: DocApiEndpointTranslation[];
  codeSnippets: { title: string; description: string }[];
  responseSample?: { title: string; description: string };
  bestPractices: string[];
}

const FR_RATE_LIMIT_DEFAULT = "60 à 1 400 req/min (selon le forfait)";

const DOC_FEATURES_FR: Record<string, DocFeatureTranslation> = {
  "sdk-quickstart": {
    title: "Démarrage rapide & Référence API REST",
    subtitle:
      "Intégrez le raccourcissement intelligent de liens à la périphérie, l'analytique en temps réel et le suivi des conversions grâce à notre API REST et à nos SDK officiels TypeScript, Python, Rust, Go et PHP.",
    description:
      "Référence complète de l'API REST, URL de base, en-têtes d'authentification, limites de débit, démarrage rapide multi-langages (JS/TS, Python, Rust, Go, PHP) et catalogue des endpoints pour développeurs.",
    readTime: "5 min de lecture",
    overview: [
      "L'API REST LShorter offre un accès programmatique à l'ensemble des fonctionnalités de gestion de liens, de routage edge, de masquage de confidentialité, d'attribution des conversions et de télémétrie de la plateforme LShorter.",
      "Toutes les requêtes sont acheminées vers le réseau edge mondial de Cloudflare (plus de 300 centres de données dans le monde) afin de garantir des temps de réponse inférieurs à 15 ms, une disponibilité de 99,99 % et un chiffrement TLS 1.3 automatique.",
      "Les développeurs peuvent interagir directement via des requêtes HTTP standard ou utiliser nos SDK officiels typés pour TypeScript/JavaScript (lshorter-api), Python (lshorter-api), Rust (lshorter-api), Go (github.com/Konvelbo/LShorter-api/sdks/go) et PHP (lshorter/lshorter-api).",
    ],
    keyPoints: [
      {
        title: "REST & JSON standard",
        description:
          "Des URL orientées ressources prévisibles, des méthodes HTTP standard (GET, POST, PATCH, DELETE) et des corps de requêtes et réponses encodés en JSON.",
      },
      {
        title: "Authentification par jeton Bearer",
        description:
          "Sécurisez chaque requête avec l'en-tête Authorization: Bearer <API_KEY>. Gérez vos clés et leurs permissions directement depuis votre tableau de bord développeur.",
      },
      {
        title: "Limites de débit adaptatives",
        description:
          "Des limites de débit évolutives de 60 à 1 400 requêtes par minute selon votre forfait (Starter : 60, Pro : 200, Business : 600, Enterprise : 1 400), avec des en-têtes de quota temps réel inclus dans chaque réponse HTTP.",
      },
      {
        title: "Exécution Edge mondiale",
        description:
          "La logique de redirection, la résolution géographique et les compteurs de clics atomiques s'exécutent directement dans des isolats V8 à l'Edge, sans latence serveur d'origine.",
      },
    ],
    apiEndpoints: [
      {
        name: "Créer un lien court",
        description:
          "Crée une nouvelle URL raccourcie avec en option un slug personnalisé, des tags, une date d'expiration, une limite maximale de clics, une protection par code PIN, un masquage de marque et des règles de routage géographique.",
        rateLimit: FR_RATE_LIMIT_DEFAULT,
        headers: {
          Authorization: "Jeton Bearer contenant votre clé API secrète.",
          "Content-Type": "Doit être défini sur application/json.",
        },
        bodyParams: {
          url: "L'URL de destination vers laquelle les visiteurs seront redirigés.",
          slug: "Alias personnalisé du lien. Si omis, une chaîne aléatoire de 7 caractères à haute entropie est générée automatiquement.",
          tags: "Tableau de tags de catégorisation pour filtrer vos statistiques.",
          maxClicks:
            "Nombre maximal de clics autorisés avant que le lien ne soit automatiquement désactivé.",
          expiresAt:
            "Horodatage d'expiration UTC après lequel le lien devient inactif.",
          expiredRedirectUrl:
            "URL de secours alternative vers laquelle rediriger les visiteurs une fois le lien expiré.",
          pinCode:
            "Code PIN de sécurité à 4 chiffres requis pour accéder à l'URL de destination.",
          maskUrl:
            "Si true, masque l'URL de destination en affichant le contenu dans une iframe sous votre domaine de marque.",
          metaTitle: "Titre Open Graph personnalisé pour les réseaux sociaux.",
          ogDescription:
            "Description Open Graph personnalisée pour les cartes d'aperçu social.",
          ogImage:
            "URL de l'image bannière (1200x630px) pour les aperçus sur les réseaux sociaux.",
        },
        responses: ["Lien court créé avec succès."],
        errorCodes: {
          INVALID_URL: "L'URL de destination fournie est invalide ou mal formée.",
          UNAUTHORIZED: "Clé API Bearer manquante ou invalide.",
          SLUG_ALREADY_EXISTS:
            "Le slug personnalisé demandé est déjà utilisé par un autre lien.",
          INVALID_EXPIRATION:
            "expiresAt doit être un horodatage ISO 8601 valide situé dans le futur.",
          RATE_LIMIT_EXCEEDED:
            "Vous avez dépassé la limite de débit associée à votre forfait actuel.",
        },
      },
      {
        name: "Lister les liens courts",
        description:
          "Récupère une liste paginée de tous les liens courts créés au sein de votre organisation, avec recherche textuelle, filtrage par tag et options de tri.",
        rateLimit: FR_RATE_LIMIT_DEFAULT,
        queryParams: {
          page: "Numéro de page à récupérer.",
          limit: "Nombre de liens par page (maximum 100).",
          tag: "Filtre les liens selon le nom exact d'un tag.",
          search:
            "Requête de recherche portant sur le slug ou l'URL de destination.",
          sortBy: "Critère de tri des résultats.",
          order: "Ordre de tri (ascendant ou descendant).",
        },
        responses: [
          "Liste des liens courts renvoyée avec les métadonnées de pagination.",
        ],
      },
    ],
    codeSnippets: [
      {
        title:
          "1. Installation du SDK officiel (JS/TS, Python, Rust, Go & PHP)",
        description:
          "Installez le SDK officiel LShorter pour votre stack à l'aide de votre gestionnaire de paquets favori :",
      },
      {
        title: "2. Initialisation du client",
        description:
          "Configurez votre client LShorter avec votre clé API secrète dans n'importe quel langage pris en charge :",
      },
      {
        title: "3. Créer votre premier lien court",
        description:
          "Créez un lien court traçable avec slug personnalisé, ciblage géographique et pixels de retargeting :",
      },
      {
        title:
          "4. Enregistrer une conversion avec avatar client (avatarUrl & customerAvatar)",
        description:
          "Enregistrez une vente avec la photo de profil / l'avatar du client affiché dans vos tableaux de bord temps réel :",
      },
      {
        title: "5. Interroger la télémétrie revenus et clics en temps réel",
        description:
          "Récupérez les compteurs de clics en direct, le chiffre d'affaires suivi et le gain moyen par clic (EPC) :",
      },
    ],
    bestPractices: [
      "Gardez votre clé API strictement privée : stockez-la dans vos variables d'environnement (LSHORTER_API_KEY) et ne la versionnez jamais dans un dépôt public.",
      "Utilisez le pooling de connexions HTTP Keep-Alive entre vos requêtes afin de minimiser la latence de négociation TLS.",
      "Surveillez les en-têtes de limite de débit (x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset) pour anticiper les pics de trafic.",
      "Mettez en place une gestion idempotente des requêtes lorsque vous réessayez des appels sur les endpoints POST.",
    ],
  },

  "geo-routing": {
    title: "Routage dynamique & Géolocalisation Edge",
    subtitle:
      "Redirigez vos visiteurs vers des URL contextuelles selon leur pays ou leur continent d'origine avec une latence ultra-faible.",
    description:
      "Guide et référence API REST pour configurer des règles de redirection géographique par pays et continent (ISO 3166-1), évaluées directement sur les nœuds Cloudflare Edge.",
    readTime: "4 min de lecture",
    overview: [
      "Le routage géographique optimise l'expérience utilisateur et les taux de conversion en servant un contenu localisé (langue, devise, catalogue) selon le pays ou le continent, à partir d'un seul lien partagé.",
      "L'évaluation des règles s'effectue directement sur les nœuds Cloudflare Edge lors de la résolution DNS et de la négociation TLS, garantissant un temps moyen de redirection inférieur à 15 millisecondes sans aller-retour vers le serveur backend.",
      "Le routage dynamique et le ciblage géographique sont réservés aux forfaits payants (Pro, Business et Enterprise). Les liens du forfait gratuit redirigent systématiquement vers l'URL de destination principale.",
    ],
    keyPoints: [
      {
        title: "Résolution au plus près de l'utilisateur",
        description:
          "Le pays et le continent du visiteur sont détectés à partir de l'en-tête Edge CF-IPCountry, sans aucune latence de proxy supplémentaire.",
      },
      {
        title: "URL de secours permanente",
        description:
          "Si le pays ou le continent du visiteur ne correspond à aucune règle spécifique, il est automatiquement redirigé vers l'URL de secours par défaut.",
      },
      {
        title: "Ciblage par pays et par continent",
        description:
          "Définissez des règles pour n'importe quel code pays à 2 lettres (ex. US, UK, FR, DE, JP, CA, AU) ou zone continentale.",
      },
    ],
    apiEndpoints: [
      {
        name: "Mettre à jour les règles de routage géographique",
        description:
          "Configure ou met à jour les règles de destination par pays ainsi que l'URL de secours globale d'un lien court donné.",
        rateLimit: FR_RATE_LIMIT_DEFAULT,
        pathParams: {
          id: "L'identifiant du lien court ou son alias slug.",
        },
        bodyParams: {
          fallbackUrl:
            "URL par défaut utilisée lorsque le pays d'origine du visiteur ne correspond à aucune règle.",
          rules: "Tableau des règles de correspondance par pays.",
          "rules[].country": "Code pays majuscule à deux lettres (ISO 3166-1 alpha-2).",
          "rules[].targetUrl":
            "URL de destination pour les visiteurs provenant de ce pays.",
        },
        responses: [
          "Configuration de routage déployée immédiatement sur tous les nœuds Edge.",
        ],
        errorCodes: {
          INVALID_COUNTRY_CODE:
            "Le code pays doit être une chaîne ISO 3166-1 alpha-2 valide de 2 lettres en majuscules.",
          PLAN_UPGRADE_REQUIRED:
            "Le routage dynamique et le ciblage géographique nécessitent un abonnement payant actif (Pro, Business ou Enterprise).",
          LINK_NOT_FOUND:
            "Aucun lien trouvé correspondant au slug ou à l'identifiant fourni.",
        },
      },
    ],
    codeSnippets: [
      {
        title: "1. Configurer le routage géographique et par appareil via SDK",
        description:
          "Associez des règles de redirection par pays et par appareil depuis n'importe quel SDK officiel :",
      },
    ],
    responseSample: {
      title: "Confirmation des règles appliquées",
      description:
        "Structure renvoyée après la mise à jour des règles de routage géographique :",
    },
    bestPractices: [
      "Assurez-vous que votre URL de secours (fallbackUrl) soit toujours fonctionnelle et accessible dans le monde entier.",
      "Pour tester vos règles en préproduction sans VPN, passez l'en-tête HTTP X-Override-Country: US dans vos requêtes de test.",
      "Analysez régulièrement les pays non routés dans votre tableau de bord de télémétrie temps réel afin d'ajouter les régions à forte conversion.",
    ],
  },

  "pin-protection": {
    title: "Sécurité avancée & Protection par code PIN",
    subtitle:
      "Protégez vos documents confidentiels, présentations investisseurs et liens privés avec un code PIN à 4 chiffres vérifié à la volée.",
    description:
      "Guide API REST et spécification technique pour configurer des codes PIN sur vos liens courts, bloquer les attaques par force brute et émettre des sessions éphémères.",
    readTime: "3 min de lecture",
    overview: [
      "La protection par code PIN ajoute instantanément un contrôle d'accès sans friction, sans obliger vos visiteurs à créer de compte complexe ni à traverser de lourds parcours OAuth.",
      "Lorsqu'un visiteur ouvre un lien protégé, une interface edge légère et sécurisée lui demande le code PIN à 4 chiffres. Dès validation, un jeton de session éphémère est émis et la redirection s'exécute immédiatement.",
    ],
    keyPoints: [
      {
        title: "Hachage cryptographique du PIN",
        description:
          "Les codes PIN ne sont jamais stockés en clair ; ils sont salés et hachés de manière sécurisée avec Argon2id / bcrypt.",
      },
      {
        title: "Défense anti-force brute",
        description:
          "Après 5 tentatives échouées consécutives, l'adresse IP du visiteur est temporairement bloquée pendant 15 minutes.",
      },
      {
        title: "Jeton de session éphémère",
        description:
          "Une fois validé, la redirection s'effectue immédiatement grâce à un cookie de courte durée signé cryptographiquement.",
      },
    ],
    apiEndpoints: [
      {
        name: "Mettre à jour les paramètres de sécurité PIN",
        description:
          "Active, modifie ou désactive la protection par code PIN sur un lien court spécifique.",
        rateLimit: FR_RATE_LIMIT_DEFAULT,
        pathParams: {
          id: "Identifiant du lien court ou alias slug.",
        },
        bodyParams: {
          pinCode:
            "Chaîne de code PIN à 4 chiffres, ou null pour désactiver la protection.",
          maxAttempts:
            "Nombre maximal de tentatives échouées autorisées avant blocage temporaire de l'IP.",
        },
        responses: ["Paramètres de sécurité mis à jour avec succès."],
      },
    ],
    codeSnippets: [
      {
        title: "1. Créer un lien protégé par code PIN",
        description:
          "Spécifiez la propriété pinCode lors de la création du lien :",
      },
    ],
    responseSample: {
      title: "Structure de l'objet protégé",
      description:
        "Le champ isProtected confirme l'état de sécurité sans exposer le code en clair :",
    },
    bestPractices: [
      "Évitez les codes PIN triviaux comme 0000 ou 1234 pour vos documents financiers sensibles ou propositions commerciales.",
      "Transmettez le code PIN via un canal de communication distinct (ex. SMS / WhatsApp pour le PIN, e-mail pour le lien court).",
      "Combinez la protection par code PIN avec une date d'expiration (expiresAt) pour une confidentialité renforcée en profondeur.",
    ],
  },

  "realtime-analytics": {
    title: "API Télémétrie & Métriques en temps réel",
    subtitle:
      "Extrayez des analyses d'audience détaillées, la répartition géographique, les statistiques d'appareils et la télémétrie de clics à la milliseconde près.",
    description:
      "Référence API REST pour interroger la télémétrie en temps réel : volumes de clics, visiteurs uniques dédupliqués, répartition géographique, systèmes d'exploitation, navigateurs et référents.",
    readTime: "4 min de lecture",
    overview: [
      "Chaque interaction avec vos liens courts génère des métriques instantanées agrégées à l'Edge. Aucune donnée personnellement identifiable (PII) n'est stockée, garantissant une conformité native RGPD, CCPA et PECR.",
      "Les compteurs de redirections (count) et les montants financiers des conversions (amount) se synchronisent en temps réel via l'API REST pour alimenter vos tableaux de bord en direct, alertes automatisées ou systèmes de suivi de rentabilité (ROI/EPC).",
    ],
    keyPoints: [
      {
        title: "Compteurs de clics atomiques (Count)",
        description:
          "Chaque clic est comptabilisé de manière atomique à l'Edge (totalClicks) et distingué entre volume brut et visiteurs uniques sans cookie (uniqueVisitors).",
      },
      {
        title: "Métriques monétaires & Revenus (Amount)",
        description:
          "Suivez le chiffre d'affaires cumulé (trackedRevenue), le panier moyen (AOV) et le gain par clic (EPC = revenu total / clics totaux).",
      },
      {
        title: "Segmentation multidimensionnelle",
        description:
          "Analysez les performances par pays, continent, type d'appareil (mobile, desktop, tablette), système d'exploitation et navigateur.",
      },
      {
        title: "Suivi des référents",
        description:
          "Identifiez précisément vos sources de trafic (Twitter/X, LinkedIn, newsletters, moteurs de recherche).",
      },
    ],
    apiEndpoints: [
      {
        name: "Récupérer les statistiques d'un lien",
        description:
          "Récupère la télémétrie agrégée des clics, la répartition par pays, les appareils, les navigateurs et les principales sources référentes pour un lien court spécifique.",
        rateLimit: FR_RATE_LIMIT_DEFAULT,
        pathParams: {
          slug: "Alias slug du lien court.",
        },
        queryParams: {
          period: "Fenêtre temporelle d'agrégation des métriques.",
          country: "Filtre les statistiques selon un code pays précis.",
          device: "Filtre les statistiques par type d'appareil.",
        },
        responses: [
          "Charge utile de télémétrie contenant l'analyse complète du trafic.",
        ],
      },
    ],
    codeSnippets: [
      {
        title: "1. Récupérer les statistiques via le SDK",
        description:
          "Interrogez les métriques complètes en temps réel d'un lien en TypeScript, Python, Rust, Go ou PHP :",
      },
    ],
    bestPractices: [
      "Utilisez le paramètre de requête period pour extraire des plages temporelles exactes destinées à vos rapports hebdomadaires et mensuels automatisés.",
      "Exploitez la répartition mobile vs desktop pour optimiser l'ergonomie responsive et la vitesse de chargement de vos pages de destination.",
      "Combinez les paramètres UTM avec la télémétrie des référents pour isoler la performance de vos campagnes payantes du trafic social organique.",
    ],
  },

  "click-limits-and-expiration": {
    title: "Limites de clics & Expiration programmée",
    subtitle:
      "Automatisez la clôture de vos campagnes avec des quotas maximaux de clics (ventes flash) et des calendriers d'expiration UTC précis.",
    description:
      "Guide API REST pour définir des plafonds de clics (maxClicks), calculer les clics restants (remainingClicks) et activer la redirection de secours après expiration.",
    readTime: "3 min de lecture",
    overview: [
      "Les fonctionnalités de limitation et d'expiration automatisent la fin des campagnes marketing, promotions limitées ou invitations bêta restreintes sans aucune intervention manuelle des développeurs.",
      "Chaque visite déclenche un incrément atomique de clicksCount directement sur les nœuds Cloudflare Edge. Dès qu'une limite est atteinte (clicksCount >= maxClicks) ou que la date d'expiration est dépassée, le lien bascule instantanément en moins de 10 ms en statut inactif ou redirige vers une URL de secours.",
    ],
    keyPoints: [
      {
        title: "Compteur atomique sans verrou (Count)",
        description:
          "L'incrément atomique à l'Edge élimine toute condition de concurrence lors des pics de trafic viraux simultanés (plus de 50 000 clics/seconde).",
      },
      {
        title: "Calcul temps réel de remainingClicks",
        description:
          "remainingClicks = Math.max(0, maxClicks - clicksCount). Alimentez vos badges de rareté et d'urgence en direct.",
      },
      {
        title: "Horodatages ISO 8601 UTC",
        description:
          "Définissez une date et une heure d'expiration universelles exactes sans erreurs de conversion de fuseau horaire.",
      },
      {
        title: "Redirection de secours personnalisable",
        description:
          "Redirigez les visiteurs vers une page de liste d'attente « Offre terminée » ou affichez un écran d'expiration à votre image.",
      },
    ],
    apiEndpoints: [
      {
        name: "Mettre à jour les limites de clics et l'expiration",
        description:
          "Met à jour le quota maximal de clics, l'horodatage d'expiration ou l'URL de secours après expiration d'un lien actif.",
        rateLimit: FR_RATE_LIMIT_DEFAULT,
        pathParams: {
          id: "Slug ou identifiant du lien court.",
        },
        bodyParams: {
          maxClicks:
            "Nombre maximal de clics autorisés, ou null pour supprimer la limite.",
          expiresAt:
            "Horodatage d'expiration UTC, ou null pour supprimer l'expiration.",
          expiredRedirectUrl: "URL de destination après expiration du lien.",
        },
        responses: [
          "Limites mises à jour et appliquées sur tous les points de présence Edge mondiaux.",
        ],
      },
    ],
    codeSnippets: [
      {
        title: "1. Vérifier les compteurs atomiques et remainingClicks",
        description:
          "Surveillez la consommation de votre quota en temps réel pour vos interfaces utilisateurs :",
      },
    ],
    bestPractices: [
      "Configurez toujours une expiredRedirectUrl afin de ne jamais perdre un trafic client précieux après la fin de votre campagne.",
      "Veillez à transmettre les horodatages au format UTC standard (ISO 8601 terminé par Z) pour éviter tout décalage lié à l'heure d'été ou aux fuseaux horaires locaux.",
      "Abonnez-vous aux webhooks (link.limit_reached, link.expired) pour recevoir des notifications automatiques dans Slack ou Discord.",
    ],
  },

  "url-masking": {
    title: "Masquage d'URL de marque & Intégration marque blanche",
    subtitle:
      "Préservez la cohérence de votre marque et masquez les URL d'affiliation ou tierces complexes dans la barre d'adresse du navigateur.",
    description:
      "Guide API REST pour configurer le masquage d'URL de marque, personnaliser les titres de page et encapsuler le contenu dans une iframe sécurisée.",
    readTime: "3 min de lecture",
    overview: [
      "Le masquage d'URL de marque affiche le contenu de la page de destination tout en conservant votre nom de domaine dans la barre d'adresse du navigateur du visiteur.",
      "Cette technique est largement utilisée pour les formulaires hébergés sur des plateformes SaaS tierces (Typeform, Notion, Airtable) ainsi que pour les portails clients entreprise en marque blanche.",
    ],
    keyPoints: [
      {
        title: "Préservation de l'image de marque",
        description:
          "Les visiteurs voient en permanence votre domaine propre et reconnaissable au lieu d'une longue URL technique.",
      },
      {
        title: "Titres et favicons dynamiques",
        description:
          "Personnalisez le titre de l'onglet et le favicon du navigateur pour refléter parfaitement votre identité visuelle.",
      },
      {
        title: "Isolation sécurisée (Sandboxing)",
        description:
          "Conteneurisation fiable avec des en-têtes Content-Security-Policy (CSP) stricts protégeant la confidentialité des visiteurs.",
      },
    ],
    apiEndpoints: [
      {
        name: "Activer le masquage d'URL",
        description:
          "Active ou désactive le masquage d'URL de marque et configure le titre HTML ainsi que les métadonnées favicon de la page encapsulée.",
        rateLimit: FR_RATE_LIMIT_DEFAULT,
        pathParams: {
          id: "Slug ou identifiant du lien court.",
        },
        bodyParams: {
          maskUrl: "Définir sur true pour activer le masquage de marque.",
          pageTitle: "Titre HTML personnalisé affiché dans l'onglet du navigateur.",
          faviconUrl: "URL personnalisée de l'icône favicon.",
        },
        responses: ["Paramètres de masquage configurés avec succès."],
      },
    ],
    codeSnippets: [
      {
        title: "1. Créer un lien masqué",
        description:
          "Activez l'option maskUrl sur true lors de la création du lien :",
      },
    ],
    bestPractices: [
      "Vérifiez que les sites de destination autorisent l'intégration en iframe (assurez-vous qu'ils n'envoient pas d'en-tête strict X-Frame-Options: DENY).",
      "Définissez un pageTitle clair afin que l'onglet du navigateur reflète fidèlement le contenu présenté.",
      "Testez l'affichage responsive sur mobile pour vérifier que le défilement du contenu intégré reste fluide.",
    ],
  },

  "dynamic-qr-codes": {
    title: "API de génération de QR Codes dynamiques",
    subtitle:
      "Créez, personnalisez et diffusez dynamiquement des QR codes vectoriels SVG haute précision et PNG en résolution infinie.",
    description:
      "Documentation API REST pour la génération de QR codes dynamiques, personnalisation des couleurs, niveaux de correction d'erreur et télémétrie de scans en temps réel.",
    readTime: "3 min de lecture",
    overview: [
      "Un QR code dynamique LShorter encode votre URL courte permanente plutôt que l'adresse de destination finale. Vous pouvez modifier la cible à tout moment depuis le tableau de bord ou l'API, même après l'impression de millions de brochures, d'affiches ou d'emballages physiques.",
      "Chaque scan physique est enregistré dans la télémétrie en temps réel avec distinction des scans mobiles et suivi de l'origine géographique.",
    ],
    keyPoints: [
      {
        title: "Modifiable sans réimpression",
        description:
          "Modifiez l'URL de destination d'un QR code déjà imprimé en un clic, sans aucune interruption de service.",
      },
      {
        title: "SVG vectoriel & PNG haute résolution",
        description:
          "Exportez des fichiers vectoriels SVG à résolution infinie pour l'affichage grand format et l'impression, ou des PNG pour vos supports numériques.",
      },
      {
        title: "Niveaux de correction d'erreur",
        description:
          "Prise en charge des niveaux de correction L, M, Q et H permettant une lecture fiable même avec un logo centré.",
      },
    ],
    apiEndpoints: [
      {
        name: "Générer un QR Code dynamique",
        description:
          "Diffuse une image de QR code dynamique personnalisé au format SVG ou PNG.",
        rateLimit: FR_RATE_LIMIT_DEFAULT,
        pathParams: {
          slug: "Alias slug du lien court.",
        },
        queryParams: {
          format: "Format de sortie de l'image.",
          size: "Dimension de l'image en pixels (pour PNG) ou taille viewBox (pour SVG).",
          errorCorrectionLevel:
            "Niveau de redondance du QR code (H = 30 % de tolérance aux dommages).",
          darkColor: "Code couleur hexadécimal pour les modules du QR code.",
          lightColor: "Code couleur hexadécimal pour l'arrière-plan.",
          margin: "Largeur de la zone de calme périphérique en nombre de modules.",
        },
        responses: ["Image binaire renvoyée (image/svg+xml ou image/png)."],
      },
    ],
    codeSnippets: [
      {
        title: "1. Générer des QR Codes via le SDK",
        description: "Téléchargez vos QR codes au format SVG ou PNG :",
      },
    ],
    bestPractices: [
      "Utilisez le niveau de correction d'erreur « H » (30 % de redondance) dès que vous placez un logo ou une icône de marque au centre du QR code.",
      "Privilégiez toujours le format vectoriel SVG pour l'impression et le packaging afin de garantir des contours parfaitement nets à toute échelle physique.",
      "Testez la lisibilité du QR code sur iOS (application Appareil photo native) et sur Android avant de lancer la production d'impression.",
    ],
  },

  "webhooks-and-events": {
    title: "API Webhooks & Événements en temps réel",
    subtitle:
      "Abonnez-vous aux flux d'événements en temps réel, recevez des notifications HTTP instantanées et vérifiez les signatures HMAC-SHA256.",
    description:
      "Guide API REST pour enregistrer des endpoints webhook, valider les signatures cryptographiques et traiter les événements de clics, conversions, limites et expirations.",
    readTime: "4 min de lecture",
    overview: [
      "Les webhooks LShorter notifient vos systèmes backend en temps réel dès qu'un événement survient sur vos liens courts (clic enregistré, conversion comptabilisée, QR code scanné, lien modifié ou supprimé).",
      "Toutes les requêtes HTTP POST sortantes sont signées cryptographiquement avec une clé secrète HMAC-SHA256 via l'en-tête x-lshorter-signature afin de garantir leur authenticité et empêcher toute altération.",
      "Les abonnements webhooks peuvent être créés, listés, modifiés et supprimés aussi bien depuis le tableau de bord LShorter (Paramètres > Webhooks) que programmatiquement via le SDK ou l'API REST (forfaits Pro, Business et Enterprise, avec validation anti-SSRF et isolation stricte par compte).",
    ],
    keyPoints: [
      {
        title: "Types d'événements pris en charge",
        description:
          "click.created, click.unique, conversion.created, link.created, link.updated, link.deleted, link.expired, qr.scanned, target.reached.",
      },
      {
        title: "Signatures cryptographiques HMAC-SHA256",
        description:
          "Validez l'en-tête x-lshorter-signature pour vérifier l'intégrité de chaque charge utile avant tout traitement.",
      },
      {
        title: "Gestion complète via Tableau de bord & SDK (Pro+)",
        description:
          "Créez, listez, mettez à jour, suspendez et supprimez vos abonnements webhooks signés par code via lsh.webhooks.create(...) ou depuis Paramètres > Webhooks.",
      },
      {
        title: "Nouvelles tentatives à délai exponentiel",
        description:
          "Planification automatique de nouvelles tentatives avec backoff exponentiel si votre récepteur webhook renvoie une erreur 5xx ou expire.",
      },
    ],
    apiEndpoints: [
      {
        name: "Créer & Lister les abonnements Webhooks",
        description:
          "Enregistre un nouvel endpoint webhook signé (requiert un forfait PRO, BUSINESS ou ENTERPRISE ; protégé contre le SSRF, les boucles infinies et soumis au quota par compte).",
        rateLimit: "20 req/min à la création",
        responses: [
          "Liste des endpoints webhooks enregistrés et des événements auxquels ils sont abonnés.",
        ],
      },
    ],
    codeSnippets: [
      {
        title: "1. Vérifier les signatures HMAC dans Next.js / Node.js",
        description:
          "Vérifiez cryptographiquement les charges utiles webhook entrantes avant de les traiter :",
      },
    ],
    responseSample: {
      title: "Exemple de charge utile Webhook",
      description:
        "Charge utile JSON envoyée lors d'un événement link.clicked ou link.converted :",
    },
    bestPractices: [
      "Répondez rapidement avec un statut HTTP 200 OK (en moins de 3 000 ms) et déléguez les traitements métier longs à des files d'attente en arrière-plan (BullMQ, Celery, SQS).",
      "Vérifiez toujours la signature HMAC-SHA256 avant de parser ou d'exploiter les données JSON d'un webhook.",
      "Stockez les identifiants event.id reçus pour bâtir des gestionnaires idempotents capables d'absorber sereinement les réessais réseau.",
    ],
  },

  "conversion-tracking-amount-count": {
    title: "Suivi des conversions & Métriques financières (Amount & Count)",
    subtitle:
      "Guide complet de bout en bout pour attribuer les revenus monétaires (amount), calculer l'EPC et le ROI, capturer le clickId dans vos tunnels d'achat et gérer les achats multidevises et remboursements.",
    description:
      "Référence technique exhaustive et guide d'implémentation pour l'attribution de revenus (amount), les compteurs atomiques Edge (clicksCount, uniqueClicks, maxClicks), le panier moyen (AOV), le gain par clic (EPC) et les intégrations de paiement (Stripe, Shopify, WooCommerce).",
    readTime: "6 min de lecture",
    overview: [
      "Le moteur de conversion financière LShorter offre une attribution monétaire exacte de bout en bout en reliant directement le chiffre d'affaires e-commerce (amount) au clic d'origine du lien court (clickId). Que vous vendiez via Stripe, Shopify, LemonSqueezy, WooCommerce ou un tunnel de paiement sur mesure, chaque dollar, euro ou livre sterling est mathématiquement rattaché à son canal d'acquisition.",
      "Côté télémétrie, les compteurs de clics (clicksCount) et de conversions (conversionsCount) sont incrémentés sans verrou sur le réseau Cloudflare Edge. La plateforme calcule en continu vos indicateurs clés de rentabilité : Gain par Clic (EPC = trackedRevenue / totalClicks), Panier Moyen (AOV = trackedRevenue / conversionsCount) et Taux de Conversion (CR = conversionsCount / totalClicks * 100).",
      "Le système gère nativement la normalisation multidevise (USD, EUR, GBP, CAD, JPY), les déductions de remboursements partiels ou totaux (POST /api/v1/track/refund) pour conserver une comptabilité irréprochable, ainsi que les paiements asynchrones différés.",
    ],
    keyPoints: [
      {
        title: "Attribution automatique des clics (clickId)",
        description:
          "Lorsqu'un visiteur clique sur un lien LShorter, notre Worker Edge ajoute automatiquement un jeton éphémère ref=clk_... à l'URL de destination. Ce jeton est conservé dans le navigateur puis transmis au paiement.",
      },
      {
        title: "Ingestion de revenus monétaires (amount & currency)",
        description:
          "Transmettez le montant exact de la transaction (ex. amount: 49.00, currency: 'USD'). L'API met à jour trackedRevenue de façon atomique sans contention, même lors de ventes flash virales.",
      },
      {
        title: "Formules EPC & Rentabilité en temps réel",
        description:
          "Le Gain par Clic (EPC = trackedRevenue / totalClicks) vous permet de comparer directement vos gains au Coût par Clic (CPC) publicitaire. Lorsque EPC > CPC, votre campagne est rentable.",
      },
      {
        title: "Ajustements remboursements & litiges",
        description:
          "Préservez des rapports financiers impeccables : les endpoints de remboursement déduisent automatiquement les montants remboursés de trackedRevenue et recalculent votre ROI.",
      },
      {
        title: "Déduplication Edge sans cookie",
        description:
          "Suivi des visiteurs conforme au RGPD et à la directive PECR qui comptabilise précisément les acheteurs uniques et les conversions tout en respectant la vie privée.",
      },
    ],
    codeSnippets: [
      {
        title:
          "1. Pixel de suivi universel côté client (HTML / Webflow / Shopify / WordPress)",
        description:
          "Ajoutez cet extrait léger dans le <head> ou le pied de page de votre site pour capturer automatiquement le clickId depuis l'URL et le conserver pendant 30 jours dans un cookie et localStorage :",
      },
      {
        title: "2. Hook d'attribution Next.js (App Router) & React",
        description:
          "Hook React pour capturer le clickId via useSearchParams dans Next.js et le persister tout au long de la navigation client :",
      },
      {
        title: "3. Session Stripe Checkout & Ingestion Webhook",
        description:
          "Passez le clickId et les informations client dans les métadonnées Stripe Checkout Session, puis attribuez le revenu dès le paiement dans votre gestionnaire de webhook :",
      },
      {
        title:
          "4. Ingestion Webhook Shopify / E-Commerce avec avatar client",
        description:
          "Attribuez les commandes créées dans votre boutique Shopify aux liens courts LShorter avec la photo d'avatar du client :",
      },
      {
        title:
          "5. Résolution d'avatar & d'identité client (customerAvatar & avatarUrl)",
        description:
          "Récupérez les photos de profil client depuis Google/GitHub OAuth, NextAuth, Clerk ou Gravatar et transmettez-les à LShorter :",
      },
      {
        title:
          "6. Traitement des remboursements partiels et totaux (track.refund)",
        description:
          "Déduisez les montants remboursés du chiffre d'affaires cumulé d'un lien afin de maintenir une télémétrie financière exacte :",
      },
      {
        title:
          "7. Interroger la télémétrie financière temps réel & l'EPC via SDK",
        description:
          "Consultez les compteurs de clics atomiques, le revenu cumulé, l'AOV et calculez le ROI de votre campagne :",
      },
    ],
    apiEndpoints: [
      {
        name: "Enregistrer une conversion & un montant monétaire",
        description:
          "Enregistre un achat finalisé, un abonnement ou un événement de conversion avec son montant, sa devise et les informations client attribuées à un clickId précis.",
        rateLimit: FR_RATE_LIMIT_DEFAULT,
        headers: {
          Authorization: "Jeton Bearer contenant votre clé API.",
          "Content-Type": "Doit être défini sur application/json.",
        },
        bodyParams: {
          eventName:
            "Nom de l'événement de conversion (ex. purchase, subscription, upsell).",
          amount: "Montant décimal du revenu encaissé sur la transaction.",
          currency:
            "Code devise ISO 4217 à trois lettres en majuscules (USD, EUR, GBP, CAD, JPY).",
          clickId:
            "Jeton clickId d'origine transmis par la redirection du lien court.",
          linkId:
            "Identifiant ou alias slug du lien court si le clickId n'est pas disponible.",
          orderId:
            "Votre identifiant interne de transaction ou de facture pour garantir la déduplication.",
          customer: "Métadonnées du client.",
          "customer.email":
            "Adresse e-mail du client pour l'attribution de la valeur vie client (LTV).",
          "customer.name": "Nom complet du client.",
          "customer.avatarUrl":
            "URL de l'image d'avatar affichée dans les tableaux de bord de télémétrie.",
          customerAvatar:
            "Alias de premier niveau pour l'URL de l'avatar client (Gravatar, Google, Discord, GitHub).",
          metadata:
            "Métadonnées JSON clé-valeur libres pour vos rapports personnalisés en aval.",
        },
        responses: [
          "Conversion enregistrée avec succès et métriques financières mises à jour en temps réel.",
        ],
        errorCodes: {
          INVALID_AMOUNT:
            "Le paramètre amount doit être un nombre décimal positif.",
          INVALID_CURRENCY:
            "La devise doit être un code ISO 4217 valide de 3 lettres en majuscules (ex. USD, EUR, GBP).",
          UNAUTHORIZED: "Clé API Bearer manquante ou invalide.",
          CLICK_OR_LINK_NOT_FOUND:
            "Ni clickId ni linkId ne correspond à un enregistrement actif.",
          DUPLICATE_ORDER_ID:
            "Une conversion avec cet orderId a déjà été enregistrée (protection d'idempotence).",
        },
      },
      {
        name: "Traiter un remboursement ou une rétrofacturation",
        description:
          "Déduit un montant de remboursement total ou partiel du revenu cumulé du lien, en réajustant atomiquement l'EPC et l'AOV.",
        rateLimit: FR_RATE_LIMIT_DEFAULT,
        bodyParams: {
          orderId:
            "L'orderId d'origine transmis lors de l'enregistrement de la conversion.",
          amount: "Montant monétaire remboursé.",
          currency:
            "Code devise (par défaut la devise de la commande initiale).",
          reason:
            "Motif du remboursement (ex. customer_return, fraud, cancelled).",
          refundId:
            "Identifiant de remboursement de votre prestataire de paiement.",
        },
        responses: [
          "Remboursement appliqué et métriques de revenus ajustées.",
        ],
      },
      {
        name: "Récupérer la télémétrie financière & les revenus",
        description:
          "Récupère le total des revenus monétaires, le nombre de conversions, le panier moyen (AOV) et le gain par clic (EPC) pour un lien court.",
        rateLimit: FR_RATE_LIMIT_DEFAULT,
        pathParams: {
          slug: "Alias slug du lien court.",
        },
        queryParams: {
          period: "Fenêtre temporelle des métriques financières.",
          currency: "Devise cible souhaitée pour l'affichage converti.",
        },
        responses: ["Charge utile complète de télémétrie financière."],
      },
    ],
    responseSample: {
      title: "Exemple complet de charge utile de conversion & finance",
      description:
        "Réponse JSON structurée renvoyant les compteurs atomiques de visites, le cumul des revenus financiers, l'EPC et les transactions clients :",
    },
    bestPractices: [
      "Stockez toujours le clickId dans les métadonnées de paiement (ex. Stripe Session Metadata, Shopify Cart Note) afin que les webhooks asynchrones et leurs réessais ne perdent jamais l'attribution.",
      "Transmettez des montants décimaux numériques (ex. 49.00 et non 4900 centimes) accompagnés de codes devises ISO 4217 à 3 lettres en majuscules (USD, EUR, GBP).",
      "Abonnez-vous aux webhooks Stripe charge.refunded ou Shopify refunds/create pour appeler POST /api/v1/track/refund et conserver une comptabilité parfaitement exacte.",
      "Comparez directement votre EPC (Gain par Clic) à votre CPC (Coût par Clic) pour calculer automatiquement votre retour sur dépenses publicitaires (ROAS).",
    ],
  },

  "ab-testing-routing": {
    title: "API Routage par pourcentage & Tests A/B",
    subtitle:
      "Répartissez intelligemment le trafic de clics entre plusieurs variantes de pages de destination pour maximiser vos taux de conversion.",
    description:
      "Référence API REST pour configurer des tests A/B à l'Edge : pondération par pourcentage, télémétrie par variante et bascule instantanée.",
    readTime: "4 min de lecture",
    overview: [
      "Le routage par pourcentage (Tests A/B) oriente une proportion définie de votre trafic vers différentes variantes de pages (ex. 50 % vers la Variante A, 50 % vers la Variante B, ou 70 % / 15 % / 15 %).",
      "Les décisions de routage s'exécutent directement sur les serveurs Cloudflare Edge lors de la connexion réseau, sans aucun script côté client ni scintillement visuel (flicker).",
    ],
    keyPoints: [
      {
        title: "Distribution pondérée à l'Edge",
        description:
          "Définissez des poids personnalisés en pourcentage (somme = 100 %) entre l'URL principale et vos variantes A/B.",
      },
      {
        title: "Zéro scintillement (Zero Flicker)",
        description:
          "Le routage a lieu avant le chargement du HTML, supprimant tout décalage ou saut visuel pour les visiteurs.",
      },
      {
        title: "Analytique comparative des conversions",
        description:
          "Comparez les volumes de clics, taux de conversion et revenus générés par chaque variante directement dans votre tableau de bord.",
      },
    ],
    apiEndpoints: [
      {
        name: "Configurer le routage de test A/B",
        description:
          "Configure ou met à jour les pondérations de répartition du trafic entre plusieurs variantes de pages de destination.",
        rateLimit: FR_RATE_LIMIT_DEFAULT,
        pathParams: {
          id: "Slug ou identifiant du lien court.",
        },
        bodyParams: {
          mainWeight:
            "Pourcentage du trafic dirigé vers l'URL cible principale (de 0 à 100).",
          abVariations: "Tableau des configurations de variantes.",
          "abVariations[].id": "Clé unique identifiant la variante.",
          "abVariations[].targetUrl":
            "URL de destination associée à cette variante.",
          "abVariations[].weight":
            "Pourcentage de trafic alloué à cette variante.",
          "abVariations[].name":
            "Libellé lisible affiché pour la comparaison dans le tableau de bord.",
        },
        responses: ["Pondérations du test A/B mises à jour."],
      },
    ],
    codeSnippets: [
      {
        title: "1. Créer un test A/B via le SDK",
        description:
          "Associez vos variantes avec leurs pondérations respectives en pourcentage :",
      },
    ],
    responseSample: {
      title: "Structure d'un lien de test A/B",
      description:
        "Charge utile confirmant les poids de routage en pourcentage :",
    },
    bestPractices: [
      "Assurez-vous que la somme totale des poids soit exactement égale à 100 % (mainWeight + somme des poids des variantes = 100).",
      "Laissez tourner vos expériences jusqu'à atteindre un échantillon statistiquement significatif (au moins 500 à 1 000 clics par variante).",
      "Ne testez qu'une seule variable majeure par expérience (ex. le titre ou l'image principale) afin d'identifier clairement la cause des écarts.",
    ],
  },

  "social-sharing-opengraph": {
    title: "API Partage social & Open Graph dynamique",
    subtitle:
      "Personnalisez l'apparence de vos liens lorsqu'ils sont partagés sur WhatsApp, Twitter/X, LinkedIn, Telegram et Facebook.",
    description:
      "Guide API REST pour configurer des balises Open Graph personnalisées (og:title, og:description, og:image) et des Twitter Cards servies dynamiquement à l'Edge.",
    readTime: "3 min de lecture",
    overview: [
      "Lorsqu'un lien raccourci est partagé sur des messageries ou réseaux sociaux (WhatsApp, LinkedIn, Twitter/X, Discord, Slack), les robots d'indexation lisent les balises Open Graph pour afficher une carte d'aperçu enrichie.",
      "LShorter sert dynamiquement vos métadonnées Open Graph personnalisées à la volée depuis le réseau Cloudflare Edge, garantissant des aperçus instantanés et nets sur tous vos canaux de diffusion.",
    ],
    keyPoints: [
      {
        title: "Bannières et titres personnalisés",
        description:
          "Définissez des titres percutants, des descriptions adaptées et des visuels HD 1200x630px pour chaque campagne.",
      },
      {
        title: "Twitter Cards & Messageries instantanées",
        description:
          "Prise en charge native du format summary_large_image pour Twitter/X, WhatsApp et Telegram.",
      },
      {
        title: "Hébergement CDN haute vitesse",
        description:
          "Téléversez vos bannières directement sur notre CDN distribué mondialement avec mise en cache Edge.",
      },
    ],
    apiEndpoints: [
      {
        name: "Mettre à jour les métadonnées sociales Open Graph",
        description:
          "Met à jour le titre Open Graph, la description et la bannière d'aperçu destinés aux robots sociaux.",
        rateLimit: FR_RATE_LIMIT_DEFAULT,
        pathParams: {
          id: "Slug ou identifiant du lien court.",
        },
        bodyParams: {
          metaTitle: "Titre de la carte sociale (70 caractères maximum).",
          ogDescription:
            "Description de la carte sociale (200 caractères maximum).",
          ogImage:
            "URL directe de l'image au ratio 1.91:1 (recommandé : 1200x630px).",
          twitterCard: "Format de mise en page de la Twitter Card.",
        },
        responses: [
          "Métadonnées Open Graph mises à jour et mises en cache à l'Edge.",
        ],
      },
    ],
    codeSnippets: [
      {
        title: "1. Créer un lien avec métadonnées Open Graph",
        description:
          "Renseignez les propriétés metaTitle, ogDescription et ogImage lors de la création du lien :",
      },
    ],
    responseSample: {
      title: "Structure des métadonnées Open Graph",
      description:
        "Balises enrichies servies aux robots d'aperçu des réseaux sociaux :",
    },
    bestPractices: [
      "Utilisez des images de 1200 x 630 pixels au ratio 1.91:1 pour une netteté optimale sur Facebook, LinkedIn et Twitter/X.",
      "Gardez vos titres Open Graph sous la barre des 60 caractères pour éviter toute troncature sur les écrans mobiles.",
      "Validez vos aperçus avec les outils officiels (Twitter Card Validator, LinkedIn Post Inspector) avant publication.",
    ],
  },

  "path-lock": {
    title: "PathLock™ Navigation restreinte & Isolation de tunnel",
    subtitle:
      "Maintenez strictement vos visiteurs sur une page de destination ou un tunnel de vente précis, en empêchant l'exploration non autorisée d'autres répertoires grâce à un verrouillage Edge instantané.",
    description:
      "Éliminez les distractions, isolez vos tunnels de conversion et bloquez l'accès aux sous-chemins non autorisés grâce aux modes Strict et Funnel de PathLock™.",
    readTime: "4 min de lecture",
    overview: [
      "PathLock™ est une fonctionnalité exclusive PRO de sécurité et d'anti-distraction conçue pour les équipes marketing, éditeurs affiliés et architectes de tunnels de vente.",
      "Une fois activé, PathLock™ affiche la destination dans une visionneuse isolée et responsive équipée d'une barrière de sécurité Edge.",
      "Le mode Strict (Page unique) empêche les visiteurs d'explorer d'autres sections du site (par exemple parcourir tout le catalogue de la boutique alors qu'une seule page produit de validation a été partagée).",
      "Le mode Funnel & Sous-chemins autorise une progression fluide à travers des tunnels en plusieurs étapes (ex. /checkout, /confirmation, /upsell) tout en bloquant toute sortie hors du préfixe autorisé.",
    ],
    keyPoints: [
      {
        title: "Isolation stricte sur page unique",
        description:
          "Verrouille l'accès du visiteur strictement sur le chemin cible exact. Toute tentative de navigation externe déclenche immédiatement l'écran de blocage Gate.",
      },
      {
        title: "Périmètre Funnel & Sous-chemins",
        description:
          "Autorise toutes les routes enfants imbriquées (ex. /funnel/step-1, /funnel/checkout) tout en bloquant l'exploration du reste du domaine.",
      },
      {
        title: "Ancres & Paramètres de requête préservés",
        description:
          "Le défilement fluide interne (#features, #pricing) et les paramètres de suivi (UTM, jetons d'affiliation) restent 100 % opérationnels.",
      },
      {
        title: "Barre supérieure rétractable",
        description:
          "Offre aux visiteurs une expérience discrète grâce à une barre supérieure rétractable fluide et une pastille flottante de retour instantané.",
      },
    ],
    apiEndpoints: [
      {
        name: "Créer un lien avec PathLock™",
        description:
          "Crée un lien court configuré avec une isolation PathLock™ sur page unique ou sur tunnel de vente.",
        authentication: "Jeton Bearer requis",
        rateLimit: FR_RATE_LIMIT_DEFAULT,
        bodyParams: {
          pathLockMode:
            "Mode de restriction PathLock : 'off' | 'strict' | 'funnel'. (Forfait PRO)",
          pathLockPrefix:
            "Préfixe de chemin URL autorisé dans la liste blanche de navigation du visiteur.",
          pathLockMessage:
            "Message d'avis personnalisé affiché lorsque le visiteur déclenche la barrière de sécurité.",
        },
        responses: ["Lien court protégé par PathLock™ créé avec succès."],
      },
    ],
    codeSnippets: [
      {
        title: "1. Configurer le mode Funnel de PathLock™",
        description:
          "Autorisez tout un tunnel de commande tout en empêchant les visiteurs de sortir vers d'autres pages :",
      },
    ],
    responseSample: {
      title: "Charge utile d'un lien PathLock",
      description:
        "Configuration d'un lien avec isolation PathLock active :",
    },
    bestPractices: [
      "Utilisez le mode « Strict Single-Page » lorsque vous partagez une revue produit ponctuelle, un NDA ou une validation partenaire.",
      "Utilisez le mode « Funnel & Subpaths » avec un préfixe racine commun (ex. 'checkout' ou 'webinar') pour autoriser des parcours multi-étapes naturels.",
      "Rédigez un message de blocage courtois et contextualisé afin que vos visiteurs comprennent pourquoi la navigation vers le reste du site est restreinte.",
    ],
  },
};

function translateParameters(
  params: DocApiParameter[] | undefined,
  translations: Record<string, string> | undefined
): DocApiParameter[] | undefined {
  if (!params) return undefined;
  if (!translations) return params;
  return params.map((param) => ({
    ...param,
    description: translations[param.name] ?? param.description,
  }));
}

function applyFeatureTranslation(
  feature: DocFeature,
  tr: DocFeatureTranslation | undefined
): DocFeature {
  if (!tr) return feature;

  return {
    ...feature,
    title: tr.title,
    subtitle: tr.subtitle,
    description: tr.description,
    readTime: tr.readTime,
    overview: tr.overview,
    keyPoints: feature.keyPoints.map((kp, idx) => tr.keyPoints[idx] ?? kp),
    apiEndpoints: feature.apiEndpoints?.map((ep, idx) => {
      const epTr = tr.apiEndpoints?.[idx];
      if (!epTr) return ep;
      return {
        ...ep,
        name: epTr.name,
        description: epTr.description,
        authentication: epTr.authentication ?? ep.authentication,
        rateLimit: epTr.rateLimit ?? ep.rateLimit,
        headers: translateParameters(ep.headers, epTr.headers),
        pathParams: translateParameters(ep.pathParams, epTr.pathParams),
        queryParams: translateParameters(ep.queryParams, epTr.queryParams),
        bodyParams: translateParameters(ep.bodyParams, epTr.bodyParams),
        responses: ep.responses?.map((resp, rIdx) => ({
          ...resp,
          description: epTr.responses?.[rIdx] ?? resp.description,
        })),
        errorCodes: ep.errorCodes?.map((err) => ({
          ...err,
          description: epTr.errorCodes?.[err.code] ?? err.description,
        })),
      };
    }),
    codeSnippets: feature.codeSnippets.map((cs, idx) => {
      const csTr = tr.codeSnippets[idx];
      if (!csTr) return cs;
      return {
        ...cs,
        title: csTr.title,
        description: csTr.description,
      };
    }),
    responseSample:
      feature.responseSample && tr.responseSample
        ? {
            ...feature.responseSample,
            title: tr.responseSample.title,
            description: tr.responseSample.description,
          }
        : feature.responseSample,
    bestPractices: tr.bestPractices,
  };
}

const DOC_FEATURES_FR_MERGED: DocFeature[] = DOC_FEATURES.map((feature) =>
  applyFeatureTranslation(feature, DOC_FEATURES_FR[feature.slug])
);

export const DOCS_ARTICLES = DOC_FEATURES;

export function getAllDocFeatures(): DocFeature[] {
  return DOC_FEATURES;
}

export function getLocalizedDocs(locale: Locale = "en"): DocFeature[] {
  return locale === "fr" ? DOC_FEATURES_FR_MERGED : DOC_FEATURES;
}

const SLUG_ALIASES: Record<string, string> = {
  "edge-routing": "geo-routing",
  "developer-api": "sdk-quickstart",
  "api": "sdk-quickstart",
  "quickstart": "sdk-quickstart",
  "analytics-stream": "realtime-analytics",
  "bio-pages": "social-sharing-opengraph",
  "growth-marketing": "ab-testing-routing",
  "security": "pin-protection",
  "qr-codes": "dynamic-qr-codes",
  "destination-masking": "url-masking",
  "masking": "url-masking",
  "conversion-tracking": "conversion-tracking-amount-count",
};

export function getDocFeatureBySlug(slug: string): DocFeature | undefined {
  const resolvedSlug = SLUG_ALIASES[slug] || slug;
  return DOC_FEATURES.find((feature) => feature.slug === resolvedSlug);
}

export const getDocBySlug = getDocFeatureBySlug;

export function getLocalizedDocBySlug(
  slug: string,
  locale: Locale = "en"
): DocFeature | undefined {
  const resolvedSlug = SLUG_ALIASES[slug] || slug;
  const list = getLocalizedDocs(locale);
  return list.find((feature) => feature.slug === resolvedSlug);
}


