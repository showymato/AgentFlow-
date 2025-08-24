/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@agentflow/ui', '@agentflow/engine'],
  experimental: {
    optimizePackageImports: ['reactflow']
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
