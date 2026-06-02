import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config silences the webpack/turbopack mismatch warning
  // pdfjs-dist works fine under Turbopack without any extra aliasing
  turbopack: {},
};

export default nextConfig;
