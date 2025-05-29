"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { PageTitle } from "@/components/ui/page-title";
import { ProCard } from "@/components/ui/pro-card";
import { Text } from "@/components/ui/text";
import { BadgeCustom } from "@/components/ui/badge-custom";

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

export default function VerDimensionPage() {
  const params = useParams();
  const { proyectoActual } = useAuth();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const dimension = dimensionesEjemplo.find((d) => d.id === id);

  if (!proyectoActual) {
    return (
      <ProCard className="max-w-lg mx-auto mt-12 text-center">
        <PageTitle title="Detalle de Dimensión" />
        <Text color="danger">Debes seleccionar un proyecto para ver dimensiones.</Text>
      </ProCard>
    );
  }

  if (!dimension) {
    return (
      <ProCard className="max-w-lg mx-auto mt-12 text-center">
        <PageTitle title="Dimensión no encontrada" />
        <Text color="danger">La dimensión solicitada no existe.</Text>
      </ProCard>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <PageTitle
        title={`Dimensión: ${dimension.nombre}`}
        subtitle={dimension.explicacion}
        breadcrumbs={[
          { label: "Datos Maestros", href: "/datos-maestros" },
          { label: "Dimensiones de Preclasificación", href: "/datos-maestros/dimensiones-preclasificacion" },
          { label: dimension.nombre }
        ]}
        showBackButton={{ href: "/datos-maestros/dimensiones-preclasificacion" }}
      />
      <ProCard className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Text as="h2" variant="heading" size="lg">{dimension.nombre}</Text>
          <BadgeCustom variant={dimension.tipo === "finito" ? "success" : "secondary"} subtle>
            {dimension.tipo === "finito" ? "Conjunto Finito" : "Abierta"}
          </BadgeCustom>
        </div>
        <div>
          <Text variant="subheading" className="mb-1">Explicación de la Dimensión:</Text>
          <Text color="neutral">{dimension.explicacion}</Text>
        </div>
        {dimension.tipo === "finito" && (
          <div>
            <Text variant="subheading" className="mb-1">Opciones Permitidas:</Text>
            <div className="flex flex-wrap gap-2">
              {dimension.opciones.map((op) => (
                <BadgeCustom key={op} variant="default">{op}</BadgeCustom>
              ))}
            </div>
          </div>
        )}
      </ProCard>
    </div>
  );
}