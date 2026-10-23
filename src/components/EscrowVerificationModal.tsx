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
  Check
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !order) return null;

  const handleCopyPin = () => {
    navigator.clipboard.writeText(order.pin6Digit);
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-800 block">
                {isSettled ? "Transaksi Tuntas" : "Dana Ditahan di Escrow"}
              </span>
              <h3 className="font-bold text-slate-900 text-sm">
                No. Pesanan: {order.id}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal verifikasi escrow"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto bg-slate-50">
          {/* Status Banner */}
          {isSettled ? (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-center space-y-2 shadow-sm">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-300">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">
                Verifikasi Sukses &amp; Dana Dicairkan!
              </h4>
              <p className="text-xs text-slate-600">
                Ampas tahu telah diverifikasi segar di lokasi Anda. Dana sebesar{" "}
                <strong className="text-emerald-700">
                  Rp {order.totalAmount.toLocaleString("id-ID")}
                </strong>{" "}
                telah diteruskan ke saldo {order.factoryName}.
              </p>
            </div>
          ) : (
            <>
              {/* Mandatory inspection warning box */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 shadow-2xs">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-950">
                    Peringatan Pemeriksaan Fisik di Lokasi
                  </p>
                  <p className="text-amber-900 text-xs mt-1 leading-relaxed">
                    Periksa bau gurih alami dan kehangatan ampas tahu terlebih dahulu sebelum menunjukkan QR atau PIN ini ke kurir saat barang tiba.
                  </p>
                </div>
              </div>

              {/* QR Code Presentation Box */}
              <div className="bg-white rounded-3xl p-5 text-center shadow-xs flex flex-col items-center max-w-[280px] mx-auto border border-slate-200">
                <div className="p-3 bg-white rounded-2xl border border-slate-200">
                  {/* SVG QR Code Simulation */}
                  <svg
                    className="w-44 h-44 text-slate-900"
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

                <span className="text-xs text-slate-700 font-semibold mt-2.5">
                  Tunjukkan ke kurir untuk scan saat ampas tiba segar
                </span>
              </div>

              {/* 6-Digit PIN Display & Backup Input */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center space-y-2 shadow-2xs">
                <span className="text-xs text-slate-700 block font-medium">
                  Atau sebutkan 6 Digit PIN Serah-Terima:
                </span>
                <div className="flex items-center justify-center gap-2">
                  <div className="font-mono text-2xl font-black tracking-widest text-slate-900 bg-slate-50 px-4 py-2 rounded-xl border border-slate-300">
                    {order.pin6Digit}
                  </div>
                  <button
                    onClick={handleCopyPin}
                    aria-label="Salin PIN 6 Digit"
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden"
                    title="Salin PIN"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Kurir Verification Field Simulation */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    Simulasi Verifikasi Kurir di Lapangan
                  </span>
                  <span className="text-[11px] bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded-md font-semibold">
                    Simulasi Lapangan
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Ketik PIN 6 digit peternak untuk mensimulasikan konfirmasi kurir bahwa ampas telah tiba dalam kondisi segar:
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Ketik 6 digit PIN"
                    value={simulatedInputPin}
                    aria-label="Input PIN 6 Digit Simulasi Kurir"
                    onChange={(e) => {
                      setSimulatedInputPin(e.target.value);
                      setPinError(false);
                    }}
                    className="flex-1 bg-slate-50 border border-slate-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700 focus:bg-white rounded-xl px-3 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-500 focus:outline-hidden transition-colors"
                  />
                  <button
                    onClick={handleVerify}
                    aria-label="Konfirmasi pencairan dana escrow"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center transition-colors shadow-xs min-h-[40px] focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden active:scale-95"
                  >
                    <span>Cairkan Escrow</span>
                  </button>
                </div>
                {pinError && (
                  <p className="text-xs text-rose-700 font-semibold mt-1">
                    PIN tidak cocok dengan PIN transaksi {order.pin6Digit}. Silakan coba lagi.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Transaction Summary Card */}
          <div className="bg-white rounded-xl p-3.5 text-xs border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex justify-between text-slate-700">
              <span>Pabrik Penyedia:</span>
              <strong className="text-slate-900">{order.factoryName}</strong>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Item:</span>
              <span className="text-slate-900">{order.itemName}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Total Volume:</span>
              <span className="text-slate-900 font-medium">{order.sacksCount} Karung ({order.totalKg} kg)</span>
            </div>
            <div className="flex justify-between text-slate-700 pt-2 border-t border-slate-100">
              <span>Total Dana Escrow:</span>
              <span className="font-bold text-emerald-800 font-mono text-sm">
                Rp {order.totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
