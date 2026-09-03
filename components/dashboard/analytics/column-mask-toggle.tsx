"use client";

import React, { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, Check, Eye, EyeOff, X } from "lucide-react";

export interface ColumnDefinition {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

interface ColumnMaskToggleProps {
  columns: ColumnDefinition[];
  visibleColumns: Set<string>;
  onToggleColumn: (key: string) => void;
  onResetColumns?: () => void;
}

export function ColumnMaskToggle({
  columns,
  visibleColumns,
  onToggleColumn,
  onResetColumns,
}: ColumnMaskToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#1a1a1e] hover:bg-white/10 text-neutral-300 hover:text-white border border-[#27272a] text-xs font-semibold transition-all cursor-pointer shadow-sm"
        title="Personnaliser les colonnes visibles"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff6600]" />
        <span>Colonnes ({visibleColumns.size}/{columns.length})</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-[12px] bg-[#141416] border border-[#27272a] p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 text-white">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222225]">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#ff6600]" />
              <span>Visibilité des Colonnes</span>
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
            {columns.map((col) => {
              const isVisible = visibleColumns.has(col.key);
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => onToggleColumn(col.key)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs transition-colors cursor-pointer ${
                    isVisible
                      ? "bg-[#ff6600]/10 text-white font-medium"
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isVisible ? (
                      <Eye className="w-3.5 h-3.5 text-[#ff6600] shrink-0" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                    )}
                    <span className="truncate">{col.label}</span>
                  </div>
                  {isVisible && <Check className="w-3.5 h-3.5 text-[#ff6600] shrink-0" />}
                </button>
              );
            })}
          </div>

          {onResetColumns && (
            <div className="pt-2 mt-2 border-t border-[#222225] flex justify-end">
              <button
                type="button"
                onClick={onResetColumns}
                className="text-[11px] text-[#ff6600] hover:underline font-semibold cursor-pointer"
              >
                Tout réinitialiser
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
