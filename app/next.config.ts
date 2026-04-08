import type { NextConfig } from "next";

const nextConfig: any = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async headers() {
    return [
      {
        // Allow the preview page to be embedded in iframes on any origin
        // (required for the embed.js widget to work on merchant sites)
        source: "/preview",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;

