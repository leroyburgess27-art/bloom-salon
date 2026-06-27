"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyStudioRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/studio");
  }, [router]);
  return <div className="p-10 text-center text-gray-500">Redirecting…</div>;
}
