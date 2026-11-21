import type { NextConfig } from "next";

// GitHub Pages build: a static export served from a sub-path (/<repo-name>), without server routes.
// Set by the Pages workflow; local development and "next build" stay a normal server app.
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  ...(isStaticExport ? { output: "export", trailingSlash: true, images: { unoptimized: true } } : {}),
  env: { NEXT_PUBLIC_STATIC_EXPORT: isStaticExport ? "1" : "" },
  // Partial prerendering needs a server, so these two are off for the static export
  ...(isStaticExport ? {} : { cacheComponents: true, partialPrefetching: true }),
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
