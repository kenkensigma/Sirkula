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
  Leaf
} from "lucide-react";

export default function Home() {
  const [factories, setFactories] = useState<FactoryLocation[]>(MOCK_FACTORIES);
  const [selectedFactory, setSelectedFactory] = useState<FactoryLocation | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "near" | "green" | "yellow">("all");
  const [isRadiusCircleVisible, setIsRadiusCircleVisible] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTab>("map");
  
  // State for the DOM panel "Pabrik Ampas Tahu (5 lokasi)", toggled from the Floating Appbar
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
    <div className="h-screen w-screen bg-slate-50 text-slate-900 flex flex-col relative overflow-hidden">
      {/* Floating Appbar */}
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

          {/* GPS Re-Center */}
          <button
            onClick={() => setSelectedFactory(null)}
            className="absolute bottom-16 right-4 z-20 bg-white/90 backdrop-blur-md text-slate-700 p-2.5 rounded-xl border border-slate-200 shadow-md transition-all active:scale-95 hover:bg-white"
            title="Pusatkan ke GPS"
          >
            <Navigation className="w-4 h-4" />
          </button>

          {/* Reopen panel pill */}
          {!isFactoryListOpen && (
            <button
              onClick={() => setIsFactoryListOpen(true)}
              className="absolute bottom-16 left-4 z-20 bg-white/95 backdrop-blur-md text-slate-700 px-3 py-2 rounded-xl border border-slate-200 shadow-md text-xs font-semibold flex items-center gap-1.5 hover:bg-white transition-all active:scale-95"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>{selectedFactory ? selectedFactory.name : `Pabrik (${filteredFactories.length})`}</span>
            </button>
          )}

          {/* Factory List / Detail Panel (Google Maps Style Side Panel & Bottom Sheet) */}
          {isFactoryListOpen && (
            <div
              className={`
                fixed inset-x-0 bottom-12 max-h-[68vh] rounded-t-3xl
                md:fixed md:top-20 md:left-5 md:right-auto md:bottom-16 md:w-[410px] md:max-h-[calc(100vh-140px)] md:rounded-2xl
                z-30 bg-white/98 backdrop-blur-xl border-t border-slate-200 shadow-[0_-6px_28px_rgba(15,23,42,0.12)]
                md:border md:border-slate-200 md:shadow-[0_8px_32px_rgba(15,23,42,0.14)] flex flex-col overflow-hidden
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
                  {/* Panel Header */}
                  <div className="p-3.5 px-4 flex items-center justify-between shrink-0 border-b border-slate-100 bg-white">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        Pabrik Ampas Tahu
                      </h3>
                      <p className="text-[11px] text-slate-600">
                        {filteredFactories.length} lokasi • radius 15 km
                      </p>
                    </div>
                    <button
                      onClick={() => setIsFactoryListOpen(false)}
                      className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden"
                      title="Tutup Panel"
                      aria-label="Tutup panel daftar pabrik"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Panel List */}
                  <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
                    {filteredFactories.length === 0 ? (
                      <div className="p-8 text-center text-slate-600 text-sm">
                        Tidak ada pabrik yang sesuai dengan kriteria filter saat ini.
                      </div>
                    ) : (
                      filteredFactories.map((factory) => (
                        <FactoryCard
                          key={factory.id}
                          factory={factory}
                          isSelected={false}
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

      {/* Tab: Katalog */}
      {activeTab === "catalog" && (
        <main className="flex-1 overflow-y-auto pt-20 pb-16 px-4 sm:px-6 max-w-3xl mx-auto w-full bg-slate-50">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Katalog Stok</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Diurutkan dari yang tersegar &amp; terdekat
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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

      {/* Tab: Escrow */}
      {activeTab === "escrow" && (
        <main className="flex-1 overflow-y-auto pt-20 pb-16 px-4 sm:px-6 max-w-2xl mx-auto w-full bg-slate-50">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Escrow &amp; QR</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verifikasi serah-terima ampas tahu
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 space-y-3 text-slate-600 bg-white border border-slate-200 rounded-2xl p-6">
              <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-sm font-medium text-slate-700">Belum ada pesanan aktif</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Pilih pabrik tahu dari peta radar atau katalog untuk memesan ampas segar dengan jaminan escrow.
              </p>
              <button
                onClick={() => setActiveTab("map")}
                className="text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-semibold px-4 py-2 rounded-xl transition-colors border border-emerald-200 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden"
              >
                Buka Peta Radar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveOrderForModal(ord)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveOrderForModal(ord);
                    }
                  }}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 cursor-pointer hover:border-emerald-300 hover:shadow-xs transition-all focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden"
                  aria-label={`Buka detail verifikasi pesanan ${ord.id} dari ${ord.factoryName}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-600">
                      {ord.id}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        ord.status === "DELIVERED_SETTLED"
                          ? "text-slate-700 bg-slate-100 border border-slate-200"
                          : "text-emerald-900 bg-emerald-100 border border-emerald-200"
                      }`}
                    >
                      {ord.status === "DELIVERED_SETTLED" ? "Selesai" : "Escrow Aktif"}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm text-slate-900">
                    {ord.factoryName}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {ord.sacksCount} karung ({ord.totalKg} kg)
                  </p>

                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-600">Total Nominal</span>
                    <span className="font-bold text-slate-900 font-mono">
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
        <main className="flex-1 overflow-y-auto pt-20 pb-16 px-4 sm:px-6 max-w-2xl mx-auto w-full bg-slate-50">
          <div className="text-center py-12 space-y-4">
            <span className="text-xs font-semibold text-emerald-900 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full inline-block">
              Target Sirkularitas SDG 12 &amp; 13
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Dampak Sirkularitas Ampas Tahu
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Menyelamatkan limbah ampas tahu dari pembuangan liar ke sungai, mencegah pembentukan gas metana, dan menghemat biaya pakan ternak rakyat.
            </p>
            <button
              onClick={() => setIsSDGModalOpen(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors inline-flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden"
              aria-label="Buka ringkasan dampak lingkungan dan SDG"
            >
              <Leaf className="w-4 h-4 text-emerald-200" />
              <span>Lihat Rincian Dampak</span>
            </button>
          </div>
        </main>
      )}

      {/* Bottom Navigation */}
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
