"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import DottedMap from "dotted-map";
import { useTheme } from "@/components/providers/theme-provider";

interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface MapRoute {
  start: GeoPoint;
  end: GeoPoint;
}

interface MapProps {
  dots?: MapRoute[];
  lineColor?: string;
}

// Major global telemetry edge nodes
const GLOBAL_HUBS: Record<string, GeoPoint> = {
  paris: { lat: 48.8566, lng: 2.3522, label: "Paris" },
  nyc: { lat: 40.7128, lng: -74.006, label: "New York" },
  tokyo: { lat: 35.6762, lng: 139.6503, label: "Tokyo" },
  london: { lat: 51.5074, lng: -0.1278, label: "London" },
  sfo: { lat: 37.7749, lng: -122.4194, label: "San Francisco" },
  singapore: { lat: 1.3521, lng: 103.8198, label: "Singapore" },
  sydney: { lat: -33.8688, lng: 151.2093, label: "Sydney" },
  saopaulo: { lat: -23.5505, lng: -46.6333, label: "São Paulo" },
  frankfurt: { lat: 50.1109, lng: 8.6821, label: "Frankfurt" },
  dubai: { lat: 25.2048, lng: 55.2708, label: "Dubai" },
  mumbai: { lat: 19.076, lng: 72.8777, label: "Mumbai" },
  dakar: { lat: 14.4974, lng: -14.4524, label: "Dakar" },
  seoul: { lat: 37.5665, lng: 126.978, label: "Seoul" },
  toronto: { lat: 43.6532, lng: -79.3832, label: "Toronto" },
  johannesburg: { lat: -26.2041, lng: 28.0473, label: "Johannesburg" },
};

// Continuous rotating sequence of dynamic connection waves jumping between different points:
const DYNAMIC_ROUTE_WAVES: MapRoute[][] = [
  // Wave 0: Transatlantic & Asia-Pacific core
  [
    { start: GLOBAL_HUBS.paris, end: GLOBAL_HUBS.nyc },
    { start: GLOBAL_HUBS.nyc, end: GLOBAL_HUBS.tokyo },
    { start: GLOBAL_HUBS.london, end: GLOBAL_HUBS.dakar },
    { start: GLOBAL_HUBS.tokyo, end: GLOBAL_HUBS.sydney },
    { start: GLOBAL_HUBS.frankfurt, end: GLOBAL_HUBS.mumbai },
  ],
  // Wave 1: North America & Middle East / Asia
  [
    { start: GLOBAL_HUBS.sfo, end: GLOBAL_HUBS.tokyo },
    { start: GLOBAL_HUBS.frankfurt, end: GLOBAL_HUBS.dubai },
    { start: GLOBAL_HUBS.saopaulo, end: GLOBAL_HUBS.london },
    { start: GLOBAL_HUBS.singapore, end: GLOBAL_HUBS.sydney },
    { start: GLOBAL_HUBS.nyc, end: GLOBAL_HUBS.toronto },
  ],
  // Wave 2: Southern hemisphere & Global south corridors
  [
    { start: GLOBAL_HUBS.london, end: GLOBAL_HUBS.nyc },
    { start: GLOBAL_HUBS.dubai, end: GLOBAL_HUBS.singapore },
    { start: GLOBAL_HUBS.paris, end: GLOBAL_HUBS.saopaulo },
    { start: GLOBAL_HUBS.mumbai, end: GLOBAL_HUBS.seoul },
    { start: GLOBAL_HUBS.dakar, end: GLOBAL_HUBS.johannesburg },
  ],
  // Wave 3: Transpacific & Eurasia routes
  [
    { start: GLOBAL_HUBS.toronto, end: GLOBAL_HUBS.sfo },
    { start: GLOBAL_HUBS.sfo, end: GLOBAL_HUBS.sydney },
    { start: GLOBAL_HUBS.tokyo, end: GLOBAL_HUBS.singapore },
    { start: GLOBAL_HUBS.dubai, end: GLOBAL_HUBS.paris },
    { start: GLOBAL_HUBS.saopaulo, end: GLOBAL_HUBS.nyc },
  ],
  // Wave 4: Emerging corridors & high-velocity hubs
  [
    { start: GLOBAL_HUBS.seoul, end: GLOBAL_HUBS.sfo },
    { start: GLOBAL_HUBS.london, end: GLOBAL_HUBS.frankfurt },
    { start: GLOBAL_HUBS.johannesburg, end: GLOBAL_HUBS.dubai },
    { start: GLOBAL_HUBS.singapore, end: GLOBAL_HUBS.mumbai },
    { start: GLOBAL_HUBS.sydney, end: GLOBAL_HUBS.tokyo },
  ],
];

export function WorldMap({
  dots = [],
  lineColor = "#0066FF",
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();

  // Multi-wave rotating sequence
  const allWaves = useMemo(() => {
    if (dots && dots.length > 0) {
      return [dots, ...DYNAMIC_ROUTE_WAVES.slice(1)];
    }
    return DYNAMIC_ROUTE_WAVES;
  }, [dots]);

  const [waveIndex, setWaveIndex] = useState(0);

  // Periodically cycle through rotating waves of points infinitely
  useEffect(() => {
    const timer = setInterval(() => {
      setWaveIndex((prev) => (prev + 1) % allWaves.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [allWaves.length]);

  const activeRoutes = allWaves[waveIndex] || [];

  const map = useMemo(() => {
    return new DottedMap({ height: 100, grid: "diagonal" });
  }, []);

  const svgMap = useMemo(() => {
    return map.getSVG({
      radius: 0.22,
      color: theme === "dark" ? "#FFFFFF40" : "#00000040",
      shape: "circle",
      backgroundColor: theme === "dark" ? "#09090B" : "#FFFFFF",
    });
  }, [map, theme]);

  const projectPoint = (lat: number, lng: number) => {
    try {
      const pin = map.getPin({ lat, lng });
      if (pin && typeof pin.x === "number" && typeof pin.y === "number") {
        return { x: pin.x, y: pin.y };
      }
    } catch {}
    const x = ((lng + 180) / 360) * 198;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 12;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  // Extract all distinct active city points in this wave
  const activeCityKeys = useMemo(() => {
    const set = new Set<string>();
    activeRoutes.forEach((route) => {
      set.add(`${route.start.lat.toFixed(2)},${route.start.lng.toFixed(2)}`);
      set.add(`${route.end.lat.toFixed(2)},${route.end.lng.toFixed(2)}`);
    });
    return set;
  }, [activeRoutes]);

  return (
    <div className="w-full aspect-[2/1] dark:bg-[#09090B] bg-white rounded-lg relative font-sans">
      {/* Background Dotted World Grid */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
        alt="world map"
        height="495"
        width="1056"
        draggable={false}
      />

      <svg
        ref={svgRef}
        viewBox="0 0 198 100"
        className="w-full h-full absolute inset-0 pointer-events-none select-none"
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0066FF" stopOpacity="0" />
            <stop offset="20%" stopColor={lineColor} stopOpacity="0.85" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="80%" stopColor={lineColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ── 1. Static Ambient City Pins (All global hubs mapped lightly) ── */}
        {Object.values(GLOBAL_HUBS).map((hub, i) => {
          const pt = projectPoint(hub.lat, hub.lng);
          const isActive = activeCityKeys.has(`${hub.lat.toFixed(2)},${hub.lng.toFixed(2)}`);
          if (isActive) return null; // Rendered below with active radar pulse
          return (
            <circle
              key={`ambient-hub-${i}`}
              cx={pt.x}
              cy={pt.y}
              r="0.5"
              fill={lineColor}
              opacity={theme === "dark" ? 0.35 : 0.25}
            />
          );
        })}

        {/* ── 2. Dynamic Rotating Routes (Beams that shoot & bounce to new points) ── */}
        <AnimatePresence mode="wait">
          <motion.g
            key={`wave-group-${waveIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {activeRoutes.map((dot, i) => {
              const startPoint = projectPoint(dot.start.lat, dot.start.lng);
              const endPoint = projectPoint(dot.end.lat, dot.end.lng);
              const pathD = createCurvedPath(startPoint, endPoint);
              const duration = 2.0 + (i % 3) * 0.3;
              const delay = 0.2 * i;

              return (
                <g key={`route-${waveIndex}-${i}`}>
                  {/* Subtle static dashed trajectory track */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth="0.3"
                    strokeOpacity={theme === "dark" ? 0.2 : 0.14}
                    strokeDasharray="1 1.2"
                  />

                  {/* Main beam: shoots from start to end and pulses */}
                  <motion.path
                    d={pathD}
                    fill="none"
                    stroke="url(#path-gradient)"
                    strokeWidth="0.6"
                    strokeLinecap="round"
                    initial={{
                      pathLength: 0,
                      opacity: 0.2,
                    }}
                    animate={{
                      pathLength: [0, 1, 0.96],
                      opacity: [0.2, 1, 0.85],
                    }}
                    transition={{
                      duration,
                      delay,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Fast high-velocity traveling cyan photon */}
                  <motion.path
                    d={pathD}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    initial={{
                      pathLength: 0.16,
                      pathOffset: 0,
                      opacity: 0,
                    }}
                    animate={{
                      pathOffset: [0, 0.84],
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: duration * 0.9,
                      delay: delay + 0.1,
                      ease: "easeInOut",
                    }}
                  />
                </g>
              );
            })}

            {/* ── 3. Active City Nodes with Radar Ping Rings ── */}
            {activeRoutes.map((dot, i) => {
              const sPt = projectPoint(dot.start.lat, dot.start.lng);
              const ePt = projectPoint(dot.end.lat, dot.end.lng);

              return (
                <g key={`active-nodes-${waveIndex}-${i}`}>
                  {/* Start City Node */}
                  <circle cx={sPt.x} cy={sPt.y} r="0.8" fill={lineColor} />
                  <circle
                    cx={sPt.x}
                    cy={sPt.y}
                    r="0.8"
                    fill={lineColor}
                    opacity="0.6"
                  >
                    <animate
                      attributeName="r"
                      from="0.8"
                      to="2.8"
                      dur="1.8s"
                      begin="0s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.6"
                      to="0"
                      dur="1.8s"
                      begin="0s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* End City Node */}
                  <circle cx={ePt.x} cy={ePt.y} r="0.8" fill={lineColor} />
                  <circle
                    cx={ePt.x}
                    cy={ePt.y}
                    r="0.8"
                    fill={lineColor}
                    opacity="0.6"
                  >
                    <animate
                      attributeName="r"
                      from="0.8"
                      to="2.8"
                      dur="1.8s"
                      begin="0.2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.6"
                      to="0"
                      dur="1.8s"
                      begin="0.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}
          </motion.g>
        </AnimatePresence>
      </svg>
    </div>
  );
}

export default WorldMap;
