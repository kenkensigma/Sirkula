"use client";

import React, { useEffect } from "react";
import { X, Leaf, Recycle, ShieldCheck } from "lucide-react";

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

  const baseKg = 12840 + additionalSavedKg;
  const baseCo2e = Math.round(baseKg * 1.736 * 10) / 10;
  const baseSavings = baseKg * 850;

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
                Impact Rings
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
                  {baseKg.toLocaleString("id-ID")}
                </span>
                <span className="text-[#0A4D3C] text-lg font-bold">Kg</span>
              </div>
              <p className="text-xs text-[#4A6359] mt-1.5 max-w-xs mx-auto leading-relaxed">
                Total limbah ampas tahu segar yang berhasil diselamatkan dari sungai dan TPA di Bali.
              </p>
            </div>

            {/* Metric Twin Pods */}
            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#DDE7E2] text-left">
              <div className="bg-white p-3.5 rounded-2xl border border-[#DDE7E2] shadow-2xs">
                <span className="text-xs font-semibold text-[#4A6359] block">
                  Emisi Metana Dicegah
                </span>
                <span className="text-base font-extrabold text-[#04261C] font-mono mt-0.5 block">
                  {baseCo2e.toLocaleString("id-ID")} <span className="text-xs font-normal text-[#4A6359]">kg CO2e</span>
                </span>
                <span className="text-xs text-[#0A4D3C] block mt-1 font-mono">
                  Koefisien 1.736 kg/kg
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#DDE7E2] shadow-2xs">
                <span className="text-xs font-semibold text-[#4A6359] block">
                  Hemat Biaya Pakan
                </span>
                <span className="text-base font-extrabold text-[#0A4D3C] font-mono mt-0.5 block">
                  Rp {baseSavings.toLocaleString("id-ID")}
                </span>
                <span className="text-xs text-[#4A6359] block mt-1">
                  Hemat ~Rp 850/kg vs konsentrat
                </span>
              </div>
            </div>
          </div>

          {/* SDG UN Alignment Cards */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-[#04261C] block px-1">
              Keselarasan Agenda Global PBB
            </span>

            {/* SDG 12 Card */}
            <div className="bg-white border border-[#DDE7E2] rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 text-base shadow-[0_2px_8px_rgba(245,158,11,0.3)]">
                12
              </div>
              <div className="text-xs">
                <h5 className="font-bold text-[#04261C] text-xs">
                  SDG 12: Konsumsi &amp; Produksi Bertanggung Jawab
                </h5>
                <p className="text-[#4A6359] text-xs mt-1 leading-relaxed">
                  Menyalurkan 550-700 kg limbah basah harian per pabrik langsung ke peternak rakyat sebelum batas fermentasi asam 12 jam tercapai.
                </p>
              </div>
            </div>

            {/* SDG 13 Card */}
            <div className="bg-white border border-[#DDE7E2] rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#0A4D3C] text-white flex items-center justify-center font-black shrink-0 text-base shadow-[0_2px_8px_rgba(10,77,60,0.3)]">
                13
              </div>
              <div className="text-xs">
                <h5 className="font-bold text-[#04261C] text-xs">
                  SDG 13: Penanganan Perubahan Iklim
                </h5>
                <p className="text-[#4A6359] text-xs mt-1 leading-relaxed">
                  Mencegah pembusukan anaerobik di sungai yang memproduksi gas metana (CH4), gas rumah kaca dengan dampak pemanasan 28x lebih kuat dari CO2.
                </p>
              </div>
            </div>
          </div>

          {/* SLA 3 Time Zones Table */}
          <div className="bg-white border border-[#DDE7E2] rounded-2xl p-4 space-y-2.5 text-xs shadow-2xs">
            <h5 className="font-bold text-[#04261C] flex items-center gap-1.5 text-xs">
              <Recycle className="w-4 h-4 text-[#0A4D3C]" />
              <span>Siklus Sirkula 3 Zona Waktu Kesegaran</span>
            </h5>
            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-[#04261C]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0A4D3C] ring-2 ring-[#0A4D3C]/20" />
                  0 - 8 Jam (Zona Hijau)
                </span>
                <span className="text-[#0A4D3C] font-semibold">Prima &amp; Hangat</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-[#04261C]">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                  8 - 10,5 Jam (Zona Kuning)
                </span>
                <span className="text-amber-700 font-semibold">Diskon 15%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-[#04261C]">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
                  ≥ 12 Jam (Zona Merah)
                </span>
                <span className="text-rose-600 font-semibold">Pupuk &amp; Maggot</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
