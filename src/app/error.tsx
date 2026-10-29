"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error?: Error & { digest?: string };
  reset?: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#04261C] flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white border border-[#DDE7E2] rounded-2xl p-6 shadow-[0_4px_16px_rgba(4,38,28,0.04)] text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h1 className="text-base font-extrabold text-[#04261C] tracking-tight">
            Terjadi kesalahan
          </h1>
          <p className="text-xs text-[#4A6359] leading-relaxed">
            Halaman ini mengalami gangguan. Kami sudah mencatat kegagalan ini dan akan segera memperbaiki.
          </p>
        </div>

        {error?.message ? (
          <p className="text-[11px] text-[#4A6359] bg-[#F7FAF8] border border-[#E8F0EC] rounded-xl p-3 text-left break-words">
            {error.message}
          </p>
        ) : null}

        <div className="flex items-center justify-center gap-2 pt-1">
          {typeof reset === "function" ? (
            <button
              onClick={reset}
              className="apple-press bg-[#0A4D3C] hover:bg-[#063125] text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs"
            >
              Coba lagi
            </button>
          ) : null}

          <Link
            href="/"
            className="apple-press bg-[#F2F7F4] hover:bg-[#E8F0EC] text-[#04261C] font-bold px-4 py-2.5 rounded-xl text-xs border border-[#DDE7E2]"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
