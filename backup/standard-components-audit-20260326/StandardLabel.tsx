"use client";

// 🎯 V4 COMPATIBLE: Este componente NO necesita tokens propios.
// Solo compone StandardText (ya en v4) y envuelve Radix UI Label.
// ✅ Ya está optimizado por composición.

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";
// --- ✅ PASO 2: Importamos el componente Y el nuevo tipo de props de ESTILO ---
import { StandardText, type StandardTextStyleProps } from "./StandardText";

//#region [def] - 📦 TYPES & INTERFACE 📦

// --- La nueva interfaz ahora extiende las props de Radix y AÑADE el tipo de estilo desacoplado ---
export interface StandardLabelProps
	extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
		StandardTextStyleProps { // <-- ¡Mucho más simple y robusto!
	children: React.ReactNode;
	className?: string;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
const StandardLabel = React.forwardRef<
	React.ElementRef<typeof LabelPrimitive.Root>,
	StandardLabelProps
>(
	(
		{
			// Props de StandardText para el estilo (ahora vienen de StandardTextStyleProps)
			className,
			children,
			preset = "caption",
			colorScheme,
			colorShade,
			size,
			weight,
			align,
			truncate,
			applyGradient,
			// El resto de las props son para LabelPrimitive.Root (ej. htmlFor)
			...labelProps
		},
		ref
	) => {
		return (
			<LabelPrimitive.Root
				ref={ref}
				className={cn("cursor-pointer", className)}
				{...labelProps}>
				<StandardText
					preset={preset}
					colorScheme={colorScheme}
					colorShade={colorShade}
					size={size}
					weight={weight}
					align={align}
					truncate={truncate}
					applyGradient={applyGradient}
					>
					{children}
				</StandardText>
			</LabelPrimitive.Root>
		);
	}
);
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
StandardLabel.displayName = "StandardLabel";
export { StandardLabel };
//#endregion ![foo]