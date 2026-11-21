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
  wireIndex: number;
}

const ROUTING_PRESETS: RoutingPreset[] = [
  {
    id: "ios",
    buttonLabel: "iPhone (iOS)",
    tag: "Device",
    condition: "iPhone (iOS 18)",
    target: "apps.apple.com/your-app",
    latency: "10.8 ms",
    pop: "IAD Ashburn",
    wireIndex: 0,
  },
  {
    id: "android",
    buttonLabel: "Android",
    tag: "OS",
    condition: "Android 15",
    target: "play.google.com/your-app",
    latency: "11.2 ms",
    pop: "FRA Frankfurt",
    wireIndex: 1,
  },
  {
    id: "fr",
    buttonLabel: "France",
    tag: "Country",
    condition: "France (FR)",
    target: "fr.yoursite.com/offer",
    latency: "9.4 ms",
    pop: "CDG Paris",
    wireIndex: 2,
  },
  {
    id: "ab",
    buttonLabel: "A/B split 50/50",
    tag: "Split",
    condition: "Variant B (50%)",
    target: "fr.yoursite.com/offer?v=b",
    latency: "11.4 ms",
    pop: "LHR London",
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
      pathD: "M 0 105 C 48 105, 52 32, 110 32",
    },
    {
      idx: 1,
      tag: "OS",
      cond: "Android",
      dest: "play.google.com/your-app",
      pathD: "M 0 105 C 55 105, 55 105, 110 105",
    },
    {
      idx: 2,
      tag: active.id === "ab" ? "A/B 50%" : "Country",
      cond: active.id === "ab" ? "Variant B (50%)" : "France (FR)",
      dest:
        active.id === "ab"
          ? "fr.yoursite.com/offer?v=b"
          : "fr.yoursite.com/offer",
      pathD: "M 0 105 C 48 105, 52 178, 110 178",
    },
  ];

  return (
    <div className="mt-6 rounded-[10px] bg-[#F8F9FB] dark:bg-[#09090B] border border-[#E4E7EC] dark:border-white/[0.08] overflow-hidden">
      {/* Visitor Controls */}
      <div className="px-4 py-2.5 border-b border-[#E4E7EC] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-[#71717A] dark:text-zinc-400">
          Simulate visitor
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {ROUTING_PRESETS.map((preset) => {
            const isSelected = preset.id === selectedId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedId(preset.id)}
                className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition-colors duration-150 cursor-pointer ${
                  isSelected
                    ? "bg-[#0066FF] text-white"
                    : "bg-white dark:bg-white/[0.05] text-[#52525B] dark:text-zinc-300 border border-[#E4E7EC] dark:border-white/[0.10] hover:border-[#0066FF]/50"
                }`}
              >
                {preset.buttonLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Routing Diagram */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-[144px_84px_1fr] items-center gap-3 sm:gap-0">
          <div className="px-3.5 py-3 rounded-[8px] bg-[#0066FF] text-white flex flex-col justify-center">
            <span className="text-[11px] text-blue-100">Short link</span>
            <span className="font-mono text-[13px] font-semibold mt-0.5">
              lsho.cc/app
            </span>
          </div>

          <div className="hidden sm:block w-full h-[210px] -mx-px">
            <svg
              viewBox="0 0 110 210"
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
                      strokeWidth={isActive ? 2 : 1.2}
                      className={
                        isActive
                          ? "text-[#0066FF]"
                          : "text-[#D4D4D8] dark:text-white/15"
                      }
                    />
                    {isActive && (
                      <motion.path
                        key={`pulse-${selectedId}-${node.idx}`}
                        d={node.pathD}
                        fill="none"
                        stroke="#60A5FA"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeDasharray="14 140"
                        initial={{ strokeDashoffset: 154 }}
                        animate={{ strokeDashoffset: -154 }}
                        transition={{
                          duration: 1.2,
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

          <div className="space-y-2">
            {nodes.map((node) => {
              const isActive = node.idx === active.wireIndex;
              return (
                <div
                  key={node.idx}
                  className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-[8px] border transition-colors duration-150 text-[12.5px] ${
                    isActive
                      ? "bg-white dark:bg-[#141722] border-[#0066FF]"
                      : "bg-white/60 dark:bg-[#111216] border-[#E4E7EC] dark:border-white/[0.07] opacity-60"
                  }`}
                >
                  <span className="inline-flex items-center gap-2 font-medium text-[#09090B] dark:text-white">
                    <span
                      className={`px-1.5 py-0.5 rounded-[4px] text-[11px] font-medium ${
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
                        isActive ? "text-[#0066FF]" : "text-[#A1A1AA]"
                      }`}
                    />
                    <span
                      className={`truncate ${
                        isActive
                          ? "text-[#0066FF] dark:text-[#5294FF] font-medium"
                          : "text-[#71717A] dark:text-zinc-400"
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

        {/* Clean Telemetry Row */}
        <div className="mt-4 pt-3 border-t border-[#E4E7EC] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-[12px]">
          <span className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            HTTP 302 — {active.latency} ({active.pop})
          </span>
          <span className="text-[#71717A] dark:text-zinc-400 truncate">
            Matched:{" "}
            <strong className="font-medium text-[#09090B] dark:text-white">
              {active.condition}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. INTERACTIVE CLICK CAP TRIGGER (60fps scaleX progress bar)
// ============================================================================
export function ClickCapSimulator() {
  const MAX_CLICKS = 25;
  const [clicks, setClicks] = useState(23);
  const isCapReached = clicks >= MAX_CLICKS;
  const ratio = Math.min(1, clicks / MAX_CLICKS);

  return (
    <div className="mt-auto pt-6">
      <div className="rounded-[10px] p-4 bg-[#F8F9FB] dark:bg-[#09090B] border border-[#E4E7EC] dark:border-white/[0.08]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <div className="font-mono text-[13px] font-medium text-[#09090B] dark:text-white">
              lsho.cc/private-beta
            </div>
            <div className="text-[12px] text-[#71717A] dark:text-zinc-400 mt-0.5 tabular-nums">
              {clicks} of {MAX_CLICKS} clicks recorded
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded-[5px] text-[11.5px] font-medium transition-colors ${
              isCapReached
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                : "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
            }`}
          >
            {isCapReached ? "Redirecting to /waitlist" : "Active"}
          </span>
        </div>

        {/* Compositor-only scaleX bar (60fps-animation compliant) */}
        <div className="w-full h-2 rounded-full bg-[#E4E7EC] dark:bg-white/10 overflow-hidden">
          <motion.div
            animate={{ scaleX: ratio }}
            transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
            style={{ transformOrigin: "left center" }}
            className={`w-full h-full rounded-full transition-colors ${
              isCapReached ? "bg-amber-500" : "bg-[#0066FF]"
            }`}
          />
        </div>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12px] text-[#71717A] dark:text-zinc-400">
            {isCapReached
              ? "Cap reached — new visitors go to /waitlist"
              : `${MAX_CLICKS - clicks} ${MAX_CLICKS - clicks === 1 ? "click" : "clicks"} before fallback`}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isCapReached}
              onClick={() => setClicks((c) => Math.min(MAX_CLICKS, c + 1))}
              className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer ${
                isCapReached
                  ? "bg-zinc-200 dark:bg-white/[0.06] text-zinc-400 cursor-not-allowed"
                  : "bg-[#0066FF] hover:bg-[#0055D4] text-white active:scale-95"
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>Add click</span>
            </button>
            <button
              type="button"
              onClick={() => setClicks(23)}
              aria-label="Reset click cap simulator"
              className="p-1.5 rounded-[6px] border border-[#E4E7EC] dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#71717A] dark:text-zinc-400 hover:text-[#09090B] dark:hover:text-white transition-colors cursor-pointer"
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
// 3. INTERACTIVE DYNAMIC VECTOR QR STUDIO (#0066FF)
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
    <div className="mt-auto pt-6">
      <div className="rounded-[10px] border border-[#E4E7EC] dark:border-white/[0.08] bg-[#F8F9FB] dark:bg-[#09090B] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3.5 border-b border-[#E4E7EC] dark:border-white/[0.08]">
          <span className="text-[12px] font-medium text-[#71717A] dark:text-zinc-400">
            Pixel style
          </span>
          <div className="flex items-center gap-1">
            {modes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setStyleMode(m.id)}
                className={`px-2 py-0.5 rounded-[5px] text-[11.5px] font-medium transition-colors cursor-pointer ${
                  styleMode === m.id
                    ? "bg-[#0066FF] text-white"
                    : "bg-white dark:bg-white/[0.05] text-[#52525B] dark:text-zinc-300 border border-[#E4E7EC] dark:border-white/[0.10] hover:border-[#0066FF]/50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-[8px] bg-white border border-[#E4E7EC] shrink-0">
            <svg
              viewBox="0 0 21 21"
              className="w-24 h-24 sm:w-28 sm:h-28 block"
              role="img"
              aria-label="Dynamic Cyber Blue SVG QR Code Preview"
            >
              {finderCorners.map((fc, idx) => (
                <g key={idx}>
                  <rect
                    x={fc.c + 0.2}
                    y={fc.r + 0.2}
                    width={6.6}
                    height={6.6}
                    rx={
                      styleMode === "squares"
                        ? 0
                        : styleMode === "dots"
                          ? 2.2
                          : 1.2
                    }
                    fill="none"
                    stroke="#0066FF"
                    strokeWidth="0.95"
                  />
                  <rect
                    x={fc.c + 2}
                    y={fc.r + 2}
                    width={3}
                    height={3}
                    rx={
                      styleMode === "squares"
                        ? 0
                        : styleMode === "dots"
                          ? 1.5
                          : 0.6
                    }
                    fill="#09090B"
                  />
                </g>
              ))}

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
              <div className="text-[12px] font-medium text-[#0066FF] dark:text-[#5294FF]">
                Editable destination
              </div>
              <div className="font-mono text-[13.5px] font-medium text-[#09090B] dark:text-white truncate mt-0.5">
                lsho.cc/launch
              </div>
            </div>
            <p className="text-[12.5px] text-[#71717A] dark:text-zinc-400 leading-relaxed">
              Update the destination anytime without reprinting packaging or
              slides.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#52525B] dark:text-zinc-300">
              <span className="px-2 py-0.5 rounded-[5px] bg-white dark:bg-white/[0.06] border border-[#E4E7EC] dark:border-white/[0.08]">
                SVG
              </span>
              <span className="px-2 py-0.5 rounded-[5px] bg-white dark:bg-white/[0.06] border border-[#E4E7EC] dark:border-white/[0.08]">
                PNG
              </span>
              <span className="px-2 py-0.5 rounded-[5px] bg-white dark:bg-white/[0.06] border border-[#E4E7EC] dark:border-white/[0.08]">
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
// 4. INTERACTIVE PIN GATE & DESTINATION MASKING
// ============================================================================
export function PinGateMaskingCard() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div className="mt-auto pt-6 space-y-2.5">
      <div className="rounded-[8px] p-3.5 bg-[#F8F9FB] dark:bg-[#09090B] border border-[#E4E7EC] dark:border-white/[0.08] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5">
            {["1", "3", "3", "7"].map((digit, i) => (
              <span
                key={i}
                className={`w-7 h-8 rounded-[6px] border font-mono text-[12.5px] font-semibold flex items-center justify-center transition-colors ${
                  unlocked
                    ? "bg-emerald-500/12 border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                    : "bg-white dark:bg-[#14151B] border-[#D4D4D8] dark:border-white/14 text-[#09090B] dark:text-white"
                }`}
              >
                {unlocked ? digit : "•"}
              </span>
            ))}
          </div>
          <span className="text-[12px] text-[#71717A] dark:text-zinc-400 truncate hidden sm:inline">
            {unlocked ? "Target revealed" : "PIN protected"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setUnlocked((u) => !u)}
          className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium inline-flex items-center gap-1.5 border transition-colors cursor-pointer shrink-0 ${
            unlocked
              ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-700 dark:text-emerald-400"
              : "bg-white dark:bg-white/[0.06] border-[#D4D4D8] dark:border-white/12 text-[#09090B] dark:text-white hover:border-[#0066FF]"
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

      <div className="rounded-[8px] px-3.5 py-2.5 bg-[#F8F9FB] dark:bg-[#09090B] border border-[#E4E7EC] dark:border-white/[0.08] flex items-center justify-between gap-2 text-[12px]">
        <div className="flex items-center gap-2 min-w-0">
          <EyeOff className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
          <span className="font-mono text-[#09090B] dark:text-zinc-200 truncate">
            {unlocked
              ? "notion.so/acme/q4-investor-deck"
              : "go.yourbrand.io/pitch"}
          </span>
        </div>
        <span className="text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
          Zero-referrer on
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// 5. LIVE INTERACTIVE PATHLOCK™ PERIMETER SIMULATOR (CLEAN, NO FAKE OS CHROME)
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
    <div className="rounded-[10px] border border-white/[0.12] bg-[#111216] overflow-hidden">
      {/* Route Switcher */}
      <div className="px-4 py-3 bg-[#16181F] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-zinc-400">
          Test a route
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {PATH_OPTIONS.map((opt) => {
            const selected = opt.path === currentPath;
            return (
              <button
                key={opt.path}
                type="button"
                onClick={() => handleSelectRoute(opt.path)}
                className={`px-2.5 py-1 rounded-[6px] font-mono text-[11.5px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selected
                    ? opt.allowed || teamUnlocked
                      ? "bg-emerald-500 text-zinc-950"
                      : "bg-red-500 text-white"
                    : "bg-white/[0.05] text-zinc-300 border border-white/[0.08] hover:border-white/25"
                }`}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* URL Status Bar (Clean, zero fake OS dots) */}
      <div className="px-4 py-2.5 bg-[#0D0E12] border-b border-white/[0.08] flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 font-mono text-[12px] text-zinc-300 flex items-center justify-between gap-2">
          <span className="truncate">
            <span className="text-zinc-500">https://demo.acmesaas.io</span>
            <span
              className={
                isBlocked
                  ? "text-red-400 font-medium"
                  : "text-[#6CA8FF] font-medium"
              }
            >
              {currentPath}
            </span>
          </span>
          <span
            className={`shrink-0 font-mono text-[11px] font-medium px-2 py-0.5 rounded-[5px] ${
              isBlocked
                ? "bg-red-500/15 text-red-400"
                : "bg-emerald-500/15 text-emerald-400"
            }`}
          >
            {isBlocked ? "403 Blocked" : "200 Allowed"}
          </span>
        </div>

        {teamUnlocked && (
          <button
            type="button"
            onClick={() => setTeamUnlocked(false)}
            className="shrink-0 text-[12px] text-zinc-400 hover:text-white border border-white/10 rounded-[6px] px-2.5 py-1 cursor-pointer"
          >
            Re-lock
          </button>
        )}
      </div>

      {/* Live Preview Canvas */}
      <div className="relative min-h-[290px] sm:min-h-[310px] bg-[#0B0C0F] p-5 sm:p-6 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {isBlocked ? (
            <motion.div
              key="blocked-state"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
              className="m-auto w-full max-w-[440px] rounded-[10px] border border-red-500/30 bg-[#121318] p-6 text-center"
            >
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-red-500/12 text-[12px] font-medium text-red-400 mb-3.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Path restricted by PathLock™</span>
              </div>

              <h4 className="text-[18px] font-semibold tracking-tight text-white">
                Navigation restricted by link creator
              </h4>
              <p className="mt-2 text-[13.5px] text-zinc-400 leading-relaxed">
                This preview link only allows routes inside the prefix below.
                Direct access to{" "}
                <code className="text-red-400 font-mono">{currentPath}</code>{" "}
                was intercepted.
              </p>

              <div className="mt-4 px-3 py-2 rounded-[6px] bg-[#0B0C0F] border border-white/[0.08] text-[12px] text-zinc-300 flex items-center justify-between gap-2">
                <span className="text-zinc-500">Allowed prefix</span>
                <span className="font-mono text-[#6CA8FF] font-medium">
                  /app/dashboard/*
                </span>
              </div>

              {!showUnlockForm ? (
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectRoute("/app/dashboard/overview")}
                    className="w-full sm:w-auto px-4 py-2 rounded-[8px] bg-[#0066FF] hover:bg-[#0055D4] text-white text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to /app/dashboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUnlockForm(true)}
                    className="w-full sm:w-auto px-4 py-2 rounded-[8px] bg-white/[0.06] hover:bg-white/[0.11] border border-white/12 text-zinc-200 text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#6CA8FF]" />
                    <span>Team unlock</span>
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
                    className="flex-1 h-9 px-3 rounded-[6px] bg-[#0B0C0F] border border-white/15 text-[12.5px] text-white placeholder:text-zinc-500 outline-none focus:border-[#0066FF]"
                  />
                  <button
                    type="submit"
                    className="h-9 px-3.5 rounded-[6px] bg-[#0066FF] hover:bg-[#0055D4] text-white text-[12.5px] font-medium cursor-pointer shrink-0"
                  >
                    Unlock access
                  </button>
                </form>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`allowed-${currentPath}-${teamUnlocked}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/[0.08]">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[12px] text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {teamUnlocked
                        ? "Team override active — full access"
                        : "Inside authorized perimeter (/app/dashboard/*)"}
                    </span>
                  </div>
                  <h4 className="mt-1 text-[17px] font-semibold text-white">
                    {currentPath === "/app/dashboard/metrics"
                      ? "Workspace telemetry metrics"
                      : currentPath === "/admin/billing"
                        ? "Admin billing & payouts (team unlocked)"
                        : currentPath === "/settings/api-keys"
                          ? "API keys & secrets (team unlocked)"
                          : "Acme SaaS staging overview"}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-[6px] bg-[#0066FF]/15 text-[12px] font-medium text-[#6CA8FF]">
                  PathLock™ active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
                {[
                  { k: "Workspace", v: "Acme SaaS Staging" },
                  { k: "Session rules", v: "24h TTL, 25 max clicks" },
                  { k: "Blocked escapes", v: "3 intercepted" },
                ].map((stat) => (
                  <div
                    key={stat.k}
                    className="p-3.5 rounded-[8px] bg-[#13151B] border border-white/[0.07]"
                  >
                    <div className="text-[11.5px] text-zinc-400">{stat.k}</div>
                    <div className="mt-1 text-[13.5px] font-medium text-white">
                      {stat.v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/[0.08] text-[12px] text-zinc-400">
                <span>
                  Click{" "}
                  <button
                    type="button"
                    onClick={() => handleSelectRoute("/admin/billing")}
                    className="font-mono text-red-400 underline hover:text-red-300 cursor-pointer"
                  >
                    /admin/billing
                  </button>{" "}
                  above to see PathLock™ block out-of-scope navigation.
                </span>
                <span className="inline-flex items-center gap-1.5 text-zinc-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#6CA8FF]" />
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
