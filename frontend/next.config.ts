import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable static export for Capacitor compatibility
  // Note: This requires the app to work without server-side features
  // If you need SSR/API routes, consider using a different approach
  output: process.env.CAPACITOR_BUILD === 'true' ? 'export' : undefined,
  // Ensure proper asset paths for mobile
  images: {
    unoptimized: process.env.CAPACITOR_BUILD === 'true',
  },
};

export default nextConfig;
