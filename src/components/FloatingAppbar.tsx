"use client";

import React, { useState } from "react";
import { Compass, Layers, ChevronDown, Navigation2 } from "lucide-react";
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

  const filters: { key: typeof activeFilter; label: string; color?: string }[] = [
    { key: "all", label: "Semua" },
    { key: "green", label: "🟢 Segar (0-8j)" },
    { key: "yellow", label: "🟡 Diskon 15% (8-10.5j)" },
    { key: "near", label: "Dekat (< 5 km)" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="pointer-events-auto mx-3 mt-3 sm:mx-5 sm:mt-4 max-w-2xl lg:max-w-3xl xl:mx-auto">
        {/* Main top bar card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 px-3.5 py-2.5 sm:px-4">
          {/* Main row */}
          <div className="flex items-center justify-between gap-3">
            {/* Brand */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
                <Compass className="w-4 h-4 text-emerald-100" />
              </div>
              <div className="flex items-center">
                <span className="text-base font-bold text-slate-900 tracking-tight">
                  Sirkula
                </span>
                <span className="ml-2 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Kliring Ampas Tahu
                </span>
              </div>
            </div>

            {/* GPS Pill */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <Navigation2 className="w-3 h-3 text-emerald-700" />
              <span className="font-semibold text-slate-800">GPS Denpasar</span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters((p) => !p)}
                aria-label="Buka pilihan filter"
                aria-expanded={showFilters}
                className={`text-xs font-semibold px-3 py-2 rounded-xl transition-all border min-h-[40px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden ${
                  showFilters
                    ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                    : "text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                Filter
              </button>

              {/* Factory list toggle */}
              <button
                onClick={onToggleFactoryList}
                aria-label={isFactoryListOpen ? "Tutup panel daftar pabrik" : "Buka panel daftar pabrik"}
                aria-expanded={isFactoryListOpen}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all min-h-[40px] focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden ${
                  isFactoryListOpen
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pabrik</span>
                <span className="font-bold font-mono">{factoriesCount}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    isFactoryListOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Collapsible filter chips */}
          {showFilters && (
            <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100 overflow-x-auto scrollbar-none">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => onFilterChange(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[36px] focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden ${
                    activeFilter === f.key
                      ? "bg-emerald-800 text-white"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
