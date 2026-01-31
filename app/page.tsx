"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStartWalk() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/walks", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start walk");
      router.push(`/walk/${data.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleViewAsOwner(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter a walk code");
      return;
    }
    setError("");
    router.push(`/owner/${trimmed}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">Dog Walk Tracker</h1>
          <p className="mt-2 text-slate-600">
            Track the route and pee/poo for today&apos;s walk.
          </p>
        </div>

        <div className="space-y-6 rounded-xl bg-white p-6 shadow-md border border-slate-200">
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              I&apos;m the Walker
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Start a walk to record GPS route and pee/poo events. Share the
              owner link so they can watch live.
            </p>
            <button
              type="button"
              onClick={handleStartWalk}
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Starting…" : "Start a walk"}
            </button>
          </section>

          <hr className="border-slate-200" />

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              I&apos;m the Owner
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Enter the walk code to watch the route live or review a completed
              walk.
            </p>
            <form onSubmit={handleViewAsOwner} className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                maxLength={6}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="py-2 px-4 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-800"
              >
                View walk
              </button>
            </form>
          </section>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 py-2 px-3 rounded-lg">
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
