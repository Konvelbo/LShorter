"use client";

import React from "react";
import { motion } from "motion/react";
import WorldMap from "@/components/ui/world-map";

export function AnalyticsSection() {
  return (
    <section
      id="analytics"
      className="relative w-full min-h-screen h-screen bg-[#FFFFFF] dark:bg-[#09090B] border-t border-[#E4E7EC] dark:border-white/10 flex flex-col justify-between overflow-hidden py-8 sm:py-12 transition-colors duration-300"
    >
      {/* Top Text Block Placed at the Top of the 100vh Section */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-8 text-center">
        <p className="font-normal text-[24px] sm:text-[36px] md:text-[42px] tracking-[-0.035em] leading-[1.06] dark:text-white text-[#101828]">
          Never be limited in your geographic{" "}
          <span className="text-[#667085] dark:text-neutral-400">
            {"data analysis again.".split("").map((char, idx) => (
              <motion.span
                key={idx}
                className="inline-block"
                initial={{ x: -10, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.025 }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </span>
        </p>
        <p className="text-[13px] sm:text-[15px] text-[#475467] dark:text-neutral-400 max-w-2xl mx-auto pt-3 leading-[1.6]">
          Break free from geographic boundaries and artificial regional paywalls. Access real-time continent, country, and city click telemetry from anywhere with complete sovereignty over your data.
        </p>
      </div>

      {/* Official @aceternity/world-map-demo Component Filling the 100vh Section */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto flex items-center justify-center px-2 sm:px-6">
        <WorldMap
          dots={[
            {
              start: { lat: 64.2008, lng: -149.4937 }, // Alaska (Fairbanks)
              end: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
            },
            {
              start: { lat: 64.2008, lng: -149.4937 }, // Alaska (Fairbanks)
              end: { lat: -15.7975, lng: -47.8919 }, // Brazil (Brasília)
            },
            {
              start: { lat: -15.7975, lng: -47.8919 }, // Brazil (Brasília)
              end: { lat: 38.7223, lng: -9.1393 }, // Lisbon
            },
            {
              start: { lat: 51.5074, lng: -0.1278 }, // London
              end: { lat: 28.6139, lng: 77.209 }, // New Delhi
            },
            {
              start: { lat: 28.6139, lng: 77.209 }, // New Delhi
              end: { lat: 43.1332, lng: 131.9113 }, // Vladivostok
            },
            {
              start: { lat: 28.6139, lng: 77.209 }, // New Delhi
              end: { lat: -1.2921, lng: 36.8219 }, // Nairobi
            },
          ]}
        />
      </div>
    </section>
  );
}

export default AnalyticsSection;
