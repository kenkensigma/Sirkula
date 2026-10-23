"use client";

import React from "react";
import { Map, Layers, ShieldCheck, Leaf } from "lucide-react";

export type NavTab = "map" | "catalog" | "escrow" | "sdg";

interface BottomAppbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  ordersCount: number;
}

const tabs: { key: NavTab; label: string; Icon: typeof Map }[] = [
  { key: "map", label: "Peta", Icon: Map },
  { key: "catalog", label: "Katalog", Icon: Layers },
  { key: "escrow", label: "Escrow", Icon: ShieldCheck },
  { key: "sdg", label: "SDG", Icon: Leaf },
];

export const BottomAppbar: React.FC<BottomAppbarProps> = ({
  activeTab,
  onTabChange,
  ordersCount,
}) => {
  return (
    <nav 
      aria-label="Navigasi Utama" 
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-sm"
    >
      <div 
        role="tablist"
        aria-orientation="horizontal"
        className="max-w-md mx-auto flex items-center justify-around py-1.5 px-2"
      >
        {tabs.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              aria-label={`Tab ${label}`}
              onClick={() => onTabChange(key)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 min-h-[44px] min-w-[56px] rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden ${
                isActive
                  ? "text-emerald-900 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.75} />
                {key === "escrow" && ordersCount > 0 && (
                  <span 
                    aria-label={`${ordersCount} pesanan aktif`}
                    className="absolute -top-1 -right-2.5 bg-emerald-700 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white"
                  >
                    {ordersCount}
                  </span>
                )}
              </div>
              <span className={`text-[11px] leading-tight ${isActive ? "font-bold text-emerald-900" : "font-medium text-slate-700"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
