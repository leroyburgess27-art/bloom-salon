import Link from "next/link";
import { servicesByCategory } from "@/lib/db";
import { zar, duration } from "@/lib/format";

export const revalidate = 0; // always fetch fresh catalogue

export default async function CatalogPage() {
  const groups = await servicesByCategory();

  return (
    <div>
      <section className="mb-8 rounded-2xl bg-brand-light p-6">
        <h1 className="text-2xl font-bold text-brand-dark">Book your appointment</h1>
        <p className="mt-1 text-gray-700">
          Browse our hair &amp; nail services, choose your stylist and a time that suits you.
        </p>
      </section>

      {groups.map((group) => (
        <section key={group.category} className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">{group.category}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.items.map((s) => (
              <div
                key={s.id}
                className="flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm"
              >
                <div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="mt-1 text-sm text-gray-600">{s.description}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {duration(s.durationMinutes)} · {zar(s.price)}
                  </div>
                  <Link
                    href={`/book/${s.id}`}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
                  >
                    Book
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
