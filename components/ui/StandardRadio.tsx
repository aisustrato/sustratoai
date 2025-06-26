//. 📍 components/ui/StandardRadio.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import React, { forwardRef, useMemo, useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
	generateStandardRadioTokens,
	type StandardRadioVariant,
	type StandardRadioSize,
	type StandardRadioTokens,
} from "@/lib/theme/components/standard-radio-tokens";
import { StandardText } from "./StandardText";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACE 📦
export interface StandardRadioProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
	label?: React.ReactNode;
	description?: React.ReactNode;
	colorScheme?: StandardRadioVariant;
	size?: StandardRadioSize;
	error?: boolean;
	className?: string;
	labelClassName?: string;
	descriptionClassName?: string;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
const StandardRadio = forwardRef<HTMLInputElement, StandardRadioProps>(
	(
		{
			className, label, description, colorScheme = 'primary', size = "md",
			disabled = false, error = false, checked,
			onChange, labelClassName, descriptionClassName,
			id, ...props
		},
		ref
	) => {
		const { appColorTokens } = useTheme();

		const tokens: StandardRadioTokens | null = useMemo(() => {
			if (!appColorTokens) return null;
			return generateStandardRadioTokens(
				appColorTokens, size, error ? "danger" : colorScheme
			);
		}, [appColorTokens, size, error, colorScheme]);

		const generatedId = useId();
		const effectiveId = id || generatedId;

		if (!tokens) {
			// Fallback rendering if tokens are not available
			return (
				<label className={cn("flex items-center gap-2", disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer", className)}>
					<div className="w-5 h-5 rounded-full border-2 border-gray-400 bg-gray-200" />
					{label && <span className={labelClassName}>{label}</span>}
				</label>
			);
		}

		const radioVisualStyle: React.CSSProperties = {
			width: tokens.size.box, height: tokens.size.box,
			backgroundColor: tokens.background,
			borderColor: checked ? tokens.checked.border : tokens.border,
			borderWidth: tokens.size.borderThickness,
			borderRadius: tokens.size.borderRadius,
			transition: "all 0.2s ease-in-out",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		};

		const indicatorVariants = { 
			visible: { scale: 1, opacity: 1 }, 
			hidden: { scale: 0, opacity: 0 } 
		};

		return (
			<label htmlFor={effectiveId} className={cn("flex items-start gap-2", disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer", className)}>
				<div className="relative flex-shrink-0">
					<input
						type="radio" id={effectiveId} ref={ref}
						checked={checked} disabled={disabled} onChange={onChange}
						className="sr-only peer" {...props}
					/>
					<motion.div style={radioVisualStyle} className={cn("peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2")}>
						<motion.div
							style={{
								width: tokens.size.indicatorSize,
								height: tokens.size.indicatorSize,
								borderRadius: '50%',
								backgroundColor: tokens.checked.indicator,
							}}
							initial={false}
							animate={checked ? "visible" : "hidden"}
							variants={indicatorVariants}
							transition={{ duration: 0.2, ease: "circOut" }}
						/>
					</motion.div>
				</div>
				{(label || description) && (
					<div className="flex flex-col flex-grow pt-px">
						{label && (
							<StandardText size={size} weight="medium" className={cn("leading-tight", labelClassName)}>
								{label}
							</StandardText>
						)}
						{description && (
							<StandardText size="xs" className={cn("leading-tight mt-0.5 opacity-80", descriptionClassName)} colorShade="subtle">
								{description}
							</StandardText>
						)}
					</div>
				)}
			</label>
		);
	}
);
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
StandardRadio.displayName = "StandardRadio";
export { StandardRadio };
//#endregion ![foo]
