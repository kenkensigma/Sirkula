"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Compass, Layers, ChevronDown, SlidersHorizontal, LogIn, UserPlus, LogOut, LayoutDashboard } from "lucide-react";
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
      <div className="pointer-events-auto mx-3 mt-3 sm:mx-5 sm:mt-4 max-w-4xl lg:max-w-5xl xl:max-w-6xl xl:mx-auto">
        {/* Apple Dynamic Island Floating Card */}
        <div className="apple-glass rounded-2xl sm:rounded-[22px] px-3.5 py-2.5 sm:px-4 transition-all duration-300">
          {/* Main row */}
          <div className="flex items-center justify-between gap-3">
            {/* Brand identity */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-[#0A4D3C] flex items-center justify-center shadow-xs border border-[#063125]">
                <Compass className="w-4 h-4 text-white" strokeWidth={2.2} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] sm:text-base font-bold text-[#04261C] tracking-tight">
                  Sirkula
                </span>
                <span className="text-xs font-semibold bg-[#F2F7F4] text-[#0A4D3C] border border-[#DDE7E2] px-2 py-0.5 rounded-md">
                  Kliring Ampas Tahu
                </span>
              </div>
            </div>

            {/* GPS Signal Status Badge */}
            <div className="hidden md:inline-flex items-center gap-2 text-xs text-[#063125] bg-[#F2F7F4] px-3 py-1 rounded-full border border-[#DDE7E2] whitespace-nowrap shrink-0">
              <span className="h-2 w-2 rounded-full bg-[#0A4D3C]"></span>
              <span className="font-semibold tracking-tight">GPS 15 km Aktif</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Filter toggle button */}
              <button
                onClick={() => setShowFilters((p) => !p)}
                className={`apple-press flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 min-h-[40px] rounded-xl border transition-all focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 ${
                  showFilters
                    ? "bg-[#0A4D3C] text-white border-[#0A4D3C]"
                    : "bg-white hover:bg-[#F2F7F4] text-[#04261C] border-[#DDE7E2]"
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
                className={`apple-press flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 ${
                  isFactoryListOpen
                    ? "bg-[#0A4D3C] text-white shadow-xs"
                    : "bg-white text-[#04261C] hover:bg-[#F2F7F4] border border-[#DDE7E2] shadow-2xs"
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

              {/* Dashboard Link — only show standalone when not logged in */}
              {!isAuthenticated && (
                <Link
                  href="/dashboard"
                  className="apple-press flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] rounded-xl text-xs font-semibold bg-white text-[#04261C] hover:bg-[#F2F7F4] border border-[#DDE7E2] shadow-2xs transition-colors focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
                  title="Buka Dashboard Sirkula"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#0A4D3C]" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              )}

              {/* Auth Status & Login CTA */}
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/login"
                    className="apple-press flex items-center gap-1.5 px-3.5 py-1.5 min-h-[40px] rounded-xl text-xs font-bold bg-[#0A4D3C] text-white hover:bg-[#063125] shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
                    aria-label="Masuk ke Akun Sirkula"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Masuk</span>
                  </Link>

                  <Link
                    href="/register"
                    className="apple-press hidden sm:flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] rounded-xl text-xs font-semibold bg-white text-[#04261C] hover:bg-[#F2F7F4] border border-[#DDE7E2] shadow-2xs transition-colors focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
                    aria-label="Daftar Akun Baru"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#0A4D3C]" />
                    <span>Daftar</span>
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link href="/dashboard" className="apple-press flex items-center gap-1.5 bg-[#F2F7F4] hover:bg-[#E8F0EC] border border-[#DDE7E2] px-2.5 py-1.5 rounded-xl text-xs transition-colors" title="Buka Dashboard">
                    <div className="w-5 h-5 rounded-full bg-[#0A4D3C] text-white flex items-center justify-center font-bold text-[10px]">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="font-bold text-[#04261C] max-w-[85px] sm:max-w-[120px] truncate">
                      {user?.name || "Pengguna"}
                    </span>
                    <span className="hidden md:inline text-[10px] text-[#0A4D3C] font-semibold bg-white px-1.5 py-0.5 rounded border border-[#DDE7E2]">
                      {user?.role === "factory" ? "Pabrik" : "Peternak"}
                    </span>
                  </Link>

                  <button
                    onClick={() => logout()}
                    title="Keluar dari akun"
                    aria-label="Keluar dari akun"
                    className="apple-press p-2 min-h-[40px] min-w-[40px] rounded-xl text-[#4A6359] hover:text-[#DC2626] hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Segmented Control Filter Bar */}
          {showFilters && (
            <div className="mt-2.5 pt-2.5 border-t border-[#DDE7E2] flex items-center justify-between gap-1 overflow-x-auto scrollbar-none animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="inline-flex p-0.5 bg-[#F2F7F4] rounded-xl w-full sm:w-auto border border-[#DDE7E2]">
                {filters.map((f) => {
                  const isActive = activeFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => onFilterChange(f.key)}
                      className={`apple-press-sm flex-1 sm:flex-initial px-3.5 py-1.5 rounded-[10px] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[36px] ${
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
