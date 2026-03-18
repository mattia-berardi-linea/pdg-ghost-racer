import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack (Next.js 16 default) handles mapbox-gl without custom webpack config.
  // Silence the "no turbopack config" warning with an empty turbopack object.
  turbopack: {},
};

export default nextConfig;
