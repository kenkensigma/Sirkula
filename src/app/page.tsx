"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { FloatingAppbar } from "@/components/FloatingAppbar";
import { FactoryMap } from "@/components/Map";
import { FactoryCard } from "@/components/FactoryCard";
import { FactoryDetailPanel } from "@/components/FactoryDetailPanel";
import { BottomAppbar, NavTab } from "@/components/BottomAppbar";
import { OrderDrawer, ActiveOrder } from "@/components/OrderDrawer";
import { EscrowVerificationModal } from "@/components/EscrowVerificationModal";
import { SDGImpactModal } from "@/components/SDGImpactModal";
import { 
  MOCK_FACTORIES, 
  FactoryLocation, 
  USER_FARMER_LOCATION 
} from "@/data/mockFactories";
import { calculateHaversineDistance } from "@/lib/geo/haversine";
import { useAuth } from "@/contexts/AuthContext";
import { AuthRequiredModal } from "@/components/auth/AuthRequiredModal";
import type { BatchItemResponse, TransactionItemResponse } from "@/types/api";
import { 
  ShieldCheck, 
  X, 
  Leaf,
  RefreshCw,
  Loader2,
} from "lucide-react";

export default function Home() {
  const [factories, setFactories] = useState<FactoryLocation[]>(MOCK_FACTORIES);
  const [isLoadingBatches, setIsLoadingBatches] = useState<boolean>(false);
  const [selectedFactory, setSelectedFactory] = useState<FactoryLocation | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "near" | "green" | "yellow">("all");
  const [isRadiusCircleVisible, setIsRadiusCircleVisible] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTab>("map");
  
  // State for the DOM panel, toggled from the Floating Appbar
  const [isFactoryListOpen, setIsFactoryListOpen] = useState<boolean>(false);

  // Order & Escrow state
  const [orderModalFactory, setOrderModalFactory] = useState<FactoryLocation | null>(null);
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [activeOrderForModal, setActiveOrderForModal] = useState<ActiveOrder | null>(null);
  const [isSDGModalOpen, setIsSDGModalOpen] = useState<boolean>(false);

  // Live impact metrics from backend GET /api/v1/impact/summary
  const [liveImpact, setLiveImpact] = useState<{
    divertedKg: number;
    co2eAvoided: number;
    feedSavingsIdr: number;
  }>({
    divertedKg: 12840,
    co2eAvoided: 22290.2,
    feedSavingsIdr: 10914000,
  });

  // Authentication gate for transactions & sensitive actions
  const { requireAuth, isAuthModalOpen, closeAuthModal, authModalActionDescription } = useAuth();

  // 1. Fetch live batches from backend GET /api/v1/batches
  const fetchBatches = useCallback(async () => {
    setIsLoadingBatches(true);
    try {
      const lat = USER_FARMER_LOCATION.latitude;
      const lng = USER_FARMER_LOCATION.longitude;
      const res = await fetch(`/api/v1/batches?lat=${lat}&lng=${lng}&radius_km=15&status=available`);

      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: FactoryLocation[] = json.data.map((b: BatchItemResponse) => {
            const matchedMock = MOCK_FACTORIES.find(
              (m) =>
                m.name.toLowerCase() === b.factory_name.toLowerCase() ||
                m.id === b.factory_id ||
                m.activeBatch.id === b.id
            );

            const hoursAgo = Math.max(
              0,
              Math.round(((Date.now() - new Date(b.prepared_at).getTime()) / (3600 * 1000)) * 10) / 10
            );

            const availableSacks = Math.max(1, Math.round(b.available_kg / 50));
            const totalSacks = Math.max(availableSacks, Math.round(b.quantity_kg / 50));

            return {
              id: b.factory_id || matchedMock?.id || `fac-${b.id}`,
              name: b.factory_name,
              district: matchedMock?.district || "Denpasar",
              address: matchedMock?.address || "Jl. Raya Denpasar, Bali",
              latitude: b.latitude,
              longitude: b.longitude,
              verified: matchedMock?.verified ?? true,
              rating: matchedMock?.rating ?? 4.9,
              reviewsCount: matchedMock?.reviewsCount ?? 88,
              phone: matchedMock?.phone ?? "0812-3456-7890",
              operatingHours: matchedMock?.operatingHours ?? "04:30 - 13:00 WITA",
              sellerPhoto: matchedMock?.sellerPhoto,
              activeBatch: {
                id: b.id,
                itemName: b.description || matchedMock?.activeBatch.itemName || "Ampas Tahu Segar Rebusan 1",
                itemType: matchedMock?.activeBatch.itemType || "ampas_tahu_putih",
                itemSubtitle: matchedMock?.activeBatch.itemSubtitle || "Ampas kedelai segar kadar air sedang",
                preparedAtHoursAgo: hoursAgo,
                totalSacks,
                availableSacks,
                weightPerSackKg: 50,
                pricePerSackIdr: b.price_per_kg_idr * 50,
                pricePerKgIdr: b.price_per_kg_idr,
                freshnessZone: b.freshness_zone === "expired" ? "expired" : b.freshness_zone === "yellow" ? "yellow" : "green",
                qualityNotes: matchedMock?.activeBatch.qualityNotes || "Ampas bersih, harum khas kedelai, siap antar.",
                proteinContent: matchedMock?.activeBatch.proteinContent || "24.8% DM",
                moistureContent: matchedMock?.activeBatch.moistureContent || "78% (Siap Pakan)",
                temperatureStatus: matchedMock?.activeBatch.temperatureStatus || "Hangat Pres Subuh",
              },
            };
          });

          setFactories(mapped);
        }
      }
    } catch (err) {
      console.warn("Backend batch connection note (using fallback):", err);
    } finally {
      setIsLoadingBatches(false);
    }
  }, []);

  // 2. Fetch live transactions from backend GET /api/v1/transactions
  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch("/api/v1/transactions?limit=20&page=1");
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          const mappedOrders: ActiveOrder[] = json.data.map((tx: TransactionItemResponse) => {
            const rawId = tx.id;
            const displayId = rawId.startsWith("SRK-") ? rawId : `SRK-${rawId.slice(0, 8).toUpperCase()}`;
            const sacks = Math.max(1, Math.round(tx.quantity_kg / 50));
            const isSettled = tx.status === "completed";

            return {
              id: displayId,
              rawTransactionId: rawId,
              factoryName: "Pabrik Tahu Sumber Barokah",
              itemName: "Ampas Tahu Segar Rebusan 1",
              sacksCount: sacks,
              totalKg: tx.quantity_kg,
              pricePerSack: (tx.unit_price_idr || 500) * 50,
              deliveryMethod: "delivery",
              shippingFee: 15000,
              platformFee: 1000,
              totalAmount: tx.total_amount_idr,
              qrCodeToken: `SIRKULA-VERIFY-${rawId}`,
              pin6Digit: "847291",
              status: isSettled ? "DELIVERED_SETTLED" : "FUNDS_LOCKED",
              createdAt: new Date(tx.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
              impactKg: tx.quantity_kg,
              avoidedCo2e: Math.round(tx.quantity_kg * 1.736 * 10) / 10,
              savingsIdr: tx.quantity_kg * 850,
            };
          });

          setOrders((prev) => {
            const combined = [...mappedOrders];
            prev.forEach((localOrd) => {
              if (!combined.some((c) => c.id === localOrd.id || c.rawTransactionId === localOrd.rawTransactionId)) {
                combined.unshift(localOrd);
              }
            });
            return combined;
          });
        }
      }
    } catch (err) {
      console.warn("Backend transactions connection note:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // 3. Fetch live impact from backend GET /api/v1/impact/summary
  const fetchLiveImpact = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/impact/summary");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setLiveImpact({
            divertedKg: json.data.diverted_from_waste_kg || 12840,
            co2eAvoided: json.data.estimated_co2e_avoided_kg || 22290.2,
            feedSavingsIdr: json.data.estimated_feed_savings_idr || 10914000,
          });
        }
      }
    } catch (err) {
      console.warn("Backend impact summary connection note:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchBatches();
    fetchOrders();
    fetchLiveImpact();
  }, [fetchBatches, fetchOrders, fetchLiveImpact]);

  // Tab change re-sync
  useEffect(() => {
    if (activeTab === "escrow") {
      fetchOrders();
    } else if (activeTab === "sdg") {
      fetchLiveImpact();
    }
  }, [activeTab, fetchOrders, fetchLiveImpact]);

  const handleOrderFactory = (fac: FactoryLocation) => {
    if (!requireAuth("memesan ampas tahu dan mengunci dana di Rekening Bersama Escrow")) {
      return;
    }
    setOrderModalFactory(fac);
  };

  // Filter factories based on selected filter
  const filteredFactories = useMemo(() => {
    return factories.filter((factory) => {
      const distance = calculateHaversineDistance(
        { latitude: USER_FARMER_LOCATION.latitude, longitude: USER_FARMER_LOCATION.longitude },
        { latitude: factory.latitude, longitude: factory.longitude }
      );

      // Must be within 15 km radius as required by SLA
      if (distance > 15) return false;

      if (activeFilter === "green") {
        return factory.activeBatch.freshnessZone === "green";
      }
      if (activeFilter === "yellow") {
        return factory.activeBatch.freshnessZone === "yellow";
      }
      if (activeFilter === "near") {
        return distance <= 5;
      }
      return true;
    });
  }, [factories, activeFilter]);

  // Aggregate statistics
  const totalKgAvailable = useMemo(() => {
    return filteredFactories.reduce(
      (acc, f) => acc + f.activeBatch.availableSacks * f.activeBatch.weightPerSackKg,
      0
    );
  }, [filteredFactories]);

  const handleOrderSuccess = (newOrder: ActiveOrder) => {
    // 1. Reduce available sacks on the ordered factory (Kunci Stok Otomatis)
    setFactories((prevFactories) =>
      prevFactories.map((fac) => {
        if (fac.name === newOrder.factoryName) {
          const newAvailable = Math.max(0, fac.activeBatch.availableSacks - newOrder.sacksCount);
          return {
            ...fac,
            activeBatch: {
              ...fac.activeBatch,
              availableSacks: newAvailable,
            },
          };
        }
        return fac;
      })
    );

    // 2. Add to active orders
    setOrders((prev) => [newOrder, ...prev]);

    // 3. Close order drawer & open verification modal
    setOrderModalFactory(null);
    setActiveOrderForModal(newOrder);

    // 4. Re-sync with backend
    fetchOrders();
    fetchBatches();
    fetchLiveImpact();
  };

  const handleSimulateDeliveryVerification = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: "DELIVERED_SETTLED" } : ord))
    );
    if (activeOrderForModal && activeOrderForModal.id === orderId) {
      setActiveOrderForModal((prev) => (prev ? { ...prev, status: "DELIVERED_SETTLED" } : null));
    }
    // Re-sync with backend transactions & impact
    fetchOrders();
    fetchLiveImpact();
  };

  return (
    <div className="h-screen w-screen bg-white text-[#04261C] flex flex-col relative overflow-hidden select-none">
      {/* Apple Dynamic Island Floating Appbar */}
      <FloatingAppbar
        isFactoryListOpen={isFactoryListOpen}
        onToggleFactoryList={() => setIsFactoryListOpen((prev) => !prev)}
        factoriesCount={filteredFactories.length}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onOpenSDGModal={() => setIsSDGModalOpen(true)}
        isRadiusCircleVisible={isRadiusCircleVisible}
        onToggleRadiusCircle={() => setIsRadiusCircleVisible((prev) => !prev)}
        totalKgAvailable={totalKgAvailable}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ordersCount={orders.filter((o) => o.status !== "DELIVERED_SETTLED").length}
      />

      {/* Tab: Radar Peta */}
      {activeTab === "map" && (
        <>
          <main className="relative flex-1 w-full h-full overflow-hidden">
            <div className="absolute inset-0 w-full h-full z-0">
              <FactoryMap
                factories={filteredFactories}
                selectedFactory={selectedFactory}
                onSelectFactory={(fac) => {
                  setSelectedFactory(fac);
                  setIsFactoryListOpen(true);
                }}
                onOrderFactory={handleOrderFactory}
                isRadiusCircleVisible={isRadiusCircleVisible}
              />
            </div>

            {/* Apple Maps Style GPS Re-Center Floating Button */}
            <button
              onClick={() => setSelectedFactory(null)}
              className="apple-press absolute bottom-20 right-4 z-20 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md border border-[#DDE7E2] flex items-center justify-center text-[#04261C] shadow-[0_4px_16px_rgba(4,38,28,0.1)] hover:bg-[#F2F7F4] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
              title="Pusatkan Radar ke GPS"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#0A4D3C]" />
            </button>
          </main>

          {/* Bottom Sheet List Panel */}
          {isFactoryListOpen && (
            <aside
              className="absolute left-0 right-0 sm:left-4 sm:right-auto sm:top-20 sm:bottom-20 sm:w-96 bottom-16 z-30 bg-white/95 backdrop-blur-xl border border-[#DDE7E2] rounded-t-[32px] sm:rounded-[32px] shadow-[0_8px_32px_rgba(4,38,28,0.12)] flex flex-col max-h-[65vh] sm:max-h-none overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-left duration-200"
              aria-label="Daftar Pabrik Tahu Terdekat"
            >
              <div className="p-4 border-b border-[#DDE7E2] flex items-center justify-between shrink-0 bg-white/90">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-[#04261C] text-sm">
                    Pabrik Terdekat ({filteredFactories.length})
                  </h3>
                  {isLoadingBatches && (
                    <Loader2 className="w-3.5 h-3.5 text-[#0A4D3C] animate-spin" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={fetchBatches}
                    className="p-1.5 rounded-full text-[#4A6359] hover:bg-[#F4F8F5] transition-colors"
                    title="Segarkan data batch"
                    aria-label="Segarkan data"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBatches ? "animate-spin text-[#0A4D3C]" : ""}`} />
                  </button>
                  <button
                    onClick={() => setIsFactoryListOpen(false)}
                    className="apple-press p-1.5 rounded-full text-[#4A6359] hover:bg-[#F4F8F5] transition-colors"
                    aria-label="Tutup panel daftar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-2.5 overflow-y-auto flex-1 bg-[#F4F8F5]/60">
                {filteredFactories.map((fac) => (
                  <FactoryCard
                    key={fac.id}
                    factory={fac}
                    isSelected={selectedFactory?.id === fac.id}
                    onSelect={() => setSelectedFactory(fac)}
                    onOrder={handleOrderFactory}
                  />
                ))}
              </div>
            </aside>
          )}

          {/* Factory Detail Drawer */}
          {selectedFactory && (
            <FactoryDetailPanel
              factory={selectedFactory}
              onBack={() => setSelectedFactory(null)}
              onClose={() => setSelectedFactory(null)}
              onOrder={handleOrderFactory}
            />
          )}
        </>
      )}

      {/* Tab: Katalog */}
      {activeTab === "catalog" && (
        <main className="flex-1 overflow-y-auto pt-24 pb-20 px-4 sm:px-6 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-xs font-semibold text-[#0A4D3C] bg-[#F2F7F4] border border-[#DDE7E2] px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                Listing Langsung Pabrik
              </span>
              <h2 className="text-2xl font-extrabold text-[#04261C] tracking-tight">
                Katalog Ampas Tahu Segar
              </h2>
            </div>
            <button
              onClick={fetchBatches}
              disabled={isLoadingBatches}
              className="apple-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#DDE7E2] text-xs font-bold text-[#04261C] hover:bg-[#F4F8F5] shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBatches ? "animate-spin text-[#0A4D3C]" : ""}`} />
              <span>Segarkan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredFactories.map((fac) => (
              <FactoryCard
                key={fac.id}
                factory={fac}
                isSelected={selectedFactory?.id === fac.id}
                onSelect={() => {
                  setSelectedFactory(fac);
                  setActiveTab("map");
                  setIsFactoryListOpen(true);
                }}
                onOrder={handleOrderFactory}
              />
            ))}
          </div>
        </main>
      )}

      {/* Tab: Escrow */}
      {activeTab === "escrow" && (
        <main className="flex-1 overflow-y-auto pt-24 pb-20 px-4 sm:px-6 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-xs font-semibold text-[#0A4D3C] bg-[#F2F7F4] border border-[#DDE7E2] px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                Rekening Bersama Escrow
              </span>
              <h2 className="text-2xl font-extrabold text-[#04261C] tracking-tight">
                Tiket &amp; Verifikasi Transaksi
              </h2>
              <p className="text-xs text-[#4A6359] mt-0.5">
                Tunjukkan QR Code atau 6 Digit PIN ke kurir saat ampas tiba segar
              </p>
            </div>
            <button
              onClick={fetchOrders}
              disabled={isLoadingOrders}
              className="apple-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#DDE7E2] text-xs font-bold text-[#04261C] hover:bg-[#F4F8F5] shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? "animate-spin text-[#0A4D3C]" : ""}`} />
              <span>Segarkan</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-[28px] border border-[#DDE7E2] bg-white space-y-3 shadow-2xs">
              <div className="w-14 h-14 rounded-full bg-[#F2F7F4] flex items-center justify-center mx-auto text-[#0A4D3C]">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-[#04261C] text-base">Belum Ada Transaksi Aktif</h3>
              <p className="text-xs text-[#4A6359] max-w-xs mx-auto leading-relaxed">
                Pilih pabrik tahu di radar peta atau katalog untuk mengunci stok ampas segar di Rekening Bersama Escrow.
              </p>
              <button
                onClick={() => setActiveTab("map")}
                className="apple-press inline-flex items-center gap-1.5 bg-[#0A4D3C] hover:bg-[#063125] text-white font-bold py-2.5 px-5 rounded-full text-xs shadow-xs min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
              >
                <span>Buka Radar Peta</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setActiveOrderForModal(ord)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveOrderForModal(ord); } }}
                  className="apple-press bg-white border border-[#DDE7E2] rounded-[24px] p-4 cursor-pointer hover:border-[#0A4D3C] shadow-2xs transition-all relative overflow-hidden group focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-[#4A6359]">
                      {ord.id}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        ord.status === "DELIVERED_SETTLED"
                          ? "text-[#4A6359] bg-[#E8F0EC]"
                          : "text-[#0A4D3C] bg-[#F2F7F4] border border-[#DDE7E2]"
                      }`}
                    >
                      {ord.status === "DELIVERED_SETTLED" ? "Tuntas Selesai" : "Dana Aman di Escrow"}
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-[#04261C] tracking-tight">
                    {ord.factoryName}
                  </h4>
                  <p className="text-xs text-[#4A6359] mt-0.5">
                    {ord.sacksCount} karung ({ord.totalKg} kg ampas), {ord.itemName}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#E8F0EC] text-xs">
                    <span className="text-[#4A6359] font-medium">Total Dana</span>
                    <span className="font-mono font-bold text-[#0A4D3C] text-sm">
                      Rp {ord.totalAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* Tab: SDG */}
      {activeTab === "sdg" && (
        <main className="flex-1 overflow-y-auto pt-24 pb-20 px-4 sm:px-6 max-w-2xl mx-auto w-full">
          <div className="text-center py-12 px-6 bg-white border border-[#DDE7E2] rounded-[32px] space-y-4 shadow-2xs">
            <span className="text-xs font-semibold text-[#0A4D3C] bg-[#F2F7F4] border border-[#DDE7E2] px-3 py-1 rounded-full inline-block">
              Dampak Lingkungan Real-Time
            </span>
            <h2 className="text-3xl font-extrabold text-[#04261C] tracking-tight">
              Sirkularitas Limbah Ampas Tahu
            </h2>
            <p className="text-xs text-[#4A6359] max-w-md mx-auto leading-relaxed">
              Mencegah fermentasi pembusukan ampas tahu di sungai Bali, menekan emisi metana 1.736 kg CO2e per kg ampas, dan memotong biaya pakan ternak rakyat.
            </p>

            {/* Quick Live Stats Pods */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-left pt-2">
              <div className="p-3.5 rounded-2xl bg-[#F4F8F5] border border-[#DDE7E2]">
                <span className="text-[11px] font-semibold text-[#4A6359] block">Limbah Terselamatkan</span>
                <span className="text-lg font-black text-[#04261C] font-mono mt-0.5 block">
                  {liveImpact.divertedKg.toLocaleString("id-ID")} kg
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F4F8F5] border border-[#DDE7E2]">
                <span className="text-[11px] font-semibold text-[#4A6359] block">Emisi Ditekan</span>
                <span className="text-lg font-black text-[#0A4D3C] font-mono mt-0.5 block">
                  {liveImpact.co2eAvoided.toLocaleString("id-ID")} kg
                </span>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={() => setIsSDGModalOpen(true)}
                className="apple-press bg-[#0A4D3C] hover:bg-[#063125] text-white font-bold py-3.5 px-6 rounded-full text-sm transition-all inline-flex items-center gap-2 shadow-xs min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
              >
                <Leaf className="w-4 h-4" />
                <span>Buka Detail Metrik Dampak SDG</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Apple iOS Tab Bar */}
      <BottomAppbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ordersCount={orders.filter((o) => o.status !== "DELIVERED_SETTLED").length}
      />

      {/* Modals */}
      <OrderDrawer
        factory={orderModalFactory}
        isOpen={!!orderModalFactory}
        onClose={() => setOrderModalFactory(null)}
        onOrderSuccess={handleOrderSuccess}
      />

      <EscrowVerificationModal
        order={activeOrderForModal}
        isOpen={!!activeOrderForModal}
        onClose={() => setActiveOrderForModal(null)}
        onSimulateDeliveryVerification={handleSimulateDeliveryVerification}
      />

      <SDGImpactModal
        isOpen={isSDGModalOpen}
        onClose={() => setIsSDGModalOpen(false)}
        additionalSavedKg={orders.reduce((sum, o) => sum + o.impactKg, 0)}
      />

      {/* Auth Protection Prompt Modal */}
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        actionDescription={authModalActionDescription}
      />
    </div>
  );
}
