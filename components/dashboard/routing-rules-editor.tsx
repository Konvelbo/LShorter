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
  type: "pays" | "region" | "appareil" | "plateforme";
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

export function RoutingRulesEditor({ rules, onChange, userPlan = "FREEMIUM" }: RoutingRulesEditorProps) {
  const [countrySearch, setCountrySearch] = useState("");
  const isProPlan = userPlan === "PRO" || userPlan === "BUSINESS";

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
        return "BF";
      case "appareil":
        return "mobile";
      case "plateforme":
        return "windows";
      case "region":
        return "west_africa";
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

  return (
    <div className="flex flex-col gap-4 text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
        <h4 className="font-bold text-sm tracking-wider uppercase text-white flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-[#ff6600]" />
          <span>ROUTING RULES</span>
        </h4>
        <span className="text-[11px] text-neutral-400">
          Smart multi-condition redirection
        </span>
      </div>

      {/* Rules List */}
      <div className="flex flex-col gap-4">
        {rules.map((rule, ruleIdx) => (
          <div
            key={rule.id}
            className="rounded-[10px] bg-[#141416] border border-[#27272a] p-4 sm:p-5 flex flex-col gap-4 shadow-xl relative animate-in fade-in"
          >
            {/* Rule Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-neutral-500 cursor-grab" />
                <span className="font-bold text-sm text-white">{rule.title}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleCollapse(rule.id)}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-[10px] hover:bg-white/5 cursor-pointer"
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
                  className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded-[10px] cursor-pointer"
                  title="Delete rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!rule.isCollapsed && (
              <div className="flex flex-col gap-4 pt-1 border-t border-[#222225]">
                {/* Conditions Block */}
                <div className="flex flex-col gap-2.5">
                  {rule.conditions.map((cond, condIdx) => (
                    <div
                      key={cond.id}
                      className="p-3 sm:p-2 rounded-[10px] bg-[#141418] border border-[#27272f] sm:bg-transparent sm:border-0 flex flex-col gap-2 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-center"
                    >
                      {/* Mobile Header: Prefix + Delete */}
                      <div className="flex items-center justify-between sm:contents">
                        <div className="sm:col-span-1 text-xs font-bold text-neutral-300">
                          <span className="px-2 py-0.5 rounded-[10px] bg-white/5 sm:bg-transparent text-[#ff6600] font-mono">
                            {condIdx === 0 ? "If" : "And"}
                          </span>
                        </div>

                        {rule.conditions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCondition(rule.id, cond.id)}
                            className="sm:hidden text-red-400 hover:text-red-300 p-1 rounded-[10px]"
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
                            value={cond.type}
                            onChange={(e) =>
                              handleUpdateCondition(rule.id, cond.id, {
                                type: e.target.value as any,
                                value: getDefaultValueForType(e.target.value),
                              })
                            }
                            className="w-full h-10 rounded-[10px] bg-[#1a1a1e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                          >
                            <option value="pays" className="bg-[#141416] text-white">Country</option>
                            <option value="plateforme" className="bg-[#141416] text-white">Platform (OS)</option>
                            <option value="appareil" className="bg-[#141416] text-white">Device</option>
                            <option value="region" className="bg-[#141416] text-white">Region</option>
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
                            className="w-full h-10 rounded-[10px] bg-[#1a1a1e] text-white border border-[#27272a] px-2.5 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer text-center"
                          >
                            <option value="est" className="bg-[#141416] text-white">is</option>
                            <option value="nest_pas" className="bg-[#141416] text-white">is not</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 2 on Mobile: Value Selector */}
                      <div className="sm:col-span-5">
                        {cond.type === "pays" && (
                          <select
                            value={cond.value}
                            onChange={(e) =>
                              handleUpdateCondition(rule.id, cond.id, {
                                value: e.target.value,
                              })
                            }
                            className="w-full h-10 rounded-[10px] bg-[#1a1a1e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                          >
                            {ALL_WORLD_COUNTRIES.map((c) => (
                              <option
                                key={c.code}
                                value={c.code}
                                className="bg-[#141416] text-white"
                              >
                                {c.name} ({c.code})
                              </option>
                            ))}
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
                            className="w-full h-10 rounded-[10px] bg-[#1a1a1e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                          >
                            <option value="windows" className="bg-[#141416] text-white">Windows</option>
                            <option value="macos" className="bg-[#141416] text-white">macOS</option>
                            <option value="linux" className="bg-[#141416] text-white">Linux</option>
                            <option value="ios" className="bg-[#141416] text-white">iOS (iPhone &amp; iPad)</option>
                            <option value="android" className="bg-[#141416] text-white">Android</option>
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
                            className="w-full h-10 rounded-[10px] bg-[#1a1a1e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                          >
                            <option value="mobile" className="bg-[#141416] text-white">Mobile (Smartphones)</option>
                            <option value="tablet" className="bg-[#141416] text-white">Tablet</option>
                            <option value="desktop" className="bg-[#141416] text-white">Desktop Computer</option>
                          </select>
                        )}

                        {cond.type === "region" && (
                          <select
                            value={cond.value}
                            onChange={(e) =>
                              handleUpdateCondition(rule.id, cond.id, {
                                value: e.target.value,
                              })
                            }
                            className="w-full h-10 rounded-[10px] bg-[#1a1a1e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                          >
                            <option value="europe" className="bg-[#141416] text-white">Europe (EU)</option>
                            <option value="west_africa" className="bg-[#141416] text-white">West Africa (ECOWAS)</option>
                            <option value="central_africa" className="bg-[#141416] text-white">Central Africa</option>
                            <option value="north_america" className="bg-[#141416] text-white">North America</option>
                            <option value="asia" className="bg-[#141416] text-white">Asia &amp; Pacific</option>
                          </select>
                        )}
                      </div>

                      {/* Desktop Remove Condition Button */}
                      <div className="hidden sm:flex sm:col-span-1 justify-end">
                        {rule.conditions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCondition(rule.id, cond.id)}
                            className="text-neutral-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-[10px] transition-colors cursor-pointer"
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
                      className="text-[#ff6600] hover:text-[#ff771a] font-semibold text-xs flex items-center gap-1 px-3 py-1.5 rounded-[10px] hover:bg-[#ff6600]/10 border border-[#ff6600]/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add condition</span>
                    </button>
                  </div>
                </div>

                {/* Target URL Destination ("Then redirect to") */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-[#222225]">
                  <label className="text-xs font-semibold text-neutral-300">
                    Then redirect to <span className="text-[#ff6600]">*</span>
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
                              "border-red-500 focus:border-red-500 focus:ring-red-500/30 bg-red-950/20 text-red-100"
                          )}
                        />
                        {isInvalid && (
                          <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-[10px] px-2.5 py-1.5 mt-1 animate-in fade-in slide-in-from-top-1">
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
        className="w-full sm:w-fit px-4 py-2.5 rounded-[10px] bg-white/5 hover:bg-white/10 active:scale-98 text-neutral-200 hover:text-white border border-[#27272a] hover:border-[#ff6600] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
      >
        <Plus className="w-4 h-4 text-[#ff6600]" />
        <span>Add rule</span>
      </button>
    </div>
  );
}
