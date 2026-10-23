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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#DDE7E2] pb-[env(safe-area-inset-bottom)] transition-all shadow-[0_-4px_20px_rgba(4,38,28,0.04)]">
      <div className="max-w-md mx-auto flex items-center justify-around py-1 px-3" role="tablist" aria-label="Navigasi utama">
        {tabs.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className="apple-press flex flex-col items-center justify-center gap-1 py-1.5 px-4 min-h-[48px] min-w-[64px] rounded-2xl relative transition-all group focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
              role="tab"
              aria-selected={isActive}
              aria-label={label}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive
                      ? "text-[#0A4D3C] scale-110"
                      : "text-[#4A6359] group-hover:text-[#04261C]"
                  }`}
                  strokeWidth={isActive ? 2.4 : 1.75}
                />
                {key === "escrow" && ordersCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#0A4D3C] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in-75 duration-200">
                    {ordersCount}
                  </span>
                )}
              </div>
              <span
                className={`text-xs tracking-tight transition-colors ${
                  isActive
                    ? "font-bold text-[#0A4D3C]"
                    : "font-medium text-[#4A6359] group-hover:text-[#04261C]"
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-[#0A4D3C]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
