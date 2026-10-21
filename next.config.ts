import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Renderização dinâmica padrão: todas as telas dependem de sessão e RLS.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.b-cdn.net" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
