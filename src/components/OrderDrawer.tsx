"use client";

import React, { useState, useEffect } from "react";
import { FactoryLocation, USER_FARMER_LOCATION } from "@/data/mockFactories";
import { calculateHaversineDistance, formatDistanceDisplay } from "@/lib/geo/haversine";
import {
  X,
  ShieldCheck,
  Truck,
  Store,
  Clock,
  Leaf,
  Lock,
  CheckCircle2,
  Minus,
  Plus
} from "lucide-react";

export interface ActiveOrder {
  id: string;
  factoryName: string;
  itemName: string;
  sacksCount: number;
  totalKg: number;
  pricePerSack: number;
  deliveryMethod: "delivery" | "pickup";
  shippingFee: number;
  platformFee: number;
  totalAmount: number;
  qrCodeToken: string;
  pin6Digit: string;
  status: "FUNDS_LOCKED" | "IN_TRANSIT" | "DELIVERED_SETTLED";
  createdAt: string;
  impactKg: number;
  avoidedCo2e: number;
  savingsIdr: number;
}

interface OrderDrawerProps {
  factory: FactoryLocation | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: ActiveOrder) => void;
}

export const OrderDrawer: React.FC<OrderDrawerProps> = ({
  factory,
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const [sacks, setSacks] = useState<number>(3);
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Escape key handler for keyboard accessibility (R-32)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !factory) return null;

  const distance = calculateHaversineDistance(
    { latitude: USER_FARMER_LOCATION.latitude, longitude: USER_FARMER_LOCATION.longitude },
    { latitude: factory.latitude, longitude: factory.longitude }
  );
  const formattedDistance = formatDistanceDisplay(distance);

  const shippingFee = deliveryMethod === "delivery" ? Math.round(5000 + distance * 3000) : 0;
  const platformFee = 1000;
  const subtotal = sacks * factory.activeBatch.pricePerSackIdr;
  const totalAmount = subtotal + shippingFee + platformFee;
  const totalKg = sacks * factory.activeBatch.weightPerSackKg;

  const co2eSaved = Math.round(totalKg * 1.736 * 10) / 10;
  const feedSavings = totalKg * 850;

  const handleConfirmOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
      const generatedOrder: ActiveOrder = {
        id: `SRK-${Math.floor(1000 + Math.random() * 9000)}`,
        factoryName: factory.name,
        itemName: factory.activeBatch.itemName,
        sacksCount: sacks,
        totalKg,
        pricePerSack: factory.activeBatch.pricePerSackIdr,
        deliveryMethod,
        shippingFee,
        platformFee,
        totalAmount,
        qrCodeToken: `SIRKULA-VERIFY-${Date.now()}-${generatedPin}`,
        pin6Digit: generatedPin,
        status: "FUNDS_LOCKED",
        createdAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        impactKg: totalKg,
        avoidedCo2e: co2eSaved,
        savingsIdr: feedSavings,
      };
      setIsSubmitting(false);
      onOrderSuccess(generatedOrder);
    }, 650);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-black/[0.08]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple Sheet Grabber */}
        <div className="pt-2.5 pb-1 bg-white shrink-0">
          <div className="apple-sheet-handle" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-10 border-b border-black/[0.05]">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mb-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Checkout Aman Sirkula Escrow</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg tracking-[-0.02em]">
              {factory.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="apple-press p-2 min-h-[40px] min-w-[40px] rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-slate-600 transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
            aria-label="Tutup checkout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto bg-slate-50/60">
          {/* Freshness SLA Notice */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 flex items-start gap-3">
            <Clock className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-emerald-950">
                Jaminan Kesegaran SLA 12 Jam
              </p>
              <p className="text-emerald-800/80 text-[11px] mt-0.5 leading-relaxed">
                Ampas tahu baru dimasak &amp; dipres subuh. Jarak antar hanya{" "}
                <strong className="text-emerald-950">{formattedDistance} km</strong>{" "}
                (~{Math.round(distance * 3)} menit), aman sebelum asam.
              </p>
            </div>
          </div>

          {/* iOS Stepper Card: Sacks Counter */}
          <div className="bg-white border border-black/[0.06] rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  Jumlah Karung Dipesan
                </label>
                <span className="text-[11px] text-slate-600">
                  1 karung = {factory.activeBatch.weightPerSackKg} kg ampas segar
                </span>
              </div>

              {/* Apple Stepper Capsule */}
              <div className="inline-flex items-center gap-3 bg-slate-100 p-1 rounded-full border border-black/[0.04]">
                <button
                  type="button"
                  onClick={() => setSacks((prev) => Math.max(1, prev - 1))}
                  className="apple-press w-8 h-8 rounded-full bg-white shadow-2xs hover:bg-slate-50 text-slate-800 font-bold flex items-center justify-center transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                  aria-label="Kurangi karung"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-extrabold text-slate-900 text-base min-w-[28px] text-center font-mono">
                  {sacks}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSacks((prev) => Math.min(factory.activeBatch.availableSacks, prev + 1))
                  }
                  className="apple-press w-8 h-8 rounded-full bg-emerald-700 text-white shadow-[0_2px_6px_rgba(52,199,89,0.3)] hover:bg-emerald-800 font-bold flex items-center justify-center transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                  aria-label="Tambah karung"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-black/[0.04] text-xs">
              <span className="text-slate-600 font-medium">Total Bobot Pakan:</span>
              <span className="font-bold text-slate-900 font-mono">{totalKg} kg</span>
            </div>
          </div>

          {/* Apple Segmented Delivery Option Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Metode Pengambilan
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Delivery */}
              <button
                type="button"
                onClick={() => setDeliveryMethod("delivery")}
                className={`apple-press p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all relative focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${
                  deliveryMethod === "delivery"
                    ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                    : "bg-white/80 border-black/[0.06] hover:border-black/[0.12]"
                }`}
              >
                {deliveryMethod === "delivery" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute top-3 right-3" />
                )}
                <div className="flex items-center gap-1.5 mb-2">
                  <Truck className={`w-4 h-4 ${deliveryMethod === "delivery" ? "text-emerald-600" : "text-slate-500"}`} />
                  <span className="text-[10px] font-semibold text-emerald-800">
                    Rekomendasi
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold block text-slate-900">Antar Kurir Re-Flow</span>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    Rp {Math.round(5000 + distance * 3000).toLocaleString("id-ID")} • Cepat
                  </span>
                </div>
              </button>

              {/* Pickup */}
              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={`apple-press p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all relative focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${
                  deliveryMethod === "pickup"
                    ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                    : "bg-white/80 border-black/[0.06] hover:border-black/[0.12]"
                }`}
              >
                {deliveryMethod === "pickup" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute top-3 right-3" />
                )}
                <div className="flex items-center gap-1.5 mb-2">
                  <Store className={`w-4 h-4 ${deliveryMethod === "pickup" ? "text-emerald-600" : "text-slate-500"}`} />
                  <span className="text-[10px] font-medium text-slate-600">
                    Mandiri
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold block text-slate-900">Ambil Mandiri</span>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    Gratis ongkir ke pabrik
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Escrow Guarantee Callout */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-blue-800 font-bold">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Proteksi Rekening Bersama (Escrow)</span>
            </div>
            <ul className="text-[11px] text-blue-900/80 space-y-1 leading-relaxed list-disc list-inside">
              <li>
                Dana <strong className="text-blue-950 font-bold">ditahan aman di Escrow</strong> hingga ampas tiba.
              </li>
              <li>
                Periksa suhu hangat &amp; aroma sebelum membagikan QR / PIN ke kurir.
              </li>
            </ul>
          </div>

          {/* SDG Impact Pill */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-[11px] text-emerald-950 font-bold block">
                  Kontribusi SDG 12 &amp; 13
                </span>
                <span className="text-[10px] text-emerald-700">
                  Cegah {co2eSaved} kg CO2e • Hemat pakan ~Rp {feedSavings.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Apple iOS Grouped Summary Table */}
          <div className="bg-white border border-black/[0.06] rounded-2xl p-4 space-y-2 text-xs shadow-2xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal ({sacks} karung × Rp {factory.activeBatch.pricePerSackIdr.toLocaleString("id-ID")})</span>
              <span className="text-slate-800 font-mono">Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Ongkir Jarak ({formattedDistance} km)</span>
              <span className="text-slate-800 font-mono">
                {shippingFee === 0 ? "Gratis" : `Rp ${shippingFee.toLocaleString("id-ID")}`}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Biaya Layanan Escrow &amp; QR</span>
              <span className="text-slate-800 font-mono">Rp {platformFee.toLocaleString("id-ID")}</span>
            </div>
            <div className="pt-2.5 border-t border-black/[0.05] flex items-center justify-between text-sm font-extrabold text-slate-900">
              <span>Total Pembayaran</span>
              <span className="text-emerald-700 text-lg font-mono tracking-tight">
                Rp {totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Apple Pay Style Primary CTA */}
        <div className="p-4 px-5 border-t border-black/[0.06] bg-white sticky bottom-0 z-10">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmOrder}
            className="apple-press w-full min-h-[48px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-4 px-6 rounded-full text-sm sm:text-base transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-[0_6px_20px_rgba(52,199,89,0.35)] focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Mengunci Dana di Escrow...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Bayar &amp; Kunci Stok (Rp {totalAmount.toLocaleString("id-ID")})</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
