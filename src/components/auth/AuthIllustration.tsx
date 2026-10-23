"use client";

import React from "react";
import { ShieldCheck, Lock, CheckCircle2, Leaf, Clock, ArrowRightLeft } from "lucide-react";

interface AuthIllustrationProps {
  mode: "login" | "register";
}

export const AuthIllustration: React.FC<AuthIllustrationProps> = ({ mode }) => {
  return (
    <div
      className="w-full h-full min-h-[460px] flex flex-col items-center justify-between p-8 relative overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Background Decorative Circularity Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="w-[420px] h-[420px] rounded-full border border-[#0A4D3C]/10 animate-pulse duration-[4000ms]" />
        <div className="absolute w-[300px] h-[300px] rounded-full border border-[#0A4D3C]/15" />
        <div className="absolute w-[180px] h-[180px] rounded-full border border-[#0A4D3C]/20" />
      </div>

      {/* Top Floating Badge */}
      <div className="relative z-10 w-full flex justify-between items-center">
        <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#DDE7E2] shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#0A4D3C]" />
          <span className="text-xs font-semibold text-[#04261C]">
            {mode === "login" ? "Sistem Kliring Aktif" : "Jaringan Produsen Bali"}
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs text-[#0A4D3C] font-semibold bg-[#F4F8F5] px-3 py-1.5 rounded-full border border-[#DDE7E2]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Escrow SLA 12 Jam</span>
        </div>
      </div>

      {/* Central Illustration Art */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full max-w-[320px]">
        {mode === "login" ? (
          /* Login: Digital Security & Escrow Protection Device */
          <div className="w-full relative">
            {/* Main Device Card */}
            <div className="bg-white rounded-3xl p-6 border border-[#DDE7E2] shadow-[0_16px_36px_rgba(4,38,28,0.08)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DDE7E2]/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#F2F7F4] border border-[#DDE7E2] flex items-center justify-center text-[#0A4D3C]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#04261C] block leading-tight">
                      Sirkula Guard
                    </span>
                    <span className="text-[11px] text-[#4A6359] block">
                      Proteksi Dana &amp; Mutu
                    </span>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#0A4D3C]" />
              </div>

              {/* Status Graphic / Verification Pass */}
              <div className="bg-[#F4F8F5] rounded-2xl p-4 border border-[#DDE7E2] space-y-2.5 text-center">
                <div className="w-12 h-12 rounded-full bg-[#0A4D3C] text-white flex items-center justify-center mx-auto shadow-[0_4px_12px_rgba(10,77,60,0.25)]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-[#04261C] block">
                    Verifikasi Instan Terenkripsi
                  </span>
                  <span className="text-xs text-[#4A6359] block mt-0.5">
                    Dana ditahan aman hingga ampas terbukti hangat
                  </span>
                </div>
              </div>

              {/* Mini Metric Indicator */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[#4A6359] font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0A4D3C]" /> Batas SLA
                </span>
                <span className="font-mono font-bold text-[#04261C]">
                  12 Jam Segar
                </span>
              </div>
            </div>

            {/* Floating Satellite Pill 1 */}
            <div className="absolute -top-3 -right-4 bg-white px-3.5 py-1.5 rounded-xl border border-[#DDE7E2] shadow-xs flex items-center gap-2">
              <Leaf className="w-3.5 h-3.5 text-[#0A4D3C]" />
              <span className="text-xs font-bold text-[#04261C]">100% Organik</span>
            </div>

            {/* Floating Satellite Pill 2 */}
            <div className="absolute -bottom-3 -left-4 bg-white px-3.5 py-1.5 rounded-xl border border-[#DDE7E2] shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-[#04261C]">Rp 40.000 / krg</span>
            </div>
          </div>
        ) : (
          /* Register: Circular Ecosystem & Verified Community Network */
          <div className="w-full relative">
            {/* Main Network Card */}
            <div className="bg-white rounded-3xl p-6 border border-[#DDE7E2] shadow-[0_16px_36px_rgba(4,38,28,0.08)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DDE7E2]/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#F2F7F4] border border-[#DDE7E2] flex items-center justify-center text-[#0A4D3C]">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#04261C] block leading-tight">
                      Ekosistem Sirkular
                    </span>
                    <span className="text-[11px] text-[#4A6359] block">
                      Pabrik Tahu &amp; Peternak
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0A4D3C] bg-[#F2F7F4] px-2 py-0.5 rounded-full border border-[#DDE7E2]">
                  Bali
                </span>
              </div>

              {/* Loop Simulation */}
              <div className="space-y-2">
                <div className="p-3 bg-[#F4F8F5] rounded-xl border border-[#DDE7E2] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#04261C]">Pabrik Tahu Sumber Barokah</span>
                  <span className="text-[#0A4D3C] font-mono font-bold">22 krg</span>
                </div>
                <div className="flex justify-center -my-1">
                  <div className="w-5 h-5 rounded-full bg-[#0A4D3C] text-white flex items-center justify-center shadow-xs">
                    <ArrowRightLeft className="w-3 h-3 rotate-90" />
                  </div>
                </div>
                <div className="p-3 bg-[#F4F8F5] rounded-xl border border-[#DDE7E2] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#04261C]">Kelompok Ternak Lembu Sanur</span>
                  <span className="text-[#0A4D3C] font-bold">Siap Angkut</span>
                </div>
              </div>

              {/* Impact Footer */}
              <div className="pt-2 border-t border-[#DDE7E2]/60 flex items-center justify-between text-xs">
                <span className="text-[#4A6359]">Target Penyelamatan:</span>
                <span className="font-bold text-[#04261C] font-mono">12.840 kg</span>
              </div>
            </div>

            {/* Floating Satellite Badge */}
            <div className="absolute -top-3 -left-3 bg-white px-3.5 py-1.5 rounded-xl border border-[#DDE7E2] shadow-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0A4D3C]" />
              <span className="text-xs font-bold text-[#04261C]">Mitra Terverifikasi</span>
            </div>

            <div className="absolute -bottom-3 -right-3 bg-white px-3.5 py-1.5 rounded-xl border border-[#DDE7E2] shadow-xs flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-[#0A4D3C]" />
              <span className="text-xs font-bold text-[#04261C]">SDG 12 &amp; 13</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Informative Pill */}
      <div className="relative z-10 w-full bg-white/90 backdrop-blur-md border border-[#DDE7E2] rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-[#F2F7F4] flex items-center justify-center text-[#0A4D3C] shrink-0">
          <Leaf className="w-4 h-4" />
        </div>
        <div className="text-left text-xs">
          <span className="font-bold text-[#04261C] block leading-snug">
            {mode === "login"
              ? "Menghubungkan Limbah Menjadi Berkah Pakan"
              : "Bergabung dengan Ratusan Peternak & Pengrajin"}
          </span>
          <span className="text-[#4A6359] block mt-0.5 text-xs">
            {mode === "login"
              ? "Akses monitoring stok segar radius 15 km secara real-time."
              : "Daftar gratis, dapatkan akses pasokan ampas tahu harga petani."}
          </span>
        </div>
      </div>
    </div>
  );
};
