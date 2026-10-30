"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  Navigation,
  Layers,
} from "lucide-react";

export default function Home() {
  const [factories, setFactories] = useState<FactoryLocation[]>(MOCK_FACTORIES);
  const [isLoadingBatches, setIsLoadingBatches] = useState<boolean>(false);
  const [selectedFactory, setSelectedFactory] = useState<FactoryLocation | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "near" | "green" | "yellow">("all");
  const [isRadiusCircleVisible, setIsRadiusCircleVisible] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTab>("map");
  
  // State for the DOM panel, toggled from the Floating Appbar
  const [isFactoryListOpen, setIsFactoryListOpen] = useState(false);
  const [shouldRenderPanel, setShouldRenderPanel] = useState(false);
  const isPanelClosingRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const openPanel = useCallback(() => {
    setShouldRenderPanel(true);
    isPanelClosingRef.current = false;
    setDragOffset(0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!isPanelClosingRef.current) {
          setIsFactoryListOpen(true);
        }
      });
    });
  }, []);

  const closePanel = useCallback(() => {
    isPanelClosingRef.current = true;
    setIsFactoryListOpen(false);
    setDragOffset(0);
  }, []);

  const handlePanelTransitionEnd = useCallback((e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName === "transform" && isPanelClosingRef.current) {
      setShouldRenderPanel(false);
      isPanelClosingRef.current = false;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isFactoryListOpen) return;
    touchStartYRef.current = e.touches[0].clientY;
  }, [isFactoryListOpen]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isFactoryListOpen || touchStartYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartYRef.current;
    if (delta > 0) {
      setDragOffset(delta);
    }
  }, [isFactoryListOpen]);

  const handleTouchEnd = useCallback(() => {
    if (!isFactoryListOpen) return;
    touchStartYRef.current = null;
    if (dragOffset > 100) {
      closePanel();
    } else {
      setDragOffset(0);
    }
  }, [isFactoryListOpen, dragOffset, closePanel]);

  // Location permission state
  const [isLocationGranted, setIsLocationGranted] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

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

  const effectiveUserLocation = isLocationGranted && userLocation
    ? userLocation
    : USER_FARMER_LOCATION;

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung lokasi.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setIsLocationGranted(true);
      },
      () => {
        setUserLocation(null);
        setIsLocationGranted(false);
      }
    );
  };

  const handleFilterChange = (filter: "all" | "near" | "green" | "yellow") => {
    if (filter === "near" && !isLocationGranted) {
      handleRequestLocation();
      return;
    }
    setActiveFilter(filter);
  };

  // 1. Fetch live batches from backend GET /api/v1/batches
  const fetchBatches = useCallback(async () => {
    setIsLoadingBatches(true);
    try {
      const lat = effectiveUserLocation.latitude;
      const lng = effectiveUserLocation.longitude;
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
  }, [effectiveUserLocation.latitude, effectiveUserLocation.longitude]);

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
        { latitude: effectiveUserLocation.latitude, longitude: effectiveUserLocation.longitude },
        { latitude: factory.latitude, longitude: factory.longitude }
      );

      if (activeFilter === "near" && distance > 15) return false;
      if (activeFilter === "green" && factory.activeBatch.freshnessZone !== "green") return false;
      if (activeFilter === "yellow" && factory.activeBatch.freshnessZone !== "yellow") return false;
      if (factory.activeBatch.freshnessZone === "expired") return false;
      return true;
    });
  }, [factories, activeFilter, effectiveUserLocation]);

  // Aggregate statistics
  const totalKgAvailable = useMemo(() => {
    return filteredFactories.reduce(
      (sum, f) => sum + f.activeBatch.availableSacks * f.activeBatch.weightPerSackKg,
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
        onToggleFactoryList={() => {
          if (isFactoryListOpen) {
            closePanel();
          } else {
            openPanel();
          }
        }}
        factoriesCount={filteredFactories.length}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onOpenSDGModal={() => setIsSDGModalOpen(true)}
        isRadiusCircleVisible={isRadiusCircleVisible}
        onToggleRadiusCircle={() => setIsRadiusCircleVisible((prev) => !prev)}
        totalKgAvailable={totalKgAvailable}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ordersCount={orders.filter((o) => o.status !== "DELIVERED_SETTLED").length}
        isLocationGranted={isLocationGranted}
        onRequestLocation={handleRequestLocation}
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
                  openPanel();
                }}
                onOrderFactory={handleOrderFactory}
                isRadiusCircleVisible={isRadiusCircleVisible}
                isLocationGranted={isLocationGranted}
                userLocation={effectiveUserLocation}
              />
            </div>

            {/* Apple Maps Style GPS Re-Center Floating Button */}
            <button
              onClick={() => setSelectedFactory(null)}
              className="apple-press absolute bottom-20 right-4 z-50 safari-stack-fix w-11 h-11 rounded-full bg-white/95 backdrop-blur-md border border-[#DDE7E2] flex items-center justify-center text-[#04261C] shadow-[0_4px_16px_rgba(4,38,28,0.1)] hover:bg-[#F2F7F4] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 hidden sm:flex"
              title="Pusatkan Radar ke GPS"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#0A4D3C]" />
            </button>

            {/* Location Permission Notification on Map */}
            {!isLocationGranted && (
              <div className="absolute top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 safari-stack-fix bg-white/95 backdrop-blur-md border border-[#DDE7E2] rounded-2xl p-4 shadow-[0_8px_30px_rgba(4,38,28,0.12)] animate-in fade-in slide-in-from-top-2 duration-300 hidden sm:block">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F2F7F4] border border-[#DDE7E2] flex items-center justify-center shrink-0">
                    <Navigation className="w-5 h-5 text-[#0A4D3C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#04261C]">Izinkan Akses Lokasi</h4>
                    <p className="text-xs text-[#4A6359] mt-0.5 leading-relaxed">
                      Aktifkan lokasi perangkat untuk melihat pabrik terdekat dan menghitung jarak akurat.
                    </p>
                    <button
                      onClick={handleRequestLocation}
                      className="apple-press mt-2.5 min-h-[36px] px-4 rounded-xl bg-[#0A4D3C] text-white text-xs font-bold hover:bg-[#063125] transition-colors focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
                    >
                      Izinkan Lokasi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reopen Sheet Capsule Button */}
            {!isFactoryListOpen && (
              <button
                onClick={openPanel}
                className="apple-press absolute bottom-20 left-4 z-50 safari-stack-fix bg-white/95 backdrop-blur-md border border-[#DDE7E2] text-[#04261C] px-4 py-2.5 rounded-full shadow-[0_4px_16px_rgba(4,38,28,0.1)] text-xs font-bold flex items-center gap-2 hover:bg-[#F2F7F4] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 hidden sm:flex"
              >
                <Layers className="w-4 h-4 text-[#0A4D3C]" />
                <span>{selectedFactory ? selectedFactory.name : `Pabrik (${filteredFactories.length})`}</span>
              </button>
            )}
          </main>

          {/* Sheet: Factory List / Detail Panel (Placed outside main to prevent overflow clipping) */}
          {shouldRenderPanel && (
            <aside
              aria-label="Panel Pabrik"
              onTransitionEnd={handlePanelTransitionEnd}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`fixed inset-x-0 bottom-14 ${selectedFactory ? 'max-h-[45vh]' : 'max-h-[72vh]'} rounded-t-[32px] md:top-20 md:left-6 md:right-auto md:bottom-20 md:w-[420px] md:max-h-[calc(100vh-160px)] md:rounded-[28px] z-30 bg-white/95 backdrop-blur-xl border border-[#DDE7E2] shadow-[0_16px_48px_rgba(4,38,28,0.12)] overflow-hidden flex flex-col transition-transform duration-300 ease-out ${dragOffset > 0 ? 'transition-none' : ''} ${
                isFactoryListOpen
                  ? 'translate-y-0 opacity-100 pointer-events-auto md:translate-x-0 md:opacity-100 md:pointer-events-auto'
                  : 'translate-y-full opacity-0 pointer-events-none md:-translate-x-full md:opacity-0 md:pointer-events-none'
              }`}
              style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined}
            >
              {selectedFactory ? (
                <FactoryDetailPanel
                  factory={selectedFactory}
                  onBack={() => setSelectedFactory(null)}
                  onClose={closePanel}
                  onOrder={handleOrderFactory}
                  userLocation={effectiveUserLocation}
                />
              ) : (
                <>
                  {/* Sheet Grabber */}
                  <div className="pt-2.5 pb-1 bg-transparent shrink-0">
                    <div className="apple-sheet-handle" />
                  </div>

                  {/* Panel Header */}
                  <div className="p-3.5 px-5 flex items-center justify-between shrink-0 border-b border-[#E8F0EC] bg-[#F7FAF8]">
                    <div>
                      <h3 className="font-bold text-base text-[#04261C] tracking-tight">
                        Pabrik Ampas Tahu
                      </h3>
                      <p className="text-xs text-[#4A6359] font-medium mt-0.5">
                        {filteredFactories.length} titik produsen, radius 15 km
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={fetchBatches}
                        disabled={isLoadingBatches}
                        className="apple-press p-2 min-h-[40px] min-w-[40px] rounded-full bg-[#E8F0EC] hover:bg-[#DDE7E2] text-[#04261C] transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
                        title="Segarkan data batch"
                        aria-label="Segarkan data"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingBatches ? "animate-spin text-[#0A4D3C]" : ""}`} />
                      </button>
                      <button
                        onClick={closePanel}
                        className="apple-press p-2 min-h-[40px] min-w-[40px] rounded-full bg-[#E8F0EC] hover:bg-[#DDE7E2] text-[#04261C] transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
                        title="Tutup Panel"
                        aria-label="Tutup Panel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Panel List */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                    {filteredFactories.length === 0 ? (
                      <div className="p-10 text-center text-[#4A6359] text-sm">
                        Tidak ada pabrik yang sesuai filter radar.
                      </div>
                    ) : (
                      filteredFactories.map((factory) => (
                        <FactoryCard
                          key={factory.id}
                          factory={factory}
                          isSelected={false}
                          onSelect={(fac) => setSelectedFactory(fac)}
                          onOrder={handleOrderFactory}
                          userLocation={effectiveUserLocation}
                        />
                      ))
                    )}
                  </div>
                </>
              )}
            </aside>
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
                  openPanel();
                }}
                onOrder={handleOrderFactory}
                userLocation={effectiveUserLocation}
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
        userLocation={effectiveUserLocation}
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
