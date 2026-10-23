"use client";

import React from "react";
import { 
  Compass, 
  MapPin, 
  Leaf
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
      <div className="bg-emerald-50 text-xs py-1.5 px-3 flex items-center justify-between border-b border-emerald-100">
        <div className="flex items-center gap-2 truncate">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-700"></span>
          </span>
          <span className="text-emerald-950 font-bold tracking-wide">
            SLA Kesegaran 12 Jam Aktif
          </span>
          <span className="text-emerald-400 hidden sm:inline">•</span>
          <span className="text-emerald-800 hidden sm:inline font-medium">
            Radius Maksimal 15 KM
          </span>
        </div>

        <button
          onClick={onOpenSDGModal}
          className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden"
        >
          <Leaf className="w-3.5 h-3.5 text-emerald-200" />
          <span>SDG 12 &amp; 13: 12.8 Ton Diselamatkan</span>
        </button>
      </div>

      {/* Main App Bar */}
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-3 bg-white">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                Sirkula
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Kliring Ampas Tahu
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-600">
              Pabrik Tahu : Pakan Ternak Segar
            </p>
          </div>
        </div>

        {/* Current User Location Chip */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-800 transition-colors">
          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <div className="text-left max-w-[130px] sm:max-w-[200px] truncate">
            <span className="text-xs font-semibold text-slate-900 block truncate">
              {USER_FARMER_LOCATION.name}
            </span>
          </div>
          <span className="text-xs text-emerald-900 bg-emerald-100 border border-emerald-200 px-2 rounded font-mono font-bold" title={`Tersedia ${totalKgAvailable} kg total ampas`}>
            {totalKgAvailable} kg
          </span>
        </div>
      </div>

      {/* Filter Tabs & Map Radar Indicator */}
      <div className="px-3.5 pb-2.5 pt-1 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none bg-white">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => onFilterChange("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all text-xs whitespace-nowrap min-h-[36px] ${
              activeFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            Semua ({factoriesCount})
          </button>
          <button
            onClick={() => onFilterChange("green")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all text-xs flex items-center gap-1.5 whitespace-nowrap min-h-[36px] ${
              activeFilter === "green"
                ? "bg-emerald-800 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Segar Prima (0-8j)
          </button>
          <button
            onClick={() => onFilterChange("yellow")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all text-xs flex items-center gap-1.5 whitespace-nowrap min-h-[36px] ${
              activeFilter === "yellow"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Diskon 15% (8-10.5j)
          </button>
          <button
            onClick={() => onFilterChange("near")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all text-xs flex items-center gap-1 whitespace-nowrap min-h-[36px] ${
              activeFilter === "near"
                ? "bg-emerald-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            Dekat (&lt;5 km)
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
