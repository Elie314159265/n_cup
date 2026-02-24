import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export", // Static export for S3/CloudFront hosting
  images: {
    unoptimized: true,
    domains: ["xxx.cloudfront.net"], // Replace with actual CloudFront domain
  },
  transpilePackages: ["three"],
};

export default nextConfig;
