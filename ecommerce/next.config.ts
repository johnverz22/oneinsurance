import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Hide the on-screen dev indicator so it can't overlap the mobile UI.
  devIndicators: false,

  // rewrites: async () => [
  //   {
  //     source: '/api/:path*',
  //     destination: 'https://insurance-dev.intel-soln.com.ph/api/:path*',
  //   },
  // ],
  // reactStrictMode: false,

  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dev-one-insurance.intel-soln.com.ph',
      },
      {
        protocol: 'https',
        hostname: 'dzv00tuelpzbp.cloudfront.net',
      },
    ],
  },

  // Turbopack is the default in Next.js 16.
  turbopack: {
    resolveAlias: {
      // @techstark/opencv-js (via @paddleocr/paddleocr-js) contains
      // `require("fs")`, `require("path")`, and `require("crypto")` behind
      // runtime Node-environment guards.  Turbopack still resolves them at
      // build time for browser bundles, so we stub them with an empty module.
      fs: { browser: './src/lib/empty-module.ts' },
      path: { browser: './src/lib/empty-module.ts' },
      crypto: { browser: './src/lib/empty-module.ts' },
      // The paddleocr worker-entry uses `new URL("ort.bundle.min.mjs", import.meta.url)`
      // which Turbopack tries to resolve as a module.  Stub it as well.
      'ort.bundle.min.mjs': { browser: './src/lib/empty-module.ts' },
    },
  },

  // ── Long-lived caching for self-hosted WASM and model files ─────────────────
  async headers() {
    return [
      {
        source: '/ort/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/models/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default nextConfig
