"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import GpsTracker from "@/components/GpsTracker";
import type { Walk } from "@/lib/store";

const WalkMap = dynamic(() => import("@/components/Map"), { ssr: false });

export default function WalkPage() {
  const params = useParams();
  const router = useRouter();
  const code = typeof params.code === "string" ? params.code : "";
  const [walk, setWalk] = useState<Walk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ending, setEnding] = useState(false);

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

  async function recordPeePoo(type: "pee" | "poo") {
    if (!code || !walk || walk.status !== "active") return;
    setError("");
    return new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          try {
            const res = await fetch(`/api/walks/${encodeURIComponent(code)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event: { type, lat, lng, timestamp: Date.now() },
              }),
            });
            if (!res.ok) throw new Error("Failed to record");
            const data = await res.json();
            setWalk(data);
            resolve();
          } catch {
            setError(`Failed to record ${type}`);
            reject();
          }
        },
        () => {
          setError("Could not get your location");
          reject();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  }

  async function handleEndWalk() {
    if (!code || !walk || walk.status !== "active") return;
    setEnding(true);
    setError("");
    try {
      const res = await fetch(`/api/walks/${encodeURIComponent(code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error("Failed to end walk");
      const data = await res.json();
      setWalk(data);
    } catch {
      setError("Failed to end walk");
    } finally {
      setEnding(false);
    }
  }

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
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-blue-600 hover:underline"
        >
          Back to home
        </button>
      </main>
    );
  }

  const ownerUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/owner/${code}`
      : `/owner/${code}`;

  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Walker</h1>
          <p className="text-sm text-slate-600">
            Code: <span className="font-mono font-medium">{code}</span>
          </p>
        </div>
        <div className="text-sm text-slate-600">
          <p className="font-medium text-slate-700">Share with owner:</p>
          <a
            href={ownerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {ownerUrl}
          </a>
        </div>
      </header>

      {walk?.status === "active" && <GpsTracker walkCode={code} onError={setError} />}

      <div className="flex-1 min-h-[300px] relative">
        <WalkMap
          route={walk?.route ?? []}
          events={walk?.events ?? []}
          className="absolute inset-0"
        />
      </div>

      <div className="bg-white border-t border-slate-200 p-4 space-y-3">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 py-2 px-3 rounded-lg">
            {error}
          </p>
        )}

        {walk?.status === "active" ? (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => recordPeePoo("pee")}
                className="flex-1 py-3 px-4 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
              >
                Record Pee
              </button>
              <button
                type="button"
                onClick={() => recordPeePoo("poo")}
                className="flex-1 py-3 px-4 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700"
              >
                Record Poo
              </button>
            </div>
            <button
              type="button"
              onClick={handleEndWalk}
              disabled={ending}
              className="w-full py-3 px-4 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ending ? "Ending…" : "End walk"}
            </button>
          </>
        ) : (
          <p className="text-slate-600 text-center py-2">
            This walk has ended. Share the owner link for a full review.
          </p>
        )}
      </div>
    </main>
  );
}
