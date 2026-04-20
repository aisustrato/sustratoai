//. 📍 app/cognetica/grupos/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardAlert } from "@/components/ui/StandardAlert";
//#endregion ![head]

//#region [main] - 🔧 COMPONENT 🔧
/**
 * Listado de grupos — placeholder de Oleada 1.
 */
export default function CogneticaGruposPage() {
  return (
    <div className="container mx-auto py-8">
      <StandardPageTitle
        title="Grupos de artefactos"
        description="Agrupaciones temáticas de artefactos para lectura conjunta y germinal-de-grupo."
        breadcrumbs={[
          { label: "Cognética", href: "/cognetica" },
          { label: "Grupos" },
        ]}
        showBackButton={{ href: "/cognetica" }}
      />

      <StandardAlert
        colorScheme="primary"
        styleType="subtle"
        className="mt-6"
        message="Listado de grupos pendiente — Oleada 1."
      />
    </div>
  );
}
//#endregion ![main]
