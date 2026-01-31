"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { Walk } from "@/lib/store";

const WalkMap = dynamic(() => import("@/components/Map"), { ssr: false });

const POLL_INTERVAL_MS = 2500;

export default function OwnerPage() {
  const params = useParams();
  const code = typeof params.code === "string" ? params.code : "";
  const [walk, setWalk] = useState<Walk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWalk = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`/api/walks/${encodeURIComponent(code)}`);
      if (res.status === 404) {
        setError("Walk not found");
        setWalk(null);
        return;
      }
      const data = await res.json();
      setWalk(data);
      setError("");
    } catch {
      setError("Failed to load walk");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchWalk();
  }, [fetchWalk]);

  useEffect(() => {
    if (!code || !walk || walk.status !== "active") return;
    const interval = setInterval(fetchWalk, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [code, walk?.status, fetchWalk]);

  if (!code) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-slate-600">Missing walk code</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-slate-600">Loading walk…</p>
      </main>
    );
  }

  if (error && !walk) {
    return (
      <main className="min-h-screen p-6 flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error}</p>
        <a href="/" className="text-blue-600 hover:underline">
          Back to home
        </a>
      </main>
    );
  }

  const isActive = walk?.status === "active";

  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Owner view</h1>
          <p className="text-sm text-slate-600">
            Walk code: <span className="font-mono font-medium">{code}</span>
          </p>
        </div>
        <div>
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-800 text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 text-sm font-medium">
              Walk completed
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-[400px] relative">
        <WalkMap
          route={walk?.route ?? []}
          events={walk?.events ?? []}
          className="absolute inset-0"
          fitBounds={true}
        />
      </div>

      <footer className="bg-white border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
        {walk && (
          <p>
            Route points: {walk.route.length} · Pee:{" "}
            {walk.events.filter((e) => e.type === "pee").length} · Poo:{" "}
            {walk.events.filter((e) => e.type === "poo").length}
            {walk.endedAt &&
              ` · Ended ${new Date(walk.endedAt).toLocaleString()}`}
          </p>
        )}
      </footer>
    </main>
  );
}
