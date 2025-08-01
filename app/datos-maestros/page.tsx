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
  Network,
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
        description="Configura tu proyecto de investigación siguiendo un flujo estructurado: desde la definición básica hasta la creación de lotes de trabajo para el análisis colaborativo."
        breadcrumbs={[{ label: "Datos Maestros" }]}
        showBackButton={{ href: "/" }}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {[ 
          {
            href: "/datos-maestros/proyecto",
            icon: ClipboardList,
            title: "1. Proyecto",
            description: "Establece los datos básicos del proyecto: nombre, descripción, objetivos y módulos que estarán activos para tu investigación."
          },
          {
            href: "/datos-maestros/roles",
            icon: Shield,
            title: "2. Roles y Permisos",
            description: "Define los roles de investigación y establece los permisos específicos que determinan las acciones disponibles para cada tipo de colaborador."
          },
          {
            href: "/datos-maestros/miembros",
            icon: User,
            title: "3. Miembros del Equipo",
            description: "Incorpora a los investigadores y colaboradores al proyecto, asignándoles los roles correspondientes según su participación."
          },
          {
            href: "/datos-maestros/cargar-articulos",
            icon: FileUp,
            title: "4. Cargar Artículos Académicos",
            description: "Importa el corpus de artículos académicos que conformarán el universo de análisis de tu proyecto de investigación."
          },
          {
            href: "/datos-maestros/fases-preclasificacion",
            icon: Network,
            title: "5. Fases de Preclasificación",
            description: "Diseña las etapas secuenciales de análisis que guiarán el proceso de evaluación y categorización de los artículos."
          },
          {
            href: "/datos-maestros/dimensiones",
            icon: LayoutGrid,
            title: "6. Dimensiones de Análisis",
            description: "Configura las dimensiones y categorías específicas que se utilizarán para preclasificar los artículos en cada fase del proceso."
          },
          {
            href: "/datos-maestros/lote",
            icon: Boxes,
            title: "7. Lotes de Trabajo",
            description: "Genera los lotes de artículos que serán distribuidos secuencialmente entre los miembros del equipo para el análisis colaborativo."
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
