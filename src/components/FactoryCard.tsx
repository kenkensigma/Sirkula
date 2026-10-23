"use client";

import React, { useState, useEffect } from "react";
import { FactoryLocation, USER_FARMER_LOCATION } from "@/data/mockFactories";
import { calculateHaversineDistance, formatDistanceDisplay } from "@/lib/geo/haversine";

interface FactoryCardProps {
  factory: FactoryLocation;
  isSelected: boolean;
  onSelect: (factory: FactoryLocation) => void;
  onOrder: (factory: FactoryLocation) => void;
}

const FRESHNESS_WINDOW_HOURS = 12;
const TICK_SECONDS = 30; // display is hours + minutes, so a per-second tick only wastes renders

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
  const estimatedMins = Math.max(3, Math.round(distance * 3));

  const remainingHours = Math.max(
    0,
    FRESHNESS_WINDOW_HOURS - factory.activeBatch.preparedAtHoursAgo
  );
  const [secondsLeft, setSecondsLeft] = useState(Math.round(remainingHours * 3600));

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - TICK_SECONDS));
    }, TICK_SECONDS * 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const isGreen = factory.activeBatch.freshnessZone === "green";
  const totalKg = factory.activeBatch.availableSacks * factory.activeBatch.weightPerSackKg;

  return (
    <article
      className={`apple-press relative rounded-2xl p-4 transition-all ${
        isSelected
          ? "border-2 border-[#0A4D3C] bg-[#F2F7F4] shadow-xs"
          : "border border-[#E2EBE5] bg-white hover:bg-[#F7FAF8] hover:border-[#CBDCD2]"
      }`}
    >
      {/* Status + district */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 font-semibold ${
            isGreen ? "text-[#0A4D3C]" : "text-[#9A3412]"
          }`}
        >
          <span
            aria-hidden
            className={`w-2 h-2 rounded-full ${isGreen ? "bg-[#0A4D3C]" : "bg-[#9A3412]"}`}
          />
          {isGreen ? "Segar prima" : "Diskon 15%"}
        </span>
        <span className="truncate text-[#4A6359] font-medium">{factory.district}</span>
      </div>

      {/* Name + distance */}
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 truncate text-base font-bold text-[#04261C]">
          {/* Stretched button: the whole card selects, without nesting the order button inside it */}
          <button
            type="button"
            onClick={() => onSelect(factory)}
            aria-pressed={isSelected}
            className="cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-[#0A4D3C] focus-visible:after:ring-offset-2"
          >
            {factory.name}
          </button>
        </h3>
        <p className="shrink-0 text-xs tabular-nums text-[#4A6359] font-medium">
          {formattedDistance} km · ~{estimatedMins} mnt
        </p>
      </div>
      <p className="mt-0.5 truncate text-sm text-[#4A6359]">{factory.activeBatch.itemName}</p>

      {/* Freshness + stock */}
      <dl className="mt-3 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-baseline gap-1.5">
          <dt className="sr-only">Sisa waktu segar</dt>
          <dd className="font-semibold tabular-nums text-[#04261C]">
            {hours}j {minutes}m
            <span className="ml-1 font-normal text-[#4A6359]">tersisa</span>
          </dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="sr-only">Stok</dt>
          <dd className="tabular-nums text-[#04261C]">
            <span className="font-semibold">{factory.activeBatch.availableSacks}</span> krg
            <span className="ml-1 text-[#4A6359]">({totalKg} kg)</span>
          </dd>
        </div>
      </dl>

      {/* Price + action */}
      <div className="mt-3.5 pt-3 border-t border-[#E8F0EC] flex items-center justify-between gap-3">
        <p className="text-[#4A6359]">
          <span className="text-lg font-bold tabular-nums text-[#0A4D3C] font-mono">
            Rp {factory.activeBatch.pricePerSackIdr.toLocaleString("id-ID")}
          </span>
          <span className="ml-1 text-xs">/karung</span>
        </p>

        <button
          type="button"
          onClick={() => onOrder(factory)}
          className="apple-press-sm relative z-10 min-h-[44px] sm:min-h-10 cursor-pointer rounded-xl bg-[#0A4D3C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#063125] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A4D3C] shadow-xs"
        >
          Pesan
        </button>
      </div>
    </article>
  );
};
