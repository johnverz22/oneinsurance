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

  env: {
    BASE_URL: process.env.BASE_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
      },
    ],
  },
}

export default nextConfig
