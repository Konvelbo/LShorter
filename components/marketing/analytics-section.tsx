"use client";

import React from "react";
import { motion } from "motion/react";
import WorldMap from "@/components/ui/world-map";

export function AnalyticsSection() {
  // Découpage par mot pour empêcher toute coupure de lettre comme "d / ata"
  const renderAnimatedWords = (text: string) => {
    let globalCharIndex = 0;
    return text.split(" ").map((word, wordIdx) => (
      <span
        key={wordIdx}
        className="inline-block whitespace-nowrap mr-[0.28em]"
      >
        {word.split("").map((char, charIdx) => {
          const delay = globalCharIndex * 0.025;
          globalCharIndex++;
          return (
            <motion.span
              key={charIdx}
              className="inline-block will-change-transform"
              initial={{ x: -8, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay }}
            >
              {char}
            </motion.span>
          );
        })}
      </span>
    ));
  };

  return (
    <section
      id="analytics"
      className="relative w-full bg-[#FFFFFF] dark:bg-[#09090B] border-t border-[#E4E7EC] dark:border-white/10 flex flex-col justify-center sm:justify-between items-center overflow-hidden py-10 sm:py-14 sm:min-h-screen sm:h-screen transition-colors duration-300"
    >
      {/* Bloc texte supérieur : espacement resserré sur mobile et largeur réduite de 10px sur desktop */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-8 text-center">
        <h2 className="font-normal text-[26px] xs:text-[30px] sm:text-[38px] md:text-[42px] tracking-[-0.035em] leading-[1.12] sm:leading-[1.06] dark:text-white text-[#101828] max-w-[92vw] sm:max-w-[680px] lg:max-w-[750px] mx-auto">
          Never be limited in your geographic{" "}
          <span className="text-[#667085] dark:text-neutral-400">
            {renderAnimatedWords("data analysis again.")}
          </span>
        </h2>

        <p className="text-[13.5px] sm:text-[15px] text-[#475467] dark:text-neutral-400 max-w-2xl mx-auto pt-3 sm:pt-4 leading-[1.6]">
          Break free from geographic boundaries and artificial regional
          paywalls. Access real-time continent, country, and city click
          telemetry from anywhere with complete sovereignty over your data.
        </p>
      </div>

      {/* Carte du monde : rapprochée du texte sur mobile sans vide inutile */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto flex items-center justify-center px-2 sm:px-6 mt-4 sm:mt-0">
        <WorldMap
          dots={[
            {
              start: { lat: 48.8566, lng: 2.3522 }, // Paris, France 🇫🇷
              end: { lat: 40.7128, lng: -74.006 }, // New York, USA 🇺🇸
            },
            {
              start: { lat: 48.8566, lng: 2.3522 }, // Paris, France 🇫🇷
              end: { lat: 35.6762, lng: 139.6503 }, // Tokyo, Japan 🇯🇵
            },
            {
              start: { lat: 48.8566, lng: 2.3522 }, // Paris, France 🇫🇷
              end: { lat: 14.4974, lng: -14.4524 }, // Dakar / West Africa 🇸🇳
            },
            {
              start: { lat: 40.7128, lng: -74.006 }, // New York, USA 🇺🇸
              end: { lat: -15.7975, lng: -47.8919 }, // Brasília, Brazil 🇧🇷
            },
            {
              start: { lat: 51.5074, lng: -0.1278 }, // London, UK 🇬🇧
              end: { lat: 28.6139, lng: 77.209 }, // New Delhi, India 🇮🇳
            },
            {
              start: { lat: 35.6762, lng: 139.6503 }, // Tokyo, Japan 🇯🇵
              end: { lat: -33.8688, lng: 151.2093 }, // Sydney, Australia 🇦🇺
            },
          ]}
        />
      </div>
    </section>
  );
}

export default AnalyticsSection;
