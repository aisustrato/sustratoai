//. 📍 app/cognetica/upload/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardAlert } from "@/components/ui/StandardAlert";
//#endregion ![head]

//#region [main] - 🔧 COMPONENT 🔧
/**
 * Ingesta de artefactos — placeholder de Oleada 1.
 *
 * Cuando se implemente (§6.1 del requerimiento):
 *  - StandardFileUpload para drop/select
 *  - StandardSelect para tipo (auto-detectado desde MIME, editable)
 *  - StandardSelect para proyecto y grupo opcional
 *  - StandardInput / StandardTextarea para título y descripción
 *  - StandardCheckbox para "incluir contracalibración"
 *  - Submit llama `ingestaArtefacto()` → redirect a /cognetica/[id]
 */
export default function CogneticaUploadPage() {
  return (
    <div className="container mx-auto py-8">
      <StandardPageTitle
        title="Nuevo artefacto"
        description="Subir audio, video, PDF, markdown o imagen para metabolizar."
        breadcrumbs={[
          { label: "Cognética", href: "/cognetica" },
          { label: "Nuevo artefacto" },
        ]}
        showBackButton={{ href: "/cognetica" }}
      />

      <StandardAlert
        colorScheme="primary"
        styleType="subtle"
        className="mt-6"
        message="Formulario de ingesta pendiente — Oleada 1."
      />
    </div>
  );
}
//#endregion ![main]
