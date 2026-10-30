"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FactoryLocation, USER_FARMER_LOCATION } from "@/data/mockFactories";
import { calculateHaversineDistance, formatDistanceDisplay } from "@/lib/geo/haversine";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Lock,
  Minus,
  Plus,
  X,
  Check,
  Store,
  Clock,
  Leaf,
  Tag,
  CreditCard,
  QrCode,
  Wallet,
  MapPin,
  ChevronDown,
} from "lucide-react";

export interface ActiveOrder {
  id: string;
  rawTransactionId?: string;
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

// 0 = Keranjang / Konfigurasi Pesanan (Cart)
// 1 = Pengiriman (Shipping & Contact)
// 2 = Pembayaran (Payment Method & Voucher)
// 3 = Tinjauan (Review & Escrow Lock)
type CheckoutStep = 0 | 1 | 2 | 3;
type PaymentMethodType = "escrow_balance" | "qris" | "va";

const BALI_DISTRICTS = [
  "Denpasar Timur",
  "Denpasar Barat",
  "Denpasar Selatan",
  "Denpasar Utara",
  "Badung (Kuta)",
  "Badung (Mengwi)",
  "Gianyar",
  "Tabanan",
  "Klungkung",
  "Bangli",
];

export const OrderDrawer: React.FC<OrderDrawerProps> = ({
  factory,
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { user } = useAuth();

  // Multi-step progress: 0 = Cart/Config, 1 = Shipping, 2 = Payment, 3 = Review
  const [step, setStep] = useState<CheckoutStep>(0);

  // Order attributes
  const [sacks, setSacks] = useState<number>(3);
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");

  // Contact Information Form Fields
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  // Shipping Address Form Fields
  const [fullName, setFullName] = useState<string>("");
  const [addressLine1, setAddressLine1] = useState<string>("");
  const [addressLine2, setAddressLine2] = useState<string>("");
  const [city, setCity] = useState<string>("Denpasar Timur");
  const stateProvince = "Bali";
  const [postalCode, setPostalCode] = useState<string>("80235");
  const country = "Indonesia";
  const [saveInfo, setSaveInfo] = useState<boolean>(true);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("escrow_balance");
  const [voucherCode, setVoucherCode] = useState<string>("");
  const [isVoucherApplied, setIsVoucherApplied] = useState<boolean>(false);
  const [voucherMessage, setVoucherMessage] = useState<string>("");

  // Submission & Validation
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Prefill contact & shipping address from auth user or saved local storage
  useEffect(() => {
    if (!isOpen) return;

    // Start on step 0 (Keranjang / Konfigurasi Karung)
    setStep(0);
    setValidationErrors({});
    setIsVoucherApplied(false);
    setVoucherMessage("");

    try {
      const saved = localStorage.getItem("sirkula_saved_shipping_info");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.addressLine1) setAddressLine1(parsed.addressLine1);
        if (parsed.addressLine2) setAddressLine2(parsed.addressLine2);
        if (parsed.city) setCity(parsed.city);
        if (parsed.postalCode) setPostalCode(parsed.postalCode);
      } else {
        // Fallback default from farmer mock location
        setFullName(user?.name || "Pak Wayan Gunawan");
        setEmail(user?.email || "wayan.ternak@gmail.com");
        setPhone(user?.phone || "0812-3456-7890");
        setAddressLine1(USER_FARMER_LOCATION.address);
        setAddressLine2("Kandang Sapi Mandiri Banjar");
      }
    } catch {
      // Ignore storage errors
    }

    if (user?.name) setFullName(user.name);
    if (user?.email) setEmail(user.email);
    if (user?.phone) setPhone(user.phone);
  }, [isOpen, user]);

  // Escape key handler for keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Calculations
  const distance = useMemo(() => {
    if (!factory) return 2.4;
    return calculateHaversineDistance(
      { latitude: USER_FARMER_LOCATION.latitude, longitude: USER_FARMER_LOCATION.longitude },
      { latitude: factory.latitude, longitude: factory.longitude }
    );
  }, [factory]);

  const formattedDistance = formatDistanceDisplay(distance);
  const pricePerSack = factory?.activeBatch.pricePerSackIdr || 25000;
  const weightPerSack = factory?.activeBatch.weightPerSackKg || 50;

  const subtotal = sacks * pricePerSack;
  const shippingFee = deliveryMethod === "delivery" ? Math.round(5000 + distance * 3000) : 0;
  const platformFee = 1000; // Proteksi Escrow Sirkula

  // Voucher discount (10% discount if SEGAR10 or HEMAT10)
  const discountAmount = useMemo(() => {
    if (isVoucherApplied) {
      return Math.round(subtotal * 0.1);
    }
    return 0;
  }, [isVoucherApplied, subtotal]);

  const totalAmount = Math.max(0, subtotal + shippingFee + platformFee - discountAmount);
  const totalKg = sacks * weightPerSack;

  const co2eSaved = Math.round(totalKg * 1.736 * 10) / 10;
  const feedSavings = totalKg * 850;

  if (!isOpen || !factory) return null;

  // Strict Step 1 Validation
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!email.trim() || !email.includes("@")) {
      errors.email = "Masukkan alamat email yang valid";
    }
    if (!phone.trim()) {
      errors.phone = "Nomor telepon / WhatsApp wajib diisi";
    }
    if (!fullName.trim()) {
      errors.fullName = "Nama lengkap wajib diisi";
    }
    if (deliveryMethod === "delivery") {
      if (!addressLine1.trim()) {
        errors.addressLine1 = "Alamat kandang / jalan wajib diisi";
      }
      if (!postalCode.trim()) {
        errors.postalCode = "Kode pos wajib diisi";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinueToPayment = () => {
    if (validateStep1()) {
      if (saveInfo) {
        try {
          localStorage.setItem(
            "sirkula_saved_shipping_info",
            JSON.stringify({
              fullName,
              email,
              phone,
              addressLine1,
              addressLine2,
              city,
              postalCode,
            })
          );
        } catch {
          // ignore
        }
      }
      setStep(2);
    }
  };

  // Stepper Header click handler with mandatory validation enforcement
  const handleStepperJump = (target: CheckoutStep) => {
    if (target === 1) {
      // Always allowed to go back to Step 1
      setStep(1);
    } else if (target === 2) {
      // Step 2 is only allowed if Step 1 is valid
      if (validateStep1()) {
        setStep(2);
      }
    } else if (target === 3) {
      // Step 3 can only be accessed if Step 1 is valid and user has already seen Step 2
      if (validateStep1() && step >= 2) {
        setStep(3);
      }
    }
  };

  const handleApplyVoucher = () => {
    const cleaned = voucherCode.trim().toUpperCase();
    if (cleaned === "SEGAR10" || cleaned === "HEMAT10" || cleaned === "SIRKULA") {
      setIsVoucherApplied(true);
      setVoucherMessage("Kode promo aktif: Hemat 10% subtotal pakan!");
    } else if (cleaned === "") {
      setVoucherMessage("Masukkan kode promo");
    } else {
      setIsVoucherApplied(false);
      setVoucherMessage("Kode tidak valid. Coba: SEGAR10");
    }
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    try {
      let realTxId: string | null = null;
      const idempotencyKey = `SRK-IDEM-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // API POST /api/v1/transactions
      try {
        const res = await fetch("/api/v1/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batch_id: factory.activeBatch.id,
            quantity_kg: totalKg,
            idempotency_key: idempotencyKey,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.id) {
            realTxId = json.data.id;
            // Pay simulation to lock funds in Escrow
            await fetch(`/api/v1/transactions/${realTxId}/pay-simulation`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payment_method: "simulated_balance" }),
            });
          }
        }
      } catch (err) {
        console.warn("API transaction note:", err);
      }

      const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
      const orderId = realTxId
        ? `SRK-${realTxId.slice(0, 8).toUpperCase()}`
        : `SRK-${Math.floor(1000 + Math.random() * 9000)}`;

      const generatedOrder: ActiveOrder = {
        id: orderId,
        rawTransactionId: realTxId || undefined,
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
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-white rounded-[28px] sm:rounded-[36px] overflow-hidden max-h-[92vh] flex flex-col shadow-[0_25px_70px_rgba(4,38,28,0.25)] border border-[#DDE7E2] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================================
            HEADER BAR
        ========================================================================= */}
        <header className="px-6 py-4 border-b border-[#E8F0EC] bg-white flex items-center justify-between shrink-0">
          {step === 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0A4D3C] bg-[#F2F7F4] border border-[#DDE7E2] px-2.5 py-1 rounded-lg">
                Konfigurasi Pesanan
              </span>
              <span className="text-xs text-[#4A6359] truncate max-w-[200px] sm:max-w-xs">
                {factory.name}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev > 0 ? ((prev - 1) as CheckoutStep) : 0))}
              className="apple-press inline-flex items-center gap-2 text-sm font-bold text-[#F95721] hover:text-[#D94612] transition-colors focus-visible:ring-2 focus-visible:ring-[#F95721] rounded-lg px-2 py-1 -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{step === 1 ? "Kembali ke Pesanan" : "Kembali"}</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4A6359] bg-[#F4F8F5] px-3 py-1.5 rounded-full border border-[#DDE7E2]">
              <Lock className="w-3.5 h-3.5 text-[#0A4D3C]" />
              <span className="hidden xs:inline">Proteksi Escrow Sirkula</span>
              <span className="xs:hidden">Escrow</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="apple-press p-2 rounded-full text-[#4A6359] hover:bg-[#F4F8F5] hover:text-[#04261C] transition-colors"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* =========================================================================
            STAGE 0: KERANJANG & KONFIGURASI PESANAN (CART VIEW)
            (User configures sacks, selects delivery, inspects freshness before checkout)
        ========================================================================= */}
        {step === 0 ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-[#FAFCFA]">
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Product & Factory Header Card */}
              <div className="p-5 rounded-3xl bg-white border border-[#DDE7E2] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#0A4D3C] text-white flex flex-col items-center justify-center font-black text-xs shrink-0 shadow-xs">
                    <span>50 KG</span>
                    <span className="text-[9px] font-normal opacity-85">/karung</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-extrabold text-[#04261C] tracking-tight">
                        {factory.activeBatch.itemName}
                      </h2>
                      {factory.verified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0A4D3C] bg-[#E8F0EC] px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Terverifikasi
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#4A6359] mt-0.5">
                      {factory.name} • {factory.district} (~{formattedDistance} km)
                    </p>
                  </div>
                </div>

                {/* Freshness Badge */}
                <div className="flex items-center gap-2 bg-[#F2F7F4] border border-[#DDE7E2] px-3 py-1.5 rounded-2xl self-stretch sm:self-auto justify-between sm:justify-start">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-[#0A4D3C]">
                    {factory.activeBatch.freshnessZone === "green" ? "Segar Hijau (0-12 Jam)" : "Fermentasi (12-18 Jam)"}
                  </span>
                </div>
              </div>

              {/* 1. Interactive Sack Selector */}
              <div className="p-6 rounded-3xl bg-white border border-[#DDE7E2] shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#04261C]">Jumlah Karung Pakan</h3>
                    <p className="text-xs text-[#4A6359]">
                      Tersedia: <strong className="text-[#04261C]">{factory.activeBatch.availableSacks} karung</strong> di pabrik
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-[#0A4D3C]">
                      Rp {pricePerSack.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[11px] text-[#4A6359] block">/karung</span>
                  </div>
                </div>

                {/* Interactive Counter */}
                <div className="flex items-center justify-between bg-[#F4F8F5] p-3 rounded-2xl border border-[#DDE7E2]">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSacks((p) => Math.max(1, p - 1))}
                      className="apple-press w-10 h-10 rounded-xl bg-white border border-[#DDE7E2] text-[#04261C] hover:bg-gray-50 flex items-center justify-center font-bold shadow-2xs"
                      aria-label="Kurangi"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="text-center min-w-[70px]">
                      <span className="text-xl font-black text-[#04261C] font-mono">{sacks}</span>
                      <span className="text-xs text-[#4A6359] block -mt-0.5">Karung</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSacks((p) => Math.min(factory.activeBatch.availableSacks, p + 1))}
                      className="apple-press w-10 h-10 rounded-xl bg-[#0A4D3C] text-white hover:bg-[#063125] flex items-center justify-center font-bold shadow-xs"
                      aria-label="Tambah"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-[#4A6359] block">Total Bobot:</span>
                    <span className="text-sm font-bold text-[#04261C] font-mono">
                      {totalKg} kg Pakan Segar
                    </span>
                  </div>
                </div>

                {/* Quick Selection Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[1, 3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={num > factory.activeBatch.availableSacks}
                      onClick={() => setSacks(num)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        sacks === num
                          ? "bg-[#0A4D3C] text-white shadow-xs"
                          : "bg-[#F2F7F4] text-[#4A6359] hover:text-[#04261C] hover:bg-[#E8F0EC]"
                      } disabled:opacity-40 disabled:pointer-events-none`}
                    >
                      {num} Karung ({num * 50} kg)
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSacks(factory.activeBatch.availableSacks)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#F95721] bg-[#FFF2ED] hover:bg-[#FFE6DC] transition-all ml-auto"
                  >
                    Maksimal ({factory.activeBatch.availableSacks})
                  </button>
                </div>
              </div>

              {/* 2. Delivery Option Selection */}
              <div className="p-6 rounded-3xl bg-white border border-[#DDE7E2] shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-[#04261C]">Metode Penerimaan Pakan</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Courier Option */}
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("delivery")}
                    className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      deliveryMethod === "delivery"
                        ? "border-2 border-[#0A4D3C] bg-[#F2F7F4] shadow-xs"
                        : "border-[#DDE7E2] bg-white hover:border-[#CBDCD2]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#0A4D3C]" />
                        <span className="text-xs font-bold text-[#0A4D3C]">Antar ke Kandang</span>
                      </div>
                      <span className="text-[10px] font-bold bg-[#E8F0EC] text-[#0A4D3C] px-2 py-0.5 rounded-full">
                        SLA 12 Jam
                      </span>
                    </div>
                    <p className="text-xs text-[#4A6359] leading-relaxed">
                      Kurir mengantar langsung ke peternakan (~{formattedDistance} km).
                    </p>
                    <span className="text-xs font-mono font-bold text-[#04261C] mt-2 block">
                      Ongkir: Rp {Math.round(5000 + distance * 3000).toLocaleString("id-ID")}
                    </span>
                  </button>

                  {/* Self Pickup Option */}
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("pickup")}
                    className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      deliveryMethod === "pickup"
                        ? "border-2 border-[#0A4D3C] bg-[#F2F7F4] shadow-xs"
                        : "border-[#DDE7E2] bg-white hover:border-[#CBDCD2]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-[#4A6359]" />
                        <span className="text-xs font-bold text-[#04261C]">Ambil Mandiri ke Pabrik</span>
                      </div>
                      <span className="text-[10px] font-bold bg-[#E8F0EC] text-[#0A4D3C] px-2 py-0.5 rounded-full">
                        Gratis Ongkir
                      </span>
                    </div>
                    <p className="text-xs text-[#4A6359] leading-relaxed">
                      Bawa karung sendiri ke {factory.name} ({factory.operatingHours}).
                    </p>
                    <span className="text-xs font-mono font-bold text-[#0A4D3C] mt-2 block">
                      Gratis (Rp 0)
                    </span>
                  </button>
                </div>
              </div>

              {/* 3. Batch Quality Specs & SDG Pill */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-[#DDE7E2] text-center">
                  <span className="text-[11px] text-[#4A6359] block">Kadar Protein</span>
                  <span className="text-xs font-bold text-[#04261C]">{factory.activeBatch.proteinContent}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-[#DDE7E2] text-center">
                  <span className="text-[11px] text-[#4A6359] block">Kadar Air</span>
                  <span className="text-xs font-bold text-[#04261C]">{factory.activeBatch.moistureContent}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-[#DDE7E2] text-center">
                  <span className="text-[11px] text-[#4A6359] block">Kondisi Suhu</span>
                  <span className="text-xs font-bold text-[#04261C]">{factory.activeBatch.temperatureStatus}</span>
                </div>
              </div>

              {/* SDG Banner */}
              <div className="p-3.5 rounded-2xl bg-[#F2F7F4] border border-[#DDE7E2] flex items-center gap-2.5 text-xs text-[#0A4D3C] font-semibold">
                <Leaf className="w-4 h-4 shrink-0" />
                <span>Mencegah {co2eSaved} kg CO2e • Menghemat pengeluaran pakan ~Rp {feedSavings.toLocaleString("id-ID")}</span>
              </div>

              {/* 4. Bottom Order Summary & Proceed Button */}
              <div className="p-5 rounded-3xl bg-white border border-[#DDE7E2] shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs text-[#4A6359]">
                  <span>Subtotal ({sacks} karung):</span>
                  <span className="font-mono text-[#04261C]">Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#4A6359]">
                  <span>Ongkos Kirim ({deliveryMethod === "delivery" ? `${formattedDistance} km` : "Mandiri"}):</span>
                  <span className="font-mono text-[#04261C]">
                    {shippingFee === 0 ? "Gratis" : `Rp ${shippingFee.toLocaleString("id-ID")}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#4A6359]">
                  <span>Biaya Proteksi Escrow:</span>
                  <span className="font-mono text-[#04261C]">Rp {platformFee.toLocaleString("id-ID")}</span>
                </div>
                <div className="pt-2 border-t border-[#DDE7E2] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#4A6359] block">Estimasi Total:</span>
                    <span className="text-xl font-black text-[#F95721] font-mono">
                      Rp {totalAmount.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="apple-press bg-[#F95721] hover:bg-[#E04B18] text-white font-bold py-3.5 px-6 rounded-2xl text-sm transition-all flex items-center gap-2 shadow-[0_4px_16px_rgba(249,87,33,0.3)] focus-visible:ring-2 focus-visible:ring-[#F95721]"
                  >
                    <span>Lanjut ke Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* =========================================================================
              STAGE 1, 2, 3: 2-COLUMN CHECKOUT PROCESS (MATCHING PHOTO)
          ========================================================================= */
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-[#FAFCFA]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
              
              {/* Left Column (Forms & Stepper) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Checkout Title */}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#04261C] tracking-tight">
                    Checkout
                  </h1>
                </div>

                {/* 3-Step Stepper matching photo: 1 Shipping - 2 Payment - 3 Review */}
                <nav aria-label="Progress Checkout" className="flex items-center gap-2 sm:gap-3 py-1">
                  {/* Step 1: Shipping */}
                  <button
                    type="button"
                    onClick={() => handleStepperJump(1)}
                    className="flex items-center gap-2 text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === 1
                          ? "bg-[#F95721] text-white shadow-xs scale-105"
                          : step > 1
                          ? "bg-[#0A4D3C] text-white"
                          : "border border-[#DDE7E2] text-[#4A6359] bg-white"
                      }`}
                    >
                      {step > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
                    </span>
                    <span className={step === 1 ? "text-[#F95721]" : step > 1 ? "text-[#04261C]" : "text-[#6E857B]"}>
                      Pengiriman
                    </span>
                  </button>

                  {/* Connector 1-2 */}
                  <div
                    className={`flex-1 h-[2px] transition-colors ${
                      step >= 2 ? "bg-[#0A4D3C]" : "bg-[#DDE7E2]"
                    }`}
                  />

                  {/* Step 2: Payment */}
                  <button
                    type="button"
                    onClick={() => handleStepperJump(2)}
                    className="flex items-center gap-2 text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === 2
                          ? "bg-[#F95721] text-white shadow-xs scale-105"
                          : step > 2
                          ? "bg-[#0A4D3C] text-white"
                          : "border border-[#DDE7E2] text-[#4A6359] bg-white"
                      }`}
                    >
                      {step > 2 ? <Check className="w-3.5 h-3.5" /> : "2"}
                    </span>
                    <span className={step === 2 ? "text-[#F95721]" : step > 2 ? "text-[#04261C]" : "text-[#6E857B]"}>
                      Pembayaran
                    </span>
                  </button>

                  {/* Connector 2-3 */}
                  <div
                    className={`flex-1 h-[2px] transition-colors ${
                      step === 3 ? "bg-[#0A4D3C]" : "bg-[#DDE7E2]"
                    }`}
                  />

                  {/* Step 3: Review */}
                  <button
                    type="button"
                    onClick={() => handleStepperJump(3)}
                    disabled={step < 2}
                    className="flex items-center gap-2 text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none disabled:opacity-50"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === 3
                          ? "bg-[#F95721] text-white shadow-xs scale-105"
                          : "border border-[#DDE7E2] text-[#4A6359] bg-white"
                      }`}
                    >
                      3
                    </span>
                    <span className={step === 3 ? "text-[#F95721]" : "text-[#6E857B]"}>
                      Tinjauan
                    </span>
                  </button>
                </nav>

                {/* STEP 1: SHIPPING & CONTACT */}
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Contact Information */}
                    <div className="space-y-3">
                      <h2 className="text-sm font-bold text-[#04261C]">Contact Information</h2>
                      <div>
                        <label className="block text-xs font-medium text-[#4A6359] mb-1.5">
                          Email address *
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (validationErrors.email) setValidationErrors((p) => ({ ...p, email: "" }));
                          }}
                          placeholder="youremail@example.com"
                          className={`w-full h-11 px-3.5 rounded-xl border bg-white text-sm text-[#04261C] focus:outline-none transition-all placeholder:text-[#9FB1A9] ${
                            validationErrors.email
                              ? "border-red-500 ring-2 ring-red-100"
                              : "border-[#DDE7E2] focus:border-[#F95721] focus:ring-2 focus:ring-[#F95721]/15"
                          }`}
                        />
                        {validationErrors.email && (
                          <p className="text-xs text-red-500 mt-1 font-medium">{validationErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#4A6359] mb-1.5">
                          No. Telepon / WhatsApp (Koordinasi Kurir) *
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (validationErrors.phone) setValidationErrors((p) => ({ ...p, phone: "" }));
                          }}
                          placeholder="0812-3456-7890"
                          className={`w-full h-11 px-3.5 rounded-xl border bg-white text-sm text-[#04261C] focus:outline-none transition-all placeholder:text-[#9FB1A9] ${
                            validationErrors.phone
                              ? "border-red-500 ring-2 ring-red-100"
                              : "border-[#DDE7E2] focus:border-[#F95721] focus:ring-2 focus:ring-[#F95721]/15"
                          }`}
                        />
                        {validationErrors.phone && (
                          <p className="text-xs text-red-500 mt-1 font-medium">{validationErrors.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Shipping Address Inputs */}
                    <div className="space-y-3.5 pt-1">
                      <h2 className="text-sm font-bold text-[#04261C]">
                        {deliveryMethod === "delivery" ? "Shipping Address" : "Informasi Pengambil Mandiri"}
                      </h2>

                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-medium text-[#4A6359] mb-1.5">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            if (validationErrors.fullName) setValidationErrors((p) => ({ ...p, fullName: "" }));
                          }}
                          placeholder="Nama lengkap peternak / penerima"
                          className={`w-full h-11 px-3.5 rounded-xl border bg-white text-sm text-[#04261C] focus:outline-none transition-all placeholder:text-[#9FB1A9] ${
                            validationErrors.fullName
                              ? "border-red-500 ring-2 ring-red-100"
                              : "border-[#DDE7E2] focus:border-[#F95721] focus:ring-2 focus:ring-[#F95721]/15"
                          }`}
                        />
                        {validationErrors.fullName && (
                          <p className="text-xs text-red-500 mt-1 font-medium">{validationErrors.fullName}</p>
                        )}
                      </div>

                      {deliveryMethod === "delivery" ? (
                        <>
                          {/* Address Line 1 */}
                          <div>
                            <label className="block text-xs font-medium text-[#4A6359] mb-1.5">
                              Address Line 1 (House number and street name) *
                            </label>
                            <input
                              type="text"
                              value={addressLine1}
                              onChange={(e) => {
                                setAddressLine1(e.target.value);
                                if (validationErrors.addressLine1) setValidationErrors((p) => ({ ...p, addressLine1: "" }));
                              }}
                              placeholder="Nama jalan, nomor kandang, atau banjar"
                              className={`w-full h-11 px-3.5 rounded-xl border bg-white text-sm text-[#04261C] focus:outline-none transition-all placeholder:text-[#9FB1A9] ${
                                validationErrors.addressLine1
                                  ? "border-red-500 ring-2 ring-red-100"
                                  : "border-[#DDE7E2] focus:border-[#F95721] focus:ring-2 focus:ring-[#F95721]/15"
                              }`}
                            />
                            {validationErrors.addressLine1 && (
                              <p className="text-xs text-red-500 mt-1 font-medium">{validationErrors.addressLine1}</p>
                            )}
                          </div>

                          {/* Address Line 2 (Optional) */}
                          <div>
                            <label className="block text-xs font-medium text-[#4A6359] mb-1.5">
                              Address Line 2 (Optional)
                            </label>
                            <input
                              type="text"
                              value={addressLine2}
                              onChange={(e) => setAddressLine2(e.target.value)}
                              placeholder="Apartment, suite, patokan kandang, sebelah pura, dll."
                              className="w-full h-11 px-3.5 rounded-xl border border-[#DDE7E2] bg-white text-sm text-[#04261C] focus:border-[#F95721] focus:ring-2 focus:ring-[#F95721]/15 focus:outline-none transition-all placeholder:text-[#9FB1A9]"
                            />
                          </div>

                          {/* 2 Columns: City | State/Province */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-[#4A6359] mb-1.5">
                                City / District *
                              </label>
                              <div className="relative">
                                <select
                                  value={city}
                                  onChange={(e) => setCity(e.target.value)}
                                  className="w-full h-11 px-3.5 pr-8 rounded-xl border border-[#DDE7E2] bg-white text-sm text-[#04261C] focus:border-[#F95721] focus:ring-2 focus:ring-[#F95721]/15 focus:outline-none transition-all appearance-none cursor-pointer"
                                >
                                  {BALI_DISTRICTS.map((dist) => (
                                    <option key={dist} value={dist}>
                                      {dist}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-[#4A6359] absolute right-3 top-3.5 pointer-events-none" />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[#4A6359] mb-1.5">
                                State / Province
                              </label>
                              <input
                                type="text"
                                value={stateProvince}
                                readOnly
                                className="w-full h-11 px-3.5 rounded-xl border border-[#DDE7E2] bg-[#F4F8F5] text-sm text-[#04261C] focus:outline-none cursor-default"
                              />
                            </div>
                          </div>

                          {/* 2 Columns: Postal Code | Country */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-[#4A6359] mb-1.5">
                                ZIP / Postal Code *
                              </label>
                              <input
                                type="text"
                                value={postalCode}
                                onChange={(e) => {
                                  setPostalCode(e.target.value);
                                  if (validationErrors.postalCode) setValidationErrors((p) => ({ ...p, postalCode: "" }));
                                }}
                                placeholder="80235"
                                className={`w-full h-11 px-3.5 rounded-xl border bg-white text-sm text-[#04261C] focus:outline-none transition-all font-mono placeholder:text-[#9FB1A9] ${
                                  validationErrors.postalCode
                                    ? "border-red-500 ring-2 ring-red-100"
                                    : "border-[#DDE7E2] focus:border-[#F95721] focus:ring-2 focus:ring-[#F95721]/15"
                                }`}
                              />
                              {validationErrors.postalCode && (
                                <p className="text-xs text-red-500 mt-1 font-medium">{validationErrors.postalCode}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[#4A6359] mb-1.5">
                                Country
                              </label>
                              <input
                                type="text"
                                value={country}
                                readOnly
                                className="w-full h-11 px-3.5 rounded-xl border border-[#DDE7E2] bg-[#F4F8F5] text-sm text-[#04261C] focus:outline-none cursor-default"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Pickup Notice */
                        <div className="p-4 rounded-2xl bg-[#F2F7F4] border border-[#DDE7E2] space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#0A4D3C]">
                            <MapPin className="w-4 h-4 text-[#0A4D3C]" />
                            <span>Titik Pengambilan Pabrik (Mandiri)</span>
                          </div>
                          <p className="text-xs text-[#04261C] font-bold">{factory.name}</p>
                          <p className="text-xs text-[#4A6359]">{factory.address}</p>
                          <p className="text-[11px] text-[#4A6359]">
                            Jam Operasional: <strong className="text-[#04261C]">{factory.operatingHours}</strong>
                          </p>
                        </div>
                      )}

                      {/* Checkbox: Save Info */}
                      <div className="pt-2">
                        <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs text-[#4A6359] select-none">
                          <input
                            type="checkbox"
                            checked={saveInfo}
                            onChange={(e) => setSaveInfo(e.target.checked)}
                            className="w-4 h-4 rounded text-[#F95721] border-[#DDE7E2] focus:ring-[#F95721] cursor-pointer accent-[#F95721]"
                          />
                          <span>Save this information for next time</span>
                        </label>
                      </div>
                    </div>

                    {/* Primary CTA: Continue to Payment */}
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handleContinueToPayment}
                        className="apple-press w-full min-h-[48px] bg-[#F95721] hover:bg-[#E04B18] text-white font-bold py-3.5 px-6 rounded-xl text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(249,87,33,0.3)] focus-visible:ring-2 focus-visible:ring-[#F95721] focus-visible:ring-offset-2"
                      >
                        <span>Continue to Payment</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: PAYMENT */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="space-y-3">
                      <h2 className="text-sm font-bold text-[#04261C]">Pilih Metode Pembayaran</h2>
                      
                      <div className="space-y-3">
                        {/* Sirkula Escrow Balance */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("escrow_balance")}
                          className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                            paymentMethod === "escrow_balance"
                              ? "border-2 border-[#0A4D3C] bg-[#F2F7F4] shadow-xs"
                              : "border-[#DDE7E2] bg-white hover:border-[#CBDCD2]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#0A4D3C]/10 flex items-center justify-center text-[#0A4D3C]">
                              <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#04261C]">
                                  Sirkula Escrow Balance
                                </span>
                                <span className="text-[10px] font-bold bg-[#E8F0EC] text-[#0A4D3C] px-2 py-0.5 rounded-full">
                                  Rekomendasi
                                </span>
                              </div>
                              <span className="text-xs text-[#4A6359] block mt-0.5">
                                Saldo rekening bersama (Langsung terproteksi otomatis)
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "escrow_balance"
                                ? "border-[#0A4D3C] bg-[#0A4D3C] text-white"
                                : "border-[#DDE7E2]"
                            }`}
                          >
                            {paymentMethod === "escrow_balance" && <Check className="w-3 h-3" />}
                          </div>
                        </button>

                        {/* QRIS Instant */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("qris")}
                          className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                            paymentMethod === "qris"
                              ? "border-2 border-[#0A4D3C] bg-[#F2F7F4] shadow-xs"
                              : "border-[#DDE7E2] bg-white hover:border-[#CBDCD2]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F4F8F5] border border-[#DDE7E2] flex items-center justify-center text-[#04261C]">
                              <QrCode className="w-5 h-5 text-[#0A4D3C]" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#04261C] block">
                                QRIS Instan
                              </span>
                              <span className="text-xs text-[#4A6359] block mt-0.5">
                                BCA, Mandiri, GoPay, OVO, ShopeePay, Dana
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "qris"
                                ? "border-[#0A4D3C] bg-[#0A4D3C] text-white"
                                : "border-[#DDE7E2]"
                            }`}
                          >
                            {paymentMethod === "qris" && <Check className="w-3 h-3" />}
                          </div>
                        </button>

                        {/* Virtual Account */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("va")}
                          className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                            paymentMethod === "va"
                              ? "border-2 border-[#0A4D3C] bg-[#F2F7F4] shadow-xs"
                              : "border-[#DDE7E2] bg-white hover:border-[#CBDCD2]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F4F8F5] border border-[#DDE7E2] flex items-center justify-center text-[#04261C]">
                              <CreditCard className="w-5 h-5 text-[#0A4D3C]" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#04261C] block">
                                Transfer Virtual Account
                              </span>
                              <span className="text-xs text-[#4A6359] block mt-0.5">
                                Verifikasi otomatis BCA, Mandiri, BRI, BNI
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "va"
                                ? "border-[#0A4D3C] bg-[#0A4D3C] text-white"
                                : "border-[#DDE7E2]"
                            }`}
                          >
                            {paymentMethod === "va" && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Escrow Guarantee Callout */}
                    <div className="p-4 rounded-2xl bg-white border border-[#DDE7E2] space-y-2 text-xs shadow-2xs">
                      <div className="flex items-center gap-2 text-[#0A4D3C] font-bold">
                        <Lock className="w-4 h-4 text-[#0A4D3C]" />
                        <span>Proteksi Rekening Bersama (Escrow)</span>
                      </div>
                      <p className="text-[#4A6359] leading-relaxed">
                        Dana Anda ditahan aman di sistem Escrow Sirkula. Pembayaran baru diteruskan ke pabrik setelah pakan Anda periksa bau &amp; kehangatannya saat serah terima fisik.
                      </p>
                    </div>

                    {/* Promo Voucher Box */}
                    <div className="p-4 rounded-2xl bg-[#F2F7F4] border border-[#DDE7E2] space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#04261C]">
                        <Tag className="w-3.5 h-3.5 text-[#F95721]" />
                        <span>Punya Kode Promo / Voucher?</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value)}
                          placeholder="Contoh: SEGAR10"
                          className="flex-1 h-10 px-3.5 rounded-xl border border-[#DDE7E2] bg-white text-xs uppercase font-mono text-[#04261C] focus:border-[#F95721] focus:ring-1 focus:ring-[#F95721] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleApplyVoucher}
                          className="apple-press px-4 h-10 rounded-xl bg-[#0A4D3C] text-white text-xs font-bold hover:bg-[#063125] transition-colors"
                        >
                          Terapkan
                        </button>
                      </div>
                      {voucherMessage && (
                        <p
                          className={`text-[11px] font-medium ${
                            isVoucherApplied ? "text-[#0A4D3C]" : "text-amber-700"
                          }`}
                        >
                          {voucherMessage}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons: Back & Continue to Review */}
                    <div className="pt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="apple-press min-h-[48px] px-5 rounded-xl border border-[#DDE7E2] bg-white hover:bg-[#F4F8F5] text-xs font-bold text-[#04261C] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="apple-press flex-1 min-h-[48px] bg-[#F95721] hover:bg-[#E04B18] text-white font-bold py-3.5 px-6 rounded-xl text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(249,87,33,0.3)] focus-visible:ring-2 focus-visible:ring-[#F95721] focus-visible:ring-offset-2"
                      >
                        <span>Lanjut ke Tinjauan</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: REVIEW */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="space-y-4">
                      <h2 className="text-sm font-bold text-[#04261C]">Tinjau Detail Pesanan</h2>

                      {/* Summary Card: Contact & Shipping */}
                      <div className="p-4 rounded-2xl bg-white border border-[#DDE7E2] shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#04261C] flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-[#0A4D3C]" />
                            <span>Penerimaan &amp; Kontak</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-xs font-bold text-[#F95721] hover:underline"
                          >
                            Ubah
                          </button>
                        </div>
                        <div className="text-xs text-[#4A6359] space-y-1 pt-1 border-t border-[#E8F0EC]">
                          <p>
                            <strong className="text-[#04261C]">{fullName}</strong> • {phone}
                          </p>
                          <p>{email}</p>
                          <p className="text-[#04261C] font-medium">
                            {deliveryMethod === "delivery"
                              ? `${addressLine1}${addressLine2 ? `, ${addressLine2}` : ""}, ${city}, Bali ${postalCode}`
                              : `Ambil Mandiri ke ${factory.name} (${factory.address})`}
                          </p>
                        </div>
                      </div>

                      {/* Summary Card: Payment */}
                      <div className="p-4 rounded-2xl bg-white border border-[#DDE7E2] shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#04261C] flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-[#0A4D3C]" />
                            <span>Metode Pembayaran</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="text-xs font-bold text-[#F95721] hover:underline"
                          >
                            Ubah
                          </button>
                        </div>
                        <div className="text-xs text-[#4A6359] pt-1 border-t border-[#E8F0EC]">
                          <p className="font-semibold text-[#04261C]">
                            {paymentMethod === "escrow_balance"
                              ? "Sirkula Escrow (Simulasi Saldo Rekening Bersama)"
                              : paymentMethod === "qris"
                              ? "QRIS Instan"
                              : "Transfer Virtual Account Bank"}
                          </p>
                          <p className="text-[11px] text-[#0A4D3C] mt-0.5 font-medium">
                            Status: Proteksi Escrow 100% Aktif
                          </p>
                        </div>
                      </div>

                      {/* SLA Notice */}
                      <div className="p-4 rounded-2xl bg-[#F2F7F4] border border-[#DDE7E2] flex items-start gap-3 text-xs">
                        <Clock className="w-4 h-4 text-[#0A4D3C] mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-[#04261C]">Garansi Kesegaran SLA 12 Jam</p>
                          <p className="text-[#4A6359] text-xs mt-0.5 leading-relaxed">
                            Ampas tahu baru dimasak &amp; dipres subuh. Cek aroma wangi kedelai &amp; suhu hangat sebelum menunjukkan QR / PIN serah terima ke kurir atau pihak pabrik.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Back & Final Confirm */}
                    <div className="pt-4 flex items-center gap-3">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setStep(2)}
                        className="apple-press min-h-[48px] px-5 rounded-xl border border-[#DDE7E2] bg-white hover:bg-[#F4F8F5] text-xs font-bold text-[#04261C] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleConfirmOrder}
                        className="apple-press flex-1 min-h-[48px] bg-[#F95721] hover:bg-[#E04B18] text-white font-bold py-3.5 px-6 rounded-xl text-sm sm:text-base transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-[0_4px_16px_rgba(249,87,33,0.3)] focus-visible:ring-2 focus-visible:ring-[#F95721] focus-visible:ring-offset-2"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Mengunci Dana di Escrow...</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Konfirmasi &amp; Kunci Escrow</span>
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Order Summary Card matching reference photo */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-3xl border border-[#DDE7E2] p-5 sm:p-6 shadow-[0_4px_20px_rgba(4,38,28,0.06)] sticky top-4 space-y-5">
                  
                  {/* Title */}
                  <h3 className="font-extrabold text-[#04261C] text-lg tracking-tight">
                    Order Summary
                  </h3>

                  {/* Product Item Preview */}
                  <div className="p-3.5 rounded-2xl bg-[#FAFCFA] border border-[#E8F0EC] flex items-center gap-3.5">
                    {/* Thumbnail Badge */}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#0A4D3C]/10 to-[#106950]/20 border border-[#DDE7E2] flex flex-col items-center justify-center p-2 shrink-0 relative overflow-hidden text-center">
                      <span className="text-[10px] font-black uppercase text-[#0A4D3C] tracking-tighter">
                        Ampas
                      </span>
                      <span className="text-xs font-bold text-[#04261C]">Segar</span>
                      <div className="w-2 h-2 rounded-full bg-[#0A4D3C] absolute bottom-1.5" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#04261C] text-sm truncate">
                        {factory.activeBatch.itemName}
                      </h4>
                      <p className="text-xs text-[#4A6359] truncate mt-0.5">
                        {factory.name} • Karung 50kg
                      </p>

                      {/* Sacks Counter inside Summary */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#E8F0EC]/80">
                        <div className="inline-flex items-center gap-2 bg-white px-2 py-0.5 rounded-full border border-[#DDE7E2]">
                          <button
                            type="button"
                            onClick={() => setSacks((prev) => Math.max(1, prev - 1))}
                            className="w-5 h-5 rounded-full hover:bg-[#F4F8F5] text-[#04261C] flex items-center justify-center"
                            aria-label="Kurangi karung"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-xs text-[#04261C] font-mono min-w-[16px] text-center">
                            {sacks}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSacks((prev) => Math.min(factory.activeBatch.availableSacks, prev + 1))
                            }
                            className="w-5 h-5 rounded-full bg-[#0A4D3C] text-white flex items-center justify-center"
                            aria-label="Tambah karung"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-mono font-bold text-[#04261C]">
                          Rp {subtotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sacks & Weight Badge */}
                  <div className="flex items-center justify-between text-xs text-[#4A6359] bg-[#F4F8F5] px-3 py-2 rounded-xl">
                    <span>Total Bobot ({sacks} karung × {weightPerSack} kg):</span>
                    <span className="font-bold text-[#04261C] font-mono">{totalKg} kg Pakan</span>
                  </div>

                  {/* Cost Breakdown Table */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-[#4A6359]">
                      <span>Subtotal</span>
                      <span className="text-[#04261C] font-mono font-medium">
                        Rp {subtotal.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#4A6359]">
                      <span>Shipping ({deliveryMethod === "delivery" ? `${formattedDistance} km` : "Mandiri"})</span>
                      <span className="text-[#04261C] font-mono font-medium">
                        {shippingFee === 0 ? "Rp 0.00" : `Rp ${shippingFee.toLocaleString("id-ID")}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#4A6359]">
                      <span>Biaya Escrow Sirkula</span>
                      <span className="text-[#04261C] font-mono font-medium">
                        Rp {platformFee.toLocaleString("id-ID")}
                      </span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between text-[#F95721] font-semibold">
                        <span>Discount</span>
                        <span className="font-mono">
                          -Rp {discountAmount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}

                    {/* Prominent Total Row */}
                    <div className="border-t border-[#DDE7E2] pt-3 flex items-center justify-between">
                      <span className="font-extrabold text-sm sm:text-base text-[#04261C]">
                        Total
                      </span>
                      <span className="font-mono font-black text-xl sm:text-2xl text-[#F95721] tracking-tight">
                        Rp {totalAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* 3 Trust Badges matching photo */}
                  <div className="pt-3 border-t border-[#E8F0EC] grid grid-cols-3 gap-2 text-center">
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-[#F4F8F5] transition-colors">
                      <ShieldCheck className="w-5 h-5 text-[#F95721] mb-1" />
                      <span className="text-[11px] font-bold text-[#04261C] leading-tight">
                        Secure Checkout
                      </span>
                      <span className="text-[9px] text-[#4A6359]">Escrow Aman</span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-[#F4F8F5] transition-colors">
                      <Truck className="w-5 h-5 text-[#F95721] mb-1" />
                      <span className="text-[11px] font-bold text-[#04261C] leading-tight">
                        {deliveryMethod === "delivery" ? "SLA 12 Jam" : "Free Pickup"}
                      </span>
                      <span className="text-[9px] text-[#4A6359]">
                        {deliveryMethod === "delivery" ? "Cepat Subuh" : "Bebas Biaya"}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-[#F4F8F5] transition-colors">
                      <RotateCcw className="w-5 h-5 text-[#F95721] mb-1" />
                      <span className="text-[11px] font-bold text-[#04261C] leading-tight">
                        Garansi Segar
                      </span>
                      <span className="text-[9px] text-[#4A6359]">Bebas Asam</span>
                    </div>
                  </div>

                  {/* Environmental Metric Chip */}
                  <div className="p-3 rounded-xl bg-[#F2F7F4] border border-[#DDE7E2] flex items-center gap-2 text-[11px] text-[#0A4D3C] font-semibold">
                    <Leaf className="w-3.5 h-3.5 shrink-0" />
                    <span>Cegah {co2eSaved} kg CO2e • Hemat Pakan ~Rp {feedSavings.toLocaleString("id-ID")}</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
