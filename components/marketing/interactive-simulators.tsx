"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  RotateCcw,
  Plus,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  EyeOff,
  ArrowLeft,
  KeyRound,
} from "lucide-react";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ============================================================================
// 1. INTERACTIVE SMART EDGE ROUTING SWITCHBOARD
// ============================================================================
type RoutingPresetId = "ios" | "android" | "fr" | "ab";

interface RoutingPreset {
  id: RoutingPresetId;
  buttonLabel: string;
  tag: string;
  condition: string;
  target: string;
  latency: string;
  pop: string;
  wireIndex: number; // 0, 1, or 2
}

const ROUTING_PRESETS: RoutingPreset[] = [
  {
    id: "ios",
    buttonLabel: "iPhone · iOS",
    tag: "Device",
    condition: "iPhone (iOS 18)",
    target: "apps.apple.com/your-app",
    latency: "10.8ms",
    pop: "IAD · Ashburn",
    wireIndex: 0,
  },
  {
    id: "android",
    buttonLabel: "Android",
    tag: "OS",
    condition: "Android 15",
    target: "play.google.com/your-app",
    latency: "11.2ms",
    pop: "FRA · Frankfurt",
    wireIndex: 1,
  },
  {
    id: "fr",
    buttonLabel: "France · FR",
    tag: "Country",
    condition: "France (ISO FR)",
    target: "fr.yoursite.com/offer",
    latency: "9.4ms",
    pop: "CDG · Paris",
    wireIndex: 2,
  },
  {
    id: "ab",
    buttonLabel: "A/B Split 50/50",
    tag: "Split",
    condition: "Weighted Variant B (50%)",
    target: "fr.yoursite.com/offer?v=b",
    latency: "11.4ms",
    pop: "LHR · London",
    wireIndex: 2,
  },
];

export function SmartRoutingSwitchboard() {
  const [selectedId, setSelectedId] = useState<RoutingPresetId>("ios");
  const active =
    ROUTING_PRESETS.find((r) => r.id === selectedId) || ROUTING_PRESETS[0];

  const nodes = [
    {
      idx: 0,
      tag: "Device",
      cond: "iPhone (iOS)",
      dest: "apps.apple.com/your-app",
      pathD: "M 0 110 C 48 110, 52 34, 110 34",
    },
    {
      idx: 1,
      tag: "OS",
      cond: "Android",
      dest: "play.google.com/your-app",
      pathD: "M 0 110 C 55 110, 55 110, 110 110",
    },
    {
      idx: 2,
      tag: active.id === "ab" ? "A/B 50%" : "Country",
      cond: active.id === "ab" ? "Variant B (50%)" : "France (FR)",
      dest: active.id === "ab" ? "fr.yoursite.com/offer?v=b" : "fr.yoursite.com/offer",
      pathD: "M 0 110 C 48 110, 52 186, 110 186",
    },
  ];

  return (
    <div className="mt-5 rounded-[10px] border border-[#E4E7EC] dark:border-white/[0.09] bg-[#F7F8FA] dark:bg-[#09090B] overflow-hidden">
      {/* Interactive Visitor Simulator Controls */}
      <div className="px-3.5 py-2.5 border-b border-[#E4E7EC] dark:border-white/[0.08] bg-white dark:bg-[#111217] flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#667085] dark:text-zinc-400">
          Simulate visitor:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {ROUTING_PRESETS.map((preset) => {
            const isSelected = preset.id === selectedId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedId(preset.id)}
                className={`px-2.5 py-1 rounded-[6px] font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0066FF] text-white shadow-[0_2px_10px_rgba(0,102,255,0.35)]"
                    : "bg-[#F7F8FA] dark:bg-white/[0.05] text-[#475467] dark:text-zinc-300 border border-[#E4E7EC] dark:border-white/10 hover:border-[#0066FF]/50"
                }`}
              >
                {preset.buttonLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Switchboard Circuit */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-[148px_88px_1fr] items-center gap-3 sm:gap-0">
          {/* Source Node */}
          <div className="px-3.5 py-3 rounded-[8px] bg-[#0066FF] text-white shadow-[0_8px_22px_rgba(0,102,255,0.34)] flex flex-col justify-center">
            <span className="font-mono text-[9.5px] uppercase tracking-wider text-blue-100">
              Entry Link
            </span>
            <span className="font-mono text-[13px] font-bold mt-0.5">
              lsho.cc/app
            </span>
          </div>

          {/* Animated SVG Bezier Switchboard Wires (Desktop/Tablet SM+) */}
          <div className="hidden sm:block w-full h-[220px] -mx-px">
            <svg
              viewBox="0 0 110 220"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
              aria-hidden="true"
            >
              {nodes.map((node) => {
                const isActive = node.idx === active.wireIndex;
                return (
                  <g key={node.idx}>
                    <path
                      d={node.pathD}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={isActive ? 2.2 : 1.25}
                      className={
                        isActive
                          ? "text-[#0066FF]"
                          : "text-[#D0D5DD] dark:text-white/15"
                      }
                    />
                    {isActive && (
                      <motion.path
                        key={`pulse-${selectedId}-${node.idx}`}
                        d={node.pathD}
                        fill="none"
                        stroke="#5294FF"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeDasharray="16 140"
                        initial={{ strokeDashoffset: 156 }}
                        animate={{ strokeDashoffset: -156 }}
                        transition={{
                          duration: 1.15,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Destination Nodes */}
          <div className="space-y-2.5">
            {nodes.map((node) => {
              const isActive = node.idx === active.wireIndex;
              return (
                <div
                  key={node.idx}
                  className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-[8px] border transition-all duration-200 text-[12px] ${
                    isActive
                      ? "bg-white dark:bg-[#131620] border-[#0066FF] shadow-[0_4px_16px_rgba(0,102,255,0.14)]"
                      : "bg-white/60 dark:bg-[#121318] border-[#E4E7EC] dark:border-white/[0.07] opacity-65"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#101828] dark:text-white">
                    <span
                      className={`px-1.5 py-0.5 rounded-[4px] font-mono text-[10px] font-bold uppercase ${
                        isActive
                          ? "bg-[#0066FF] text-white"
                          : "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]"
                      }`}
                    >
                      {node.tag}
                    </span>
                    <span>{node.cond}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] truncate">
                    <ArrowRight
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-[#0066FF]" : "text-[#98A2B3]"
                      }`}
                    />
                    <span
                      className={`truncate font-semibold ${
                        isActive
                          ? "text-[#0066FF] dark:text-[#5294FF]"
                          : "text-[#667085] dark:text-zinc-400"
                      }`}
                    >
                      {node.dest}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Telemetry Readout Strip */}
        <div className="mt-4 pt-3 border-t border-[#E4E7EC] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
          <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>
              HTTP 302 · {active.latency} · {active.pop}
            </span>
          </span>
          <span className="text-[#667085] dark:text-zinc-400 truncate">
            Matched: <strong className="text-[#101828] dark:text-white">{active.condition}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. INTERACTIVE CLICK CAP TRIGGER (23/25 -> 25/25 CAP REACHED)
// ============================================================================
export function ClickCapSimulator() {
  const MAX_CLICKS = 25;
  const [clicks, setClicks] = useState(23);
  const isCapReached = clicks >= MAX_CLICKS;
  const pct = Math.min(100, Math.round((clicks / MAX_CLICKS) * 100));

  return (
    <div className="mt-auto pt-5">
      <div className="rounded-[10px] p-4 bg-[#F7F8FA] dark:bg-[#09090B] border border-[#E4E7EC] dark:border-white/[0.09]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <div className="font-mono text-[12px] font-bold text-[#101828] dark:text-white">
              lsho.cc/private-beta
            </div>
            <div className="font-mono text-[10.5px] text-[#667085] dark:text-zinc-400 mt-0.5 tabular-nums">
              {clicks} / {MAX_CLICKS} clicks recorded
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded-[5px] font-mono text-[10.5px] font-bold uppercase tracking-wider transition-colors ${
              isCapReached
                ? "bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/12 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isCapReached ? "CAP REACHED → /waitlist" : "ACTIVE"}
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-[#E4E7EC] dark:bg-white/10 overflow-hidden">
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
            className={`h-full rounded-full transition-colors ${
              isCapReached ? "bg-amber-500" : "bg-[#0066FF]"
            }`}
          />
        </div>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-[#667085] dark:text-zinc-400">
            {isCapReached
              ? "Auto-rerouting traffic to /waitlist"
              : `${MAX_CLICKS - clicks} ${MAX_CLICKS - clicks === 1 ? "spot" : "spots"} before fallback`}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isCapReached}
              onClick={() => setClicks((c) => Math.min(MAX_CLICKS, c + 1))}
              className={`px-2.5 py-1 rounded-[6px] font-mono text-[11px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer ${
                isCapReached
                  ? "bg-zinc-200 dark:bg-white/[0.06] text-zinc-400 cursor-not-allowed"
                  : "bg-[#0066FF] hover:bg-[#0055D4] text-white shadow-[0_2px_10px_rgba(0,102,255,0.3)] active:scale-95"
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>+1 Click</span>
            </button>
            <button
              type="button"
              onClick={() => setClicks(23)}
              aria-label="Reset click cap simulator"
              className="p-1.5 rounded-[6px] border border-[#E4E7EC] dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#667085] dark:text-zinc-400 hover:text-[#101828] dark:hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. INTERACTIVE DYNAMIC VECTOR QR STUDIO (CYBER BLUE #0066FF, ZERO ORANGE/FRENCH)
// ============================================================================
type QrStyleMode = "squares" | "dots" | "rounded" | "diamonds";

const QR_MATRIX: number[][] = [
  [1,1,1,1,1,1,1,0,1,0,1,1,0,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,1,1,0,1,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,1,0,1,0,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,1,1,1,0,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,1,0,0,1,1,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0],
  [1,1,0,1,1,0,1,1,0,1,0,1,1,1,0,1,1,0,1,0,1],
  [0,1,1,0,1,1,0,0,1,0,1,0,0,1,1,0,0,1,0,1,0],
  [1,0,1,1,0,0,1,1,1,1,0,1,1,0,1,0,1,1,0,1,1],
  [0,1,0,1,1,1,0,0,0,1,1,0,1,1,0,1,0,0,1,0,0],
  [1,1,1,0,0,1,1,1,1,0,1,1,0,0,1,1,1,0,1,1,1],
  [0,0,0,0,0,0,0,0,1,0,0,1,1,0,1,0,1,0,0,1,0],
  [1,1,1,1,1,1,1,0,0,1,1,0,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,1,0,1,1,0,1,0,0,1,0,1,0,1,1,0],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,1,0,1,0,0,1],
  [1,0,1,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,1,0],
  [1,0,1,1,1,0,1,0,1,1,1,0,0,1,1,0,0,1,1,0,1],
  [1,0,0,0,0,0,1,0,1,0,1,1,0,1,0,1,1,0,0,1,0],
  [1,1,1,1,1,1,1,0,0,1,0,1,1,0,1,0,1,1,1,0,1],
];

function isFinderCell(r: number, c: number): boolean {
  return (r < 7 && c < 7) || (r < 7 && c >= 14) || (r >= 14 && c < 7);
}

export function DynamicQrStudioCard() {
  const [styleMode, setStyleMode] = useState<QrStyleMode>("rounded");

  const modes: { id: QrStyleMode; label: string }[] = [
    { id: "squares", label: "Squares" },
    { id: "dots", label: "Dots" },
    { id: "rounded", label: "Rounded" },
    { id: "diamonds", label: "Diamonds" },
  ];

  const finderCorners = [
    { r: 0, c: 0 },
    { r: 0, c: 14 },
    { r: 14, c: 0 },
  ];

  return (
    <div className="mt-auto pt-5">
      <div className="rounded-[10px] border border-[#E4E7EC] dark:border-white/[0.09] bg-[#F7F8FA] dark:bg-[#09090B] p-4">
        {/* Style Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3.5 border-b border-[#E4E7EC] dark:border-white/[0.08]">
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#667085] dark:text-zinc-400">
            Pixel geometry
          </span>
          <div className="flex items-center gap-1">
            {modes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setStyleMode(m.id)}
                className={`px-2 py-0.5 rounded-[5px] font-mono text-[10.5px] font-semibold transition-colors cursor-pointer ${
                  styleMode === m.id
                    ? "bg-[#0066FF] text-white"
                    : "bg-white dark:bg-white/[0.05] text-[#475467] dark:text-zinc-300 border border-[#E4E7EC] dark:border-white/10 hover:border-[#0066FF]/50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Vector Cyber Blue QR Preview */}
          <div className="p-2.5 rounded-[8px] bg-white border border-[#E4E7EC] shadow-xs shrink-0">
            <svg
              viewBox="0 0 21 21"
              className="w-24 h-24 sm:w-28 sm:h-28 block"
              role="img"
              aria-label="Dynamic Cyber Blue SVG QR Code Preview"
            >
              {/* Crisp Finder Eyes */}
              {finderCorners.map((fc, idx) => (
                <g key={idx}>
                  <rect
                    x={fc.c + 0.2}
                    y={fc.r + 0.2}
                    width={6.6}
                    height={6.6}
                    rx={styleMode === "squares" ? 0 : styleMode === "dots" ? 2.2 : 1.2}
                    fill="none"
                    stroke="#0066FF"
                    strokeWidth="0.95"
                  />
                  <rect
                    x={fc.c + 2}
                    y={fc.r + 2}
                    width={3}
                    height={3}
                    rx={styleMode === "squares" ? 0 : styleMode === "dots" ? 1.5 : 0.6}
                    fill="#09090B"
                  />
                </g>
              ))}

              {/* Data Modules */}
              {QR_MATRIX.map((row, r) =>
                row.map((val, c) => {
                  if (!val || isFinderCell(r, c)) return null;
                  const fill = (r + c) % 5 === 0 ? "#0066FF" : "#09090B";

                  if (styleMode === "dots") {
                    return (
                      <circle
                        key={`${r}-${c}`}
                        cx={c + 0.5}
                        cy={r + 0.5}
                        r={0.39}
                        fill={fill}
                      />
                    );
                  }
                  if (styleMode === "diamonds") {
                    const cx = c + 0.5;
                    const cy = r + 0.5;
                    return (
                      <polygon
                        key={`${r}-${c}`}
                        points={`${cx},${cy - 0.44} ${cx + 0.44},${cy} ${cx},${cy + 0.44} ${cx - 0.44},${cy}`}
                        fill={fill}
                      />
                    );
                  }
                  return (
                    <rect
                      key={`${r}-${c}`}
                      x={c + 0.08}
                      y={r + 0.08}
                      width={0.84}
                      height={0.84}
                      rx={styleMode === "rounded" ? 0.28 : 0}
                      fill={fill}
                    />
                  );
                })
              )}
            </svg>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#0066FF] dark:text-[#5294FF] font-bold">
                Dynamic Target · Editable
              </div>
              <div className="font-mono text-[13px] font-bold text-[#101828] dark:text-white truncate mt-0.5">
                lsho.cc/launch
              </div>
            </div>
            <p className="text-[11.5px] text-[#667085] dark:text-zinc-400 leading-snug">
              Swap destination URLs anytime without reprinting packaging or event slides.
            </p>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#475467] dark:text-zinc-300">
              <span className="px-1.5 py-0.5 rounded-[4px] bg-white dark:bg-white/[0.06] border border-[#E4E7EC] dark:border-white/10">
                SVG
              </span>
              <span className="px-1.5 py-0.5 rounded-[4px] bg-white dark:bg-white/[0.06] border border-[#E4E7EC] dark:border-white/10">
                PNG
              </span>
              <span className="px-1.5 py-0.5 rounded-[4px] bg-white dark:bg-white/[0.06] border border-[#E4E7EC] dark:border-white/10">
                GIF
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. INTERACTIVE PIN GATE & DESTINATION MASKING ARTIFACT
// ============================================================================
export function PinGateMaskingCard() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div className="mt-auto pt-5 space-y-2.5">
      {/* Interactive 4-Dot PIN Challenge Bar */}
      <div className="rounded-[8px] p-3.5 bg-[#F7F8FA] dark:bg-[#09090B] border border-[#E4E7EC] dark:border-white/[0.09] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5">
            {["1", "3", "3", "7"].map((digit, i) => (
              <span
                key={i}
                className={`w-7 h-8 rounded-[6px] border font-mono text-[12px] font-bold flex items-center justify-center transition-colors ${
                  unlocked
                    ? "bg-emerald-500/12 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                    : "bg-white dark:bg-[#14151B] border-[#D0D5DD] dark:border-white/14 text-[#101828] dark:text-white"
                }`}
              >
                {unlocked ? digit : "•"}
              </span>
            ))}
          </div>
          <span className="font-mono text-[10.5px] text-[#667085] dark:text-zinc-400 truncate hidden sm:inline">
            {unlocked ? "Target revealed" : "PIN protected"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setUnlocked((u) => !u)}
          className={`px-2.5 py-1 rounded-[6px] font-mono text-[10.5px] font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer shrink-0 ${
            unlocked
              ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-400"
              : "bg-white dark:bg-white/[0.06] border-[#D0D5DD] dark:border-white/12 text-[#101828] dark:text-white hover:border-[#0066FF]"
          }`}
        >
          {unlocked ? (
            <>
              <Unlock className="w-3 h-3" />
              <span>Unlocked</span>
            </>
          ) : (
            <>
              <Lock className="w-3 h-3 text-[#0066FF]" />
              <span>Preview PIN</span>
            </>
          )}
        </button>
      </div>

      {/* Masked OpenGraph + Zero-Referrer Strip */}
      <div className="rounded-[8px] px-3.5 py-2.5 bg-[#F7F8FA] dark:bg-[#09090B] border border-[#E4E7EC] dark:border-white/[0.09] flex items-center justify-between gap-2 text-[11.5px]">
        <div className="flex items-center gap-2 min-w-0">
          <EyeOff className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
          <span className="font-mono text-[#101828] dark:text-zinc-200 font-semibold truncate">
            {unlocked
              ? "notion.so/acme/q4-investor-deck"
              : "go.yourbrand.io/pitch"}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0">
          Zero-Referrer ON
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// 5. LIVE INTERACTIVE PATHLOCK™ BROWSER PERIMETER SIMULATOR (100% ENGLISH)
// ============================================================================
type PathTestRoute =
  | "/app/dashboard/overview"
  | "/app/dashboard/metrics"
  | "/admin/billing"
  | "/settings/api-keys";

interface RouteOption {
  path: PathTestRoute;
  label: string;
  allowed: boolean;
}

const PATH_OPTIONS: RouteOption[] = [
  { path: "/app/dashboard/overview", label: "/app/dashboard/overview", allowed: true },
  { path: "/app/dashboard/metrics", label: "/app/dashboard/metrics", allowed: true },
  { path: "/admin/billing", label: "/admin/billing", allowed: false },
  { path: "/settings/api-keys", label: "/settings/api-keys", allowed: false },
];

export function PathLockInteractiveSimulator() {
  const [currentPath, setCurrentPath] = useState<PathTestRoute>("/admin/billing");
  const [teamUnlocked, setTeamUnlocked] = useState(false);
  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const [pinAttempt, setPinAttempt] = useState("");

  const activeRoute =
    PATH_OPTIONS.find((r) => r.path === currentPath) || PATH_OPTIONS[2];
  const isBlocked = !activeRoute.allowed && !teamUnlocked;

  const handleSelectRoute = (path: PathTestRoute) => {
    setCurrentPath(path);
    setShowUnlockForm(false);
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamUnlocked(true);
    setShowUnlockForm(false);
    setPinAttempt("");
  };

  return (
    <div className="rounded-[10px] border border-white/15 bg-[#0D0E13] shadow-[0_28px_80px_rgba(0,0,0,0.75)] overflow-hidden">
      {/* Interactive Route Test Selector Bar */}
      <div className="px-4 py-2.5 bg-[#13151C] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400">
          Test perimeter route:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {PATH_OPTIONS.map((opt) => {
            const selected = opt.path === currentPath;
            return (
              <button
                key={opt.path}
                type="button"
                onClick={() => handleSelectRoute(opt.path)}
                className={`px-2.5 py-1 rounded-[6px] font-mono text-[11px] font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  selected
                    ? opt.allowed || teamUnlocked
                      ? "bg-emerald-500 text-zinc-950"
                      : "bg-red-500 text-white"
                    : "bg-white/[0.05] text-zinc-300 border border-white/10 hover:border-white/25"
                }`}
              >
                <span>{opt.allowed ? "✓" : "✕"}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Browser Address Bar */}
      <div className="px-4 py-2.5 bg-[#0B0C10] border-b border-white/[0.08] flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        </div>

        <div className="flex-1 min-w-0 px-3 py-1 rounded-[6px] bg-[#14161D] border border-white/[0.08] font-mono text-[11.5px] text-zinc-300 flex items-center justify-between gap-2">
          <span className="truncate">
            <span className="text-zinc-500">https://demo.acmesaas.io</span>
            <span className={isBlocked ? "text-red-400 font-semibold" : "text-[#5294FF] font-semibold"}>
              {currentPath}
            </span>
          </span>
          <span
            className={`shrink-0 font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-[4px] ${
              isBlocked
                ? "bg-red-500/15 text-red-400"
                : "bg-emerald-500/15 text-emerald-400"
            }`}
          >
            {isBlocked ? "403 BLOCKED" : "200 ALLOWED"}
          </span>
        </div>

        {teamUnlocked && (
          <button
            type="button"
            onClick={() => setTeamUnlocked(false)}
            className="shrink-0 font-mono text-[10.5px] text-zinc-400 hover:text-white border border-white/10 rounded-[5px] px-2 py-1 cursor-pointer"
          >
            Re-lock
          </button>
        )}
      </div>

      {/* Browser Viewport Body */}
      <div className="relative min-h-[300px] sm:min-h-[330px] bg-[#09090B] p-5 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {isBlocked ? (
            <motion.div
              key="blocked-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
              className="m-auto w-full max-w-[460px] rounded-[10px] border border-red-500/35 bg-[#111217] p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
            >
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-red-500/12 border border-red-500/30 font-mono text-[10.5px] font-bold uppercase tracking-wider text-red-400 mb-4">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>OUT-OF-PERIMETER ACCESS BLOCKED</span>
              </div>

              <h4 className="text-[18px] sm:text-[20px] font-bold tracking-tight text-white">
                Navigation restricted by link creator
              </h4>
              <p className="mt-2 text-[13px] text-zinc-400 leading-relaxed">
                This preview link is scoped exclusively to the authorized path
                prefix below. Direct navigation to{" "}
                <code className="text-red-400 font-mono">{currentPath}</code>{" "}
                was intercepted by PathLock™.
              </p>

              <div className="mt-4 px-3 py-2 rounded-[6px] bg-[#09090B] border border-white/[0.08] font-mono text-[11.5px] text-zinc-300 flex items-center justify-between gap-2">
                <span className="text-zinc-500">Authorized perimeter:</span>
                <span className="text-[#5294FF] font-semibold">
                  /app/dashboard/*
                </span>
              </div>

              {!showUnlockForm ? (
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectRoute("/app/dashboard/overview")}
                    className="w-full sm:w-auto px-4 py-2 rounded-[8px] bg-[#0066FF] hover:bg-[#0055D4] text-white text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to /app/dashboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUnlockForm(true)}
                    className="w-full sm:w-auto px-4 py-2 rounded-[8px] bg-white/[0.06] hover:bg-white/[0.11] border border-white/12 text-zinc-200 text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#5294FF]" />
                    <span>Team / Dev Unlock</span>
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleUnlockSubmit}
                  className="mt-4 flex flex-col sm:flex-row items-stretch gap-2"
                >
                  <input
                    type="password"
                    value={pinAttempt}
                    onChange={(e) => setPinAttempt(e.target.value)}
                    placeholder="Enter team unlock key (demo)..."
                    aria-label="Enter team unlock key"
                    className="flex-1 h-9 px-3 rounded-[6px] bg-[#09090B] border border-white/15 text-[12px] text-white placeholder:text-zinc-500 outline-none focus:border-[#0066FF]"
                  />
                  <button
                    type="submit"
                    className="h-9 px-3.5 rounded-[6px] bg-[#0066FF] hover:bg-[#0055D4] text-white text-[12px] font-semibold cursor-pointer shrink-0"
                  >
                    Unlock Full Access
                  </button>
                </form>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`allowed-${currentPath}-${teamUnlocked}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
                <div>
                  <div className="inline-flex items-center gap-1.5 font-mono text-[10.5px] text-emerald-400 uppercase tracking-wider font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {teamUnlocked
                        ? "TEAM OVERRIDE ACTIVE · FULL ACCESS"
                        : "INSIDE AUTHORIZED PERIMETER · /APP/DASHBOARD/*"}
                    </span>
                  </div>
                  <h4 className="mt-1 text-[17px] font-bold text-white">
                    {currentPath === "/app/dashboard/metrics"
                      ? "Workspace Telemetry Metrics"
                      : currentPath === "/admin/billing"
                        ? "Admin Billing & Payouts (Team Unlocked)"
                        : currentPath === "/settings/api-keys"
                          ? "API Keys & Secrets (Team Unlocked)"
                          : "SaaS Product Staging Overview"}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-[6px] bg-[#0066FF]/15 border border-[#0066FF]/35 font-mono text-[11px] text-[#5294FF]">
                  PathLock™ Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
                {[
                  { k: "Active Workspace", v: "Acme SaaS Staging" },
                  { k: "Session TTL", v: "24h · 25 max clicks" },
                  { k: "Blocked Escape Attempts", v: "03 intercepted" },
                ].map((stat) => (
                  <div
                    key={stat.k}
                    className="p-3.5 rounded-[8px] bg-[#111217] border border-white/[0.08]"
                  >
                    <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      {stat.k}
                    </div>
                    <div className="mt-1 text-[13.5px] font-semibold text-white">
                      {stat.v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/[0.08] font-mono text-[11px] text-zinc-400">
                <span>
                  Try clicking{" "}
                  <button
                    type="button"
                    onClick={() => handleSelectRoute("/admin/billing")}
                    className="text-red-400 underline hover:text-red-300 cursor-pointer"
                  >
                    /admin/billing
                  </button>{" "}
                  above to trigger PathLock™ interception.
                </span>
                <span className="inline-flex items-center gap-1.5 text-zinc-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#5294FF]" />
                  <span>Zero-config edge guard</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
