//. 📍 app/datos-maestros/dimensiones/[id]/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";

//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// Simulación de datos
const dimensionesEjemplo = [
  {
    id: "uso-articulo",
    nombre: "Uso",
    tipo: "finito",
    opciones: ["Activo", "Pasivo", "Por Intermediario"],
    explicacion: "Indica cómo se utiliza el artículo en el contexto del usuario final.",
  },
  {
    id: "nombre-dispositivo",
    nombre: "Nombre del Dispositivo",
    tipo: "abierto",
    opciones: [],
    explicacion: "Permite especificar libremente el nombre del dispositivo de ayuda técnica.",
  },
];
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function VerDimensionPage() {
  const params = useParams();
  const { proyectoActual } = useAuth();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const dimension = dimensionesEjemplo.find((d) => d.id === id);

  if (!proyectoActual) {
    return (
      <StandardCard
        className="max-w-lg mx-auto mt-12 text-center"
        styleType="subtle"
        disableShadowHover={true}
        hasOutline={false}
        accentPlacement="none"
      >
        <StandardPageTitle title="Detalle de Dimensión" />
        <StandardText colorScheme="danger">Debes seleccionar un proyecto para ver dimensiones.</StandardText>
      </StandardCard>
    );
  }

  if (!dimension) {
    return (
      <StandardCard
        className="max-w-lg mx-auto mt-12 text-center"
        styleType="subtle"
        disableShadowHover={true}
        hasOutline={false}
        accentPlacement="none"
      >
        <StandardPageTitle title="Dimensión no encontrada" />
        <StandardText colorScheme="danger">La dimensión solicitada no existe.</StandardText>
      </StandardCard>
    );
  }

  //#region [render] - 🎨 RENDER SECTION 🎨
  return (
    <div className="container mx-auto py-8">
      <StandardPageTitle
        title={`Dimensión: ${dimension.nombre}`}
        subtitle={dimension.explicacion}
        breadcrumbs={[
          { label: "Datos Maestros", href: "/datos-maestros" },
          { label: "Dimensiones de Preclasificación", href: "/datos-maestros/dimensiones-preclasificacion" },
          { label: dimension.nombre }
        ]}
        showBackButton={{ href: "/datos-maestros/dimensiones-preclasificacion" }}
      />
      <StandardCard
        className="max-w-2xl mx-auto p-6 space-y-6"
        styleType="subtle"
        disableShadowHover={true}
        hasOutline={false}
        accentPlacement="none"
      >
        <div className="flex items-center gap-3">
          <StandardText asElement="h2" size="2xl" weight="bold">{dimension.nombre}</StandardText>
          <StandardBadge colorScheme={dimension.tipo === "finito" ? "success" : "secondary"} styleType="subtle">
            {dimension.tipo === "finito" ? "Conjunto Finito" : "Abierta"}
          </StandardBadge>
        </div>
        <div>
          <StandardText size="lg" weight="semibold" className="mb-1">Explicación de la Dimensión:</StandardText>
          <StandardText colorScheme="neutral">{dimension.explicacion}</StandardText>
        </div>
        {dimension.tipo === "finito" && (
          <div>
            <StandardText size="lg" weight="semibold" className="mb-1">Opciones Permitidas:</StandardText>
            <div className="flex flex-wrap gap-2">
              {dimension.opciones.map((op) => (
                <StandardBadge key={op} colorScheme="neutral">{op}</StandardBadge>
              ))}
            </div>
          </div>
        )}
      </StandardCard>
    </div>
  );
  //#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// No explicit exports, default export is part of the component.
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Add any future tasks here.
//#endregion ![todo]