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
    { key: "green", label: "🟢 Segar" },
    { key: "yellow", label: "🟡 Diskon" },
    { key: "near", label: "⚡ < 5 km" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="pointer-events-auto mx-3 mt-3 sm:mx-5 sm:mt-4 max-w-2xl lg:max-w-3xl xl:mx-auto">
        {/* Main bar — white card like Bali Fuel Watch */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_6px_24px_rgba(15,23,42,0.12)] border border-slate-200 px-3 py-2.5 sm:px-4">
          {/* Main row */}
          <div className="flex items-center justify-between gap-3">
            {/* Brand */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-600 to-emerald-400 flex items-center justify-center shadow-sm">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Sirkula
                </span>
                <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                  Beta
                </span>
              </div>
            </div>

            {/* GPS Pill */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              <Navigation2 className="w-3 h-3" />
              <span className="font-medium">GPS Aktif</span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters((p) => !p)}
                className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl transition-all border ${
                  showFilters
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                Filter
              </button>

              {/* Factory list toggle */}
              <button
                onClick={onToggleFactoryList}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isFactoryListOpen
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pabrik</span>
                <span className="font-bold">{factoriesCount}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    isFactoryListOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Collapsible filter chips */}
          {showFilters && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 overflow-x-auto scrollbar-none">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => onFilterChange(f.key)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                    activeFilter === f.key
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
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
