"use client";


import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, animate } from "motion/react";

/* ── Data ── */
const ROWS = [
  { label: "PathLock™ PIN",          desc: "PIN check before the destination is exposed." },
  { label: "Zero-referrer cloaking", desc: "Your own title and favicon, not the destination." },
  { label: "Expiration & click caps", desc: "Deactivate links by date or click count." },
  { label: "Scoped API keys",         desc: "Revocable bearer keys, hashed with SHA-256." },
];

const BARS = [
  { label: "LShorter",             ms: 4.2,  maxMs: 112, accent: true  },
  { label: "Standard serverless",  ms: 38.5, maxMs: 112, accent: false },
  { label: "Legacy centralized",   ms: 112,  maxMs: 112, accent: false },
];

const HEADING_WHITE = "Bank-grade security.";
const HEADING_MUTED = " Sub-5ms global API response.";

/* ── Animated counter ── */
function useAnimatedCounter(target: number, duration: number, inView: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) { setVal(0); return; }
    const ctrl = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setVal(v),
    });
    return () => ctrl.stop();
  }, [inView, target, duration]);
  return val;
}

/* ── Typewriter ── */
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

/* ── Bar with animated width ── */
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
    <div className="h-[4px] bg-[#1e1e22] rounded-full overflow-hidden mt-2">
      <motion.div
        initial={{ width: "0%" }}
        animate={inView ? { width: `${pct}%` } : { width: "0%" }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full"
        style={{ background: accent ? "#5b6cff" : "#3a3a42" }}
      />
    </div>
  );
}

/* ── Main component ── */
export function SecuritySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: false, margin: "-80px" });
  const counter = useAnimatedCounter(4.2, 1.3, inView);

  return (
    <section
      ref={sectionRef}
      id="security"
      style={{ minHeight: "120vh" }}
      className="w-full bg-[#0a0a0b] border-t border-[#1e1e22] overflow-hidden flex items-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[1280px] mx-auto px-5 sm:px-10 py-16 flex flex-col lg:flex-row items-start gap-14 lg:gap-[120px]"
      >

        {/* ═══════════════ LEFT ═══════════════ */}
        <div className="w-full lg:w-[600px] flex flex-col shrink-0">

          {/* Section label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="font-mono text-[13px] tracking-[0.08em] uppercase text-[#5b6cff]"
          >
            04 / Security &amp; speed
          </motion.div>

          {/* H2 — typewriter */}
          <h2 className="mt-5 text-[28px] sm:text-[40px] font-medium leading-[1.12] tracking-[-0.02em] text-[#ededee]">
            <TypewriterText
              text={HEADING_WHITE}
              inView={inView}
              startDelay={0.18}
            />
            <span className="text-[#7a7a83]">
              <TypewriterText
                text={HEADING_MUTED}
                inView={inView}
                startDelay={0.18 + HEADING_WHITE.length * 0.022}
              />
            </span>
          </h2>

          {/* Lead */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.45, delay: 0.55 }}
            className="mt-4 text-[14px] sm:text-[16px] leading-[1.55] text-[#9a9aa3]"
          >
            Every short link sits in the critical path of your customer journey.
          </motion.p>

          {/* Feature rows */}
          <div className="mt-9 flex flex-col">
            {ROWS.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -18 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -18 }}
                transition={{ duration: 0.4, delay: 0.55 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                className={`flex gap-6 py-[14px] border-t border-[#1e1e22]${i === ROWS.length - 1 ? " border-b" : ""}`}
              >
                <div className="w-[175px] sm:w-[190px] shrink-0 text-[14px] sm:text-[15px] font-medium text-[#ededee]">
                  {row.label}
                </div>
                <div className="text-[13px] sm:text-[14px] leading-[1.55] text-[#9a9aa3]">
                  {row.desc}
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.95 }}
            className="mt-7"
          >
            <Link
              href="#"
              className="text-[15px] font-medium text-[#5b6cff] hover:text-[#8e9bff] transition-colors duration-200"
            >
              Inspect the architecture →
            </Link>
          </motion.div>
        </div>

        {/* ═══════════════ RIGHT ═══════════════ */}
        <div className="w-full lg:w-[400px] flex flex-col">

          {/* P99 label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="font-mono text-[13px] tracking-[0.08em] uppercase text-[#9a9aa3]"
          >
            P99 redirect latency
          </motion.div>

          {/* Giant counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="mt-3 flex items-baseline gap-2 leading-none"
          >
            <span className="text-[72px] sm:text-[128px] font-medium tracking-[-0.05em] text-[#ededee] tabular-nums">
              {counter.toFixed(1)}
            </span>
            <span className="text-[26px] sm:text-[32px] text-[#7a7a83]">ms</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="mt-3 text-[15px] text-[#9a9aa3]"
          >
            LShorter anycast edge
          </motion.div>

          {/* Benchmark bars */}
          <div className="mt-10 flex flex-col gap-5">
            {BARS.map((bar, i) => (
              <motion.div
                key={bar.label}
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.12 }}
              >
                <div className="flex justify-between text-[13px]">
                  <span className={bar.accent ? "text-[#ededee]" : "text-[#9a9aa3]"}>
                    {bar.label}
                  </span>
                  <span className={`font-mono ${bar.accent ? "text-[#ededee]" : "text-[#9a9aa3]"}`}>
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

          {/* Footnote */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 1.1 }}
            className="mt-10 pt-4 border-t border-[#1e1e22] text-[13px] text-[#7a7a83]"
          >
            99.999% uptime · TLS 1.3 · 310+ edge locations
          </motion.div>
        </div>

      </motion.div>
    </section>
  );
}
