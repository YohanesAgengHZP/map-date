import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `cacheComponents` is off: every page here is static with no server-side data
  // fetching, so it buys nothing, and it blocks `dynamicParams = false` — which
  // is what makes an unknown plan id return a real 404 instead of a 200 shell.
  // No `images.remotePatterns`: every photo is a local asset under public/venues.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
