import React, { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Loader2, Navigation, Search, X } from "lucide-react";
import { GeoAddress } from "../hooks/useGeolocation";

const NOMINATIM_HEADERS = { "Accept-Language": "en", "User-Agent": "CemXpress/1.0" };

async function forwardGeocode(q: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=in`,
      { headers: NOMINATIM_HEADERS }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch { return null; }
}

async function reverseGeocode(lat: number, lon: number): Promise<GeoAddress | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { headers: NOMINATIM_HEADERS }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    return {
      area:    a.suburb || a.neighbourhood || a.quarter || a.hamlet || a.village || a.town || "",
      city:    a.city   || a.town          || a.village || a.county || "",
      state:   a.state  || "",
      pincode: a.postcode || "",
      display: [a.suburb || a.neighbourhood || "", a.city || a.town || "", a.state || ""].filter(Boolean).join(", "),
      latitude:  lat,
      longitude: lon,
    };
  } catch { return null; }
}

interface LocationBarProps {
  onLocationChange: (geo: GeoAddress) => void;
  initialDisplay?: string;
}

export default function LocationBar({ onLocationChange, initialDisplay }: LocationBarProps) {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState(initialDisplay || "Set your location");
  const [searchText, setSearchText] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync display when parent updates initialDisplay
  useEffect(() => {
    if (initialDisplay) setDisplay(initialDisplay);
  }, [initialDisplay]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setError("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-focus input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setError("GPS not supported by your browser");
      return;
    }
    setDetecting(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setDetecting(false);
        if (geo) {
          setDisplay(geo.display || "Your location");
          onLocationChange(geo);
          setOpen(false);
        } else {
          setError("Could not determine your address");
        }
      },
      (err) => {
        setDetecting(false);
        setError(err.code === 1 ? "Location permission denied" : "Could not get your location");
      },
      { timeout: 10000 }
    );
  };

  const handleManualSearch = async () => {
    const q = searchText.trim();
    if (!q) return;
    setSearching(true);
    setError("");
    const coords = await forwardGeocode(q);
    if (!coords) {
      setSearching(false);
      setError("Location not found. Try a more specific search.");
      return;
    }
    const geo = await reverseGeocode(coords.lat, coords.lon);
    setSearching(false);
    if (geo) {
      const label = geo.display || q;
      setDisplay(label);
      onLocationChange(geo);
      setOpen(false);
      setSearchText("");
    } else {
      // Use coords directly with search text as display
      onLocationChange({
        area: q, city: q, state: "", pincode: "",
        display: q, latitude: coords.lat, longitude: coords.lon,
      });
      setDisplay(q);
      setOpen(false);
      setSearchText("");
    }
  };

  const handleManualKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleManualSearch();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 transition-colors max-w-[220px]"
      >
        <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
        <span className="truncate">{display}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Set Location</p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* GPS detect */}
          <button
            onClick={handleDetectGPS}
            disabled={detecting}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 rounded-xl text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-60 mb-3"
          >
            {detecting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Navigation className="w-4 h-4" />}
            {detecting ? "Detecting location…" : "Use my current location"}
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span>or search manually</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Manual search */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleManualKeyDown}
              placeholder="e.g. Dwarka, Delhi"
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              onClick={handleManualSearch}
              disabled={searching || !searchText.trim()}
              className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}