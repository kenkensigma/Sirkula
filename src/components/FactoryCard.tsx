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
      onClick={() => onSelect(factory)}
      className={`rounded-xl transition-all duration-200 cursor-pointer p-3.5 ${
        isSelected
          ? "bg-emerald-50/80 border-2 border-emerald-500 shadow-sm"
          : "bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xs"
      }`}
    >
      {/* Header: Name + Distance */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm truncate">
            {factory.name}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {factory.activeBatch.itemName}
          </p>
        </div>
        <span className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-400" />
          {formattedDistance} km
        </span>
      </div>

      {/* Key info row */}
      <div className="flex items-center gap-3 text-[11px] text-slate-600 mb-3">
        <span className="flex items-center gap-1">
          <Clock className={`w-3 h-3 ${isGreen ? "text-emerald-600" : "text-amber-500"}`} />
          <span className={isGreen ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
            {isGreen ? "Segar" : "Diskon 15%"}
          </span>
          <span>•</span>
          <span>{hours}j {minutes}m</span>
        </span>
        <span>•</span>
        <span>
          {factory.activeBatch.availableSacks} karung ({totalKg} kg)
        </span>
      </div>

      {/* Footer: Price + CTA */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-slate-900">
            Rp {factory.activeBatch.pricePerSackIdr.toLocaleString("id-ID")}
          </span>
          <span className="text-[10px] text-slate-400 ml-1">/karung</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOrder(factory);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-3.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Pesan
        </button>
      </div>
    </div>
  );
};
