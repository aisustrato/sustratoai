"use client";

import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { StandardSidebarNavAnimations } from "./StandardSidebarNavAnimations";

interface SidebarNavItem {
	title: string;
	href: string;
	icon?: LucideIcon;
	disabled?: boolean;
}

interface SidebarNavProps {
	items: SidebarNavItem[];
	className?: string;
	isCollapsed: boolean;
}

export function SidebarNav({ items, className, isCollapsed }: SidebarNavProps) {
	const pathname = usePathname() || "";

	// Crear estilos dinámicos para el hover (valores por defecto)
	const hoverStyles = useMemo(
		() =>
			({
				"--hover-bg": "#00000026",
				"--active-bg": "#0000001A",
				"--active-hover-bg": "#00000026",
			}) as React.CSSProperties,
		[],
	);

	return (
		<StandardSidebarNavAnimations
			items={items}
			activeHref={pathname}
			hoverStyles={hoverStyles}
			isCollapsed={isCollapsed}
			className={className}
		/>
	);
}
