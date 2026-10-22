"use client";

import React from "react";
import { X, Sparkles, Leaf, Recycle } from "lucide-react";

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
  if (!isOpen) return null;

  const baseKg = 12840 + additionalSavedKg;
  const baseCo2e = Math.round(baseKg * 1.736 * 10) / 10;
  const baseSavings = baseKg * 850;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-green-50 text-green-700 border border-green-200 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider block">
                Impact Dashboard
              </span>
              <h3 className="font-bold text-slate-900 text-base">
                Dampak Lingkungan (SDG 12 &amp; 13)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto bg-slate-50">
          {/* Main Stat Banner */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 text-center space-y-3 relative overflow-hidden shadow-sm">
            <div className="inline-flex items-center gap-1.5 bg-white border border-green-200 px-3 py-1 rounded-full text-xs font-bold text-green-800 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-green-600" />
              <span>Sirkularitas Ampas Tahu Terverifikasi</span>
            </div>

            <div>
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {baseKg.toLocaleString("id-ID")}{" "}
                <span className="text-green-700 text-lg font-mono">Kg</span>
              </span>
              <p className="text-xs text-slate-600 mt-1">
                Total Limbah Ampas Tahu Diselamatkan dari Sungai &amp; TPA
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-green-200/60 text-left">
              <div className="bg-white p-2.5 rounded-xl border border-green-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block font-medium">Emisi Metana Dicegah</span>
                <span className="text-sm font-bold text-slate-900">
                  {baseCo2e.toLocaleString("id-ID")} kg CO2e
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">Koefisien 1.736 kg CO2e/kg</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-green-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block font-medium">Penghematan Peternak</span>
                <span className="text-sm font-bold text-green-700">
                  Rp {baseSavings.toLocaleString("id-ID")}
                </span>
                <span className="text-[9px] text-slate-400 block">Hemat ~Rp 850/kg vs konsentrat</span>
              </div>
            </div>
          </div>

          {/* SDG Alignment Cards */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Keselarasan Agenda Global PBB
            </h4>

            {/* SDG 12 Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 text-sm shadow-xs">
                12
              </div>
              <div className="text-xs">
                <h5 className="font-bold text-slate-900 text-xs">
                  SDG 12: Konsumsi &amp; Produksi yang Bertanggung Jawab
                </h5>
                <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                  Mencegah 550-700 kg limbah basah harian per pabrik tahu dibuang sia-sia dengan menghubungkannya langsung ke peternak rakyat sebelum batas fermentasi 12 jam.
                </p>
              </div>
            </div>

            {/* SDG 13 Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 text-sm shadow-xs">
                13
              </div>
              <div className="text-xs">
                <h5 className="font-bold text-slate-900 text-xs">
                  SDG 13: Penanganan Perubahan Iklim
                </h5>
                <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                  Menghindari pembusukan anaerobik di sungai atau lahan terbuka yang memproduksi gas metana (CH4), gas rumah kaca dengan potensi pemanasan global 28x lebih kuat dari CO2.
                </p>
              </div>
            </div>
          </div>

          {/* SLA Rule Summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs shadow-xs">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Recycle className="w-3.5 h-3.5 text-green-600" />
              Siklus Sirkula 3 Zona Waktu
            </h5>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  0 - 8 Jam (Zona Hijau)
                </span>
                <span className="text-emerald-700 font-medium">Kualitas prima, pakan segar</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  8 - 10,5 Jam (Zona Kuning)
                </span>
                <span className="text-amber-700 font-medium">Diskon cepat 15% sebelum basi</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  ≥ 12 Jam (Zona Merah)
                </span>
                <span className="text-rose-600 font-medium">Dialihkan ke pupuk &amp; maggot</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
