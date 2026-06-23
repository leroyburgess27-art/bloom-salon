import { servicesByCategory } from "@/lib/db";
import { zar, duration } from "@/lib/format";

export const revalidate = 0; // always fetch fresh from the database

export default async function AdminServices() {
  const groups = await servicesByCategory();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Services</h1>
      <p className="mb-6 text-sm text-gray-500">
        Your service catalogue, loaded from the database. (Editing comes in the DEV phase.)
      </p>

      {groups.map((group) => (
        <section key={group.category} className="mb-8">
          <h2 className="mb-3 font-semibold">{group.category}</h2>
          <div className="overflow-hidden rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Service</th>
                  <th className="px-4 py-2 font-medium">Duration</th>
                  <th className="px-4 py-2 font-medium">Price</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {group.items.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.description}</div>
                    </td>
                    <td className="px-4 py-2">{duration(s.durationMinutes)}</td>
                    <td className="px-4 py-2">{zar(s.price)}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
