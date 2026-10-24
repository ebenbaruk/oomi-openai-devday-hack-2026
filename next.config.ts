import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page reads live data (journal, sessions): no build-time prerendering of app data.
  cacheComponents: false,
  // The simulator needs the microphone; nothing else is allowed.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "Permissions-Policy", value: "microphone=(self), camera=()" }] }];
  },
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
