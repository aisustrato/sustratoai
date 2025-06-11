//. 📍 components/ui/StandardLabel.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";
import { StandardText, type StandardTextProps } from "./StandardText";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACE 📦

//> 💡 CORREGIDO: Seleccionamos explícitamente solo las props de estilo de StandardText que necesitamos.
type StandardLabelStyleProps = Pick<
	StandardTextProps,
	| "variant"
	| "size"
	| "weight"
	| "align"
	| "truncate"
	| "applyGradient"
	| "colorScheme"
	| "colorShade"
	| "fontType"
>;

//> 💡 La nueva interfaz ahora extiende las props de Radix y añade nuestras props de estilo sin conflicto.
export interface StandardLabelProps
	extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
		StandardLabelStyleProps {
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
			//> Props de StandardText para el estilo
			className,
			children,
			variant = "label",
			colorScheme,
			colorShade,
			size,
			weight,
			align,
			truncate,
			applyGradient,
			fontType,
			//> El resto de las props son para LabelPrimitive.Root (ej. htmlFor)
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
					variant={variant}
					colorScheme={colorScheme}
					colorShade={colorShade}
					size={size}
					weight={weight}
					align={align}
					truncate={truncate}
					applyGradient={applyGradient}
					fontType={fontType}>
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