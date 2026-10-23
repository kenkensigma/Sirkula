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
  { key: "sdg", label: "Dampak SDG", Icon: Leaf },
];

export const BottomAppbar: React.FC<BottomAppbarProps> = ({
  activeTab,
  onTabChange,
  ordersCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 apple-glass border-t border-black/[0.06] pb-[env(safe-area-inset-bottom)] transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around py-1.5 px-3" role="tablist" aria-label="Navigasi utama">
        {tabs.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className="apple-press flex flex-col items-center justify-center gap-1 py-1 px-4 min-h-[44px] min-w-[56px] rounded-2xl relative transition-all group focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              role="tab"
              aria-selected={isActive}
              aria-label={label}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive
                      ? "text-emerald-600 scale-110"
                      : "text-slate-600 group-hover:text-slate-700"
                  }`}
                  strokeWidth={isActive ? 2.4 : 1.75}
                />
                {key === "escrow" && ordersCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-emerald-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-[0_2px_4px_rgba(52,199,89,0.35)] animate-in zoom-in-75 duration-200">
                    {ordersCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight transition-colors ${
                  isActive
                    ? "font-bold text-emerald-800"
                    : "font-medium text-slate-600 group-hover:text-slate-700"
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-emerald-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
