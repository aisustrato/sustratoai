//. 📍 app/datos-maestros/layout.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
'use client';

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { LayoutProvider } from "@/app/contexts/layout-context";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { StandardText } from "@/components/ui/StandardText";
import {
	Database,
	User,
	Shield,
	Boxes,
	LayoutGrid,
	FileUp,
	ChevronsLeft,
	ClipboardList,
	Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// No specific types defined directly in this file, `children` is React.ReactNode.
// Props for SidebarNav items are inferred from its definition.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
const sidebarNavItems = [
	{
		title: "Proyecto",
		href: "/datos-maestros/proyecto",
		icon: ClipboardList,
	},
	{
		title: "Roles",
		href: "/datos-maestros/roles",
		icon: Shield,
	},
	{
		title: "Miembros",
		href: "/datos-maestros/miembros",
		icon: User,
	},
	{
		title: "Cargar Artículos",
		href: "/datos-maestros/cargar-articulos",
		icon: FileUp,
	},
	{
		title: "Fases",
		href: "/datos-maestros/fases-preclasificacion",
		icon: Network,
	},
	{
		title: "Dimensiones",
		href: "/datos-maestros/dimensiones",
		icon: LayoutGrid,
	},
	{
		title: "Lotes",
		href: "/datos-maestros/lote",
		icon: Boxes,
	},
];

export default function DatosMaestrosLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isDesktop, setIsDesktop] = useState(true);
	const [layoutGap, setLayoutGap] = useState(40); // Default to large gap
	const [globalXPadding, setGlobalXPadding] = useState(64); // Default to large padding

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
		mediaQuery.addEventListener("change", handleResize);
		handleResize(); // Initial check

		return () => mediaQuery.removeEventListener("change", handleResize);
	}, []);

	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		<div className="flex min-h-screen flex-col">
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
          animate={{ width: sidebarWidth }}
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
                  colorScheme="secondary"
                  colorShade="text"
                  styleType="outlineGradient"
                >
                  <Database className="h-5 w-5 flex-shrink-0" />
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
                        colorScheme="secondary"
                        colorShade="pure"
                        className="whitespace-nowrap"
                      >
                        Datos Maestros
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
