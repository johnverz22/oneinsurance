/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    return config
  },
  async redirects() {
    return [
      {
        source: '/agent/reset-password',
        destination: '/reset-password',
        permanent: false,
      },
      {
        source: '/forgot-password',
        destination: '/reset-password',
        permanent: false,
      },
    ]
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
