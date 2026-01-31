"use client";

import { useEffect, useRef } from "react";

const INTERVAL_MS = 8000;

export interface GpsTrackerProps {
  walkCode: string;
  onError?: (message: string) => void;
}

export default function GpsTracker({ walkCode, onError }: GpsTrackerProps) {
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const MIN_INTERVAL_MS = 5000;
  const MIN_MOVE_METERS = 10;

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      onError?.("Geolocation is not supported by your browser.");
      return;
    }

    function sendRoutePoint(lat: number, lng: number) {
      const timestamp = Date.now();
      fetch(`/api/walks/${encodeURIComponent(walkCode)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routePoint: { lat, lng, timestamp },
        }),
      }).catch(() => {
        onError?.("Failed to send location.");
      });
    }

    function shouldSend(lat: number, lng: number): boolean {
      const now = Date.now();
      const last = lastSentRef.current;
      if (!last) return true;
      if (now - last.time < MIN_INTERVAL_MS) return false;
      const dLat = (lat - last.lat) * 111320;
      const dLng = (lng - last.lng) * 111320 * Math.cos((lat * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      return dist >= MIN_MOVE_METERS;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        if (!shouldSend(lat, lng)) return;
        lastSentRef.current = { lat, lng, time: Date.now() };
        sendRoutePoint(lat, lng);
      },
      (err) => {
        onError?.(
          err.message || "Unable to get your location. Check permissions."
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: INTERVAL_MS,
        timeout: 10000,
      }
    );

    const interval = setInterval(() => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          if (!shouldSend(lat, lng)) return;
          lastSentRef.current = { lat, lng, time: Date.now() };
          sendRoutePoint(lat, lng);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: INTERVAL_MS, timeout: 5000 }
      );
    }, INTERVAL_MS);

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      clearInterval(interval);
    };
  }, [walkCode, onError]);

  return null;
}
