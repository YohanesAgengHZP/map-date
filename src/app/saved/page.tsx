import Link from "next/link";
import { SavedClient } from "@/components/SavedClient";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = { title: "Saved · Jalan-Jalan" };

export default function SavedPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-3xl">Saved places</h1>
        <p className="text-ink-soft mt-2 max-w-xl text-sm">
          Places you tapped the heart on. They live in this browser only, so
          clearing it will lose them.
        </p>
        <SavedClient />
        {/* `py-1.5`: it rendered 20px tall, under the 24px a standalone
            pointer target needs. */}
        <Link
          href="/"
          className="text-clay mt-8 inline-block py-1.5 text-sm hover:underline"
        >
          ← Back to the plans
        </Link>
      </main>
    </>
  );
}
