"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import {
  Continent,
  CONTINENTS_META,
  getContinentForCountry,
  getCountryFromGeography,
  CountryGeoData,
  WORLD_COUNTRIES,
  getCountryData,
} from "@/lib/geo-coordinates";
import { Globe2, ZoomIn, ZoomOut, RotateCcw, MapPin, MousePointerClick, Activity, Maximize2, Minimize2, X } from "lucide-react";

// Standard high-resolution World Atlas TopoJSON
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export interface ContinentTraffic {
  continent: Continent;
  clicks: number;
  uniqueVisitors: number;
  percentage: number;
  countriesCount: number;
}

interface ContinentsVectorMapProps {
  continentsData: Record<Continent, ContinentTraffic>;
  selectedContinent: Continent | "ALL";
  onSelectContinent: (continent: Continent | "ALL") => void;
  totalClicks: number;
  topCountries?: Array<{ code: string; name: string; count: number; percentage: number }>;
  onSelectCountry?: (countryCode: string) => void;
  selectedCountry?: string;
}

export function ContinentsVectorMap({
  continentsData,
  selectedContinent,
  onSelectContinent,
  totalClicks,
  topCountries = [],
  onSelectCountry,
  selectedCountry,
}: ContinentsVectorMapProps) {
  // Active hovered country state for bottom-left display panel
  const [hoveredCountry, setHoveredCountry] = useState<{
    code: string;
    name: string;
    flag: string;
    continent: Continent;
    clicks: number;
    percentage: number;
  } | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);

  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [10, 15],
    zoom: 1,
  });

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

  // Active country clicks lookup
  const countryClicksMap = useMemo(() => {
    const map = new Map<string, number>();
    topCountries.forEach((c) => {
      map.set(c.code.toUpperCase(), c.count);
    });
    return map;
  }, [topCountries]);

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleResetZoom = () => {
    setPosition({ coordinates: [10, 15], zoom: 1 });
  };

  const totalAllClicks = totalClicks || 1;

  return (
    <>
    <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
      {/* Header & Map Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 md:text-[#ff6600] px-2 py-0.5 rounded-full bg-cyan-500/10 md:bg-[#ff6600]/10 border border-cyan-500/20 md:border-[#ff6600]/20 flex items-center gap-1.5">
              <Globe2 className="w-3 h-3" />
              <span>Cartographie Interactive react-simple-maps</span>
            </span>
          </div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Carte Mondiale des Continents & Pays</span>
            {selectedContinent !== "ALL" && (
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-semibold border"
                style={{
                  color: CONTINENTS_META[selectedContinent].color,
                  borderColor: `${CONTINENTS_META[selectedContinent].color}40`,
                  backgroundColor: `${CONTINENTS_META[selectedContinent].color}15`,
                }}
              >
                Filtré : {CONTINENTS_META[selectedContinent].name}
              </span>
            )}
            {selectedCountry && selectedCountry !== "ALL" && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/40">
                Pays : {getCountryData(selectedCountry).flag} {getCountryData(selectedCountry).name}
              </span>
            )}
          </h3>
          <p className="text-xs text-neutral-400">
            Survolez n&apos;importe quel pays du monde pour voir son nom et ses données s&apos;afficher dans le bandeau inférieur gauche.
          </p>
        </div>

        {/* Map Zoom & Reset Controls & Fullscreen Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {(selectedContinent !== "ALL" || (selectedCountry && selectedCountry !== "ALL")) && (
            <button
              type="button"
              onClick={() => {
                onSelectContinent("ALL");
                if (onSelectCountry) onSelectCountry("ALL");
              }}
              className="px-2.5 py-1.5 rounded-[10px] bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold border border-[#27272a] transition-all cursor-pointer"
            >
              Réinitialiser Filtres
            </button>
          )}

          <div className="flex items-center bg-[#1a1a1e] border border-[#27272a] rounded-[10px] p-0.5">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoomer"
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-[10px] transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Dézoomer"
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-[10px] transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Réinitialiser vue"
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-[10px] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Expand Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="p-1.5 rounded-[10px] bg-cyan-500/10 md:bg-[#ff6600]/10 hover:bg-cyan-500 md:hover:bg-[#ff6600] text-cyan-400 md:text-[#ff6600] hover:text-white border border-cyan-500/25 md:border-[#ff6600]/25 shadow-sm transition-all cursor-pointer"
            title="Agrandir en plein écran (Double-clic)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive react-simple-maps Canvas Container */}
      <div
        onDoubleClick={() => setIsExpanded(true)}
        className="relative w-full aspect-[2.1/1] max-h-[460px] my-1 flex items-center justify-center bg-[#0d0d10] rounded-[10px] border border-[#1f1f23] overflow-hidden select-none cursor-pointer"
        title="Double-cliquez pour agrandir en plein écran"
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
            center: [10, 20],
          }}
          className="w-full h-full"
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={(pos) => setPosition(pos)}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryData: CountryGeoData = getCountryFromGeography(geo);
                  const continent = countryData.continent;
                  const continentMeta = CONTINENTS_META[continent];
                  const continentClicks = continentsData[continent]?.clicks || 0;
                  const countryClicks = countryClicksMap.get(countryData.code.toUpperCase()) || 0;

                  const isContinentSelected = selectedContinent === "ALL" || selectedContinent === continent;
                  const isCountrySelected = !selectedCountry || selectedCountry === "ALL" || selectedCountry === countryData.code;
                  const isHovered = hoveredCountry?.code === countryData.code;

                  // Dynamic color calculation
                  let fillColor = "#1b1b22";
                  let strokeColor = "#272730";

                  if (countryClicks > 0) {
                    fillColor = continentMeta.color;
                    strokeColor = "#ffffff";
                  } else if (continentClicks > 0 && isContinentSelected) {
                    fillColor = `${continentMeta.color}35`;
                    strokeColor = `${continentMeta.color}60`;
                  }

                  if (isHovered) {
                    fillColor = continentMeta.color;
                    strokeColor = "#ffffff";
                  }

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        setHoveredCountry({
                          code: countryData.code,
                          name: countryData.name,
                          flag: countryData.flag,
                          continent,
                          clicks: countryClicks,
                          percentage: totalAllClicks > 0 ? Math.round((countryClicks / totalAllClicks) * 100) : 0,
                        });
                      }}
                      onMouseLeave={() => setHoveredCountry(null)}
                      onClick={() => {
                        if (onSelectCountry && countryClicks > 0) {
                          onSelectCountry(selectedCountry === countryData.code ? "ALL" : countryData.code);
                        } else {
                          onSelectContinent(selectedContinent === continent ? "ALL" : continent);
                        }
                      }}
                      style={{
                        default: {
                          fill: fillColor,
                          stroke: strokeColor,
                          strokeWidth: countryClicks > 0 ? 1 : 0.5,
                          outline: "none",
                          opacity: isContinentSelected && isCountrySelected ? 1 : 0.25,
                          transition: "all 200ms ease",
                          cursor: "pointer",
                        },
                        hover: {
                          fill: continentMeta.color,
                          stroke: "#ffffff",
                          strokeWidth: 1.4,
                          outline: "none",
                          opacity: 1,
                          cursor: "pointer",
                        },
                        pressed: {
                          fill: continentMeta.color,
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Glowing Markers for active visitor countries */}
            {topCountries.filter((c) => c.count > 0).map((c) => {
              const geoData = WORLD_COUNTRIES[c.code.toUpperCase()] || getCountryData(c.code);
              if (!geoData || !geoData.lng || !geoData.lat) return null;
              const meta = CONTINENTS_META[geoData.continent];
              const isSelected = selectedCountry === c.code;

              return (
                <Marker
                  key={c.code}
                  coordinates={[geoData.lng, geoData.lat]}
                  onMouseEnter={() => {
                    setHoveredCountry({
                      code: c.code,
                      name: geoData.name,
                      flag: geoData.flag,
                      continent: geoData.continent,
                      clicks: c.count,
                      percentage: totalAllClicks > 0 ? Math.round((c.count / totalAllClicks) * 100) : 0,
                    });
                  }}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => onSelectCountry && onSelectCountry(isSelected ? "ALL" : c.code)}
                >
                  <g className="cursor-pointer">
                    {/* Pulsing ring */}
                    <circle r="12" fill={meta.color} opacity="0.3" className="animate-ping pointer-events-none" />
                    <circle r="6" fill={meta.color} opacity="0.6" className="pointer-events-none" />
                    <circle
                      r="3.5"
                      fill="#ffffff"
                      stroke={meta.color}
                      strokeWidth="2"
                    />
                  </g>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* 📍 BOTTOM-LEFT COMPACT HOVER BADGE (Appears ONLY on active country hover) */}
        {hoveredCountry && (
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#141416]/90 backdrop-blur-md border border-[#27272a] rounded-[10px] px-3 py-2 shadow-2xl flex items-center gap-2.5">
              <span className="text-lg leading-none shrink-0">{hoveredCountry.flag}</span>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs whitespace-nowrap">
                    {hoveredCountry.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    ({hoveredCountry.code})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] mt-0.5 whitespace-nowrap">
                  <span
                    className="font-semibold"
                    style={{ color: CONTINENTS_META[hoveredCountry.continent]?.color }}
                  >
                    {CONTINENTS_META[hoveredCountry.continent]?.name}
                  </span>
                  <span className="text-neutral-600">•</span>
                  <span className="font-mono font-bold">
                    {hoveredCountry.clicks > 0 ? (
                      <span className="text-[#ff6600]">
                        {hoveredCountry.clicks} clics ({hoveredCountry.percentage}%)
                      </span>
                    ) : (
                      <span className="text-neutral-500">0 clic</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Continents Traffic Summary Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-4 border-t border-[#222225] z-10">
        {(Object.keys(CONTINENTS_META) as Continent[]).map((cont) => {
          const meta = CONTINENTS_META[cont];
          const data = continentsData[cont] || { clicks: 0, percentage: 0, uniqueVisitors: 0, countriesCount: 0 };
          const isSelected = selectedContinent === cont;

          return (
            <button
              key={cont}
              type="button"
              onClick={() => onSelectContinent(isSelected ? "ALL" : cont)}
              className={`p-3 rounded-[10px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-white/10 border-white shadow-lg scale-102"
                  : data.clicks > 0
                  ? "bg-[#1a1a1e] border-[#27272a] hover:border-white/40 hover:bg-white/5"
                  : "bg-[#141416]/60 border-[#222225] opacity-60 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs flex items-center gap-1.5">
                  <span>{meta.icon}</span>
                  <span className="font-bold text-white truncate">{meta.name}</span>
                </span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
              </div>

              <div className="flex items-baseline justify-between gap-1">
                <span className="text-lg font-bold text-white font-mono">
                  {data.clicks}
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: meta.color }}
                >
                  {data.percentage}%
                </span>
              </div>

              <div className="w-full h-1 rounded-full bg-white/10 mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${data.percentage}%`,
                    backgroundColor: meta.color,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>

    {/* FULLSCREEN IMMERSIVE 2D VECTOR MAP MODAL */}
    {isExpanded && (
      <div
        onClick={() => setIsExpanded(false)}
        className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-2xl flex flex-col items-center justify-between p-3 sm:p-6 select-none cursor-pointer animate-in fade-in duration-200"
      >
        {/* Modal Header */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-6xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-[10px] bg-[#141416]/95 border border-[#27272a] shadow-2xl backdrop-blur-md cursor-default shrink-0"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[10px] bg-cyan-500 md:bg-[#ff6600] flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 md:shadow-[#ff6600]/30 font-bold shrink-0">
              <Globe2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                <span>Cartographie Mondiale Interactive — Vue Plein Écran</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </h2>
              <p className="text-[11px] sm:text-xs text-neutral-400 truncate">
                Zoomez, déplacez et survolez les pays • Appuyez sur Échap ou cliquez pour quitter
              </p>
            </div>
          </div>

          {/* Modal Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#1a1a1e] border border-[#27272a] rounded-[10px] p-0.5">
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoomer"
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-[10px] transition-colors cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                title="Dézoomer"
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-[10px] transition-colors cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Réinitialiser vue"
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-[10px] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-[10px] bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 cursor-pointer transition-colors"
              title="Fermer la vue plein écran (Échap)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Center Large Map */}
        <div
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={() => setIsExpanded(false)}
          className="relative w-full max-w-6xl flex-1 my-3 flex items-center justify-center bg-[#0a0a0d] rounded-[10px] border border-[#1f1f24] overflow-hidden select-none cursor-grab active:cursor-grabbing shadow-2xl min-h-[320px]"
        >
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 140,
              center: [10, 20],
            }}
            className="w-full h-full"
          >
            <ZoomableGroup
              zoom={position.zoom}
              center={position.coordinates}
              onMoveEnd={(pos) => setPosition(pos)}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryData: CountryGeoData = getCountryFromGeography(geo);
                    const continent = countryData.continent;
                    const continentMeta = CONTINENTS_META[continent];
                    const continentClicks = continentsData[continent]?.clicks || 0;
                    const countryClicks = countryClicksMap.get(countryData.code.toUpperCase()) || 0;

                    const isContinentSelected = selectedContinent === "ALL" || selectedContinent === continent;
                    const isCountrySelected = !selectedCountry || selectedCountry === "ALL" || selectedCountry === countryData.code;
                    const isHovered = hoveredCountry?.code === countryData.code;

                    let fillColor = "#1b1b22";
                    let strokeColor = "#272730";

                    if (countryClicks > 0) {
                      fillColor = continentMeta.color;
                      strokeColor = "#ffffff";
                    } else if (continentClicks > 0 && isContinentSelected) {
                      fillColor = `${continentMeta.color}35`;
                      strokeColor = `${continentMeta.color}60`;
                    }

                    if (isHovered) {
                      fillColor = continentMeta.color;
                      strokeColor = "#ffffff";
                    }

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => {
                          const count = countryClicksMap.get(countryData.code.toUpperCase()) || 0;
                          const pct = totalAllClicks > 0 ? Math.round((count / totalAllClicks) * 100) : 0;
                          setHoveredCountry({
                            code: countryData.code,
                            name: countryData.name,
                            flag: countryData.flag,
                            continent,
                            clicks: count,
                            percentage: pct,
                          });
                        }}
                        onMouseLeave={() => setHoveredCountry(null)}
                        onClick={() => {
                          if (onSelectCountry) {
                            onSelectCountry(selectedCountry === countryData.code ? "ALL" : countryData.code);
                          }
                        }}
                        style={{
                          default: {
                            fill: fillColor,
                            stroke: strokeColor,
                            strokeWidth: countryClicks > 0 || isHovered ? 0.8 : 0.4,
                            outline: "none",
                            transition: "all 250ms ease",
                            cursor: "pointer",
                            opacity: isContinentSelected && isCountrySelected ? 1 : 0.25,
                          },
                          hover: {
                            fill: continentMeta.color,
                            stroke: "#ffffff",
                            strokeWidth: 1.2,
                            outline: "none",
                            cursor: "pointer",
                          },
                          pressed: {
                            fill: continentMeta.color,
                            stroke: "#ffffff",
                            strokeWidth: 1.2,
                            outline: "none",
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>

              {/* Glowing Markers for active visitor countries in Fullscreen */}
              {topCountries.filter((c) => c.count > 0).map((c) => {
                const geoData = WORLD_COUNTRIES[c.code.toUpperCase()] || getCountryData(c.code);
                if (!geoData || !geoData.lng || !geoData.lat) return null;
                const meta = CONTINENTS_META[geoData.continent];
                const isSelected = selectedCountry === c.code;

                return (
                  <Marker
                    key={`modal-marker-${c.code}`}
                    coordinates={[geoData.lng, geoData.lat]}
                    onMouseEnter={() => {
                      setHoveredCountry({
                        code: c.code,
                        name: geoData.name,
                        flag: geoData.flag,
                        continent: geoData.continent,
                        clicks: c.count,
                        percentage: totalAllClicks > 0 ? Math.round((c.count / totalAllClicks) * 100) : 0,
                      });
                    }}
                    onMouseLeave={() => setHoveredCountry(null)}
                    onClick={() => onSelectCountry && onSelectCountry(isSelected ? "ALL" : c.code)}
                  >
                    <g className="cursor-pointer">
                      {/* Pulsing ring */}
                      <circle r="14" fill={meta.color} opacity="0.3" className="animate-ping pointer-events-none" />
                      <circle r="7" fill={meta.color} opacity="0.6" className="pointer-events-none" />
                      <circle
                        r="4"
                        fill="#ffffff"
                        stroke={meta.color}
                        strokeWidth="2.5"
                      />
                    </g>
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>

          {/* Floating Tooltip in Fullscreen */}
          {hoveredCountry && (
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 p-3 rounded-[10px] bg-[#141416]/95 border border-[#27272a] shadow-2xl backdrop-blur-md animate-in fade-in duration-150">
              <span className="text-2xl">{hoveredCountry.flag}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{hoveredCountry.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-[10px] font-bold uppercase" style={{ color: CONTINENTS_META[hoveredCountry.continent].color, backgroundColor: `${CONTINENTS_META[hoveredCountry.continent].color}15` }}>
                    {CONTINENTS_META[hoveredCountry.continent].name}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-neutral-400">
                  <span>Clics: <strong className="text-white">{hoveredCountry.clicks}</strong></span>
                  <span>Part: <strong className="text-white">{hoveredCountry.percentage}%</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Continents Ribbon */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-6xl grid grid-cols-3 sm:grid-cols-6 gap-2 p-2.5 rounded-[10px] bg-[#141416]/95 border border-[#27272a] backdrop-blur-md shrink-0 cursor-default"
        >
          {(Object.keys(CONTINENTS_META) as Continent[]).map((cont) => {
            const meta = CONTINENTS_META[cont];
            const data = continentsData[cont] || { clicks: 0, percentage: 0, uniqueVisitors: 0, countriesCount: 0 };
            const isSelected = selectedContinent === cont;

            return (
              <button
                key={cont}
                type="button"
                onClick={() => onSelectContinent(isSelected ? "ALL" : cont)}
                className={`p-2 rounded-[10px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-white/10 border-white shadow-md scale-102"
                    : data.clicks > 0
                    ? "bg-[#1a1a1e] border-[#27272a] hover:border-white/40 hover:bg-white/5"
                    : "bg-[#141416]/60 border-[#222225] opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-white truncate flex items-center gap-1">
                    <span>{meta.icon}</span>
                    <span className="truncate">{meta.name}</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold" style={{ color: meta.color }}>
                    {data.clicks}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    )}
    </>
  );
}
