import { stylistsWithSummary } from "@/lib/db";

export const revalidate = 0; // always fetch fresh from the database

export default async function AdminStylists() {
  const stylists = await stylistsWithSummary();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Stylists</h1>
      <p className="mb-6 text-sm text-gray-500">
        Your team, loaded from the database. Working hours: Tue–Sat, 09:00–17:00.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stylists.map((s) => (
          <div key={s.id} className="rounded-xl border bg-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light font-bold text-brand">
              {s.name.charAt(0)}
            </div>
            <div className="mt-3 font-semibold">{s.name}</div>
            <p className="mt-1 text-sm text-gray-600">{s.bio}</p>
            <div className="mt-3 text-xs text-gray-500">
              {s.serviceCount} services{s.categories.length ? ` · ${s.categories.join(", ")}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
