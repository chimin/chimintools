import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/chimintools',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
