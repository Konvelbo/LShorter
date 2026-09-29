"use client";

import React, { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// ─── COMPOSANT IMAGE : EFFET ROLLING GSAP (Identique à LandingNavbar) ───
function RollingTimelineImage({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const primaryImgRef = useRef<HTMLDivElement>(null);
  const cloneImgRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const primary = primaryImgRef.current;
      const clone = cloneImgRef.current;
      if (!primary || !clone) return;

      // Positionnement initial : clone au-dessus, primaire en place
      gsap.set(primary, { yPercent: 0 });
      gsap.set(clone, { yPercent: -100 });

      // Timeline en pause déclenchée au survol de l'image
      tlRef.current = gsap
        .timeline({ paused: true })
        .to(primary, { yPercent: 100, duration: 0.38, ease: "power2.inOut" }, 0)
        .to(clone, { yPercent: 0, duration: 0.38, ease: "power2.inOut" }, 0);
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => tlRef.current?.play()}
      onMouseLeave={() => tlRef.current?.reverse()}
      onPointerDown={() =>
        containerRef.current &&
        gsap.to(containerRef.current, {
          scale: 0.95,
          duration: 0.12,
          ease: "power1.out",
        })
      }
      onPointerUp={() =>
        containerRef.current &&
        gsap.to(containerRef.current, {
          scale: 1,
          duration: 0.18,
          ease: "power1.out",
        })
      }
      onPointerLeave={() => {
        tlRef.current?.reverse();
        if (containerRef.current) {
          gsap.to(containerRef.current, {
            scale: 1,
            duration: 0.18,
            ease: "power1.out",
          });
        }
      }}
      className="relative md:absolute md:right-6 md:top-6 md:bottom-6 md:w-[38%] w-full h-[220px] sm:h-[280px] md:h-auto mt-6 md:mt-0 rounded-[10px] overflow-hidden bg-[#F2ECE4] dark:bg-[#18181c] border border-[#E7DFD5] dark:border-[#222225] shrink-0 cursor-pointer select-none"
    >
      {/* 1. Image Primaire */}
      <div
        ref={primaryImgRef}
        className="absolute inset-0 w-full h-full will-change-transform"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          className="object-cover rounded-[10px]"
        />
      </div>

      {/* 2. Image Clone (défile depuis le haut) */}
      <div
        ref={cloneImgRef}
        className="absolute inset-0 w-full h-full will-change-transform"
      >
        <Image
          src={src}
          alt={`${alt} clone`}
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          className="object-cover rounded-[10px]"
        />
      </div>
    </div>
  );
}

// ─── DONNÉES DES 8 FONCTIONNALITÉS ───
export const featuresTimelineData = [
  {
    title: "Smart Routing",
    content: (
      <div className="mb-12">
        <div className="timeline-card-box relative overflow-hidden rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-5 sm:p-7 md:min-h-[420px] flex flex-col justify-between shadow-sm">
          <div className="w-full md:max-w-[55%] flex flex-col justify-between z-10">
            <div>
              <p className="card-cat-tag text-xs font-mono font-semibold uppercase tracking-wider mb-2 text-neutral-500 dark:text-neutral-400">
                Routage dynamique à la milliseconde (Edge)
              </p>
              <p className="card-desc-text text-sm md:text-base text-neutral-800 dark:text-neutral-300 leading-relaxed font-normal mb-6">
                Ne vous limitez plus à une destination statique. Définissez des
                règles intelligentes pour rediriger automatiquement vos
                utilisateurs selon leur pays, la langue de leur navigateur ou
                leur système d&apos;exploitation (iOS, Android, Desktop). Un
                lien unique suffit pour distribuer vos campagnes mondialement
                sans friction.
              </p>
            </div>
            <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
              <ul className="space-y-2.5">
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>Géolocalisation précise (par pays et région)</span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Détection d&apos;appareil et redirection applicative (Deep
                    Linking iOS/Android)
                  </span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Exécution instantanée sur le réseau Cloudflare Edge
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <RollingTimelineImage
            src="/marketing-FCI/cosmos_1739739224.jpeg"
            alt="Smart Routing"
          />
        </div>
      </div>
    ),
  },
  {
    title: "A/B Testing",
    content: (
      <div className="mb-12">
        <div className="timeline-card-box relative overflow-hidden rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-5 sm:p-7 md:min-h-[420px] flex flex-col justify-between shadow-sm">
          <div className="w-full md:max-w-[55%] flex flex-col justify-between z-10">
            <div>
              <p className="card-cat-tag text-xs font-mono font-semibold uppercase tracking-wider mb-2 text-neutral-500 dark:text-neutral-400">
                Split testing sans code
              </p>
              <p className="card-desc-text text-sm md:text-base text-neutral-800 dark:text-neutral-300 leading-relaxed font-normal mb-6">
                Répartissez automatiquement vos flux de clics entre plusieurs
                landing pages avec une pondération personnalisée (50/50,
                70/30...). Identifiez la variante la plus performante, optimisez
                vos tunnels de vente et basculez 100 % du trafic sur
                l&apos;offre gagnante en un clic.
              </p>
            </div>
            <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
              <ul className="space-y-2.5">
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>Distribution du trafic au pourcentage près</span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Maintien de session (cookie persistant pour sécuriser le
                    visiteur)
                  </span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>Mesure comparative directe du volume de clics</span>
                </li>
              </ul>
            </div>
          </div>

          <RollingTimelineImage
            src="/marketing-FCI/cosmos_1746304416.jpeg"
            alt="A/B Testing"
          />
        </div>
      </div>
    ),
  },
  {
    title: "Sécurité & Cloaking",
    content: (
      <div className="mb-12">
        <div className="timeline-card-box relative overflow-hidden rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-5 sm:p-7 md:min-h-[420px] flex flex-col justify-between shadow-sm">
          <div className="w-full md:max-w-[55%] flex flex-col justify-between z-10">
            <div>
              <p className="card-cat-tag text-xs font-mono font-semibold uppercase tracking-wider mb-2 text-neutral-500 dark:text-neutral-400">
                Liens blindés & expiration automatique
              </p>
              <p className="card-desc-text text-sm md:text-base text-neutral-800 dark:text-neutral-300 leading-relaxed font-normal mb-6">
                Gardez la mainmise sur vos partages confidentiels. Verrouillez
                l&apos;accès par mot de passe PIN ou par navigation restreinte
                evitant l&apos;acces a des page non cible, programmez une date
                d&apos;expiration ou un quota maximal de clics pour vos offres à
                durée limitée. Protégez vos sources d&apos;acquisition en
                masquant l&apos;entête HTTP Referer.
              </p>
            </div>
            <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
              <ul className="space-y-2.5">
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>Accès restreint par code secret PIN</span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Expiration programmée (par date ou seuil de clics atteint)
                  </span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Masquage de l&apos;URL finale et suppression du Referer
                  </span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>Rectriction de navigation</span>
                </li>
              </ul>
            </div>
          </div>

          <RollingTimelineImage
            src="/marketing-FCI/cosmos_1796978290.jpeg"
            alt="Sécurité & Cloaking"
          />
        </div>
      </div>
    ),
  },
  {
    title: "Tracking & Analytics",
    content: (
      <div className="mb-12">
        <div className="timeline-card-box relative overflow-hidden rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-5 sm:p-7 md:min-h-[420px] flex flex-col justify-between shadow-sm">
          <div className="w-full md:max-w-[55%] flex flex-col justify-between z-10">
            <div>
              <p className="card-cat-tag text-xs font-mono font-semibold uppercase tracking-wider mb-2 text-neutral-500 dark:text-neutral-400">
                Télémétrie & attribution précise
              </p>
              <p className="card-desc-text text-sm md:text-base text-neutral-800 dark:text-neutral-300 leading-relaxed font-normal mb-6">
                Suivez vos performances en direct sans impacter la vitesse de
                chargement. Générez et conservez automatiquement vos paramètres
                UTM pour mesurer l&apos;attribution de vos campagnes, et
                visualisez les pays, référents et canaux sur un tableau de bord
                épuré.
              </p>
            </div>
            <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
              <ul className="space-y-2.5">
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Constructeur UTM intégré et transmission dynamique
                  </span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Métriques en direct (clics uniques, pays, canaux
                    d&apos;acquisition)
                  </span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Respect de la vie privée (conforme RGPD sans cookies
                    intrusifs)
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <RollingTimelineImage
            src="/marketing-FCI/cosmos_2136974997.jpeg"
            alt="Tracking & Analytics"
          />
        </div>
      </div>
    ),
  },
  {
    title: "QR Codes & Open Graph",
    content: (
      <div className="mb-12">
        <div className="timeline-card-box relative overflow-hidden rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-5 sm:p-7 md:min-h-[420px] flex flex-col justify-between shadow-sm">
          <div className="w-full md:max-w-[55%] flex flex-col justify-between z-10">
            <div>
              <p className="card-cat-tag text-xs font-mono font-semibold uppercase tracking-wider mb-2 text-neutral-500 dark:text-neutral-400">
                Branding visuel & passerelle physique-digital
              </p>
              <p className="card-desc-text text-sm md:text-base text-neutral-800 dark:text-neutral-300 leading-relaxed font-normal mb-6">
                Ne laissez plus vos partages afficher un visuel cassé :
                personnalisez le titre, la description et l&apos;image Open
                Graph de vos liens pour optimiser le taux de clics. Générez
                simultanément des QR codes dynamiques prêts pour
                l&apos;impression, modifiables à distance.
              </p>
            </div>
            <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
              <ul className="space-y-2.5">
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Personnalisation complète des balises Open Graph et Twitter
                    Cards
                  </span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    QR codes vectoriels dynamiques (SVG/PNG haute résolution)
                  </span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Destination modifiable à distance sans réimprimer le support
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <RollingTimelineImage
            src="/marketing-FCI/cosmos_302657415.jpeg"
            alt="QR Codes"
          />
        </div>
      </div>
    ),
  },
  {
    title: "Paramètres Avancés",
    content: (
      <div className="mb-12">
        <div className="timeline-card-box relative overflow-hidden rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-5 sm:p-7 md:min-h-[420px] flex flex-col justify-between shadow-sm">
          <div className="w-full md:max-w-[55%] flex flex-col justify-between z-10">
            <div>
              <p className="card-cat-tag text-xs font-mono font-semibold uppercase tracking-wider mb-2 text-neutral-500 dark:text-neutral-400">
                Contrôle HTTP fin & domaines personnalisés
              </p>
              <p className="card-desc-text text-sm md:text-base text-neutral-800 dark:text-neutral-300 leading-relaxed font-normal mb-6">
                Ajustez le comportement exact de chaque redirection grâce au
                choix du code d&apos;état HTTP (301, 302, 307 ou 308).
                Transférez dynamiquement les query strings vers la cible,
                appliquez vos propres noms de domaine et connectez vos flux à
                des outils tiers.
              </p>
            </div>
            <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
              <ul className="space-y-2.5">
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Choix du code de redirection HTTP (301, 302, 307, 308)
                  </span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Transfert automatique des paramètres d&apos;URL (Query
                    String Forwarding)
                  </span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Prise en charge des domaines et sous-domaines de marque
                    personnalisés
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <RollingTimelineImage
            src="/marketing-FCI/cosmos_227768569.jpeg"
            alt="Paramètres Avancés"
          />
        </div>
      </div>
    ),
  },
  {
    title: "Pixels & Webhooks",
    content: (
      <div className="mb-12">
        <div className="timeline-card-box relative overflow-hidden rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-5 sm:p-7 md:min-h-[420px] flex flex-col justify-between shadow-sm">
          <div className="w-full md:max-w-[55%] flex flex-col justify-between z-10">
            <div>
              <p className="card-cat-tag text-xs font-mono font-semibold uppercase tracking-wider mb-2 text-neutral-500 dark:text-neutral-400">
                Marketing automation & synchronisation
              </p>
              <p className="card-desc-text text-sm md:text-base text-neutral-800 dark:text-neutral-300 leading-relaxed font-normal mb-6">
                Récupérez les visiteurs qui ne convertissent pas immédiatement
                en intégrant vos pixels publicitaires (Meta, Google, TikTok,
                LinkedIn) directement sur vos liens courts. Déclenchez
                instantanément des webhooks à chaque clic vers votre CRM ou vos
                outils no-code.
              </p>
            </div>
            <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
              <ul className="space-y-2.5">
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Injection invisible de pixels sans ralentir la navigation
                  </span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Webhooks instantanés sur chaque clic avec payload JSON
                    complet
                  </span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Synchronisation native avec Zapier, Make, n8n ou vos
                    backends internes
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <RollingTimelineImage
            src="/marketing-FCI/cosmos_549824580.jpeg"
            alt="Pixels & Webhooks"
          />
        </div>
      </div>
    ),
  },
  {
    title: "API & SDK",
    content: (
      <div className="mb-12">
        <div className="timeline-card-box relative overflow-hidden rounded-[10px] bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-5 sm:p-7 md:min-h-[420px] flex flex-col justify-between shadow-sm">
          <div className="w-full md:max-w-[55%] flex flex-col justify-between z-10">
            <div>
              <p className="card-cat-tag text-xs font-mono font-semibold uppercase tracking-wider mb-2 text-neutral-500 dark:text-neutral-400">
                SDK JavaScript & TypeScript natif
              </p>
              <p className="card-desc-text text-sm md:text-base text-neutral-800 dark:text-neutral-300 leading-relaxed font-normal mb-6">
                Conçu pour les développeurs. Automatisez la création de vos
                liens courts, configurez vos règles de routage dynamique et
                associez chaque conversion financière à un profil client précis
                pour mesurer le retour sur investissement réel de chaque lien
                dans vos applications.
              </p>
            </div>
            <div className="border-t border-[#E7DFD5] dark:border-[#222225] pt-4">
              <ul className="space-y-2.5">
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Installation rapide en ligne de commande (npm install)
                  </span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Tracking des revenus et enregistrement direct des
                    transactions
                  </span>
                </li>
                <li className="card-point-item flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 dark:text-neutral-400">
                  <span className="card-bullet-dash select-none font-bold">
                    —
                  </span>
                  <span>
                    Support TypeScript complet avec autocomplétion stricte
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <RollingTimelineImage
            src="/marketing-FCI/cosmos_938538719.jpeg"
            alt="API & SDK"
          />
        </div>
      </div>
    ),
  },
];
