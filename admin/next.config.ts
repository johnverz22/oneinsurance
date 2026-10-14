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
