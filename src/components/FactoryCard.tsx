"use client";

import React, { useState, useEffect } from "react";
import { FactoryLocation, USER_FARMER_LOCATION } from "@/data/mockFactories";
import { calculateHaversineDistance, formatDistanceDisplay } from "@/lib/geo/haversine";
import { Clock, MapPin, ShieldCheck } from "lucide-react";

interface FactoryCardProps {
  factory: FactoryLocation;
  isSelected: boolean;
  onSelect: (factory: FactoryLocation) => void;
  onOrder: (factory: FactoryLocation) => void;
}

export const FactoryCard: React.FC<FactoryCardProps> = ({
  factory,
  isSelected,
  onSelect,
  onOrder,
}) => {
  const distance = calculateHaversineDistance(
    { latitude: USER_FARMER_LOCATION.latitude, longitude: USER_FARMER_LOCATION.longitude },
    { latitude: factory.latitude, longitude: factory.longitude }
  );
  const formattedDistance = formatDistanceDisplay(distance);

  // Remaining time in the 12-hour freshness SLA window
  const remainingHoursTotal = Math.max(0, 12 - factory.activeBatch.preparedAtHoursAgo);
  const [secondsLeft, setSecondsLeft] = useState(Math.round(remainingHoursTotal * 3600));

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const isGreen = factory.activeBatch.freshnessZone === "green";
  const totalKg = factory.activeBatch.availableSacks * factory.activeBatch.weightPerSackKg;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(factory)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(factory);
        }
      }}
      aria-label={`Pabrik ${factory.name}, ${factory.activeBatch.itemName}, harga Rp ${factory.activeBatch.pricePerSackIdr.toLocaleString("id-ID")} per karung, jarak ${formattedDistance} km`}
      className={`rounded-xl transition-all duration-200 cursor-pointer p-3.5 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden ${
        isSelected
          ? "bg-emerald-50/80 border-2 border-emerald-600 shadow-xs"
          : "bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xs"
      }`}
    >
      {/* Header: Name + Distance */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm truncate">
            {factory.name}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {factory.activeBatch.itemName}
          </p>
        </div>
        <span className="text-xs text-slate-600 font-medium shrink-0 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          {formattedDistance} km
        </span>
      </div>

      {/* Key info row */}
      <div className="flex items-center gap-2 text-xs text-slate-700 mb-3 flex-wrap">
        <span className="flex items-center gap-1">
          <Clock className={`w-3.5 h-3.5 ${isGreen ? "text-emerald-700" : "text-amber-700"}`} />
          <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold border ${
            isGreen 
              ? "text-emerald-900 bg-emerald-50 border-emerald-200" 
              : "text-amber-900 bg-amber-50 border-amber-200"
          }`}>
            {isGreen ? "Segar Prima" : "Diskon 15%"}
          </span>
          <span className="text-slate-400">•</span>
          <span className="font-mono font-medium text-slate-800">{hours}j {minutes}m</span>
        </span>
        <span className="text-slate-400">•</span>
        <span className="font-medium text-slate-800">
          {factory.activeBatch.availableSacks} karung ({totalKg} kg)
        </span>
      </div>

      {/* Footer: Price + CTA */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <div>
          <span className="text-sm font-bold text-slate-900 font-mono">
            Rp {factory.activeBatch.pricePerSackIdr.toLocaleString("id-ID")}
          </span>
          <span className="text-xs text-slate-600 ml-1">/karung</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOrder(factory);
          }}
          aria-label={`Pesan ampas dari ${factory.name}`}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 px-3.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 min-h-[38px] focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden active:scale-95 shadow-xs"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Pesan</span>
        </button>
      </div>
    </div>
  );
};
