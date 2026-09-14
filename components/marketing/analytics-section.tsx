"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Globe2,
  Smartphone,
  Laptop,
  Tablet,
  MapPin,
  Activity,
  Radio,
} from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";
import { CobeGlobe, TopCountryTraffic } from "@/components/globe/cobe-globe";
import { Card } from "@/components/ui/card";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Standard high-resolution World Atlas TopoJSON (100% authentic, real country boundaries)
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CountryPoint {
  code: string;
  name: string;
  flag: string;
  lng: number;
  lat: number;
  clicks: number;
  latency: string;
  trend: string;
}

const sampleCountries: CountryPoint[] = [
  { code: "FR", name: "France", flag: "🇫🇷", lng: 2.35, lat: 48.85, clicks: 42180, latency: "11ms", trend: "+18%" },
  { code: "US", name: "United States", flag: "🇺🇸", lng: -74.00, lat: 40.71, clicks: 38400, latency: "14ms", trend: "+24%" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", lng: -1.52, lat: 12.37, clicks: 18920, latency: "19ms", trend: "+32%" },
  { code: "CA", name: "Canada", flag: "🇨🇦", lng: -73.56, lat: 45.50, clicks: 14200, latency: "15ms", trend: "+12%" },
  { code: "DE", name: "Germany", flag: "🇩🇪", lng: 13.40, lat: 52.52, clicks: 12450, latency: "9ms", trend: "+15%" },
  { code: "CI", name: "Ivory Coast", flag: "🇨🇮", lng: -4.00, lat: 5.36, clicks: 9800, latency: "22ms", trend: "+29%" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", lng: -0.12, lat: 51.50, clicks: 8640, latency: "10ms", trend: "+8%" },
  { code: "JP", name: "Japan", flag: "🇯🇵", lng: 139.65, lat: 35.67, clicks: 7520, latency: "26ms", trend: "+19%" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", lng: -46.63, lat: -23.55, clicks: 6410, latency: "28ms", trend: "+14%" },
  { code: "SN", name: "Senegal", flag: "🇸🇳", lng: -17.46, lat: 14.71, clicks: 5200, latency: "21ms", trend: "+22%" },
];

// Connection arcs between hubs (coordinates in [lng, lat])
const hubConnections: Array<{ from: [number, number]; to: [number, number] }> = [
  { from: [2.35, 48.85], to: [-74.00, 40.71] },   // Paris -> New York
  { from: [2.35, 48.85], to: [139.65, 35.67] },   // Paris -> Tokyo
  { from: [2.35, 48.85], to: [-1.52, 12.37] },    // Paris -> Ouagadougou
  { from: [-74.00, 40.71], to: [-46.63, -23.55] },// New York -> Sao Paulo
  { from: [-0.12, 51.50], to: [13.40, 52.52] },   // London -> Berlin
  { from: [-17.46, 14.71], to: [-4.00, 5.36] },   // Dakar -> Abidjan
];

export function AnalyticsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [viewType, setViewType] = useState<"map" | "globe">("map");
  const [selectedCountry, setSelectedCountry] = useState<CountryPoint>(sampleCountries[0]);
  const [hoveredCountry, setHoveredCountry] = useState<CountryPoint | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const activeCountry = hoveredCountry || selectedCountry;

  const globeData: TopCountryTraffic[] = sampleCountries.map((c) => ({
    code: c.code,
    name: c.name,
    count: c.clicks,
    percentage: Math.round((c.clicks / 163720) * 100),
  }));

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const checkResponsive = () => {
      setIsMobile(window.innerWidth < 768);
      setIsLight(document.documentElement.classList.contains("light"));
    };
    checkResponsive();
    window.addEventListener("resize", checkResponsive);

    const observer = new MutationObserver(checkResponsive);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const header = document.querySelector(".analytics-header");
    if (header) {
      gsap.fromTo(
        header,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: header,
            start: "top 88%",
            end: "bottom 12%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    }

    const metricCards = document.querySelectorAll(".analytics-metric-card");
    if (metricCards.length > 0) {
      gsap.fromTo(
        metricCards,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".analytics-metrics-grid",
            start: "top 88%",
            end: "bottom 12%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    }

    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 40, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    }

    return () => {
      window.removeEventListener("resize", checkResponsive);
      observer.disconnect();
      ScrollTrigger.getAll().forEach((st) => {
        if (
          st.trigger &&
          ((st.trigger as HTMLElement).classList?.contains("analytics-header") ||
            (st.trigger as HTMLElement).classList?.contains("analytics-metrics-grid") ||
            st.trigger === cardRef.current)
        ) {
          st.kill();
        }
      });
    };
  }, []);

  const accentColor = isMobile ? "#0080ff" : "#ff6600";

  return (
    <section
      ref={sectionRef}
      id="analytics"
      className="relative py-16 sm:py-28 px-4 sm:px-6 overflow-hidden bg-[#FAF7F2] dark:bg-[#09090b] transition-colors"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="analytics-header text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-[30px] font-medium tracking-tight text-neutral-900 dark:text-white leading-snug">
            Analytics That Speak for Themselves
          </h2>
          <p className="mt-2 text-xs sm:text-base text-neutral-600 dark:text-neutral-400 font-normal">
            Track every redirect in real time, visualize geographic origins, and uncover audience behaviors without third-party cookies.
          </p>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="analytics-metrics-grid grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
          <Card className="analytics-metric-card p-3.5 sm:p-5 bg-[#FFFDF9] dark:bg-[#141416] border-[#E7DFD5] dark:border-white/10 shadow-sm">
            <span className="text-[11px] sm:text-xs text-neutral-500 block font-normal">Total Tracked Clicks</span>
            <span className="text-lg sm:text-2xl font-semibold text-neutral-900 dark:text-white mt-1 block">
              1,284,200
            </span>
            <span className="text-[10px] sm:text-[11px] text-neutral-400 block mt-0.5">Consolidated global volume</span>
          </Card>

          <Card className="analytics-metric-card p-3.5 sm:p-5 bg-[#FFFDF9] dark:bg-[#141416] border-[#E7DFD5] dark:border-white/10 shadow-sm">
            <span className="text-[11px] sm:text-xs text-neutral-500 block font-normal">Edge Response Time</span>
            <span className="text-lg sm:text-2xl font-semibold text-[#0080ff] sm:text-[#ff6600] mt-1 block">
              &lt; 15 ms
            </span>
            <span className="text-[10px] sm:text-[11px] text-neutral-400 block mt-0.5">Global Cloudflare CDN</span>
          </Card>

          <Card className="analytics-metric-card p-3.5 sm:p-5 bg-[#FFFDF9] dark:bg-[#141416] border-[#E7DFD5] dark:border-white/10 shadow-sm">
            <span className="text-[11px] sm:text-xs text-neutral-500 block font-normal">Recorded Countries</span>
            <span className="text-lg sm:text-2xl font-semibold text-cyan-500 mt-1 block">
              84 countries
            </span>
            <span className="text-[10px] sm:text-[11px] text-neutral-400 block mt-0.5">Anonymized IP detection</span>
          </Card>

          <Card className="analytics-metric-card p-3.5 sm:p-5 bg-[#FFFDF9] dark:bg-[#141416] border-[#E7DFD5] dark:border-white/10 shadow-sm">
            <span className="text-[11px] sm:text-xs text-neutral-500 block font-normal">Uptime SLA</span>
            <span className="text-lg sm:text-2xl font-semibold text-emerald-500 mt-1 block">
              99.99%
            </span>
            <span className="text-[10px] sm:text-[11px] text-neutral-400 block mt-0.5">Edge fault tolerance</span>
          </Card>
        </div>

        {/* Main High-Tech Analytics Card */}
        <div
          ref={cardRef}
          className="rounded-2xl bg-[#FFFDF9] dark:bg-[#111116] border border-[#E7DFD5] dark:border-white/10 shadow-2xl p-4 sm:p-7 overflow-hidden transition-all"
        >
          {/* Card Top Bar: Title, Live Status & View Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6 pb-4 border-b border-[#E7DFD5] dark:border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-lg font-semibold text-neutral-900 dark:text-white">
                  Geographic Traffic Distribution
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Edge
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">
                Hover over countries to reveal detailed metrics and inspect live edge latency
              </p>
            </div>

            {/* Switcher: Interactive Map vs 3D Globe */}
            <div className="flex items-center p-1 rounded-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 w-fit self-start sm:self-auto shadow-inner">
              <button
                type="button"
                onClick={() => setViewType("map")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewType === "map"
                    ? "bg-[#0080ff] sm:bg-[#ff6600] text-white shadow-md shadow-[#0080ff]/20 sm:shadow-[#ff6600]/20"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Vector Map</span>
              </button>
              <button
                type="button"
                onClick={() => setViewType("globe")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewType === "globe"
                    ? "bg-[#0080ff] sm:bg-[#ff6600] text-white shadow-md shadow-[#0080ff]/20 sm:shadow-[#ff6600]/20"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>3D Globe</span>
              </button>
            </div>
          </div>

          {/* Quick Country Pill Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none select-none">
            <span className="text-[11px] text-neutral-400 font-mono shrink-0 mr-1 hidden sm:inline">Top Hubs:</span>
            {sampleCountries.map((c) => {
              const isSelected = activeCountry.code === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedCountry(c)}
                  onMouseEnter={() => setHoveredCountry(c)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-[#0080ff]/10 sm:bg-[#ff6600]/10 border-[#0080ff]/40 sm:border-[#ff6600]/40 text-[#0080ff] sm:text-[#ff6600] shadow-sm font-semibold"
                      : "bg-white dark:bg-white/5 border-neutral-200 dark:border-white/5 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-white/20"
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                  <span className="text-[10px] font-mono opacity-75">({(c.clicks / 1000).toFixed(1)}k)</span>
                </button>
              );
            })}
          </div>

          {/* Visualization Area */}
          <div className="relative min-h-[300px] sm:min-h-[440px] flex items-center justify-center">
            {viewType === "map" ? (
              <div className="relative w-full h-[290px] sm:h-[430px] rounded-xl bg-neutral-100 dark:bg-[#08080c] border border-neutral-200 dark:border-white/10 overflow-hidden flex items-center justify-center shadow-inner">
                {isMounted ? (
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                      scale: 120,
                      center: [10, 20],
                    }}
                    className="w-full h-full select-none"
                  >
                    {/* Realistic World Atlas TopoJSON Geographies */}
                    <Geographies geography={GEO_URL}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const isCountryActive = sampleCountries.some(
                            (c) => c.name.toLowerCase() === (geo.properties?.name || "").toLowerCase()
                          );
                          const isSelectedGeo = activeCountry.name.toLowerCase() === (geo.properties?.name || "").toLowerCase();

                          let defaultFill = isLight ? "#e2e8f0" : "#171721";
                          let defaultStroke = isLight ? "#cbd5e1" : "#262634";

                          if (isSelectedGeo) {
                            defaultFill = accentColor;
                            defaultStroke = "#ffffff";
                          } else if (isCountryActive) {
                            defaultFill = isLight ? "#cbd5e1" : "#212130";
                            defaultStroke = isLight ? "#94a3b8" : "#323246";
                          }

                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              style={{
                                default: {
                                  fill: defaultFill,
                                  stroke: defaultStroke,
                                  strokeWidth: isSelectedGeo ? 1.2 : 0.5,
                                  outline: "none",
                                  transition: "all 200ms ease",
                                },
                                hover: {
                                  fill: accentColor,
                                  stroke: "#ffffff",
                                  strokeWidth: 1.2,
                                  outline: "none",
                                  cursor: "pointer",
                                },
                                pressed: {
                                  fill: accentColor,
                                  outline: "none",
                                },
                              }}
                            />
                          );
                        })
                      }
                    </Geographies>

                    {/* Connecting Arcs between Active Hubs */}
                    {hubConnections.map((conn, idx) => (
                      <Line
                        key={`arc-${idx}`}
                        from={conn.from}
                        to={conn.to}
                        stroke={accentColor}
                        strokeWidth={1.4}
                        strokeDasharray="4 4"
                        strokeOpacity={0.6}
                      />
                    ))}

                    {/* Accurate Geo Coordinates Markers */}
                    {sampleCountries.map((c) => {
                      const isSelected = activeCountry.code === c.code;
                      return (
                        <Marker
                          key={c.code}
                          coordinates={[c.lng, c.lat]}
                          onClick={() => setSelectedCountry(c)}
                          onMouseEnter={() => setHoveredCountry(c)}
                          onMouseLeave={() => setHoveredCountry(null)}
                        >
                          <g className="cursor-pointer group">
                            {/* Pulsing Sonar Ring */}
                            <circle
                              r={isSelected ? 14 : 9}
                              fill={accentColor}
                              opacity={0.35}
                              className="animate-ping pointer-events-none"
                            />
                            {/* Core Indicator Dot */}
                            <circle
                              r={isSelected ? 6 : 4}
                              fill={accentColor}
                              stroke="#ffffff"
                              strokeWidth={1.6}
                              className="transition-transform group-hover:scale-125"
                            />
                          </g>
                        </Marker>
                      );
                    })}
                  </ComposableMap>
                ) : (
                  <div className="flex items-center justify-center text-neutral-400 text-xs font-mono">
                    Loading world map...
                  </div>
                )}

                {/* Floating Active Country Telemetry Tooltip */}
                {activeCountry && (
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-2 rounded-xl bg-neutral-900/95 text-white border border-white/15 shadow-2xl backdrop-blur-md text-xs whitespace-nowrap">
                      <div className="flex items-center gap-2 pb-1 border-b border-white/10">
                        <span className="text-base">{activeCountry.flag}</span>
                        <span className="font-bold text-xs">{activeCountry.name}</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded ml-auto">
                          {activeCountry.latency}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-1 text-[11px]">
                        <span className="text-neutral-400">Tracked clicks:</span>
                        <span className="text-[#0080ff] sm:text-[#ff6600] font-bold font-mono">
                          {activeCountry.clicks.toLocaleString()}
                        </span>
                        <span className="text-neutral-500">•</span>
                        <span className="text-emerald-400 font-mono font-medium">{activeCountry.trend}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full flex items-center justify-center py-2 sm:py-4 animate-in fade-in duration-300">
                <CobeGlobe className="max-w-[280px] sm:max-w-[360px]" topCountries={globeData} />
              </div>
            )}
          </div>

          {/* Breakdown Stats Footer: Devices & Browsers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mt-6 pt-6 border-t border-neutral-200 dark:border-white/10">
            {/* Devices Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#0080ff] sm:text-[#ff6600]" />
                  Device Breakdown
                </span>
                <span className="text-[11px] text-neutral-500 font-mono">100% anonymized</span>
              </div>
              <div className="space-y-2.5 text-xs">
                {/* Mobile */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-neutral-200 dark:border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-neutral-800 dark:text-neutral-200">
                    <span className="flex items-center gap-2 font-medium">
                      <Smartphone className="w-4 h-4 text-[#0080ff] sm:text-[#ff6600]" /> Smartphones
                    </span>
                    <span className="font-mono font-bold text-[#0080ff] sm:text-[#ff6600]">62%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                    <div className="w-[62%] h-full bg-[#0080ff] sm:bg-[#ff6600] rounded-full transition-all duration-500" />
                  </div>
                </div>

                {/* Desktop */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-neutral-200 dark:border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-neutral-800 dark:text-neutral-200">
                    <span className="flex items-center gap-2 font-medium">
                      <Laptop className="w-4 h-4 text-cyan-500" /> Desktops
                    </span>
                    <span className="font-mono font-bold text-cyan-500">34%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                    <div className="w-[34%] h-full bg-cyan-500 rounded-full transition-all duration-500" />
                  </div>
                </div>

                {/* Tablets */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-neutral-200 dark:border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-neutral-800 dark:text-neutral-200">
                    <span className="flex items-center gap-2 font-medium">
                      <Tablet className="w-4 h-4 text-neutral-400" /> Tablets
                    </span>
                    <span className="font-mono font-bold text-neutral-400">4%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                    <div className="w-[4%] h-full bg-neutral-400 rounded-full transition-all duration-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Browsers Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-cyan-500" />
                  Browsers &amp; Engines
                </span>
                <span className="text-[11px] text-neutral-500 font-mono">Top 4 worldwide</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-black/30 border border-neutral-200 dark:border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400 text-[11px] font-medium">Chrome</span>
                    <span className="text-[10px] font-mono text-emerald-500 font-semibold">Webkit</span>
                  </div>
                  <span className="font-bold text-base text-neutral-900 dark:text-white font-mono mt-1">58%</span>
                  <div className="w-full h-1 rounded-full bg-neutral-200 dark:bg-white/10 mt-2 overflow-hidden">
                    <div className="w-[58%] h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-black/30 border border-neutral-200 dark:border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400 text-[11px] font-medium">Safari</span>
                    <span className="text-[10px] font-mono text-[#0080ff] sm:text-[#ff6600] font-semibold">Apple</span>
                  </div>
                  <span className="font-bold text-base text-neutral-900 dark:text-white font-mono mt-1">26%</span>
                  <div className="w-full h-1 rounded-full bg-neutral-200 dark:bg-white/10 mt-2 overflow-hidden">
                    <div className="w-[26%] h-full bg-[#0080ff] sm:bg-[#ff6600] rounded-full" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-black/30 border border-neutral-200 dark:border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400 text-[11px] font-medium">Firefox</span>
                    <span className="text-[10px] font-mono text-amber-500 font-semibold">Gecko</span>
                  </div>
                  <span className="font-bold text-base text-neutral-900 dark:text-white font-mono mt-1">11%</span>
                  <div className="w-full h-1 rounded-full bg-neutral-200 dark:bg-white/10 mt-2 overflow-hidden">
                    <div className="w-[11%] h-full bg-amber-500 rounded-full" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-black/30 border border-neutral-200 dark:border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400 text-[11px] font-medium">Edge</span>
                    <span className="text-[10px] font-mono text-cyan-500 font-semibold">Blink</span>
                  </div>
                  <span className="font-bold text-base text-neutral-900 dark:text-white font-mono mt-1">5%</span>
                  <div className="w-full h-1 rounded-full bg-neutral-200 dark:bg-white/10 mt-2 overflow-hidden">
                    <div className="w-[5%] h-full bg-cyan-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
