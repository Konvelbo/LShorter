"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, animate } from "motion/react";

/* ── Données ── */
const ROWS = [
  {
    label: "PathLock™ PIN",
    desc: "PIN check before the destination is exposed.",
  },
  {
    label: "Zero-referrer cloaking",
    desc: "Your own title and favicon, not the destination.",
  },
  {
    label: "Expiration & click caps",
    desc: "Deactivate links by date or click count.",
  },
  {
    label: "Scoped API keys",
    desc: "Revocable bearer keys, hashed with SHA-256.",
  },
];

const BARS = [
  { label: "LShorter Anycast", ms: 11.2, maxMs: 112, accent: true },
  { label: "Standard serverless", ms: 42.5, maxMs: 112, accent: false },
  { label: "Legacy centralized", ms: 112, maxMs: 112, accent: false },
];

const HEADING_PRIMARY = "Bank-grade security.";
const HEADING_MUTED = " Sub-12ms global API response.";

/* ── Compteur animé ── */
function useAnimatedCounter(target: number, duration: number, inView: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) {
      setVal(0);
      return;
    }
    const ctrl = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setVal(v),
    });
    return () => ctrl.stop();
  }, [inView, target, duration]);
  return val;
}

/* ── Machine à écrire ── */
function TypewriterText({
  text,
  inView,
  startDelay,
  charDelay = 0.022,
}: {
  text: string;
  inView: boolean;
  startDelay: number;
  charDelay?: number;
}) {
  return (
    <>
      {text.split("").map((ch, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.001, delay: startDelay + i * charDelay }}
        >
          {ch}
        </motion.span>
      ))}
    </>
  );
}

/* ── Barre avec largeur animée et adaptation Light / Dark ── */
function Bar({
  ms,
  maxMs,
  accent,
  inView,
  delay,
}: {
  ms: number;
  maxMs: number;
  accent: boolean;
  inView: boolean;
  delay: number;
}) {
  const pct = (ms / maxMs) * 100;
  return (
    <div className="h-[7px] sm:h-[8px] bg-[#E4E7EC] dark:bg-[#1e1e22] rounded-full overflow-hidden mt-2.5 transition-colors duration-300">
      <motion.div
        initial={{ width: "0%" }}
        animate={inView ? { width: `${pct}%` } : { width: "0%" }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full rounded-full transition-colors duration-300 ${
          accent
            ? "bg-[#465FFF] dark:bg-[#5b6cff]"
            : "bg-[#D0D5DD] dark:bg-[#3a3a42]"
        }`}
      />
    </div>
  );
}

/* ── Composant principal SecuritySection ── */
export function SecuritySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: false, margin: "-80px" });
  const counter = useAnimatedCounter(11.2, 1.3, inView);

  return (
    <section
      ref={sectionRef}
      id="security"
      style={{ minHeight: "110vh" }}
      className="w-full bg-[#FFFFFF] dark:bg-[#09090B] border-t border-[#E4E7EC] dark:border-[#1e1e22] overflow-hidden flex items-center transition-colors duration-300"
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[1360px] mx-auto px-6 sm:px-12 py-20 md:py-28 flex flex-col lg:flex-row items-start gap-14 lg:gap-[90px] xl:gap-[120px]"
      >
        {/* ═══════════════ COLONNE GAUCHE ═══════════════ */}
        <div className="w-full lg:w-[620px] xl:w-[670px] flex flex-col shrink-0">

          {/* Titre H2 — Machine à écrire (taille augmentée) */}
          <h2 className="mt-5 text-[32px] sm:text-[44px] lg:text-[50px] font-semibold leading-[1.14] tracking-[-0.025em] text-[#101828] dark:text-[#ededee] transition-colors duration-300">
            <TypewriterText
              text={HEADING_PRIMARY}
              inView={inView}
              startDelay={0.18}
            />
            <span className="text-[#667085] dark:text-[#7a7a83] transition-colors duration-300">
              <TypewriterText
                text={HEADING_MUTED}
                inView={inView}
                startDelay={0.18 + HEADING_PRIMARY.length * 0.022}
              />
            </span>
          </h2>

          {/* Description (taille augmentée) */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.45, delay: 0.55 }}
            className="mt-5 text-[16px] sm:text-[18px] lg:text-[19px] leading-[1.6] text-[#475467] dark:text-[#9a9aa3] transition-colors duration-300 max-w-xl"
          >
            Every short link sits in the critical path of your customer journey.
          </motion.p>

          {/* Tableau des fonctionnalités (tailles augmentées) */}
          <div className="mt-11 flex flex-col">
            {ROWS.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -18 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -18 }}
                transition={{
                  duration: 0.4,
                  delay: 0.55 + i * 0.09,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 py-5 sm:py-[22px] border-t border-[#E4E7EC] dark:border-[#1e1e22] transition-colors duration-300 ${
                  i === ROWS.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="w-full sm:w-[210px] md:w-[230px] shrink-0 text-[16px] sm:text-[17.5px] font-semibold text-[#101828] dark:text-[#ededee] transition-colors duration-300">
                  {row.label}
                </div>
                <div className="text-[14.5px] sm:text-[15.5px] leading-[1.6] text-[#475467] dark:text-[#9a9aa3] transition-colors duration-300">
                  {row.desc}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Lien d'architecture (taille augmentée) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.95 }}
            className="mt-9"
          >
            <Link
              href="/docs/security"
              className="inline-flex items-center gap-2 text-[16px] sm:text-[17px] font-semibold text-[#465FFF] dark:text-[#7592FF] hover:text-[#3641F5] dark:hover:text-[#8e9bff] transition-colors duration-200"
            >
              Inspect the architecture →
            </Link>
          </motion.div>
        </div>

        {/* ═══════════════ COLONNE DROITE ═══════════════ */}
        <div className="w-full lg:flex-1 max-w-[480px] flex flex-col">
          {/* Label de latence */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="font-mono text-[14px] sm:text-[15px] font-semibold tracking-[0.08em] uppercase text-[#667085] dark:text-[#9a9aa3] transition-colors duration-300"
          >
            P99 redirect latency
          </motion.div>

          {/* Compteur géant (taille augmentée) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="mt-4 flex items-baseline gap-3 leading-none"
          >
            <span className="text-[84px] sm:text-[132px] lg:text-[150px] font-bold tracking-[-0.05em] text-[#101828] dark:text-[#ededee] tabular-nums transition-colors duration-300">
              {counter.toFixed(1)}
            </span>
            <span className="text-[30px] sm:text-[40px] font-semibold text-[#667085] dark:text-[#7a7a83] transition-colors duration-300">
              ms
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="mt-4 text-[16px] sm:text-[17.5px] font-medium text-[#475467] dark:text-[#9a9aa3] transition-colors duration-300"
          >
            LShorter anycast edge
          </motion.div>

          {/* Barres comparatives (tailles augmentées) */}
          <div className="mt-12 flex flex-col gap-6">
            {BARS.map((bar, i) => (
              <motion.div
                key={bar.label}
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.12 }}
              >
                <div className="flex justify-between text-[14.5px] sm:text-[15.5px] mb-1.5">
                  <span
                    className={
                      bar.accent
                        ? "text-[#101828] dark:text-[#ededee] font-semibold transition-colors duration-300"
                        : "text-[#475467] dark:text-[#9a9aa3] transition-colors duration-300"
                    }
                  >
                    {bar.label}
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      bar.accent
                        ? "text-[#101828] dark:text-[#ededee] transition-colors duration-300"
                        : "text-[#475467] dark:text-[#9a9aa3] transition-colors duration-300"
                    }`}
                  >
                    {bar.ms} ms
                  </span>
                </div>
                <Bar
                  ms={bar.ms}
                  maxMs={bar.maxMs}
                  accent={bar.accent}
                  inView={inView}
                  delay={0.65 + i * 0.15}
                />
              </motion.div>
            ))}
          </div>

          {/* Note de bas de section (taille augmentée) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 1.1 }}
            className="mt-12 pt-5 border-t border-[#E4E7EC] dark:border-[#1e1e22] text-[14px] sm:text-[15px] text-[#667085] dark:text-[#7a7a83] transition-colors duration-300"
          >
            99.999% uptime · TLS 1.3 · 310+ edge locations
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

export default SecuritySection;
