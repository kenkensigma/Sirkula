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

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    try {
      let realTxId: string | null = null;
      const idempotencyKey = `SRK-IDEM-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // Try calling real API POST /api/v1/transactions
      try {
        const res = await fetch("/api/v1/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batch_id: factory.activeBatch.id,
            quantity_kg: totalKg,
            idempotency_key: idempotencyKey,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.id) {
            realTxId = json.data.id;
            // Pay simulation to lock funds in Escrow
            await fetch(`/api/v1/transactions/${realTxId}/pay-simulation`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payment_method: "simulated_balance" }),
            });
          }
        }
      } catch (err) {
        // Fallback gracefully for mock batches or network variance
        console.warn("API transaction note:", err);
      }

      const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
      const orderId = realTxId
        ? `SRK-${realTxId.slice(0, 8).toUpperCase()}`
        : `SRK-${Math.floor(1000 + Math.random() * 9000)}`;

      const generatedOrder: ActiveOrder = {
        id: orderId,
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
    } catch {
      setIsSubmitting(false);
    }
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
        <div className="px-5 py-3.5 flex items-center justify-between bg-white sticky top-0 z-10 border-b border-[#DDE7E2]">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#0A4D3C] font-semibold mb-0.5">
              <ShieldCheck className="w-4 h-4 text-[#0A4D3C]" />
              <span>Checkout Aman Sirkula Escrow</span>
            </div>
            <h3 className="font-extrabold text-[#04261C] text-lg tracking-tight">
              {factory.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="apple-press p-2 min-h-[44px] min-w-[44px] rounded-full bg-[#04261C]/[0.05] hover:bg-[#04261C]/[0.08] text-[#04261C] transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
            aria-label="Tutup checkout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto bg-[#F4F8F5]">
          {/* Freshness SLA Notice */}
          <div className="bg-white border border-[#DDE7E2] rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
            <Clock className="w-4 h-4 text-[#0A4D3C] mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-[#04261C]">
                Jaminan Kesegaran SLA 12 Jam
              </p>
              <p className="text-[#4A6359] text-xs mt-1 leading-relaxed">
                Ampas tahu baru dimasak &amp; dipres subuh. Jarak antar hanya{" "}
                <strong className="text-[#04261C]">{formattedDistance} km</strong>{" "}
                (~{Math.round(distance * 3)} menit), aman sebelum fermentasi asam.
              </p>
            </div>
          </div>

          {/* Stepper Card: Sacks Counter */}
          <div className="bg-white border border-[#DDE7E2] rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-[#04261C] block">
                  Jumlah Karung Dipesan
                </label>
                <span className="text-xs text-[#4A6359]">
                  1 karung = {factory.activeBatch.weightPerSackKg} kg ampas segar
                </span>
              </div>

              {/* Stepper Capsule */}
              <div className="inline-flex items-center gap-3 bg-[#F4F8F5] p-1.5 rounded-full border border-[#DDE7E2]">
                <button
                  type="button"
                  onClick={() => setSacks((prev) => Math.max(1, prev - 1))}
                  className="apple-press w-9 h-9 rounded-full bg-white shadow-2xs hover:bg-[#F2F7F4] text-[#04261C] font-bold flex items-center justify-center transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 border border-[#DDE7E2]"
                  aria-label="Kurangi karung"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-extrabold text-[#04261C] text-base min-w-[28px] text-center font-mono">
                  {sacks}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSacks((prev) => Math.min(factory.activeBatch.availableSacks, prev + 1))
                  }
                  className="apple-press w-9 h-9 rounded-full bg-[#0A4D3C] text-white shadow-[0_2px_8px_rgba(10,77,60,0.3)] hover:bg-[#063125] font-bold flex items-center justify-center transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
                  aria-label="Tambah karung"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-[#DDE7E2] text-xs">
              <span className="text-[#4A6359] font-medium">Total Bobot Pakan:</span>
              <span className="font-bold text-[#04261C] font-mono">{totalKg} kg</span>
            </div>
          </div>

          {/* Delivery Option Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#04261C] block">
              Metode Pengambilan
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Delivery */}
              <button
                type="button"
                onClick={() => setDeliveryMethod("delivery")}
                className={`apple-press p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all relative focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 ${
                  deliveryMethod === "delivery"
                    ? "bg-[#F2F7F4] border-2 border-[#0A4D3C] shadow-xs"
                    : "bg-white border-[#DDE7E2] hover:border-[#CBDCD2]"
                }`}
              >
                {deliveryMethod === "delivery" && (
                  <CheckCircle2 className="w-4 h-4 text-[#0A4D3C] absolute top-3 right-3" />
                )}
                <div className="flex items-center gap-1.5 mb-2">
                  <Truck className={`w-4 h-4 ${deliveryMethod === "delivery" ? "text-[#0A4D3C]" : "text-[#4A6359]"}`} />
                  <span className="text-xs font-semibold text-[#0A4D3C]">
                    Rekomendasi
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold block text-[#04261C]">Antar Kurir Re-Flow</span>
                  <span className="text-xs text-[#4A6359] block mt-0.5">
                    Rp {Math.round(5000 + distance * 3000).toLocaleString("id-ID")} • Cepat
                  </span>
                </div>
              </button>

              {/* Pickup */}
              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={`apple-press p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all relative focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 ${
                  deliveryMethod === "pickup"
                    ? "bg-[#F2F7F4] border-2 border-[#0A4D3C] shadow-xs"
                    : "bg-white border-[#DDE7E2] hover:border-[#CBDCD2]"
                }`}
              >
                {deliveryMethod === "pickup" && (
                  <CheckCircle2 className="w-4 h-4 text-[#0A4D3C] absolute top-3 right-3" />
                )}
                <div className="flex items-center gap-1.5 mb-2">
                  <Store className={`w-4 h-4 ${deliveryMethod === "pickup" ? "text-[#0A4D3C]" : "text-[#4A6359]"}`} />
                  <span className="text-xs font-medium text-[#4A6359]">
                    Mandiri
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold block text-[#04261C]">Ambil Mandiri</span>
                  <span className="text-xs text-[#4A6359] block mt-0.5">
                    Gratis ongkir ke pabrik
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Escrow Guarantee Callout */}
          <div className="bg-white border border-[#DDE7E2] rounded-2xl p-4 space-y-2 text-xs shadow-2xs">
            <div className="flex items-center gap-1.5 text-[#0A4D3C] font-bold">
              <Lock className="w-4 h-4 text-[#0A4D3C]" />
              <span>Proteksi Rekening Bersama (Escrow)</span>
            </div>
            <ul className="text-xs text-[#4A6359] space-y-1.5 leading-relaxed list-disc list-inside">
              <li>
                Dana <strong className="text-[#04261C] font-bold">ditahan aman di Escrow</strong> hingga ampas tiba.
              </li>
              <li>
                Periksa suhu hangat &amp; aroma sebelum membagikan QR / PIN ke kurir.
              </li>
            </ul>
          </div>

          {/* SDG Impact Pill */}
          <div className="bg-[#F2F7F4] border border-[#DDE7E2] rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Leaf className="w-4 h-4 text-[#0A4D3C] shrink-0" />
              <div>
                <span className="text-xs text-[#04261C] font-bold block">
                  Kontribusi SDG 12 &amp; 13
                </span>
                <span className="text-xs text-[#4A6359]">
                  Cegah {co2eSaved} kg CO2e • Hemat pakan ~Rp {feedSavings.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Table */}
          <div className="bg-white border border-[#DDE7E2] rounded-2xl p-4 space-y-2.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between text-[#4A6359]">
              <span>Subtotal ({sacks} karung × Rp {factory.activeBatch.pricePerSackIdr.toLocaleString("id-ID")})</span>
              <span className="text-[#04261C] font-mono font-medium">Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex items-center justify-between text-[#4A6359]">
              <span>Ongkir Jarak ({formattedDistance} km)</span>
              <span className="text-[#04261C] font-mono font-medium">
                {shippingFee === 0 ? "Gratis" : `Rp ${shippingFee.toLocaleString("id-ID")}`}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#4A6359]">
              <span>Biaya Layanan Escrow &amp; QR</span>
              <span className="text-[#04261C] font-mono font-medium">Rp {platformFee.toLocaleString("id-ID")}</span>
            </div>
            <div className="pt-2.5 border-t border-[#DDE7E2] flex items-center justify-between text-sm font-extrabold text-[#04261C]">
              <span>Total Pembayaran</span>
              <span className="text-[#0A4D3C] text-lg font-mono tracking-tight">
                Rp {totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="p-4 px-5 border-t border-[#DDE7E2] bg-white sticky bottom-0 z-10">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmOrder}
            className="apple-press w-full min-h-[48px] bg-[#0A4D3C] hover:bg-[#063125] text-white font-bold py-3.5 px-6 rounded-full text-sm sm:text-base transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-[0_4px_16px_rgba(10,77,60,0.3)] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
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
