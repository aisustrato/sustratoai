//. 📍 app/articulos/page.tsx
"use client";

import * as React from "react";

//#region [head] - 🏷️ IMPORTS 🏷️
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardIcon } from "@/components/ui/StandardIcon";
import Link from "next/link";
import { FileUp, LayoutGrid, FileCheck } from "lucide-react";
//#endregion ![head]

//#region [main] - 🔧 COMPONENT 🔧
export default function ArticulosHome() {
  //#region [render] - 🎨 RENDER SECTION 🎨
  return (
    <div className="container mx-auto py-8">
      <StandardPageTitle
        title="Gestión de Artículos"
        description="Administra los artículos de tu proyecto: preclasificación, carga masiva y exploración de documentos."
        breadcrumbs={[{ label: "Artículos" }]}
        showBackButton={{ href: "/" }}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {[ 
          {
            href: "/articulos/preclasificacion",
            icon: FileCheck,
            title: "Preclasificación",
            description: "Revisa y clasifica los artículos según criterios de inclusión y exclusión para tu revisión sistemática."
          },
          {
            href: "/articulos/cargar",
            icon: FileUp,
            title: "Cargar Artículos",
            description: "Importa artículos de forma masiva desde diferentes fuentes para incluirlos en tu revisión."
          },
          {
            href: "/articulos/explorar",
            icon: LayoutGrid,
            title: "Explorar",
            description: "Explora y gestiona todos los artículos de tu proyecto con filtros avanzados y búsquedas rápidas."
          },
        ].map((item, index) => (
          <Link href={item.href} key={index} className="group">
            <StandardCard className="h-full transition-all duration-300 hover:shadow-md hover:border-primary/20">
              <div className="flex flex-col h-full p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <StandardIcon size="lg">
                      {React.createElement(item.icon)}
                    </StandardIcon>
                  </div>
                  <StandardText variant="subtitle" className="group-hover:text-primary transition-colors">
                    {item.title}
                  </StandardText>
                </div>
                <StandardText variant="body" className="text-muted-foreground flex-1">
                  {item.description}
                </StandardText>
                <div className="mt-4 flex justify-end">
                  <StandardText variant="small" className="text-primary font-medium flex items-center">
                    Acceder
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </StandardText>
                </div>
              </div>
            </StandardCard>
          </Link>
        ))}
      </div>
    </div>
  );
  //#endregion [render]
}
//#endregion [main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration.
//#endregion [foo]
