import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // wedesignyoumake.co.uk is the one address: the www and .uk names forward to it (308), path and query kept.
      ...["www.wedesignyoumake.co.uk", "wedesignyoumake.uk", "www.wedesignyoumake.uk"].map((value) => ({
        source: "/:path*",
        has: [{ type: "host" as const, value }],
        destination: "https://wedesignyoumake.co.uk/:path*",
        permanent: true,
      })),
      // A redirect, not a rewrite, so the page's relative font links resolve under /how-it-works/.
      { source: "/how-it-works", destination: "/how-it-works/index.html", permanent: false },
      // shortcut: the June sign-in, dashboard and 3D-result pages stay unreachable until steps 4, 5 and 8 rebuild them;
      // /examples comes back once the showcase pieces are added.
      ...["/login", "/dashboard", "/g/:id", "/examples"].map((source) => ({ source, destination: "/", permanent: false })),
    ];
  },
};

export default nextConfig;
