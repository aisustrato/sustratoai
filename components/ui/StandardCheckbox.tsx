//. 📍 components/ui/StandardCheckbox.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import React, { forwardRef, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
	generateStandardCheckTokens,
	type StandardCheckVariant,
	type StandardCheckSize,
	type StandardCheckStyleType,
	type StandardCheckTokens,
} from "@/lib/theme/components/standard-check-tokens";
import { StandardText } from "./StandardText";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACE 📦
export interface StandardCheckboxProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
	label?: React.ReactNode;
	description?: React.ReactNode;
	colorScheme?: ColorSchemeVariant;
	size?: StandardCheckSize;
	styleType?: StandardCheckStyleType;
	indeterminate?: boolean;
	error?: boolean;
	className?: string;
	labelClassName?: string;
	descriptionClassName?: string;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
const StandardCheckbox = forwardRef<HTMLInputElement, StandardCheckboxProps>(
	(
		{
			className, label, description, colorScheme, size = "md", styleType,
			indeterminate = false, disabled = false, error = false, checked,
			defaultChecked, onChange, labelClassName, descriptionClassName,
			id, ...props
		},
		ref
	) => {
		//#region [sub_bridge] - 🌉 THE BRIDGE 🌉
		const variant: StandardCheckVariant = (colorScheme as StandardCheckVariant) || 'primary';
		const visualVariant: StandardCheckStyleType = styleType || 'default';
		//#endregion ![sub_bridge]

		//#region [sub_init] - 🪝 HOOKS, STATE, REFS, MEMOS 🪝
		const { appColorTokens } = useTheme();
		const [isChecked, setIsChecked] = useState<boolean>(
			() => checked ?? defaultChecked ?? false
		);
		const [isIndeterminate, setIsIndeterminate] = useState<boolean>(indeterminate);
		
		const internalInputRef = useRef<HTMLInputElement>(null);
		React.useImperativeHandle(ref, () => internalInputRef.current as HTMLInputElement);

		const tokens: StandardCheckTokens | null = React.useMemo(() => {
			if (!appColorTokens) return null;
			return generateStandardCheckTokens(
				appColorTokens, size, error ? "danger" : variant, visualVariant
			);
		}, [appColorTokens, size, error, variant, visualVariant]);
		
		const effectiveId = id || React.useId();
		//#endregion ![sub_init]

		//#region [sub_effects] - 💡 EFFECTS 💡
		useEffect(() => {
			if (checked !== undefined) { setIsChecked(checked); }
		}, [checked]);

		useEffect(() => {
			setIsIndeterminate(indeterminate);
		}, [indeterminate]);

		useEffect(() => {
			if (internalInputRef.current) {
				internalInputRef.current.indeterminate = isIndeterminate;
			}
		}, [isIndeterminate]);
		//#endregion ![sub_effects]

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			if (checked === undefined) { setIsChecked(e.target.checked); }
			if (isIndeterminate) { setIsIndeterminate(false); }
			onChange?.(e);
		};

        //> 💡 CORREGIDO: Se restaura el bloque de fallback completo.
		if (!tokens) {
			const fallbackSize = getSizeTokens(size);
			return (
				<label className={cn("flex items-start gap-2", disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer", className)}>
					<div
						className="flex-shrink-0 border rounded bg-gray-200 border-gray-400"
						style={{
							width: fallbackSize.box,
							height: fallbackSize.box,
							borderRadius: fallbackSize.borderRadius,
						}}
					/>
					{(label || description) && (
						<div className="flex flex-col flex-grow">
							{label && (
								<span className={cn("font-medium text-gray-500", labelClassName)} style={{ fontSize: fallbackSize.fontSize }}>
									{label}
								</span>
							)}
							{description && (
								<span className={cn("text-xs text-gray-400", descriptionClassName)}>
									{description}
								</span>
							)}
						</div>
					)}
				</label>
			);
		}

		const checkboxVisualStyle: React.CSSProperties = {
			width: tokens.size.box, height: tokens.size.box,
			backgroundColor: isChecked || isIndeterminate ? tokens.checked.background : tokens.background,
			borderColor: isChecked || isIndeterminate ? tokens.checked.border : tokens.border,
			borderWidth: tokens.size.borderThickness || "1.5px",
			borderStyle: "solid", borderRadius: tokens.size.borderRadius,
			transition: "all 0.2s ease-in-out", display: "flex",
			alignItems: "center", justifyContent: "center",
			position: "relative", flexShrink: 0,
		};

		const checkVariants = { visible: { pathLength: 1, opacity: 1 }, hidden: { pathLength: 0, opacity: 0 } };
		const indeterminateVariants = { visible: { scaleX: 1, opacity: 1 }, hidden: { scaleX: 0, opacity: 0 } };

		//#region [render] - 🎨 RENDER 🎨
		return (
			<label htmlFor={effectiveId} className={cn("flex items-start gap-2", disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer", className)}>
				<div className="relative flex-shrink-0">
					<input
						type="checkbox" id={effectiveId} ref={internalInputRef}
						checked={isChecked} disabled={disabled} onChange={handleChange}
						className="sr-only peer" {...props}
					/>
					<motion.div style={checkboxVisualStyle} className={cn("peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2")}>
						<motion.svg viewBox="0 0 24 24" className="w-[70%] h-[70%]"
                            initial={false} animate={isChecked && !isIndeterminate ? "visible" : "hidden"} aria-hidden="true"
                        >
							<motion.path
								d="M4 12l5 5L20 7" fill="transparent"
								strokeWidth={tokens.size.checkThickness || 3}
								stroke={tokens.checked.check}
								strokeLinecap="round" strokeLinejoin="round"
								variants={checkVariants} transition={{ duration: 0.15, ease: "circOut" }}
							/>
						</motion.svg>
						{isIndeterminate && (
							<motion.div className="absolute" initial={false} animate={isIndeterminate ? "visible" : "hidden"} aria-hidden="true">
								<motion.div
									style={{
										width: `calc(${tokens.size.box} * 0.6)`,
										height: tokens.size.checkThickness || 3,
										backgroundColor: tokens.checked.check,
										borderRadius: "1px",
									}}
									variants={indeterminateVariants} transition={{ duration: 0.1, ease: "circOut" }}
								/>
							</motion.div>
						)}
					</motion.div>
				</div>
				{(label || description) && (
					<div className="flex flex-col flex-grow pt-px">
						{label && (
							<StandardText
								size={tokens.size.fontSize as any}
                                weight="medium"
								className={cn("leading-tight", labelClassName)}
								colorScheme={disabled ? 'neutral' : variant as ColorSchemeVariant}
                                colorShade={disabled ? 'textShade' : 'text'}
                            >
								{label}
							</StandardText>
						)}
						{description && (
							<StandardText
                                size="xs"
								className={cn("leading-tight mt-0.5 opacity-80", descriptionClassName)}
								colorScheme={disabled ? 'neutral' : 'neutral'}
                                colorShade="textShade"
                            >
								{description}
							</StandardText>
						)}
					</div>
				)}
			</label>
		);
		//#endregion ![render]
	}
);
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS & HELPERS 🔚
StandardCheckbox.displayName = "StandardCheckbox";
export { StandardCheckbox };

//> 💡 Se añade la función helper duplicada que el bloque de fallback necesita.
//> Esto es un "code smell" que podríamos refactorizar a futuro para no duplicar lógica.
function getSizeTokens(size: StandardCheckSize) {
	const defaultSizes = {
		box: "20px", checkThickness: 3, borderRadius: "4px", fontSize: "0.875rem",
	};
	switch (size) {
		case "xs": return { box: "14px", checkThickness: 2, borderRadius: "3px", fontSize: "0.75rem" };
		case "sm": return { box: "16px", checkThickness: 2.5, borderRadius: "4px", fontSize: "0.875rem" };
		case "lg": return { box: "24px", checkThickness: 3.5, borderRadius: "5px", fontSize: "1rem" };
		case "xl": return { box: "28px", checkThickness: 4, borderRadius: "6px", fontSize: "1.125rem" };
		default: return defaultSizes;
	}
}
//#endregion ![foo]