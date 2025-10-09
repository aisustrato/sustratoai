//. 📍 app/articulos/layout.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { StandardText } from "@/components/ui/StandardText";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { FileText, ChevronsLeft, Filter, MapPin, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { LayoutProvider } from "@/app/contexts/layout-context";
//#endregion ![head]

//#region [main] - 🔧 COMPONENT 🔧
const sidebarNavItems = [
  {
    title: "Base Original",
    href: "/articulos/base-original",
    icon: Database,
  },
  {
    title: "Preclasificación",
    href: "/articulos/preclasificacion",
    icon: Filter,
  },
  {
    title: "Grupos",
    href: "/articulos/grupos",
    icon: MapPin,
  },
  {
    title: "Notas",
    href: "/articulos/notas",
    icon: FileText,
  },
];

export default function ArticulosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [layoutGap, setLayoutGap] = useState(40); // Default to large gap
  const [globalXPadding, setGlobalXPadding] = useState(64); // Default to large padding

  // 🚨 DEBUG TEMPORAL: Verificar que el layout se está ejecutando
  console.log(`🏗️ [ArticulosLayout] Renderizando con pathname: ${pathname}`);
  console.warn(`⚠️ [ArticulosLayout] LAYOUT EJECUTÁNDOSE - Pathname: ${pathname}`);
  
  // 🚨 DEBUG TEMPORAL: Alert visible para confirmar ejecución
  useEffect(() => {
    console.log(`🔄 [ArticulosLayout] useEffect ejecutado, pathname: ${pathname}`);
    // Solo mostrar alert en standard-table-final para confirmar
    if (pathname.includes('standard-table-final')) {
      console.error(`🔥 [ArticulosLayout] CONFIRMADO: Layout se ejecuta en standard-table-final`);
    }
  }, [pathname]);

  // 🎯 FILTRADO INTELIGENTE POR RUTAS CON SOPORTE DE SUB-RUTAS
  // Solo aplicar lógica dinámica en rutas que la necesitan
  // Excluir rutas y sub-rutas específicas que necesitan sticky columns nativos
  const shouldApplyDynamicLayout = useMemo(() => {
    // Rutas que EXPLÍCITAMENTE NO deben tener layout dinámico (sticky columns nativos)
    const staticRoutes = [
      '/articulos/standard-table-final',
      '/articulos/preclasificacion/[batchId]' // Sub-ruta de detalle de lotes
    ];
    
    // Rutas que SÍ necesitan layout dinámico (solo las principales, no sub-rutas)
    const dynamicRoutes = [
      '/articulos/base-original',
      '/articulos/preclasificacion', // Solo la página principal
      '/articulos/grupos',
      '/articulos/notas'
    ];
    
    // 🔍 DETECCIÓN DE SUB-RUTAS DINÁMICAS
    // Detectar patrones como /preclasificacion/[batchId] usando regex
    const batchDetailPattern = /^\/articulos\/preclasificacion\/[^/]+$/;
    const isBatchDetailPage = batchDetailPattern.test(pathname);
    
    // Si es una ruta estática explícita, NO aplicar layout dinámico
    if (staticRoutes.some(route => pathname.startsWith(route))) {
      console.log(`🚫 [Layout] Ruta estática explícita: ${pathname} - SIN layout dinámico`);
      return false;
    }
    
    // Si es una página de detalle de lote, NO aplicar layout dinámico
    if (isBatchDetailPage) {
      console.log(`🚫 [Layout] Página de detalle de lote detectada: ${pathname} - SIN layout dinámico`);
      return false;
    }
    
    // Si es una ruta dinámica (solo exactas, no sub-rutas), SÍ aplicar layout dinámico
    const isDynamic = dynamicRoutes.some(route => {
      // Para rutas dinámicas, verificar coincidencia exacta o con trailing slash
      return pathname === route || pathname === route + '/';
    });
    
    console.log(`${isDynamic ? '✅' : '❌'} [Layout] Ruta: ${pathname} - ${isDynamic ? 'CON' : 'SIN'} layout dinámico`);
    return isDynamic;
  }, [pathname]);

  const SIDEBAR_EXPANDED_WIDTH = 240;
  const SIDEBAR_COLLAPSED_WIDTH = 80;
  const sidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleResize = () => {
      const isDesktopQuery = mediaQuery.matches;
      setIsDesktop(isDesktopQuery);
      if (!isDesktopQuery) {
        setIsCollapsed(true);
      }

      // Update layout gap based on window width
      if (window.innerWidth >= 1024) {
        setLayoutGap(40); // lg:gap-10 -> 2.5rem
      } else if (window.innerWidth >= 768) {
        setLayoutGap(24); // md:gap-6 -> 1.5rem
      } else {
        setLayoutGap(0); // No grid gap on small screens
      }

      // Update global X padding based on window width (from Navbar container)
      if (window.innerWidth >= 1024) { // lg
        setGlobalXPadding(64); // lg:px-8 -> 2rem * 2 = 64px
      } else if (window.innerWidth >= 640) { // sm
        setGlobalXPadding(48); // sm:px-6 -> 1.5rem * 2 = 48px
      } else {
        setGlobalXPadding(32); // px-4 -> 1rem * 2 = 32px
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  //#region [render] - 🎨 RENDER SECTION 🎨
  return (
    <div className="flex min-h-screen flex-col">
      {shouldApplyDynamicLayout ? (
        // 🎯 LAYOUT COMPLETO: Con sidebar y estructura dinámica
        <div
          className={cn(
            "flex-1 items-start md:grid md:gap-6 lg:gap-10 transition-all duration-500 ease-in-out",
            isCollapsed
              ? "md:grid-cols-[80px_1fr] px-4"
              : "md:grid-cols-[240px_1fr] px-4"
          )}
        >
          <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 80 : 240 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] shrink-0 md:sticky md:block overflow-hidden"
          >
            <div className="relative h-full py-6 lg:py-8 flex flex-col">
              <div
                className={cn(
                  "flex flex-col mb-8 transition-all duration-300 ease-in-out",
                  isCollapsed ? "px-2 items-center" : "px-4"
                )}
              >
                {isDesktop && (
                  <div className="flex w-full justify-end mb-2 pr-4">
                    <button
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className="p-1.5 rounded-full bg-background-paper border border-border-neutral shadow-md hover:bg-accent-bg transition-colors flex-shrink-0"
                    >
                      <ChevronsLeft
                        className={cn(
                          "h-4 w-4 text-text-subtle transition-transform duration-500",
                          isCollapsed && "rotate-180"
                        )}
                      />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 min-w-0 pl-4">
                  <StandardIcon
                    colorScheme="primary"
                    colorShade="pure"
                    styleType="outlineGradient"
                  >
                    <FileText className="h-5 w-5 flex-shrink-0" />
                  </StandardIcon>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: "auto", transition: { delay: 0.1, duration: 0.2 } }}
                        exit={{ opacity: 0, x: -10, width: 0, transition: { duration: 0.15 } }}
                        className="overflow-hidden"
                      >
                        <StandardText
                          asElement="h3"
                          size="lg"
                          weight="semibold"
                          colorScheme="primary"
                          colorShade="pure"
                          className="whitespace-nowrap"
                        >
                          Artículos
                        </StandardText>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex-grow">
                <SidebarNav items={sidebarNavItems} isCollapsed={isCollapsed} />
              </div>
            </div>
          </motion.aside>
          <LayoutProvider isSidebarCollapsed={isCollapsed} sidebarWidth={sidebarWidth} layoutGap={layoutGap} globalXPadding={globalXPadding}>
            <StandardPageBackground
              variant="gradient"
              className="flex w-full flex-col overflow-hidden"
            >
              <main className="py-6 lg:py-8">
                {children}
              </main>
            </StandardPageBackground>
          </LayoutProvider>
        </div>
      ) : (
        // 🎯 LAYOUT SIMPLE: Sin sidebar, sin estructura dinámica, solo children
        <div className="flex-1">
          <StandardPageBackground
            variant="gradient"
            className="flex w-full flex-col overflow-hidden"
          >
            <main className="py-6 lg:py-8">
              {children}
            </main>
          </StandardPageBackground>
        </div>
      )}
    </div>
  );
  //#endregion [render]
}
//#endregion [main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration.
//#endregion [foo]
