export interface FeatureDataItem {
  id: number;
  name: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  keyPoints: string[];
  image: string;
}

import React from "react";

export const featuresTimelineData = [
  {
    title: "Smart Routing",
    content: (
      <div className="mb-12">
        <div className="rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-6 shadow-sm">
          <p className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            Routage dynamique à la milliseconde (Edge)
          </p>
          <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal mb-6">
            Ne vous limitez plus à une destination statique. Définissez des règles intelligentes pour rediriger automatiquement vos utilisateurs selon leur pays, la langue de leur navigateur ou leur système d&apos;exploitation (iOS, Android, Desktop). Un lien unique suffit pour distribuer vos campagnes mondialement sans friction.
          </p>
          <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Géolocalisation précise (par pays et région)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Détection d&apos;appareil et redirection applicative (Deep Linking iOS/Android)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Exécution instantanée sur le réseau Cloudflare Edge</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "A/B Testing",
    content: (
      <div className="mb-12">
        <div className="rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-6 shadow-sm">
          <p className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            Split testing sans code
          </p>
          <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal mb-6">
            Répartissez automatiquement vos flux de clics entre plusieurs landing pages avec une pondération personnalisée (50/50, 70/30...). Identifiez la variante la plus performante, optimisez vos tunnels de vente et basculez 100 % du trafic sur l&apos;offre gagnante en un clic.
          </p>
          <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Distribution du trafic au pourcentage près</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Maintien de session (cookie persistant pour sécuriser le visiteur)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Mesure comparative directe du volume de clics</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Sécurité & Cloaking",
    content: (
      <div className="mb-12">
        <div className="rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-6 shadow-sm">
          <p className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            Liens blindés & expiration automatique
          </p>
          <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal mb-6">
            Gardez la mainmise sur vos partages confidentiels et vos tunnels de conversion. Verrouillez vos visiteurs sur une seule page ou un entonnoir spécifique grâce à <strong className="font-semibold text-zinc-900 dark:text-white">PathLock™ (Mode PRO)</strong>, sécurisez l&apos;accès par mot de passe PIN, programmez une date d&apos;expiration ou un quota maximal de clics, et masquez l&apos;entête HTTP Referer avec une barre supérieure rétractable.
          </p>
          <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span><strong className="text-zinc-800 dark:text-neutral-200">PathLock™ Isolation (PRO)</strong> : Mode Mono-Page strict ou Entonnoir avec détection et blocage Edge anti-dispersion</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Accès restreint par code secret PIN ou mot de passe</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Expiration programmée (par date ou seuil de clics maximal atteint)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Masquage de l&apos;URL finale (Iframe rétractable) et suppression du Referer HTTP</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Tracking & Analytics",
    content: (
      <div className="mb-12">
        <div className="rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-6 shadow-sm">
          <p className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            Télémétrie & attribution précise
          </p>
          <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal mb-6">
            Suivez vos performances en direct sans impacter la vitesse de chargement. Générez et conservez automatiquement vos paramètres UTM pour mesurer l&apos;attribution de vos campagnes, et visualisez les pays, référents et canaux sur un tableau de bord épuré.
          </p>
          <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Constructeur UTM intégré et transmission dynamique</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Métriques en direct (clics uniques, pays, canaux d&apos;acquisition)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Respect de la vie privée (conforme RGPD sans cookies intrusifs)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "QR Codes & Social OG",
    content: (
      <div className="mb-12">
        <div className="rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-6 shadow-sm">
          <p className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            Branding visuel & passerelle physique-digital
          </p>
          <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal mb-6">
            Ne laissez plus vos partages afficher un visuel cassé : personnalisez le titre, la description et l&apos;image Open Graph de vos liens pour optimiser le taux de clics. Générez simultanément des QR codes dynamiques prêts pour l&apos;impression, modifiables à distance.
          </p>
          <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Personnalisation complète des balises Open Graph et Twitter Cards</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>QR codes vectoriels dynamiques (SVG/PNG haute résolution)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Destination modifiable à distance sans réimprimer le support</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Paramètres Avancés",
    content: (
      <div className="mb-12">
        <div className="rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-6 shadow-sm">
          <p className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            Contrôle HTTP fin & domaines personnalisés
          </p>
          <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal mb-6">
            Ajustez le comportement exact de chaque redirection grâce au choix du code d&apos;état HTTP (301, 302, 307 ou 308). Transférez dynamiquement les query strings vers la cible, appliquez vos propres noms de domaine et connectez vos flux à des outils tiers.
          </p>
          <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Choix du code de redirection HTTP (301, 302, 307, 308)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Transfert automatique des paramètres d&apos;URL (Query String Forwarding)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Prise en charge des domaines et sous-domaines de marque personnalisés</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Pixels & Webhooks",
    content: (
      <div className="mb-12">
        <div className="rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-6 shadow-sm">
          <p className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            Marketing automation & synchronisation
          </p>
          <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal mb-6">
            Récupérez les visiteurs qui ne convertissent pas immédiatement en intégrant vos pixels publicitaires (Meta, Google, TikTok, LinkedIn) directement sur vos liens courts. Déclenchez instantanément des webhooks à chaque clic vers votre CRM ou vos outils no-code.
          </p>
          <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Injection invisible de pixels sans ralentir la navigation</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Webhooks instantanés sur chaque clic avec payload JSON complet</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Synchronisation native avec Zapier, Make, n8n ou vos backends internes</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "API & SDK",
    content: (
      <div className="mb-12">
        <div className="rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-6 shadow-sm">
          <p className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            SDK JavaScript & TypeScript natif
          </p>
          <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal mb-6">
            Conçu pour les développeurs. Automatisez la création de vos liens courts, configurez vos règles de routage dynamique et associez chaque conversion financière à un profil client précis pour mesurer le retour sur investissement réel de chaque lien dans vos applications.
          </p>
          <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Installation rapide en ligne de commande (npm install)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Tracking des revenus et enregistrement direct des transactions</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                <span className="text-neutral-400 dark:text-neutral-500 select-none">—</span>
                <span>Support TypeScript complet avec autocomplétion stricte</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
];
