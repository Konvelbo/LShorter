"use client";

import React, { useState, useMemo } from "react";
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
import { Globe2, ZoomIn, ZoomOut, RotateCcw, MapPin, MousePointerClick, Activity } from "lucide-react";

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

  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [10, 15],
    zoom: 1,
  });

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
    <div className="rounded-[16px] bg-[#141416] border border-[#222225] p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
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

        {/* Map Zoom & Reset Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {(selectedContinent !== "ALL" || (selectedCountry && selectedCountry !== "ALL")) && (
            <button
              type="button"
              onClick={() => {
                onSelectContinent("ALL");
                if (onSelectCountry) onSelectCountry("ALL");
              }}
              className="px-2.5 py-1.5 rounded-[8px] bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold border border-[#27272a] transition-all cursor-pointer"
            >
              Réinitialiser Filtres
            </button>
          )}

          <div className="flex items-center bg-[#1a1a1e] border border-[#27272a] rounded-[8px] p-0.5">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoomer"
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-[6px] transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Dézoomer"
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-[6px] transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Réinitialiser vue"
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-[6px] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive react-simple-maps Canvas Container */}
      <div className="relative w-full aspect-[2.1/1] max-h-[460px] my-1 flex items-center justify-center bg-[#0d0d10] rounded-[14px] border border-[#1f1f23] overflow-hidden select-none">
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
              className={`p-3 rounded-[12px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
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
  );
}
