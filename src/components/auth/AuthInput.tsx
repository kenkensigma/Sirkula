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
    <div className="w-full text-left">
      <label
        htmlFor={id}
        className="block text-[13px] font-semibold text-[#171717] mb-1.5 tracking-[-0.01em]"
      >
        {label}
      </label>

      {supportingText && (
        <span className="block text-xs text-[#737373] mb-1.5">{supportingText}</span>
      )}

      <div className="relative flex items-center group">
        {icon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-[#A3A3A3] group-focus-within:text-[#0A4D3C] transition-colors z-10">
            {icon}
          </div>
        )}

        <input
          id={id}
          type={effectiveType}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full h-[50px] px-4 ${
            icon ? "pl-11" : ""
          } ${
            isPassword ? "pr-12" : ""
          } text-[14px] font-normal text-[#111827] bg-white border rounded-[12px] transition-all duration-150 outline-none placeholder:text-[#9CA3AF] ${
            error
              ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-4 focus:ring-[#DC2626]/10"
              : "border-[#E5E7EB] hover:border-[#CBD5E1] focus:border-[#0A4D3C] focus:ring-4 focus:ring-[#0A4D3C]/10"
          } ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-1.5 p-2.5 rounded-md text-[#A3A3A3] hover:text-[#171717] transition-colors focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:outline-none min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="w-[18px] h-[18px]" />
            ) : (
              <Eye className="w-[18px] h-[18px]" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[12px] text-[#DC2626] font-medium mt-1.5 animate-in fade-in duration-150"
        >
          {error}
        </p>
      )}
    </div>
  );
};
