/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Static export for S3/CloudFront hosting
  images: {
    unoptimized: true,
    domains: ['xxx.cloudfront.net'],  // Replace with actual CloudFront domain
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/cable',
  },
}

module.exports = nextConfig
