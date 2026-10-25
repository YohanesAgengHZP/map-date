import { notFound } from "next/navigation";
import { BuiltInPlan } from "@/components/BuiltInPlan";
import { SiteHeader } from "@/components/SiteHeader";
import { PLANS, getPlan } from "@/data/plans";

export function generateStaticParams() {
  return PLANS.map((p) => ({ id: p.id }));
}

/** Every plan is known at build time, so an unknown id 404s at the router. */
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/plan/[id]">) {
  const { id } = await params;
  const plan = getPlan(id);
  if (!plan) return { title: "Plan not found · Jalan-Jalan" };
  return {
    title: `${plan.title} · Jalan-Jalan`,
    description: plan.description,
  };
}

export default async function PlanPage({ params }: PageProps<"/plan/[id]">) {
  const { id } = await params;
  const plan = getPlan(id);
  if (!plan) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16">
        <BuiltInPlan plan={plan} />
      </main>
    </>
  );
}
