"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await signUp(email.trim(), password);
    if (error) {
      setError(error);
      setBusy(false);
    } else {
      router.push("/join");
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-gray-500">Set up your booking page in minutes.</p>
      <div className="mt-6 space-y-3">
        <input className="w-full rounded-lg border px-3 py-2" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-lg border px-3 py-2" placeholder="Password (min 6 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button onClick={submit} disabled={busy} className="w-full rounded-xl bg-brand px-4 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
          {busy ? "Creating…" : "Sign up"}
        </button>
      </div>
      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account? <Link href="/login" className="text-brand underline">Log in</Link>
      </p>
    </div>
  );
}
