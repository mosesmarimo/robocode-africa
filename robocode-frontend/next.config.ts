import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Browser calls to /api/v1/* are proxied to the standalone backend so the
  // rc_session cookie stays same-origin. Server components/actions call the
  // backend directly via the API client (see src/lib/api/client.ts).
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${BACKEND_URL}/:path*` }];
  },
};

export default nextConfig;
