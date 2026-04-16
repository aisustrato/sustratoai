//. 📍 components/ui/StandardFormField.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { StandardLabel } from "./StandardLabel"; //> 💡 CORREGIDO: Usando StandardLabel
import { StandardText } from "./StandardText";   //> 💡 CORREGIDO: Usando StandardText
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACE 📦
export interface StandardFormFieldProps {
	label: string;
	htmlFor: string;
	className?: string;
	children: React.ReactNode;
	hint?: string;
	error?: string;
	isRequired?: boolean;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export function StandardFormField({
	label,
	htmlFor,
	className,
	children,
	hint,
	error,
	isRequired,
}: StandardFormFieldProps) {
	//#region [sub_init] - 🪝 HOOKS & STATE 🪝
	const [isFocused, setIsFocused] = React.useState(false);

	const formFieldWrapperId = `form-field-wrapper-${htmlFor}`;
	const hintId = hint ? `${htmlFor}-hint` : undefined;
	const errorId = error ? `${htmlFor}-error` : undefined;
	//#endregion ![sub_init]

	//#region [sub_effects] - 💡 LOGIC & EFFECTS 💡
	React.useEffect(() => {
		const formFieldDiv = document.getElementById(formFieldWrapperId);
		if (!formFieldDiv) return;
		
		const handleFocusIn = (event: FocusEvent) => {
			if (event.target && (event.target as HTMLElement).closest(
					'input, textarea, select, [role="combobox"]'
			)) {
				setIsFocused(true);
			}
		};
		const handleFocusOut = (event: FocusEvent) => {
			//> Si el nuevo foco está fuera del wrapper, se considera "blur"
			if (!formFieldDiv.contains(event.relatedTarget as Node)) {
				setIsFocused(false);
			}
		};

		formFieldDiv.addEventListener("focusin", handleFocusIn);
		formFieldDiv.addEventListener("focusout", handleFocusOut);

		return () => {
			formFieldDiv.removeEventListener("focusin", handleFocusIn);
			formFieldDiv.removeEventListener("focusout", handleFocusOut);
		};
	}, [htmlFor, formFieldWrapperId]);

	//> 💡 Lógica de reactividad para el color del label
	let labelColorScheme: ColorSchemeVariant = "neutral";
	let labelColorShade: "text" | "pure" = "text";

	if (error) {
		labelColorScheme = "danger";
		labelColorShade = "pure";
	} else if (isFocused) {
		labelColorScheme = "primary";
		labelColorShade = "pure";
	}

	//> Lógica para pasar props de accesibilidad a los hijos
	const childrenWithProps = React.Children.map(children, (child) => {
		if (React.isValidElement(child)) {
			return React.cloneElement(child as React.ReactElement<React.ComponentPropsWithoutRef<'input'>>, {
				"aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
			});
		}
		return child;
	});
	//#endregion ![sub_effects]

	//#region [render] - 🎨 RENDER 🎨
	return (
		<div id={formFieldWrapperId} className={cn("space-y-1.5", className)}>
			<div>
                {/* //> 💡 CORREGIDO: Usando StandardLabel y pasando el color reactivo */}
				<StandardLabel
					htmlFor={htmlFor}
					colorScheme={labelColorScheme}
					colorShade={labelColorShade}
					className="transition-colors duration-200"
                >
					{label}
					{isRequired && (
						<span className="text-danger-pure ml-0.5 select-none">*</span>
					)}
				</StandardLabel>
			</div>

			{childrenWithProps}

			{hint && !error && (
				<div id={hintId}>
                    {/* //> 💡 CORREGIDO: Usando StandardText para el hint */}
					<StandardText size="xs" colorScheme="neutral" colorShade="textShade">
						{hint}
					</StandardText>
				</div>
			)}
			{error && (
				<div id={errorId}>
                    {/* //> 💡 CORREGIDO: Usando StandardText para el error */}
					<StandardText size="xs" colorScheme="danger" colorShade="pure">
						{error}
					</StandardText>
				</div>
			)}
		</div>
	);
	//#endregion ![render]
}
//#endregion ![main]