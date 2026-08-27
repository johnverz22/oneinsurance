import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  // rewrites: async () => [
  //   {
  //     source: '/api/:path*',
  //     destination: 'https://insurance-dev.intel-soln.com.ph/api/:path*',
  //   },
  // ],
  // reactStrictMode: false,

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  images: {
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
}

export default nextConfig
