// 📍 app/papers/layout.tsx
// Layout para la DMZ (zona pública de papers).
// El navbar y el footer NO viven acá: un layout compartido por /papers y
// /papers/[slug] no tiene acceso al idioma resuelto de un paper puntual, así
// que cada página los renderiza directamente con su propio idioma (ver
// DMZNavbar/PapersFooter y su prop `idioma`).

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "sustrato.ai — Publicaciones",
    template: "%s — sustrato.ai",
  },
  description:
    "Investigación cualitativa aumentada. Arquitectura híbrida humano-IA para revisiones sistemáticas.",
  openGraph: {
    type: "website",
    siteName: "sustrato.ai",
    locale: "es_CL",
  },
  twitter: {
    card: "summary_large_image",
    site: "@SustratoAi",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
  },
};

export default function PapersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-screen flex-col">{children}</div>;
}
