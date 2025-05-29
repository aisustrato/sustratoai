"use client";

import { SidebarNav } from "@/components/ui/sidebar-nav";
import { Database, Users, Building2, Briefcase, UserPlus, ShieldCheck, Layers, LayoutGrid } from "lucide-react";

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
  return (
    <div className="flex min-h-screen flex-col">
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <div className="h-full py-6 pl-8 pr-6 lg:py-8">
            <div className="flex items-center gap-2 mb-8">
              <Database className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Datos Maestros</h2>
            </div>
            <SidebarNav items={sidebarNavItems} />
          </div>
        </aside>
        <main className="flex w-full flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
