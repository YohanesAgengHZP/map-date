import { Suspense } from "react";
import { MyPlanClient } from "@/components/MyPlanClient";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = { title: "Your plan · Jalan-Jalan" };

export default function MyPlanPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16">
        {/* useSearchParams needs a boundary for this route to stay static. */}
        <Suspense>
          <MyPlanClient />
        </Suspense>
      </main>
    </>
  );
}
