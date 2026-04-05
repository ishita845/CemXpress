// src/hooks/useGeolocation.ts  ← REPLACE YOUR EXISTING FILE WITH THIS
// Same { status, detect } API — no changes needed in pages that use it.

import { useState, useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export type GeoStatus = "idle" | "loading" | "success" | "error";

export interface GeoAddress {
  area:    string;
  city:    string;
  state:   string;
  pincode: string;
  lat:     number;
  lon:     number;
}

async function reverseGeocode(lat: number, lon: number): Promise<GeoAddress | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { headers: { "Accept-Language": "en", "User-Agent": "CemXpress-App/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a    = data.address || {};
    return {
      area:    a.suburb || a.neighbourhood || a.quarter || a.village || a.town || "",
      city:    a.city   || a.town          || a.village || a.county  || "",
      state:   a.state  || "",
      pincode: a.postcode || "",
      lat,
      lon,
    };
  } catch {
    return null;
  }
}

/**
 * @param userId  Optional Firebase UID — if provided, detected lat/lon are
 *                saved to Firestore so the browse page can sort by real distance.
 */
export function useGeolocation(userId?: string) {
  const [status, setStatus] = useState<GeoStatus>("idle");

  const detect = useCallback((): Promise<GeoAddress | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { setStatus("error"); resolve(null); return; }

      setStatus("loading");
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          const geo = await reverseGeocode(coords.latitude, coords.longitude);
          if (!geo) { setStatus("error"); resolve(null); return; }

          setStatus("success");

          // Persist to Firestore
          if (userId) {
            try {
              await updateDoc(doc(db, "users", userId), {
                latitude:  geo.lat,
                longitude: geo.lon,
              });
            } catch { /* non-fatal */ }
          }

          resolve(geo);
        },
        () => { setStatus("error"); resolve(null); },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
      );
    });
  }, [userId]);

  return { status, detect };
}