import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

loadEnv({ path: path.join(__dirname, ".env") });

const authSecret = process.env.AUTH_SECRET ?? "";
const ssoSecret = process.env.SSO_SECRET ?? "";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextBasePath = (process.env.NEXT_BASE_PATH || "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // EC2 path deploy: NEXT_BASE_PATH=/pnl (empty for local :3000 root)
  ...(nextBasePath ? { basePath: nextBasePath } : {}),
  // Standalone is for Docker/ECS only — leave unset for EC2 next start.
  ...(process.env.STANDALONE ? { output: "standalone" as const } : {}),
  outputFileTracingRoot: path.join(__dirname, "."),
  // Force AUTH_SECRET and SSO_SECRET into Edge middleware (fixes JWT and SSO verification).
  env: {
    AUTH_SECRET: authSecret,
    SSO_SECRET: ssoSecret,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Small EC2 OOMs on "Checking validity of types" — skip so production build can finish.
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
