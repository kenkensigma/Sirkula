"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthInput } from "@/components/auth/AuthInput";
import { Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; general?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email Address wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!password) {
      newErrors.password = "Password wajib diisi";
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
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors({
          general: result.message || "Email atau password yang dimasukkan tidak cocok.",
        });
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("Berhasil masuk! Mengarahkan ke radar Sirkula...");
      setTimeout(() => {
        router.push("/");
      }, 700);
    } catch {
      setErrors({
        general: "Terjadi gangguan koneksi. Pastikan internet Anda aktif dan coba lagi.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      mode="login"
      heading="Welcome Back"
      supportingText="Sign in to continue to your account."
      footerPrompt="Don't have an account?"
      footerLinkText="Create an account"
      footerLinkHref="/register"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
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

        {/* Email Input */}
        <AuthInput
          id="login-email"
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

        {/* Password Input */}
        <AuthInput
          id="login-password"
          name="password"
          label="Password"
          placeholder="Masukkan kata sandi"
          autoComplete="current-password"
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

        {/* Remember Me & Secondary Row */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-[#DDE7E2] text-[#0A4D3C] focus:ring-[#0A4D3C] focus:ring-offset-0 cursor-pointer accent-[#0A4D3C]"
            />
            <span className="text-xs font-medium text-[#4A6359] hover:text-[#04261C] transition-colors">
              Remember me
            </span>
          </label>

          <button
            type="button"
            onClick={() =>
              alert("Layanan reset sandi: silakan hubungi tim Sirkula di support@sirkula.id untuk verifikasi nomor registrasi Anda.")
            }
            className="text-xs font-semibold text-[#0A4D3C] hover:text-[#063125] hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:outline-none rounded px-1 py-0.5"
          >
            Forgot password?
          </button>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[48px] bg-[#0A4D3C] hover:bg-[#063125] text-white font-bold py-3 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.985] disabled:opacity-50 shadow-[0_4px_16px_rgba(10,77,60,0.25)] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 mt-2"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Memverifikasi Akun...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
