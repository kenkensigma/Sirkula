"use client";

import React from "react";
import Link from "next/link";
import { AuthIllustration } from "./AuthIllustration";
import { Compass } from "lucide-react";

interface AuthLayoutProps {
  mode: "login" | "register";
  heading: string;
  supportingText: string;
  footerPrompt: string;
  footerLinkText: string;
  footerLinkHref: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  mode,
  heading,
  supportingText,
  footerPrompt,
  footerLinkText,
  footerLinkHref,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#F4F8F5] flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#0A4D3C] selection:text-white">
      {/* Top Header Bar / Brand */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 sm:py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:outline-none rounded-xl p-1"
          aria-label="Kembali ke Beranda Sirkula"
        >
          <div className="w-9 h-9 rounded-xl bg-[#0A4D3C] flex items-center justify-center text-white shadow-xs group-hover:bg-[#063125] transition-colors">
            <Compass className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[#04261C] text-base tracking-tight leading-none">
              Sirkula
            </span>
            <span className="text-[10px] font-semibold text-[#4A6359] uppercase tracking-wider mt-0.5">
              Kliring Ampas Tahu
            </span>
          </div>
        </Link>

        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/"
            className="text-xs font-semibold text-[#4A6359] hover:text-[#04261C] transition-colors px-3 py-2 rounded-lg hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:outline-none"
          >
            Lihat Peta Radar
          </Link>
        </div>
      </header>

      {/* Main Centered 2-Column Auth Container */}
      <main className="w-full max-w-5xl my-auto py-4">
        <div className="bg-white rounded-[28px] border border-[#DDE7E2] shadow-[0_20px_50px_rgba(4,38,28,0.06)] overflow-hidden flex flex-col lg:flex-row animate-in fade-in slide-in-from-bottom-3 duration-500">
          {/* Left Column: Form Section */}
          <div className="w-full lg:w-[48%] xl:w-[46%] p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
            {/* Form Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-[#F2F7F4] border border-[#DDE7E2] px-3 py-1 rounded-full text-xs font-semibold text-[#0A4D3C] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A4D3C]" />
                <span>{mode === "login" ? "Autentikasi Aman" : "Pendaftaran Anggota"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#04261C] tracking-tight">
                {heading}
              </h1>
              <p className="text-xs sm:text-sm text-[#4A6359] mt-1.5 leading-relaxed">
                {supportingText}
              </p>
            </div>

            {/* Form Content */}
            <div className="w-full max-w-[390px] mx-auto lg:mx-0">
              {children}

              {/* Footer Alternate Link */}
              <div className="mt-6 pt-5 border-t border-[#DDE7E2]/70 text-center lg:text-left text-xs text-[#4A6359]">
                <span>{footerPrompt}{" "}</span>
                <Link
                  href={footerLinkHref}
                  className="font-bold text-[#0A4D3C] hover:text-[#063125] hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:outline-none rounded"
                >
                  {footerLinkText}
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Illustration */}
          <div className="hidden lg:flex lg:w-[52%] xl:w-[54%] bg-[#F2F7F4] border-l border-[#DDE7E2]/70 relative">
            <AuthIllustration mode={mode} />
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="w-full max-w-5xl py-3 text-center text-xs text-[#4A6359]/80 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>&copy; {new Date().getFullYear()} Sirkula. Platform Sirkularitas Ampas Tahu Bali.</span>
        <div className="flex items-center gap-4 text-xs text-[#4A6359]">
          <span>SLA 12 Jam</span>
          <span>•</span>
          <span>Rekening Bersama Escrow</span>
          <span>•</span>
          <span>SDG 12 &amp; 13</span>
        </div>
      </footer>
    </div>
  );
};
