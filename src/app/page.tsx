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
import { 
  Navigation, 
  ShieldCheck, 
  Layers, 
  X, 
  Sparkles,
  ChevronRight,
  PackageCheck
} from "lucide-react";

export default function Home() {
  const [factories, setFactories] = useState<FactoryLocation[]>(MOCK_FACTORIES);
  const [selectedFactory, setSelectedFactory] = useState<FactoryLocation | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "near" | "green" | "yellow">("all");
  const [isRadiusCircleVisible, setIsRadiusCircleVisible] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTab>("map");
  
  // State for the DOM panel, toggled from the Floating Appbar
  const [isFactoryListOpen, setIsFactoryListOpen] = useState<boolean>(true);

  // Order & Escrow state
  const [orderModalFactory, setOrderModalFactory] = useState<FactoryLocation | null>(null);
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [activeOrderForModal, setActiveOrderForModal] = useState<ActiveOrder | null>(null);
  const [isSDGModalOpen, setIsSDGModalOpen] = useState<boolean>(false);

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
    <div className="h-screen w-screen bg-[#fbfbfd] text-slate-900 flex flex-col relative overflow-hidden select-none">
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
        <main className="relative flex-1 w-full h-full overflow-hidden">
          <div className="absolute inset-0 w-full h-full z-0">
            <FactoryMap
              factories={filteredFactories}
              selectedFactory={selectedFactory}
              onSelectFactory={(fac) => {
                setSelectedFactory(fac);
                setIsFactoryListOpen(true);
              }}
              onOrderFactory={(fac) => setOrderModalFactory(fac)}
              isRadiusCircleVisible={isRadiusCircleVisible}
            />
          </div>

          {/* Apple Maps Style GPS Re-Center Floating Button */}
          <button
            onClick={() => setSelectedFactory(null)}
            className="apple-press absolute bottom-20 right-4 z-20 w-11 h-11 rounded-full apple-glass-pill flex items-center justify-center text-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:bg-white"
            title="Pusatkan Radar ke GPS"
            aria-label="Pusatkan Radar ke GPS"
          >
            <Navigation className="w-5 h-5 text-emerald-600" />
          </button>

          {/* Reopen Sheet Capsule Button */}
          {!isFactoryListOpen && (
            <button
              onClick={() => setIsFactoryListOpen(true)}
              className="apple-press absolute bottom-20 left-4 z-20 apple-glass-pill text-slate-800 px-4 py-2.5 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.1)] text-xs font-bold flex items-center gap-2 hover:bg-white"
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>{selectedFactory ? selectedFactory.name : `Pabrik (${filteredFactories.length})`}</span>
            </button>
          )}

          {/* Apple Sheet: Factory List / Detail Panel */}
          {isFactoryListOpen && (
            <div
              className={`
                fixed inset-x-0 bottom-12 max-h-[72vh] rounded-t-[32px]
                md:fixed md:top-20 md:left-5 md:right-auto md:bottom-20 md:w-[410px] md:max-h-[calc(100vh-160px)] md:rounded-[28px]
                z-30 apple-glass overflow-hidden flex flex-col transition-all duration-300
              `}
            >
              {selectedFactory ? (
                <FactoryDetailPanel
                  factory={selectedFactory}
                  onBack={() => setSelectedFactory(null)}
                  onClose={() => setIsFactoryListOpen(false)}
                  onOrder={(fac) => setOrderModalFactory(fac)}
                />
              ) : (
                <>
                  {/* Apple Sheet Grabber */}
                  <div className="pt-2.5 pb-1 bg-transparent shrink-0">
                    <div className="apple-sheet-handle" />
                  </div>

                  {/* Panel Header */}
                  <div className="p-3.5 px-5 flex items-center justify-between shrink-0 border-b border-black/[0.05] bg-white/70 backdrop-blur-md">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 tracking-[-0.02em]">
                        Pabrik Ampas Tahu
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {filteredFactories.length} titik produsen • radius 15 km
                      </p>
                    </div>
                    <button
                      onClick={() => setIsFactoryListOpen(false)}
                      className="apple-press p-2 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-slate-500 transition-colors"
                      title="Tutup Panel"
                      aria-label="Tutup Panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Panel List */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                    {filteredFactories.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 text-sm">
                        Tidak ada pabrik yang sesuai filter radar.
                      </div>
                    ) : (
                      filteredFactories.map((factory) => (
                        <FactoryCard
                          key={factory.id}
                          factory={factory}
                          isSelected={selectedFactory?.id === factory.id}
                          onSelect={(fac) => setSelectedFactory(fac)}
                          onOrder={(fac) => setOrderModalFactory(fac)}
                        />
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      )}

      {/* Tab: Katalog (Apple App Store Style) */}
      {activeTab === "catalog" && (
        <main className="flex-1 overflow-y-auto pt-24 pb-20 px-4 sm:px-6 max-w-3xl mx-auto w-full">
          <div className="mb-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
              Live Stock
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-[-0.03em]">
              Katalog Ampas Tahu
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Urutan berdasarkan waktu pres terhangat &amp; jarak tempuh terdekat
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
                onOrder={(fac) => setOrderModalFactory(fac)}
              />
            ))}
          </div>
        </main>
      )}

      {/* Tab: Escrow (Apple Wallet Passes Style) */}
      {activeTab === "escrow" && (
        <main className="flex-1 overflow-y-auto pt-24 pb-20 px-4 sm:px-6 max-w-2xl mx-auto w-full">
          <div className="mb-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
              Apple Wallet Style
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-[-0.03em]">
              Tiket &amp; Verifikasi Escrow
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tunjukkan QR Code atau 6 Digit PIN ke kurir saat ampas tiba segar
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-[28px] border border-black/[0.05] bg-white space-y-3 shadow-2xs">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Belum Ada Transaksi</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Pilih pabrik tahu di peta atau katalog untuk mengunci stok ampas segar di Rekening Bersama.
              </p>
              <button
                onClick={() => setActiveTab("map")}
                className="apple-press inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-full text-xs shadow-xs"
              >
                <span>Buka Radar Peta</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setActiveOrderForModal(ord)}
                  className="apple-press bg-white border border-black/[0.06] rounded-[24px] p-4 cursor-pointer hover:border-emerald-500/40 shadow-2xs transition-all relative overflow-hidden group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {ord.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        ord.status === "DELIVERED_SETTLED"
                          ? "text-slate-500 bg-slate-100"
                          : "text-emerald-800 bg-emerald-500/15"
                      }`}
                    >
                      {ord.status === "DELIVERED_SETTLED" ? "Tuntas Selesai" : "Dana Aman di Escrow"}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-base text-slate-900 tracking-tight">
                    {ord.factoryName}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ord.sacksCount} karung ({ord.totalKg} kg ampas) • {ord.itemName}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-black/[0.04] text-xs">
                    <span className="text-slate-400 font-medium">Total Dana</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      Rp {ord.totalAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* Tab: SDG (Apple Health Style) */}
      {activeTab === "sdg" && (
        <main className="flex-1 overflow-y-auto pt-24 pb-20 px-4 sm:px-6 max-w-2xl mx-auto w-full">
          <div className="text-center py-12 px-6 bg-white border border-black/[0.06] rounded-[32px] space-y-4 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              Apple Health Style Dashboard
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-[-0.03em]">
              Sirkularitas Limbah Ampas Tahu
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Mencegah fermentasi pembusukan ampas tahu di sungai Bali, menekan emisi metana 1.736 kg CO2e per kg ampas, dan memotong biaya pakan ternak rakyat.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsSDGModalOpen(true)}
                className="apple-press bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-full text-sm transition-all inline-flex items-center gap-2 shadow-[0_4px_16px_rgba(52,199,89,0.35)]"
              >
                <Sparkles className="w-4 h-4" />
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
    </div>
  );
}
