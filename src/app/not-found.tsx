import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-3xl">This page isn&apos;t here</h1>
        <p className="text-ink-soft mt-2 text-sm">
          Either the link is wrong or the plan is gone.
        </p>
        <Link
          href="/"
          className="bg-clay hover:bg-clay-dark mt-6 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors"
        >
          Back to the plans
        </Link>
      </main>
    </>
  );
}
