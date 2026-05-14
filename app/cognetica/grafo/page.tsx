"use client";

/**
 * /cognetica/grafo
 *
 * Vista de grafo de artefactos del proyecto activo. El layout de página
 * (título, breadcrumbs, back button) se maneja acá con `StandardPageTitle`,
 * coherente con la raíz de Cognética. El wrapper `GrafoCoocurrenciaCognetica`
 * solo se ocupa de los datos y la visualización del grafo en sí.
 */

import { Network } from "lucide-react";

import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { GrafoCoocurrenciaCognetica } from "@/components/grafo/GrafoCoocurrenciaCognetica";

export default function CogneticaGrafoPage() {
  return (
    <div className="container mx-auto py-8">
      <StandardPageTitle
        title="Grafo de artefactos"
        description="Artefactos del proyecto activo conectados por los conceptos que comparten. Doble click sobre un nodo para abrir el artefacto."
        mainIcon={Network}
        breadcrumbs={[
          { label: "Cognética", href: "/cognetica" },
          { label: "Grafo" },
        ]}
        showBackButton={{ href: "/cognetica" }}
      />

      <GrafoCoocurrenciaCognetica height={620} />
    </div>
  );
}
