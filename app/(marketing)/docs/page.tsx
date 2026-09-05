"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Sparkles,
  Terminal,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  Layers,
  Lock,
  Globe2,
  Zap,
  KeyRound,
  BarChart3,
  Server,
  ChevronRight,
  Search,
  ExternalLink,
  Cpu,
  Split,
  Eye,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";

type Language = "curl" | "typescript" | "python" | "php" | "go";

interface EndpointDoc {
  id: string;
  category: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  title: string;
  desc: string;
  rateLimit: string;
  requestBody?: Record<string, any>;
  responseExample: Record<string, any>;
  snippets: Record<Language, string>;
}

const ENDPOINTS_DOCS: EndpointDoc[] = [
  // ─── 1. LINKS ─────────────────────────────────────────────────────────────
  {
    id: "create-link",
    category: "Liens & Redirections",
    method: "POST",
    path: "/api/v1/links",
    title: "Créer un lien court intelligent",
    desc: "Génère un lien raccourci avec ciblage géographique, appareils, protection par mot de passe, cloaking, tests A/B et bannière Open Graph.",
    rateLimit: "600 req/min (Illimité en PRO/BUSINESS)",
    requestBody: {
      targetUrl: "https://ma-boutique.com/produit-vedette",
      slug: "promo-ete-2026",
      domainName: "lsho.cc",
      routingRules: [
        {
          conditions: [{ type: "pays", operator: "est", value: "FR" }],
          destinationUrl: "https://ma-boutique.fr/promo",
        },
      ],
      geoTargeting: {
        US: "https://ma-boutique.com/us-deal",
        CA: "https://ma-boutique.ca",
      },
      deviceTargeting: {
        ios: "https://apps.apple.com/app/id123456",
        android: "https://play.google.com/store/apps/details?id=com.app",
      },
      abVariations: [
        { url: "https://ma-boutique.com/landing-b", weight: 50 },
      ],
      mainWeight: 50,
      isPasswordProtected: false,
      isCloaked: false,
      passParams: true,
      ogTitle: "Offre Exclusive Été 2026",
      ogDescription: "Profitez de -40% sur toute la collection avec livraison offerte.",
      ogImage: "https://ma-boutique.com/images/banner.jpg",
      tags: ["marketing", "campagne-ete", "influenceurs"],
    },
    responseExample: {
      success: true,
      data: {
        id: "lnk_8f2a9b1c",
        slug: "promo-ete-2026",
        domain_name: "lsho.cc",
        short_url: "https://lsho.cc/promo-ete-2026",
        target_url: "https://ma-boutique.com/produit-vedette",
        clicks_count: 0,
        unique_clicks: 0,
        is_active: 1,
        created_at: "2026-09-03T18:30:00.000Z",
      },
    },
    snippets: {
      curl: `curl -X POST https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/links \\
  -H "Authorization: Bearer lsh_live_votre_cle_api" \\
  -H "Content-Type: application/json" \\
  -d '{
    "targetUrl": "https://ma-boutique.com/produit-vedette",
    "slug": "promo-ete-2026",
    "geoTargeting": { "FR": "https://ma-boutique.fr/promo" },
    "passParams": true
  }'`,
      typescript: `import { LShorter } from "@lshorter/sdk";

const lsh = new LShorter({ apiKey: "lsh_live_votre_cle_api" });

const link = await lsh.links.create({
  targetUrl: "https://ma-boutique.com/produit-vedette",
  slug: "promo-ete-2026",
  geoTargeting: { FR: "https://ma-boutique.fr/promo" },
  passParams: true,
  tags: ["ete-2026"]
});

console.log("Lien créé :", link.shortUrl);`,
      python: `import requests

url = "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/links"
headers = {
    "Authorization": "Bearer lsh_live_votre_cle_api",
    "Content-Type": "application/json"
}
payload = {
    "targetUrl": "https://ma-boutique.com/produit-vedette",
    "slug": "promo-ete-2026",
    "passParams": True
}

res = requests.post(url, json=payload, headers=headers)
print(res.json())`,
      php: `<?php
$ch = curl_init("https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/links");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer lsh_live_votre_cle_api",
    "Content-Type: application/json"
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "targetUrl" => "https://ma-boutique.com/produit-vedette",
    "slug" => "promo-ete-2026"
  ])
]);
$response = curl_exec($ch);
curl_close($ch);
print_r(json_decode($response, true));`,
      go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload, _ := json.Marshal(map[string]interface{}{
		"targetUrl": "https://ma-boutique.com/produit-vedette",
		"slug":      "promo-ete-2026",
	})

	req, _ := http.NewRequest("POST", "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/links", bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer lsh_live_votre_cle_api")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println("Status:", resp.Status)
}`,
    },
  },
  {
    id: "list-links",
    category: "Liens & Redirections",
    method: "GET",
    path: "/api/v1/links",
    title: "Lister les liens courts",
    desc: "Récupère la liste complète de vos liens avec compteurs de clics, tags et métadonnées.",
    rateLimit: "1 200 req/min",
    responseExample: {
      success: true,
      data: [
        {
          id: "lnk_8f2a9b1c",
          slug: "promo-ete-2026",
          short_url: "https://lsho.cc/promo-ete-2026",
          target_url: "https://ma-boutique.com/produit-vedette",
          clicks_count: 1420,
          unique_clicks: 1180,
          created_at: "2026-09-03T18:30:00.000Z",
        },
      ],
    },
    snippets: {
      curl: `curl -X GET "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/links" \\
  -H "Authorization: Bearer lsh_live_votre_cle_api"`,
      typescript: `import { LShorter } from "@lshorter/sdk";

const lsh = new LShorter({ apiKey: "lsh_live_votre_cle_api" });
const links = await lsh.links.list();
console.log("Total liens :", links.length);`,
      python: `import requests

res = requests.get(
    "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/links",
    headers={"Authorization": "Bearer lsh_live_votre_cle_api"}
)
print(res.json())`,
      php: `<?php
$ch = curl_init("https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/links");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer lsh_live_votre_cle_api"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);
print_r(json_decode($res, true));`,
      go: `package main

import (
	"fmt"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/links", nil)
	req.Header.Set("Authorization", "Bearer lsh_live_votre_cle_api")
	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println("Status:", resp.Status)
}`,
    },
  },

  // ─── 2. ANALYTICS ─────────────────────────────────────────────────────────
  {
    id: "get-analytics",
    category: "Analytics & Tracking",
    method: "GET",
    path: "/api/v1/analytics",
    title: "Obtenir les analytics de trafic",
    desc: "Retourne les statistiques complètes de clics, top pays géolocalisés, villes, appareils, navigateurs et flux en direct.",
    rateLimit: "600 req/min",
    responseExample: {
      success: true,
      data: {
        total_clicks: 25480,
        unique_clicks: 19850,
        clicks_growth: 14.5,
        top_countries: [
          { code: "FR", name: "France", count: 12400, percentage: 48 },
          { code: "BF", name: "Burkina Faso", count: 6800, percentage: 26 },
        ],
        top_devices: [
          { device: "Mobile", count: 16500, percentage: 65 },
          { device: "Desktop", count: 8980, percentage: 35 },
        ],
      },
    },
    snippets: {
      curl: `curl -X GET "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/analytics?period=30d" \\
  -H "Authorization: Bearer lsh_live_votre_cle_api"`,
      typescript: `import { LShorter } from "@lshorter/sdk";

const lsh = new LShorter({ apiKey: "lsh_live_votre_cle_api" });
const stats = await lsh.analytics.get({ period: "30d" });
console.log("Clics 30j :", stats.total_clicks);`,
      python: `import requests

res = requests.get(
    "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/analytics?period=30d",
    headers={"Authorization": "Bearer lsh_live_votre_cle_api"}
)
print(res.json()["data"])`,
      php: `<?php
$ch = curl_init("https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/analytics?period=30d");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer lsh_live_votre_cle_api"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);
print_r(json_decode($res, true));`,
      go: `package main

import (
	"fmt"
	"net/http"
)

func main() {
	req, _ := http.NewRequest("GET", "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/analytics?period=30d", nil)
	req.Header.Set("Authorization", "Bearer lsh_live_votre_cle_api")
	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println("Status:", resp.Status)
}`,
    },
  },

  // ─── 3. DOMAINS ───────────────────────────────────────────────────────────
  {
    id: "add-domain",
    category: "Domaines Personnalisés",
    method: "POST",
    path: "/api/v1/domains",
    title: "Connecter un domaine personnalisé",
    desc: "Déclare un nom de domaine ou sous-domaine en marque blanche et génère automatiquement les enregistrements DNS CNAME et TXT pour la délivrance du certificat SSL.",
    rateLimit: "100 req/min",
    requestBody: {
      domain: "go.mon-entreprise.com",
    },
    responseExample: {
      success: true,
      data: {
        id: "dom_9c4e2a",
        domain_name: "go.mon-entreprise.com",
        status: "pending",
        dnsRecords: [
          {
            type: "CNAME",
            name: "go.mon-entreprise.com",
            value: "lsho.cc",
            ttl: 3600,
            note: "Pointe votre domaine vers l'infrastructure Edge Cloudflare",
          },
          {
            type: "TXT",
            name: "_lshorter-verify.go.mon-entreprise.com",
            value: "lshorter-verify=dom_9c4e2a",
            ttl: 3600,
            note: "Vérification de propriété",
          },
        ],
      },
    },
    snippets: {
      curl: `curl -X POST https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/domains \\
  -H "Authorization: Bearer lsh_live_votre_cle_api" \\
  -H "Content-Type: application/json" \\
  -d '{ "domain": "go.mon-entreprise.com" }'`,
      typescript: `import { LShorter } from "@lshorter/sdk";

const lsh = new LShorter({ apiKey: "lsh_live_votre_cle_api" });
const domain = await lsh.domains.add({ domain: "go.mon-entreprise.com" });
console.log("DNS requis :", domain.dnsRecords);`,
      python: `import requests

res = requests.post(
    "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/domains",
    headers={"Authorization": "Bearer lsh_live_votre_cle_api"},
    json={"domain": "go.mon-entreprise.com"}
)
print(res.json())`,
      php: `<?php
$ch = curl_init("https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/domains");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer lsh_live_votre_cle_api",
    "Content-Type: application/json"
  ],
  CURLOPT_POSTFIELDS => json_encode(["domain" => "go.mon-entreprise.com"])
]);
$res = curl_exec($ch);
curl_close($ch);
print_r(json_decode($res, true));`,
      go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload, _ := json.Marshal(map[string]string{"domain": "go.mon-entreprise.com"})
	req, _ := http.NewRequest("POST", "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/domains", bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer lsh_live_votre_cle_api")
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println("Status:", resp.Status)
}`,
    },
  },

  // ─── 4. SOCIAL BANNERS ────────────────────────────────────────────────────
  {
    id: "upload-image",
    category: "Bannières & Open Graph",
    method: "POST",
    path: "/api/v1/upload-image",
    title: "Upload d'image pour aperçu social",
    desc: "Téléverse une image d'aperçu pour les cartes Twitter et Open Graph (Facebook, WhatsApp, LinkedIn, Discord).",
    rateLimit: "120 req/min",
    requestBody: {
      data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    },
    responseExample: {
      success: true,
      url: "https://lshorter-api.fiatechnologiecam.workers.dev/cdn/banner_img_9918.png",
    },
    snippets: {
      curl: `curl -X POST https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/upload-image \\
  -H "Authorization: Bearer lsh_live_votre_cle_api" \\
  -H "Content-Type: application/json" \\
  -d '{ "data": "data:image/png;base64,..." }'`,
      typescript: `import { LShorter } from "@lshorter/sdk";

const lsh = new LShorter({ apiKey: "lsh_live_votre_cle_api" });
const upload = await lsh.media.upload({ base64: "data:image/png;base64,..." });
console.log("URL CDN :", upload.url);`,
      python: `import requests

res = requests.post(
    "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/upload-image",
    headers={"Authorization": "Bearer lsh_live_votre_cle_api"},
    json={"data": "data:image/png;base64,..."}
)
print(res.json()["url"])`,
      php: `<?php
$ch = curl_init("https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/upload-image");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer lsh_live_votre_cle_api",
    "Content-Type: application/json"
  ],
  CURLOPT_POSTFIELDS => json_encode(["data" => "data:image/png;base64,..."])
]);
$res = curl_exec($ch);
curl_close($ch);
print_r(json_decode($res, true));`,
      go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload, _ := json.Marshal(map[string]string{"data": "data:image/png;base64,..."})
	req, _ := http.NewRequest("POST", "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/upload-image", bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer lsh_live_votre_cle_api")
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println("Status:", resp.Status)
}`,
    },
  },

  // ─── 5. WEBHOOKS & AUTOMATISATIONS ───────────────────────────────────────
  {
    id: "webhooks-guide",
    category: "Webhooks & Automatisations",
    method: "POST",
    path: "/api/v1/webhooks",
    title: "Enregistrer un Webhook (Événements Temps Réel)",
    desc: "Déclenche une requête HTTP POST instantanée vers votre serveur, Zapier, Make, n8n ou Slack à chaque clic sur vos liens. Permet de synchroniser votre CRM ou déclencher des automatisations.",
    rateLimit: "100 req/min",
    requestBody: {
      url: "https://votre-serveur.com/api/webhooks/lshorter",
      events: ["link.clicked", "link.created"],
      secret: "whsec_mon_secret_hache_sha256",
      name: "Sync CRM HubSpot & Slack Alerts",
    },
    responseExample: {
      event: "link.clicked",
      timestamp: "2026-09-05T08:30:00.000Z",
      signature: "t=1788597200,v1=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      data: {
        linkId: "lnk_8f2a9b1c",
        slug: "promo-ete-2026",
        shortUrl: "https://lsho.cc/promo-ete-2026",
        targetUrl: "https://ma-boutique.com/produit-vedette",
        visitor: {
          ipCountry: "FR",
          ipCity: "Paris",
          device: "Mobile",
          os: "iOS 18",
          browser: "Safari",
          referrer: "https://instagram.com/",
        },
      },
    },
    snippets: {
      curl: `curl -X POST https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/webhooks \\
  -H "Authorization: Bearer lsh_live_votre_cle_api" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://votre-serveur.com/api/webhooks/lshorter",
    "events": ["link.clicked"],
    "secret": "whsec_mon_secret"
  }'`,
      typescript: `import { LShorter } from "@lshorter/sdk";

const lsh = new LShorter({ apiKey: "lsh_live_votre_cle_api" });

const webhook = await lsh.webhooks.create({
  url: "https://votre-serveur.com/api/webhooks/lshorter",
  events: ["link.clicked"],
  secret: "whsec_secret_key"
});

console.log("Webhook actif :", webhook.id);`,
      python: `import requests

res = requests.post(
    "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/webhooks",
    headers={"Authorization": "Bearer lsh_live_votre_cle_api"},
    json={
        "url": "https://votre-serveur.com/api/webhooks/lshorter",
        "events": ["link.clicked"],
        "secret": "whsec_secret_key"
    }
)
print(res.json())`,
      php: `<?php
$ch = curl_init("https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/webhooks");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer lsh_live_votre_cle_api",
    "Content-Type: application/json"
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "url" => "https://votre-serveur.com/api/webhooks/lshorter",
    "events" => ["link.clicked"],
    "secret" => "whsec_secret_key"
  ])
]);
$res = curl_exec($ch);
curl_close($ch);
print_r(json_decode($res, true));`,
      go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload, _ := json.Marshal(map[string]interface{}{
		"url":    "https://votre-serveur.com/api/webhooks/lshorter",
		"events": []string{"link.clicked"},
		"secret": "whsec_secret_key",
	})
	req, _ := http.NewRequest("POST", "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/webhooks", bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer lsh_live_votre_cle_api")
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println("Status:", resp.Status)
}`,
    },
  },

  // ─── 6. PIXELS RETARGETING ────────────────────────────────────────────────
  {
    id: "pixels-guide",
    category: "Pixels & Retargeting",
    method: "POST",
    path: "/api/v1/pixels",
    title: "Associer un Pixel de Retargeting Publicitaire",
    desc: "Injecte vos balises Meta (Facebook/Instagram), Google Ads / GA4, TikTok Ads et LinkedIn Insight Tag sur vos redirections de liens courts, vous permettant de recibler des prospects même s'ils visitent des sites tiers (Amazon, YouTube, presse, etc.).",
    rateLimit: "100 req/min",
    requestBody: {
      platform: "facebook",
      pixelId: "987654321098765",
      name: "Meta Ads Pixel Principal",
    },
    responseExample: {
      success: true,
      data: {
        id: "px_3b8a1c9e",
        platform: "facebook",
        pixelId: "987654321098765",
        name: "Meta Ads Pixel Principal",
        isActive: true,
        created_at: "2026-09-05T08:30:00.000Z",
      },
    },
    snippets: {
      curl: `curl -X POST https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/pixels \\
  -H "Authorization: Bearer lsh_live_votre_cle_api" \\
  -H "Content-Type: application/json" \\
  -d '{
    "platform": "facebook",
    "pixelId": "987654321098765",
    "name": "Pixel Facebook Ads"
  }'`,
      typescript: `import { LShorter } from "@lshorter/sdk";

const lsh = new LShorter({ apiKey: "lsh_live_votre_cle_api" });

const pixel = await lsh.pixels.create({
  platform: "facebook",
  pixelId: "987654321098765",
  name: "Pixel Facebook Ads"
});

console.log("Pixel connecté :", pixel.id);`,
      python: `import requests

res = requests.post(
    "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/pixels",
    headers={"Authorization": "Bearer lsh_live_votre_cle_api"},
    json={
        "platform": "facebook",
        "pixelId": "987654321098765",
        "name": "Pixel Facebook Ads"
    }
)
print(res.json())`,
      php: `<?php
$ch = curl_init("https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/pixels");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer lsh_live_votre_cle_api",
    "Content-Type: application/json"
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "platform" => "facebook",
    "pixelId" => "987654321098765",
    "name" => "Pixel Facebook Ads"
  ])
]);
$res = curl_exec($ch);
curl_close($ch);
print_r(json_decode($res, true));`,
      go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload, _ := json.Marshal(map[string]string{
		"platform": "facebook",
		"pixelId":  "987654321098765",
		"name":     "Pixel Facebook Ads",
	})
	req, _ := http.NewRequest("POST", "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/pixels", bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer lsh_live_votre_cle_api")
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println("Status:", resp.Status)
}`,
    },
  },
];

export default function DocsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("curl");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  const categories = [
    "ALL",
    "Liens & Redirections",
    "Analytics & Tracking",
    "Domaines Personnalisés",
    "Webhooks & Automatisations",
    "Pixels & Retargeting",
    "Bannières & Open Graph",
  ];

  const filteredEndpoints = ENDPOINTS_DOCS.filter((ep) => {
    const matchCategory = selectedCategory === "ALL" || ep.category === selectedCategory;
    const matchSearch =
      ep.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ep.path.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ep.desc.toLowerCase().includes(searchFilter.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  return (
    <div className="py-12 px-6 lg:px-12 max-w-6xl mx-auto flex flex-col gap-10 animate-in fade-in">
      {/* Hero Developer Header */}
      <div className="p-8 sm:p-10 rounded-[10px] bg-[#141416] border border-[#ff6600]/40 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="flex flex-col gap-3 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6600]/15 border border-[#ff6600]/30 text-xs font-bold text-[#ff6600] w-fit">
            <Cpu className="w-3.5 h-3.5" />
            <span>DOCUMENTATION OFFICIELLE API & SDK (v1)</span>
          </div>
          <h1 className="font-bebas text-3xl sm:text-5xl text-white tracking-wide leading-tight">
            INFRASTRUCTURE EDGE & API REST POUR DÉVELOPPEURS
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Raccourcissez vos URLs, appliquez du ciblage géographique/appareils et collectez des analytics en temps réel via notre API REST ultra-rapide propulsée par Cloudflare Workers (<strong className="text-white">&lt; 1 ms</strong> de latence).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 z-10 shrink-0 w-full md:w-auto">
          <Link href="/dashboard/api-sdk" className="w-full sm:w-auto">
            <Button variant="glow" className="w-full sm:w-auto font-bebas text-xl px-6 py-3 tracking-wide gap-2">
              <KeyRound className="w-4 h-4" />
              <span>GÉNÉRER UNE CLÉ API</span>
            </Button>
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] hover:border-neutral-500 text-xs font-bold text-white transition-colors"
          >
            <Code2 className="w-4 h-4 text-[#ff6600]" />
            <span>GitHub SDK</span>
          </a>
        </div>
      </div>

      {/* Quick Start SDK Box */}
      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-[#ff6600]" />
            <h2 className="text-lg font-bold text-white">Démarrage Rapide (Quickstart)</h2>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            v1.0.4 Prêt
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col gap-2">
            <span className="text-xs font-bold text-[#ff6600] font-mono">1. AUTHENTIFICATION</span>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Toutes les requêtes API nécessitent un en-tête HTTP <code className="text-white font-mono bg-black/40 px-1.5 py-0.5 rounded">Authorization: Bearer lsh_live_...</code>.
            </p>
          </div>

          <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col gap-2">
            <span className="text-xs font-bold text-sky-400 font-mono">2. BASE URL EDGE</span>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Point d&apos;entrée direct mondial : <code className="text-white font-mono bg-black/40 px-1.5 py-0.5 rounded text-[11px]">https://lshorter-api.fiatechnologiecam.workers.dev</code>
            </p>
          </div>

          <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col gap-2">
            <span className="text-xs font-bold text-purple-400 font-mono">3. FORMATS & JSON</span>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Toutes les requêtes et réponses utilisent exclusivement le format <code className="text-white font-mono bg-black/40 px-1.5 py-0.5 rounded">application/json</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Language Switcher & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-[10px] bg-[#141416] border border-[#222225] sticky top-4 z-20 shadow-2xl backdrop-blur-md">
        {/* Language Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(["curl", "typescript", "python", "php", "go"] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setSelectedLanguage(lang)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                selectedLanguage === lang
                  ? "bg-[#ff6600] text-white shadow-md shadow-[#ff6600]/25"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Rechercher route, méthode, paramètre..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#ff6600]"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? "bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/40 font-bold"
                : "bg-[#141416] text-neutral-400 border border-[#27272a] hover:text-white"
            }`}
          >
            {cat === "ALL" ? "Tous les Endpoints" : cat}
          </button>
        ))}
      </div>

      {/* Endpoints Detailed Cards List */}
      <div className="flex flex-col gap-8">
        {filteredEndpoints.map((ep) => {
          const activeSnippet = ep.snippets[selectedLanguage];
          const isCopied = copiedSnippetId === ep.id;

          return (
            <div
              key={ep.id}
              id={ep.id}
              className="rounded-[10px] bg-[#141416] border border-[#222225] p-6 sm:p-8 flex flex-col gap-6 shadow-2xl hover:border-neutral-700 transition-colors"
            >
              {/* Header Endpoint Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#222225]">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-[10px] text-xs font-mono font-extrabold ${
                      ep.method === "POST"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : ep.method === "GET"
                        ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                        : ep.method === "PATCH"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : "bg-red-500/15 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-white text-sm sm:text-base font-bold">{ep.path}</span>
                </div>

                <span className="text-[11px] font-mono text-neutral-400 bg-[#1a1a1e] px-2.5 py-1 rounded-[10px] border border-[#27272a] shrink-0">
                  Rate Limit : {ep.rateLimit}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-1">{ep.title}</h3>
                <p className="text-xs text-neutral-300 leading-relaxed">{ep.desc}</p>
              </div>

              {/* Code Snippet Box with Language Label & Copy */}
              <CodeBlock
                code={activeSnippet}
                language={selectedLanguage}
                filename={`Exemple ${selectedLanguage.toUpperCase()}`}
              />

              {/* Request & Response Schema Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
                {ep.requestBody && (
                  <div className="space-y-1.5">
                    <span className="text-neutral-400 font-bold block font-sans">Corps de Requête (JSON Body) :</span>
                    <CodeBlock
                      code={JSON.stringify(ep.requestBody, null, 2)}
                      language="json"
                      filename="request.json"
                      showLineNumbers={false}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <span className="text-emerald-400 font-bold block font-sans">Réponse HTTP 200 / 201 (JSON) :</span>
                  <CodeBlock
                    code={JSON.stringify(ep.responseExample, null, 2)}
                    language="json"
                    filename="response.json"
                    showLineNumbers={false}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* HTTP Error Codes Reference */}
      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-6 sm:p-8 flex flex-col gap-4 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Codes de Réponses & Erreurs HTTP Standard</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead>
              <tr className="border-b border-[#27272a] text-neutral-500 uppercase font-mono text-[10px]">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Signification</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222228]">
              <tr>
                <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">200 OK / 201 Created</td>
                <td className="py-2.5 px-3 font-semibold text-white">Succès</td>
                <td className="py-2.5 px-3 text-neutral-400">La requête a été exécutée et traitée sans erreur.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">400 Bad Request</td>
                <td className="py-2.5 px-3 font-semibold text-white">Paramètres Invalides</td>
                <td className="py-2.5 px-3 text-neutral-400">URL cible manquante, format d&apos;URL malformé ou slug non conforme.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-red-400 font-bold">401 Unauthorized</td>
                <td className="py-2.5 px-3 font-semibold text-white">Clé API Invalide</td>
                <td className="py-2.5 px-3 text-neutral-400">Clé API manquante dans l&apos;en-tête Authorization ou clé révoquée.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-red-400 font-bold">403 Forbidden</td>
                <td className="py-2.5 px-3 font-semibold text-white">Quota Dépassé</td>
                <td className="py-2.5 px-3 text-neutral-400">Limite de liens ou de domaines personnalisés atteinte pour votre forfait.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-purple-400 font-bold">429 Too Many Requests</td>
                <td className="py-2.5 px-3 font-semibold text-white">Rate Limit</td>
                <td className="py-2.5 px-3 text-neutral-400">Dépassement du débit autorisé par minute (temporairement bridé).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

