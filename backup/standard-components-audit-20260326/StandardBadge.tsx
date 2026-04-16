"use client";

import * as React from "react";
import { useMemo, useId, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import { StandardText } from "./StandardText";
import { StandardIcon } from "./StandardIcon";
import type {
	StandardBadgeSize,
	StandardBadgeStyleType,
} from "@/lib/theme/components/standard-badge-tokens";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import tinycolor from "tinycolor2";

// 📌 Re-exportamos tipos para consumidores
export type { StandardBadgeStyleType, StandardBadgeSize };

export interface StandardBadgeProps
	extends React.HTMLAttributes<HTMLDivElement> {
	colorScheme?: ColorSchemeVariant;
	styleType?: StandardBadgeStyleType;
	size?: StandardBadgeSize;
	leftIcon?: React.ComponentType<{ className?: string }>;
	rightIcon?: React.ComponentType<{ className?: string }>;
	iconClassName?: string;
	children: React.ReactNode;
	// 🌊 Efectos SUSTRATO - Retroalimentación visual al humano
	pulseBorder?: boolean; // Respiración sutil del borde (2.5s ciclo)
	pafffMoment?: boolean; // Latido de coherencia (1.5s ciclo)
}

// 💎 CORE: Componente StandardBadge (v4 - Patrón Flex + Tokens Provider)
const StandardBadge = React.forwardRef<HTMLDivElement, StandardBadgeProps>(
	(
		{
			className,
			colorScheme = "primary",
			styleType = "subtle",
			size = "md",
			leftIcon: LeftIcon,
			rightIcon: RightIcon,
			iconClassName,
			children,
			pulseBorder = false,
			pafffMoment = false,
			...props
		},
		ref,
	) => {
		// 1. 🌉 THE BRIDGE: Consumir tokens precalculados
		const { tokens } = useDesignTokens();
		const badgeId = useId().replace(/:/g, ""); // ID único para CSS scoped

		// 2. 🛡️ SAFEGUARDS: Fallback seguro si los tokens no están listos (ej. SSR o error de provider)
		const sizeTokens = tokens?.badge.sizes[size];
		const styleTokens = tokens?.badge.styles[colorScheme]?.[styleType];

		// 3. 🎨 CSS DINÁMICO (Patrón Flex): Inyección de estilos + Efectos SUSTRATO
		// El cerebro es JS, el músculo es CSS.
		useLayoutEffect(() => {
			if (!styleTokens) return;

			const styleId = `badge-styles-${badgeId}`;
			let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

			if (!styleEl) {
				styleEl = document.createElement("style");
				styleEl.id = styleId;
				styleEl.setAttribute("data-badge-id", badgeId);
				document.head.appendChild(styleEl);
			}

			// 🧠 Lógica JS determinando valores CSS + colores derivados para animaciones
			const baseBackground = styleTokens.background;
			const baseBorder =
				styleTokens.border.includes("transparent") ?
					tinycolor(baseBackground).toRgbString()
				:	styleTokens.border.replace(/^1px solid /, "");
			const glowColor = tinycolor(baseBorder).setAlpha(0.4).toRgbString();

			styleEl.textContent = `
        /* 🎨 Base styles */
        .badge-${badgeId} {
          background-color: ${styleTokens.background};
          color: ${styleTokens.color};
          border: ${styleTokens.border};
        }
        
        /* 🌊 PULSE BORDER - Respiración sutil del borde (2.5s ciclo) */
        @keyframes pulse-border-${badgeId} {
          0%, 100% { 
            border-color: ${baseBorder};
            box-shadow: 0 0 0 0 transparent;
          }
          50% { 
            border-color: ${tinycolor(baseBorder).lighten(10).toRgbString()};
            box-shadow: 0 0 8px 0 ${glowColor};
          }
        }
        .badge-${badgeId}.badge-pulse-border {
          animation: pulse-border-${badgeId} 2.5s ease-in-out infinite;
        }
        
        /* 🪩 PAFFF MOMENT - Latido de coherencia (1.5s ciclo) */
        @keyframes pafff-moment-${badgeId} {
          0%, 100% { 
            box-shadow: inset 0 0 0 1px ${baseBorder}, 0 0 0 2px ${glowColor};
          }
          50% { 
            box-shadow: inset 0 0 0 2px ${tinycolor(baseBorder).lighten(5).toRgbString()}, 
                        0 0 0 4px ${glowColor}, 
                        0 0 12px 0 ${glowColor};
          }
        }
        .badge-${badgeId}.badge-pafff-moment {
          animation: pafff-moment-${badgeId} 1.5s ease-in-out infinite;
          border-color: ${baseBorder};
        }
      `;

			return () => {
				// Cleanup para evitar polución del DOM
				if (styleEl && styleEl.parentNode) {
					styleEl.parentNode.removeChild(styleEl);
				}
			};
		}, [badgeId, styleTokens]);

		// 4. 📐 INLINE STYLES: Dimensiones estructurales (Layout)
		// Las dimensiones suelen ser estables y no requieren pseudo-clases, por lo que inline es eficiente.
		const structuralStyles = useMemo(() => {
			if (!sizeTokens) return {};
			return {
				height: sizeTokens.height,
				padding: sizeTokens.padding,
				fontSize: sizeTokens.fontSize,
				gap: sizeTokens.gap,
			} as React.CSSProperties;
		}, [sizeTokens]);

		// 🔄 FALLBACK VISUAL: Skeleton o estado base si no hay tokens
		if (!sizeTokens || !styleTokens) {
			return (
				<div
					ref={ref}
					className={cn(
						"inline-flex items-center justify-center rounded-full bg-neutral-200 animate-pulse h-6 w-16",
						className,
					)}
					{...props}
				/>
			);
		}

		return (
			<div
				ref={ref}
				className={cn(
					// Clase única vinculada al CSS inyectado
					`badge-${badgeId}`,
					// Clases base utilitarias (Layout & Shape)
					"inline-flex items-center justify-center rounded-full font-medium transition-colors duration-200",
					// 🌊 Efectos SUSTRATO - Retroalimentación visual al humano
					pulseBorder && `badge-pulse-border`,
					pafffMoment && `badge-pafff-moment`,
					// Estilos específicos inyectados
					className,
				)}
				style={structuralStyles}
				{...props}>
				{LeftIcon && (
					<StandardIcon
						size={sizeTokens.iconSize}
						colorScheme={colorScheme}
						colorShade={styleTokens.iconColorShade}
						className={cn("-ml-0.5", iconClassName)}>
						<LeftIcon />
					</StandardIcon>
				)}

				{/* El texto hereda el color del contenedor (establecido por CSS inyectado) */}
				<StandardText
					asElement="span"
					size={size === "2xs" ? "4xs" : size}
					className="leading-none text-inherit">
					{children}
				</StandardText>

				{RightIcon && (
					<StandardIcon
						size={sizeTokens.iconSize}
						colorScheme={colorScheme}
						colorShade={styleTokens.iconColorShade}
						className={cn("-mr-0.5", iconClassName)}>
						<RightIcon />
					</StandardIcon>
				)}
			</div>
		);
	},
);

StandardBadge.displayName = "StandardBadge";

export { StandardBadge };
