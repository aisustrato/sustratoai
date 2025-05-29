"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/app/theme-provider";
import { useMemo } from "react";
import styles from "./sidebar-nav.module.css";

interface SidebarNavItem {
	title: string;
	href: string;
	icon?: LucideIcon;
	disabled?: boolean;
}

interface SidebarNavProps {
	items: SidebarNavItem[];
	className?: string;
}

import { SidebarNavAnimations } from "./sidebar-nav-animations";

export function SidebarNav({ items, className }: SidebarNavProps) {
	const pathname = usePathname() || "";
	const { appColorTokens, mode } = useTheme();

	const isDark = mode === "dark";
	const accentBg = isDark
		? appColorTokens.accent.bgShade
		: appColorTokens.accent.bg;
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
    />
  );
}
