import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Git repo root (…/ISMISM_Wiki/ismism-wiki-app → ../..) for correct serverless file tracing on Vercel monorepos.
  outputFileTracingRoot: path.join(process.cwd(), "..", ".."),
};

export default nextConfig;
