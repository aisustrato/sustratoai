//. 📍 app/articulos/page.tsx
"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

//#region [head] - 🏷️ IMPORTS 🏷️
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardIcon } from "@/components/ui/StandardIcon";
import Link from "next/link";
import { FileCheck, MapPin, FileText, Database, BarChart3 } from "lucide-react";
//#endregion ![head]

//#region [main] - 🔧 COMPONENT 🔧
export default function ArticulosHome() {
  const t = useTranslations("articulos.articulosIndexPage");
  //#region [render] - 🎨 RENDER SECTION 🎨
  return (
    <div className="container mx-auto py-8">
      <StandardPageTitle
        title={t("pageTitle")}
        description={t("pageDescription")}
        breadcrumbs={[{ label: t("breadcrumbArticulos") }]}
        showBackButton={{ href: "/" }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {[
          {
            href: "/articulos/base-original",
            icon: Database,
            title: t("cardBaseOriginalTitle"),
            description: t("cardBaseOriginalDescription")
          },
          {
            href: "/articulos/preclasificacion",
            icon: FileCheck,
            title: t("cardPreclasificacionTitle"),
            description: t("cardPreclasificacionDescription")
          },
          {
            href: "/articulos/grupos",
            icon: MapPin,
            title: t("cardGruposTitle"),
            description: t("cardGruposDescription")
          },
          {
            href: "/articulos/notas",
            icon: FileText,
            title: t("cardNotasTitle"),
            description: t("cardNotasDescription")
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
                    {t("accessLabel")}
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
