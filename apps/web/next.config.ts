import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: resolve(__dirname, "../.."),
  outputFileTracingIncludes: {
    "/*": ["../../data/processed/web/catalog.json", "../../data/processed/web/boundaries.json", "../../data/processed/web/facilities.json"],
  },
  outputFileTracingExcludes: {
    "/*": ["../../data/processed/web/facilities-progress.json"],
  },
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
};

export default nextConfig;
