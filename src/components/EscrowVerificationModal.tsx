"use client";

import React, { useState, useEffect } from "react";
import { ActiveOrder } from "./OrderDrawer";
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Copy,
  Check,
  QrCode
} from "lucide-react";

interface EscrowVerificationModalProps {
  order: ActiveOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSimulateDeliveryVerification: (orderId: string) => void;
}

export const EscrowVerificationModal: React.FC<EscrowVerificationModalProps> = ({
  order,
  isOpen,
  onClose,
  onSimulateDeliveryVerification,
}) => {
  const [copied, setCopied] = useState(false);
  const [simulatedInputPin, setSimulatedInputPin] = useState("");
  const [pinError, setPinError] = useState(false);

  // Escape key handler for keyboard accessibility (R-32)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const handleCopyPin = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(order.pin6Digit);
      } else {
        throw new Error("Clipboard API not available");
      }
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = order.pin6Digit;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    if (simulatedInputPin === order.pin6Digit) {
      setPinError(false);
      onSimulateDeliveryVerification(order.id);
    } else {
      setPinError(true);
    }
  };

  const isSettled = order.status === "DELIVERED_SETTLED";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white border border-black/[0.08] rounded-t-[32px] sm:rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple Sheet Grabber */}
        <div className="pt-2.5 pb-1 bg-white shrink-0">
          <div className="apple-sheet-handle" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-black/[0.05] flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
                {isSettled ? "Transaksi Tuntas" : "Dana Aman di Escrow"}
              </span>
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                No. Order: {order.id}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="apple-press p-2 min-h-[40px] min-w-[40px] rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-slate-600 transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto bg-slate-50/60">
          {/* Status Banner */}
          {isSettled ? (
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 text-center space-y-2 shadow-2xs">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-[0_4px_12px_rgba(52,199,89,0.35)]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base tracking-tight">
                Verifikasi Sukses &amp; Dana Dicairkan!
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Ampas tahu telah diverifikasi segar di lokasi. Dana sebesar{" "}
                <strong className="text-emerald-700 font-mono">
                  Rp {order.totalAmount.toLocaleString("id-ID")}
                </strong>{" "}
                diteruskan ke saldo {order.factoryName}.
              </p>
            </div>
          ) : (
            <>
              {/* Inspection Warning Box */}
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-950">
                    Peringatan Pemeriksaan Mutu
                  </p>
                  <p className="text-amber-900/80 text-[11px] mt-0.5 leading-relaxed">
                    Periksa aroma &amp; kehangatan ampas tahu terlebih dahulu sebelum menunjukkan QR atau PIN ke kurir.
                  </p>
                </div>
              </div>

              {/* Apple Wallet Pass Style QR Card */}
              <div className="bg-white rounded-[24px] p-5 text-center shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex flex-col items-center max-w-[280px] mx-auto border border-black/[0.06]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-3">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>QR Pas Serah-Terima</span>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-black/[0.04] shadow-inner">
                  {/* High contrast SVG QR Code */}
                  <svg
                    className="w-40 h-40 text-slate-900"
                    viewBox="0 0 100 100"
                    fill="currentColor"
                  >
                    <rect x="0" y="0" width="30" height="30" rx="4" />
                    <rect x="5" y="5" width="20" height="20" fill="#ffffff" />
                    <rect x="9" y="9" width="12" height="12" fill="currentColor" />

                    <rect x="70" y="0" width="30" height="30" rx="4" />
                    <rect x="75" y="5" width="20" height="20" fill="#ffffff" />
                    <rect x="79" y="9" width="12" height="12" fill="currentColor" />

                    <rect x="0" y="70" width="30" height="30" rx="4" />
                    <rect x="5" y="75" width="20" height="20" fill="#ffffff" />
                    <rect x="9" y="79" width="12" height="12" fill="currentColor" />

                    {/* QR Matrix simulated dots */}
                    <rect x="36" y="8" width="6" height="6" />
                    <rect x="46" y="14" width="8" height="6" />
                    <rect x="58" y="6" width="6" height="10" />
                    <rect x="38" y="22" width="10" height="8" />
                    <rect x="52" y="24" width="8" height="6" />

                    <rect x="8" y="38" width="8" height="8" />
                    <rect x="22" y="42" width="6" height="6" />
                    <rect x="35" y="35" width="12" height="12" />
                    <rect x="52" y="38" width="14" height="6" />
                    <rect x="72" y="36" width="8" height="10" />
                    <rect x="86" y="40" width="8" height="6" />

                    <rect x="38" y="52" width="10" height="10" />
                    <rect x="54" y="50" width="8" height="14" />
                    <rect x="68" y="54" width="10" height="6" />
                    <rect x="84" y="52" width="10" height="8" />

                    <rect x="36" y="72" width="8" height="8" />
                    <rect x="48" y="70" width="10" height="6" />
                    <rect x="62" y="76" width="6" height="8" />
                    <rect x="74" y="72" width="8" height="10" />
                    <rect x="86" y="70" width="8" height="12" />
                    <rect x="40" y="86" width="12" height="8" />
                    <rect x="58" y="88" width="14" height="6" />
                    <rect x="78" y="86" width="16" height="8" />
                  </svg>
                </div>

                <span className="text-[11px] text-slate-600 font-medium mt-3">
                  Tunjukkan ke kurir untuk scan
                </span>
              </div>

              {/* 6-Digit PIN Display with SF Mono tracking */}
              <div className="bg-white border border-black/[0.06] rounded-2xl p-3.5 text-center space-y-2 shadow-2xs">
                <span className="text-xs text-slate-600 block">
                  Atau sebutkan 6 Digit PIN Serah-Terima:
                </span>
                <div className="flex items-center justify-center gap-2">
                  <div className="font-mono text-2xl font-black tracking-[0.25em] text-slate-900 bg-slate-50 px-5 py-2 rounded-xl border border-black/[0.06] shadow-inner">
                    {order.pin6Digit}
                  </div>
                  <button
                    onClick={handleCopyPin}
                    className="apple-press p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-black/[0.04] focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                    title="Salin PIN"
                    aria-label="Salin PIN"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Courier Simulation Field */}
              <div className="bg-white border border-black/[0.06] rounded-2xl p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    Simulasi Verifikasi Kurir
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 border border-black/[0.04] px-2 py-0.5 rounded-full font-bold">
                    Demo
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Masukkan PIN 6 digit peternak untuk menyimulasikan kurir mengonfirmasi ampas tiba segar:
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Ketik PIN di atas"
                    value={simulatedInputPin}
                    onChange={(e) => {
                      setSimulatedInputPin(e.target.value);
                      setPinError(false);
                    }}
                    className="flex-1 bg-slate-50 border border-black/[0.08] focus:border-emerald-600 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono placeholder:text-slate-500 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={handleVerify}
                    className="apple-press min-h-[40px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1 transition-colors shadow-[0_2px_8px_rgba(52,199,89,0.3)] shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                  >
                    <span>Cairkan Escrow</span>
                  </button>
                </div>
                {pinError && (
                  <p className="text-[11px] text-rose-600 font-semibold animate-in fade-in duration-150">
                    PIN tidak cocok dengan transaksi {order.pin6Digit}. Coba lagi.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Transaction Summary Card */}
          <div className="bg-white rounded-2xl p-4 text-xs border border-black/[0.06] space-y-2 shadow-2xs">
            <div className="flex justify-between text-slate-600">
              <span>Pabrik Penyedia:</span>
              <strong className="text-slate-900 font-bold">{order.factoryName}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Item:</span>
              <span className="text-slate-800">{order.itemName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Volume:</span>
              <span className="text-slate-800">{order.sacksCount} Karung ({order.totalKg} kg)</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-2 border-t border-black/[0.04]">
              <span>Total Dana Escrow:</span>
              <span className="font-extrabold text-emerald-700 font-mono text-base">
                Rp {order.totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
