//. 📍 app/datos-maestros/layout.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState, useEffect } from "react";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { StandardText } from "@/components/ui/StandardText";
import { StandardIcon } from "@/components/ui/StandardIcon";
import {
	Database,
	User,
	Shield,
	Boxes,
	LayoutGrid,
	FileUp,
	ChevronsLeft,
	ClipboardList,
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
		title: "Miembros",
		href: "/datos-maestros/miembros",
		icon: User,
	},
	{
		title: "Roles",
		href: "/datos-maestros/roles",
		icon: Shield,
	},
	{
		title: "Lotes",
		href: "/datos-maestros/lote",
		icon: Boxes,
	},
	{
		title: "Dimensiones",
		href: "/datos-maestros/dimensiones",
		icon: LayoutGrid,
	},
	{
		title: "Cargar Artículos",
		href: "/datos-maestros/cargar-articulos",
		icon: FileUp,
	},
];

export default function DatosMaestrosLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isDesktop, setIsDesktop] = useState(true);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(min-width: 768px)");
		const handleResize = () => {
			const isDesktopQuery = mediaQuery.matches;
			setIsDesktop(isDesktopQuery);
			if (!isDesktopQuery) {
				setIsCollapsed(true);
			}
		};
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		<div className="flex min-h-screen flex-col">
			<div
				className={cn(
					"flex-1 items-start md:grid md:gap-6 lg:gap-10 transition-all duration-500 ease-in-out",
					isCollapsed
						? "md:grid-cols-[80px_1fr] pl-4"
						: "md:grid-cols-[240px_1fr] container"
				)}
			>
				<aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
					<div className="relative h-full py-6 lg:py-8 flex flex-col">
						<div
							className={cn(
								"flex flex-col mb-8 transition-all duration-300 ease-in-out pl-8 pr-10",
								isCollapsed ? "px-2" : ""
							)}
						>
							{isDesktop && (
								<div className="flex w-full justify-end mb-2">
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
							<div className="flex items-center gap-2 min-w-0 overflow-hidden">
								<StandardIcon
									colorScheme="secondary"
									colorShade="pure"
									styleType="outlineGradient"
								>
									<Database className="h-5 w-5 flex-shrink-0" />
								</StandardIcon>
								<StandardText
									asElement="h3"
									size="lg"
									weight="semibold"
									colorScheme="secondary"
									colorShade="pure"
									className={cn(
										"transition-all duration-500 text-left w-full",
										isCollapsed ? "opacity-0 w-0 -ml-2" : "opacity-100 w-auto ml-0"
									)}
								>
									Datos Maestros
								</StandardText>
							</div>
						</div>
						<div className="flex-grow">
							<SidebarNav items={sidebarNavItems} isCollapsed={isCollapsed} />
						</div>
					</div>
				</aside>
				<StandardPageBackground
					variant="gradient"
					className="flex w-full flex-col overflow-hidden"
				>
										<main className="py-6 lg:py-8">
						{children}
					</main>
				</StandardPageBackground>
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
