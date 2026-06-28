"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getReviewContext, submitReview, type ReviewContext } from "@/lib/db";
import { BRAND } from "@/lib/brand";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6 text-center text-lg font-extrabold tracking-tight text-brand">{BRAND}</div>
      {children}
    </div>
  );
}

export default function ReviewPage({ params }: { params: { bookingId: string } }) {
  const [ctx, setCtx] = useState<ReviewContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReviewContext(params.bookingId)
      .then(setCtx)
      .catch(() => setCtx(null))
      .finally(() => setLoading(false));
  }, [params.bookingId]);

  async function submit() {
    if (rating < 1) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitReview(params.bookingId, rating, comment);
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? "Couldn't submit your review. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading) return <Shell><p className="text-center text-gray-500">Loading…</p></Shell>;

  if (!ctx) {
    return (
      <Shell>
        <p className="text-center text-gray-500">We couldn&apos;t find that booking.</p>
      </Shell>
    );
  }

  if (done || ctx.alreadyReviewed) {
    return (
      <Shell>
        <div className="rounded-2xl border bg-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl">✓</div>
          <h1 className="text-lg font-bold">{done ? "Thank you!" : "Already reviewed"}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {done
              ? `Thanks for reviewing ${ctx.providerName} — it helps other clients book with confidence.`
              : "This booking has already been reviewed."}
          </p>
          <Link
            href={`/p/${ctx.providerSlug}`}
            className="mt-5 inline-block rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            View {ctx.providerName}&apos;s page
          </Link>
        </div>
      </Shell>
    );
  }

  if (ctx.status !== "completed") {
    return (
      <Shell>
        <div className="rounded-2xl border bg-white p-6 text-center">
          <h1 className="text-lg font-bold">Not just yet</h1>
          <p className="mt-1 text-sm text-gray-600">
            You can leave a review once your appointment with {ctx.providerName} is completed.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="rounded-2xl border bg-white p-6">
        <h1 className="text-lg font-bold">How was your {ctx.serviceName ?? "appointment"}?</h1>
        <p className="mt-1 text-sm text-gray-600">Leave a review for {ctx.providerName}.</p>

        <div className="mt-5 flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              className={`text-4xl leading-none transition ${
                (hover || rating) >= n ? "text-amber-400" : "text-gray-300"
              }`}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Anything you'd like to add? (optional)"
          className="mt-5 w-full rounded-lg border px-3 py-2 text-sm"
        />

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          onClick={submit}
          disabled={rating < 1 || submitting}
          className="mt-4 w-full rounded-xl bg-brand px-4 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-40"
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </Shell>
  );
}
