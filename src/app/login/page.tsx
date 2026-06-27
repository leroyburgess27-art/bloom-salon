"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
    if (error) {
      setError(error);
      setBusy(false);
    } else {
      router.push("/studio");
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-bold">Log in</h1>
      <p className="mt-1 text-sm text-gray-500">Welcome back.</p>
      <div className="mt-6 space-y-3">
        <input className="w-full rounded-lg border px-3 py-2" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-lg border px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button onClick={submit} disabled={busy} className="w-full rounded-xl bg-brand px-4 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
          {busy ? "Logging in…" : "Log in"}
        </button>
      </div>
      <p className="mt-4 text-center text-sm text-gray-500">
        New here? <Link href="/signup" className="text-brand underline">Create an account</Link>
      </p>
    </div>
  );
}
