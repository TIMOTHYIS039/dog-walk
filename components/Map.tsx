"use client";

import { useMemo, useEffect } from "react";
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { RoutePoint, PeePooEvent } from "@/lib/store";

export interface WalkMapProps {
  route: RoutePoint[];
  events: PeePooEvent[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  /** When true, fit bounds to route + events when they change */
  fitBounds?: boolean;
}

// Custom icons for pee/poo so we don't rely on default marker
function peeIcon() {
  return L.icon({
    iconUrl: "data:image/svg+xml," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%2322c55e"><circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="12">P</text></svg>'
    ),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}
function pooIcon() {
  return L.icon({
    iconUrl: "data:image/svg+xml," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%23a16207"><circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="12">S</text></svg>'
    ),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function FitBounds({ route, events }: { route: RoutePoint[]; events: PeePooEvent[] }) {
  const map = useMap();
  const bounds = useMemo(() => {
    const points: [number, number][] = [
      ...route.map((p) => [p.lat, p.lng] as [number, number]),
      ...events.map((e) => [e.lat, e.lng] as [number, number]),
    ];
    if (points.length === 0) return null;
    return L.latLngBounds(points);
  }, [route, events]);

  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
    }
  }, [map, bounds]);
  return null;
}

export default function WalkMap({
  route,
  events,
  center = [37.7749, -122.4194],
  zoom = 13,
  className = "",
  fitBounds = false,
}: WalkMapProps) {
  const polylinePositions = useMemo(
    () => route.map((p) => [p.lat, p.lng] as [number, number]),
    [route]
  );

  const defaultCenter = useMemo(() => {
    if (route.length > 0) {
      const last = route[route.length - 1];
      return [last.lat, last.lng] as [number, number];
    }
    if (events.length > 0) {
      return [events[0].lat, events[0].lng] as [number, number];
    }
    return center;
  }, [route, events, center]);

  return (
    <div className={className}>
      <LeafletMapContainer
        center={defaultCenter}
        zoom={zoom}
        className="h-full w-full rounded-lg z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {polylinePositions.length >= 2 && (
          <Polyline positions={polylinePositions} color="#3b82f6" weight={4} />
        )}
        {events.map((ev) => (
          <Marker
            key={ev.id}
            position={[ev.lat, ev.lng]}
            icon={ev.type === "pee" ? peeIcon() : pooIcon()}
          >
            <Popup>
              <span className="capitalize">{ev.type}</span>
              {" · "}
              {new Date(ev.timestamp).toLocaleTimeString()}
            </Popup>
          </Marker>
        ))}
        {fitBounds && (route.length > 0 || events.length > 0) && (
          <FitBounds route={route} events={events} />
        )}
      </LeafletMapContainer>
    </div>
  );
}
