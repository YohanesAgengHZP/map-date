import Link from "next/link";
import { Route } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-line bg-cream/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="text-ink flex items-center gap-2 text-base font-semibold"
        >
          <Route size={18} className="text-clay" aria-hidden />
          <span className="font-display">Jalan-Jalan</span>
        </Link>

        <nav aria-label="Primary" className="ml-auto">
          {/* `py-2`: the links rendered 17px tall, short of the 24px minimum
              hit area. Padding rather than a taller font keeps the header. */}
          <ul className="text-ink-soft flex items-center gap-4 text-sm">
            <li>
              <Link
                href="/"
                className="hover:text-clay block px-1 py-2 transition-colors"
              >
                Plans
              </Link>
            </li>
            <li>
              <Link
                href="/saved"
                className="hover:text-clay block px-1 py-2 transition-colors"
              >
                Saved
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
