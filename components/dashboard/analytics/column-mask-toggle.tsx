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
        className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1a1a1e] dark:hover:bg-white/10 text-zinc-700 hover:text-zinc-900 dark:text-neutral-300 dark:hover:text-white border border-zinc-300 dark:border-[#27272a] text-xs font-semibold transition-all cursor-pointer shadow-sm"
        title="Customize visible columns"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff6600]" />
        <span>Columns ({visibleColumns.size}/{columns.length})</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 text-zinc-900 dark:text-white">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-[#222225]">
            <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#ff6600]" />
              <span>Column Visibility</span>
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"
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
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-[10px] text-xs transition-colors cursor-pointer ${
                    isVisible
                      ? "bg-[#ff6600]/10 text-zinc-900 dark:text-white font-medium"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-zinc-100 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isVisible ? (
                      <Eye className="w-3.5 h-3.5 text-[#ff6600] shrink-0" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-zinc-400 dark:text-neutral-600 shrink-0" />
                    )}
                    <span className="truncate">{col.label}</span>
                  </div>
                  {isVisible && <Check className="w-3.5 h-3.5 text-[#ff6600] shrink-0" />}
                </button>
              );
            })}
          </div>

          {onResetColumns && (
            <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-[#222225] flex justify-end">
              <button
                type="button"
                onClick={onResetColumns}
                className="text-[11px] text-[#ff6600] hover:underline font-semibold cursor-pointer"
              >
                Reset all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
