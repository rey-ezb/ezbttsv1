import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const query = new URLSearchParams();

  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
      return;
    }
    if (value !== undefined) {
      query.set(key, value);
    }
  });

  const target = query.toString() ? `/planner.html?${query.toString()}` : "/planner.html";
  redirect(target);
}
