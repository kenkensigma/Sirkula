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
      className={`apple-press relative rounded-xl border bg-white p-4 transition-colors ${
        isSelected
          ? "border-green-700 bg-green-50/60"
          : "border-stone-200 hover:border-stone-300"
      }`}
    >
      {/* Status + district */}
      <p className="flex items-center gap-2 text-xs text-stone-600">
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            isGreen ? "text-green-800" : "text-amber-800"
          }`}
        >
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${isGreen ? "bg-green-700" : "bg-amber-600"}`}
          />
          {isGreen ? "Segar prima" : "Diskon 15%"}
        </span>
        <span className="truncate">{factory.district}</span>
      </p>

      {/* Name + distance */}
      <div className="mt-1.5 flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 truncate text-base font-semibold text-stone-900">
          {/* Stretched button: the whole card selects, without nesting the order button inside it */}
          <button
            type="button"
            onClick={() => onSelect(factory)}
            aria-pressed={isSelected}
            className="cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-green-700 focus-visible:after:ring-offset-2"
          >
            {factory.name}
          </button>
        </h3>
        <p className="shrink-0 text-xs tabular-nums text-stone-600">
          {formattedDistance} km · ~{estimatedMins} mnt
        </p>
      </div>
      <p className="mt-0.5 truncate text-sm text-stone-600">{factory.activeBatch.itemName}</p>

      {/* Freshness + stock */}
      <dl className="mt-3 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-baseline gap-1.5">
          <dt className="sr-only">Sisa waktu segar</dt>
          <dd className="font-medium tabular-nums text-stone-900">
            {hours}j {minutes}m
            <span className="ml-1 font-normal text-stone-600">tersisa</span>
          </dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="sr-only">Stok</dt>
          <dd className="tabular-nums text-stone-900">
            <span className="font-medium">{factory.activeBatch.availableSacks}</span> krg
            <span className="ml-1 text-stone-600">({totalKg} kg)</span>
          </dd>
        </div>
      </dl>

      {/* Price + action */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-stone-600">
          <span className="text-lg font-semibold tabular-nums text-stone-900">
            Rp {factory.activeBatch.pricePerSackIdr.toLocaleString("id-ID")}
          </span>
          <span className="ml-1 text-xs">/karung</span>
        </p>

        <button
          type="button"
          onClick={() => onOrder(factory)}
          className="apple-press-sm relative z-10 min-h-[44px] sm:min-h-10 cursor-pointer rounded-lg bg-green-800 px-4 text-sm font-medium text-white transition-colors hover:bg-green-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
        >
          Pesan
        </button>
      </div>
    </article>
  );
};
