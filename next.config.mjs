import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb", // for logo uploads via server actions
    },
    // PDF routes read embedded TTFs from disk (lib/pdf/fonts.ts); file tracing
    // can't see fs paths, so include them explicitly or Vercel ships without.
    outputFileTracingIncludes: {
      "/app/receipts/[id]/pdf": ["./lib/pdf/fonts/**"],
      "/app/invoices/[id]/pdf": ["./lib/pdf/fonts/**"],
      "/r/[shareId]/pdf": ["./lib/pdf/fonts/**"],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
};

// Wrap with Sentry only if DSN is configured (avoids noisy build warnings locally).
const sentryEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
    })
  : nextConfig;
