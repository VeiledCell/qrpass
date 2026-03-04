"use client";

import { useState, useCallback } from "react";

interface AmbientContext {
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
    city: string;
  };
}

export function useAmbientContext() {
  const [loading, setLoading] = useState(false);

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
        { headers: { 'User-Agent': 'qrPass-PWA' } }
      );
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || "Unknown City";
      const state = data.address?.state || "";
      return state ? `${city}, ${state}` : city;
    } catch (error) {
      console.error("Geocoding Error:", error);
      return "Unknown Location";
    }
  };

  const captureContext = useCallback(async (): Promise<AmbientContext> => {
    setLoading(true);
    const context: AmbientContext = {
      timestamp: new Date(),
    };

    if (!navigator.geolocation) {
      setLoading(false);
      return context;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          enableHighAccuracy: false
        });
      });

      const { latitude, longitude } = position.coords;
      const cityString = await reverseGeocode(latitude, longitude);

      context.location = {
        lat: latitude,
        lng: longitude,
        city: cityString,
      };
    } catch (error) {
      console.warn("Location permission denied or timed out. Falling back to timestamp only.");
    } finally {
      setLoading(false);
    }

    return context;
  }, []);

  return { captureContext, loading };
}
