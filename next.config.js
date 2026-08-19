const { withWorkflow } = require('workflow/next')

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
module.exports = withWorkflow(nextConfig)
