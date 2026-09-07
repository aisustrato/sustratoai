const { withWorkflow } = require('workflow/next')
const createNextIntlPlugin = require('next-intl/plugin')

// 🔧 CAUSA RAÍZ del error "Couldn't find next-intl config file" (visto en
// build para paginas estaticas y en runtime para /datos-maestros/proyecto
// ya forzada a dynamic): este plugin NUNCA estuvo conectado al config de
// Next.js. Sin él, next-intl depende de su auto-detección de respaldo de
// `i18n/request.ts`, que no es confiable en todos los contextos de
// renderizado. Con el plugin, el alias queda resuelto explícitamente por
// webpack — la forma soportada, no un fallback.
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Aumentado para soportar PDFs grandes (default: 1mb)
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

// withWorkflow() habilita las directivas "use workflow"/"use step" (ver
// docs/preclasificacion-auditoria-funcional/07_Requerimiento_Preclasificacion_Workflow_Vercel.md).
// Aditivo: no cambia nada del comportamiento existente.
module.exports = withNextIntl(withWorkflow(nextConfig))
