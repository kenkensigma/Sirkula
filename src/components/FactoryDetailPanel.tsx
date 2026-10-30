"use client";

import React, { useState, useEffect } from "react";
import { FactoryLocation } from "@/data/mockFactories";
import { calculateHaversineDistance, formatDistanceDisplay } from "@/lib/geo/haversine";
import {
  ArrowLeft,
  X,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  Navigation,
  Check,
  Star,
  Flame,
  Droplet,
  Dna,
  Share2,
  Package,
  Scale,
  Quote,
  ChevronRight,
} from "lucide-react";

interface FactoryDetailPanelProps {
  factory: FactoryLocation;
  onBack: () => void;
  onClose: () => void;
  onOrder: (factory: FactoryLocation) => void;
  userLocation: { latitude: number; longitude: number };
}

const FRESHNESS_WINDOW_SECONDS = 12 * 3600;

const pad = (n: number) => String(n).padStart(2, "0");

export const FactoryDetailPanel: React.FC<FactoryDetailPanelProps> = ({
  factory,
  onBack,
  onClose,
  onOrder,
  userLocation,
}) => {
  const [copied, setCopied] = useState(false);

  const distance = calculateHaversineDistance(
    { latitude: userLocation.latitude, longitude: userLocation.longitude },
    { latitude: factory.latitude, longitude: factory.longitude }
  );
  const formattedDistance = formatDistanceDisplay(distance);
  const estimatedMinutes = Math.max(3, Math.round(distance * 3));

  // 12-hour freshness countdown
  const remainingHoursTotal = Math.max(0, 12 - factory.activeBatch.preparedAtHoursAgo);
  const [secondsLeft, setSecondsLeft] = useState(Math.round(remainingHoursTotal * 3600));

  useEffect(() => {
    setSecondsLeft(Math.round(remainingHoursTotal * 3600));
  }, [factory, remainingHoursTotal]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const freshnessPercent = Math.min(100, Math.max(0, (secondsLeft / FRESHNESS_WINDOW_SECONDS) * 100));

  const isGreen = factory.activeBatch.freshnessZone === "green";
  const totalKg = factory.activeBatch.availableSacks * factory.activeBatch.weightPerSackKg;
  const priceLabel = `Rp ${factory.activeBatch.pricePerSackIdr.toLocaleString("id-ID")}`;

  const handleOpenGoogleMapsRoute = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${factory.latitude},${factory.longitude}`;
    window.open(url, "_blank");
  };

  const handleShare = async () => {
    const text = `${factory.name} - ${factory.activeBatch.itemName} (${priceLabel}/karung)\n${factory.address}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: factory.name, text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled share */
    }
  };

  // Escape key handler for keyboard accessibility (R-32)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="flex flex-col h-full bg-white text-[#04261C] animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Sheet Grabber Handle — draggable */}
      <div data-sheet-handle className="pt-2 pb-1 bg-white shrink-0 cursor-grab active:cursor-grabbing touch-none">
        <div className="apple-sheet-handle" />
      </div>

      {/* Top navigation bar */}
      <div className="px-4 py-2 border-b border-[#E8F0EC] flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <button
          onClick={onBack}
          className="apple-press inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A4D3C] hover:text-[#063125] transition-colors py-2 px-3 min-h-[40px] rounded-full bg-[#F2F7F4] border border-[#DDE7E2] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Semua Pabrik</span>
        </button>

        <button
          onClick={onClose}
          className="apple-press p-2 min-h-[40px] min-w-[40px] rounded-full bg-[#F2F7F4] hover:bg-[#E8F0EC] text-[#04261C] transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
          title="Tutup Panel"
          aria-label="Tutup Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable sheet body */}
      <div className="flex-1 overflow-y-auto">
        {/* Place Hero */}
        <section className="px-5 pt-4 pb-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#F2F7F4] text-[#0A4D3C] border border-[#DDE7E2] px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0A4D3C]" />
              Mitra Terverifikasi Escrow
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-[#04261C] tracking-tight leading-tight">
            {factory.name}
          </h2>
          <p className="text-xs text-[#4A6359] mt-0.5">{factory.district}</p>

          <div className="flex items-center gap-2 mt-3 flex-wrap text-xs">
            <div className="inline-flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span className="text-[#04261C] font-bold">{factory.rating}</span>
              <span className="text-[#4A6359] text-[11px]">({factory.reviewsCount})</span>
            </div>
            <div className="inline-flex items-center gap-1 bg-[#F2F7F4] px-2.5 py-1 rounded-full border border-[#DDE7E2] font-semibold text-[#04261C]">
              <MapPin className="w-3.5 h-3.5 text-[#0A4D3C]" />
              <span>{formattedDistance} km</span>
              <span className="text-[#4A6359] font-normal">· ~{estimatedMinutes} mnt</span>
            </div>
          </div>
        </section>

        {/* 4-up Circular Action Pods */}
        <section className="px-5 py-2">
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* Rute */}
            <button
              onClick={handleOpenGoogleMapsRoute}
              className="apple-press flex flex-col items-center gap-1 group min-h-[44px] rounded-xl focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 p-1"
            >
              <div className="w-11 h-11 rounded-full bg-[#F2F7F4] text-[#0A4D3C] flex items-center justify-center border border-[#DDE7E2] shadow-2xs group-hover:scale-105 transition-transform">
                <Navigation className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#04261C]">Rute</span>
            </button>

            {/* Pesan */}
            <button
              onClick={() => onOrder(factory)}
              className="apple-press flex flex-col items-center gap-1 group min-h-[44px] rounded-xl focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 p-1"
            >
              <div className="w-11 h-11 rounded-full bg-[#0A4D3C] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#0A4D3C]">Pesan</span>
            </button>

            {/* Telepon */}
            <a
              href={`tel:${factory.phone}`}
              className="apple-press flex flex-col items-center gap-1 group min-h-[44px] rounded-xl focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 p-1"
            >
              <div className="w-11 h-11 rounded-full bg-[#F2F7F4] text-[#04261C] flex items-center justify-center border border-[#DDE7E2] shadow-2xs group-hover:scale-105 transition-transform">
                <Phone className="w-4 h-4 text-[#0A4D3C]" />
              </div>
              <span className="text-xs font-semibold text-[#04261C]">Telepon</span>
            </a>

            {/* Bagikan */}
            <button
              onClick={handleShare}
              className="apple-press flex flex-col items-center gap-1 group min-h-[44px] rounded-xl focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 p-1"
            >
              <div className="w-11 h-11 rounded-full bg-[#F2F7F4] text-[#04261C] flex items-center justify-center border border-[#DDE7E2] shadow-2xs group-hover:scale-105 transition-transform">
                {copied ? (
                  <Check className="w-4 h-4 text-[#0A4D3C]" />
                ) : (
                  <Share2 className="w-4 h-4 text-[#4A6359]" />
                )}
              </div>
              <span className="text-xs font-semibold text-[#04261C]">
                {copied ? "Tersalin" : "Bagikan"}
              </span>
            </button>
          </div>
        </section>

        <div className="px-5 pb-6 space-y-4 mt-2">
          {/* Offer Card: Product, Price, Stock */}
          <section className="rounded-2xl border border-[#E2EBE5] bg-white overflow-hidden shadow-2xs">
            <div className="p-4 bg-[#F7FAF8] border-b border-[#E8F0EC]">
              <span className="text-xs font-semibold text-[#0A4D3C]">
                Produk Unggulan
              </span>
              <h3 className="text-base font-bold text-[#04261C] mt-1 tracking-tight">
                {factory.activeBatch.itemName}
              </h3>
              <p className="text-xs text-[#4A6359] mt-0.5">
                {factory.activeBatch.itemSubtitle}
              </p>
            </div>

            <div className="p-4 bg-white">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-medium text-[#4A6359]">
                    Harga Mitra Pabrik
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-extrabold text-[#0A4D3C] font-mono tracking-tight">
                      {priceLabel}
                    </span>
                    <span className="text-xs text-[#4A6359] font-normal">/karung</span>
                  </div>
                </div>

                {!isGreen && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-900 border border-amber-500/20">
                    Diskon 15%
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3.5">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F7FAF8] border border-[#E8F0EC]">
                  <Package className="w-4 h-4 text-[#0A4D3C] shrink-0" />
                  <div>
                    <span className="text-[11px] text-[#4A6359] font-medium block">
                      Stok Siap Angkut
                    </span>
                    <span className="text-xs font-bold text-[#04261C]">
                      {factory.activeBatch.availableSacks} karung
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F7FAF8] border border-[#E8F0EC]">
                  <Scale className="w-4 h-4 text-[#0A4D3C] shrink-0" />
                  <div>
                    <span className="text-[11px] text-[#4A6359] font-medium block">
                      Total Berat
                    </span>
                    <span className="text-xs font-bold text-[#04261C]">
                      {totalKg} kg{" "}
                      <span className="text-[#4A6359] text-[10px] font-normal">
                        ({factory.activeBatch.weightPerSackKg}kg/krg)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Freshness Meter */}
          <section
            className={`p-4 rounded-2xl border transition-all ${
              isGreen
                ? "bg-[#F4F8F5] border-[#DDE7E2]"
                : "bg-amber-50/70 border-amber-500/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5 text-[#04261C]">
                <Clock className={`w-4 h-4 ${isGreen ? "text-[#0A4D3C]" : "text-amber-700"}`} />
                <span>{isGreen ? "Zona Hijau: Kualitas Prima" : "Zona Kuning: Diskon Cepat"}</span>
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isGreen
                    ? "bg-[#E8F0EC] text-[#0A4D3C]"
                    : "bg-amber-500/10 text-amber-900"
                }`}
              >
                SLA 12 Jam
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 mt-3">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight tabular-nums ${
                  isGreen ? "text-[#0A4D3C]" : "text-amber-900"
                }`}
              >
                {pad(hours)}:{pad(minutes)}:{pad(seconds)}
              </span>
              <span className="text-xs text-[#4A6359]">sisa kesegaran</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 rounded-full bg-black/[0.06] mt-3 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear shadow-xs ${
                  isGreen
                    ? "bg-[#0A4D3C]"
                    : "bg-gradient-to-r from-amber-500 to-amber-600"
                }`}
                style={{ width: `${freshnessPercent}%` }}
              />
            </div>

            <p className="text-xs text-[#4A6359] leading-relaxed mt-3">
              {isGreen
                ? "Ampas tahu baru dimasak dan dipres subuh tadi. Kondisi hangat dengan aroma kedelai murni gurih alami, optimal untuk penyerapan pakan ternak."
                : "Ampas tahu mendekati 10 jam. Kualitas fisik tetap aman dan higienis, ditawarkan diskon 15% sebelum proses asam."}
            </p>
          </section>

          {/* Lab Quality & Nutrition Cards */}
          <section>
            <span className="text-xs font-semibold text-[#04261C] block mb-2">
              Uji Mutu Laboratorium
            </span>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-3 rounded-2xl border border-[#E8F0EC] shadow-2xs">
                <Dna className="w-4 h-4 text-[#0A4D3C] mx-auto mb-1" />
                <span className="text-sm font-extrabold text-[#04261C] block font-mono">
                  {factory.activeBatch.proteinContent}
                </span>
                <span className="text-xs text-[#4A6359] font-medium">Protein Kasar</span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-[#E8F0EC] shadow-2xs">
                <Droplet className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <span className="text-sm font-extrabold text-[#04261C] block font-mono">
                  {factory.activeBatch.moistureContent}
                </span>
                <span className="text-xs text-[#4A6359] font-medium">Kadar Air</span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-[#E8F0EC] shadow-2xs">
                <Flame className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <span
                  className="text-sm font-extrabold text-[#04261C] block truncate"
                  title={factory.activeBatch.temperatureStatus}
                >
                  {factory.activeBatch.temperatureStatus.includes("38°C") ? "~38°C" : "Optimal"}
                </span>
                <span className="text-xs text-[#4A6359] font-medium">
                  {factory.activeBatch.temperatureStatus.includes("38°C") ? "Hangat" : "Suhu"}
                </span>
              </div>
            </div>

            {/* Quality Note Quote Callout */}
            <div className="mt-2.5 p-3 rounded-2xl bg-[#F7FAF8] border border-[#E8F0EC] flex items-start gap-2.5">
              <Quote className="w-4 h-4 text-[#0A4D3C] shrink-0 mt-0.5" />
              <p className="text-xs text-[#4A6359] italic leading-relaxed">
                &ldquo;{factory.activeBatch.qualityNotes}&rdquo;
              </p>
            </div>
          </section>

          {/* Grouped List for Factory & Location Info */}
          <section>
            <span className="text-xs font-semibold text-[#04261C] block mb-2">
              Informasi Operasional
            </span>

            <div className="rounded-2xl border border-[#E8F0EC] bg-white divide-y divide-[#E8F0EC] overflow-hidden text-xs shadow-2xs">
              <button
                onClick={handleOpenGoogleMapsRoute}
                className="apple-press w-full flex items-center gap-3 p-3.5 text-left hover:bg-[#F7FAF8] transition-colors focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
              >
                <MapPin className="w-4 h-4 text-[#4A6359] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-[#04261C] block">Alamat Lengkap</span>
                  <span className="text-[#4A6359] text-xs block mt-0.5">{factory.address}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6E857B] shrink-0" />
              </button>

              <div className="flex items-center gap-3 p-3.5">
                <Clock className="w-4 h-4 text-[#4A6359] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-[#04261C] block">Jam Produksi &amp; Ambil</span>
                  <span className="text-[#4A6359] text-xs block mt-0.5">{factory.operatingHours}</span>
                </div>
              </div>

              <a
                href={`tel:${factory.phone}`}
                className="apple-press flex items-center gap-3 p-3.5 hover:bg-[#F7FAF8] transition-colors focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
              >
                <Phone className="w-4 h-4 text-[#4A6359] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-[#04261C] block">Kontak PIC Pabrik</span>
                  <span className="text-[#4A6359] text-xs font-mono block mt-0.5">{factory.phone}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6E857B] shrink-0" />
              </a>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Bottom Primary Action */}
      <div className="p-3.5 px-5 border-t border-[#E8F0EC] bg-white/95 backdrop-blur-xl sticky bottom-0 z-20 shrink-0">
        <button
          onClick={() => onOrder(factory)}
          className="apple-press w-full min-h-[48px] bg-[#0A4D3C] hover:bg-[#063125] text-white font-bold py-3.5 px-5 rounded-full text-sm transition-all flex items-center justify-between shadow-xs focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Pesan Sekarang (Escrow)</span>
          </span>
          <span className="font-mono text-xs bg-white/20 py-1 px-2.5 rounded-full">
            {priceLabel}
          </span>
        </button>
      </div>
    </div>
  );
};
