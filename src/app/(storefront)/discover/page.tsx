import { trendingProviders, listServiceCategories } from "@/lib/db";
import DiscoverResults from "@/components/DiscoverResults";

export const revalidate = 0;

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { q?: string; area?: string; t?: string; mobile?: string; sort?: string };
}) {
  const [providers, categories] = await Promise.all([
    trendingProviders(200),
    listServiceCategories(),
  ]);

  const sort = searchParams.sort;
  return (
    <DiscoverResults
      providers={providers}
      categories={categories}
      initialQuery={searchParams.q ?? ""}
      initialArea={searchParams.area ?? ""}
      initialTreatments={searchParams.t ? searchParams.t.split(",").filter(Boolean) : []}
      initialMobile={searchParams.mobile === "1"}
      initialSort={sort === "rating" || sort === "name" ? sort : "trending"}
    />
  );
}
