"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthInput } from "@/components/auth/AuthInput";
import { AlertCircle, CheckCircle2, Building2, Tractor } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"farmer" | "factory">("farmer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      general?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = "Full Name wajib diisi";
    } else if (name.trim().length < 2) {
      newErrors.name = "Nama minimal 2 karakter";
    }

    if (!email.trim()) {
      newErrors.email = "Email Address wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!password) {
      newErrors.password = "Password wajib diisi";
    } else if (password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi Password wajib diisi";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password tidak cocok";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors({
          general:
            result.error?.message ||
            result.message ||
            "Gagal membuat akun. Silakan periksa kembali data Anda.",
        });
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("Akun berhasil dibuat! Mengarahkan ke halaman utama...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 900);
    } catch {
      setErrors({
        general: "Terjadi gangguan jaringan saat menghubungi server pendaftaran.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      mode="register"
      heading="Create Your Account"
      supportingText="Get started by creating your Sirkula account"
      footerPrompt="Already have an account?"
      footerLinkText="Sign In"
      footerLinkHref="/login"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* General Error Banner */}
        {errors.general && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <span className="leading-relaxed font-medium">{errors.general}</span>
          </div>
        )}

        {/* Success Feedback */}
        {successMessage && (
          <div
            role="status"
            className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] flex items-center gap-2.5 animate-in fade-in duration-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="leading-relaxed font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Role Selector */}
        <div>
          <label className="block text-[13px] font-semibold text-[#111827] mb-2 tracking-[-0.01em]">
            Peran Pengguna
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setRole("farmer")}
              className={`p-3 rounded-[12px] border text-left flex items-center gap-2.5 transition-all h-[52px] ${
                role === "farmer"
                  ? "bg-[#F0FDF4] border-[#0A4D3C] ring-1 ring-[#0A4D3C]"
                  : "bg-white border-[#E5E7EB] hover:border-[#D1D5DB]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  role === "farmer"
                    ? "bg-[#0A4D3C] text-white"
                    : "bg-[#F3F4F6] text-[#737373]"
                }`}
              >
                <Tractor className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-bold text-[#111827] block truncate leading-tight">
                  Peternak
                </span>
                <span className="text-[11px] text-[#6B7280] block truncate">
                  Pembeli Pakan
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("factory")}
              className={`p-3 rounded-[12px] border text-left flex items-center gap-2.5 transition-all h-[52px] ${
                role === "factory"
                  ? "bg-[#F0FDF4] border-[#0A4D3C] ring-1 ring-[#0A4D3C]"
                  : "bg-white border-[#E5E7EB] hover:border-[#D1D5DB]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  role === "factory"
                    ? "bg-[#0A4D3C] text-white"
                    : "bg-[#F3F4F6] text-[#737373]"
                }`}
              >
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-bold text-[#111827] block truncate leading-tight">
                  Pabrik Tahu
                </span>
                <span className="text-[11px] text-[#6B7280] block truncate">
                  Penyedia Ampas
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Full Name */}
        <AuthInput
          id="register-name"
          name="name"
          type="text"
          label="Full Name"
          placeholder="Nama Lengkap / Kelompok Ternak"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          error={errors.name}
          required
        />

        {/* Email Address */}
        <AuthInput
          id="register-email"
          name="email"
          type="email"
          label="Email Address"
          placeholder="nama@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
          required
        />

        {/* Password */}
        <AuthInput
          id="register-password"
          name="password"
          label="Password"
          placeholder="Minimal 6 karakter"
          autoComplete="new-password"
          isPassword
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
          required
        />

        {/* Confirm Password */}
        <AuthInput
          id="register-confirm-password"
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Ulangi kata sandi"
          autoComplete="new-password"
          isPassword
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          error={errors.confirmPassword}
          required
        />

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-[160px] h-[46px] bg-[#0A4D3C] hover:bg-[#07382B] text-white font-bold rounded-[10px] text-[14px] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 shadow-[0_4px_14px_rgba(10,77,60,0.22)] hover:shadow-[0_6px_20px_rgba(10,77,60,0.28)]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memproses...</span>
              </span>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
