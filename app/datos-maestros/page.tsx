//. 📍 app/datos-maestros/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardIcon } from "@/components/ui/StandardIcon";
import Link from "next/link";
import {
  ClipboardList,
  FileUp,
  LayoutGrid,
  Boxes,
  User,
  Shield,
} from "lucide-react";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// No specific types or interfaces defined in this file.
// Props for components are inferred from their definitions.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function DatosMaestrosHome() {
  //#region [render] - 🎨 RENDER SECTION 🎨
  return (
    <div className="container mx-auto py-8">
      <StandardPageTitle
        title="Datos Maestros"
        description="Administra la información estructural clave de tu proyecto: datos básicos, artículos, dimensiones, lotes, miembros y roles."
        breadcrumbs={[{ label: "Datos Maestros" }]}
        showBackButton={{ href: "/" }}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {[ 
          {
            href: "/datos-maestros/proyecto",
            icon: ClipboardList,
            title: "Proyecto",
            description: "Gestiona el nombre, descripción y módulos activos de tu proyecto."
          },
          {
            href: "/datos-maestros/cargar-articulos",
            icon: FileUp,
            title: "Cargar Artículos",
            description: "Importa artículos de forma masiva desde un archivo CSV para agilizar la carga de datos."
          },
          {
            href: "/datos-maestros/dimensiones",
            icon: LayoutGrid,
            title: "Dimensiones",
            description: "Define las dimensiones y categorías que se usarán para analizar y clasificar los artículos."
          },
          {
            href: "/datos-maestros/lote",
            icon: Boxes,
            title: "Lotes de Trabajo",
            description: "Crea y gestiona los lotes de trabajo que serán asignados a los miembros del equipo."
          },
          {
            href: "/datos-maestros/miembros",
            icon: User,
            title: "Miembros",
            description: "Añade o elimina los perfiles de los investigadores y colaboradores asignados a este proyecto."
          },
          {
            href: "/datos-maestros/roles",
            icon: Shield,
            title: "Roles y Permisos",
            description: "Gestiona los roles que determinan qué acciones pueden realizar los miembros en el proyecto."
          },
        ].map(({ href, icon: Icon, title, description }) => (
          <StandardCard
            key={href}
            className="hover:shadow-lg transition-shadow duration-200 group"
            styleType="subtle"
            hasOutline={false}
            accentPlacement="none"
          >
            <Link href={href} className="block p-4 h-full">
              <div className="flex items-center gap-3 mb-2">
                <StandardIcon>
                  <Icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                </StandardIcon>
                <StandardText asElement="h2" weight="semibold" size="lg">
                  {title}
                </StandardText>
              </div>
              <StandardText colorScheme="neutral" size="sm">
                {description}
              </StandardText>
            </Link>
          </StandardCard>
        ))}
      </div>
    </div>
  );
  //#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration.
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Considerar si esta página debería cargar dinámicamente las secciones disponibles en lugar de tenerlas hardcodeadas.
// Añadir más secciones de Datos Maestros a medida que se desarrollen (ej. Instituciones, Tipos de Artículo, etc.).
//#endregion ![todo]
