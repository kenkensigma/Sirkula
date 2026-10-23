"use client";

import React, { useState, useEffect } from "react";
import { FactoryLocation, USER_FARMER_LOCATION } from "@/data/mockFactories";
import { calculateHaversineDistance, formatDistanceDisplay } from "@/lib/geo/haversine";
import {
  ArrowLeft,
  X,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  Navigation,
  Copy,
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
}

const FRESHNESS_WINDOW_SECONDS = 12 * 3600;

const pad = (n: number) => String(n).padStart(2, "0");

export const FactoryDetailPanel: React.FC<FactoryDetailPanelProps> = ({
  factory,
  onBack,
  onClose,
  onOrder,
}) => {
  const [copied, setCopied] = useState(false);

  const distance = calculateHaversineDistance(
    { latitude: USER_FARMER_LOCATION.latitude, longitude: USER_FARMER_LOCATION.longitude },
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const freshnessPercent = Math.min(100, Math.max(0, (secondsLeft / FRESHNESS_WINDOW_SECONDS) * 100));

  const isGreen = factory.activeBatch.freshnessZone === "green";
  const totalKg = factory.activeBatch.availableSacks * factory.activeBatch.weightPerSackKg;
  const priceLabel = `Rp ${factory.activeBatch.pricePerSackIdr.toLocaleString("id-ID")}`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${factory.name}, ${factory.address}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGoogleMapsRoute = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${USER_FARMER_LOCATION.latitude},${USER_FARMER_LOCATION.longitude}&destination=${factory.latitude},${factory.longitude}`;
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

  const quickActions = [
    {
      label: "Rute Peta",
      icon: <Navigation className="w-4 h-4 text-blue-700" />,
      onClick: handleOpenGoogleMapsRoute,
    },
    {
      label: "Telepon PIC",
      icon: <Phone className="w-4 h-4 text-emerald-700" />,
      href: `tel:${factory.phone}`,
    },
    {
      label: copied ? "Tersalin" : "Salin Alamat",
      icon: copied ? (
        <Check className="w-4 h-4 text-emerald-700" />
      ) : (
        <Copy className="w-4 h-4 text-slate-700" />
      ),
      onClick: handleCopyAddress,
    },
    {
      label: "Bagikan",
      icon: <Share2 className="w-4 h-4 text-slate-700" />,
      onClick: handleShare,
    },
  ];

  const actionClass =
    "flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 min-h-[48px] rounded-xl bg-white hover:bg-slate-50 text-slate-800 transition-colors border border-slate-200 text-xs font-semibold active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden";

  return (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Top navigation bar */}
      <div className="p-3 px-4 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <button
          onClick={onBack}
          aria-label="Kembali ke semua pabrik"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-slate-100 -ml-1 min-h-[40px] focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700" />
          <span>Semua Pabrik</span>
        </button>

        <button
          onClick={onClose}
          aria-label="Tutup panel detail pabrik"
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden"
          title="Tutup Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Section: Hero identity */}
        <section className="px-4 pt-4 pb-5 bg-gradient-to-b from-emerald-50/50 to-white">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            Mitra Terverifikasi Sirkula
          </span>

          <h2 className="text-xl font-bold text-slate-900 leading-tight mt-2.5">
            {factory.name}
          </h2>
          <p className="text-xs text-slate-600 mt-1">{factory.district}</p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-xs font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="text-slate-900 font-bold">{factory.rating}</span>
              <span className="text-slate-600">({factory.reviewsCount} ulasan)</span>
            </div>
            <div className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs font-semibold text-emerald-800">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>{formattedDistance} km • ~{estimatedMinutes} menit jemput</span>
            </div>
          </div>
        </section>

        <div className="px-4 pb-5 space-y-5">
          {/* ── Quick actions ── */}
          <section className="grid grid-cols-4 gap-2">
            {quickActions.map((action) =>
              action.href ? (
                <a key={action.label} href={action.href} className={actionClass}>
                  {action.icon}
                  <span>{action.label}</span>
                </a>
              ) : (
                <button key={action.label} onClick={action.onClick} className={actionClass}>
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              )
            )}
          </section>

          {/* Section: Product offer, price, and stock */}
          <section className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <p className="text-xs font-semibold text-slate-700">
                Produk Tersedia
              </p>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {factory.activeBatch.itemName}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {factory.activeBatch.itemSubtitle}
              </p>
            </div>

            <div className="p-4 bg-white">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600">Harga Pabrik</p>
                  <p className="text-2xl font-bold text-emerald-800 font-mono leading-none mt-1">
                    {priceLabel}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">per karung</p>
                </div>
                {!isGreen && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                    Diskon 15%
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Package className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-600 font-medium">Stok Siap Angkut</p>
                    <p className="text-xs font-bold text-slate-900">
                      {factory.activeBatch.availableSacks} karung
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Scale className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-600 font-medium">Total Berat</p>
                    <p className="text-xs font-bold text-slate-900">
                      {totalKg} kg
                      <span className="text-slate-600 font-normal">
                        {" "}
                        ({factory.activeBatch.weightPerSackKg} kg/krg)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Freshness status & timer */}
          <section
            className={`p-4 rounded-2xl border ${
              isGreen ? "bg-emerald-50/80 border-emerald-200" : "bg-amber-50/80 border-amber-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Clock className={`w-4 h-4 ${isGreen ? "text-emerald-700" : "text-amber-700"}`} />
                <span className={isGreen ? "text-emerald-950 font-bold" : "text-amber-950 font-bold"}>
                  {isGreen ? "Zona Hijau: Kualitas Prima (0-8 Jam)" : "Zona Kuning: Diskon Cepat 15% (8-10.5 Jam)"}
                </span>
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 mt-3">
              <span
                className={`text-2xl font-black font-mono tabular-nums ${
                  isGreen ? "text-emerald-900" : "text-amber-900"
                }`}
              >
                {pad(hours)}:{pad(minutes)}:{pad(seconds)}
              </span>
              <span className="text-xs font-medium text-slate-700">sisa batas kesegaran</span>
            </div>

            <div
              className={`h-2 rounded-full mt-3 overflow-hidden ${
                isGreen ? "bg-emerald-200" : "bg-amber-200"
              }`}
            >
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  isGreen ? "bg-emerald-700" : "bg-amber-600"
                }`}
                style={{ width: `${freshnessPercent}%` }}
              />
            </div>

            <p className="text-xs text-slate-700 leading-relaxed mt-3">
              {isGreen
                ? "Ampas tahu baru dimasak dan dipres pagi ini. Kondisi masih sangat segar dengan aroma kedelai gurih alami, cocok untuk memaksimalkan penyerapan protein ternak."
                : "Ampas tahu mendekati batas 10 jam. Kualitas fisik tetap aman dan higienis, ditawarkan dengan potongan harga khusus 15% sebelum memasuki fase fermentasi."}
            </p>
          </section>

          {/* Section: Feed lab quality */}
          <section>
            <h4 className="text-xs font-semibold text-slate-700 mb-2">
              Mutu &amp; Kualitas Pakan
            </h4>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <Dna className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
                <span className="text-sm font-bold text-slate-900 block font-mono">
                  {factory.activeBatch.proteinContent}
                </span>
                <span className="text-[11px] text-slate-600 font-medium">Protein Kasar</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <Droplet className="w-4 h-4 text-blue-700 mx-auto mb-1" />
                <span className="text-sm font-bold text-slate-900 block font-mono">
                  {factory.activeBatch.moistureContent}
                </span>
                <span className="text-[11px] text-slate-600 font-medium">Kadar Air</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <Flame className="w-4 h-4 text-amber-700 mx-auto mb-1" />
                <span
                  className="text-sm font-bold text-slate-900 block truncate"
                  title={factory.activeBatch.temperatureStatus}
                >
                  {factory.activeBatch.temperatureStatus.includes("38°C") ? "~38°C" : "Optimal"}
                </span>
                <span className="text-[11px] text-slate-600 font-medium">
                  {factory.activeBatch.temperatureStatus.includes("38°C") ? "Hangat" : "Suhu Fisik"}
                </span>
              </div>
            </div>

            <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-2">
              <Quote className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 italic leading-relaxed">
                {factory.activeBatch.qualityNotes}
              </p>
            </div>
          </section>

          {/* Section: Factory info & contact */}
          <section>
            <h4 className="text-xs font-semibold text-slate-700 mb-2">
              Informasi Pabrik &amp; Lokasi
            </h4>

            <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs bg-white shadow-2xs">
              <button
                onClick={handleOpenGoogleMapsRoute}
                className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden"
              >
                <MapPin className="w-4 h-4 text-slate-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-900 block">Alamat Lengkap</span>
                  <span className="text-slate-600 text-xs block mt-0.5">{factory.address}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              <div className="flex items-center gap-3 p-3.5">
                <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-900 block">Jam Produksi &amp; Buka</span>
                  <span className="text-slate-600 text-xs block mt-0.5">{factory.operatingHours}</span>
                </div>
              </div>

              <a
                href={`tel:${factory.phone}`}
                className="flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden"
              >
                <Phone className="w-4 h-4 text-slate-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-900 block">Kontak PIC</span>
                  <span className="text-slate-700 text-xs font-mono block mt-0.5">{factory.phone}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </a>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky CTA button */}
      <div className="p-3.5 px-4 border-t border-slate-200 bg-white sticky bottom-0 z-20 shrink-0">
        <button
          onClick={() => onOrder(factory)}
          aria-label={`Pesan sekarang dari ${factory.name} seharga ${priceLabel} per karung`}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all flex items-center justify-between min-h-[48px] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden shadow-sm"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Pesan Sekarang (Escrow)</span>
          </span>
          <span className="font-mono">{priceLabel}</span>
        </button>
      </div>
    </div>
  );
};
