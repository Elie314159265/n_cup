import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xxx.cloudfront.net",
      },
    ],
  },
  transpilePackages: ["three"],
};

export default nextConfig;
