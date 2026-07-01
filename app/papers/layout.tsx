// 📍 app/papers/layout.tsx
// Layout para la DMZ (zona pública de papers)

import type { Metadata } from "next";
import { DMZNavbar } from "./components/DMZNavbar";

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
  return (
    <div className="flex min-h-screen flex-col">
      <DMZNavbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} sustrato.ai — Licencia{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline"
            >
              CC-BY-4.0
            </a>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a
              href="https://zenodo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Zenodo
            </a>
            <a
              href="https://orcid.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              ORCID
            </a>
            <a
              href="https://github.com/sustratoai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
