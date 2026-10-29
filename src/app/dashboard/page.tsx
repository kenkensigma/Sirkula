"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Bell,
  Calendar,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  ShoppingBag,
  Leaf,
  Wallet,
  CheckCircle2,
  Thermometer,
  SlidersHorizontal,
  X,
  CreditCard,
  Building,
  Check,
  Activity,
} from "lucide-react";

interface Transaction {
  id: string;
  batch_id: string;
  factory_id: string;
  farmer_id?: string;
  buyer_name?: string;
  quantity_kg: number;
  sacks_count?: number;
  unit_price_idr: number;
  total_amount_idr: number;
  status: string;
  payment_mode: string;
  created_at: string;
  completed_at?: string | null;
}

interface ImpactSummary {
  period: { from: string; to: string };
  diverted_from_waste_kg: number;
  estimated_co2e_avoided_kg: number;
  estimated_feed_savings_idr: number;
  methodology: {
    co2e_kg_per_kg_material: number;
    feed_savings_idr_per_kg: number;
    label: string;
  };
}

// Initial rich mock data for factory seller dashboard demo & fallback
const DEFAULT_DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: "TRX-8B291A",
    batch_id: "BATCH-101",
    factory_id: "fac-1",
    buyer_name: "Peternak Sapi Pak Wayan",
    quantity_kg: 100,
    sacks_count: 2,
    unit_price_idr: 850,
    total_amount_idr: 85000,
    status: "awaiting_handover_verification",
    payment_mode: "simulation",
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35m ago
  },
  {
    id: "TRX-7C184D",
    batch_id: "BATCH-101",
    factory_id: "fac-1",
    buyer_name: "Kelompok Ternak Lembu Bali",
    quantity_kg: 250,
    sacks_count: 5,
    unit_price_idr: 850,
    total_amount_idr: 212500,
    status: "paid_simulated",
    payment_mode: "simulation",
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2h ago
  },
  {
    id: "TRX-6E902K",
    batch_id: "BATCH-100",
    factory_id: "fac-1",
    buyer_name: "Kandang Domba Sanur Barokah",
    quantity_kg: 500,
    sacks_count: 10,
    unit_price_idr: 850,
    total_amount_idr: 425000,
    status: "completed",
    payment_mode: "simulation",
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: "TRX-5F311P",
    batch_id: "BATCH-099",
    factory_id: "fac-1",
    buyer_name: "Sentra Sapi Perah Tabanan",
    quantity_kg: 1000,
    sacks_count: 20,
    unit_price_idr: 800,
    total_amount_idr: 800000,
    status: "completed",
    payment_mode: "simulation",
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
  },
  {
    id: "TRX-4A820M",
    batch_id: "BATCH-098",
    factory_id: "fac-1",
    buyer_name: "Pak Ketut Subak Intaran",
    quantity_kg: 200,
    sacks_count: 4,
    unit_price_idr: 850,
    total_amount_idr: 170000,
    status: "completed",
    payment_mode: "simulation",
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 46 * 3600 * 1000).toISOString(),
  },
];

/**
 * Circular Stock Gauge Component
 * Implements the circular progress indicator seen in the reference mock:
 * - Animates smoothly from 0 to target on initial page load / opening
 * - Circular track background
 * - Progress stroke in vibrant mint emerald (#34D399)
 * - Dot indicator at the exact tip of the arc with smooth gliding motion
 * - Center bold percentage text counting up dynamically from 0%
 */
function CircularStockGauge({
  percentage = 90,
  size = 114,
  strokeWidth = 9.5,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const [animatedPercent, setAnimatedPercent] = useState<number>(0);
  const [displayNumber, setDisplayNumber] = useState<number>(0);

  const cleanTarget = Math.min(100, Math.max(0, percentage));

  useEffect(() => {
    // Reset to 0 then animate to target for a crisp opening experience
    setAnimatedPercent(0);
    setDisplayNumber(0);

    const delayTimer = setTimeout(() => {
      setAnimatedPercent(cleanTarget);
    }, 120);

    let startTime: number | null = null;
    const duration = 1250; // 1.25s smooth spring duration
    let animFrame: number;

    const animateCount = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Apple smooth spring / easeOutExpo easing: slows down gracefully near target
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentNumber = Math.round(cleanTarget * easeProgress);

      setDisplayNumber(currentNumber);

      if (progress < 1) {
        animFrame = requestAnimationFrame(animateCount);
      } else {
        setDisplayNumber(cleanTarget);
      }
    };

    const countTimer = setTimeout(() => {
      animFrame = requestAnimationFrame(animateCount);
    }, 120);

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(countTimer);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [cleanTarget]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Calculate stroke dashoffset based on animated percentage
  const strokeDashoffset = circumference - (animatedPercent / 100) * circumference;

  // Calculate coordinates for the dot at the end of the arc
  // Arc starts at top (12 o'clock, which is -90deg in standard Cartesian)
  const angleInDegrees = (animatedPercent / 100) * 360 - 90;
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  const center = size / 2;
  const dotX = center + radius * Math.cos(angleInRadians);
  const dotY = center + radius * Math.sin(angleInRadians);

  return (
    <div
      className="relative flex items-center justify-center shrink-0 select-none"
      style={{ width: size, height: size }}
      aria-label={`Persentase ketersediaan stok: ${cleanTarget}%`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255, 255, 255, 0.18)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Arc with Smooth Apple Easing */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#34D399"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-[1250ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        />
      </svg>

      {/* Circular Dot Indicator on tip of the arc */}
      {animatedPercent > 1 && (
        <div
          className="absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-[#0A4D3C] pointer-events-none transition-all duration-[1250ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            left: `${dotX}px`,
            top: `${dotY}px`,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      {/* Center Percentage Display (Animated Count-up) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-2xl sm:text-[26px] font-black text-white tracking-tight font-mono">
          {displayNumber}%
        </span>
      </div>
    </div>
  );
}

function DashboardInner() {
  const { user, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_DEMO_TRANSACTIONS);
  const [impact, setImpact] = useState<ImpactSummary | null>(null);

  // Stock interactive state
  const [availableStockKg, setAvailableStockKg] = useState<number>(450);
  const [totalCapacityKg] = useState<number>(500);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState<boolean>(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Operational status pills (inspired by the mood selector row in the reference mock)
  const [activeStatusId, setActiveStatusId] = useState<string>("hot_press");

  const operationalStatuses = [
    {
      id: "hot_press",
      emoji: "🔥",
      label: "Pres Hangat (38°C)",
      desc: "Ampas baru selesai dipres subuh, hangat dan aroma kedelai murni.",
      badge: "Grade A",
    },
    {
      id: "in_transit",
      emoji: "🚚",
      label: "Kurir Menuju Lokasi",
      desc: "Armada pengantaran sedang menuju peternak dengan pelacak GPS aktif.",
      badge: "2 Pengiriman",
    },
    {
      id: "discount",
      emoji: "⚡",
      label: "Diskon Sore 15%",
      desc: "Mulai pukul 14:00 WITA untuk ampas sesi siang agar cepat habis tanpa sisa.",
      badge: "Aktif",
    },
    {
      id: "protein_rich",
      emoji: "🌾",
      label: "Protein 26.4%",
      desc: "Kadar protein tinggi terverifikasi hasil uji laboratorium pangan ternak.",
      badge: "Super",
    },
    {
      id: "escrow_secure",
      emoji: "🔒",
      label: "Rekening Escrow Aman",
      desc: "Seluruh dana transaksi terkunci aman hingga serah terima selesai diverifikasi.",
      badge: "100% Proteksi",
    },
  ];

  // Calculate percentage dynamically
  const stockPercentage = useMemo(() => {
    if (totalCapacityKg <= 0) return 0;
    return Math.round((availableStockKg / totalCapacityKg) * 100);
  }, [availableStockKg, totalCapacityKg]);

  // Fetch live transactions and impact if available
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const [txRes, impactRes] = await Promise.all([
          fetch("/api/v1/transactions?limit=10&page=1", {
            headers: { "Cache-Control": "no-cache" },
          }),
          fetch("/api/v1/impact/summary", {
            headers: { "Cache-Control": "no-cache" },
          }),
        ]);

        if (txRes.ok) {
          const txJson = await txRes.json();
          if (isMounted && txJson.data && txJson.data.length > 0) {
            setTransactions(txJson.data);
          }
        }

        if (impactRes.ok) {
          const impactJson = await impactRes.json();
          if (isMounted && impactJson.data) {
            setImpact(impactJson.data);
          }
        }
      } catch (err) {
        console.warn("Using demo data fallback:", err);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatCurrency = (value: number) =>
    `Rp ${value.toLocaleString("id-ID")}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Calculate revenue statistics
  const revenueStats = useMemo(() => {
    let escrowHeldAmount = 0;
    let settledAmount = 0;
    let totalSacks = 0;
    let totalKg = 0;

    transactions.forEach((tx) => {
      totalKg += tx.quantity_kg;
      totalSacks += tx.sacks_count ?? Math.ceil(tx.quantity_kg / 50);

      if (tx.status === "completed") {
        settledAmount += tx.total_amount_idr;
      } else if (
        tx.status === "paid_simulated" ||
        tx.status === "shipped" ||
        tx.status === "awaiting_handover_verification"
      ) {
        escrowHeldAmount += tx.total_amount_idr;
      }
    });

    // Provide sensible default base numbers for demo if transaction list is short
    const effectiveSettled = Math.max(settledAmount, 3400000);
    const effectiveEscrow = Math.max(escrowHeldAmount, 850000);
    const totalRevenue = effectiveSettled + effectiveEscrow;
    const effectiveKg = Math.max(totalKg, 5000);
    const effectiveSacks = Math.max(totalSacks, 100);

    return {
      totalRevenue,
      settledAmount: effectiveSettled,
      escrowHeldAmount: effectiveEscrow,
      totalKg: effectiveKg,
      totalSacks: effectiveSacks,
      averagePricePerKg: Math.round(totalRevenue / effectiveKg),
    };
  }, [transactions]);

  const statusLabel: Record<string, { text: string; cls: string; dot: string }> = {
    awaiting_simulated_payment: {
      text: "Menunggu Bayar",
      cls: "text-[#9A3412] bg-[#FFF7ED] border border-[#FFEDD5]",
      dot: "#ea580c",
    },
    paid_simulated: {
      text: "Dana di Escrow",
      cls: "text-[#0A4D3C] bg-[#E8F0EC] border border-[#DDE7E2]",
      dot: "#0A4D3C",
    },
    shipped: {
      text: "Kurir Mengantar",
      cls: "text-[#0284c7] bg-[#f0f9ff] border border-[#bae6fd]",
      dot: "#0284c7",
    },
    awaiting_handover_verification: {
      text: "Verifikasi PIN",
      cls: "text-[#0A4D3C] bg-[#F2F7F4] border border-[#DDE7E2]",
      dot: "#10b981",
    },
    completed: {
      text: "Tuntas Dicairkan",
      cls: "text-[#04261C] bg-[#04261C]/[0.07] border border-[#04261C]/[0.1]",
      dot: "#04261C",
    },
    cancelled: {
      text: "Dibatalkan",
      cls: "text-[#dc2626] bg-[#FEF2F2] border border-[#FECACA]",
      dot: "#dc2626",
    },
  };

  const displayName = user?.name || "Pabrik Sumber Barokah";

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#04261C] pb-24 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#04261C] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
          <span>{toastMessage}</span>
        </div>
      )}



      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#F8FAF9] border-b border-[#DDE7E2]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          {/* Left: Avatar + Welcome back */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="apple-press p-2 min-h-[40px] min-w-[40px] rounded-full bg-white hover:bg-[#F2F7F4] text-[#04261C] border border-[#DDE7E2] transition-colors inline-flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#0A4D3C] shadow-2xs"
              title="Kembali ke Radar Peta"
              aria-label="Kembali ke Radar Peta"
            >
              <ArrowLeft className="w-4 h-4 text-[#0A4D3C]" />
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A4D3C] to-[#04261C] text-white flex items-center justify-center font-bold text-sm shadow-[0_4px_12px_rgba(10,77,60,0.22)] border-2 border-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#34D399] border-2 border-white" />
              </div>

              <div>
                <p className="text-xs text-[#4A6359] font-medium leading-none mb-1">
                  Selamat datang kembali,
                </p>
                <h1 className="text-base sm:text-lg font-extrabold text-[#04261C] tracking-tight leading-tight truncate max-w-[160px] sm:max-w-xs">
                  {displayName}
                </h1>
              </div>
            </div>
          </div>

          {/* Right: Notification Bell & Calendar Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast("Tidak ada notifikasi baru hari ini")}
              className="apple-press relative p-2 min-h-[40px] min-w-[40px] rounded-full bg-white hover:bg-[#F2F7F4] text-[#04261C] border border-[#DDE7E2] shadow-2xs flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-[#0A4D3C]"
              title="Notifikasi"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4 text-[#4A6359]" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0A4D3C]" />
            </button>

            <button
              onClick={() => showToast("Jadwal operasional: Buka 04:30 - 13:00 WITA")}
              className="apple-press p-2 min-h-[40px] min-w-[40px] rounded-full bg-white hover:bg-[#F2F7F4] text-[#04261C] border border-[#DDE7E2] shadow-2xs flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-[#0A4D3C]"
              title="Kalender & Jam Operasional"
              aria-label="Kalender & Jam Operasional"
            >
              <Calendar className="w-4 h-4 text-[#4A6359]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* ========================================================= */}
        {/* HERO SECTION: BAGIAN STOK DENGAN PERSENTASE SEPERTI GAMBAR */}
        {/* ========================================================= */}
        <section
          aria-label="Ringkasan Stok Ampas Tahu"
          className="rounded-2xl bg-[#0A4D3C] text-white p-6 sm:p-7 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div className="space-y-2 order-2 sm:order-1 max-w-sm">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-100 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                <span>Batch Aktif • Pres Subuh</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Stok Ampas Tahu
              </h2>

              <p className="text-sm text-emerald-100/90 font-medium">
                <span className="font-bold text-white font-mono">{availableStockKg}</span> / {totalCapacityKg} kg kapasitas siap ambil
              </p>

              <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
                {Math.round(availableStockKg / 50)} dari {Math.round(totalCapacityKg / 50)} karung ampas segar Grade A tersedia untuk peternak di radar 15 km.
              </p>

              <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
                <button
                  onClick={() => setIsAdjustStockOpen(true)}
                  className="apple-press inline-flex items-center gap-1.5 text-xs font-bold bg-white text-[#0A4D3C] hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all shadow-xs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Ubah Stok</span>
                </button>

                <span className="text-xs text-emerald-100/80 font-mono">
                  Suhu ~38°C
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center shrink-0 order-1 sm:order-2">
              <div
                onClick={() => setIsAdjustStockOpen(true)}
                className="cursor-pointer active:scale-95 transition-transform"
                title="Klik untuk mengubah persentase stok"
              >
                <CircularStockGauge percentage={stockPercentage} size={118} strokeWidth={9.5} />
              </div>

              <button
                onClick={() => setIsAdjustStockOpen(true)}
                className="apple-press mt-2 text-emerald-200/80 hover:text-white flex items-center gap-0.5 text-xs font-medium"
              >
                <span>Detail</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* BAGIAN DIBAWAHNYA: PENDAPATAN DARI PENJUALAN */}
        {/* ========================================================= */}
        <section
          aria-label="Pendapatan dari Penjualan"
          className="bg-white border border-[#DDE7E2] rounded-2xl p-5 sm:p-6 shadow-[0_4px_16px_rgba(4,38,28,0.04)] space-y-5"
        >
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8F0EC] gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F2F7F4] border border-[#DDE7E2] flex items-center justify-center text-[#0A4D3C]">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#04261C] tracking-tight">
                  Pendapatan dari Penjualan
                </h3>
                <p className="text-xs sm:text-sm text-[#4A6359] font-medium">
                  Rekapitulasi kliring penjualan ampas tahu
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-[#0A4D3C] bg-[#F2F7F4] border border-[#DDE7E2] px-2.5 py-1 rounded-lg w-full sm:w-auto text-center">
              Bulan Ini
            </span>
          </div>

          {/* Large Revenue Highlight (flat on card, no nested card border) */}
          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-[#4A6359] block mb-1">
                Total Akumulasi Pendapatan
              </span>
              <span className="text-3xl sm:text-4xl font-black text-[#04261C] tracking-tight font-mono">
                {formatCurrency(revenueStats.totalRevenue)}
              </span>
              <p className="text-xs text-[#4A6359] mt-1">
                Dari {revenueStats.totalSacks} karung ({revenueStats.totalKg.toLocaleString("id-ID")} kg) ampas tahu terdistribusi ke peternak.
              </p>
            </div>

            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="apple-press w-full sm:w-auto bg-[#0A4D3C] hover:bg-[#063125] text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-xs inline-flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#0A4D3C]"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Tarik Saldo</span>
            </button>
          </div>

          {/* Revenue Breakdown (flat divided grid, no nested card boxes) */}
          <div className="pt-4 border-t border-[#E8F0EC] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E8F0EC] gap-4 sm:gap-0">
            {/* 1. Dana di Escrow (Berjalan) */}
            <div className="sm:pr-4 space-y-1">
              <div className="flex items-center justify-between text-[#4A6359]">
                <span className="text-xs font-semibold">Dana di Escrow</span>
                <ShieldCheck className="w-4 h-4 text-[#0A4D3C]" />
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-[#0A4D3C]">
                {formatCurrency(revenueStats.escrowHeldAmount)}
              </div>
              <p className="text-xs text-[#4A6359] leading-relaxed">
                Aman di rekening bersama, menunggu verifikasi serah terima PIN kurir.
              </p>
            </div>

            {/* 2. Dana Dicairkan (Selesai) */}
            <div className="pt-3 sm:pt-0 sm:px-4 space-y-1">
              <div className="flex items-center justify-between text-[#4A6359]">
                <span className="text-xs font-semibold">Telah Dicairkan</span>
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-[#04261C]">
                {formatCurrency(revenueStats.settledAmount)}
              </div>
              <p className="text-xs text-[#4A6359] leading-relaxed">
                Telah ditransfer tuntas ke rekening bank mitra pabrik Anda.
              </p>
            </div>

            {/* 3. Rata-rata & Volume */}
            <div className="pt-3 sm:pt-0 sm:pl-4 space-y-1">
              <div className="flex items-center justify-between text-[#4A6359]">
                <span className="text-xs font-semibold">Rata-rata Harga</span>
                <TrendingUp className="w-4 h-4 text-[#4A6359]" />
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-[#04261C]">
                Rp {revenueStats.averagePricePerKg.toLocaleString("id-ID")} <span className="text-xs font-normal text-[#4A6359]">/ kg</span>
              </div>
              <p className="text-xs text-[#4A6359] leading-relaxed">
                Setara Rp {(revenueStats.averagePricePerKg * 50).toLocaleString("id-ID")} / karung (bobot 50 kg).
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* OPERATIONAL STATUS PILLS (Inspired by mood selector in image) */}
        {/* ========================================================= */}
        <section
          aria-label="Status Kesiapan Operasional"
          className="bg-white border border-[#DDE7E2] rounded-2xl p-5 shadow-[0_4px_16px_rgba(4,38,28,0.04)] space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#04261C] tracking-tight">
                Status Kesiapan &amp; Mutu Batch Hari Ini
              </h3>
              <p className="text-xs sm:text-sm text-[#4A6359]">
                Pilih status untuk memperbarui informasi ampas tahu ke radar peternak
              </p>
            </div>
            <Activity className="w-4 h-4 text-[#0A4D3C] sm:self-start" />
          </div>

          {/* Interactive Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {operationalStatuses.map((st) => {
              const isActive = activeStatusId === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    setActiveStatusId(st.id);
                    showToast(`Status diubah: ${st.label}`);
                  }}
                  className={`apple-press flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                    isActive
                      ? "bg-[#0A4D3C] text-white border-[#0A4D3C] shadow-xs"
                      : "bg-[#F2F7F4] hover:bg-[#E8F0EC] text-[#04261C] border-[#DDE7E2]"
                  }`}
                >
                  <span className="text-base">{st.emoji}</span>
                  <span>{st.label}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-white text-[#0A4D3C] border border-[#DDE7E2]"
                    }`}
                  >
                    {st.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active status explanation (integrated row, no nested card) */}
          {operationalStatuses.find((s) => s.id === activeStatusId) && (
            <div className="pt-3 border-t border-[#E8F0EC] flex items-center justify-between text-xs">
              <span className="text-[#4A6359]">
                {operationalStatuses.find((s) => s.id === activeStatusId)?.desc}
              </span>
              <span className="text-[#0A4D3C] font-semibold shrink-0 ml-3 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Live di Radar
              </span>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* BENTO GRID: KUALITAS BATCH & DAMPAK LINGKUNGAN */}
        {/* ========================================================= */}
        <section
          aria-label="Metrik Operasional dan Dampak"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {/* Card 1: Kualitas Ampas Tahu */}
          <div className="bg-white border border-[#DDE7E2] rounded-2xl p-5 shadow-[0_4px_16px_rgba(4,38,28,0.04)] space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#F2F7F4] border border-[#DDE7E2] flex items-center justify-center text-[#0A4D3C]">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#04261C] tracking-tight">
                  Kualitas &amp; Kesegaran
                </h4>
                <p className="text-xs sm:text-sm text-[#4A6359]">Hasil uji sampel batch saat ini</p>
              </div>
            </div>

            {/* Flat unified stat group without nested card boxes */}
            <div className="grid grid-cols-3 divide-x divide-[#E8F0EC] bg-[#F7FAF8] rounded-xl py-3 text-center">
              <div className="px-2">
                <span className="text-xs font-semibold text-[#4A6359] block mb-0.5">Suhu</span>
                <span className="text-base font-extrabold text-[#04261C] font-mono">38°C</span>
              </div>
              <div className="px-2">
                <span className="text-xs font-semibold text-[#4A6359] block mb-0.5">Protein</span>
                <span className="text-base font-extrabold text-[#0A4D3C] font-mono">26.4%</span>
              </div>
              <div className="px-2">
                <span className="text-xs font-semibold text-[#4A6359] block mb-0.5">Kadar Air</span>
                <span className="text-base font-extrabold text-[#04261C] font-mono">81%</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#4A6359] leading-relaxed">
              Tekstur padat terpres dengan aroma gurih khas kedelai segar, aman langsung dikonsumsi ternak sapi dan babi tanpa fermentasi tambahan.
            </p>
          </div>

          {/* Card 2: Dampak Lingkungan (SDG) */}
          <div className="bg-white border border-[#DDE7E2] rounded-2xl p-5 shadow-[0_4px_16px_rgba(4,38,28,0.04)] space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#F2F7F4] border border-[#DDE7E2] flex items-center justify-center text-[#0A4D3C]">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#04261C] tracking-tight">
                  Dampak Lingkungan (SDG)
                </h4>
                <p className="text-xs sm:text-sm text-[#4A6359]">Pencegahan pencemaran air &amp; emisi</p>
              </div>
            </div>

            {/* Flat unified stat group without nested card boxes */}
            <div className="grid grid-cols-2 divide-x divide-[#E8F0EC] bg-[#F7FAF8] rounded-xl py-3 text-center">
              <div className="px-3">
                <span className="text-xs font-semibold text-[#4A6359] block mb-0.5">CO2e Dicegah</span>
                <span className="text-base font-extrabold text-[#0A4D3C] font-mono">
                  {impact && impact.estimated_co2e_avoided_kg > 0
                    ? `${Math.round(impact.estimated_co2e_avoided_kg).toLocaleString("id-ID")} kg`
                    : "8.680 kg"}
                </span>
              </div>
              <div className="px-3">
                <span className="text-xs font-semibold text-[#4A6359] block mb-0.5">Limbah Dialihkan</span>
                <span className="text-base font-extrabold text-[#04261C] font-mono">
                  {impact && impact.diverted_from_waste_kg > 0
                    ? `${Math.round(impact.diverted_from_waste_kg).toLocaleString("id-ID")} kg`
                    : "5.000 kg"}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#4A6359] leading-relaxed">
              Mencegah fermentasi anaerobik di Daerah Aliran Sungai (DAS) Bali dan menghemat jutaan rupiah biaya pakan ternak konsentrat konvensional.
            </p>
          </div>
        </section>

        {/* ========================================================= */}
        {/* TRANSAKSI TERBARU (LIVE ESCROW FEED) */}
        {/* ========================================================= */}
        <section
          aria-label="Transaksi Penjualan Terbaru"
          className="bg-white border border-[#DDE7E2] rounded-2xl shadow-[0_4px_16px_rgba(4,38,28,0.04)] overflow-hidden"
        >
          <div className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E8F0EC] bg-[#F7FAF8] gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F2F7F4] border border-[#DDE7E2] flex items-center justify-center text-[#0A4D3C]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#04261C] tracking-tight leading-none">
                  Transaksi Penjualan Terbaru
                </h3>
                <p className="text-xs sm:text-sm text-[#4A6359] font-medium mt-1">
                  Pantau pesanan masuk dan verifikasi escrow langsung
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-[#0A4D3C] bg-[#F2F7F4] border border-[#DDE7E2] px-3 py-1 rounded-full flex items-center gap-1.5 w-full sm:w-auto justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
              Live Feed
            </span>
          </div>

          {/* Clean divided list feed - eliminates nested cards & heavy side-tab accent borders */}
          <div className="divide-y divide-[#E8F0EC]">
            {transactions.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-3">
                <ShoppingBag className="w-10 h-10 text-[#4A6359] mx-auto opacity-50" />
                <p className="text-xs sm:text-sm text-[#4A6359]">Belum ada transaksi penjualan yang tercatat.</p>
              </div>
            ) : (
              transactions.map((tx) => {
                const statusInfo =
                  statusLabel[tx.status] ??
                  statusLabel["awaiting_handover_verification"];
                const isCompleted = tx.status === "completed";
                return (
                  <div
                    key={tx.id}
                    className="p-4 sm:p-5 hover:bg-[#F9FBFA] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#04261C]">
                          #{tx.id.slice(0, 10).toUpperCase()}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${statusInfo.cls}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: statusInfo.dot }}
                          />
                          {statusInfo.text}
                        </span>
                      </div>

                      <p className="text-sm sm:text-base font-bold text-[#04261C] tracking-tight truncate">
                        {tx.buyer_name ?? "Peternak Sapi Rakyat"}
                      </p>

                      <p className="text-xs sm:text-sm text-[#4A6359]">
                        {tx.quantity_kg} kg ampas ({Math.ceil(tx.quantity_kg / 50)} karung) • Batch {tx.batch_id}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center">
                      <span className="text-base sm:text-lg font-black font-mono text-[#0A4D3C]">
                        {formatCurrency(tx.total_amount_idr)}
                      </span>
                      <span className="text-xs text-[#4A6359] font-medium">
                        {isCompleted ? `Tuntas ${formatDate(tx.completed_at ?? tx.created_at)}` : formatDate(tx.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* ========================================================= */}
      {/* MODAL: UBAH STOK AMPAS TAHU */}
      {/* ========================================================= */}
      {isAdjustStockOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="adjust-stock-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#DDE7E2] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F2F7F4] flex items-center justify-center text-[#0A4D3C]">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <h3 id="adjust-stock-title" className="font-extrabold text-base text-[#04261C]">
                  Ubah Stok Tersedia
                </h3>
              </div>
              <button
                onClick={() => setIsAdjustStockOpen(false)}
                className="apple-press p-1.5 rounded-full bg-[#F2F7F4] text-[#4A6359] hover:text-[#04261C]"
                aria-label="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-2 space-y-1">
              <div className="text-4xl font-black text-[#0A4D3C] font-mono">
                {availableStockKg} <span className="text-base font-normal text-[#4A6359]">kg</span>
              </div>
              <p className="text-xs text-[#4A6359]">
                {stockPercentage}% dari total kuota {totalCapacityKg} kg ({Math.round(availableStockKg / 50)} karung)
              </p>
            </div>

            {/* Steppers */}
            <div className="space-y-3">
              <label htmlFor="stock-range-input" className="text-xs font-semibold text-[#4A6359] block">
                Sesuaikan Persentase Ketersediaan:
              </label>
              <input
                id="stock-range-input"
                type="range"
                min="0"
                max={totalCapacityKg}
                step="25"
                value={availableStockKg}
                onChange={(e) => setAvailableStockKg(Number(e.target.value))}
                className="w-full accent-[#0A4D3C] cursor-pointer"
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                {[25, 50, 75, 90, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setAvailableStockKg(Math.round((pct / 100) * totalCapacityKg))}
                    className={`apple-press px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      stockPercentage === pct
                        ? "bg-[#0A4D3C] text-white border-[#0A4D3C]"
                        : "bg-[#F2F7F4] text-[#04261C] border-[#DDE7E2] hover:bg-[#E8F0EC]"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setIsAdjustStockOpen(false);
                  showToast(`Stok berhasil diperbarui: ${availableStockKg} kg (${stockPercentage}%)`);
                }}
                className="apple-press w-full py-3 bg-[#0A4D3C] hover:bg-[#063125] text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Simpan Pembaruan Stok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TARIK SALDO DANA ESCROW */}
      {/* ========================================================= */}
      {isWithdrawModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdraw-funds-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#DDE7E2] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F2F7F4] flex items-center justify-center text-[#0A4D3C]">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 id="withdraw-funds-title" className="font-extrabold text-base text-[#04261C]">
                  Tarik Saldo Penjualan
                </h3>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="apple-press p-1.5 rounded-full bg-[#F2F7F4] text-[#4A6359] hover:text-[#04261C]"
                aria-label="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#F4F8F5] rounded-2xl p-4 border border-[#DDE7E2]">
              <span className="text-xs font-semibold text-[#4A6359] block">
                Saldo Selesai yang Dapat Ditarik
              </span>
              <span className="text-2xl font-black text-[#04261C] font-mono mt-1 block">
                {formatCurrency(revenueStats.settledAmount)}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#4A6359] block">
                Rekening Tujuan Terverifikasi:
              </span>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[#0A4D3C] bg-[#F2F7F4]">
                <Building className="w-5 h-5 text-[#0A4D3C]" />
                <div className="text-xs min-w-0">
                  <p className="font-bold text-[#04261C]">BCA • 8410293810</p>
                  <p className="text-[#4A6359] truncate">a.n. Pabrik Tahu Sumber Barokah</p>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setIsWithdrawModalOpen(false);
                  showToast("Permintaan pencairan dana berhasil dikirim ke bank!");
                }}
                className="apple-press w-full py-3 bg-[#0A4D3C] hover:bg-[#063125] text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Konfirmasi Tarik Dana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "factory")) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router, user?.role]);

  if (authLoading || !isAuthenticated || user?.role !== "factory") {
    return (
      <div className="min-h-screen bg-[#F8FAF9] text-[#04261C] flex items-center justify-center">
        <div className="text-sm text-[#4A6359]">Mengalihkan ke halaman login...</div>
      </div>
    );
  }

  return <DashboardInner />;
}
