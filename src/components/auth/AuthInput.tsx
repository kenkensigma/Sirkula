"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
  supportingText?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  id,
  label,
  error,
  icon,
  isPassword = false,
  supportingText,
  className = "",
  type = "text",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const effectiveType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1.5 w-full text-left">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-xs font-bold text-[#04261C] tracking-tight"
        >
          {label}
        </label>
        {supportingText && (
          <span className="text-xs text-[#4A6359]">{supportingText}</span>
        )}
      </div>

      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-[#4A6359] z-10">
            {icon}
          </div>
        )}

        <input
          id={id}
          type={effectiveType}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full min-h-[48px] px-3.5 py-2.5 ${
            icon ? "pl-10" : ""
          } ${
            isPassword ? "pr-11" : ""
          } text-sm font-medium text-[#04261C] bg-[#F8FAF9] hover:bg-[#F2F7F4] focus:bg-white border rounded-xl transition-all duration-150 outline-none placeholder:text-[#4A6359]/60 ${
            error
              ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15"
              : "border-[#DDE7E2] focus:border-[#0A4D3C] focus:ring-2 focus:ring-[#0A4D3C]/15"
          } ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 p-2 rounded-lg text-[#4A6359] hover:text-[#04261C] hover:bg-black/[0.04] transition-colors focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:outline-none min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-[#DC2626] font-medium pt-0.5 animate-in fade-in duration-150"
        >
          {error}
        </p>
      )}
    </div>
  );
};
