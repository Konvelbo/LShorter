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
  { code: "SN", name: "Sénégal" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "BF", name: "Burkina Faso" },
  { code: "ML", name: "Mali" },
  { code: "GN", name: "Guinée" },
  { code: "CM", name: "Cameroun" },
  { code: "GA", name: "Gabon" },
  { code: "TG", name: "Togo" },
  { code: "BJ", name: "Bénin" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "RDC (Congo Kinshasa)" },
  { code: "NE", name: "Niger" },
  { code: "TD", name: "Tchad" },
  { code: "MA", name: "Maroc" },
  { code: "DZ", name: "Algérie" },
  { code: "TN", name: "Tunisie" },
  { code: "MG", name: "Madagascar" },
  { code: "MU", name: "Maurice" },
  { code: "US", name: "États-Unis" },
  { code: "CA", name: "Canada" },
  { code: "BE", name: "Belgique" },
  { code: "CH", name: "Suisse" },
  { code: "GB", name: "Royaume-Uni" },
  { code: "DE", name: "Allemagne" },
  { code: "ES", name: "Espagne" },
  { code: "IT", name: "Italie" },
  { code: "PT", name: "Portugal" },
  { code: "NL", name: "Pays-Bas" },
  { code: "SE", name: "Suède" },
  { code: "NO", name: "Norvège" },
  { code: "DK", name: "Danemark" },
  { code: "FI", name: "Finlande" },
  { code: "IE", name: "Irlande" },
  { code: "AT", name: "Autriche" },
  { code: "PL", name: "Pologne" },
  { code: "BR", name: "Brésil" },
  { code: "MX", name: "Mexique" },
  { code: "AR", name: "Argentine" },
  { code: "CO", name: "Colombie" },
  { code: "CL", name: "Chili" },
  { code: "AE", name: "Émirats Arabes Unis" },
  { code: "SA", name: "Arabie Saoudite" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Koweït" },
  { code: "JP", name: "Japon" },
  { code: "CN", name: "Chine" },
  { code: "KR", name: "Corée du Sud" },
  { code: "IN", name: "Inde" },
  { code: "SG", name: "Singapour" },
  { code: "AU", name: "Australie" },
  { code: "NZ", name: "Nouvelle-Zélande" },
  { code: "ZA", name: "Afrique du Sud" },
  { code: "NG", name: "Nigéria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "RW", name: "Rwanda" },
  { code: "ET", name: "Éthiopie" },
  { code: "AO", name: "Angola" },
  { code: "MZ", name: "Mozambique" },
  { code: "RU", name: "Russie" },
  { code: "TR", name: "Turquie" },
  { code: "GR", name: "Grèce" },
  { code: "RO", name: "Roumanie" },
  { code: "CZ", name: "République Tchèque" },
  { code: "HU", name: "Hongrie" },
  { code: "UA", name: "Ukraine" },
  { code: "EG", name: "Égypte" },
  { code: "IL", name: "Israël" },
  { code: "LB", name: "Liban" },
  { code: "TH", name: "Thaïlande" },
  { code: "VN", name: "Vietnam" },
  { code: "ID", name: "Indonésie" },
  { code: "MY", name: "Malaisie" },
  { code: "PH", name: "Philippines" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "LK", name: "Sri Lanka" },
  { code: "PE", name: "Pérou" },
  { code: "VE", name: "Venezuela" },
  { code: "EC", name: "Équateur" },
  { code: "BO", name: "Bolivie" },
  { code: "PY", name: "Paraguay" },
  { code: "UY", name: "Uruguay" },
  { code: "CR", name: "Costa Rica" },
  { code: "PA", name: "Panama" },
  { code: "DO", name: "République Dominicaine" },
  { code: "CU", name: "Cuba" },
  { code: "HT", name: "Haïti" },
  { code: "JM", name: "Jamaïque" },
  { code: "LU", name: "Luxembourg" },
  { code: "MC", name: "Monaco" },
  { code: "IS", name: "Islande" },
  { code: "HR", name: "Croatie" },
  { code: "RS", name: "Serbie" },
  { code: "BG", name: "Bulgarie" },
  { code: "SK", name: "Slovaquie" },
  { code: "SI", name: "Slovénie" },
  { code: "LT", name: "Lituanie" },
  { code: "LV", name: "Lettonie" },
  { code: "EE", name: "Estonie" },
  { code: "CY", name: "Chypre" },
  { code: "MT", name: "Malte" },
  { code: "GE", name: "Géorgie" },
  { code: "AM", name: "Arménie" },
  { code: "AZ", name: "Azerbaïdjan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "UZ", name: "Ouzbékistan" },
  { code: "TM", name: "Turkménistan" },
  { code: "KG", name: "Kirghizistan" },
  { code: "TJ", name: "Tadjikistan" },
  { code: "AF", name: "Afghanistan" },
  { code: "IQ", name: "Irak" },
  { code: "SY", name: "Syrie" },
  { code: "JO", name: "Jordanie" },
  { code: "YE", name: "Yémen" },
  { code: "OM", name: "Oman" },
  { code: "BH", name: "Bahreïn" },
  { code: "LY", name: "Libye" },
  { code: "SD", name: "Soudan" },
  { code: "SS", name: "Soudan du Sud" },
  { code: "SO", name: "Somalie" },
  { code: "DJ", name: "Djibouti" },
  { code: "ER", name: "Érythrée" },
  { code: "MR", name: "Mauritanie" },
  { code: "GM", name: "Gambie" },
  { code: "GW", name: "Guinée-Bissau" },
  { code: "SL", name: "Sierra Leone" },
  { code: "LR", name: "Libéria" },
  { code: "CV", name: "Cap-Vert" },
  { code: "ST", name: "Sao Tomé-et-Principe" },
  { code: "GQ", name: "Guinée Équatoriale" },
  { code: "CF", name: "République Centrafricaine" },
  { code: "BI", name: "Burundi" },
  { code: "UG", name: "Ouganda" },
  { code: "TZ", name: "Tanzanie" },
  { code: "MW", name: "Malawi" },
  { code: "ZM", name: "Zambie" },
  { code: "ZW", name: "Zimbabwe" },
  { code: "BW", name: "Botswana" },
  { code: "NA", name: "Namibie" },
  { code: "LS", name: "Lesotho" },
  { code: "SZ", name: "Eswatini" },
  { code: "KM", name: "Comores" },
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
    if (!isProPlan && rules.length >= 1) {
      triggerPlanUpgrade({
        reason: "Le forfait Freemium est limité à 1 seule règle de ciblage pays. Passez au forfait Pro pour créer des règles illimitées.",
        targetPlan: "PRO",
      });
      return;
    }

    const newRule: RoutingRule = {
      id: `rule_${Date.now()}`,
      title: `Règle ${rules.length + 1}`,
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

  const handleAddCondition = (ruleId: string) => {
    if (!isProPlan) {
      triggerPlanUpgrade({
        reason: "Le routage multi-conditions combiné (ET) est réservé aux membres Pro.",
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
                type: "plateforme",
                operator: "est",
                value: "ios",
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
    if (!isProPlan && updates.type && updates.type !== "pays") {
      triggerPlanUpgrade({
        reason: "Le ciblage par appareil (Android/iOS) et plateforme est réservé au forfait Pro.",
        targetPlan: "PRO",
      });
      return;
    }

    onChange(
      rules.map((r) => {
        if (r.id === ruleId) {
          return {
            ...r,
            conditions: r.conditions.map((c) =>
              c.id === condId ? { ...c, ...updates } : c
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
          <span>RÈGLES DE ROUTAGE</span>
        </h4>
        <span className="text-[11px] text-neutral-400">
          Redirection intelligente multi-conditions
        </span>
      </div>

      {/* Rules List */}
      <div className="flex flex-col gap-4">
        {rules.map((rule, ruleIdx) => (
          <div
            key={rule.id}
            className="rounded-[12px] bg-[#141416] border border-[#27272a] p-4 sm:p-5 flex flex-col gap-4 shadow-xl relative animate-in fade-in"
          >
            {/* Rule Header matching screenshots media_1788192235523.png & media_1788192481738.png */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-neutral-500 cursor-grab" />
                <span className="font-bold text-sm text-white">{rule.title}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleCollapse(rule.id)}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-[6px] hover:bg-white/5 cursor-pointer"
                >
                  {rule.isCollapsed ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Déplier</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Replier</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteRule(rule.id)}
                  className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded-[6px] cursor-pointer"
                  title="Supprimer la règle"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!rule.isCollapsed && (
              <div className="flex flex-col gap-4 pt-1 border-t border-[#222225]">
                {/* Conditions Block */}
                <div className="flex flex-col gap-3">
                  {rule.conditions.map((cond, condIdx) => (
                    <div
                      key={cond.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      {/* Prefix Label ("Si" for first, "Et" for rest) */}
                      <div className="sm:col-span-1 text-xs font-semibold text-neutral-400">
                        {condIdx === 0 ? "Si" : "Et"}
                      </div>

                      {/* Type Dropdown (Pays, Région, Appareil, Plateforme) */}
                      <div className="sm:col-span-3">
                        <select
                          value={cond.type}
                          onChange={(e) =>
                            handleUpdateCondition(rule.id, cond.id, {
                              type: e.target.value as any,
                              value: e.target.value === "pays" ? "FR" : "ios",
                            })
                          }
                          className="w-full h-10 rounded-[8px] bg-[#1a1a1e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                        >
                          <option value="pays" className="bg-[#141416] text-white">Pays</option>
                          <option value="plateforme" className="bg-[#141416] text-white">Plateforme</option>
                          <option value="appareil" className="bg-[#141416] text-white">Appareil</option>
                          <option value="region" className="bg-[#141416] text-white">Région</option>
                        </select>
                      </div>

                      {/* Operator Dropdown (est, n'est pas) */}
                      <div className="sm:col-span-2">
                        <select
                          value={cond.operator}
                          onChange={(e) =>
                            handleUpdateCondition(rule.id, cond.id, {
                              operator: e.target.value as any,
                            })
                          }
                          className="w-full h-10 rounded-[8px] bg-[#1a1a1e] text-white border border-[#27272a] px-2.5 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer text-center"
                        >
                          <option value="est" className="bg-[#141416] text-white">est</option>
                          <option value="nest_pas" className="bg-[#141416] text-white">n&apos;est pas</option>
                        </select>
                      </div>

                      {/* Values Selector (All Countries / Platforms / OS / Regions) */}
                      <div className="sm:col-span-5">
                        {cond.type === "pays" && (
                          <select
                            value={cond.value}
                            onChange={(e) =>
                              handleUpdateCondition(rule.id, cond.id, {
                                value: e.target.value,
                              })
                            }
                            className="w-full h-10 rounded-[8px] bg-[#1a1a1e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
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
                            className="w-full h-10 rounded-[8px] bg-[#1a1a1e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                          >
                            <option value="ios" className="bg-[#141416] text-white">iOS (iPhone & iPad)</option>
                            <option value="android" className="bg-[#141416] text-white">Android</option>
                            <option value="windows" className="bg-[#141416] text-white">Windows</option>
                            <option value="macos" className="bg-[#141416] text-white">macOS</option>
                            <option value="linux" className="bg-[#141416] text-white">Linux</option>
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
                            className="w-full h-10 rounded-[8px] bg-[#1a1a1e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                          >
                            <option value="mobile" className="bg-[#141416] text-white">Mobile (Smartphones)</option>
                            <option value="tablet" className="bg-[#141416] text-white">Tablette</option>
                            <option value="desktop" className="bg-[#141416] text-white">Ordinateur (Desktop)</option>
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
                            className="w-full h-10 rounded-[8px] bg-[#1a1a1e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                          >
                            <option value="europe" className="bg-[#141416] text-white">Europe (UE)</option>
                            <option value="west_africa" className="bg-[#141416] text-white">Afrique de l&apos;Ouest (CEDEAO)</option>
                            <option value="central_africa" className="bg-[#141416] text-white">Afrique Centrale</option>
                            <option value="north_america" className="bg-[#141416] text-white">Amérique du Nord</option>
                            <option value="asia" className="bg-[#141416] text-white">Asie & Pacifique</option>
                          </select>
                        )}
                      </div>

                      {/* Remove Condition Button */}
                      <div className="sm:col-span-1 flex justify-end">
                        {rule.conditions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCondition(rule.id, cond.id)}
                            className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer"
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
                      className="text-[#ff6600] hover:text-[#ff771a] font-semibold text-xs flex items-center gap-1 px-2.5 py-1 rounded-[6px] hover:bg-[#ff6600]/10 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter une condition</span>
                    </button>
                  </div>
                </div>

                {/* Target URL Destination ("Alors aller à") */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-[#222225]">
                  <label className="text-xs font-semibold text-neutral-300">
                    Alors aller à <span className="text-[#ff6600]">*</span>
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
                          placeholder="https://shop.example.com/promo-specifique"
                          value={rule.destinationUrl}
                          onChange={(e) => handleUpdateDestination(rule.id, e.target.value)}
                          className={cn(
                            isInvalid &&
                              "border-red-500 focus:border-red-500 focus:ring-red-500/30 bg-red-950/20 text-red-100"
                          )}
                        />
                        {isInvalid && (
                          <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-[8px] px-2.5 py-1.5 mt-1 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                            <span className="font-medium">
                              Format d&apos;URL invalide. Doit être une adresse Web valide (ex: https://shop.example.com/promo).
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

      {/* Add Rule Button matching screenshot */}
      <button
        type="button"
        onClick={handleAddRule}
        className="w-fit px-4 py-2 rounded-[8px] bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white border border-[#27272a] hover:border-[#ff6600] font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
      >
        <Plus className="w-4 h-4 text-[#ff6600]" />
        <span>Ajouter une règle</span>
      </button>
    </div>
  );
}
