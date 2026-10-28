"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthInput } from "@/components/auth/AuthInput";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { checkAuth } = useAuth();

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
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg =
          result.error?.message ||
          result.message ||
          "Email atau password yang dimasukkan tidak cocok.";

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

      setSuccessMessage("Berhasil masuk! Mengarahkan ke radar Sirkula...");
      await checkAuth();
      setTimeout(() => {
        router.push("/");
        router.refresh();
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
      heading="Holla, Welcome Back"
      supportingText="Hey, welcome back to your special place"
      footerPrompt="Don't have an account?"
      footerLinkText="Sign Up"
      footerLinkHref="/register"
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

        {/* Email Input */}
        <AuthInput
          id="login-email"
          name="email"
          type="email"
          label="Email Address"
          placeholder="stanley@gmail.com"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
          required
        />

        {/* Password Input */}
        <AuthInput
          id="login-password"
          name="password"
          label="Password"
          placeholder="••••••••••••"
          autoComplete="current-password"
          isPassword
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
          required
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-[18px] h-[18px] rounded-[5px] border border-[#D1D5DB] bg-white peer-checked:bg-[#0A4D3C] peer-checked:border-[#0A4D3C] transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-[#0A4D3C]/30 flex items-center justify-center">
                <svg
                  className="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                  viewBox="0 0 12 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 5L4.5 8L10.5 2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <span className="text-[13px] text-[#6B7280] group-hover:text-[#111827] transition-colors font-normal">
              Remember me
            </span>
          </label>

          <button
            type="button"
            onClick={() =>
              alert("Layanan reset sandi: silakan hubungi tim Sirkula di support@sirkula.id untuk verifikasi nomor registrasi Anda.")
            }
            className="text-[13px] font-normal text-[#6B7280] hover:text-[#0A4D3C] transition-colors focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:outline-none rounded px-1 py-0.5"
          >
            Forgot Password?
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-[130px] h-[46px] bg-[#0A4D3C] hover:bg-[#07382B] text-white font-bold rounded-[10px] text-[14px] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 shadow-[0_4px_14px_rgba(10,77,60,0.22)] hover:shadow-[0_6px_20px_rgba(10,77,60,0.28)]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memproses...</span>
              </span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
