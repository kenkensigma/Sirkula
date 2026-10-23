"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, Lock, ShieldCheck, ArrowRight, UserPlus, LogIn } from "lucide-react";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionDescription?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  actionDescription = "melanjutkan pemesanan ampas tahu",
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-200 select-none font-sans"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-[0_20px_60px_rgba(4,38,28,0.2)] border border-[#DDE7E2]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple Sheet Grabber */}
        <div className="pt-2.5 pb-1 bg-white shrink-0 sm:hidden">
          <div className="apple-sheet-handle" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#DDE7E2] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F2F7F4] border border-[#DDE7E2] flex items-center justify-center text-[#0A4D3C]">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-[#0A4D3C] uppercase tracking-wider">
              Autentikasi Diperlukan
            </span>
          </div>

          <button
            onClick={onClose}
            className="apple-press p-2 min-h-[44px] min-w-[44px] rounded-full bg-[#04261C]/[0.04] hover:bg-[#04261C]/[0.08] text-[#04261C] transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
            aria-label="Tutup jendela autentikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 bg-[#F4F8F5] text-center">
          <div className="w-16 h-16 rounded-3xl bg-white border border-[#DDE7E2] flex items-center justify-center mx-auto text-[#0A4D3C] shadow-2xs">
            <ShieldCheck className="w-9 h-9" />
          </div>

          <div className="space-y-1.5">
            <h3
              id="auth-modal-title"
              className="text-xl font-extrabold text-[#04261C] tracking-tight"
            >
              Masuk untuk Melanjutkan
            </h3>
            <p className="text-xs text-[#4A6359] leading-relaxed max-w-sm mx-auto">
              Untuk {actionDescription} dan mengamankan stok di Rekening Bersama Escrow SLA 12 Jam, silakan masuk ke akun Anda atau daftar terlebih dahulu.
            </p>
          </div>

          {/* Value Props Card */}
          <div className="bg-white rounded-2xl p-4 border border-[#DDE7E2] text-left text-xs space-y-2 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A4D3C] mt-1.5 shrink-0" />
              <span className="text-[#04261C] font-medium leading-relaxed">
                Verifikasi keamanan identitas peternak &amp; pabrik tahu
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A4D3C] mt-1.5 shrink-0" />
              <span className="text-[#04261C] font-medium leading-relaxed">
                Kunci stok segar otomatis sebelum fermentasi asam
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A4D3C] mt-1.5 shrink-0" />
              <span className="text-[#04261C] font-medium leading-relaxed">
                Proteksi dana aman hingga ampas diverifikasi di kandang
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-1">
            <Link
              href="/login"
              className="apple-press w-full min-h-[48px] bg-[#0A4D3C] hover:bg-[#063125] text-white font-bold py-3 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(10,77,60,0.25)] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk ke Akun</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/register"
              className="apple-press w-full min-h-[48px] bg-white hover:bg-[#F2F7F4] text-[#04261C] border border-[#DDE7E2] font-bold py-3 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-2xs focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
            >
              <UserPlus className="w-4 h-4 text-[#0A4D3C]" />
              <span>Daftar Akun Baru</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#4A6359] hover:text-[#04261C] transition-colors py-1.5"
          >
            Lanjut Lihat Radar sebagai Tamu
          </button>
        </div>
      </div>
    </div>
  );
};
