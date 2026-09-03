"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  Maximize2,
  Minimize2,
  X,
  Radio,
  Zap,
  Globe2,
  Sparkles,
  Info
} from "lucide-react";

export interface TopCountryTraffic {
  code: string;
  name: string;
  count: number;
  percentage: number;
}

interface CobeGlobeProps {
  className?: string;
  topCountries?: TopCountryTraffic[];
}

interface Marker {
  lat: number;
  lng: number;
  label: string;
  size: number;
}

interface Arc {
  from: Marker;
  to: Marker;
  progress: number;
  speed: number;
}

import { WORLD_COUNTRIES, getCountryData } from "@/lib/geo-coordinates";

// Accurate high-resolution polygon coordinates for World Continents
const continentContours: Array<Array<{ lat: number; lng: number }>> = [
  // Africa (High Precision with West Africa Bulge, Gulf of Guinea & Horn)
  [
    { lat: 37.3, lng: 9.8 }, { lat: 36.8, lng: 11.1 }, { lat: 35.8, lng: 10.6 }, { lat: 33.9, lng: 10.1 },
    { lat: 32.9, lng: 13.2 }, { lat: 31.2, lng: 19.9 }, { lat: 32.1, lng: 20.1 }, { lat: 32.8, lng: 22.6 },
    { lat: 31.5, lng: 25.1 }, { lat: 31.3, lng: 30.1 }, { lat: 31.6, lng: 31.6 }, { lat: 31.2, lng: 34.2 },
    { lat: 27.8, lng: 34.3 }, { lat: 23.9, lng: 35.7 }, { lat: 22.0, lng: 36.9 }, { lat: 15.6, lng: 39.5 },
    { lat: 12.7, lng: 43.1 }, { lat: 11.6, lng: 43.1 }, { lat: 11.8, lng: 51.3 }, { lat: 8.0, lng: 50.0 },
    { lat: 5.3, lng: 48.5 }, { lat: 2.0, lng: 45.3 }, { lat: -0.5, lng: 42.6 }, { lat: -4.0, lng: 39.7 },
    { lat: -10.5, lng: 40.5 }, { lat: -15.3, lng: 40.5 }, { lat: -20.0, lng: 35.0 }, { lat: -26.0, lng: 32.9 },
    { lat: -28.6, lng: 32.4 }, { lat: -32.0, lng: 29.0 }, { lat: -34.0, lng: 25.7 }, { lat: -34.8, lng: 20.0 },
    { lat: -34.2, lng: 18.5 }, { lat: -30.0, lng: 17.2 }, { lat: -22.0, lng: 14.3 }, { lat: -16.5, lng: 11.8 },
    { lat: -12.3, lng: 13.6 }, { lat: -6.0, lng: 12.2 }, { lat: -1.0, lng: 9.3 }, { lat: 2.0, lng: 9.8 },
    { lat: 4.5, lng: 8.5 }, { lat: 4.3, lng: 6.0 }, { lat: 6.3, lng: 2.5 }, { lat: 5.5, lng: -0.2 },
    { lat: 4.8, lng: -2.5 }, { lat: 4.4, lng: -7.5 }, { lat: 6.5, lng: -11.0 }, { lat: 8.5, lng: -13.3 },
    { lat: 11.5, lng: -15.5 }, { lat: 12.5, lng: -16.7 }, { lat: 14.7, lng: -17.5 }, { lat: 16.0, lng: -16.5 },
    { lat: 20.8, lng: -17.0 }, { lat: 24.0, lng: -15.7 }, { lat: 28.0, lng: -12.3 }, { lat: 30.5, lng: -9.8 },
    { lat: 33.5, lng: -7.6 }, { lat: 35.8, lng: -5.6 }, { lat: 35.2, lng: -3.0 }, { lat: 35.8, lng: -0.5 },
    { lat: 36.8, lng: 3.0 }, { lat: 36.9, lng: 7.8 }, { lat: 37.3, lng: 9.8 }
  ],
  // Madagascar
  [
    { lat: -12.0, lng: 49.3 }, { lat: -15.5, lng: 50.5 }, { lat: -20.0, lng: 48.7 }, { lat: -25.6, lng: 45.2 },
    { lat: -25.2, lng: 44.2 }, { lat: -22.0, lng: 43.3 }, { lat: -16.0, lng: 44.5 }, { lat: -12.0, lng: 49.3 }
  ],
  // Europe (Precise Iberian, French, Italian & North Sea coastlines)
  [
    { lat: 36.0, lng: -5.6 }, { lat: 37.0, lng: -8.9 }, { lat: 38.7, lng: -9.5 }, { lat: 42.0, lng: -8.9 },
    { lat: 43.6, lng: -8.0 }, { lat: 43.5, lng: -1.8 }, { lat: 46.0, lng: -1.2 }, { lat: 48.4, lng: -4.8 },
    { lat: 49.7, lng: -1.9 }, { lat: 51.0, lng: 1.9 }, { lat: 53.5, lng: 7.0 }, { lat: 55.0, lng: 8.5 },
    { lat: 57.5, lng: 10.0 }, { lat: 58.0, lng: 6.0 }, { lat: 62.0, lng: 5.0 }, { lat: 68.0, lng: 15.0 },
    { lat: 71.0, lng: 28.0 }, { lat: 69.0, lng: 33.0 }, { lat: 65.0, lng: 25.0 }, { lat: 60.0, lng: 29.0 },
    { lat: 54.5, lng: 19.5 }, { lat: 54.0, lng: 14.0 }, { lat: 45.0, lng: 14.0 }, { lat: 41.0, lng: 16.0 },
    { lat: 38.0, lng: 15.5 }, { lat: 40.0, lng: 18.0 }, { lat: 44.0, lng: 12.5 }, { lat: 44.0, lng: 8.5 },
    { lat: 43.3, lng: 5.3 }, { lat: 42.5, lng: 3.1 }, { lat: 41.4, lng: 2.2 }, { lat: 38.5, lng: -0.1 },
    { lat: 36.7, lng: -2.4 }, { lat: 36.0, lng: -5.6 }
  ],
  // British Isles & Ireland
  [
    { lat: 50.0, lng: -5.2 }, { lat: 50.8, lng: -1.0 }, { lat: 51.4, lng: 1.4 }, { lat: 53.0, lng: 0.5 },
    { lat: 55.5, lng: -1.5 }, { lat: 58.5, lng: -3.0 }, { lat: 58.5, lng: -5.0 }, { lat: 56.0, lng: -5.5 },
    { lat: 53.5, lng: -4.5 }, { lat: 51.5, lng: -4.5 }, { lat: 50.0, lng: -5.2 }
  ],
  // North America (US, Canada, Mexico, Alaska)
  [
    { lat: 25.0, lng: -80.5 }, { lat: 28.5, lng: -80.5 }, { lat: 32.0, lng: -81.0 }, { lat: 35.5, lng: -75.5 },
    { lat: 40.5, lng: -74.0 }, { lat: 44.5, lng: -67.0 }, { lat: 47.0, lng: -53.0 }, { lat: 52.0, lng: -56.0 },
    { lat: 60.0, lng: -65.0 }, { lat: 63.0, lng: -78.0 }, { lat: 70.0, lng: -85.0 }, { lat: 72.0, lng: -125.0 },
    { lat: 71.0, lng: -156.0 }, { lat: 65.0, lng: -168.0 }, { lat: 58.0, lng: -160.0 }, { lat: 55.0, lng: -132.0 },
    { lat: 49.0, lng: -123.0 }, { lat: 44.0, lng: -124.0 }, { lat: 37.5, lng: -122.5 }, { lat: 32.5, lng: -117.0 },
    { lat: 23.0, lng: -110.0 }, { lat: 19.0, lng: -104.0 }, { lat: 16.0, lng: -95.0 }, { lat: 9.0, lng: -79.5 },
    { lat: 15.0, lng: -83.5 }, { lat: 21.5, lng: -87.0 }, { lat: 26.0, lng: -97.0 }, { lat: 29.5, lng: -94.0 },
    { lat: 29.0, lng: -89.0 }, { lat: 25.0, lng: -80.5 }
  ],
  // South America (Brazil, Amazonia, Andes, Patagonia)
  [
    { lat: 12.0, lng: -72.0 }, { lat: 10.5, lng: -63.0 }, { lat: 5.0, lng: -52.0 }, { lat: 0.0, lng: -50.0 },
    { lat: -5.0, lng: -35.0 }, { lat: -13.0, lng: -38.5 }, { lat: -23.0, lng: -43.0 }, { lat: -32.0, lng: -52.0 },
    { lat: -38.0, lng: -57.5 }, { lat: -46.0, lng: -65.5 }, { lat: -55.0, lng: -66.5 }, { lat: -50.0, lng: -75.0 },
    { lat: -40.0, lng: -74.0 }, { lat: -30.0, lng: -71.5 }, { lat: -18.5, lng: -70.5 }, { lat: -5.0, lng: -81.0 },
    { lat: 1.0, lng: -79.5 }, { lat: 8.0, lng: -77.5 }, { lat: 12.0, lng: -72.0 }
  ],
  // Asia & Middle East & India
  [
    { lat: 41.0, lng: 28.5 }, { lat: 50.0, lng: 40.0 }, { lat: 60.0, lng: 60.0 }, { lat: 70.0, lng: 75.0 },
    { lat: 73.0, lng: 110.0 }, { lat: 72.0, lng: 140.0 }, { lat: 66.0, lng: 170.0 }, { lat: 55.0, lng: 160.0 },
    { lat: 43.0, lng: 132.0 }, { lat: 38.0, lng: 119.0 }, { lat: 31.0, lng: 121.5 }, { lat: 22.5, lng: 114.0 },
    { lat: 16.0, lng: 108.0 }, { lat: 8.5, lng: 103.0 }, { lat: 1.3, lng: 104.0 }, { lat: 8.0, lng: 77.5 },
    { lat: 19.0, lng: 72.8 }, { lat: 25.0, lng: 62.0 }, { lat: 25.0, lng: 55.0 }, { lat: 23.0, lng: 58.5 },
    { lat: 15.0, lng: 52.0 }, { lat: 12.5, lng: 44.0 }, { lat: 28.0, lng: 34.5 }, { lat: 33.0, lng: 35.0 },
    { lat: 41.0, lng: 28.5 }
  ],
  // Japan Archipelago
  [
    { lat: 45.5, lng: 142.0 }, { lat: 43.0, lng: 145.5 }, { lat: 35.5, lng: 140.5 }, { lat: 31.0, lng: 131.0 },
    { lat: 33.5, lng: 130.0 }, { lat: 37.5, lng: 137.0 }, { lat: 41.0, lng: 140.5 }, { lat: 45.5, lng: 142.0 }
  ],
  // Australia & New Zealand
  [
    { lat: -12.0, lng: 132.0 }, { lat: -11.0, lng: 142.5 }, { lat: -20.0, lng: 149.0 }, { lat: -28.0, lng: 153.5 },
    { lat: -38.0, lng: 148.0 }, { lat: -38.5, lng: 144.0 }, { lat: -35.0, lng: 117.0 }, { lat: -22.0, lng: 114.0 },
    { lat: -15.0, lng: 124.0 }, { lat: -12.0, lng: 132.0 }
  ]
];

// Helper: Point in polygon
function isPointInPoly(lat: number, lng: number, poly: Array<{ lat: number; lng: number }>) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lng, yi = poly[i].lat;
    const xj = poly[j].lng, yj = poly[j].lat;
    const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Generate Dense Geographic Dotted Matrix (Pointillés) for all Continents
function generateContinentMatrixDots(): Array<{ lat: number; lng: number }> {
  const dots: Array<{ lat: number; lng: number }> = [];

  // Fine-step scanning (-60°S to +75°N)
  for (let lat = -55; lat <= 72; lat += 1.8) {
    for (let lng = -180; lng <= 180; lng += 2.2) {
      for (const poly of continentContours) {
        if (isPointInPoly(lat, lng, poly)) {
          dots.push({ lat, lng });
          break;
        }
      }
    }
  }

  return dots;
}

// Pre-computed dense matrix of 3000+ points
const GLOBAL_CONTINENT_DOTS = generateContinentMatrixDots();

export function CobeGlobe({ className = "", topCountries = [] }: CobeGlobeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const markers = React.useMemo(() => {
    const validCountries = (topCountries || []).filter((c) => c && ((c.count || 0) > 0 || (c.percentage || 0) > 0));
    return validCountries.map((c) => {
      const code = (c.code || "BF").toUpperCase();
      const coord = getCountryData(code);
      return {
        lat: coord.lat,
        lng: coord.lng,
        label: `${coord.name} (${c.count || 1} clic${(c.count || 1) > 1 ? "s" : ""})`,
        size: Math.max(6, Math.min(12, 5 + ((c.percentage || 10) / 10))),
      };
    });
  }, [topCountries]);

  const arcs = React.useMemo(() => {
    const edgeHub: Marker = { lat: 48.8566, lng: 2.3522, label: "Cloudflare Edge", size: 5.5 };
    return markers.map((m, idx) => ({
      from: edgeHub,
      to: m,
      progress: (idx * 0.3) % 1,
      speed: 0.006 + (idx * 0.002) % 0.006,
    }));
  }, [markers]);

  const markersRef = useRef<Marker[]>(markers);
  const arcsRef = useRef<Arc[]>(arcs);
  markersRef.current = markers;
  arcsRef.current = arcs;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalBackdropRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Rotation angles, drag state & smooth mobile momentum physics
  const rotX = useRef(0.18);
  const rotY = useRef(0.3);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const velocityX = useRef(0);
  const velocityY = useRef(0);
  const pointerIdRef = useRef<number | null>(null);

  // True Geographic 3D coordinates calculation (North is UP, Greenwich meridian facing front)
  const latLngTo3D = (lat: number, lng: number, radius: number) => {
    const latRad = lat * (Math.PI / 180);
    const lngRad = lng * (Math.PI / 180);

    const x = radius * Math.cos(latRad) * Math.sin(lngRad);
    const y = radius * Math.sin(latRad);
    const z = radius * Math.cos(latRad) * Math.cos(lngRad);

    // Rotate around Y axis (longitude rotation)
    const cosY = Math.cos(rotY.current);
    const sinY = Math.sin(rotY.current);
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;

    // Rotate around X axis (pitch / equator tilt)
    const cosX = Math.cos(rotX.current);
    const sinX = Math.sin(rotX.current);
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    return { x: x1, y: -y2, z: z2 };
  };

  // GSAP Animation when opening/closing modal
  useEffect(() => {
    if (isExpanded) {
      if (modalBackdropRef.current && modalContentRef.current) {
        gsap.fromTo(
          modalBackdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power2.out" }
        );
        gsap.fromTo(
          modalContentRef.current,
          { scale: 0.75, opacity: 0, y: 30 },
          { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.3)" }
        );
      }
    }
  }, [isExpanded]);

  // Main Render Loop
  useEffect(() => {
    let animId: number;
    let time = 0;

    const drawGlobeOnCanvas = (
      canvas: HTMLCanvasElement,
      isModal: boolean
    ) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width || (isModal ? 720 : 420);
      const height = rect.height || (isModal ? 720 : 420);
      const cx = width / 2;
      const cy = height / 2;
      const radius = width * (isModal ? 0.40 : 0.38);

      const isMobileScreen = typeof window !== "undefined" && window.innerWidth < 768;
      const isBlue = isMobileScreen;

      ctx.clearRect(0, 0, width, height);

      // 1. Atmosphere Aura
      const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.3);
      glowGrad.addColorStop(0, isBlue ? "rgba(0, 210, 255, 0.22)" : "rgba(255, 102, 0, 0.18)");
      glowGrad.addColorStop(0.5, isBlue ? "rgba(0, 180, 255, 0.08)" : "rgba(255, 102, 0, 0.07)");
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // 2. Planet Sphere
      const sphereGrad = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.35,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      sphereGrad.addColorStop(0, "#22222c");
      sphereGrad.addColorStop(0.5, "#131317");
      sphereGrad.addColorStop(0.85, "#0a0a0d");
      sphereGrad.addColorStop(1, "#050507");

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Rim
      ctx.strokeStyle = isBlue ? "rgba(0, 210, 255, 0.65)" : "rgba(255, 102, 0, 0.5)";
      ctx.lineWidth = isModal ? 2 : 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Grid Lines
      ctx.lineWidth = 0.75;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.beginPath();
        let first = true;
        for (let lng = -180; lng <= 180; lng += 8) {
          const pt = latLngTo3D(lat, lng, radius);
          if (pt.z > 0) {
            if (first) {
              ctx.moveTo(cx + pt.x, cy + pt.y);
              first = false;
            } else {
              ctx.lineTo(cx + pt.x, cy + pt.y);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      }

      for (let lng = -180; lng <= 180; lng += 45) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.beginPath();
        let first = true;
        for (let lat = -80; lat <= 80; lat += 8) {
          const pt = latLngTo3D(lat, lng, radius);
          if (pt.z > 0) {
            if (first) {
              ctx.moveTo(cx + pt.x, cy + pt.y);
              first = false;
            } else {
              ctx.lineTo(cx + pt.x, cy + pt.y);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      }

      // 4. Continent Dense Dotted Matrix (Pointillés - Bright & High Contrast)
      GLOBAL_CONTINENT_DOTS.forEach((dot) => {
        const pt = latLngTo3D(dot.lat, dot.lng, radius);
        if (pt.z > 0) {
          const depth = pt.z / radius;
          const alpha = 0.3 + depth * 0.7;
          const dotSize = (isModal ? 1.6 : 1.2) + depth * (isModal ? 1.0 : 0.7);

          ctx.fillStyle = `rgba(235, 245, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(cx + pt.x, cy + pt.y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 5. Continent Outlines (Subtle borders)
      continentContours.forEach((poly) => {
        ctx.strokeStyle = isModal ? "rgba(255, 255, 255, 0.35)" : "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = isModal ? 1.2 : 0.9;
        ctx.beginPath();
        let first = true;
        for (const coord of poly) {
          const pt = latLngTo3D(coord.lat, coord.lng, radius);
          if (pt.z > -radius * 0.15) {
            if (first) {
              ctx.moveTo(cx + pt.x, cy + pt.y);
              first = false;
            } else {
              ctx.lineTo(cx + pt.x, cy + pt.y);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      });

      // 6. Flight Arcs
      arcsRef.current.forEach((arc) => {
        const p1 = latLngTo3D(arc.from.lat, arc.from.lng, radius);
        const p2 = latLngTo3D(arc.to.lat, arc.to.lng, radius);

        if (p1.z > -radius * 0.2 && p2.z > -radius * 0.2) {
          const midLat = (arc.from.lat + arc.to.lat) / 2;
          const midLng = (arc.from.lng + arc.to.lng) / 2;
          const midPt = latLngTo3D(midLat, midLng, radius * 1.3);

          ctx.strokeStyle = isBlue ? "rgba(0, 210, 255, 0.65)" : "rgba(255, 102, 0, 0.55)";
          ctx.lineWidth = isModal ? 2.5 : 1.5;
          ctx.beginPath();
          ctx.moveTo(cx + p1.x, cy + p1.y);
          ctx.quadraticCurveTo(cx + midPt.x, cy + midPt.y, cx + p2.x, cy + p2.y);
          ctx.stroke();

          // Packet
          arc.progress = (arc.progress + arc.speed) % 1;
          const t = arc.progress;
          const t1 = 1 - t;
          const curX = t1 * t1 * p1.x + 2 * t1 * t * midPt.x + t * t * p2.x;
          const curY = t1 * t1 * p1.y + 2 * t1 * t * midPt.y + t * t * p2.y;

          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = isBlue ? "#00f0ff" : "#ff6600";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(cx + curX, cy + curY, isModal ? 4 : 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 7. Markers
      markersRef.current.forEach((m) => {
        const pt = latLngTo3D(m.lat, m.lng, radius);

        if (pt.z > 0) {
          const depthScale = 0.6 + (pt.z / radius) * 0.6;
          const pulse = (Math.sin(time * 3.5 + m.lat) + 1) / 2;

          // Pulse
          ctx.strokeStyle = isBlue
            ? `rgba(0, 210, 255, ${0.8 - pulse * 0.6})`
            : `rgba(255, 102, 0, ${0.8 - pulse * 0.6})`;
          ctx.lineWidth = isModal ? 2 : 1.5;
          ctx.beginPath();
          ctx.arc(cx + pt.x, cy + pt.y, (m.size * (isModal ? 1.4 : 1) + pulse * 8) * depthScale, 0, Math.PI * 2);
          ctx.stroke();

          // Core
          ctx.fillStyle = isBlue ? "#00d2ff" : "#ff6600";
          ctx.shadowColor = isBlue ? "#00f0ff" : "#ff6600";
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(cx + pt.x, cy + pt.y, m.size * (isModal ? 1.4 : 1) * depthScale, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // White center
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(cx + pt.x, cy + pt.y, m.size * (isModal ? 0.6 : 0.4) * depthScale, 0, Math.PI * 2);
          ctx.fill();

          // Premium glowing badge label
          if (pt.z > radius * 0.15) {
            const fontSize = isModal ? 12 : 10;
            ctx.font = `bold ${fontSize}px Inter, -apple-system, sans-serif`;
            const textWidth = ctx.measureText(m.label).width;
            const badgeX = cx + pt.x + (isModal ? 12 : 8);
            const badgeY = cy + pt.y - fontSize * 0.65;
            const paddingX = 6;
            const paddingY = 3.5;

            // Badge Background Pill
            ctx.fillStyle = "rgba(12, 12, 16, 0.88)";
            ctx.strokeStyle = isBlue ? "rgba(0, 210, 255, 0.6)" : "rgba(255, 102, 0, 0.5)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            const bx = badgeX - paddingX;
            const by = badgeY - paddingY;
            const bw = textWidth + paddingX * 2;
            const bh = fontSize + paddingY * 2;
            if (typeof ctx.roundRect === "function") {
              ctx.roundRect(bx, by, bw, bh, 6);
            } else {
              ctx.rect(bx, by, bw, bh);
            }
            ctx.fill();
            ctx.stroke();

            // Badge Text
            ctx.fillStyle = "#ffffff";
            ctx.fillText(m.label, badgeX, badgeY + fontSize * 0.85);
          }
        }
      });
    };

    const render = () => {
      time += 0.02;

      if (!isDragging.current) {
        // Silky smooth momentum inertia when released
        if (Math.abs(velocityX.current) > 0.00005 || Math.abs(velocityY.current) > 0.00005) {
          rotY.current += velocityX.current;
          rotX.current = Math.max(-0.85, Math.min(0.85, rotX.current + velocityY.current));
          velocityX.current *= 0.92; // smooth aerodynamic friction
          velocityY.current *= 0.92;
        } else {
          rotY.current += 0.0035;
        }
      }

      if (canvasRef.current) {
        drawGlobeOnCanvas(canvasRef.current, false);
      }
      if (modalCanvasRef.current && isExpanded) {
        drawGlobeOnCanvas(modalCanvasRef.current, true);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isExpanded]);

  // Handle Resize with mobile performance optimization (lower DPR on mobile for ultra-smooth 60/120fps)
  useEffect(() => {
    const handleResize = () => {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const dpr = isMobile
        ? Math.min(window.devicePixelRatio || 1, 1.25)
        : Math.min(window.devicePixelRatio || 2, 2);

      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width || 420, 440);
        canvasRef.current.width = size * dpr;
        canvasRef.current.height = size * dpr;
        canvasRef.current.style.width = `${size}px`;
        canvasRef.current.style.height = `${size}px`;
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) ctx.scale(dpr, dpr);
      }

      if (modalCanvasRef.current) {
        const size = Math.min(window.innerWidth * 0.85, window.innerHeight * 0.72, 760);
        modalCanvasRef.current.width = size * dpr;
        modalCanvasRef.current.height = size * dpr;
        modalCanvasRef.current.style.width = `${size}px`;
        modalCanvasRef.current.style.height = `${size}px`;
        const ctx = modalCanvasRef.current.getContext("2d");
        if (ctx) ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isExpanded]);

  // Pointer drag handlers with capture and velocity tracking
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    velocityX.current = 0;
    velocityY.current = 0;
    pointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;

    const speed = 0.0055;
    rotY.current += dx * speed;
    rotX.current = Math.max(-0.85, Math.min(0.85, rotX.current - dy * speed));

    // Measure velocity for seamless swipe release
    velocityX.current = dx * speed * 0.75;
    velocityY.current = -dy * speed * 0.75;

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = false;
    try {
      if (pointerIdRef.current !== null) {
        e.currentTarget.releasePointerCapture(pointerIdRef.current);
      }
    } catch {}
    pointerIdRef.current = null;
  };

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  return (
    <>
      {/* INLINE GLOBE CONTAINER */}
      <div
        ref={containerRef}
        onDoubleClick={() => setIsExpanded(true)}
        className={`relative w-full aspect-square max-w-[440px] mx-auto flex items-center justify-center select-none group ${className}`}
        style={{ minHeight: "340px" }}
      >
        {/* Floating Expand Button */}
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="btn-hover-scale absolute top-2 right-2 z-10 p-2 rounded-[8px] bg-black/60 hover:bg-cyan-500 md:hover:bg-[#ff6600] text-neutral-300 hover:text-white border border-[#27272a] hover:border-cyan-400 md:hover:border-[#ff6600] shadow-lg backdrop-blur-md cursor-pointer opacity-80 group-hover:opacity-100 transition-all"
          title="Double-cliquez pour agrandir en plein écran"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: "none" }}
          className="w-full h-full cursor-grab active:cursor-grabbing rounded-full shadow-2xl touch-none select-none"
        />
      </div>

      {/* FULLSCREEN IMMERSIVE 3D GLOBE MODAL WITH BACKDROP BLUR */}
      {isExpanded && (
        <div
          ref={modalBackdropRef}
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex flex-col items-center justify-between p-4 sm:p-8 select-none cursor-pointer"
        >
          {/* Floating Top Header Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl flex items-center justify-between p-4 rounded-[14px] bg-[#141416]/90 border border-[#27272a] shadow-2xl backdrop-blur-md cursor-default"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-cyan-500 md:bg-[#ff6600] flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 md:shadow-[#ff6600]/30 font-bold">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Trafic Mondial Edge — Vue Planétaire 3D</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h2>
                <p className="text-xs text-neutral-400">
                  Glissez pour faire tourner la Terre • Double-cliquez ou cliquez en dehors pour quitter
                </p>
              </div>
            </div>

            {/* Hub stats pills & Close Button */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#1a1a1e] border border-[#27272a] text-xs">
                <Radio className="w-3.5 h-3.5 text-cyan-400 md:text-[#ff6600] animate-pulse" />
                <span className="font-semibold text-white">
                  {markers.length > 0 ? `${markers.length} Pays Visiteur${markers.length > 1 ? "s" : ""}` : "Cloudflare Edge Actif"}
                </span>
                <span className="text-emerald-400 font-mono font-bold">&lt; 0.8 ms</span>
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="btn-hover-scale p-2 rounded-[8px] bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 cursor-pointer"
                title="Fermer la vue plein écran (Échap)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Giant 3D Canvas */}
          <div
            ref={modalContentRef}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={() => setIsExpanded(false)}
            className="relative flex items-center justify-center my-auto aspect-square max-w-[760px] max-h-[72vh] cursor-grab active:cursor-grabbing"
          >
            <canvas
              ref={modalCanvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ touchAction: "none" }}
              className="w-full h-full rounded-full shadow-[0_0_80px_rgba(0,210,255,0.25)] md:shadow-[0_0_80px_rgba(255,102,0,0.25)] touch-none select-none"
            />
          </div>

          {/* Bottom Floating Hubs Ribbon */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl flex items-center justify-between gap-2 p-3 rounded-[12px] bg-[#141416]/90 border border-[#27272a] overflow-x-auto text-xs cursor-default backdrop-blur-md"
          >
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {markers.length === 0 ? (
                <span className="text-neutral-500 italic px-2">
                  Aucun pays visiteur pour l&apos;instant • Les points lumineux apparaîtront dès vos premières visites.
                </span>
              ) : (
                markers.map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#1a1a1e] border border-[#27272a] text-neutral-300 whitespace-nowrap shrink-0 hover:border-cyan-500/40 md:hover:border-[#ff6600]/40 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400 md:bg-[#ff6600]" />
                    <span className="font-semibold text-white">{m.label}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {m.lat > 0 ? `${m.lat.toFixed(1)}°N` : `${(-m.lat).toFixed(1)}°S`}
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="btn-hover-scale px-3 py-1.5 rounded-[8px] bg-cyan-500 hover:bg-cyan-400 md:bg-[#ff6600] md:hover:bg-[#ff771a] text-white font-bold text-xs shrink-0 cursor-pointer shadow-md shadow-cyan-500/25 md:shadow-[#ff6600]/25"
            >
              Fermer la vue
            </button>
          </div>
        </div>
      )}
    </>
  );
}
