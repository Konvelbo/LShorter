"use client";

// The features section from ink-orbit-saas-template, standalone: a hatched
// page and a bento of three live diagrams — your team's edits flowing through a
// hub into a stack of reports that keeps printing, an integrations hub that
// syncs one tool at a time, and a forecast chart you can scrub.
//
// Refined with LShorter Cyber Blue (#0066FF) and edge architecture telemetry.

import React from "react";
import { useTheme } from "@/components/providers/theme-provider";

export type InkFeatureCopy = { title: string; description: string };
export type InkFeatures = {
  tag: string;
  /** `*word*` sets a word in the muted tone; `\n` breaks the line. */
  title: string;
  collaboration: InkFeatureCopy;
  reports: InkFeatureCopy;
  integrations: InkFeatureCopy & { tools: string[] };
  insights: InkFeatureCopy & { values: number[]; forecastFrom: number };
};

export type InkOrbitFeaturesProps = {
  /** `auto` follows prefers-color-scheme / site theme. */
  theme?: "light" | "dark" | "auto";
  /** Shown on the hub chip in the flow diagram (first word, uppercased). */
  brand?: string;
  tag?: string;
  title?: string;
  collaboration?: { [K in keyof InkFeatureCopy]?: InkFeatureCopy[K] };
  reports?: { [K in keyof InkFeatureCopy]?: InkFeatureCopy[K] };
  integrations?: { [K in keyof InkFeatures["integrations"]]?: InkFeatures["integrations"][K] };
  insights?: { [K in keyof InkFeatures["insights"]]?: InkFeatures["insights"][K] };
  className?: string;
  style?: React.CSSProperties;
};

/* ------------------------------------------------------------------ logic */

function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v));
}

// Smooth line + closed area through values, inside a w×h box.
function chartPaths(values: number[], w: number, h: number, pad: number) {
  const n = values.length;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map((v, i) => [
    pad + (n < 2 ? 0 : (i / (n - 1)) * (w - pad * 2)),
    h - pad - ((v - lo) / span) * (h - pad * 2),
  ] as [number, number]);
  let line = "";
  pts.forEach(([x, y], i) => {
    if (i === 0) {
      line = "M" + x.toFixed(1) + "," + y.toFixed(1);
      return;
    }
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    line += " C" + cx.toFixed(1) + "," + py.toFixed(1) + " " + cx.toFixed(1) + "," + y.toFixed(1) + " " + x.toFixed(1) + "," + y.toFixed(1);
  });
  const area = n ? line + " L" + pts[n - 1][0].toFixed(1) + "," + (h - pad) + " L" + pts[0][0].toFixed(1) + "," + (h - pad) + " Z" : "";
  return { line, area, points: pts };
}

function nearestIndex(xs: number[], x: number): number {
  let best = 0;
  for (let i = 1; i < xs.length; i++) {
    if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
  }
  return best;
}

// "Smart *Workflow*\nAutomation" → lines of { text, muted } runs.
function parseTitle(s: string): { text: string; muted: boolean }[][] {
  return s.split(/\r?\n|\\n/).map((line) => {
    const out: { text: string; muted: boolean }[] = [];
    line.split("*").forEach((text, i) => {
      if (text) out.push({ text, muted: i % 2 === 1 });
    });
    return out;
  });
}

/* --------------------------------------------------------------- defaults */

const D_FEATURES: InkFeatures = {
  tag: "Short Links & Edge Architecture",
  title: "High-performance *short links*\nengineered for conversion.",
  collaboration: {
    title: "Global Anycast Edge Network",
    description: "Every short link resolves at the edge location closest to your visitor in <12ms across 300+ PoPs worldwide with zero DNS lag.",
  },
  reports: {
    title: "Real-time edge telemetry",
    description: "Live click distribution, unique visitors, referral sources, and UTM analytics streamed as clicks happen across global nodes.",
  },
  integrations: {
    title: "Retargeting Pixels & Webhooks",
    description: "Automatically fire Meta Ads, Google Ads, TikTok Ads, and Webhooks on every click to build high-converting audiences across paid channels.",
    tools: ["Meta Ads", "Google Ads", "TikTok Ads", "Webhooks"],
  },
  insights: {
    title: "Conversion Velocity & Forecaster",
    description: "Machine intelligence tracks traffic momentum and forecasts click surges so you can scale campaigns with real confidence.",
    values: [140, 185, 220, 290, 340, 420, 490, 580, 690, 820, 950, 1140],
    forecastFrom: 8,
  },
};

/* -------------------------------------------------------------- component */

export function InkOrbitFeatures({
  theme = "auto",
  brand = "LShorter Edge",
  tag = D_FEATURES.tag,
  title = D_FEATURES.title,
  collaboration,
  reports,
  integrations,
  insights,
  className = "",
  style,
}: InkOrbitFeaturesProps) {
  const uid = "ib" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const F: InkFeatures = {
    tag,
    title,
    collaboration: { ...D_FEATURES.collaboration, ...collaboration },
    reports: { ...D_FEATURES.reports, ...reports },
    integrations: { ...D_FEATURES.integrations, ...integrations },
    insights: { ...D_FEATURES.insights, ...insights },
  };

  const themeContext = useTheme();
  const activeAppTheme = themeContext?.theme || "dark";

  const [dark, setDark] = React.useState(
    theme === "dark" || (theme === "auto" && activeAppTheme === "dark")
  );
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    if (theme === "dark") {
      setDark(true);
      return;
    }
    if (theme === "light") {
      setDark(false);
      return;
    }
    // Auto theme: follows app theme or prefers-color-scheme
    if (activeAppTheme) {
      setDark(activeAppTheme === "dark");
    }
    if (typeof window === "undefined" || !window.matchMedia) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(motion.matches);
  }, [theme, activeAppTheme]);

  const [featRef, featVisible, featRevealed] = useInView(0.08);

  return (
    <div
      className={"ib-root " + className}
      data-theme={dark ? "dark" : "light"}
      data-active={featVisible ? "true" : "false"}
      style={style}
    >
      <style>{IB_CSS}</style>
      <div className="ib-shell">
        <section className="ib-sec" aria-labelledby={uid + "feat"}>
          <div className="ib-reveal" ref={featRef as never} data-in={featRevealed}>
            <div className="ib-head" id={uid + "feat"}>
              {F.tag && <span className="ib-tag">{F.tag}</span>}
              <Title text={F.title} />
            </div>
            <div className="ib-bento">
              <FlowCard brand={brand} features={F} uid={uid} reduced={reduced} inView={featVisible} />
              <IntegrationsCard copy={F.integrations} reduced={reduced} inView={featVisible} />
              <InsightsCard copy={F.insights} uid={uid} reduced={reduced} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

// Tracks both live visibility (to pause offscreen SVG animations/timers) and one-shot revealed state (no re-hiding jank on scroll)
function useInView(threshold = 0.08) {
  const ref = React.useRef(null as HTMLElement | null);
  const noIo = typeof window !== "undefined" && typeof IntersectionObserver !== "function";
  const [visible, setVisible] = React.useState(noIo);
  const [revealed, setRevealed] = React.useState(noIo);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver !== "function") return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setVisible(entry.isIntersecting);
          if (entry.isIntersecting) setRevealed(true);
        }
      },
      { threshold, rootMargin: "120px 0px 120px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, visible, revealed] as const;
}

function Brackets() {
  return (
    <>
      <span className="ib-c ib-c-tl" aria-hidden="true" />
      <span className="ib-c ib-c-tr" aria-hidden="true" />
      <span className="ib-c ib-c-bl" aria-hidden="true" />
      <span className="ib-c ib-c-br" aria-hidden="true" />
    </>
  );
}

function Title({ text, className = "ib-h2", as = "h2" }: { text: string; className?: string; as?: "h2" | "h3" }) {
  const Tag = as;
  return (
    <Tag className={className}>
      {parseTitle(text).map((line, i) => (
        <span key={i}>
          {line.map((run, j) => (
            <React.Fragment key={j}>
              {run.muted ? (
                <span className="ib-muted" style={{ display: "inline" }}>
                  {run.text}
                </span>
              ) : (
                run.text
              )}
            </React.Fragment>
          ))}
        </span>
      ))}
    </Tag>
  );
}

function Mark({ size = 18 }: { size?: number }) {
  // LShorter link / edge icon glyph with signature blue fill
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* drawn portraits — greyscale, so they sit in the palette */
const PORTRAITS = [
  { hair: "short", beard: true, glasses: false, skin: "#b9b4ae", hairC: "#2b2a29", shirt: "#3a3a3a", bg: "#d9d6d2" },
  { hair: "long", beard: false, glasses: false, skin: "#d6d0c9", hairC: "#8d7f6c", shirt: "#7b7b7b", bg: "#e6e3df" },
  { hair: "buzz", beard: false, glasses: true, skin: "#a7a19a", hairC: "#3d3c3a", shirt: "#1f1f1f", bg: "#cfcfcf" },
  { hair: "bun", beard: false, glasses: true, skin: "#9a8f84", hairC: "#1e1d1c", shirt: "#5a5a5a", bg: "#dedbd6" },
  { hair: "curly", beard: false, glasses: false, skin: "#7f746a", hairC: "#1a1918", shirt: "#8a8a8a", bg: "#d3d0cb" },
  { hair: "side", beard: true, glasses: true, skin: "#c7c0b8", hairC: "#5b5650", shirt: "#2c2c2c", bg: "#e1ded9" },
];

function Portrait({ index, size = 38, uid }: { index: number; size?: number; uid: string }) {
  const p = PORTRAITS[((index % PORTRAITS.length) + PORTRAITS.length) % PORTRAITS.length];
  const id = uid + "pt" + index;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.bg} />
          <stop offset="1" stopColor="#9d9a96" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill={"url(#" + id + ")"} />
      {p.hair === "long" && <path d="M18 30c0-12 6-19 14-19s14 7 14 19v20H18z" fill={p.hairC} />}
      {p.hair === "curly" &&
        [[22, 20], [28, 15], [36, 15], [42, 20], [45, 28], [19, 28]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="7" fill={p.hairC} />
        ))}
      <path d="M8 64c2-12 12-18 24-18s22 6 24 18z" fill={p.shirt} />
      <rect x="27.5" y="36" width="9" height="11" rx="3" fill={p.skin} />
      <path d="M27.5 44c3 2.5 6 2.5 9 0v3h-9z" fill="#000" opacity=".12" />
      <ellipse cx="32" cy="28" rx="11" ry="13" fill={p.skin} />
      {p.hair === "short" && <path d="M21 25c0-9 5-13 11-13s11 4 11 13c-2-4-6-6-11-6s-9 2-11 6z" fill={p.hairC} />}
      {p.hair === "buzz" && <path d="M21.5 24c.5-8 5-11.5 10.5-11.5S42 16 42.5 24c-3-3-6.5-4-10.5-4s-7.5 1-10.5 4z" fill={p.hairC} opacity=".85" />}
      {p.hair === "bun" && (
        <>
          <circle cx="32" cy="11" r="6" fill={p.hairC} />
          <path d="M21 26c0-10 5-14 11-14s11 4 11 14c-2-5-6-7.5-11-7.5S23 21 21 26z" fill={p.hairC} />
        </>
      )}
      {p.hair === "long" && <path d="M21 27c0-10 5-15 11-15s11 5 11 15c-3-6-8-8-14-7-3 .5-6 3-8 7z" fill={p.hairC} />}
      {p.hair === "side" && <path d="M21 26c-1-9 5-14 12-14 6 0 11 4 10 12-4-5-10-6-17-3-2 1-4 3-5 5z" fill={p.hairC} />}
      {p.beard && <path d="M21.5 30c1 9 5 12 10.5 12s9.5-3 10.5-12c-2 4-5 5-10.5 5s-8.5-1-10.5-5z" fill={p.hairC} opacity=".9" />}
      <circle cx="27.5" cy="28" r="1.2" fill="#1a1a1a" />
      <circle cx="36.5" cy="28" r="1.2" fill="#1a1a1a" />
      {p.glasses && (
        <g fill="none" stroke="#1a1a1a" strokeWidth="1.1">
          <circle cx="27.5" cy="28" r="3.6" />
          <circle cx="36.5" cy="28" r="3.6" />
          <path d="M31.1 28h1.8" />
        </g>
      )}
      <path d="M29 34.5c1.8 1.2 4.2 1.2 6 0" fill="none" stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

function ToolGlyph({ index }: { index: number }) {
  const k = index % 4;
  return (
    <g>
      {/* 0. Official Meta Ads Logo */}
      {k === 0 && (
        <g transform="translate(-10, -10)">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#0467DF"
              d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
            />
          </svg>
        </g>
      )}
      {/* 1. Official Google Ads 3-Color Logo */}
      {k === 1 && (
        <g transform="translate(-10, -9)">
          <svg viewBox="0 0 256 230" width="20" height="18">
            <path
              fill="#FBBC04"
              d="M5.888 166.405L90.88 20.9c10.796 6.356 65.236 36.484 74.028 42.214L79.916 208.627c-9.295 12.28-85.804-23.587-74.028-42.23z"
            />
            <path
              fill="#4285F4"
              d="M250.084 166.402L165.092 20.906C153.21 1.132 127.62-6.054 106.601 5.625S79.182 42.462 91.064 63.119l84.992 145.514c11.882 19.765 37.473 26.95 58.492 15.272c20.1-11.68 27.418-37.73 15.536-57.486z"
            />
            <ellipse cx="42.664" cy="187.924" fill="#34A853" rx="42.664" ry="41.604" />
          </svg>
        </g>
      )}
      {/* 2. Official TikTok Ads Logo with Cyan & Red Chromatic Layers */}
      {k === 2 && (
        <g transform="translate(-10, -10)">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#25F4EE"
              d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.064-.093a2.895 2.895 0 0 1 2.37-4.547c.307 0 .604.05.882.143V9.37a6.34 6.34 0 0 0-.882-.062 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.718a8.214 8.214 0 0 0 4.77 1.522V6.795a4.78 4.78 0 0 1-1.001-.109z"
              transform="translate(-0.7, -0.5)"
              opacity="0.9"
            />
            <path
              fill="#FE2C55"
              d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.064-.093a2.895 2.895 0 0 1 2.37-4.547c.307 0 .604.05.882.143V9.37a6.34 6.34 0 0 0-.882-.062 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.718a8.214 8.214 0 0 0 4.77 1.522V6.795a4.78 4.78 0 0 1-1.001-.109z"
              transform="translate(0.7, 0.5)"
              opacity="0.9"
            />
            <path
              fill="currentColor"
              d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.064-.093a2.895 2.895 0 0 1 2.37-4.547c.307 0 .604.05.882.143V9.37a6.34 6.34 0 0 0-.882-.062 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.718a8.214 8.214 0 0 0 4.77 1.522V6.795a4.78 4.78 0 0 1-1.001-.109z"
            />
          </svg>
        </g>
      )}
      {/* 3. Official Lucide Webhooks Triquetra Icon */}
      {k === 3 && (
        <g transform="translate(-10, -10)">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="#0066FF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2" />
            <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06" />
            <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8" />
          </svg>
        </g>
      )}
    </g>
  );
}

const RAYS_PATHS = [-62, -38, -14, 14, 38, 62].map((a) => {
  const x1 = (320 + Math.sin((a * Math.PI) / 180) * 260).toFixed(1);
  const y1 = (110 - Math.cos((a * Math.PI) / 180) * 260).toFixed(1);
  const x2 = (320 + Math.sin(((a + 7) * Math.PI) / 180) * 260).toFixed(1);
  const y2 = (110 - Math.cos(((a + 7) * Math.PI) / 180) * 260).toFixed(1);
  return `M320,110 L${x1},${y1} L${x2},${y2}Z`;
});

function FlowCard({
  brand,
  features,
  uid,
  reduced,
  inView,
}: {
  brand: string;
  features: InkFeatures;
  uid: string;
  reduced: boolean;
  inView: boolean;
}) {
  const [reports, setReports] = React.useState(128);
  const [side, setSide] = React.useState("" as "" | "left" | "right");

  React.useEffect(() => {
    if (reduced || !inView) return;
    const t = setInterval(() => setReports((n) => n + 1), 2800);
    return () => clearInterval(t);
  }, [reduced, inView]);

  const team = [
    { x: 82, y: 44, name: "US-East · 4.2ms edge route" },
    { x: 124, y: 30, name: "EU-West · Meta pixel fired" },
    { x: 168, y: 46, name: "AP-East · A/B traffic split" },
    { x: 76, y: 100, name: "SA-East · PathLock™ verified" },
    { x: 160, y: 116, name: "AF-South · Geo redirect 9ms" },
  ];

  const L1 = "M134,70 C196,70 210,100 262,100"; // out of the link node …
  const L2 = "M134,76 C186,76 206,120 262,120"; // … into the hub chip
  const R1 = "M378,100 C412,100 418,86 450,86"; // hub → front report sheet
  const R2 = "M378,120 C412,120 418,134 450,134";

  const chip = brand.split(" ")[0].toUpperCase();
  const chipLong = chip.length * 6.7 > 58;
  const rays = uid + "rays";
  const glow = uid + "glow";

  return (
    <div className="ib-frame ib-frame-hover ib-wide">
      <Brackets />
      <div className="ib-card" style={{ padding: 0, overflow: "visible" }}>
        <svg
          className="ib-diagram"
          viewBox="0 -18 640 196"
          overflow="visible"
          role="img"
          aria-label={"Global link traffic flows through " + brand + " into finished telemetry reports"}
        >
          <defs>
            <radialGradient id={glow} cx="320" cy="110" r="190" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="var(--ib-raise)" stopOpacity="1" />
              <stop offset="1" stopColor="var(--ib-raise)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={rays} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--ib-line-strong)" stopOpacity=".55" />
              <stop offset="1" stopColor="var(--ib-line-strong)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="0" y="-18" width="640" height="196" fill={"url(#" + glow + ")"} />
          {RAYS_PATHS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill={"url(#" + rays + ")"}
              opacity=".5"
            />
          ))}

          {/* edge PoP cluster */}
          <g onMouseEnter={() => setSide("left")} onMouseLeave={() => setSide("")}>
            <rect x="20" y="8" width="180" height="130" fill="transparent" />
            {team.map((m, i) => (
              <line key={"l" + i} x1={m.x} y1={m.y} x2="121" y2="73" stroke="var(--ib-line-strong)" strokeDasharray="2 3" />
            ))}
            <g transform="translate(108,60)">
              <rect width="26" height="26" rx="5" className="ib-node" />
              <g transform="translate(5,5)" style={{ color: "#0066FF" }}>
                <Mark size={16} />
              </g>
            </g>
            {team.map((m, i) => {
              const tipWidth = m.name.length * 5.4 + 18;
              const halfTip = tipWidth / 2;
              const tipX = Math.max(halfTip + 8, Math.min(632 - halfTip, m.x));
              // Placé strictement en haut au-dessus de l'avatar avec pointeur vers le centre
              const tipY = m.y - 25;

              return (
                <g key={i} className="ib-av" tabIndex={0} role="img" aria-label={m.name}>
                  <svg x={m.x - 11} y={m.y - 11} width="22" height="22" viewBox="0 0 22 22" overflow="visible">
                    <clipPath id={uid + "avc" + i}>
                      <circle cx="11" cy="11" r="11" />
                    </clipPath>
                    <g clipPath={"url(#" + uid + "avc" + i + ")"}>
                      <Portrait index={i} size={22} uid={uid + "f"} />
                    </g>
                    <circle cx="11" cy="11" r="10.5" fill="none" stroke="var(--ib-paper)" strokeWidth="1.5" />
                  </svg>
                  <circle
                    cx={m.x + 8}
                    cy={m.y + 8}
                    r="2.6"
                    fill="#0066FF"
                    stroke="var(--ib-paper)"
                    className="ib-presence"
                  />
                  <g className="ib-av-tip" transform={"translate(" + tipX + "," + tipY + ")"}>
                    <rect
                      x={-halfTip}
                      y="-10"
                      width={tipWidth}
                      height="19"
                      rx="5"
                      fill="#0066FF"
                      style={{ filter: "drop-shadow(0 2px 10px rgba(0,102,255,0.45))" }}
                    />
                    {/* Pointe indicative orientée vers l'avatar en dessous */}
                    <polygon
                      points={`${m.x - tipX - 4},9 ${m.x - tipX},13 ${m.x - tipX + 4},9`}
                      fill="#0066FF"
                    />
                    <text
                      x="0"
                      y="2.5"
                      textAnchor="middle"
                      fontSize="8.5"
                      fontWeight="600"
                      fill="#ffffff"
                      fontFamily="var(--ib-sans)"
                    >
                      {m.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* connectors */}
          {[L1, L2].map((d, i) => (
            <path key={d} d={d} className={"ib-flow" + (side === "left" ? " ib-flow-on" : "") + (i ? " ib-dash" : "")} />
          ))}
          {[R1, R2].map((d, i) => (
            <path key={d} d={d} className={"ib-flow" + (side === "right" ? " ib-flow-on" : "") + (i ? " ib-dash" : "")} />
          ))}
          {!reduced && inView &&
            [L1, L2, R1, R2].map((d, i) => (
              <circle key={"p" + i} r="2.2" className="ib-pkt">
                <animateMotion dur={2.2 + (i % 2) * 0.6 + "s"} begin={i * 0.35 + "s"} repeatCount="indefinite" path={d} />
              </circle>
            ))}

          {/* the hub chip */}
          <g transform="translate(262,88)">
            <rect
              x="-4"
              y="-4"
              width="124"
              height="52"
              rx="8"
              fill="none"
              stroke="#0066FF"
              strokeOpacity="0.45"
              className={reduced ? undefined : "ib-glow"}
            />
            <rect width="116" height="44" rx="6" className="ib-node" style={{ filter: "drop-shadow(0 6px 14px rgba(0,102,255,.15))" }} />
            <g transform="translate(13,14)" style={{ color: "#0066FF" }}>
              <Mark size={16} />
            </g>
            <text
              x="36"
              y="26"
              fontSize="8.5"
              letterSpacing="1.4"
              fontWeight="700"
              fill="#0066FF"
              fontFamily="var(--ib-sans)"
              textLength={chipLong ? 58 : undefined}
              lengthAdjust={chipLong ? "spacingAndGlyphs" : undefined}
            >
              {chip}
            </text>
            <path d="M100 18l4 4-4 4" fill="none" stroke="#0066FF" strokeWidth="1.4" />
          </g>

          {/* the report stack */}
          <g onMouseEnter={() => setSide("right")} onMouseLeave={() => setSide("")}>
            {[2, 1, 0].map((k) => (
              <g key={reports - k} transform={"translate(" + (450 + k * 12) + "," + (40 - k * 10) + ")"} opacity={1 - k * 0.25}>
                <g className={"ib-sheet" + (k === 0 ? " ib-sheet-new" : "")}>
                  <rect width="138" height="102" rx="3" fill="var(--ib-raise)" stroke="var(--ib-line-strong)" />
                  {k === 0 && (
                    <>
                      <text x="10" y="16" fontSize="7" fill="#0066FF" fontFamily="var(--ib-mono)" fontWeight="700">
                        {"ATTRIBUTION #" + reports}
                      </text>
                      <rect x="10" y="24" width="64" height="5" rx="1" fill="#0066FF" opacity=".8" />
                      <rect x="10" y="33" width="92" height="3" rx="1" fill="var(--ib-line-strong)" />
                      <rect x="10" y="39" width="80" height="3" rx="1" fill="var(--ib-line-strong)" />
                      {[18, 26, 14, 30, 22, 34].map((h, j) => (
                        <rect
                          key={j}
                          x={12 + j * 13}
                          y={92 - h}
                          width="8"
                          height={h}
                          fill="#0066FF"
                          opacity={0.3 + j * 0.14}
                        />
                      ))}
                      <path d="M92 64h34M92 72h28M92 80h32" stroke="var(--ib-line-strong)" strokeWidth="2.5" />
                    </>
                  )}
                </g>
              </g>
            ))}
          </g>
        </svg>
        <div className="ib-wide-copy" style={{ padding: "0 22px 20px" }}>
          <div>
            <h3>{features.collaboration.title}</h3>
            <p>{features.collaboration.description}</p>
          </div>
          <div>
            <h3>{features.reports.title}</h3>
            <p>{features.reports.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationsCard({ copy, reduced, inView }: { copy: InkFeatures["integrations"]; reduced: boolean; inView?: boolean }) {
  const [hover, setHover] = React.useState(-1);
  const [auto, setAuto] = React.useState(0);

  React.useEffect(() => {
    if (reduced || inView === false || hover >= 0) return;
    const t = setInterval(() => setAuto((a) => (a + 1) % 4), 1700);
    return () => clearInterval(t);
  }, [reduced, inView, hover]);

  const on = hover >= 0 ? hover : reduced ? -1 : auto;
  const tiles = [
    { x: 66, y: 36 },
    { x: 234, y: 36 },
    { x: 66, y: 114 },
    { x: 234, y: 114 },
  ];
  const path = (i: number) => {
    const t = tiles[i];
    const dir = t.x < 150 ? -1 : 1;
    return "M" + (150 + dir * 17) + ",75 H" + (150 + dir * 42) + " V" + t.y + " H" + (t.x - dir * 15);
  };

  return (
    <div className="ib-frame ib-frame-hover">
      <Brackets />
      <div className="ib-card">
        <svg className="ib-diagram" viewBox="0 0 300 150" role="group" aria-label="Integrations">
          {tiles.map((_, i) => (
            <path key={i} d={path(i)} className={"ib-flow" + (on === i ? " ib-flow-on" : "")} />
          ))}
          {!reduced && inView && on >= 0 && (
            <circle key={on} r="2.2" className="ib-pkt">
              <animateMotion dur="1.1s" repeatCount="indefinite" path={path(on)} />
            </circle>
          )}
          <g transform="translate(133,58)">
            <rect width="34" height="34" rx="7" className="ib-node" style={{ filter: "drop-shadow(0 4px 10px rgba(0,102,255,.18))" }} />
            <g transform="translate(8,8)" style={{ color: "#0066FF" }}>
              <Mark size={18} />
            </g>
          </g>
          {tiles.map((t, i) => (
            <g
              key={i}
              className={"ib-tool" + (on === i ? " ib-tool-on" : "")}
              tabIndex={0}
              role="img"
              aria-label={copy.tools[i] ?? "Tool"}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(-1)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(-1)}
            >
              <rect x={t.x - 15} y={t.y - 15} width="30" height="30" rx="6" className="ib-node" />
              <g transform={"translate(" + t.x + "," + t.y + ")"}>
                <ToolGlyph index={i} />
              </g>
              <text
                x={t.x}
                y={t.y + (t.y < 75 ? -21 : 28)}
                textAnchor="middle"
                fontSize="8"
                fontWeight="600"
                fill={on === i ? "#0066FF" : "var(--ib-muted)"}
                fontFamily="var(--ib-sans)"
                opacity={on === i ? 1 : 0}
                style={{ transition: "opacity .25s" }}
              >
                {copy.tools[i] ?? ""}
              </text>
            </g>
          ))}
        </svg>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "11px",
                fontWeight: "600",
                fontFamily: "var(--ib-mono)",
                color: "#0066FF",
                backgroundColor: "rgba(0,102,255,0.08)",
                border: "1px solid rgba(0,102,255,0.24)",
                borderRadius: "9999px",
                padding: "3px 10px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "9999px",
                  backgroundColor: "#0066FF",
                  boxShadow: "0 0 6px rgba(0,102,255,0.8)",
                  animation: "ib-pulse 2s infinite",
                }}
              />
              {on >= 0 ? `Active Dispatch · ${copy.tools[on]}` : "4 Engines Connected"}
            </span>
          </div>
          <h3>{copy.title}</h3>
          <p>{copy.description}</p>
        </div>
      </div>
    </div>
  );
}

function InsightsCard({ copy, uid, reduced }: { copy: InkFeatures["insights"]; uid: string; reduced: boolean }) {
  const [ref, , inView] = useInView(0.2);
  const [hover, setHover] = React.useState(-1);
  const W = 300;
  const H = 130;
  const vals = copy.values.length > 1 ? copy.values : [1, 2];
  const { line, area, points } = chartPaths(vals, W, H, 14);
  const split = clamp(copy.forecastFrom, 1, vals.length - 1);
  const fill = uid + "area";
  const last = points[points.length - 1];
  const i = hover >= 0 ? hover : points.length - 1;
  const p = points[i];
  const pct = Math.round(((vals[i] - vals[0]) / (vals[0] || 1)) * 100);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHover(nearestIndex(points.map((q) => q[0]), ((e.clientX - r.left) / r.width) * W));
  };

  return (
    <div className="ib-frame ib-frame-hover" ref={ref as never} data-in={inView}>
      <Brackets />
      <div className="ib-card">
        <svg
          className="ib-diagram ib-chart"
          viewBox={"0 0 " + W + " " + (H + 6)}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(-1)}
          role="img"
          aria-label={copy.title + " chart"}
        >
          <defs>
            <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0066FF" stopOpacity=".28" />
              <stop offset="1" stopColor="#0066FF" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="14" x2={W - 14} y1={H * g} y2={H * g} stroke="var(--ib-line)" />
          ))}
          <path d={area} fill={"url(#" + fill + ")"} />
          <path
            d={line}
            fill="none"
            stroke="#0066FF"
            strokeWidth="1.6"
            pathLength={1}
            className="ib-line-draw"
            opacity=".9"
          />
          <line
            x1={points[split][0]}
            x2={points[split][0]}
            y1="10"
            y2={H - 14}
            stroke="#0066FF"
            strokeOpacity="0.45"
            strokeDasharray="2 3"
          />
          <text x={points[split][0] - 4} y={H - 18} textAnchor="end" fontSize="7" fill="#0066FF" fontFamily="var(--ib-mono)" fontWeight="600">
            PREDICTED
          </text>
          {hover >= 0 && <line x1={p[0]} x2={p[0]} y1="8" y2={H - 14} stroke="#0066FF" strokeOpacity=".45" />}
          {!reduced && hover < 0 && <circle cx={last[0]} cy={last[1]} r="7" fill="#0066FF" opacity=".22" className="ib-glow" />}
          <circle cx={p[0]} cy={p[1]} r="3.4" fill="#ffffff" stroke="#0066FF" strokeWidth="2" />
          <g transform={"translate(" + clamp(p[0], 40, W - 40) + "," + (p[1] < 34 ? p[1] + 22 : p[1] - 12) + ")"}>
            <rect x="-30" y="-11" width="60" height="15" rx="3" fill="#0066FF" />
            <text x="0" y="-1" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontFamily="var(--ib-mono)" fontWeight="600">
              {(i >= split ? "pred " : "wk " + (i + 1) + " ") + (pct >= 0 ? "+" : "") + pct + "%"}
            </text>
          </g>
        </svg>
        <div style={{ marginTop: "auto" }}>
          <h3>{copy.title}</h3>
          <p>{copy.description}</p>
        </div>
      </div>
    </div>
  );
}

const IB_CSS = `
.ib-root{--ib-page:#ffffff;--ib-hatch:rgba(0,102,255,.03);--ib-paper:#ffffff;--ib-card:#f8fafc;--ib-raise:#ffffff;--ib-ink:#0f172a;--ib-soft:#334155;--ib-muted:#64748b;--ib-faint:#94a3b8;--ib-line:#e2e8f0;--ib-line-strong:#cbd5e1;--ib-bracket:#0066FF;--ib-inv:#0066FF;--ib-inv-ink:#ffffff;--ib-shadow:0 1px 3px rgba(0,0,0,.04),0 10px 30px -10px rgba(0,102,255,.08);--ib-sans:"Poppins","Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--ib-mono:"JetBrains Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace;position:relative;width:100%;box-sizing:border-box;background-color:transparent;color:var(--ib-ink);font-family:var(--ib-sans);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased;padding:0;transition:background-color .3s ease,color .3s ease}
.ib-root[data-theme="dark"], :is(.dark) .ib-root, html.dark .ib-root, body.dark .ib-root{--ib-page:#09090b;--ib-hatch:rgba(0,102,255,.04);--ib-paper:#0e0e11;--ib-card:#141418;--ib-raise:#1a1a20;--ib-ink:#f8fafc;--ib-soft:#cbd5e1;--ib-muted:#94a3b8;--ib-faint:#64748b;--ib-line:#23232a;--ib-line-strong:#32323c;--ib-bracket:#0066FF;--ib-inv:#0066FF;--ib-inv-ink:#ffffff;--ib-shadow:0 1px 3px rgba(0,0,0,.4),0 12px 32px -12px rgba(0,102,255,.2)}
html:not(.dark) .ib-root[data-theme="auto"], body:not(.dark) .ib-root[data-theme="auto"]{--ib-page:#ffffff;--ib-hatch:rgba(0,102,255,.03);--ib-paper:#ffffff;--ib-card:#f8fafc;--ib-raise:#ffffff;--ib-ink:#0f172a;--ib-soft:#334155;--ib-muted:#64748b;--ib-faint:#94a3b8;--ib-line:#e2e8f0;--ib-line-strong:#cbd5e1;--ib-bracket:#0066FF;--ib-inv:#0066FF;--ib-inv-ink:#ffffff;--ib-shadow:0 1px 3px rgba(0,0,0,.04),0 10px 30px -10px rgba(0,102,255,.08)}
.ib-root :where(*){box-sizing:border-box}
.ib-root :focus-visible{outline:2px solid #0066FF;outline-offset:2px}
.ib-root :where(svg){display:block;max-width:none;flex:none}
.ib-root :where(h2,h3,p){margin:0;padding:0;font-size:inherit;font-weight:inherit}
.ib-shell{width:100%;max-width:100%;margin:0 auto;container-type:inline-size}
.ib-sec{position:relative;background:transparent;border:none;border-radius:0;padding:0;box-shadow:none;transition:none}
.ib-reveal{opacity:0;transform:translate3d(0,18px,0) scale(0.99);transition:opacity .45s cubic-bezier(.16,1,.3,1),transform .45s cubic-bezier(.16,1,.3,1)}
.ib-reveal[data-in="true"]{opacity:1;transform:translate3d(0,0,0) scale(1)}
.ib-head{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;margin-bottom:clamp(28px,4.5cqw,52px)}
.ib-tag{display:inline-flex;align-items:center;padding:5px 14px;font-size:12px;font-weight:600;letter-spacing:.02em;color:#0066FF;background:rgba(0,102,255,.08);border:1px solid rgba(0,102,255,.22);border-radius:9999px;opacity:0;transform:translate3d(0,-10px,0) scale(0.97);transition:opacity .4s cubic-bezier(.16,1,.3,1),transform .4s cubic-bezier(.16,1,.3,1)}
.ib-reveal[data-in="true"] .ib-tag{opacity:1;transform:translate3d(0,0,0) scale(1)}
.ib-h2{font-size:clamp(28px,4.2cqw,46px);line-height:1.1;letter-spacing:-.03em;font-weight:700;opacity:0;transform:translate3d(0,20px,0) scale(0.98);transition:opacity .45s cubic-bezier(.16,1,.3,1) .04s,transform .45s cubic-bezier(.16,1,.3,1) .04s}
.ib-reveal[data-in="true"] .ib-h2{opacity:1;transform:translate3d(0,0,0) scale(1)}
.ib-h2>span{display:block}
.ib-muted{color:var(--ib-faint)}
.ib-frame{position:relative}
.ib-c{position:absolute;width:12px;height:12px;border-color:rgba(0,102,255,.35);border-style:solid;border-width:0;pointer-events:none;transition:border-color .3s,transform .35s cubic-bezier(.2,.8,.2,1)}
.ib-c-tl{top:-6px;left:-6px;border-top-width:1.5px;border-left-width:1.5px}
.ib-c-tr{top:-6px;right:-6px;border-top-width:1.5px;border-right-width:1.5px}
.ib-c-bl{bottom:-6px;left:-6px;border-bottom-width:1.5px;border-left-width:1.5px}
.ib-c-br{bottom:-6px;right:-6px;border-bottom-width:1.5px;border-right-width:1.5px}
.ib-frame-hover:hover>.ib-c{border-color:#0066FF}
.ib-frame-hover:hover>.ib-c-tl{transform:translate(-3px,-3px)}
.ib-frame-hover:hover>.ib-c-tr{transform:translate(3px,-3px)}
.ib-frame-hover:hover>.ib-c-bl{transform:translate(-3px,3px)}
.ib-frame-hover:hover>.ib-c-br{transform:translate(3px,3px)}
.ib-bento{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(20px,2.5cqw,28px);width:100%}
@container (min-width:720px){.ib-bento{grid-template-columns:repeat(2,minmax(0,1fr))}.ib-wide{grid-column:1 / -1;width:100%;justify-self:stretch}}
.ib-bento>.ib-frame{opacity:0;transform:translate3d(0,16px,0);transition:opacity .42s cubic-bezier(.16,1,.3,1),transform .42s cubic-bezier(.16,1,.3,1)}
.ib-reveal[data-in="true"] .ib-bento>.ib-frame{opacity:1;transform:translate3d(0,0,0)}
.ib-reveal[data-in="true"] .ib-bento>.ib-frame:nth-child(1){transition-delay:0.03s}
.ib-reveal[data-in="true"] .ib-bento>.ib-frame:nth-child(2){transition-delay:0.06s}
.ib-reveal[data-in="true"] .ib-bento>.ib-frame:nth-child(3){transition-delay:0.09s}
.ib-card{background:linear-gradient(180deg,var(--ib-raise),var(--ib-card));border:1px solid var(--ib-line);border-radius:10px;padding:clamp(16px,2.2cqw,24px);display:flex;flex-direction:column;gap:14px;transition:border-color .3s,box-shadow .35s,background-color .3s}
.ib-card:hover{border-color:rgba(0,102,255,.45);box-shadow:var(--ib-shadow)}
.ib-card h3{font-size:15px;font-weight:700;letter-spacing:-.01em;color:var(--ib-ink)}
.ib-card p{font-size:13px;line-height:1.6;color:var(--ib-muted);max-width:44ch}
.ib-diagram{width:100%;height:auto;overflow:visible}
.ib-wide-copy{display:grid;grid-template-columns:1fr;gap:20px}
@container (min-width:560px){.ib-wide-copy{grid-template-columns:1fr 1fr}.ib-wide-copy>div:last-child{justify-self:end;text-align:left}}
.ib-flow{stroke:var(--ib-line-strong);fill:none;stroke-width:1.3;transition:stroke .3s}
.ib-flow-on{stroke:#0066FF;stroke-width:1.6}
.ib-dash{stroke-dasharray:3 4;animation:ib-dash 1.2s linear infinite}
.ib-pkt{fill:#0066FF}
.ib-root[data-active="false"] .ib-dash,.ib-root[data-active="false"] .ib-presence,.ib-root[data-active="false"] .ib-glow{animation-play-state:paused !important}
.ib-node{fill:var(--ib-raise);stroke:var(--ib-line-strong);transition:stroke .3s,transform .3s}
.ib-av{cursor:pointer;transition:transform .35s cubic-bezier(.2,.8,.2,1);transform-box:fill-box;transform-origin:center}
.ib-av:hover,.ib-av:focus-visible{transform:scale(1.18)}
.ib-av-tip{opacity:0;transition:opacity .2s;pointer-events:none}
.ib-av:hover .ib-av-tip,.ib-av:focus .ib-av-tip{opacity:1}
.ib-presence{animation:ib-pulse 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.ib-sheet{transition:transform .7s cubic-bezier(.2,.8,.2,1),opacity .7s}
.ib-sheet-new{animation:ib-sheet-in .7s cubic-bezier(.2,.8,.2,1) both}
.ib-tool{cursor:pointer;transition:transform .3s cubic-bezier(.2,.8,.2,1);transform-box:fill-box;transform-origin:center}
.ib-tool:hover,.ib-tool-on{transform:translateY(-2px)}
.ib-tool rect{transition:stroke .3s}
.ib-tool-on rect.ib-node{stroke:#0066FF}
.ib-chart{cursor:crosshair}
.ib-line-draw{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.8s cubic-bezier(.4,.1,.2,1)}
[data-in="true"] .ib-line-draw{stroke-dashoffset:0}
.ib-glow{animation:ib-pulse 2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes ib-dash{to{stroke-dashoffset:-14}}
@keyframes ib-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(1.35)}}
@keyframes ib-sheet-in{from{opacity:0;transform:translate(14px,-10px) rotate(4deg)}to{opacity:1;transform:none}}
.ib-bento>.ib-frame{display:flex;flex-direction:column}
.ib-bento>.ib-frame>.ib-card{flex:1}
@media (prefers-reduced-motion:reduce){
.ib-reveal{opacity:1;transform:none;transition:none}
.ib-dash,.ib-presence,.ib-glow,.ib-sheet-new{animation:none}
.ib-line-draw{transition:none;stroke-dashoffset:0}
}
`;

export default InkOrbitFeatures;
