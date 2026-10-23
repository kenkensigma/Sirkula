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

  // GPS Location Marker with refined radar indicator
  const gpsIcon = L.divIcon({
    className: "custom-gps-marker",
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:30px;height:30px;">
        <div style="position:absolute;inset:-6px;background:rgba(10,77,60,0.18);border-radius:50%;"></div>
        <div style="width:22px;height:22px;background:#0A4D3C;border:2.5px solid #ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(4,38,28,0.35);">
          <div style="width:7px;height:7px;background:#ffffff;border-radius:50%;"></div>
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  // Premium Green Factory Pin: Factory building icon badge + high-contrast sack count pill
  const createFactoryIcon = (factory: FactoryLocation, isSelected: boolean) => {
    const isGreen = factory.activeBatch.freshnessZone === "green";
    const bg = isGreen ? "#0A4D3C" : "#9A3412";
    const border = isSelected ? "#04261C" : "#ffffff";
    const scale = isSelected ? "transform:scale(1.2); z-index: 1000;" : "transition:transform 0.2s;";
    const ringShadow = isSelected
      ? "box-shadow: 0 0 0 3px rgba(10,77,60,0.4), 0 8px 20px rgba(4,38,28,0.35);"
      : "box-shadow: 0 4px 12px rgba(4,38,28,0.2);";

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
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div style="
            margin-top:3px;
            background:#ffffff;
            color:#04261C;
            font-size:11px;
            font-weight:700;
            padding:2px 8px;
            border-radius:9999px;
            white-space:nowrap;
            box-shadow:0 3px 8px rgba(4,38,28,0.18);
            border:1.5px solid ${bg};
            display:flex;
            align-items:center;
            gap:4px;
          ">
            <span style="width:5px;height:5px;border-radius:50%;background:${bg};display:inline-block;"></span>
            <span>${factory.activeBatch.availableSacks} krg</span>
          </div>
        </div>
      `,
      iconSize: [40, 56],
      iconAnchor: [20, 28],
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
              color: "#0A4D3C",
              weight: 1.5,
              dashArray: "6, 8",
              fillColor: "#0A4D3C",
              fillOpacity: 0.04,
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
                <div className="p-3 text-[#04261C] min-w-[220px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#0A4D3C] bg-[#F2F7F4] border border-[#DDE7E2] px-2 py-0.5 rounded-md">
                      {factory.activeBatch.freshnessZone === "green" ? "🟢 Segar Prima" : "🟡 Diskon 15%"}
                    </span>
                    <span className="text-xs font-semibold text-[#4A6359]">
                      {formattedDistance} km
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-[#04261C]">{factory.name}</h4>
                  <p className="text-xs text-[#4A6359] mt-0.5">
                    {factory.activeBatch.itemName}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-[#DDE7E2] flex items-center justify-between text-xs">
                    <span className="text-[#4A6359]">Stok:</span>
                    <span className="font-bold text-[#04261C]">
                      {factory.activeBatch.availableSacks} karung
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-[#4A6359]">Harga:</span>
                    <span className="font-bold text-[#0A4D3C] font-mono">
                      Rp {factory.activeBatch.pricePerSackIdr.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFactory(factory);
                      }}
                      className="apple-press min-h-[38px] bg-[#F2F7F4] hover:bg-[#E8F0EC] text-[#04261C] font-semibold py-1.5 px-3 rounded-xl text-xs transition-colors text-center border border-[#DDE7E2] focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
                    >
                      Detail
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOrderFactory(factory);
                      }}
                      className="apple-press min-h-[38px] bg-[#0A4D3C] hover:bg-[#063125] text-white font-semibold py-1.5 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 shadow-xs focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2"
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
