//. 📍 app/datos-maestros/layout.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { StandardText } from "@/components/ui/StandardText";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { Database, Users, Building2, Briefcase, UserPlus, ShieldCheck, Layers, LayoutGrid } from "lucide-react";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// No specific types defined directly in this file, `children` is React.ReactNode.
// Props for SidebarNav items are inferred from its definition.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
const sidebarNavItems = [
 
  {
    title: "Miembros Proyecto",
    href: "/datos-maestros/miembros",
    icon: UserPlus,
  },
  {
    title: "Roles Proyecto",
    href: "/datos-maestros/roles",
    icon: ShieldCheck,
  },
  {
    title: "lotes",
    href: "/datos-maestros/lote",
    icon: Layers,
  },
  {
    title: "Dimensiones",
    href: "/datos-maestros/dimensiones",
    icon: LayoutGrid,
  }
  // Otros ítems del menú pueden agregarse en el futuro
  // {
  //   title: "Instituciones",
  //   href: "/datos-maestros/instituciones",
  //   icon: Building2,
  // },
  // {
  //   title: "Cargos",
  //   href: "/datos-maestros/cargos",
  //   icon: Briefcase,
  // },
];

export default function DatosMaestrosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  //#region [render] - 🎨 RENDER SECTION 🎨
  return (
    <div className="flex min-h-screen flex-col">
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <div className="h-full py-6 pl-8 pr-6 lg:py-8">
            <div className="flex items-center gap-2 mb-8">
              <StandardIcon><Database className="h-5 w-5" /></StandardIcon>
              <StandardText asElement="h2" size="lg" weight="semibold">Datos Maestros</StandardText>
            </div>
            <SidebarNav items={sidebarNavItems} />
          </div>
        </aside>
        <main className="flex w-full flex-col overflow-hidden">{children}</main>
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
// Considerar si el `sidebarNavItems` debería ser dinámico o cargado desde otra fuente si crece mucho.
// Evaluar la necesidad de un estado o lógica más compleja en este layout a futuro.
//#endregion ![todo]
