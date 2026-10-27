"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthInput } from "@/components/auth/AuthInput";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight, Building2, Tractor } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { checkAuth } = useAuth();

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
        const errorMsg =
          result.error?.message ||
          result.message ||
          "Gagal membuat akun. Silakan periksa kembali data Anda.";

        const fieldErrors: Record<string, string> = {};
        if (result.error?.details && typeof result.error.details === "object") {
          for (const [key, val] of Object.entries(result.error.details)) {
            if (typeof val === "string") {
              fieldErrors[key] = val;
            }
          }
        }

        setErrors({
          general: errorMsg,
          ...fieldErrors,
        });
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("Akun berhasil dibuat! Mengarahkan ke radar Sirkula...");
      await checkAuth();
      setTimeout(() => {
        router.push("/");
      }, 800);
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
      supportingText="Get started by creating your account."
      footerPrompt="Already have an account?"
      footerLinkText="Sign In"
      footerLinkHref="/login"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        {/* General Error Banner */}
        {errors.general && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <span className="leading-relaxed font-medium">{errors.general}</span>
          </div>
        )}

        {/* Success Feedback Banner */}
        {successMessage && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-[#F2F7F4] border border-[#DDE7E2] text-[#0A4D3C] text-xs flex items-center gap-2.5 animate-in fade-in duration-200"
          >
            <CheckCircle2 className="w-4 h-4 text-[#0A4D3C] shrink-0" />
            <span className="leading-relaxed font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Role Selector Segmented Controls */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#04261C] tracking-tight">
            Peran Pengguna
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("farmer")}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all min-h-[44px] ${
                role === "farmer"
                  ? "bg-[#F2F7F4] border-2 border-[#0A4D3C] text-[#04261C] shadow-2xs"
                  : "bg-white border-[#DDE7E2] text-[#4A6359] hover:border-[#CBDCD2]"
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                role === "farmer" ? "bg-[#0A4D3C] text-white" : "bg-[#F4F8F5] text-[#4A6359]"
              }`}>
                <Tractor className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold block truncate leading-tight">Peternak</span>
                <span className="text-[10px] text-[#4A6359] block truncate">Pembeli Pakan</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("factory")}
              className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all min-h-[44px] ${
                role === "factory"
                  ? "bg-[#F2F7F4] border-2 border-[#0A4D3C] text-[#04261C] shadow-2xs"
                  : "bg-white border-[#DDE7E2] text-[#4A6359] hover:border-[#CBDCD2]"
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                role === "factory" ? "bg-[#0A4D3C] text-white" : "bg-[#F4F8F5] text-[#4A6359]"
              }`}>
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold block truncate leading-tight">Pabrik Tahu</span>
                <span className="text-[10px] text-[#4A6359] block truncate">Penyedia Ampas</span>
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
          icon={<User className="w-4 h-4" />}
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
          icon={<Mail className="w-4 h-4" />}
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
          icon={<Lock className="w-4 h-4" />}
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
          icon={<Lock className="w-4 h-4" />}
          required
        />

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[48px] bg-[#0A4D3C] hover:bg-[#063125] text-white font-bold py-3 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.985] disabled:opacity-50 shadow-[0_4px_16px_rgba(10,77,60,0.25)] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 mt-3"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Memproses Registrasi...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
