// next.config.js
const { withSentryConfig } = require("@sentry/nextjs");

// Content Security Policy directives
// Note: 'unsafe-inline' is required for script-src because Next.js injects
// hydration scripts and __NEXT_DATA__ inline. 'unsafe-inline' is required for
// style-src because Tailwind CSS and next/font inject inline styles.
// These cannot be removed without breaking the application.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://accounts.google.com https://www.googleapis.com https://*.sentry.io",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://avatars.githubusercontent.com https://salonixpro.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://api-m.paypal.com https://api-m.sandbox.paypal.com https://www.googleapis.com https://oauth2.googleapis.com https://api.cloudinary.com https://*.sentry.io https://*.ingest.sentry.io https://*.upstash.io",
  "frame-src 'self' https://www.google.com",
  "frame-ancestors 'none'",
  "worker-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'avatars.githubusercontent.com', 'res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // Strip comments from production JS bundles (addresses ZAP "Information Disclosure - Suspicious Comments")
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  async headers() {
    return [
      // Global security headers for all routes
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '0',  // Disabled: modern CSP supersedes this; XSS-Protection can introduce vulnerabilities
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      // CORS is handled dynamically in middleware.ts to support both
      // https://salonixpro.com and https://www.salonixpro.com origins.
      // Cache-control for robots.txt (1 hour)
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
        ],
      },
      // Cache-control for sitemap (1 hour)
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
        ],
      },
      // Cache-control for static assets (1 year, immutable)
      {
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache-control for manifest
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400',
          },
        ],
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
});
