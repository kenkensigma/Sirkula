"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

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
  const illustrationSrc =
    mode === "login"
      ? "/sirkula-login-premium.jpg"
      : "/sirkula-register-premium.jpg";

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans selection:bg-[#0A4D3C]/20 selection:text-[#0A4D3C]">
      {/* Main Card Container */}
      <div
        className="w-full max-w-[1060px] bg-white rounded-[32px] overflow-hidden flex flex-col lg:flex-row animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"
        style={{
          boxShadow:
            "0 30px 70px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.03)",
        }}
      >
        {/* Left Column: Form */}
        <div className="w-full lg:w-[48%] xl:w-[46%] flex flex-col justify-between p-8 sm:p-12 lg:p-14 xl:p-16">
          {/* Brand */}
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:outline-none rounded-lg self-start mb-8 sm:mb-12"
            aria-label="Kembali ke Beranda Sirkula"
          >
            <div className="w-4 h-6 rounded-t-full rounded-br-full bg-[#0A4D3C] group-hover:bg-[#07382B] transition-transform group-hover:scale-105 shadow-xs" />
            <span className="font-extrabold text-[#111827] text-[17px] tracking-tight">
              Sirkula
            </span>
          </Link>

          {/* Heading Group */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-7">
              <h1 className="text-[32px] sm:text-[38px] font-extrabold text-[#111827] tracking-[-0.03em] leading-[1.12]">
                {heading.split(",").length > 1 ? (
                  <>
                    <span>{heading.split(",")[0]},</span>
                    <br />
                    <span>{heading.split(",").slice(1).join(",").trim()}</span>
                  </>
                ) : (
                  heading
                )}
              </h1>
              <p className="text-[14px] text-[#8E8E93] mt-2.5 leading-relaxed font-normal">
                {supportingText}
              </p>
            </div>

            {/* Form Content */}
            <div className="w-full max-w-[380px]">
              {children}

              {/* Footer Link */}
              <div className="mt-8 text-[13px] text-[#8E8E93]">
                <span>{footerPrompt} </span>
                <Link
                  href={footerLinkHref}
                  className="font-bold text-[#0A4D3C] hover:text-[#07382B] transition-colors focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:outline-none rounded hover:underline underline-offset-2"
                >
                  {footerLinkText}
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Spacer */}
          <div className="h-4 sm:h-6" />
        </div>

        {/* Right Column: Illustration */}
        <div className="hidden lg:block lg:w-[52%] xl:w-[54%] relative overflow-hidden bg-[#0A4D3C] min-h-[580px] lg:min-h-[660px]">
          {/* Illustration Image */}
          <Image
            src={illustrationSrc}
            alt={
              mode === "login"
                ? "Ilustrasi otentikasi biometrik digital Sirkula"
                : "Ilustrasi pendaftaran akun baru Sirkula"
            }
            fill
            className="object-cover animate-in fade-in duration-700"
            sizes="(min-width: 1024px) 54vw, 0vw"
            priority
          />
        </div>
      </div>
    </div>
  );
};
