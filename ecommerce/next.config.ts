import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'developers.oneinsurance.shop',
      },
      {
        protocol: 'https',
        hostname: 'stage-api.oneinsurance.shop',
      },
      {
        protocol: 'https',
        hostname: 'stage-ifrc-igw.oneinsurance.shop',
      },
      {
        protocol: 'https',
        hostname: 'dzv00tuelpzbp.cloudfront.net',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false }
    }
    return config
  },
  async headers() {
    const immutable = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
    return [
      { source: '/ort/:path*', headers: immutable },
      { source: '/models/:path*', headers: immutable },
    ]
  },
}

export default nextConfig
