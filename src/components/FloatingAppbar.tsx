"use client";

import React, { useState } from "react";
import { Compass, Layers, ChevronDown, SlidersHorizontal } from "lucide-react";
import { NavTab } from "./BottomAppbar";

interface FloatingAppbarProps {
  isFactoryListOpen: boolean;
  onToggleFactoryList: () => void;
  factoriesCount: number;
  activeFilter: "all" | "near" | "green" | "yellow";
  onFilterChange: (filter: "all" | "near" | "green" | "yellow") => void;
  onOpenSDGModal: () => void;
  isRadiusCircleVisible: boolean;
  onToggleRadiusCircle: () => void;
  totalKgAvailable: number;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  ordersCount: number;
}

export const FloatingAppbar: React.FC<FloatingAppbarProps> = ({
  isFactoryListOpen,
  onToggleFactoryList,
  factoriesCount,
  activeFilter,
  onFilterChange,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const filters: { key: typeof activeFilter; label: string; dot?: string }[] = [
    { key: "all", label: "Semua" },
    { key: "green", label: "Segar", dot: "#34c759" },
    { key: "yellow", label: "Diskon 15%", dot: "#ff9f0a" },
    { key: "near", label: "< 5 km" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="pointer-events-auto mx-3 mt-3 sm:mx-5 sm:mt-4 max-w-2xl lg:max-w-3xl xl:mx-auto">
        {/* Apple Dynamic Island Floating Card */}
        <div className="apple-glass rounded-2xl sm:rounded-[22px] px-3.5 py-2.5 sm:px-4 transition-all duration-300">
          {/* Main row */}
          <div className="flex items-center justify-between gap-3">
            {/* Brand identity */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 flex items-center justify-center shadow-[0_2px_8px_rgba(52,199,89,0.3)] border border-emerald-400/40">
                <Compass className="w-4 h-4 text-white" strokeWidth={2.2} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] sm:text-base font-bold text-slate-900 tracking-[-0.02em]">
                  Sirkula
                </span>
                <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                  Kliring Ampas Tahu
                </span>
              </div>
            </div>

            {/* GPS Signal Status Badge (Apple Status Style) */}
            <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-slate-600 bg-black/[0.04] px-2.5 py-1 rounded-full border border-black/[0.04]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium tracking-tight">GPS 15 km Aktif</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              {/* Filter toggle button */}
              <button
                onClick={() => setShowFilters((p) => !p)}
                className={`apple-press flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 min-h-[40px] rounded-xl border transition-all focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${
                  showFilters
                    ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/30"
                    : "bg-white/60 hover:bg-white text-slate-600 border-black/[0.06]"
                }`}
                aria-label="Filter pabrik"
                aria-expanded={showFilters}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Filter</span>
              </button>

              {/* Factory List Sheet Toggle */}
              <button
                onClick={onToggleFactoryList}
                className={`apple-press flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${
                  isFactoryListOpen
                    ? "bg-slate-900 text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                    : "bg-white/80 text-slate-800 hover:bg-white border border-black/[0.06] shadow-2xs"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Pabrik</span>
                <span className="font-bold opacity-80">{factoriesCount}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isFactoryListOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Apple Segmented Control Filter Bar */}
          {showFilters && (
            <div className="mt-2.5 pt-2.5 border-t border-black/[0.05] flex items-center justify-between gap-1 overflow-x-auto scrollbar-none animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="inline-flex p-0.5 bg-black/[0.05] rounded-xl w-full sm:w-auto">
                {filters.map((f) => {
                  const isActive = activeFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => onFilterChange(f.key)}
                      className={`apple-press-sm flex-1 sm:flex-initial px-3 py-1 rounded-[10px] text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        isActive
                          ? "bg-white text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {f.dot && (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: f.dot }}
                        />
                      )}
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
