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
  Tag,
  Smartphone,
  QrCode,
  Share2,
  Webhook,
  Target,
  Sliders,
  Calendar,
  Shield,
  HelpCircle,
  FileSpreadsheet,
  Network,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  MousePointerClick,
  Compass,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { Badge } from "@/components/ui/badge";

type MainTab = "features" | "api" | "security" | "faq";
type Language = "curl" | "typescript" | "python" | "php" | "go";

// ─── 1. USER FEATURE GUIDES DATA ─────────────────────────────────────────────
interface FeatureGuide {
  id: string;
  category: "links" | "routing" | "marketing" | "security" | "analytics";
  title: string;
  subtitle: string;
  badge: string;
  icon: any;
  whatIsIt: string;
  whyUseIt: string;
  howItWorks: string[];
  useCases: string[];
  proTip?: string;
}

const FEATURE_GUIDES: FeatureGuide[] = [
  {
    id: "smart-links",
    category: "links",
    title: "Raccourcissement Intelligent & Slugs Personnalisés",
    subtitle: "Créez des liens courts, mémorables et ultra-rapides (< 1 ms)",
    badge: "Essentiel",
    icon: Zap,
    whatIsIt: "Le raccourcissement de lien permet de transformer une URL longue, complexe ou truffée de paramètres en une adresse compacte et esthétique (ex: lsho.cc/promo-ete).",
    whyUseIt: "Les liens courts augmentent le taux de clic (CTR) jusqu'à +39% sur les réseaux sociaux, SMS et emails par rapport aux liens longs et encombrants.",
    howItWorks: [
      "1. Collez votre URL de destination longue (site, e-commerce, application, article).",
      "2. Choisissez un slug personnalisé (ex: 'guide-2026') ou laissez l'IA en générer un automatiquement.",
      "3. Sélectionnez le domaine par défaut (lsho.cc) ou l'un de vos domaines de marque personnalisés.",
      "4. Cliquez sur 'Créer le lien' : la redirection est immédiatement active sur plus de 300 datacenters Edge Cloudflare."
    ],
    useCases: [
      "Campagnes SMS Marketing (économie de caractères précieux).",
      "Biographies Instagram, TikTok, Twitter et LinkedIn.",
      "Supports imprimés, flyers, cartes de visite et emballages produits.",
      "Partage d'URLs avec paramètres de tracking UTM sans faire fuiter la structure interne."
    ],
    proTip: "Activez toujours 'Conserver les paramètres d'URL (passParams)' pour que vos tags Google Analytics et identifiants d'affiliation soient transmis automatiquement à la destination."
  },
  {
    id: "geo-targeting",
    category: "routing",
    title: "Ciblage Géographique Mondial (Geo-Routing)",
    subtitle: "Redirigez vos visiteurs selon leur pays ou continent en temps réel",
    badge: "PRO",
    icon: Globe2,
    whatIsIt: "Une technologie de détection IP à la milliseconde qui redirige automatiquement l'internaute vers la version locale de votre site ou boutique.",
    whyUseIt: "Évite de perdre des ventes internationales en accueillant chaque utilisateur dans sa devise, sa langue et avec les moyens de paiement de son pays.",
    howItWorks: [
      "1. Dans l'éditeur de lien, activez l'onglet 'Ciblage Géographique'.",
      "2. Ajoutez des règles par pays (ex: 'FR' -> ma-boutique.fr, 'US' -> ma-boutique.com/us, 'CA' -> ma-boutique.ca).",
      "3. Définissez l'URL par défaut pour tous les autres pays non spécifiés.",
      "4. Cloudflare détecte instantanément l'adresse IP et effectue la redirection sans aucun temps de chargement."
    ],
    useCases: [
      "Boutiques e-commerce Shopify / WooCommerce multi-devises.",
      "Programmes d'affiliation internationaux (Amazon FR, Amazon US, etc.).",
      "Offres promotionnelles exclusives réservées à certains territoires.",
      "Conformité réglementaire et pages légales adaptées par juridiction."
    ],
    proTip: "Combinez le ciblage géographique avec les paramètres UTM pour mesurer exactement quel pays génère le meilleur retour sur investissement (ROI)."
  },
  {
    id: "device-targeting",
    category: "routing",
    title: "Ciblage par Appareil & Système d'Exploitation",
    subtitle: "Acheminez les utilisateurs iOS, Android et Ordinateurs vers la bonne page",
    badge: "PRO",
    icon: Smartphone,
    whatIsIt: "Un moteur d'analyse du User-Agent qui identifie si le visiteur utilise un iPhone, un smartphone Android, un Mac ou un PC Windows.",
    whyUseIt: "Permet de distribuer un lien unique qui redirige directement vers l'App Store sur iOS, vers Google Play sur Android et vers votre site web sur PC.",
    howItWorks: [
      "1. Activez le 'Ciblage par Appareil' lors de la création ou édition de votre lien.",
      "2. Renseignez l'URL App Store pour iOS, l'URL Google Play pour Android et l'URL Desktop.",
      "3. Un seul lien suffit sur vos réseaux sociaux : vos utilisateurs sont redirigés vers l'application adéquate en un clic."
    ],
    useCases: [
      "Lancement et promotion d'applications mobiles (One-Link universel).",
      "Téléchargement de logiciels adaptés à l'OS (Mac DMG vs Windows EXE).",
      "Expériences web responsive optimisées pour tablettes ou smartphones."
    ],
    proTip: "Idéal pour vos campagnes de QR Codes sur packaging : les acheteurs scannent et arrivent directement sur la fiche de téléchargement de leur store."
  },
  {
    id: "ab-testing",
    category: "routing",
    title: "A/B Testing & Répartition Dynamique du Trafic",
    subtitle: "Divisez votre trafic entre plusieurs pages pour trouver la plus rentable",
    badge: "BUSINESS",
    icon: Split,
    whatIsIt: "Une fonctionnalité permettant de distribuer un flux de visiteurs entre deux ou plusieurs variantes d'une page selon des pourcentages prédéfinis (ex: 50% / 50%).",
    whyUseIt: "Testez différentes pages de vente, prix, designs ou argumentaires pour maximiser mathématiquement votre taux de conversion.",
    howItWorks: [
      "1. Activez l'option 'A/B Testing' sur votre lien court.",
      "2. Ajoutez vos URLs variantes (Variante A, Variante B, Variante C).",
      "3. Ajustez les curseurs de poids (ex: 70% vers la page A et 30% vers la page B).",
      "4. Suivez dans les Analytics quelle variante enregistre le plus de conversions et de clics."
    ],
    useCases: [
      "Test de deux pages de capture (Lead Magnet).",
      "Comparaison entre deux offres promotionnelles (-20% vs Livraison Offerte).",
      "Optimisation de pages de paiement (Checkout A vs Checkout B)."
    ]
  },
  {
    id: "retargeting-pixels",
    category: "marketing",
    title: "Pixels Publicitaires de Retargeting (Meta, Google, TikTok)",
    subtitle: "Reciblez vos prospects même lorsqu'ils visitent des sites tiers",
    badge: "BUSINESS",
    icon: Target,
    whatIsIt: "L'injection de balises de suivi publicitaire (Meta Pixel, Google Tag GA4, TikTok Ads, LinkedIn Tag) lors de la micro-seconde de redirection de votre lien court.",
    whyUseIt: "Le super-pouvoir de LShorter : Vous pouvez poser votre pixel même si vous redirigez vers Amazon, YouTube, un article de presse Forbes ou une boutique partenaire qui ne vous appartient pas !",
    howItWorks: [
      "1. Dans Paramètres > Pixels Retargeting, ajoutez votre ID Pixel (ex: Pixel ID Facebook ou ID Google Tag).",
      "2. Associez ce pixel à vos liens lors de leur création.",
      "3. Dès qu'un internaute clique sur votre lien, il est enregistré dans votre audience personnalisée sur Facebook Ads ou Google Ads.",
      "4. Vous pouvez ensuite lui diffuser des publicités ultra-ciblées à coût réduit."
    ],
    useCases: [
      "Affiliation Amazon / E-commerce : Créez des audiences de personnes intéressées par vos recommandations.",
      "Créateurs de contenu : Reciblez les spectateurs de vos vidéos YouTube sur Instagram.",
      "Reciblage multi-canal (Cross-platform Retargeting) à coût d'acquisition minimal."
    ],
    proTip: "Le reciblage publicitaire (retargeting) coûte en moyenne 3 à 5 fois moins cher qu'une campagne publicitaire 'à froid' !"
  },
  {
    id: "webhooks-automations",
    category: "marketing",
    title: "Webhooks & Automatisations en Temps Réel",
    subtitle: "Déclenchez des actions instantanées dans Zapier, Make, Slack ou vos serveurs",
    badge: "PRO",
    icon: Webhook,
    whatIsIt: "Un système de notification HTTP POST immédiat émis par nos serveurs vers votre système dès qu'un clic ou une conversion se produit sur vos liens.",
    whyUseIt: "Automatise vos flux de travail sans intervention manuelle : mettez à jour votre CRM, envoyez des alertes d'achat sur Slack ou loguez les clics dans Google Sheets.",
    howItWorks: [
      "1. Rendez-vous dans Paramètres > Webhooks.",
      "2. Renseignez l'URL de votre endpoint (ex: URL Webhook Zapier ou Make.com).",
      "3. Définissez une clé secrète pour vérifier l'authenticité des requêtes (signature HMAC-SHA256).",
      "4. Testez l'envoi en direct avec notre simulateur intégré : votre serveur reçoit le payload JSON instantanément."
    ],
    useCases: [
      "Enregistrement instantané des clics dans Airtable ou Google Sheets.",
      "Notification push sur Slack / Discord lorsqu'un lien VIP est cliqué.",
      "Calcul de commissions d'affiliation en temps réel dans votre base de données."
    ]
  },
  {
    id: "custom-domains",
    category: "links",
    title: "Domaines Personnalisés & Marque Blanche (SSL Automatique)",
    subtitle: "Utilisez votre propre nom de domaine pour renforcer votre crédibilité",
    badge: "PRO",
    icon: Network,
    whatIsIt: "La possibilité de connecter votre propre nom de domaine ou sous-domaine (ex: go.votre-marque.com ou link.votre-site.fr) au lieu d'utiliser le domaine partagé.",
    whyUseIt: "Renforce la confiance de vos clients, respecte votre charte graphique et protège votre délivrabilité email/SMS en éliminant tout intermédiaire visible.",
    howItWorks: [
      "1. Dans Paramètres > Domaines Personnalisés, saisissez votre nom de domaine ou sous-domaine.",
      "2. Ajoutez un enregistrement DNS CNAME pointant vers 'lsho.cc' chez votre hébergeur (OVH, Cloudflare, Namecheap, Hostinger).",
      "3. Ajoutez l'enregistrement DNS TXT de vérification fourni.",
      "4. Notre infrastructure délivre et renouvelle automatiquement un certificat SSL HTTPS gratuit."
    ],
    useCases: [
      "Grandes marques et entreprises souhaitant une expérience 100% marque blanche.",
      "Agences marketing gérant plusieurs domaines pour leurs clients.",
      "Newsletters professionnelles et communications institutionnelles."
    ]
  },
  {
    id: "open-graph-banners",
    category: "marketing",
    title: "Bannières Sociales & Open Graph Personnalisées (CDN Bunny.net)",
    subtitle: "Personnalisez l'image, le titre et la description lors du partage",
    badge: "Inclus",
    icon: Share2,
    whatIsIt: "Le contrôle absolu des balises Meta Open Graph (Facebook, WhatsApp, LinkedIn, Twitter Cards) affichées lors du partage d'un lien.",
    whyUseIt: "Une belle carte avec image HD et titre accrocheur génère jusqu'à 3 fois plus de clics sur les réseaux sociaux et applications de messagerie qu'un lien brut.",
    howItWorks: [
      "1. Lors de la création du lien, accédez à la section 'Bannière Réseaux Sociaux'.",
      "2. Renseignez un titre personnalisé et une description percutante.",
      "3. Téléversez votre image de couverture : elle est automatiquement compressée et hébergée sur notre CDN ultra-rapide Bunny.net.",
      "4. Partagez votre lien : l'aperçu s'affiche instantanément sur Twitter, Facebook, WhatsApp et Discord."
    ],
    useCases: [
      "Partage d'articles ou de vidéos avec une miniature sur-mesure.",
      "Campagnes de vente avec bandeau promotionnel '-50% Aujourd'hui'.",
      "Invitations à des événements, webinaires ou podcasts."
    ]
  },
  {
    id: "security-protection",
    category: "security",
    title: "Protection par Mot de Passe, Expiration & Cloaking",
    subtitle: "Sécurisez vos accès et protégez vos liens contre les abus",
    badge: "PRO",
    icon: Shield,
    whatIsIt: "Un ensemble de mécanismes de sécurité avancés pour verrouiller vos liens sensibles.",
    whyUseIt: "Permet de distribuer des documents confidentiels, de créer des offres à durée limitée ou de masquer l'URL de destination finale (Cloaking).",
    howItWorks: [
      "• Mot de passe : Le visiteur doit saisir un mot de passe défini par vous avant d'accéder au contenu.",
      "• Date d'expiration : Le lien cesse automatiquement de fonctionner à la date et heure choisies.",
      "• Limite de clics : Le lien se désactive dès qu'un nombre maximal de clics est atteint (ex: 100 premiers inscrits).",
      "• Cloaking d'URL : Masque l'URL réelle dans la barre d'adresse pour protéger vos liens d'affiliation."
    ],
    useCases: [
      "Partage de devis, maquettes ou contrats privés avec un client.",
      "Ventes flash 'Offre valable 24h' ou 'Limitée aux 50 premiers'.",
      "Accès à des contenus exclusifs pour membres premium."
    ]
  },
  {
    id: "qr-codes",
    category: "links",
    title: "Générateur de QR Codes Vectoriels & Dynamiques",
    subtitle: "Créez des QR codes HD prêts pour l'impression et les supports physiques",
    badge: "Inclus",
    icon: QrCode,
    whatIsIt: "La génération automatique d'un QR code haute définition pour chacun de vos liens courts.",
    whyUseIt: "Le QR code est dynamique : vous pouvez modifier la destination du lien court à tout moment dans votre tableau de bord sans jamais avoir à réimprimer vos supports !",
    howItWorks: [
      "1. Cliquez sur l'icône QR Code à côté de n'importe quel lien dans votre liste.",
      "2. Personnalisez les couleurs, le contraste et le logo au centre si souhaité.",
      "3. Téléchargez le QR code au format PNG haute résolution ou SVG vectoriel pour vos graphistes et imprimeurs."
    ],
    useCases: [
      "Menus de restaurants, flyers publicitaires et affiches de concert.",
      "Packaging produit et notices d'utilisation.",
      "Badges événementiels et stands de salon professionnel."
    ]
  },
  {
    id: "live-analytics",
    category: "analytics",
    title: "Analytics en Temps Réel, Attribution & Globe 3D",
    subtitle: "Visualisez chaque visiteur, pays, ville, appareil et taux de conversion",
    badge: "Inclus",
    icon: BarChart3,
    whatIsIt: "Un tableau de bord d'analytics de pointe alimenté par des logs Edge Cloudflare avec géolocalisation millimétrée.",
    whyUseIt: "Comprenez précisément d'où vient votre audience pour optimiser votre budget marketing et savoir quels canaux génèrent le plus de ventes.",
    howItWorks: [
      "1. Consultez les clics totaux, clics uniques, navigateurs, systèmes d'exploitation et villes.",
      "2. Visualisez vos flux de trafic en direct sur le Globe 3D interactif.",
      "3. Suivez vos campagnes UTM (Source, Medium, Campaign, Term, Content).",
      "4. Exportez toutes vos données en format Excel (.xls) ou CSV en un clic pour vos rapports clients."
    ],
    useCases: [
      "Mesure de la performance des campagnes d'influenceurs.",
      "Reporting mensuel pour agences marketing et clients.",
      "Audit géographique pour identifier de nouveaux marchés porteurs."
    ]
  }
];

// ─── 2. API ENDPOINTS DOCUMENTATION ──────────────────────────────────────────
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

// ─── 3. FAQ DATA ─────────────────────────────────────────────────────────────
interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: "Général",
    question: "Quelle est la vitesse de redirection de LShorter ?",
    answer: "Grâce à notre infrastructure Edge déployée sur plus de 300 datacenters Cloudflare mondiaux, la latence moyenne de redirection est inférieure à 1 milliseconde (< 1 ms), ce qui est instantané et imperceptible pour l'internaute."
  },
  {
    category: "Général",
    question: "Mes liens raccourcis expirent-ils un jour ?",
    answer: "Non, par défaut, tous vos liens raccourcis sont permanents et restent actifs à vie, à moins que vous ne décidiez explicitement de leur attribuer une date d'expiration ou une limite maximale de clics."
  },
  {
    category: "Affiliation & Tracking",
    question: "Mes paramètres d'affiliation (UTMs, ref, subid) sont-ils conservés lors de la redirection ?",
    answer: "Oui, à 100% ! En laissant cochée l'option 'Conserver les paramètres d'URL (passParams)', tous les paramètres GET (?ref=..., &utm_source=..., &affiliate_id=...) sont fidèlement transmis à l'URL finale sans aucune perte."
  },
  {
    category: "Domaines",
    question: "Combien de temps prend la propagation d'un domaine personnalisé ?",
    answer: "Dès l'ajout des enregistrements DNS CNAME et TXT chez votre hébergeur (OVH, Cloudflare, Namecheap, Hostinger), la vérification et l'émission du certificat SSL HTTPS prennent généralement entre 2 et 15 minutes."
  },
  {
    category: "Sécurité",
    question: "Comment sécuriser la réception de mes Webhooks ?",
    answer: "Chaque notification HTTP transmise par LShorter inclut un en-tête 'X-LShorter-Signature' calculé avec votre clé secrète en HMAC-SHA256. Il vous suffit de recalculer le hash côté serveur pour certifier que la requête provient bien de LShorter."
  },
  {
    category: "Forfaits",
    question: "Puis-je modifier la destination d'un lien après l'avoir imprimé sur un QR Code ?",
    answer: "Oui ! Tous les QR Codes générés par LShorter sont dynamiques. Vous pouvez modifier l'URL cible, les règles de ciblage pays ou les bannières à tout moment sans jamais réimprimer vos supports physiques."
  }
];

export default function DocsPage() {
  const [mainTab, setMainTab] = useState<MainTab>("features");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [featureCategory, setFeatureCategory] = useState<string>("ALL");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("curl");
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

  const filteredFeatures = FEATURE_GUIDES.filter((f) => {
    const matchCat = featureCategory === "ALL" || f.category === featureCategory;
    const matchSearch =
      f.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.subtitle.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.whatIsIt.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.whyUseIt.toLowerCase().includes(searchFilter.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredFaq = FAQ_ITEMS.filter((faq) => {
    return (
      faq.question.toLowerCase().includes(searchFilter.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchFilter.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto flex flex-col gap-10 animate-in fade-in">
      {/* ─── Hero Header ─── */}
      <div className="p-8 sm:p-10 rounded-[12px] bg-[#141416] border border-[#ff6600]/40 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="flex flex-col gap-3 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6600]/15 border border-[#ff6600]/30 text-xs font-bold text-[#ff6600] w-fit">
            <BookOpen className="w-3.5 h-3.5" />
            <span>CENTRE DE DOCUMENTATION & GUIDES OFFICIELS</span>
          </div>
          <h1 className="font-bebas text-3xl sm:text-5xl text-white tracking-wide leading-tight">
            GUIDE COMPLET DES FONCTIONNALITÉS & RÉFÉRENCE API
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Découvrez tout le potentiel de LShorter : raccourcissement intelligent, ciblage géographique &amp; appareils, pixels de retargeting, webhooks temps réel, domaines marque blanche et API Edge ultra-rapide (&lt; 1 ms).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 z-10 shrink-0 w-full md:w-auto">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="glow" className="w-full sm:w-auto font-bebas text-xl px-6 py-3 tracking-wide gap-2">
              <Sparkles className="w-4 h-4" />
              <span>TABLEAU DE BORD</span>
            </Button>
          </Link>
          <Link href="/dashboard/api-sdk" className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] hover:border-[#ff6600]/50 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-[#ff6600]" />
              <span>Clés API</span>
            </button>
          </Link>
        </div>
      </div>

      {/* ─── Main Tabs Navigation ─── */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-[12px] bg-[#141416] border border-[#222225] shadow-xl">
        <button
          type="button"
          onClick={() => setMainTab("features")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mainTab === "features"
              ? "bg-[#ff6600] text-white shadow-lg shadow-[#ff6600]/25"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Guide des Fonctionnalités</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("api")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mainTab === "api"
              ? "bg-[#ff6600] text-white shadow-lg shadow-[#ff6600]/25"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Documentation API REST &amp; SDK</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("security")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mainTab === "security"
              ? "bg-[#ff6600] text-white shadow-lg shadow-[#ff6600]/25"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Sécurité &amp; Infrastructure</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("faq")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mainTab === "faq"
              ? "bg-[#ff6600] text-white shadow-lg shadow-[#ff6600]/25"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>FAQ &amp; Dépannage</span>
        </button>
      </div>

      {/* ─── Search Bar ─── */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          placeholder="Rechercher une fonctionnalité, un paramètre, une route API, un cas d'usage..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-[12px] bg-[#141416] border border-[#27272a] text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#ff6600] shadow-xl"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: USER FEATURE GUIDES
      ═══════════════════════════════════════════════════════════════════════ */}
      {mainTab === "features" && (
        <div className="flex flex-col gap-8 animate-in fade-in">
          {/* Categories Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: "ALL", label: "Toutes les fonctionnalités" },
              { id: "links", label: "Liens & Domaines" },
              { id: "routing", label: "Routage & Ciblage" },
              { id: "marketing", label: "Marketing, Pixels & Webhooks" },
              { id: "security", label: "Sécurité & Protection" },
              { id: "analytics", label: "Analytics & Export" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFeatureCategory(cat.id)}
                className={`px-4 py-2 rounded-full font-semibold transition-all shrink-0 cursor-pointer ${
                  featureCategory === cat.id
                    ? "bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/40 font-bold shadow-md shadow-[#ff6600]/10"
                    : "bg-[#141416] text-neutral-400 border border-[#27272a] hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredFeatures.map((feat) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={feat.id}
                  id={feat.id}
                  className="rounded-[12px] bg-[#141416] border border-[#222225] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xl hover:border-neutral-700 transition-all group"
                >
                  <div className="flex flex-col gap-4">
                    {/* Header with Icon & Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-[#ff6600]/10 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600] group-hover:bg-[#ff6600] group-hover:text-white transition-colors">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                            {feat.title}
                          </h2>
                          <p className="text-xs text-neutral-400 mt-0.5">{feat.subtitle}</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          feat.badge === "BUSINESS"
                            ? "purple"
                            : feat.badge === "PRO"
                            ? "blue"
                            : "orange"
                        }
                        className="shrink-0"
                      >
                        {feat.badge}
                      </Badge>
                    </div>

                    {/* What is it & Why */}
                    <div className="space-y-2 pt-2 border-t border-[#222225]">
                      <div>
                        <span className="text-[11px] font-bold text-[#ff6600] uppercase tracking-wider block font-mono">
                          À quoi ça sert ?
                        </span>
                        <p className="text-xs text-neutral-300 leading-relaxed mt-0.5">
                          {feat.whatIsIt}
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block font-mono">
                          Bénéfice &amp; Impact
                        </span>
                        <p className="text-xs text-neutral-300 leading-relaxed mt-0.5">
                          {feat.whyUseIt}
                        </p>
                      </div>
                    </div>

                    {/* How it works */}
                    <div className="p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] space-y-1.5">
                      <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block font-mono">
                        Comment l'utiliser pas à pas :
                      </span>
                      <ul className="space-y-1 text-xs text-neutral-300">
                        {feat.howItWorks.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Use cases */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block font-mono">
                        Cas d'usage concrets :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {feat.useCases.map((uc, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-black/40 text-neutral-300 border border-white/5 px-2.5 py-1 rounded-[8px]"
                          >
                            • {uc}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Pro tip */}
                    {feat.proTip && (
                      <div className="p-3 rounded-[8px] bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-300 leading-relaxed">
                        <Lightbulb className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                        <span><strong>Astuce Pro :</strong> {feat.proTip}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: API REST & SDK REFERENCE
      ═══════════════════════════════════════════════════════════════════════ */}
      {mainTab === "api" && (
        <div className="flex flex-col gap-8 animate-in fade-in">
          {/* Quick Start SDK Box */}
          <div className="rounded-[12px] bg-[#141416] border border-[#222225] p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-[#ff6600]" />
                <h2 className="text-lg font-bold text-white">Démarrage Rapide API &amp; SDK (Quickstart)</h2>
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
                  Point d'entrée direct mondial : <code className="text-white font-mono bg-black/40 px-1.5 py-0.5 rounded text-[11px]">https://lshorter-api.fiatechnologiecam.workers.dev</code>
                </p>
              </div>

              <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col gap-2">
                <span className="text-xs font-bold text-purple-400 font-mono">3. FORMATS &amp; JSON</span>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Toutes les requêtes et réponses utilisent exclusivement le format standard <code className="text-white font-mono bg-black/40 px-1.5 py-0.5 rounded">application/json</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Language Switcher & Category Pills */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-[12px] bg-[#141416] border border-[#222225] sticky top-4 z-20 shadow-2xl backdrop-blur-md">
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

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full font-semibold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/40 font-bold"
                      : "bg-[#1a1a1e] text-neutral-400 border border-[#27272a] hover:text-white"
                  }`}
                >
                  {cat === "ALL" ? "Tous" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Endpoints Detailed Cards List */}
          <div className="flex flex-col gap-8">
            {filteredEndpoints.map((ep) => {
              const activeSnippet = ep.snippets[selectedLanguage];

              return (
                <div
                  key={ep.id}
                  id={ep.id}
                  className="rounded-[12px] bg-[#141416] border border-[#222225] p-6 sm:p-8 flex flex-col gap-6 shadow-2xl hover:border-neutral-700 transition-colors"
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
          <div className="rounded-[12px] bg-[#141416] border border-[#222225] p-6 sm:p-8 flex flex-col gap-4 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Codes de Réponses &amp; Erreurs HTTP Standard</span>
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
                    <td className="py-2.5 px-3 text-neutral-400">URL cible manquante, format d'URL malformé ou slug non conforme.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono text-red-400 font-bold">401 Unauthorized</td>
                    <td className="py-2.5 px-3 font-semibold text-white">Clé API Invalide</td>
                    <td className="py-2.5 px-3 text-neutral-400">Clé API manquante dans l'en-tête Authorization ou clé révoquée.</td>
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
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 3: SECURITY & INFRASTRUCTURE
      ═══════════════════════════════════════════════════════════════════════ */}
      {mainTab === "security" && (
        <div className="flex flex-col gap-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-[12px] bg-[#141416] border border-[#222225] space-y-3">
              <div className="w-9 h-9 rounded-[10px] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Conformité RGPD &amp; Protection de la Vie Privée</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                LShorter anonymise les adresses IP des visiteurs avant tout stockage analytique. Aucune donnée personnelle identifiable (PII) n'est vendue ni partagée avec des tiers. Nos systèmes respectent les normes strictes du RGPD et du CCPA.
              </p>
            </div>

            <div className="p-6 rounded-[12px] bg-[#141416] border border-[#222225] space-y-3">
              <div className="w-9 h-9 rounded-[10px] bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Réseau Edge Cloudflare &amp; Haute Disponibilité (99.99%)</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Vos liens courts sont répliqués en temps réel sur plus de 300 points de présence (PoP) Cloudflare mondiaux avec protection anti-DDoS automatique, mise en cache KV et basculement instantané.
              </p>
            </div>

            <div className="p-6 rounded-[12px] bg-[#141416] border border-[#222225] space-y-3">
              <div className="w-9 h-9 rounded-[10px] bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Chiffrement SSL / TLS 1.3 de Bout en Bout</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Toutes les redirections, endpoints API et domaines personnalisés bénéficient d'un certificat SSL Let's Encrypt / Cloudflare géré et renouvelé automatiquement sans aucune intervention de votre part.
              </p>
            </div>

            <div className="p-6 rounded-[12px] bg-[#141416] border border-[#222225] space-y-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#ff6600]/10 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600]">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Signature Cryptographique des Webhooks (HMAC-SHA256)</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Chaque requête Webhook est signée à la volée avec votre secret d'intégration via le header <code className="text-white font-mono bg-black/40 px-1 py-0.5 rounded">X-LShorter-Signature</code>, empêchant toute tentative de spoofing ou d'attaque par rejeu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 4: FAQ & TROUBLESHOOTING
      ═══════════════════════════════════════════════════════════════════════ */}
      {mainTab === "faq" && (
        <div className="flex flex-col gap-4 animate-in fade-in">
          {filteredFaq.map((item, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-[12px] bg-[#141416] border border-[#222225] hover:border-neutral-700 transition-colors flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-[6px] bg-[#ff6600]/15 text-[#ff6600] font-bold">
                  {item.category}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white">{item.question}</h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed pl-1">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
