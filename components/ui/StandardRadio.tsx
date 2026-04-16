//. 📍 components/ui/StandardRadio.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import React, { forwardRef, useMemo, useId } from "react";
import { cn } from "@/lib/utils";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import type { RadioSize } from "@/app/providers/DesignTokensProvider";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { StandardText } from "./StandardText";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACE 📦
export interface StandardRadioProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
	label?: React.ReactNode;
	description?: React.ReactNode;
	colorScheme?: ColorSchemeVariant;
	size?: RadioSize;
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
			className,
			label,
			description,
			colorScheme = "primary",
			size = "md",
			disabled = false,
			error = false,
			checked,
			onChange,
			labelClassName,
			descriptionClassName,
			id,
			...props
		},
		ref,
	) => {
		const { tokens } = useDesignTokens();

		const radioTokens = useMemo(() => {
			if (!tokens) return null;
			const effectiveColorScheme = error ? "danger" : colorScheme;
			return {
				size: tokens.radio.sizes[size],
				style: tokens.radio.styles[effectiveColorScheme],
			};
		}, [tokens, size, error, colorScheme]);

		const generatedId = useId();
		const effectiveId = id || generatedId;

		if (!radioTokens) {
			// Fallback rendering if tokens are not available
			return (
				<label
					className={cn(
						"flex items-center gap-2",
						disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
						className,
					)}>
					<div className="w-5 h-5 rounded-full border-2 border-gray-400 bg-gray-200" />
					{label && <span className={labelClassName}>{label}</span>}
				</label>
			);
		}

		const radioVisualStyle: React.CSSProperties = {
			width: radioTokens.size.box,
			height: radioTokens.size.box,
			backgroundColor: radioTokens.style.background,
			borderColor:
				checked ? radioTokens.style.checked.border : radioTokens.style.border,
			borderWidth: radioTokens.size.borderThickness,
			borderRadius: radioTokens.size.borderRadius,
			transition: "all 0.2s ease-in-out",
		};

		return (
			<label
				htmlFor={effectiveId}
				className={cn(
					"flex items-start gap-2",
					disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
					className,
				)}>
				<div className="relative flex-shrink-0">
					<input
						type="radio"
						id={effectiveId}
						ref={ref}
						checked={checked}
						disabled={disabled}
						onChange={onChange}
						className="sr-only peer"
						{...props}
					/>
					<div
						style={radioVisualStyle}
						className={cn(
							"peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
						)}>
						<div
							className={cn(
								"transition-all duration-200 ease-circ-out",
								checked ? "scale-100 opacity-100" : "scale-0 opacity-0",
							)}
							style={{
								width: radioTokens.size.indicatorSize,
								height: radioTokens.size.indicatorSize,
								borderRadius: "50%",
								backgroundColor: radioTokens.style.checked.indicator,
							}}
						/>
					</div>
				</div>
				{(label || description) && (
					<div className="flex flex-col flex-grow pt-px">
						{label && (
							<StandardText
								size={size}
								weight="medium"
								className={cn("leading-tight", labelClassName)}>
								{label}
							</StandardText>
						)}
						{description && (
							<StandardText
								size="xs"
								className={cn(
									"leading-tight mt-0.5 opacity-80",
									descriptionClassName,
								)}
								colorShade="subtle">
								{description}
							</StandardText>
						)}
					</div>
				)}
			</label>
		);
	},
);
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
StandardRadio.displayName = "StandardRadio";
export { StandardRadio };
//#endregion ![foo]
