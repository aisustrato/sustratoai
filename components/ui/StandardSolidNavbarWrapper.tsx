"use client";

import type React from "react";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import type { StandardNavbarTokens } from "@/lib/theme/components/standard-nav-tokens";

interface StandardSolidNavbarWrapperProps {
	children: React.ReactNode;
}

export function StandardSolidNavbarWrapper({
	children,
}: StandardSolidNavbarWrapperProps) {
	const { tokens: designTokens } = useDesignTokens();
	const currentNavTokens: StandardNavbarTokens | null =
		(designTokens?.navbar as StandardNavbarTokens) || null;

	if (!currentNavTokens) {
		return <div className="h-16 bg-white dark:bg-gray-900" />;
	}

	// Estilo para el fondo del navbar wrapper
	const wrapperStyle = {
		backgroundColor: currentNavTokens.background.scrolled,
		backdropFilter: "blur(8px)", // This matches navbar.tsx
		borderBottom: `0px solid ${currentNavTokens.submenu.border}`,
		boxShadow: currentNavTokens.shadow,
	};

	return (
		<div className="sticky top-0 z-50" style={wrapperStyle}>
			{children}
		</div>
	);
}
