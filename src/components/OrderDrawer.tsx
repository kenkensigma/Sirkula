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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between bg-white sticky top-0 z-10 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold mb-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Checkout Aman Sirkula Escrow</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base leading-tight">
              {factory.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup formulir pesanan"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-3 overflow-y-auto bg-slate-50">
          {/* Freshness SLA Reminder */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-emerald-950">
                Jaminan Kesegaran SLA 12 Jam
              </p>
              <p className="text-emerald-900 text-xs mt-0.5 leading-relaxed">
                Ampas tahu baru dimasak &amp; pres pagi ini. Jarak pengiriman hanya{" "}
                <strong className="text-emerald-950 font-bold">{formattedDistance} km</strong>{" "}
                (~{Math.round(distance * 3)} menit), aman sebelum fase fermentasi.
              </p>
            </div>
          </div>

          {/* Sacks Counter */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  Jumlah Karung Dipesan
                </label>
                <span className="text-xs text-slate-600">
                  1 karung = {factory.activeBatch.weightPerSackKg} kg ampas tahu
                </span>
              </div>
              {/* Counter buttons */}
              <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  aria-label="Kurangi jumlah karung"
                  onClick={() => setSacks((prev) => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold flex items-center justify-center shadow-xs focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden active:scale-95"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-extrabold text-slate-900 text-lg min-w-[28px] text-center font-mono">
                  {sacks}
                </span>
                <button
                  type="button"
                  aria-label="Tambah jumlah karung"
                  onClick={() =>
                    setSacks((prev) => Math.min(factory.activeBatch.availableSacks, prev + 1))
                  }
                  className="w-8 h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center shadow-xs focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-600 font-medium">Total Berat:</span>
              <span className="font-bold text-slate-900">{totalKg} kg ampas segar</span>
            </div>
          </div>

          {/* Delivery Option */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Metode Pengambilan / Pengiriman
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod("delivery")}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  deliveryMethod === "delivery"
                    ? "bg-green-50 border-green-400 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Truck className={`w-4 h-4 ${deliveryMethod === "delivery" ? "text-green-600" : "text-slate-400"}`} />
                  <span className="text-[10px] font-bold text-green-600">Rekomendasi</span>
                </div>
                <div>
                  <span className="text-xs font-bold block text-slate-800">Antar Kurir Re-Flow</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Rp {Math.round(5000 + distance * 3000).toLocaleString("id-ID")} • Cepat
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  deliveryMethod === "pickup"
                    ? "bg-green-50 border-green-400 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Store className={`w-4 h-4 ${deliveryMethod === "pickup" ? "text-green-600" : "text-slate-400"}`} />
                  <span className="text-[10px] font-bold text-slate-500">Gratis</span>
                </div>
                <div>
                  <span className="text-xs font-bold block text-slate-800">Ambil Mandiri</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Ke lokasi pabrik
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Escrow Mechanism Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-blue-700 font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Mekanisme Rekening Bersama (Escrow)</span>
            </div>
            <ul className="text-[11px] text-blue-700/80 space-y-1.5 list-disc list-inside">
              <li>
                Uang Anda <strong className="text-blue-800">ditahan aman di sistem Escrow</strong>, bukan langsung ke pabrik.
              </li>
              <li>
                Saat barang tiba di lokasi Anda, periksa aroma &amp; kehangatan ampas tahu terlebih dahulu.
              </li>
              <li>
                Jika segar, tunjukkan <strong>QR Code / PIN 6 Digit</strong> ke kurir agar dana dicairkan ke pabrik.
              </li>
            </ul>
          </div>

          {/* SDG Impact */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <span className="text-xs text-emerald-950 font-bold block">
                  Kontribusi SDG 12 &amp; 13
                </span>
                <span className="text-xs text-emerald-800">
                  Cegah {co2eSaved} kg CO2e • Hemat pakan ternak ~Rp {feedSavings.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs shadow-2xs">
            <div className="flex items-center justify-between text-slate-700">
              <span>Subtotal ({sacks} karung x Rp {factory.activeBatch.pricePerSackIdr.toLocaleString("id-ID")})</span>
              <span className="text-slate-900 font-medium">Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>Ongkir Jarak ({formattedDistance} km)</span>
              <span className="text-slate-900 font-medium">{shippingFee === 0 ? "Gratis" : `Rp ${shippingFee.toLocaleString("id-ID")}`}</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>Biaya Layanan Escrow &amp; QR</span>
              <span className="text-slate-900 font-medium">Rp {platformFee.toLocaleString("id-ID")}</span>
            </div>
            <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-sm font-bold text-slate-900">
              <span>Total Pembayaran Escrow</span>
              <span className="text-emerald-800 text-base font-mono font-bold">
                Rp {totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-10">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmOrder}
            aria-label={`Konfirmasi pembayaran dan kunci stok Rp ${totalAmount.toLocaleString("id-ID")}`}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 min-h-[48px] focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden shadow-xs"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Mengunci Stok di Escrow...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Bayar &amp; Kunci Stok Sekarang (Rp {totalAmount.toLocaleString("id-ID")})</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
