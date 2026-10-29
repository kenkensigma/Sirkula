"use client";

import React, { useState, useMemo } from "react";
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
import { 
  Navigation, 
  ShieldCheck, 
  Layers, 
  X, 
  Leaf
} from "lucide-react";

export default function Home() {
  const [factories, setFactories] = useState<FactoryLocation[]>(MOCK_FACTORIES);
  const [selectedFactory, setSelectedFactory] = useState<FactoryLocation | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "near" | "green" | "yellow">("all");
  const [isRadiusCircleVisible, setIsRadiusCircleVisible] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTab>("map");
  
  // State for the DOM panel, toggled from the Floating Appbar
  const [isFactoryListOpen, setIsFactoryListOpen] = useState<boolean>(false);

  // Location permission state
  const [isLocationGranted, setIsLocationGranted] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Order & Escrow state
  const [orderModalFactory, setOrderModalFactory] = useState<FactoryLocation | null>(null);
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [activeOrderForModal, setActiveOrderForModal] = useState<ActiveOrder | null>(null);
  const [isSDGModalOpen, setIsSDGModalOpen] = useState<boolean>(false);

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
  }, [factories, activeFilter, effectiveUserLocation]);

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
  };

  const handleSimulateDeliveryVerification = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: "DELIVERED_SETTLED" } : ord))
    );
    if (activeOrderForModal && activeOrderForModal.id === orderId) {
      setActiveOrderForModal((prev) => (prev ? { ...prev, status: "DELIVERED_SETTLED" } : null));
    }
  };

  return (
    <div className="h-screen w-screen bg-white text-[#04261C] flex flex-col relative overflow-hidden select-none">
      {/* Apple Dynamic Island Floating Appbar */}
      <FloatingAppbar
        isFactoryListOpen={isFactoryListOpen}
        onToggleFactoryList={() => setIsFactoryListOpen((prev) => !prev)}
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
                  setIsFactoryListOpen(true);
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
              className="apple-press absolute bottom-20 right-4 z-20 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md border border-[#DDE7E2] flex items-center justify-center text-[#04261C] shadow-[0_4px_16px_rgba(4,38,28,0.1)] hover:bg-[#F2F7F4] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
              title="Pusatkan Radar ke GPS"
              aria-label="Pusatkan Radar ke GPS"
            >
              <Navigation className="w-5 h-5 text-[#0A4D3C]" />
            </button>

            {/* Reopen Sheet Capsule Button */}
            {!isFactoryListOpen && (
              <button
                onClick={() => setIsFactoryListOpen(true)}
                className="apple-press absolute bottom-20 left-4 z-20 bg-white/95 backdrop-blur-md border border-[#DDE7E2] text-[#04261C] px-4 py-2.5 rounded-full shadow-[0_4px_16px_rgba(4,38,28,0.1)] text-xs font-bold flex items-center gap-2 hover:bg-[#F2F7F4] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
              >
                <Layers className="w-4 h-4 text-[#0A4D3C]" />
                <span>{selectedFactory ? selectedFactory.name : `Pabrik (${filteredFactories.length})`}</span>
              </button>
            )}
          </main>

          {/* Sheet: Factory List / Detail Panel (Placed outside main to prevent overflow clipping) */}
          {isFactoryListOpen && (
            <aside
              aria-label="Panel Pabrik"
              className={`fixed inset-x-0 bottom-14 ${selectedFactory ? 'max-h-[45vh]' : 'max-h-[72vh]'} rounded-t-[32px] md:top-20 md:left-6 md:right-auto md:bottom-20 md:w-[420px] md:max-h-[calc(100vh-160px)] md:rounded-[28px] z-30 bg-white/95 backdrop-blur-xl border border-[#DDE7E2] shadow-[0_16px_48px_rgba(4,38,28,0.12)] overflow-hidden flex flex-col transition-all duration-300`}
            >
              {selectedFactory ? (
                <FactoryDetailPanel
                  factory={selectedFactory}
                  onBack={() => setSelectedFactory(null)}
                  onClose={() => setIsFactoryListOpen(false)}
                  onOrder={handleOrderFactory}
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
                    <button
                      onClick={() => setIsFactoryListOpen(false)}
                      className="apple-press p-2 min-h-[40px] min-w-[40px] rounded-full bg-[#E8F0EC] hover:bg-[#DDE7E2] text-[#04261C] transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
                      title="Tutup Panel"
                      aria-label="Tutup Panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
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
        <main className="flex-1 overflow-y-auto pt-24 pb-20 px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <div className="mb-5">
            <span className="text-xs font-semibold text-[#0A4D3C] bg-[#F2F7F4] border border-[#DDE7E2] px-2.5 py-0.5 rounded-full inline-block mb-1.5">
              Live Stock
            </span>
            <h2 className="text-2xl font-extrabold text-[#04261C] tracking-tight">
              Katalog Ampas Tahu
            </h2>
            <p className="text-xs text-[#4A6359] mt-0.5">
              Urutan berdasarkan waktu pres terhangat dan jarak tempuh terdekat
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredFactories.map((factory) => (
              <FactoryCard
                key={factory.id}
                factory={factory}
                isSelected={selectedFactory?.id === factory.id}
                onSelect={(fac) => {
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
          <div className="mb-5">
            <span className="text-xs font-semibold text-[#0A4D3C] bg-[#F2F7F4] border border-[#DDE7E2] px-2.5 py-0.5 rounded-full inline-block mb-1.5">
              Rekening Bersama
            </span>
            <h2 className="text-2xl font-extrabold text-[#04261C] tracking-tight">
              Tiket &amp; Verifikasi Escrow
            </h2>
            <p className="text-xs text-[#4A6359] mt-0.5">
              Tunjukkan QR Code atau 6 Digit PIN ke kurir saat ampas tiba segar
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-[28px] border border-[#DDE7E2] bg-white space-y-3 shadow-2xs">
              <div className="w-14 h-14 rounded-full bg-[#F2F7F4] flex items-center justify-center mx-auto text-[#0A4D3C]">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-[#04261C] text-base">Belum Ada Transaksi</h3>
              <p className="text-xs text-[#4A6359] max-w-xs mx-auto leading-relaxed">
                Pilih pabrik tahu di peta atau katalog untuk mengunci stok ampas segar di Rekening Bersama.
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
              Dampak Lingkungan
            </span>
            <h2 className="text-3xl font-extrabold text-[#04261C] tracking-tight">
              Sirkularitas Limbah Ampas Tahu
            </h2>
            <p className="text-xs text-[#4A6359] max-w-md mx-auto leading-relaxed">
              Mencegah fermentasi pembusukan ampas tahu di sungai Bali, menekan emisi metana 1.736 kg CO2e per kg ampas, dan memotong biaya pakan ternak rakyat.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsSDGModalOpen(true)}
                className="apple-press bg-[#0A4D3C] hover:bg-[#063125] text-white font-bold py-3.5 px-6 rounded-full text-sm transition-all inline-flex items-center gap-2 shadow-xs min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
              >
                <Leaf className="w-4 h-4" />
                <span>Lihat Metrik Dampak Lingkungan</span>
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
