"use client";

import dynamic from "next/dynamic";
import React from "react";
import { FactoryLocation } from "@/data/mockFactories";

interface MapProps {
  factories: FactoryLocation[];
  selectedFactory: FactoryLocation | null;
  onSelectFactory: (factory: FactoryLocation) => void;
  onOrderFactory: (factory: FactoryLocation) => void;
  isRadiusCircleVisible: boolean;
}

const DynamicMapView = dynamic(
  () => import("./MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[380px] bg-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-green-600 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">
          Memuat peta...
        </p>
      </div>
    ),
  }
);

export const FactoryMap: React.FC<MapProps> = (props) => {
  return <DynamicMapView {...props} />;
};
