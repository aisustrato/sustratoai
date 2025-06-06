// app/datos-maestros/page.tsx
"use client";

import { PageTitle } from "@/components/ui/page-title";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { Text } from "@/components/ui/text";
import Link from "next/link";
import { UserPlus, Shield, Layers } from "lucide-react";

export default function DatosMaestrosHome() {
  return (
    <div className="container mx-auto py-8">
      <PageTitle
        title="Datos Maestros"
        subtitle="Administra la información estructural clave de tu proyecto: roles, miembros y lotes."
        breadcrumbs={[{ label: "Datos Maestros" }]}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Miembros */}
        <StandardCard
          className="hover:shadow-lg transition-shadow duration-200 group"
          styleType="subtle"
          hasOutline={false}
          accentPlacement="none"
        >
          <Link href="/datos-maestros/miembros" className="block p-4">
            <div className="flex items-center gap-3 mb-2">
              <UserPlus className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
              <Text as="h2" variant="heading" size="lg">Miembros</Text>
            </div>
            <Text color="neutral">
              Gestiona los investigadores y colaboradores de tu proyecto. Permite agregar, editar y eliminar miembros.
            </Text>
          </Link>
        </StandardCard>
        {/* Roles */}
        <StandardCard
          className="hover:shadow-lg transition-shadow duration-200 group"
          styleType="subtle"
          hasOutline={false}
          accentPlacement="none"
        >
          <Link href="/datos-maestros/roles" className="block p-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
              <Text as="h2" variant="heading" size="lg">Roles</Text>
            </div>
            <Text color="neutral">
              Define los permisos y responsabilidades de cada miembro. Crea y ajusta roles según las necesidades del proyecto.
            </Text>
          </Link>
        </StandardCard>
        {/* Lotes */}
        <StandardCard
          className="hover:shadow-lg transition-shadow duration-200 group"
          styleType="subtle"
          hasOutline={false}
          accentPlacement="none"
        >
          <Link href="/datos-maestros/lote" className="block p-4">
            <div className="flex items-center gap-3 mb-2">
              <Layers className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
              <Text as="h2" variant="heading" size="lg">Lotes</Text>
            </div>
            <Text color="neutral">
              Administra los lotes de datos, simulaciones o agrupaciones relevantes para el flujo de trabajo del proyecto.
            </Text>
          </Link>
        </StandardCard>
      </div>
    </div>
  );
}
