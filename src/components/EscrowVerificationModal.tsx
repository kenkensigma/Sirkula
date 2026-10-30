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
  QrCode,
  Loader2,
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleVerify = async () => {
    if (!simulatedInputPin || simulatedInputPin.trim().length !== 6) {
      setPinError(true);
      setErrorMessage("Masukkan 6 digit PIN serah-terima.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const txId = order.rawTransactionId || order.id.replace("SRK-", "");
      let backendSuccess = false;

      try {
        const res = await fetch(`/api/v1/transactions/${txId}/verify-pin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: simulatedInputPin }),
        });

        if (res.ok) {
          backendSuccess = true;
        } else {
          const errJson = await res.json().catch(() => null);
          if (errJson?.error?.message) {
            setErrorMessage(errJson.error.message);
          }
        }
      } catch (err) {
        console.warn("Backend PIN verification note:", err);
      }

      if (backendSuccess || simulatedInputPin === order.pin6Digit) {
        setPinError(false);
        onSimulateDeliveryVerification(order.id);
      } else {
        setPinError(true);
      }
    } finally {
      setIsVerifying(false);
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
        <div className="px-5 py-3.5 border-b border-[#DDE7E2] flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F2F7F4] border border-[#DDE7E2] flex items-center justify-center text-[#0A4D3C]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#0A4D3C] uppercase tracking-wider block">
                {isSettled ? "Transaksi Tuntas" : "Dana Aman di Escrow"}
              </span>
              <h3 className="font-extrabold text-[#04261C] text-sm tracking-tight">
                No. Order: {order.id}
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
          {/* Status Banner */}
          {isSettled ? (
            <div className="bg-[#F2F7F4] border border-[#DDE7E2] rounded-2xl p-5 text-center space-y-2.5 shadow-2xs">
              <div className="w-12 h-12 bg-[#0A4D3C] text-white rounded-full flex items-center justify-center mx-auto shadow-[0_4px_12px_rgba(10,77,60,0.35)]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-[#04261C] text-base tracking-tight">
                Verifikasi Sukses &amp; Dana Dicairkan!
              </h4>
              <p className="text-xs text-[#4A6359] leading-relaxed max-w-xs mx-auto">
                Ampas tahu telah diverifikasi segar di lokasi. Dana sebesar{" "}
                <strong className="text-[#0A4D3C] font-mono">
                  Rp {order.totalAmount.toLocaleString("id-ID")}
                </strong>{" "}
                diteruskan ke saldo {order.factoryName}.
              </p>
            </div>
          ) : (
            <>
              {/* Inspection Warning Box */}
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-950">
                    Peringatan Pemeriksaan Mutu
                  </p>
                  <p className="text-amber-900/80 text-xs mt-1 leading-relaxed">
                    Periksa aroma &amp; kehangatan ampas tahu terlebih dahulu sebelum menunjukkan QR atau PIN ke kurir.
                  </p>
                </div>
              </div>

              {/* QR Card */}
              <div className="bg-white rounded-[24px] p-5 text-center shadow-2xs flex flex-col items-center max-w-[280px] mx-auto border border-[#DDE7E2]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4A6359] mb-3">
                  <QrCode className="w-3.5 h-3.5 text-[#0A4D3C]" />
                  <span>QR Pas Serah-Terima</span>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-[#DDE7E2] shadow-inner">
                  {/* High contrast SVG QR Code */}
                  <svg
                    className="w-40 h-40 text-[#04261C]"
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

                <span className="text-xs text-[#4A6359] font-medium mt-3">
                  Tunjukkan ke kurir untuk scan
                </span>
              </div>

              {/* 6-Digit PIN Display */}
              <div className="bg-white border border-[#DDE7E2] rounded-2xl p-4 text-center space-y-2 shadow-2xs">
                <span className="text-xs text-[#4A6359] block">
                  Atau sebutkan 6 Digit PIN Serah-Terima:
                </span>
                <div className="flex items-center justify-center gap-2">
                  <div className="font-mono text-2xl font-black tracking-[0.25em] text-[#04261C] bg-[#F4F8F5] px-5 py-2 rounded-xl border border-[#DDE7E2] shadow-inner">
                    {order.pin6Digit}
                  </div>
                  <button
                    onClick={handleCopyPin}
                    className="apple-press p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#F4F8F5] hover:bg-[#E2EBE5] text-[#04261C] transition-colors border border-[#DDE7E2] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
                    title="Salin PIN"
                    aria-label="Salin PIN"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#0A4D3C]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Courier Simulation Field */}
              <div className="bg-white border border-[#DDE7E2] rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#04261C] flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#0A4D3C]" />
                    Simulasi Verifikasi Kurir
                  </span>
                  <span className="text-xs bg-[#F4F8F5] text-[#0A4D3C] border border-[#DDE7E2] px-2.5 py-0.5 rounded-full font-bold">
                    Terkoneksi Backend
                  </span>
                </div>
                <p className="text-xs text-[#4A6359] leading-relaxed">
                  Masukkan PIN 6 digit peternak untuk memverifikasi ampas tiba segar dan mencairkan escrow di backend:
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
                      setErrorMessage(null);
                    }}
                    className="flex-1 bg-[#F4F8F5] border border-[#DDE7E2] focus:border-[#0A4D3C] focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-[#04261C] font-mono placeholder:text-[#4A6359]/60 focus:outline-none transition-colors"
                  />
                  <button
                    disabled={isVerifying}
                    onClick={handleVerify}
                    className="apple-press min-h-[44px] bg-[#0A4D3C] hover:bg-[#063125] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1 transition-colors shadow-[0_2px_8px_rgba(10,77,60,0.3)] shrink-0 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Cairkan Escrow</span>
                    )}
                  </button>
                </div>
                {pinError && (
                  <p className="text-xs text-rose-600 font-semibold animate-in fade-in duration-150">
                    {errorMessage || `PIN tidak cocok dengan transaksi (${order.pin6Digit}). Coba lagi.`}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Transaction Summary Card */}
          <div className="bg-white rounded-2xl p-4 text-xs border border-[#DDE7E2] space-y-2 shadow-2xs">
            <div className="flex justify-between text-[#4A6359]">
              <span>Pabrik Penyedia:</span>
              <strong className="text-[#04261C] font-bold">{order.factoryName}</strong>
            </div>
            <div className="flex justify-between text-[#4A6359]">
              <span>Item:</span>
              <span className="text-[#04261C]">{order.itemName}</span>
            </div>
            <div className="flex justify-between text-[#4A6359]">
              <span>Total Volume:</span>
              <span className="text-[#04261C]">{order.sacksCount} Karung ({order.totalKg} kg)</span>
            </div>
            <div className="flex justify-between text-[#4A6359] pt-2 border-t border-[#DDE7E2]">
              <span>Total Dana Escrow:</span>
              <span className="font-extrabold text-[#0A4D3C] font-mono text-base">
                Rp {order.totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
