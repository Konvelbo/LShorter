"use client";

import React, { useState } from "react";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  X,
  Globe2,
  Smartphone,
  Layers,
  Crown,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { PlanType } from "@/types";
import { triggerPlanUpgrade } from "@/lib/plan-guard";
import { cn } from "@/lib/utils";
import { getCountryFlag } from "@/lib/geo-coordinates";

// Comprehensive World Countries List (All 195+ Countries with ISO codes)
export const ALL_WORLD_COUNTRIES = [
  { code: "FR", name: "France" },
  { code: "SN", name: "Senegal" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "BF", name: "Burkina Faso" },
  { code: "ML", name: "Mali" },
  { code: "GN", name: "Guinea" },
  { code: "CM", name: "Cameroon" },
  { code: "GA", name: "Gabon" },
  { code: "TG", name: "Togo" },
  { code: "BJ", name: "Benin" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "DRC (Congo Kinshasa)" },
  { code: "NE", name: "Niger" },
  { code: "TD", name: "Chad" },
  { code: "MA", name: "Morocco" },
  { code: "DZ", name: "Algeria" },
  { code: "TN", name: "Tunisia" },
  { code: "MG", name: "Madagascar" },
  { code: "MU", name: "Mauritius" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "PT", name: "Portugal" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "IE", name: "Ireland" },
  { code: "AT", name: "Austria" },
  { code: "PL", name: "Poland" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "CO", name: "Colombia" },
  { code: "CL", name: "Chile" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "KR", name: "South Korea" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapore" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "RW", name: "Rwanda" },
  { code: "ET", name: "Ethiopia" },
  { code: "AO", name: "Angola" },
  { code: "MZ", name: "Mozambique" },
  { code: "RU", name: "Russia" },
  { code: "TR", name: "Turkey" },
  { code: "GR", name: "Greece" },
  { code: "RO", name: "Romania" },
  { code: "CZ", name: "Czech Republic" },
  { code: "HU", name: "Hungary" },
  { code: "UA", name: "Ukraine" },
  { code: "EG", name: "Egypt" },
  { code: "IL", name: "Israel" },
  { code: "LB", name: "Lebanon" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "ID", name: "Indonesia" },
  { code: "MY", name: "Malaysia" },
  { code: "PH", name: "Philippines" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "LK", name: "Sri Lanka" },
  { code: "PE", name: "Peru" },
  { code: "VE", name: "Venezuela" },
  { code: "EC", name: "Ecuador" },
  { code: "BO", name: "Bolivia" },
  { code: "PY", name: "Paraguay" },
  { code: "UY", name: "Uruguay" },
  { code: "CR", name: "Costa Rica" },
  { code: "PA", name: "Panama" },
  { code: "DO", name: "Dominican Republic" },
  { code: "CU", name: "Cuba" },
  { code: "HT", name: "Haiti" },
  { code: "JM", name: "Jamaica" },
  { code: "LU", name: "Luxembourg" },
  { code: "MC", name: "Monaco" },
  { code: "IS", name: "Iceland" },
  { code: "HR", name: "Croatia" },
  { code: "RS", name: "Serbia" },
  { code: "BG", name: "Bulgaria" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "LT", name: "Lithuania" },
  { code: "LV", name: "Latvia" },
  { code: "EE", name: "Estonia" },
  { code: "CY", name: "Cyprus" },
  { code: "MT", name: "Malta" },
  { code: "GE", name: "Georgia" },
  { code: "AM", name: "Armenia" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "TM", name: "Turkmenistan" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "AF", name: "Afghanistan" },
  { code: "IQ", name: "Iraq" },
  { code: "SY", name: "Syria" },
  { code: "JO", name: "Jordan" },
  { code: "YE", name: "Yemen" },
  { code: "OM", name: "Oman" },
  { code: "BH", name: "Bahrain" },
  { code: "LY", name: "Libya" },
  { code: "SD", name: "Sudan" },
  { code: "SS", name: "South Sudan" },
  { code: "SO", name: "Somalia" },
  { code: "DJ", name: "Djibouti" },
  { code: "ER", name: "Eritrea" },
  { code: "MR", name: "Mauritania" },
  { code: "GM", name: "Gambia" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "SL", name: "Sierra Leone" },
  { code: "LR", name: "Liberia" },
  { code: "CV", name: "Cape Verde" },
  { code: "ST", name: "Sao Tome and Principe" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "CF", name: "Central African Republic" },
  { code: "BI", name: "Burundi" },
  { code: "UG", name: "Uganda" },
  { code: "TZ", name: "Tanzania" },
  { code: "MW", name: "Malawi" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
  { code: "BW", name: "Botswana" },
  { code: "NA", name: "Namibia" },
  { code: "LS", name: "Lesotho" },
  { code: "SZ", name: "Eswatini" },
  { code: "KM", name: "Comoros" },
  { code: "SC", name: "Seychelles" },
];

export interface Condition {
  id: string;
  type: "pays" | "continent" | "region" | "appareil" | "plateforme" | "navigateur";
  operator: "est" | "nest_pas";
  value: string;
}

export interface RoutingRule {
  id: string;
  title: string;
  isCollapsed: boolean;
  conditions: Condition[];
  destinationUrl: string;
}

interface RoutingRulesEditorProps {
  rules: RoutingRule[];
  onChange: (rules: RoutingRule[]) => void;
  userPlan?: PlanType | string;
}

function CountryFlagDropdown({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (code: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected =
    ALL_WORLD_COUNTRIES.find((c) => c.code === value) ||
    ALL_WORLD_COUNTRIES[0];

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_WORLD_COUNTRIES;
    return ALL_WORLD_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-10 rounded-[10px] bg-white dark:bg-[#1a1a1e] text-zinc-900 dark:text-white border border-zinc-200 dark:border-[#27272a] hover:border-[#465FFF] px-3 text-xs flex items-center justify-between gap-2 focus:outline-none focus:border-brand transition-all cursor-pointer shadow-2xs"
      >
        <span className="flex items-center gap-2.5 min-w-0 truncate">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w40/${selected.code.toLowerCase()}.png`}
            alt={selected.name}
            className="w-5 h-3.5 rounded-[2px] object-cover shrink-0 border border-black/10 dark:border-white/10 shadow-2xs"
          />
          <span className="font-semibold text-zinc-900 dark:text-white truncate">
            {selected.name}
          </span>
          <span className="text-[11px] font-mono text-zinc-500 dark:text-neutral-400 shrink-0">
            ({selected.code})
          </span>
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-zinc-500 dark:text-neutral-400 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-[#465FFF]"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-[#27272a] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-zinc-100 dark:border-[#222225]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or ISO code (e.g. France, FR, US)..."
              autoFocus
              className="w-full h-8 rounded-lg bg-zinc-50 dark:bg-[#1a1a1e] text-zinc-900 dark:text-white border border-zinc-200 dark:border-[#27272a] px-2.5 text-xs placeholder:text-zinc-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-[#465FFF]"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-zinc-50 dark:divide-white/[0.02]">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-zinc-500 dark:text-neutral-400">
                No matching country found
              </div>
            ) : (
              filtered.map((c) => {
                const isActive = c.code === selected.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onSelect(c.code);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer",
                      isActive
                        ? "bg-[#ECF3FF] dark:bg-[#465FFF]/20 text-[#465FFF] dark:text-[#7592FF] font-bold"
                        : "text-zinc-800 dark:text-neutral-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                    )}
                  >
                    <span className="flex items-center gap-2.5 min-w-0 truncate">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                        alt={c.name}
                        loading="lazy"
                        className="w-5 h-3.5 rounded-[2px] object-cover shrink-0 border border-black/10 dark:border-white/10"
                      />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500 dark:text-neutral-400 shrink-0">
                      {c.code}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function RoutingRulesEditor({ rules, onChange, userPlan = "FREEMIUM" }: RoutingRulesEditorProps) {
  const isProPlan = userPlan === "PRO" || userPlan === "BUSINESS" || userPlan === "ENTERPRISE";

  const handleAddRule = () => {
    if (!isProPlan) {
      triggerPlanUpgrade({
        reason: "Smart dynamic routing is an exclusive feature for Pro and Business plans.",
        featureName: "Dynamic Routing",
        targetPlan: "PRO",
      });
      return;
    }

    const newRule: RoutingRule = {
      id: `rule_${Date.now()}`,
      title: `Rule ${rules.length + 1}`,
      isCollapsed: false,
      conditions: [
        {
          id: `cond_${Date.now()}_1`,
          type: "pays",
          operator: "est",
          value: "FR",
        },
      ],
      destinationUrl: "",
    };
    onChange([...rules, newRule]);
  };

  const handleToggleCollapse = (ruleId: string) => {
    onChange(
      rules.map((r) =>
        r.id === ruleId ? { ...r, isCollapsed: !r.isCollapsed } : r
      )
    );
  };

  const handleDeleteRule = (ruleId: string) => {
    onChange(rules.filter((r) => r.id !== ruleId));
  };

  const getDefaultValueForType = (type: string): string => {
    switch (type) {
      case "pays":
        return "FR";
      case "navigateur":
        return "chrome";
      case "appareil":
        return "mobile";
      case "plateforme":
        return "windows";
      case "continent":
      case "region":
        return "africa";
      default:
        return "mobile";
    }
  };

  const handleAddCondition = (ruleId: string) => {
    if (!isProPlan) {
      triggerPlanUpgrade({
        reason: "Combined multi-condition routing (AND) is reserved for Pro members.",
        targetPlan: "PRO",
      });
      return;
    }

    onChange(
      rules.map((r) => {
        if (r.id === ruleId) {
          return {
            ...r,
            conditions: [
              ...r.conditions,
              {
                id: `cond_${Date.now()}`,
                type: "appareil",
                operator: "est",
                value: "mobile",
              },
            ],
          };
        }
        return r;
      })
    );
  };

  const handleDeleteCondition = (ruleId: string, condId: string) => {
    onChange(
      rules.map((r) => {
        if (r.id === ruleId) {
          return {
            ...r,
            conditions: r.conditions.filter((c) => c.id !== condId),
          };
        }
        return r;
      })
    );
  };

  const handleUpdateCondition = (
    ruleId: string,
    condId: string,
    updates: Partial<Condition>
  ) => {
    if (!isProPlan) {
      triggerPlanUpgrade({
        reason: "Smart dynamic routing is an exclusive feature for Pro and Business plans.",
        featureName: "Dynamic Routing",
        targetPlan: "PRO",
      });
      return;
    }

    const finalUpdates = { ...updates };
    if (updates.type) {
      const currentRule = rules.find((r) => r.id === ruleId);
      const currentCond = currentRule?.conditions.find((c) => c.id === condId);
      if (!updates.value || (currentCond && currentCond.type !== updates.type)) {
        finalUpdates.value = getDefaultValueForType(updates.type);
      }
    }

    onChange(
      rules.map((r) => {
        if (r.id === ruleId) {
          return {
            ...r,
            conditions: r.conditions.map((c) =>
              c.id === condId ? { ...c, ...finalUpdates } : c
            ),
          };
        }
        return r;
      })
    );
  };

  const handleUpdateDestination = (ruleId: string, url: string) => {
    onChange(
      rules.map((r) => (r.id === ruleId ? { ...r, destinationUrl: url } : r))
    );
  };

  const selectClassName =
    "w-full h-10 rounded-[10px] bg-white dark:bg-[#1a1a1e] text-zinc-900 dark:text-white border border-zinc-200 dark:border-[#27272a] hover:border-[#465FFF] px-3 text-xs focus:outline-none focus:border-brand transition-all cursor-pointer shadow-2xs";
  const optionClassName = "bg-white dark:bg-[#141416] text-zinc-900 dark:text-white";

  return (
    <div className="flex flex-col gap-4 text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-[#27272a]">
        <h4 className="font-bold text-sm tracking-wider uppercase text-zinc-900 dark:text-white flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-brand" />
          <span>ROUTING RULES</span>
        </h4>
        <span className="text-[11px] text-zinc-500 dark:text-neutral-400">
          Smart multi-condition redirection
        </span>
      </div>

      {/* Rules List */}
      <div className="flex flex-col gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="rounded-[12px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] p-4 sm:p-5 flex flex-col gap-4 shadow-xs dark:shadow-xl relative animate-in fade-in"
          >
            {/* Rule Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-zinc-400 dark:text-neutral-500 cursor-grab" />
                <span className="font-bold text-sm text-zinc-900 dark:text-white">{rule.title}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleCollapse(rule.id)}
                  className="flex items-center gap-1 text-xs text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white px-2.5 py-1 rounded-[8px] hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {rule.isCollapsed ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Expand</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Collapse</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteRule(rule.id)}
                  className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-[8px] transition-colors cursor-pointer"
                  title="Delete rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!rule.isCollapsed && (
              <div className="flex flex-col gap-4 pt-2 border-t border-zinc-100 dark:border-[#222225]">
                {/* Conditions Block */}
                <div className="flex flex-col gap-2.5">
                  {rule.conditions.map((cond, condIdx) => (
                    <div
                      key={cond.id}
                      className="p-3 sm:p-2 rounded-[10px] bg-zinc-50 dark:bg-[#141418] border border-zinc-200 dark:border-[#27272f] sm:bg-transparent sm:border-0 flex flex-col gap-2 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-center"
                    >
                      {/* Mobile Header: Prefix + Delete */}
                      <div className="flex items-center justify-between sm:contents">
                        <div className="sm:col-span-1 text-xs font-bold">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-[6px] bg-[#ECF3FF] dark:bg-white/5 text-[#465FFF] font-mono font-bold">
                            {condIdx === 0 ? "If" : "And"}
                          </span>
                        </div>

                        {rule.conditions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCondition(rule.id, cond.id)}
                            className="sm:hidden text-red-500 dark:text-red-400 hover:text-red-600 p-1 rounded-[8px]"
                            title="Delete condition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Row 1 on Mobile: Type + Operator */}
                      <div className="grid grid-cols-2 gap-2 sm:contents">
                        {/* Type Dropdown */}
                        <div className="sm:col-span-3">
                          <select
                            value={cond.type === "region" ? "continent" : cond.type}
                            onChange={(e) =>
                              handleUpdateCondition(rule.id, cond.id, {
                                type: e.target.value as any,
                                value: getDefaultValueForType(e.target.value),
                              })
                            }
                            className={selectClassName}
                          >
                            <option value="pays" className={optionClassName}>Country (Pays)</option>
                            <option value="continent" className={optionClassName}>Continent</option>
                            <option value="navigateur" className={optionClassName}>Browser (Navigateur)</option>
                            <option value="plateforme" className={optionClassName}>Platform (OS)</option>
                            <option value="appareil" className={optionClassName}>Device</option>
                          </select>
                        </div>

                        {/* Operator Dropdown */}
                        <div className="sm:col-span-2">
                          <select
                            value={cond.operator}
                            onChange={(e) =>
                              handleUpdateCondition(rule.id, cond.id, {
                                operator: e.target.value as any,
                              })
                            }
                            className={cn(selectClassName, "text-center")}
                          >
                            <option value="est" className={optionClassName}>is</option>
                            <option value="nest_pas" className={optionClassName}>is not</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 2 on Mobile: Value Selector */}
                      <div className="sm:col-span-5">
                        {cond.type === "pays" && (
                          <CountryFlagDropdown
                            value={cond.value}
                            onSelect={(newCode) =>
                              handleUpdateCondition(rule.id, cond.id, {
                                value: newCode,
                              })
                            }
                          />
                        )}

                        {cond.type === "navigateur" && (
                          <select
                            value={cond.value}
                            onChange={(e) =>
                              handleUpdateCondition(rule.id, cond.id, {
                                value: e.target.value,
                              })
                            }
                            className={selectClassName}
                          >
                            <option value="chrome" className={optionClassName}>Google Chrome</option>
                            <option value="safari" className={optionClassName}>Apple Safari</option>
                            <option value="firefox" className={optionClassName}>Mozilla Firefox</option>
                            <option value="edge" className={optionClassName}>Microsoft Edge</option>
                            <option value="opera" className={optionClassName}>Opera</option>
                            <option value="brave" className={optionClassName}>Brave</option>
                            <option value="samsung" className={optionClassName}>Samsung Internet</option>
                          </select>
                        )}

                        {cond.type === "plateforme" && (
                          <select
                            value={cond.value}
                            onChange={(e) =>
                              handleUpdateCondition(rule.id, cond.id, {
                                value: e.target.value,
                              })
                            }
                            className={selectClassName}
                          >
                            <option value="windows" className={optionClassName}>Windows</option>
                            <option value="macos" className={optionClassName}>macOS</option>
                            <option value="linux" className={optionClassName}>Linux</option>
                            <option value="ios" className={optionClassName}>iOS (iPhone &amp; iPad)</option>
                            <option value="android" className={optionClassName}>Android</option>
                          </select>
                        )}

                        {cond.type === "appareil" && (
                          <select
                            value={cond.value}
                            onChange={(e) =>
                              handleUpdateCondition(rule.id, cond.id, {
                                value: e.target.value,
                              })
                            }
                            className={selectClassName}
                          >
                            <option value="mobile" className={optionClassName}>Mobile (Smartphones)</option>
                            <option value="tablet" className={optionClassName}>Tablet</option>
                            <option value="desktop" className={optionClassName}>Desktop Computer</option>
                          </select>
                        )}

                        {(cond.type === "continent" || cond.type === "region") && (
                          <select
                            value={cond.value}
                            onChange={(e) =>
                              handleUpdateCondition(rule.id, cond.id, {
                                value: e.target.value,
                              })
                            }
                            className={selectClassName}
                          >
                            <option value="africa" className={optionClassName}>Africa (Afrique)</option>
                            <option value="europe" className={optionClassName}>Europe</option>
                            <option value="north_america" className={optionClassName}>North America (Amérique du Nord)</option>
                            <option value="south_america" className={optionClassName}>South America (Amérique du Sud)</option>
                            <option value="asia" className={optionClassName}>Asia (Asie)</option>
                            <option value="oceania" className={optionClassName}>Oceania (Océanie)</option>
                            <option value="middle_east" className={optionClassName}>Middle East (Moyen-Orient)</option>
                          </select>
                        )}
                      </div>

                      {/* Desktop Remove Condition Button */}
                      <div className="hidden sm:flex sm:col-span-1 justify-end">
                        {rule.conditions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCondition(rule.id, cond.id)}
                            className="text-zinc-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-[10px] transition-colors cursor-pointer"
                            title="Delete condition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add Condition Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleAddCondition(rule.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#ECF3FF] dark:bg-[#465FFF]/15 text-[#465FFF] dark:text-[#7592FF] hover:bg-[#465FFF] hover:!text-white border border-[#465FFF]/30 font-semibold text-xs shadow-2xs hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add condition</span>
                    </button>
                  </div>
                </div>

                {/* Target URL Destination ("Then redirect to") */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-100 dark:border-[#222225]">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-neutral-300">
                    Then redirect to <span className="text-brand">*</span>
                  </label>
                  {(() => {
                    const trimmed = (rule.destinationUrl || "").trim();
                    let isInvalid = false;
                    if (trimmed) {
                      if (/\s/.test(trimmed)) {
                        isInvalid = true;
                      } else {
                        const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
                        try {
                          const u = new URL(withProto);
                          if (!u.hostname || (!u.hostname.includes(".") && u.hostname !== "localhost")) {
                            isInvalid = true;
                          }
                        } catch {
                          isInvalid = true;
                        }
                      }
                    }

                    return (
                      <>
                        <Input
                          required
                          placeholder="https://shop.example.com/special-deal"
                          value={rule.destinationUrl}
                          onChange={(e) => handleUpdateDestination(rule.id, e.target.value)}
                          className={cn(
                            isInvalid &&
                              "border-red-500 focus:border-red-500 focus:ring-red-500/30 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100"
                          )}
                        />
                        {isInvalid && (
                          <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-[10px] px-2.5 py-1.5 mt-1 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                            <span className="font-medium">
                              Invalid URL format. Must be a valid Web address (e.g. https://shop.example.com/promo).
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Rule Button */}
      <button
        type="button"
        onClick={handleAddRule}
        className="w-full sm:w-fit px-4 py-2.5 rounded-[10px] bg-white dark:bg-white/5 hover:bg-[#ECF3FF] dark:hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0 text-zinc-800 dark:text-neutral-200 hover:text-[#465FFF] dark:hover:text-white border border-zinc-200 dark:border-[#27272a] hover:border-[#465FFF] font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-2xs"
      >
        <Plus className="w-4 h-4 text-brand" />
        <span>Add rule</span>
      </button>
    </div>
  );
}
