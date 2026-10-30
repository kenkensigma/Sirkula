"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Bell,
  Calendar,
  ChevronRight,
  ShieldCheck,
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
  Flame,
  Truck,
  Tag,
  Award,
  KeyRound,
  Clock,
  RefreshCw,
  PackageOpen,
  Plus,
} from "lucide-react";

// ─── Types matching API response contracts ──────────────────────────────────

interface Transaction {
  id: string;
  batch_id: string;
  factory_id: string;
  farmer_id?: string;
  quantity_kg: number;
  unit_price_idr: number;
  total_amount_idr: number;
  status: string;
  payment_mode: string;
  idempotency_key?: string;
  created_at: string;
  completed_at?: string | null;
}

interface BatchItem {
  id: string;
  factory_id: string;
  factory_name: string;
  quantity_kg: number;
  available_kg: number;
  price_per_kg_idr: number;
  latitude: number;
  longitude: number;
  prepared_at: string;
  expires_at: string;
  freshness_zone: string;
  status: string;
  description?: string | null;
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

interface OperationalStatusItem {
  id: string;
  label: string;
  spec: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

const OPERATIONAL_STATUSES: OperationalStatusItem[] = [
  {
    id: "hot_press",
    label: "Pres Hangat",
    spec: "38°C • Baru Dipres",
    badge: "Grade A",
    desc: "Ampas segar pres subuh, suhu hangat optimal langsung siap pakan.",
    icon: Flame,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
  },
  {
    id: "in_transit",
    label: "Kurir Menuju Lokasi",
    spec: "2 Armada Siaga",
    badge: "Radius 15 km",
    desc: "Armada pengantaran aktif menuju peternak dengan pelacak GPS.",
    icon: Truck,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700",
  },
  {
    id: "discount",
    label: "Diskon Sore 15%",
    spec: "Mulai 14:00 WITA",
    badge: "Flash Deal",
    desc: "Penyesuaian ampas sesi siang agar cepat tersalurkan habis.",
    icon: Tag,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-700",
  },
  {
    id: "protein_rich",
    label: "Protein Tinggi",
    spec: "26.4% Teruji Lab",
    badge: "Super",
    desc: "Kadar protein terverifikasi laboratorium pakan ternak Bali.",
    icon: Award,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
  {
    id: "escrow_secure",
    label: "Escrow Terlindungi",
    spec: "Rekening Bersama",
    badge: "100% Aman",
    desc: "Dana terkunci aman dan otomatis dicairkan pasca verifikasi PIN.",
    icon: ShieldCheck,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-700",
  },
];

// ─── Circular Stock Gauge ───────────────────────────────────────────────────

function CircularStockGauge({
  percentage = 90,
  size = 120,
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
    setAnimatedPercent(0);
    setDisplayNumber(0);

    const delayTimer = setTimeout(() => {
      setAnimatedPercent(cleanTarget);
    }, 100);

    let startTime: number | null = null;
    const duration = 1200;
    let animFrame: number;

    const animateCount = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
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
    }, 100);

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(countTimer);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [cleanTarget]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPercent / 100) * circumference;

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
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255, 255, 255, 0.18)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
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
          className="transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        />
      </svg>

      {animatedPercent > 1 && (
        <div
          className="absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-[#0A4D3C] pointer-events-none transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            left: `${dotX}px`,
            top: `${dotY}px`,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-2xl font-black text-white tracking-tight font-mono">
          {displayNumber}%
        </span>
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ───────────────────────────────────────────────

function DashboardInner() {
  const { user, isAuthenticated } = useAuth();

  // Real data state — starts empty, populated by API
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [impact, setImpact] = useState<ImpactSummary | null>(null);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Create Batch modal state (for suppliers/manufacturers)
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState<boolean>(false);
  const [batchQuantityKg, setBatchQuantityKg] = useState<string>("500");
  const [batchPricePerKg, setBatchPricePerKg] = useState<string>("500");
  const [batchDescription, setBatchDescription] = useState<string>(
    "Ampas tahu segar rebusan subuh, hangat dan padat"
  );
  const [isSubmittingBatch, setIsSubmittingBatch] = useState<boolean>(false);

  // Stock interactive state (derived from batches, can be overridden)
  const [stockOverride, setStockOverride] = useState<number | null>(null);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState<boolean>(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [verifyingTx, setVerifyingTx] = useState<Transaction | null>(null);
  const [pinInput, setPinInput] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Operational status selection
  const [activeStatusId, setActiveStatusId] = useState<string>("hot_press");

  // Table filter tab
  const [txFilter, setTxFilter] = useState<"all" | "pending" | "completed">("all");

  // ── Derived batch/stock data from real API ──
  const stockData = useMemo(() => {
    if (batches.length === 0) {
      return { totalCapacity: 0, availableKg: 0, activeBatchId: null as string | null, avgPrice: 0, batchCount: 0 };
    }

    const totalCapacity = batches.reduce((sum, b) => sum + b.quantity_kg, 0);
    const availableKg = batches.reduce((sum, b) => sum + b.available_kg, 0);
    const avgPrice = batches.length > 0
      ? Math.round(batches.reduce((sum, b) => sum + b.price_per_kg_idr, 0) / batches.length)
      : 0;

    // Find the most recent / freshest batch for the hero label
    const freshest = [...batches].sort(
      (a, b) => new Date(b.prepared_at).getTime() - new Date(a.prepared_at).getTime()
    )[0];

    return {
      totalCapacity,
      availableKg: stockOverride ?? availableKg,
      activeBatchId: freshest?.id ?? null,
      avgPrice,
      batchCount: batches.length,
    };
  }, [batches, stockOverride]);

  const stockPercentage = useMemo(() => {
    if (stockData.totalCapacity <= 0) return 0;
    return Math.round((stockData.availableKg / stockData.totalCapacity) * 100);
  }, [stockData]);

  // ── Data Fetching ──
  const fetchDashboardData = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);

    try {
      const headers: HeadersInit = { "Cache-Control": "no-cache" };

      // Fetch all data in parallel
      const [txRes, batchRes, impactRes] = await Promise.all([
        fetch("/api/v1/transactions?limit=20&page=1", { headers }),
        fetch("/api/v1/batches", { headers }),
        fetch("/api/v1/impact/summary", { headers }),
      ]);

      // Process transactions
      if (txRes.ok) {
        const txJson = await txRes.json();
        if (txJson.data) {
          setTransactions(txJson.data);
        }
      } else if (txRes.status === 401) {
        // Not authenticated — OK, just show empty state
        setTransactions([]);
      }

      // Process batches
      if (batchRes.ok) {
        const batchJson = await batchRes.json();
        if (batchJson.data) {
          setBatches(batchJson.data);
        }
      }

      // Process impact
      if (impactRes.ok) {
        const impactJson = await impactRes.json();
        if (impactJson.data) {
          setImpact(impactJson.data);
        }
      }
    } catch (err) {
      console.warn("Dashboard data fetch error:", err);
      setDataError("Gagal memuat data. Periksa koneksi dan coba lagi.");
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, isAuthenticated, user]);

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

  // ── Revenue stats computed from real transaction data ──
  const revenueStats = useMemo(() => {
    let escrowHeldAmount = 0;
    let settledAmount = 0;
    let totalKg = 0;

    transactions.forEach((tx) => {
      totalKg += tx.quantity_kg;

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

    const totalRevenue = settledAmount + escrowHeldAmount;
    const totalSacks = Math.ceil(totalKg / 50);
    const averagePricePerKg = totalKg > 0 ? Math.round(totalRevenue / totalKg) : stockData.avgPrice;

    return {
      totalRevenue,
      settledAmount,
      escrowHeldAmount,
      totalKg,
      totalSacks,
      averagePricePerKg,
    };
  }, [transactions, stockData.avgPrice]);

  // ── Filtered transactions for table ──
  const filteredTransactions = useMemo(() => {
    if (txFilter === "pending") {
      return transactions.filter(
        (tx) =>
          tx.status === "awaiting_handover_verification" ||
          tx.status === "paid_simulated" ||
          tx.status === "shipped" ||
          tx.status === "awaiting_simulated_payment"
      );
    }
    if (txFilter === "completed") {
      return transactions.filter((tx) => tx.status === "completed");
    }
    return transactions;
  }, [transactions, txFilter]);

  const pendingCount = useMemo(
    () => transactions.filter((tx) =>
      tx.status === "awaiting_handover_verification" ||
      tx.status === "paid_simulated" ||
      tx.status === "shipped" ||
      tx.status === "awaiting_simulated_payment"
    ).length,
    [transactions]
  );

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
      cls: "text-[#0A4D3C] bg-[#E8F0EC] border border-[#A7F3D0]",
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

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast("Silakan masuk dengan akun Pabrik untuk menerbitkan batch.");
      return;
    }

    const qty = Number(batchQuantityKg);
    const price = Number(batchPricePerKg);

    if (isNaN(qty) || qty <= 0) {
      showToast("Kuantitas ampas harus lebih besar dari 0 kg");
      return;
    }
    if (isNaN(price) || price < 0) {
      showToast("Harga per kg harus valid");
      return;
    }

    setIsSubmittingBatch(true);
    try {
      const res = await fetch("/api/v1/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity_kg: qty,
          price_per_kg_idr: price,
          latitude: -8.65,
          longitude: 115.21,
          prepared_at: new Date().toISOString(),
          description: batchDescription.trim() || "Ampas segar pres pabrik",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal menerbitkan batch");
      }

      showToast(`Batch pasokan ${qty} kg berhasil diterbitkan ke Radar!`);
      setIsCreateBatchOpen(false);
      setBatchQuantityKg("500");
      setBatchPricePerKg("500");
      fetchDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      showToast(msg);
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const handleVerifyPinSubmit = () => {
    if (!verifyingTx) return;
    if (pinInput.trim().length !== 6) {
      showToast("Masukkan 6-digit PIN verifikasi yang sah");
      return;
    }

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === verifyingTx.id
          ? {
              ...t,
              status: "completed",
              completed_at: new Date().toISOString(),
            }
          : t
      )
    );

    showToast(`Pesanan #${verifyingTx.id.slice(0, 8)} berhasil dicairkan ke saldo!`);
    setVerifyingTx(null);
    setPinInput("");
  };

  const displayName = user?.name || "Dashboard Sirkula";
  const displayRole = user?.role === "factory" ? "Pabrik" : user?.role === "farmer" ? "Peternak" : null;

  // ── Compute display values for impact, preferring real data ──
  const impactCo2e = impact && impact.estimated_co2e_avoided_kg > 0
    ? `${Math.round(impact.estimated_co2e_avoided_kg).toLocaleString("id-ID")} kg`
    : stockData.totalCapacity > 0
      ? `${Math.round(stockData.totalCapacity * 1.736).toLocaleString("id-ID")} kg`
      : "—";

  const impactWaste = impact && impact.diverted_from_waste_kg > 0
    ? `${Math.round(impact.diverted_from_waste_kg).toLocaleString("id-ID")} kg`
    : revenueStats.totalKg > 0
      ? `${revenueStats.totalKg.toLocaleString("id-ID")} kg`
      : "—";

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#04261C] pb-24 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#04261C] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Demo / Farmer Banner */}
      {!isAuthenticated ? (
        <div className="bg-[#FFF4ED] border-b border-[#FFE0D1] px-4 sm:px-6 lg:px-8 py-2 text-xs text-[#04261C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F95721]" />
            <span>
              <strong>Mode Pratinjau</strong> — Data yang ditampilkan berasal dari sistem demo / batch aktif.
            </span>
          </div>
          <Link
            href="/login"
            className="font-bold text-[#F95721] hover:underline whitespace-nowrap ml-2"
          >
            Masuk Akun →
          </Link>
        </div>
      ) : (
        <div className="bg-[#F2F7F4] border-b border-[#DDE7E2] px-4 sm:px-6 lg:px-8 py-2 text-xs text-[#0A4D3C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>
              Akun {displayRole}: <strong>{user?.name}</strong> •{" "}
              {transactions.length > 0
                ? `${transactions.length} transaksi aktif`
                : "Menampilkan data real-time"}
            </span>
          </div>
          <Link href="/" className="font-bold underline text-[#0A4D3C] ml-2">
            Peta Belanja →
          </Link>
        </div>
      )}

      {/* Top Header Command Bar */}
      <header className="sticky top-0 z-30 bg-[#F8FAF9]/95 backdrop-blur-md border-b border-[#DDE7E2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Left: Back Link & Factory Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="apple-press p-2 min-h-[40px] min-w-[40px] rounded-xl bg-white hover:bg-[#F2F7F4] text-[#04261C] border border-[#DDE7E2] transition-colors inline-flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#0A4D3C] shadow-2xs"
              title="Kembali ke Radar Peta"
              aria-label="Kembali ke Radar Peta"
            >
              <ArrowLeft className="w-4 h-4 text-[#0A4D3C]" />
            </Link>

            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A4D3C] to-[#04261C] text-white flex items-center justify-center font-bold text-sm shadow-[0_4px_12px_rgba(10,77,60,0.22)] border-2 border-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#34D399] border-2 border-white" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold text-[#04261C] tracking-tight truncate">
                    {displayName}
                  </h1>
                  {batches.length > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/80 text-[11px] font-bold text-[#0A4D3C]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      {batches.length} Batch Aktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#4A6359] font-medium truncate">
                  {isAuthenticated && displayRole
                    ? `${displayRole} • Pusat Kliring Ampas Tahu`
                    : "Pusat Kliring & Distribusi Ampas Tahu"}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Refresh Button */}
            <button
              onClick={() => {
                fetchDashboardData();
                showToast("Data dashboard diperbarui.");
              }}
              className="apple-press p-2 min-h-[40px] min-w-[40px] rounded-xl bg-white hover:bg-[#F2F7F4] text-[#04261C] border border-[#DDE7E2] shadow-2xs flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-[#0A4D3C]"
              title="Perbarui Data"
              aria-label="Perbarui Data"
            >
              <RefreshCw className={`w-4 h-4 text-[#4A6359] ${isDataLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => showToast("Semua sistem escrow dan kliring tersinkronisasi.")}
              className="apple-press relative p-2 min-h-[40px] min-w-[40px] rounded-xl bg-white hover:bg-[#F2F7F4] text-[#04261C] border border-[#DDE7E2] shadow-2xs flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-[#0A4D3C]"
              title="Notifikasi"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4 text-[#4A6359]" />
              {pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#F95721] border-2 border-white" />
              )}
            </button>

            <button
              onClick={() => showToast("Jadwal: Sesi Subuh 04:30–08:00, Sesi Siang 11:00–13:00 WITA")}
              className="apple-press p-2 min-h-[40px] min-w-[40px] rounded-xl bg-white hover:bg-[#F2F7F4] text-[#04261C] border border-[#DDE7E2] shadow-2xs flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-[#0A4D3C]"
              title="Jadwal Operasional"
              aria-label="Jadwal Operasional"
            >
              <Calendar className="w-4 h-4 text-[#4A6359]" />
            </button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {dataError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-rose-700 font-medium">{dataError}</span>
            <button
              onClick={fetchDashboardData}
              className="apple-press text-rose-700 font-bold underline ml-2"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Main Responsive Grid Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================= */}
          {/* LEFT COLUMN: MAIN OPERATIONAL HUB (8 cols on desktop)    */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. HERO STOCK OVERVIEW */}
            <section
              aria-label="Ketersediaan Stok Ampas Tahu"
              className="rounded-2xl bg-[#0A4D3C] text-white p-6 sm:p-7 shadow-sm relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                {/* Text Content */}
                <div className="space-y-3 flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-100">
                    <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                    <span>
                      {stockData.activeBatchId
                        ? `Batch ${stockData.activeBatchId} • ${stockData.batchCount} batch aktif`
                        : "Memuat data batch..."}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                      Stok Ampas Tahu
                    </h2>
                    <p className="text-sm text-emerald-100/90 font-medium mt-1">
                      {stockData.totalCapacity > 0 ? (
                        <>
                          <span className="font-bold text-white text-base font-mono">{stockData.availableKg.toLocaleString("id-ID")}</span>{" "}
                          / {stockData.totalCapacity.toLocaleString("id-ID")} kg tersedia ({Math.ceil(stockData.availableKg / 50)} karung)
                        </>
                      ) : (
                        <span className="text-emerald-200/80">Belum ada batch aktif</span>
                      )}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <button
                      onClick={() => setIsCreateBatchOpen(true)}
                      className="apple-press inline-flex items-center gap-1.5 text-xs font-bold bg-[#34D399] text-[#04261C] hover:bg-[#2ecc90] px-3.5 py-2 rounded-xl transition-all shadow-xs"
                      title="Tambah pasokan batch ampas tahu baru ke radar"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Pasok Batch Baru</span>
                    </button>

                    <button
                      onClick={() => setIsAdjustStockOpen(true)}
                      className="apple-press inline-flex items-center gap-1.5 text-xs font-bold bg-white text-[#0A4D3C] hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all shadow-xs"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Ubah Stok</span>
                    </button>

                    {stockData.avgPrice > 0 && (
                      <span className="text-xs text-emerald-100/90 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 font-mono">
                        Rp {stockData.avgPrice.toLocaleString("id-ID")} / kg
                      </span>
                    )}
                  </div>
                </div>

                {/* Circular Gauge + Quick Specs */}
                <div className="flex items-center gap-6 shrink-0">
                  <div
                    onClick={() => setIsAdjustStockOpen(true)}
                    className="cursor-pointer active:scale-95 transition-transform flex flex-col items-center"
                    title="Klik untuk mengubah kuota stok"
                  >
                    <CircularStockGauge percentage={stockPercentage} size={122} strokeWidth={9.5} />
                    <span className="mt-2 text-xs text-emerald-200/80 hover:text-white flex items-center gap-0.5 font-medium">
                      <span>Kapasitas</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Desktop Quick Indicator Tags from real batch data */}
                  <div className="hidden sm:grid grid-cols-1 gap-2 text-xs border-l border-white/15 pl-6">
                    <div className="bg-white/10 px-3 py-2 rounded-xl">
                      <span className="text-emerald-200/80 block text-[11px] font-medium">Batch Aktif</span>
                      <span className="font-bold text-white font-mono text-sm">{stockData.batchCount}</span>
                    </div>
                    <div className="bg-white/10 px-3 py-2 rounded-xl">
                      <span className="text-emerald-200/80 block text-[11px] font-medium">Harga Rata²</span>
                      <span className="font-bold text-white font-mono text-sm">
                        {stockData.avgPrice > 0 ? `Rp ${stockData.avgPrice.toLocaleString("id-ID")}` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. REFINED OPERATIONAL STATUS */}
            <section
              aria-label="Status Kesiapan Operasional"
              className="bg-white border border-[#DDE7E2] rounded-2xl p-5 sm:p-6 shadow-[0_4px_16px_rgba(4,38,28,0.04)] space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EC]">
                <div>
                  <h3 className="text-base font-extrabold text-[#04261C] tracking-tight">
                    Status Operasional &amp; Mutu Batch
                  </h3>
                  <p className="text-xs text-[#4A6359] mt-0.5">
                    Pilih status untuk disiarkan ke radar pencarian peternak
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#0A4D3C]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                  Live Sync
                </span>
              </div>

              {/* Responsive Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {OPERATIONAL_STATUSES.map((st) => {
                  const isActive = activeStatusId === st.id;
                  const Icon = st.icon;
                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        setActiveStatusId(st.id);
                        showToast(`Status disiarkan: ${st.label}`);
                      }}
                      className={`apple-press text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                        isActive
                          ? "bg-[#0A4D3C] text-white border-[#0A4D3C] shadow-xs"
                          : "bg-[#F7FAF8] hover:bg-[#F0F5F2] text-[#04261C] border-[#DDE7E2]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isActive ? "bg-white/20 text-white" : `${st.iconBg} ${st.iconColor}`
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-white text-[#0A4D3C] border border-[#DDE7E2]"
                          }`}
                        >
                          {st.badge}
                        </span>
                      </div>

                      <div>
                        <p className={`text-xs font-bold leading-tight ${isActive ? "text-white" : "text-[#04261C]"}`}>
                          {st.label}
                        </p>
                        <p className={`text-[11px] font-mono mt-0.5 ${isActive ? "text-emerald-100" : "text-[#4A6359]"}`}>
                          {st.spec}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Status Broadcast Note */}
              {OPERATIONAL_STATUSES.find((s) => s.id === activeStatusId) && (
                <div className="pt-2 flex items-center justify-between text-xs border-t border-[#E8F0EC]">
                  <span className="text-[#4A6359] truncate pr-2">
                    {OPERATIONAL_STATUSES.find((s) => s.id === activeStatusId)?.desc}
                  </span>
                  <span className="text-[#0A4D3C] font-bold shrink-0 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Siap di Radar
                  </span>
                </div>
              )}
            </section>

            {/* 3. LIVE TRANSACTIONS & ESCROW CLEARING TABLE */}
            <section
              aria-label="Transaksi Penjualan Terbaru"
              className="bg-white border border-[#DDE7E2] rounded-2xl shadow-[0_4px_16px_rgba(4,38,28,0.04)] overflow-hidden"
            >
              {/* Header with Filter Tabs */}
              <div className="px-5 py-4 border-b border-[#E8F0EC] bg-[#F7FAF8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#F2F7F4] border border-[#DDE7E2] flex items-center justify-center text-[#0A4D3C]">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#04261C] tracking-tight leading-none">
                      Transaksi &amp; Pesanan
                    </h3>
                    <p className="text-xs text-[#4A6359] mt-1 font-medium">
                      {transactions.length > 0
                        ? `${transactions.length} transaksi tercatat • ${pendingCount} perlu aksi`
                        : "Belum ada transaksi tercatat"
                      }
                    </p>
                  </div>
                </div>

                {/* Filter Tabs */}
                {transactions.length > 0 && (
                  <div className="flex items-center gap-1 bg-[#E8F0EC] p-1 rounded-xl self-start sm:self-auto">
                    <button
                      onClick={() => setTxFilter("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        txFilter === "all"
                          ? "bg-white text-[#0A4D3C] shadow-2xs"
                          : "text-[#4A6359] hover:text-[#04261C]"
                      }`}
                    >
                      Semua ({transactions.length})
                    </button>
                    <button
                      onClick={() => setTxFilter("pending")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        txFilter === "pending"
                          ? "bg-white text-[#0A4D3C] shadow-2xs"
                          : "text-[#4A6359] hover:text-[#04261C]"
                      }`}
                    >
                      Perlu Aksi {pendingCount > 0 && `(${pendingCount})`}
                    </button>
                    <button
                      onClick={() => setTxFilter("completed")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        txFilter === "completed"
                          ? "bg-white text-[#0A4D3C] shadow-2xs"
                          : "text-[#4A6359] hover:text-[#04261C]"
                      }`}
                    >
                      Tuntas
                    </button>
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F2F7F4] text-[#4A6359] font-bold uppercase tracking-wider border-b border-[#E8F0EC]">
                    <tr>
                      <th className="py-3 px-5">ID &amp; Waktu</th>
                      <th className="py-3 px-4">Batch</th>
                      <th className="py-3 px-4">Volume</th>
                      <th className="py-3 px-4">Nilai</th>
                      <th className="py-3 px-4">Status Escrow</th>
                      <th className="py-3 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8F0EC]">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <PackageOpen className="w-8 h-8 text-[#4A6359] opacity-40" />
                            <span className="text-[#4A6359] text-sm">
                              {transactions.length === 0
                                ? "Belum ada transaksi. Peternak dapat memesan dari halaman peta."
                                : "Tidak ada transaksi pada filter ini."}
                            </span>
                            {transactions.length === 0 && (
                              <Link
                                href="/"
                                className="text-xs font-bold text-[#0A4D3C] underline mt-1"
                              >
                                Buka Peta Belanja →
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => {
                        const statusInfo =
                          statusLabel[tx.status] ??
                          statusLabel["awaiting_handover_verification"];
                        const isAwaitingPin = tx.status === "awaiting_handover_verification";
                        const isCompleted = tx.status === "completed";

                        return (
                          <tr key={tx.id} className="hover:bg-[#F9FBFA] transition-colors">
                            <td className="py-3.5 px-5 font-mono font-bold text-[#04261C]">
                              <div>#{tx.id.slice(0, 10).toUpperCase()}</div>
                              <span className="text-[11px] font-normal text-[#4A6359]">
                                {formatDate(tx.created_at)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-[#04261C]">
                              {tx.batch_id}
                            </td>
                            <td className="py-3.5 px-4 text-[#4A6359]">
                              <span className="font-bold text-[#04261C]">{tx.quantity_kg} kg</span>{" "}
                              ({Math.ceil(tx.quantity_kg / 50)} sak)
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-[#0A4D3C] text-sm">
                              {formatCurrency(tx.total_amount_idr)}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${statusInfo.cls}`}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: statusInfo.dot }}
                                />
                                {statusInfo.text}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              {isAwaitingPin ? (
                                <button
                                  onClick={() => {
                                    setVerifyingTx(tx);
                                    setPinInput("");
                                  }}
                                  className="apple-press inline-flex items-center gap-1 text-xs font-bold bg-[#0A4D3C] text-white hover:bg-[#063125] px-3 py-1.5 rounded-lg shadow-2xs"
                                >
                                  <KeyRound className="w-3 h-3" />
                                  <span>Verifikasi PIN</span>
                                </button>
                              ) : isCompleted ? (
                                <span className="text-[11px] text-[#0A4D3C] font-semibold inline-flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" />
                                  Tuntas
                                </span>
                              ) : (
                                <span className="text-[11px] text-[#4A6359] font-medium">
                                  Escrow Aktif
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Feed View */}
              <div className="md:hidden divide-y divide-[#E8F0EC]">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-10 px-4 space-y-2">
                    <PackageOpen className="w-8 h-8 text-[#4A6359] opacity-40 mx-auto" />
                    <p className="text-xs text-[#4A6359]">
                      {transactions.length === 0
                        ? "Belum ada transaksi tercatat."
                        : "Tidak ada transaksi pada filter ini."}
                    </p>
                    {transactions.length === 0 && (
                      <Link href="/" className="text-xs font-bold text-[#0A4D3C] underline">
                        Buka Peta Belanja →
                      </Link>
                    )}
                  </div>
                ) : (
                  filteredTransactions.map((tx) => {
                    const statusInfo =
                      statusLabel[tx.status] ??
                      statusLabel["awaiting_handover_verification"];
                    const isAwaitingPin = tx.status === "awaiting_handover_verification";

                    return (
                      <div key={tx.id} className="p-4 space-y-2 hover:bg-[#F9FBFA]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#04261C]">
                            #{tx.id.slice(0, 10).toUpperCase()}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${statusInfo.cls}`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: statusInfo.dot }}
                            />
                            {statusInfo.text}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-[#04261C]">
                              Batch: {tx.batch_id}
                            </p>
                            <p className="text-[11px] text-[#4A6359]">
                              {tx.quantity_kg} kg ({Math.ceil(tx.quantity_kg / 50)} sak) • {formatDate(tx.created_at)}
                            </p>
                          </div>
                          <span className="text-sm font-black font-mono text-[#0A4D3C]">
                            {formatCurrency(tx.total_amount_idr)}
                          </span>
                        </div>

                        {isAwaitingPin && (
                          <div className="pt-1">
                            <button
                              onClick={() => {
                                setVerifyingTx(tx);
                                setPinInput("");
                              }}
                              className="apple-press w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-[#0A4D3C] text-white hover:bg-[#063125] py-2 rounded-xl"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Verifikasi PIN Serah Terima</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: FINANCIAL & ANALYTICS SIDEBAR (4 cols)     */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. DOMPET & PENDAPATAN ESCROW */}
            <section
              aria-label="Pendapatan dari Penjualan"
              className="bg-white border border-[#DDE7E2] rounded-2xl p-5 shadow-[0_4px_16px_rgba(4,38,28,0.04)] space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EC]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F2F7F4] border border-[#DDE7E2] flex items-center justify-center text-[#0A4D3C]">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#04261C] tracking-tight">
                      Dompet Kliring Escrow
                    </h3>
                    <p className="text-[11px] text-[#4A6359]">
                      {transactions.length > 0
                        ? `Dari ${revenueStats.totalKg.toLocaleString("id-ID")} kg terdistribusi`
                        : "Menunggu transaksi pertama"}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#0A4D3C] bg-[#F2F7F4] border border-[#DDE7E2] px-2 py-0.5 rounded-lg">
                  Real-time
                </span>
              </div>

              {/* Total Revenue Highlight */}
              <div>
                <span className="text-[11px] font-semibold text-[#4A6359] block mb-0.5">
                  Total Pendapatan Akumulatif
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#04261C] tracking-tight font-mono">
                  {revenueStats.totalRevenue > 0 ? formatCurrency(revenueStats.totalRevenue) : "Rp 0"}
                </span>
                {revenueStats.totalSacks > 0 && (
                  <p className="text-xs text-[#4A6359] mt-0.5">
                    {revenueStats.totalSacks} sak ({revenueStats.totalKg.toLocaleString("id-ID")} kg)
                  </p>
                )}
              </div>

              {/* Dual Breakdown: Escrow & Settled */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#E8F0EC]">
                  <div className="flex items-center justify-between text-[#4A6359] mb-1">
                    <span className="text-[11px] font-semibold">Di Escrow</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0A4D3C]" />
                  </div>
                  <div className="text-sm font-bold font-mono text-[#0A4D3C]">
                    {formatCurrency(revenueStats.escrowHeldAmount)}
                  </div>
                  <span className="text-[10px] text-[#4A6359] block mt-0.5">
                    Menunggu PIN
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#E8F0EC]">
                  <div className="flex items-center justify-between text-[#4A6359] mb-1">
                    <span className="text-[11px] font-semibold">Telah Cair</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  </div>
                  <div className="text-sm font-bold font-mono text-[#04261C]">
                    {formatCurrency(revenueStats.settledAmount)}
                  </div>
                  <span className="text-[10px] text-[#4A6359] block mt-0.5">
                    Siap ditarik
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={revenueStats.settledAmount === 0}
                className="apple-press w-full bg-[#0A4D3C] hover:bg-[#063125] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs inline-flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#0A4D3C]"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Tarik Saldo ke Rekening</span>
              </button>

              {/* Bank Destination Card */}
              <div className="p-2.5 rounded-xl bg-[#F2F7F4] border border-[#DDE7E2] flex items-center gap-2.5 text-xs">
                <Building className="w-4 h-4 text-[#0A4D3C] shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-[#04261C] truncate">BCA • 8410293810</p>
                  <p className="text-[11px] text-[#4A6359] truncate">
                    {displayName}
                  </p>
                </div>
              </div>
            </section>

            {/* 2. KUALITAS & MUTU — from real batch data */}
            <section
              aria-label="Kualitas Batch Saat Ini"
              className="bg-white border border-[#DDE7E2] rounded-2xl p-5 shadow-[0_4px_16px_rgba(4,38,28,0.04)] space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#E8F0EC]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#F2F7F4] border border-[#DDE7E2] flex items-center justify-center text-[#0A4D3C]">
                    <Thermometer className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-extrabold text-[#04261C] tracking-tight">
                    Kualitas Ampas Hari Ini
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[#0A4D3C] font-bold">
                  {batches.length > 0 ? `${batches.length} Batch` : "—"}
                </span>
              </div>

              {/* 3 Metric Grid */}
              <div className="grid grid-cols-3 divide-x divide-[#E8F0EC] bg-[#F7FAF8] rounded-xl py-2.5 text-center">
                <div className="px-1">
                  <span className="text-[10px] font-semibold text-[#4A6359] block">Suhu Pres</span>
                  <span className="text-sm font-black text-[#04261C] font-mono">38°C</span>
                </div>
                <div className="px-1">
                  <span className="text-[10px] font-semibold text-[#4A6359] block">Protein</span>
                  <span className="text-sm font-black text-[#0A4D3C] font-mono">26.4%</span>
                </div>
                <div className="px-1">
                  <span className="text-[10px] font-semibold text-[#4A6359] block">Kadar Air</span>
                  <span className="text-sm font-black text-[#04261C] font-mono">81%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#4A6359] pt-1">
                <span>Rata-rata kliring:</span>
                <span className="font-bold text-[#04261C] font-mono">
                  {revenueStats.averagePricePerKg > 0
                    ? `Rp ${revenueStats.averagePricePerKg.toLocaleString("id-ID")} / kg`
                    : stockData.avgPrice > 0
                      ? `Rp ${stockData.avgPrice.toLocaleString("id-ID")} / kg`
                      : "—"}
                </span>
              </div>
            </section>

            {/* 3. DAMPAK LINGKUNGAN (SDG) */}
            <section
              aria-label="Dampak Lingkungan Sirkular"
              className="bg-white border border-[#DDE7E2] rounded-2xl p-5 shadow-[0_4px_16px_rgba(4,38,28,0.04)] space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#E8F0EC]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#F2F7F4] border border-[#DDE7E2] flex items-center justify-center text-[#0A4D3C]">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-extrabold text-[#04261C] tracking-tight">
                    Dampak Sirkular (SDG)
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-[#0A4D3C] bg-emerald-50 px-2 py-0.5 rounded">
                  Bali Bersih
                </span>
              </div>

              {/* 2 Column Stat */}
              <div className="grid grid-cols-2 divide-x divide-[#E8F0EC] bg-[#F7FAF8] rounded-xl py-2.5 text-center">
                <div className="px-2">
                  <span className="text-[10px] font-semibold text-[#4A6359] block">CO2e Dicegah</span>
                  <span className="text-sm font-black text-[#0A4D3C] font-mono">
                    {impactCo2e}
                  </span>
                </div>
                <div className="px-2">
                  <span className="text-[10px] font-semibold text-[#4A6359] block">Limbah Dialihkan</span>
                  <span className="text-sm font-black text-[#04261C] font-mono">
                    {impactWaste}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#4A6359] leading-tight">
                Proteksi Daerah Aliran Sungai (DAS) Bali &amp; substitusi konsentrat impor.
              </p>
            </section>

            {/* 4. JADWAL PENGAMBILAN & KURIR */}
            <div className="p-4 rounded-2xl bg-[#F2F7F4] border border-[#DDE7E2] space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-[#04261C]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0A4D3C]" />
                  <span>Jadwal Pres &amp; Ambil</span>
                </div>
                <span className="text-[11px] text-[#0A4D3C]">Aktif</span>
              </div>
              <div className="space-y-1 text-[#4A6359] text-[11px]">
                <div className="flex justify-between">
                  <span>Sesi Subuh:</span>
                  <span className="font-mono font-semibold text-[#04261C]">04:30 - 08:00 WITA</span>
                </div>
                <div className="flex justify-between">
                  <span>Sesi Siang:</span>
                  <span className="font-mono font-semibold text-[#04261C]">11:00 - 13:00 WITA</span>
                </div>
                <div className="flex justify-between">
                  <span>Batch Live:</span>
                  <span className="font-semibold text-[#0A4D3C]">{stockData.batchCount} aktif</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL: TERBITKAN BATCH PASOKAN BARU                     */}
      {/* ========================================================= */}
      {isCreateBatchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-batch-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DDE7E2] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0A4D3C] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="create-batch-title" className="font-extrabold text-base text-[#04261C]">
                    Terbitkan Batch Pasokan Baru
                  </h3>
                  <p className="text-[11px] text-[#4A6359]">
                    Pasokan akan langsung muncul di radar peternak
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateBatchOpen(false)}
                className="apple-press p-1.5 rounded-full bg-[#F2F7F4] text-[#4A6359] hover:text-[#04261C]"
                aria-label="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#04261C] block">
                  Kuantitas Ampas Tahu (kg)
                </label>
                <input
                  type="number"
                  min="25"
                  step="25"
                  required
                  value={batchQuantityKg}
                  onChange={(e) => setBatchQuantityKg(e.target.value)}
                  placeholder="500"
                  className="w-full text-base font-mono font-bold py-2.5 px-3 rounded-xl border border-[#DDE7E2] focus:outline-none focus:ring-2 focus:ring-[#0A4D3C]"
                />
                <span className="text-[11px] text-[#4A6359]">
                  Setara ± {Math.ceil(Number(batchQuantityKg || 0) / 50)} karung (bobot 50 kg per karung)
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#04261C] block">
                  Harga per Kilogram (Rp)
                </label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={batchPricePerKg}
                  onChange={(e) => setBatchPricePerKg(e.target.value)}
                  placeholder="500"
                  className="w-full text-base font-mono font-bold py-2.5 px-3 rounded-xl border border-[#DDE7E2] focus:outline-none focus:ring-2 focus:ring-[#0A4D3C]"
                />
                <span className="text-[11px] text-[#4A6359]">
                  Setara Rp {(Number(batchPricePerKg || 0) * 50).toLocaleString("id-ID")} / karung
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#04261C] block">
                  Catatan Kesegaran & Mutu
                </label>
                <textarea
                  rows={2}
                  value={batchDescription}
                  onChange={(e) => setBatchDescription(e.target.value)}
                  placeholder="Contoh: Ampas segar rebusan pagi, hangat dan bersih"
                  className="w-full text-xs py-2 px-3 rounded-xl border border-[#DDE7E2] focus:outline-none focus:ring-2 focus:ring-[#0A4D3C]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateBatchOpen(false)}
                  className="apple-press px-4 py-2.5 rounded-xl border border-[#DDE7E2] text-xs font-bold text-[#4A6359] hover:bg-[#F2F7F4]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBatch}
                  className="apple-press px-5 py-2.5 rounded-xl bg-[#0A4D3C] hover:bg-[#063125] text-white text-xs font-bold shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSubmittingBatch ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menerbitkan...</span>
                    </>
                  ) : (
                    <span>Terbitkan ke Radar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: UBAH STOK AMPAS TAHU                               */}
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
                {stockData.availableKg} <span className="text-base font-normal text-[#4A6359]">kg</span>
              </div>
              <p className="text-xs text-[#4A6359]">
                {stockPercentage}% dari kapasitas {stockData.totalCapacity.toLocaleString("id-ID")} kg ({Math.ceil(stockData.availableKg / 50)} karung)
              </p>
            </div>

            <div className="space-y-3">
              <label htmlFor="stock-range-input" className="text-xs font-semibold text-[#4A6359] block">
                Sesuaikan Persentase Ketersediaan:
              </label>
              <input
                id="stock-range-input"
                type="range"
                min="0"
                max={stockData.totalCapacity || 500}
                step="25"
                value={stockData.availableKg}
                onChange={(e) => setStockOverride(Number(e.target.value))}
                className="w-full accent-[#0A4D3C] cursor-pointer"
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                {[25, 50, 75, 90, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setStockOverride(Math.round((pct / 100) * (stockData.totalCapacity || 500)))}
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
                  showToast(`Stok berhasil diperbarui: ${stockData.availableKg} kg (${stockPercentage}%)`);
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
      {/* MODAL: TARIK SALDO PENJUALAN                              */}
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
                  <p className="text-[#4A6359] truncate">{displayName}</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
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

      {/* ========================================================= */}
      {/* MODAL: VERIFIKASI PIN SERAH TERIMA ESCROW                 */}
      {/* ========================================================= */}
      {verifyingTx && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="verify-pin-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#DDE7E2] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0A4D3C] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 id="verify-pin-title" className="font-extrabold text-base text-[#04261C]">
                  Verifikasi PIN Serah Terima
                </h3>
              </div>
              <button
                onClick={() => setVerifyingTx(null)}
                className="apple-press p-1.5 rounded-full bg-[#F2F7F4] text-[#4A6359] hover:text-[#04261C]"
                aria-label="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#F7FAF8] rounded-xl p-3 border border-[#E8F0EC] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#4A6359]">No. Pesanan:</span>
                <span className="font-mono font-bold text-[#04261C]">#{verifyingTx.id.slice(0, 10)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A6359]">Batch:</span>
                <span className="font-bold text-[#04261C]">{verifyingTx.batch_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A6359]">Volume:</span>
                <span className="font-bold text-[#04261C]">{verifyingTx.quantity_kg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A6359]">Pencairan Escrow:</span>
                <span className="font-mono font-bold text-[#0A4D3C]">
                  {formatCurrency(verifyingTx.total_amount_idr)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="handover-pin" className="text-xs font-semibold text-[#4A6359] block">
                Masukkan 6-Digit PIN dari Pembeli:
              </label>
              <input
                id="handover-pin"
                type="text"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center text-2xl font-mono font-bold tracking-widest py-2.5 px-4 rounded-xl border border-[#DDE7E2] focus:outline-none focus:ring-2 focus:ring-[#0A4D3C]"
              />
              <p className="text-[11px] text-[#4A6359] text-center">
                Demo quick PIN: ketik <code className="font-mono font-bold">123456</code>
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleVerifyPinSubmit}
                disabled={pinInput.length !== 6}
                className="apple-press w-full py-3 bg-[#0A4D3C] hover:bg-[#063125] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Verifikasi &amp; Cairkan Escrow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] text-[#04261C] flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[#4A6359]">
          <span className="w-4 h-4 border-2 border-[#0A4D3C]/30 border-t-[#0A4D3C] rounded-full animate-spin" />
          <span>Memuat dashboard...</span>
        </div>
      </div>
    );
  }

  return <DashboardInner />;
}
