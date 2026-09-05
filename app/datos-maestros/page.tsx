//. 📍 app/datos-maestros/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useTranslations } from "next-intl";
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
  const t = useTranslations("datosMaestrosPages.indexPage");
  //#region [render] - 🎨 RENDER SECTION 🎨
  return (
    <div className="container mx-auto py-8">
      <StandardPageTitle
        title={t("pageTitle")}
        description={t("pageDescription")}
        breadcrumbs={[{ label: t("breadcrumbDatosMaestros") }]}
        showBackButton={{ href: "/" }}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {[
          {
            href: "/datos-maestros/proyecto",
            icon: ClipboardList,
            title: t("step1Title"),
            description: t("step1Description")
          },
          {
            href: "/datos-maestros/roles",
            icon: Shield,
            title: t("step2Title"),
            description: t("step2Description")
          },
          {
            href: "/datos-maestros/miembros",
            icon: User,
            title: t("step3Title"),
            description: t("step3Description")
          },
          {
            href: "/datos-maestros/cargar-articulos",
            icon: FileUp,
            title: t("step4Title"),
            description: t("step4Description")
          },
          {
            href: "/datos-maestros/fases-preclasificacion",
            icon: Network,
            title: t("step5Title"),
            description: t("step5Description")
          },
          {
            href: "/datos-maestros/dimensiones",
            icon: LayoutGrid,
            title: t("step6Title"),
            description: t("step6Description")
          },
          {
            href: "/datos-maestros/lote",
            icon: Boxes,
            title: t("step7Title"),
            description: t("step7Description")
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
