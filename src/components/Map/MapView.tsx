"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { FactoryLocation, USER_FARMER_LOCATION } from "@/data/mockFactories";
import { calculateHaversineDistance, formatDistanceDisplay } from "@/lib/geo/haversine";
import { ShieldCheck } from "lucide-react";

interface MapViewProps {
  factories: FactoryLocation[];
  selectedFactory: FactoryLocation | null;
  onSelectFactory: (factory: FactoryLocation) => void;
  onOrderFactory: (factory: FactoryLocation) => void;
  isRadiusCircleVisible: boolean;
}

// Controller component to programmatically fly map with Google Maps-style close zoom
function MapController({
  selectedFactory,
  userLocation,
}: {
  selectedFactory: FactoryLocation | null;
  userLocation: { latitude: number; longitude: number };
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedFactory) {
      // Zoom in closely like Google Maps (zoom 16)
      map.flyTo([selectedFactory.latitude, selectedFactory.longitude], 16, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    } else {
      // Zoom back out to regional radar overview (zoom 12)
      map.flyTo([userLocation.latitude, userLocation.longitude], 12, {
        duration: 1.0,
      });
    }
  }, [selectedFactory, userLocation, map]);

  return null;
}

export const MapView: React.FC<MapViewProps> = ({
  factories,
  selectedFactory,
  onSelectFactory,
  onOrderFactory,
  isRadiusCircleVisible,
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full min-h-[450px] bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Original GPS Location Marker with pulsing ripple effect
  const gpsIcon = L.divIcon({
    className: "custom-gps-marker",
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:28px;">
        <div style="position:absolute;inset:-8px;background:rgba(16,185,129,0.2);border-radius:50%;animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="width:22px;height:22px;background:#064e3b;border:2.5px solid #ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);">
          <div style="width:8px;height:8px;background:#34d399;border-radius:50%;"></div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  // Original Factory Pin: Factory building icon badge + sack count pill
  const createFactoryIcon = (factory: FactoryLocation, isSelected: boolean) => {
    const isGreen = factory.activeBatch.freshnessZone === "green";
    const bg = isGreen ? "#059669" : "#d97706";
    const border = isSelected ? "#2563eb" : "#ffffff";
    const scale = isSelected ? "transform:scale(1.22); z-index: 1000;" : "transition:transform 0.2s;";
    const ringShadow = isSelected
      ? "box-shadow: 0 0 0 4px rgba(37,99,235,0.4), 0 8px 18px rgba(0,0,0,0.35);"
      : "box-shadow: 0 3px 10px rgba(0,0,0,0.25);";

    return L.divIcon({
      className: `custom-factory-marker ${isSelected ? "selected-factory-marker" : ""}`,
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;${scale}">
          <div style="
            width:34px;height:34px;
            background:${bg};
            border:2.5px solid ${border};
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            ${ringShadow}
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div style="
            margin-top:2px;
            background:${isSelected ? "#1e293b" : bg};
            color:#ffffff;
            font-size:9px;
            font-weight:700;
            padding:1.5px 6px;
            border-radius:10px;
            white-space:nowrap;
            box-shadow:0 2px 5px rgba(0,0,0,0.2);
            border:1px solid rgba(255,255,255,0.8);
          ">
            ${factory.activeBatch.availableSacks} krg
          </div>
        </div>
      `,
      iconSize: [36, 50],
      iconAnchor: [18, 25],
    });
  };

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-100">
      <MapContainer
        center={[USER_FARMER_LOCATION.latitude, USER_FARMER_LOCATION.longitude]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapController
          selectedFactory={selectedFactory}
          userLocation={USER_FARMER_LOCATION}
        />

        {/* Standard OSM tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* 15 KM Radar Circle */}
        {isRadiusCircleVisible && (
          <Circle
            center={[USER_FARMER_LOCATION.latitude, USER_FARMER_LOCATION.longitude]}
            radius={15000}
            pathOptions={{
              color: "#059669",
              weight: 1.5,
              dashArray: "6, 8",
              fillColor: "#10b981",
              fillOpacity: 0.05,
            }}
          />
        )}

        {/* GPS Location Pin */}
        <Marker
          position={[USER_FARMER_LOCATION.latitude, USER_FARMER_LOCATION.longitude]}
          icon={gpsIcon}
        >
          <Popup className="custom-popup">
            <div className="p-3 text-slate-800">
              <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
                Titik GPS Peternak
              </span>
              <h4 className="font-bold text-sm text-slate-900 mt-0.5">{USER_FARMER_LOCATION.name}</h4>
              <p className="text-[11px] text-slate-600 mt-1">
                {USER_FARMER_LOCATION.address}
              </p>
              <p className="text-[10px] text-slate-600 font-mono mt-1">
                Radius Radar: {USER_FARMER_LOCATION.maxRadiusKm} KM
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Factory Markers */}
        {factories.map((factory) => {
          const distance = calculateHaversineDistance(
            { latitude: USER_FARMER_LOCATION.latitude, longitude: USER_FARMER_LOCATION.longitude },
            { latitude: factory.latitude, longitude: factory.longitude }
          );
          const formattedDistance = formatDistanceDisplay(distance);
          const isSelected = selectedFactory?.id === factory.id;

          return (
            <Marker
              key={factory.id}
              position={[factory.latitude, factory.longitude]}
              icon={createFactoryIcon(factory, isSelected)}
              eventHandlers={{
                click: () => onSelectFactory(factory),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-3 text-slate-800 min-w-[210px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      {factory.activeBatch.freshnessZone === "green" ? "🟢 Segar Prima" : "🟡 Diskon 15%"}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {formattedDistance} km
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{factory.name}</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {factory.activeBatch.itemName}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Stok:</span>
                    <span className="font-bold text-slate-900">
                      {factory.activeBatch.availableSacks} karung
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Harga:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      Rp {factory.activeBatch.pricePerSackIdr.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFactory(factory);
                      }}
                      className="apple-press min-h-[36px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-1.5 px-3 rounded-full text-xs transition-colors text-center border border-black/[0.05] focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                    >
                      Detail
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOrderFactory(factory);
                      }}
                      className="apple-press min-h-[36px] bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-1.5 px-3 rounded-full text-xs transition-colors flex items-center justify-center gap-1 shadow-[0_2px_6px_rgba(52,199,89,0.3)] focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Pesan
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
