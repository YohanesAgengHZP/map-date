import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `cacheComponents` is off: every page here is static with no server-side data
  // fetching, so it buys nothing, and it blocks `dynamicParams = false` — which
  // is what makes an unknown plan id return a real 404 instead of a 200 shell.
  // No `images` config: the only pictures are the five mood illustrations in
  // `public/moods/`, served as plain `img` at the size they were built for, so
  // `next/image` is not used anywhere. See the venue data note in the README.
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
