"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Route } from "lucide-react";
import { cx } from "./ui";

/**
 * A client component for one reason: marking the page you are on. Two links
 * with nothing to say which is current is a small thing to look at and a real
 * one to navigate without sight.
 */
export function SiteHeader() {
  const pathname = usePathname();
  // A plan page is reached from Plans and goes back to it, so it counts as
  // Plans. `/saved` is the only other branch.
  const current = pathname?.startsWith("/saved") ? "/saved" : "/";

  return (
    <header className="border-line bg-cream/90 sticky top-0 z-40 border-b backdrop-blur">
      {/* Parked above the viewport rather than `sr-only`, because
          `not-sr-only` zeroes padding as it restores the box, which left the
          revealed link 20px tall — under the minimum target size it exists to
          serve. Moving it keeps its padding the whole time. */}
      <a
        href="#main"
        className="bg-clay absolute top-2 left-4 z-50 -translate-y-24 rounded-full px-4 py-2 text-sm font-medium text-white transition-transform focus:translate-y-0"
      >
        Skip to the page
      </a>
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
            {[
              { href: "/", label: "Plans" },
              { href: "/saved", label: "Saved" },
            ].map(({ href, label }) => {
              const here = current === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={here ? "page" : undefined}
                    // Underlined as well as recoloured: colour alone is not a
                    // distinction everyone can see.
                    className={cx(
                      "hover:text-clay block px-1 py-2 transition-colors",
                      here &&
                        "text-ink font-medium underline decoration-[var(--color-clay)] decoration-2 underline-offset-[6px]",
                    )}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
