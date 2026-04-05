"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon (Next.js bundler breaks relative paths)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Load QCT tract set client-side
async function loadQCTTracts(): Promise<Set<string>> {
  const res = await fetch("/data/qct-tracts.json");
  const data: string[] = await res.json();
  return new Set(data);
}

const NYC_CENTER: [number, number] = [40.7128, -74.006];
const DEFAULT_ZOOM = 9;

interface LocationMapProps {
  onLocationSelect?: (lat: number, lng: number, tract: string, stateFips: string, countyFips: string) => void;
  selectedLocation?: [number, number] | null;
  eligibilityStatus?: { isQCT: boolean; isDDA: boolean } | null | undefined;
}

export function LocationMap({ onLocationSelect, selectedLocation, eligibilityStatus }: LocationMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const qctMapRef = useRef<L.Map | null>(null);
  const [mounted, setMounted] = useState(false);
  const [qctSet, setQctSet] = useState<Set<string> | null>(null);
  const [hoveredTract, setHoveredTract] = useState<string | null>(null);
  const [pinLocation, setPinLocation] = useState<[number, number] | null>(selectedLocation || null);
  const [mapClickLoading, setMapClickLoading] = useState(false);

  // Load QCT data on mount
  useEffect(() => {
    setMounted(true);
    loadQCTTracts().then(setQctSet);
  }, []);

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    qctMapRef.current = map;
  }, []);

  // Update pin when selectedLocation changes from outside
  useEffect(() => {
    if (selectedLocation) {
      setPinLocation(selectedLocation);
    }
  }, [selectedLocation]);

  if (!mounted) {
    return (
      <div className="h-[450px] bg-slate-100 rounded-xl flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading map...</p>
      </div>
    );
  }

  return (
    <MapWithEvents onReady={handleMapReady}>
      <LocationMapInner
        mapRef={mapRef}
        qctSet={qctSet}
        pinLocation={pinLocation}
        setPinLocation={setPinLocation}
        hoveredTract={hoveredTract}
        eligibilityStatus={eligibilityStatus}
        onLocationSelect={onLocationSelect}
        mapClickLoading={mapClickLoading}
        setMapClickLoading={setMapClickLoading}
      />
    </MapWithEvents>
  );
}

function MapWithEvents({ children, onReady }: { children: React.ReactNode; onReady: (map: L.Map) => void }) {
  if (typeof window === "undefined") {
    return null;
  }

  const { MapContainer, TileLayer, WMSTileLayer } = require("react-leaflet");

  return (
    <MapContainer
      center={NYC_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      style={{ height: "450px", width: "100%", borderRadius: "12px" }}
      ref={onReady}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {/* Census TIGERweb WMS: tract boundaries */}
      <WMSTileLayer
        url="https://tigerweb.geo.census.gov/arcgis/services/TIGERweb/tigerWMS_Current/MapServer/WMSServer"
        layers="Tracts"
        format="image/png"
        transparent
        opacity={0.4}
        attribution="&copy; US Census Bureau"
      />
      {children}
    </MapContainer>
  );
}

interface InnerMapProps {
  mapRef: React.MutableRefObject<L.Map | null>;
  qctSet: Set<string> | null;
  pinLocation: [number, number] | null;
  setPinLocation: (loc: [number, number] | null) => void;
  hoveredTract: string | null;
  eligibilityStatus: { isQCT: boolean; isDDA: boolean } | null | undefined;
  onLocationSelect?: (lat: number, lng: number, tract: string, stateFips: string, countyFips: string) => void;
  mapClickLoading: boolean;
  setMapClickLoading: (v: boolean) => void;
}

function LocationMapInner({
  mapRef,
  qctSet,
  pinLocation,
  setPinLocation,
  hoveredTract,
  eligibilityStatus,
  onLocationSelect,
  mapClickLoading,
  setMapClickLoading,
}: InnerMapProps) {
  const [markerEl, setMarkerEl] = useState<any>(null);

  // Setup map click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    async function handleClick(e: any) {
      const { lat, lng } = e.latlng;
      setPinLocation([lat, lng]);
      setMapClickLoading(true);

      try {
        const res = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng }),
        });
        const data = await res.json();

        if (data.matched && onLocationSelect) {
          onLocationSelect(lat, lng, data.tract, data.stateFips, data.countyFips);
        }
      } catch (err) {
        console.error("Reverse geocode failed:", err);
      } finally {
        setMapClickLoading(false);
      }
    }

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [mapRef, onLocationSelect]);

  if (typeof window === "undefined") return null;

  const Marker = require("react-leaflet").Marker;
  const Popup = require("react-leaflet").Popup;
  const Tooltip = require("react-leaflet").Tooltip;

  return (
    <>
      {pinLocation && (
        <Marker position={pinLocation}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-gray-800">Selected Location</p>
              <p className="text-gray-600">Lat: {pinLocation[0].toFixed(4)}</p>
              <p className="text-gray-600">Lng: {pinLocation[1].toFixed(4)}</p>
              {eligibilityStatus && (
                <div className="mt-2 space-y-1 text-xs">
                  <p>
                    QCT:{" "}
                    <span className={eligibilityStatus.isQCT ? "text-green-600 font-semibold" : "text-gray-500"}>
                      {eligibilityStatus.isQCT ? "Yes" : "No"}
                    </span>
                  </p>
                  <p>
                    DDA:{" "}
                    <span className={eligibilityStatus.isDDA ? "text-green-600 font-semibold" : "text-gray-500"}>
                      {eligibilityStatus.isDDA ? "Yes" : "No"}
                    </span>
                  </p>
                </div>
              )}
              {mapClickLoading && <p className="mt-2 text-xs text-blue-500">Looking up eligibility...</p>}
            </div>
          </Popup>
        </Marker>
      )}
      {hoveredTract && pinLocation && (
        <Tooltip position={pinLocation} offset={[0, -20]} direction="top">
          Tract: {hoveredTract}
          {qctSet?.has(hoveredTract) && " (QCT)"}
        </Tooltip>
      )}
    </>
  );
}
