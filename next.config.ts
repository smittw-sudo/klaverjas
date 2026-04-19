import type { NextConfig } from "next";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// On Vercel: use the community adapter so Next.js 16 output is correctly formatted
// Locally: no adapter needed (next dev / next start work fine)
const nextConfig: NextConfig = process.env.VERCEL ? {
  adapterPath: require.resolve('@next-community/adapter-vercel'),
} : {};

export default nextConfig;
