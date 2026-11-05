import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Not Vercel's own guess (VERCEL_PROJECT_PRODUCTION_URL), which can pick the shorter .uk name.
const siteUrl = process.env.SITE_URL ?? "https://wedesignyoumake.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "We Design You Make: your next job, in their room, before you build it",
  description:
    "3D design for builders and carpenters in Laindon, Basildon and Essex: concept pictures from a room photo, a measured 3D build from a room scan, phone AR and Quest walk-throughs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
