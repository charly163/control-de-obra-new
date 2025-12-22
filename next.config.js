/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      resolveExtension: ['.tsx', '.ts', '.jsx', '.js', '.mdx'],
    },
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'eval-source-map'
    }
    return config
  }
}

module.exports = nextConfig
