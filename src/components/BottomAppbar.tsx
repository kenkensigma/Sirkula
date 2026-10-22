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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-2">
        {tabs.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${
                isActive
                  ? "text-green-700"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.5} />
                {key === "escrow" && ordersCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-green-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {ordersCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${isActive ? "font-semibold" : "font-normal"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
