import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jalan-Jalan · afternoons around Jogja",
  description:
    "A few worked-out afternoons around Jogja: where to go, how long it takes, and what the place actually looks like.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="bg-cream text-ink flex min-h-full flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
