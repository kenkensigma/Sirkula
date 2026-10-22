"use client";

import React from "react";
import { 
  Compass, 
  MapPin, 
  Sparkles
} from "lucide-react";
import { USER_FARMER_LOCATION } from "@/data/mockFactories";

interface AppHeaderProps {
  activeFilter: "all" | "near" | "green" | "yellow";
  onFilterChange: (filter: "all" | "near" | "green" | "yellow") => void;
  factoriesCount: number;
  totalKgAvailable: number;
  onOpenSDGModal: () => void;
  onToggleRadiusCircle: () => void;
  isRadiusCircleVisible: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeFilter,
  onFilterChange,
  factoriesCount,
  totalKgAvailable,
  onOpenSDGModal,
  onToggleRadiusCircle,
  isRadiusCircleVisible,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md text-slate-800 border-b border-slate-200 shadow-xs">
      {/* Top Banner: SDGs & Freshness SLA status */}
      <div className="bg-emerald-50 text-[11px] py-1 px-3 flex items-center justify-between border-b border-emerald-100">
        <div className="flex items-center gap-1.5 truncate">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span className="text-emerald-900 font-semibold tracking-wide">
            SLA Kesegaran 12 Jam Aktif
          </span>
          <span className="text-emerald-400 hidden sm:inline">•</span>
          <span className="text-emerald-700 hidden sm:inline">
            Radius Maksimal 15 KM
          </span>
        </div>

        <button
          onClick={onOpenSDGModal}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors shadow-2xs"
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>SDG 12 & 13: 12.8 Ton Diselamatkan</span>
        </button>
      </div>

      {/* Main App Bar */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-3 bg-white">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-1">
                Sirkula
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded">
                  Beta
                </span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 leading-none">
              Pabrik Tahu ➔ Pakan Ternak Segar
            </p>
          </div>
        </div>

        {/* Current User Location Chip */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 text-xs text-slate-700 transition-colors cursor-pointer group">
          <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0 group-hover:scale-110 transition-transform" />
          <div className="text-left max-w-[130px] sm:max-w-[200px] truncate">
            <span className="text-[11px] font-semibold text-slate-800 block truncate">
              {USER_FARMER_LOCATION.name}
            </span>
          </div>
          <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-1.5 rounded font-mono font-bold" title={`Tersedia ${totalKgAvailable} kg total ampas`}>
            {totalKgAvailable} kg
          </span>
        </div>
      </div>

      {/* Filter Tabs & Map Radar Indicator */}
      <div className="px-3 pb-2.5 pt-1 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none bg-white">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => onFilterChange("all")}
            className={`px-3 py-1 rounded-full font-medium transition-all text-xs whitespace-nowrap ${
              activeFilter === "all"
                ? "bg-slate-900 text-white font-bold shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            Semua ({factoriesCount})
          </button>
          <button
            onClick={() => onFilterChange("green")}
            className={`px-3 py-1 rounded-full font-medium transition-all text-xs flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === "green"
                ? "bg-emerald-600 text-white font-bold shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Segar Prima (0-8j)
          </button>
          <button
            onClick={() => onFilterChange("yellow")}
            className={`px-3 py-1 rounded-full font-medium transition-all text-xs flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === "yellow"
                ? "bg-amber-500 text-white font-bold shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Diskon 15% (8-10.5j)
          </button>
          <button
            onClick={() => onFilterChange("near")}
            className={`px-3 py-1 rounded-full font-medium transition-all text-xs flex items-center gap-1 whitespace-nowrap ${
              activeFilter === "near"
                ? "bg-teal-600 text-white font-bold shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            ⚡ Terdekat (&lt;5 km)
          </button>
        </div>

        {/* Toggle 15 KM radar circle on map */}
        <button
          onClick={onToggleRadiusCircle}
          title="Toggle Radius Radar 15 KM"
          className={`shrink-0 flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
            isRadiusCircleVisible 
              ? "bg-green-50 border-green-200 text-green-700 font-semibold" 
              : "bg-slate-100 border-slate-200 text-slate-500"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isRadiusCircleVisible ? "bg-emerald-500" : "bg-slate-400"}`} />
          Radar 15km
        </button>
      </div>
    </header>
  );
};
