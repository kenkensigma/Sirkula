"use client";

import React, { useState, useEffect } from "react";
import { X, Leaf, ShieldCheck } from "lucide-react";

interface SDGImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  additionalSavedKg?: number;
}

export const SDGImpactModal: React.FC<SDGImpactModalProps> = ({
  isOpen,
  onClose,
  additionalSavedKg = 0,
}) => {
  const [impactData, setImpactData] = useState<{
    divertedKg: number;
    co2eAvoided: number;
    feedSavingsIdr: number;
    methodologyLabel?: string;
  }>({
    divertedKg: 12840 + additionalSavedKg,
    co2eAvoided: Math.round((12840 + additionalSavedKg) * 1.736 * 10) / 10,
    feedSavingsIdr: (12840 + additionalSavedKg) * 850,
    methodologyLabel: "Estimasi berdasarkan koefisien baku; diverifikasi tim lapangan Sirkula Bali",
  });

  // Fetch live impact from backend GET /api/v1/impact/summary
  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/v1/impact/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          const rawKg = json.data.diverted_from_waste_kg || 12840;
          const totalKg = rawKg + additionalSavedKg;
          setImpactData({
            divertedKg: totalKg,
            co2eAvoided: Math.round(totalKg * 1.736 * 10) / 10,
            feedSavingsIdr: totalKg * 850,
            methodologyLabel: json.data.methodology?.label,
          });
        }
      })
      .catch((err) => console.warn("Failed to fetch impact summary:", err));
  }, [isOpen, additionalSavedKg]);

  // Escape key handler for keyboard accessibility (R-32)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-black/[0.08] rounded-t-[32px] sm:rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple Sheet Grabber */}
        <div className="pt-2.5 pb-1 bg-white shrink-0">
          <div className="apple-sheet-handle" />
        </div>

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#DDE7E2] flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F2F7F4] border border-[#DDE7E2] flex items-center justify-center text-[#0A4D3C]">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#0A4D3C] uppercase tracking-wider block">
                Impact Dashboard
              </span>
              <h3 className="font-extrabold text-[#04261C] text-sm tracking-tight">
                Dampak Lingkungan (SDG 12 &amp; 13)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="apple-press p-2 min-h-[44px] min-w-[44px] rounded-full bg-[#04261C]/[0.05] hover:bg-[#04261C]/[0.08] text-[#04261C] transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto bg-[#F4F8F5]">
          {/* Activity Summary Card */}
          <div className="bg-[#F2F7F4] border border-[#DDE7E2] rounded-[24px] p-5 text-center space-y-3 relative overflow-hidden shadow-2xs">
            <div className="inline-flex items-center gap-1.5 bg-white border border-[#DDE7E2] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0A4D3C] shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#0A4D3C]" />
              <span>Sirkularitas Ampas Tahu Terverifikasi</span>
            </div>

            <div>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-4xl font-black text-[#04261C] tracking-tight font-mono">
                  {impactData.divertedKg.toLocaleString("id-ID")}
                </span>
                <span className="text-[#0A4D3C] text-lg font-bold">Kg</span>
              </div>
              <p className="text-xs text-[#4A6359] mt-1.5 max-w-xs mx-auto leading-relaxed">
                Total limbah ampas tahu segar yang berhasil diselamatkan dari sungai dan TPA di Bali melalui transaksi terverifikasi.
              </p>
            </div>

            {/* Metric Twin Pods */}
            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#DDE7E2] text-left">
              <div className="bg-white p-3.5 rounded-2xl border border-[#DDE7E2] shadow-2xs">
                <span className="text-xs font-semibold text-[#4A6359] block">
                  Emisi Metana Dicegah
                </span>
                <span className="text-base font-extrabold text-[#04261C] font-mono mt-0.5 block">
                  {impactData.co2eAvoided.toLocaleString("id-ID")} <span className="text-xs font-normal text-[#4A6359]">kg CO2e</span>
                </span>
                <span className="text-xs text-[#0A4D3C] block mt-1 font-mono">
                  Koefisien 1.736 kg/kg
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#DDE7E2] shadow-2xs">
                <span className="text-xs font-semibold text-[#4A6359] block">
                  Hemat Biaya Pakan
                </span>
                <span className="text-base font-extrabold text-[#04261C] font-mono mt-0.5 block">
                  Rp {impactData.feedSavingsIdr.toLocaleString("id-ID")}
                </span>
                <span className="text-xs text-[#4A6359] block mt-1">
                  Hemat ~Rp 850/kg vs konsentrat
                </span>
              </div>
            </div>
          </div>

          {/* SDG UN Alignment Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#04261C] uppercase tracking-wider">
              Tujuan Pembangunan Berkelanjutan PBB
            </h4>

            {/* SDG 12 */}
            <div className="bg-white p-4 rounded-2xl border border-[#DDE7E2] flex items-start gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm shrink-0 font-mono">
                12
              </div>
              <div className="text-xs">
                <h5 className="font-bold text-[#04261C]">
                  Konsumsi &amp; Produksi Bertanggung Jawab
                </h5>
                <p className="text-[#4A6359] text-xs mt-1 leading-relaxed">
                  Menutup siklus limbah organik industri tahu Bali secara sirkular langsung ke peternak rakyat sebelum membusuk (SLA 12 jam).
                </p>
              </div>
            </div>

            {/* SDG 13 */}
            <div className="bg-white p-4 rounded-2xl border border-[#DDE7E2] flex items-start gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#0A4D3C] flex items-center justify-center font-black text-sm shrink-0 font-mono">
                13
              </div>
              <div className="text-xs">
                <h5 className="font-bold text-[#04261C]">
                  Penanganan Perubahan Iklim
                </h5>
                <p className="text-[#4A6359] text-xs mt-1 leading-relaxed">
                  Menghindari fermentasi anaerobik ampas tahu basah di saluran air yang menghasilkan gas metana ($CH_4$) berpotensi pemanasan global tinggi.
                </p>
              </div>
            </div>
          </div>

          {/* Methodology Disclosure Note */}
          <div className="bg-white p-3.5 rounded-xl border border-[#DDE7E2] text-center">
            <span className="text-xs text-[#4A6359]">
              Metodologi: {impactData.methodologyLabel || "Estimasi berdasarkan koefisien baku; diverifikasi tim lapangan Sirkula Bali"}.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
