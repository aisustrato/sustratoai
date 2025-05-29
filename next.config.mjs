/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },
  // Optimización de la compilación
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui', 'lucide-react'],
  },
  // Mejoras en el rendimiento
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // Configuración de cabeceras de seguridad y CORS
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Seguridad
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
            value: '1; mode=block',
          },
          // CORS
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
  // Configuración de CORS para rutas de API
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        has: [
          {
            type: 'host',
            value: '(?<host>.*)',
          },
        ],
        destination: '/api/:path*',
      },
    ];
  },
}

export default nextConfig
