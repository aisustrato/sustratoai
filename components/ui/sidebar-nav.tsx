"use client";

import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { useTheme } from "@/app/theme-provider";
import { useMemo } from "react";

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

import { SidebarNavAnimations } from "./sidebar-nav-animations";

export function SidebarNav({ items, className, isCollapsed }: SidebarNavProps) {
	const pathname = usePathname() || "";
	const { appColorTokens, mode } = useTheme();

	const isDark = mode === "dark";
	const accentBgHover = isDark
		? appColorTokens.accent.bg
		: appColorTokens.accent.bgShade;
	const primaryBg = `${appColorTokens.primary.bg}1A`;
	const primaryBgHover = `${appColorTokens.primary.bg}26`;

	// Crear estilos dinámicos para el hover
	const hoverStyles = useMemo(
		() =>
			({
				"--hover-bg": accentBgHover,
				"--active-bg": primaryBg,
				"--active-hover-bg": primaryBgHover,
			} as React.CSSProperties),
		[accentBgHover, primaryBg, primaryBgHover]
	);

	return (
    <SidebarNavAnimations
      items={items}
      activeHref={pathname}
      hoverStyles={hoverStyles}
      appColorTokens={appColorTokens}
      isCollapsed={isCollapsed}
      className={className}
    />
  );
}
