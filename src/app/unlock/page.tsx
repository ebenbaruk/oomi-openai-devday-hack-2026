"use client";

import Image from "next/image";
import { useState } from "react";

export default function UnlockPage() {
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "wrong">("idle");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setState("checking");
    const response = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!response.ok) {
      setState("wrong");
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.href = next?.startsWith("/") ? next : "/";
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream-100 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[32px] bg-white/80 p-8 text-center shadow-card">
        <Image src="/brand/oomi-mascot.png" alt="" width={80} height={80} className="mx-auto h-20 w-20 animate-float rounded-3xl" />
        <h1 className="mt-5 font-display text-3xl font-semibold text-navy-900">Hi there!</h1>
        <p className="mt-1 text-navy-700">Enter the team access code to meet Oomi.</p>
        <label htmlFor="code" className="sr-only">
          Access code
        </label>
        <input
          id="code"
          type="password"
          autoComplete="current-password"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setState("idle");
          }}
          className={`mt-6 w-full rounded-full border-2 bg-cream-50 px-5 py-3 text-center outline-none transition ${state === "wrong" ? "animate-wiggle border-coral-400" : "border-cream-200 focus:border-mint-400"}`}
          placeholder="Access code"
        />
        {state === "wrong" && <p className="mt-2 text-sm text-coral-600">Hmm, that&apos;s not the right code.</p>}
        <button
          type="submit"
          disabled={!code || state === "checking"}
          className="mt-5 w-full rounded-full bg-coral-500 py-3 font-display text-lg font-semibold text-white shadow-soft transition hover:bg-coral-600 disabled:opacity-50"
        >
          {state === "checking" ? "Checking…" : "Let's explore"}
        </button>
      </form>
    </main>
  );
}
