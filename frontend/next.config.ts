import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd ? '/climprotocol' : '',
  assetPrefix: isProd ? '/climprotocol/' : '',
};

export default nextConfig;
