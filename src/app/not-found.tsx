"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#04261C] flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white border border-[#DDE7E2] rounded-2xl p-6 shadow-[0_4px_16px_rgba(4,38,28,0.04)] text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-[#F2F7F4] border border-[#DDE7E2] text-[#0A4D3C] flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h1 className="text-base font-extrabold text-[#04261C] tracking-tight">
            Halaman tidak ditemukan
          </h1>
          <p className="text-xs text-[#4A6359] leading-relaxed">
            Halaman yang kamu cari mungkin telah dipindah, diubah, atau tidak tersedia.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-1">
          <Link
            href="/"
            className="apple-press bg-[#0A4D3C] hover:bg-[#063125] text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs"
          >
            Kembali ke beranda
          </Link>

          <Link
            href="/dashboard"
            className="apple-press bg-[#F2F7F4] hover:bg-[#E8F0EC] text-[#04261C] font-bold px-4 py-2.5 rounded-xl text-xs border border-[#DDE7E2]"
          >
            Buka Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
