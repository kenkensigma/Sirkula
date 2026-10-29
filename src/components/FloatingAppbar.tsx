"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Compass, Layers, SlidersHorizontal, LogIn, LogOut } from "lucide-react";
import { NavTab } from "./BottomAppbar";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user, isAuthenticated, logout } = useAuth();
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
        <div className="apple-glass rounded-2xl sm:rounded-[22px] px-3 py-2 sm:px-4 transition-all duration-300">
          {/* Main row */}
          <div className="flex items-center justify-between gap-2">
            {/* Brand identity */}
            <button
              onClick={onToggleFactoryList}
              className="flex items-center gap-2 shrink-0"
              aria-label="Buka daftar pabrik"
            >
              <div className="w-8 h-8 rounded-xl bg-[#0A4D3C] flex items-center justify-center shadow-xs border border-[#063125]">
                <Compass className="w-4 h-4 text-white" strokeWidth={2.2} />
              </div>
              <div className="hidden sm:flex items-baseline gap-1.5">
                <span className="text-[15px] sm:text-base font-bold text-[#04261C] tracking-tight">
                  Sirkula
                </span>
                <span className="text-[10px] font-semibold bg-[#F2F7F4] text-[#0A4D3C] border border-[#DDE7E2] px-2 py-0.5 rounded-md">
                  Kliring Ampas Tahu
                </span>
              </div>
            </button>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              {/* Factory List Sheet Toggle */}
              <button
                onClick={onToggleFactoryList}
                className={`apple-press flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 ${
                  isFactoryListOpen
                    ? "bg-[#0A4D3C] text-white shadow-xs"
                    : "bg-white text-[#04261C] hover:bg-[#F2F7F4] border border-[#DDE7E2] shadow-2xs"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{factoriesCount}</span>
              </button>

              {/* Filter toggle button */}
              <button
                onClick={() => setShowFilters((p) => !p)}
                className={`apple-press flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded-xl border transition-all focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 ${
                  showFilters
                    ? "bg-[#0A4D3C] text-white border-[#0A4D3C]"
                    : "bg-white hover:bg-[#F2F7F4] text-[#04261C] border-[#DDE7E2]"
                }`}
                aria-label="Filter pabrik"
                aria-expanded={showFilters}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs font-semibold">Filter</span>
              </button>

              {/* Auth Status & Login CTA */}
              {!isAuthenticated ? (
                <Link
                  href="/login"
                  className="apple-press flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-bold bg-[#0A4D3C] text-white hover:bg-[#063125] shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
                  aria-label="Masuk ke Akun Sirkula"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Masuk</span>
                </Link>
              ) : (
                <div className="flex items-center gap-1">
                  <Link href="/dashboard" className="apple-press flex items-center gap-1.5 bg-[#F2F7F4] hover:bg-[#E8F0EC] border border-[#DDE7E2] px-2 py-1.5 rounded-xl text-xs transition-colors" title="Buka Dashboard">
                    <div className="w-5 h-5 rounded-full bg-[#0A4D3C] text-white flex items-center justify-center font-bold text-[10px]">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="font-bold text-[#04261C] max-w-[70px] sm:max-w-[100px] truncate hidden sm:block">
                      {user?.name || "Pengguna"}
                    </span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    title="Keluar dari akun"
                    aria-label="Keluar dari akun"
                    className="apple-press p-2 min-h-[36px] min-w-[36px] rounded-xl text-[#4A6359] hover:text-[#DC2626] hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Segmented Control Filter Bar */}
          {showFilters && (
            <div className="mt-2 pt-2 border-t border-[#DDE7E2] flex items-center justify-between gap-1 overflow-x-auto scrollbar-none animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="inline-flex p-0.5 bg-[#F2F7F4] rounded-xl w-full sm:w-auto border border-[#DDE7E2]">
                {filters.map((f) => {
                  const isActive = activeFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => onFilterChange(f.key)}
                      className={`apple-press-sm flex-1 sm:flex-initial px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[32px] ${
                        isActive
                          ? "bg-[#0A4D3C] text-white shadow-xs"
                          : "text-[#4A6359] hover:text-[#04261C]"
                      }`}
                    >
                      {f.dot && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
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
