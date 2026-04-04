import type { NextConfig } from "next";

const nextConfig: any = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
