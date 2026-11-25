import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: resolve(__dirname, "../.."),

  turbopack: {
    root: resolve(__dirname, "../.."),
  },

  // Proxy request Next.js ke FastAPI VPS
  async rewrites() {
    const origin = (process.env.BEJIR_API_URL || "http://80.43.0.180:8000").replace(/\/+$/, "");
    return {
      beforeFiles: [
        // Keep local aggregation, geometry filtering and AI grounding behind the same public prefix.
        { source: "/backend/web/:path*", destination: "/api/:path*" },
        { source: "/backend/api/v1/:path*", destination: "/api/backend/api/v1/:path*" },
      ],
      afterFiles: [],
      fallback: [{ source: "/backend/:path*", destination: `${origin}/:path*` }],
    };
  },
};

export default nextConfig;
