"use client";

import React, { useEffect } from "react";
import { X, Leaf, Recycle } from "lucide-react";

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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const baseKg = 12840 + additionalSavedKg;
  const baseCo2e = Math.round(baseKg * 1.736 * 10) / 10;
  const baseSavings = baseKg * 850;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div 
        className="w-full max-w-lg bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-800 block">
                Metrik Sirkularitas Lapangan
              </span>
              <h3 className="font-bold text-slate-900 text-base">
                Dampak Lingkungan (SDG 12 &amp; 13)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup ringkasan dampak lingkungan"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto bg-slate-50">
          {/* Main Stat Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-center space-y-3 relative overflow-hidden shadow-2xs">
            <div className="inline-flex items-center gap-1.5 bg-white border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold text-emerald-900 shadow-2xs">
              <Recycle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Sirkularitas Ampas Tahu Terverifikasi</span>
            </div>

            <div>
              <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {baseKg.toLocaleString("id-ID")}{" "}
                <span className="text-emerald-800 text-lg font-sans">Kg</span>
              </span>
              <p className="text-xs text-slate-700 mt-1">
                Estimasi akumulasi limbah ampas tahu tersalurkan ke peternak (bebas dari pembuangan sungai)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200 text-left">
              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-xs text-slate-600 block font-medium">Emisi Metana Dicegah</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {baseCo2e.toLocaleString("id-ID")} kg CO2e
                </span>
                <span className="text-[10px] text-slate-600 block mt-0.5">Asumsi 1.736 kg CO2e/kg</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                <span className="text-xs text-slate-600 block font-medium">Penghematan Peternak</span>
                <span className="text-sm font-bold text-emerald-800 font-mono">
                  Rp {baseSavings.toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] text-slate-600 block mt-0.5">Selisih vs harga konsentrat</span>
              </div>
            </div>
          </div>

          {/* SDG Alignment Cards */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-800">
              Keselarasan Agenda Global PBB
            </h4>

            {/* SDG 12 Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-start gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0 text-sm shadow-2xs">
                12
              </div>
              <div className="text-xs">
                <h5 className="font-bold text-slate-900 text-xs">
                  SDG 12: Konsumsi &amp; Produksi yang Bertanggung Jawab
                </h5>
                <p className="text-slate-700 text-xs mt-1 leading-relaxed">
                  Menyalurkan limbah basah tahu harian ke peternak rakyat sebelum batas fermentasi 12 jam, mencegah ampas terbuang membusuk di sungai atau TPA.
                </p>
              </div>
            </div>

            {/* SDG 13 Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-start gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0 text-sm shadow-2xs">
                13
              </div>
              <div className="text-xs">
                <h5 className="font-bold text-slate-900 text-xs">
                  SDG 13: Penanganan Perubahan Iklim
                </h5>
                <p className="text-slate-700 text-xs mt-1 leading-relaxed">
                  Mencegah pembusukan anaerobik terbuka yang memicu pelepasan gas metana (CH4), gas rumah kaca dengan potensi pemanasan global 28x lebih tinggi daripada CO2.
                </p>
              </div>
            </div>
          </div>

          {/* SLA Rule Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs shadow-2xs">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Recycle className="w-3.5 h-3.5 text-emerald-700" />
              Siklus Waktu Sirkula (SLA 12 Jam)
            </h5>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  0 - 8 Jam (Zona Hijau)
                </span>
                <span className="text-emerald-900 font-semibold">Kualitas prima pakan ternak</span>
              </div>
              <div className="flex items-center justify-between text-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  8 - 10,5 Jam (Zona Kuning)
                </span>
                <span className="text-amber-900 font-semibold">Diskon kilat 15% konsumsi cepat</span>
              </div>
              <div className="flex items-center justify-between text-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  ≥ 12 Jam (Zona Merah)
                </span>
                <span className="text-rose-700 font-medium">Batas pakan: dialihkan ke pupuk/maggot</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
