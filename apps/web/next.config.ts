import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: resolve(__dirname, "../.."),
  outputFileTracingIncludes: {
    "/*": ["../../data/processed/web/catalog.json", "../../data/processed/web/boundaries.json", "../../data/processed/web/facilities.json", "../../data/processed/web/rivers.json"],
  },
  outputFileTracingExcludes: {
    "/*": ["../../data/processed/web/facilities-progress.json", "../../data/processed/web/rivers-preparation/**/*"],
  },
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
};

export default nextConfig;
