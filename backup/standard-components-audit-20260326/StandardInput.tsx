// 📍 components/ui/StandardInput.tsx (v4.3 - EFECTOS SUSTRATO)
// 🎯 PROPÓSITO: Input estándar con validación visual en tiempo real
// 🔧 DECISIÓN: CSS dinámico para animaciones, inline para colores (patrón Flex)
// ✅ ARQUITECTURA: Tokens precalculados + compatibilidad Zod/react-hook-form
// 🌸 FILOSOFÍA: Humanismo en co-evolución AI - feedback visual inmediato

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import { useEffect, useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, X, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import { StandardIcon, type StandardIconProps } from "./StandardIcon";
import { StandardText } from "./StandardText";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACE 📦
export type IconProps = React.SVGProps<SVGSVGElement>;
export type StandardInputSize = "sm" | "md" | "lg";
export type StandardInputVariant =
	| "default"
	| "primary"
	| "secondary"
	| "tertiary"
	| "accent"
	| "neutral";

export interface StandardInputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
	colorScheme?: StandardInputVariant;
	size?: StandardInputSize;
	leadingIcon?: React.ComponentType<IconProps>;
	trailingIcon?: React.ComponentType<IconProps>;
	error?: string;
	success?: boolean;
	isEditing?: boolean;
	showCharacterCount?: boolean;
	onClear?: () => void;
	isRequired?: boolean;
	"aria-describedby"?: string;
	/** 🌊 Efecto de respiración sutil del borde - pulso orgánico */
	pulseBorder?: boolean;
	/** 🪩 Momento Pafff - borde destacado para insight/coherencia */
	pafffMoment?: boolean;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
const StandardInput = React.forwardRef<HTMLInputElement, StandardInputProps>(
	(
		{
			className,
			type,
			colorScheme = "default",
			size = "md",
			leadingIcon,
			trailingIcon,
			error,
			success,
			isEditing,
			showCharacterCount,
			onClear,
			disabled,
			id,
			name,
			value,
			onChange,
			maxLength,
			readOnly,
			onFocus,
			onBlur,
			style,
			autoComplete,
			isRequired,
			"aria-describedby": ariaDescribedBy,
			pulseBorder = false,
			pafffMoment = false,
			...props
		},
		ref,
	) => {
		// 💎 CORE: Tokens precalculados - NO recalcula en cada render
		const { tokens } = useDesignTokens();
		const inputRef = React.useRef<HTMLInputElement>(null);
		const inputId = useId().replace(/:/g, "");
		React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

		const [showPassword, setShowPassword] = React.useState(false);
		const inputType = type === "password" && showPassword ? "text" : type;

		// 💎 CORE: Obtener tokens precalculados
		const sizeTokens = tokens?.input.sizes[size];
		const styleTokens = tokens?.input.styles[colorScheme];

		const charCount = useMemo(() => {
			if (value === null || value === undefined) return 0;
			return String(value).length;
		}, [value]);

		// 🏛️ PATRÓN FLEX: CSS dinámico inyectado para animaciones de focus
		useEffect(() => {
			if (!styleTokens) return;

			const styleElement = document.createElement("style");
			styleElement.setAttribute("data-input-id", inputId);
			styleElement.textContent = `
				/* 🎨 Base states */
				.input-${inputId} {
					background-color: ${styleTokens.background};
					border-color: ${styleTokens.border};
					color: ${styleTokens.text};
				}
				.input-${inputId}::placeholder {
					color: ${styleTokens.placeholder};
				}
				
				/* 🔄 Hover */
				.input-${inputId}:not(:disabled):not(:read-only):not(:focus):not(.input-error):not(.input-success):hover {
					border-color: ${styleTokens.hoverBorder};
				}
				
				/* 🎯 Focus states - base */
				.input-${inputId}:not(:disabled):not(:read-only):not(.input-error):not(.input-success):focus {
					outline: none;
					border-color: ${styleTokens.focusBorder};
					box-shadow: 0 0 0 3px ${styleTokens.focusRing};
				}
				
				/* ❌ Error state - MAYOR ESPECIFICIDAD */
				.input-${inputId}.input-error,
				.input-${inputId}.input-error:hover,
				.input-${inputId}.input-error:focus {
					background-color: ${styleTokens.errorBackground};
					border-color: ${styleTokens.errorBorder} !important;
				}
				.input-${inputId}.input-error:focus {
					outline: none;
					box-shadow: 0 0 0 3px ${styleTokens.errorRing};
				}
				
				/* ✅ Success state - MAYOR ESPECIFICIDAD */
				.input-${inputId}.input-success,
				.input-${inputId}.input-success:hover,
				.input-${inputId}.input-success:focus {
					background-color: ${styleTokens.successBackground};
					border-color: ${styleTokens.successBorder} !important;
				}
				.input-${inputId}.input-success:focus {
					outline: none;
					box-shadow: 0 0 0 3px ${styleTokens.successRing};
				}
				
				/* 📝 Editing state */
				.input-${inputId}.input-editing {
					background-color: ${styleTokens.editingBackground};
				}
				
				/* 🔒 Disabled state */
				.input-${inputId}:disabled {
					background-color: ${styleTokens.disabledBackground};
					border-color: ${styleTokens.disabledBorder};
					color: ${styleTokens.disabledText};
					cursor: not-allowed;
					opacity: 0.7;
				}
				
				/* 📖 ReadOnly state */
				.input-${inputId}:read-only {
					background-color: ${styleTokens.readOnlyBackground};
					border-color: ${styleTokens.readOnlyBorder};
					color: ${styleTokens.readOnlyText};
					cursor: default;
				}
				.input-${inputId}:read-only:focus {
					outline: none;
					box-shadow: none;
				}
				
				/* 🌊 PULSE BORDER - Respiración sutil del borde */
				@keyframes pulse-border-${inputId} {
					0%, 100% { 
						border-color: ${styleTokens.border};
						box-shadow: 0 0 0 0 transparent;
					}
					50% { 
						border-color: ${styleTokens.focusBorder};
						box-shadow: 0 0 8px 0 ${styleTokens.focusRing};
					}
				}
				.input-${inputId}.input-pulse-border {
					animation: pulse-border-${inputId} 2.5s ease-in-out infinite;
				}
				.input-${inputId}.input-pulse-border:focus {
					animation: none;
				}
				
				/* 🪩 PAFFF MOMENT - Borde destacado para insight/coherencia */
				/* El Pafff respira INCLUSO en focus - es el momento de coherencia mientras escribes */
				@keyframes pafff-moment-${inputId} {
					0%, 100% { 
						box-shadow: inset 0 0 0 1px ${styleTokens.focusBorder}, 0 0 0 2px ${styleTokens.focusRing};
					}
					50% { 
						box-shadow: inset 0 0 0 2px ${styleTokens.focusBorder}, 0 0 0 4px ${styleTokens.focusRing}, 0 0 12px 0 ${styleTokens.focusRing};
					}
				}
				.input-${inputId}.input-pafff-moment {
					animation: pafff-moment-${inputId} 1.5s ease-in-out infinite;
					border-color: ${styleTokens.focusBorder};
				}
				.input-${inputId}.input-pafff-moment:focus {
					outline: none;
					/* La animación SIGUE - el focus ring está integrado en la animación */
				}
			`;
			document.head.appendChild(styleElement);

			return () => {
				const existing = document.querySelector(
					`style[data-input-id="${inputId}"]`,
				);
				if (existing) document.head.removeChild(existing);
			};
		}, [inputId, styleTokens]);

		//#region [sub_helpers] - 🧰 HELPER FUNCTIONS 🧰
		const togglePasswordVisibility = () => setShowPassword(!showPassword);

		const getIconSizeForInput = (
			s: StandardInputSize,
		): StandardIconProps["size"] => {
			switch (s) {
				case "sm":
					return "xs";
				case "lg":
					return "md";
				default:
					return "sm";
			}
		};
		const iconInternalSize = getIconSizeForInput(size);

		const getIconLeftPosition = () => {
			switch (size) {
				case "sm":
					return "left-2.5";
				case "lg":
					return "left-4";
				default:
					return "left-3";
			}
		};
		//#endregion ![sub_helpers]

		// 🎨 INLINE STYLES: Solo dimensiones (colores van en CSS dinámico)
		const sizeStyles = useMemo(() => {
			if (!sizeTokens) return {};
			return {
				height: sizeTokens.height,
				fontSize: sizeTokens.fontSize,
				paddingTop: sizeTokens.paddingY,
				paddingBottom: sizeTokens.paddingY,
			};
		}, [sizeTokens]);

		// Padding classes basados en iconos
		const paddings = {
			sm: {
				withIcon: "pl-8",
				withoutIcon: "pl-3",
				withTrailer: "pr-8",
				withoutTrailer: "pr-3",
			},
			md: {
				withIcon: "pl-10",
				withoutIcon: "pl-4",
				withTrailer: "pr-10",
				withoutTrailer: "pr-4",
			},
			lg: {
				withIcon: "pl-12",
				withoutIcon: "pl-5",
				withTrailer: "pr-12",
				withoutTrailer: "pr-5",
			},
		};
		const currentPaddings = paddings[size];
		const hasLeadingIcon = !!leadingIcon;
		const hasAnyVisibleTrailingElement =
			!!trailingIcon ||
			(value && onClear && !disabled && !readOnly) ||
			!!error ||
			success ||
			type === "password";

		const paddingClasses = useMemo(() => {
			const classes: string[] = [];
			classes.push(
				hasLeadingIcon ? currentPaddings.withIcon : currentPaddings.withoutIcon,
			);
			classes.push(
				hasAnyVisibleTrailingElement ?
					currentPaddings.withTrailer
				:	currentPaddings.withoutTrailer,
			);
			return classes;
		}, [hasLeadingIcon, hasAnyVisibleTrailingElement, currentPaddings]);

		// 🏷️ CSS Classes para estados
		const stateClasses = useMemo(() => {
			return cn(
				`input-${inputId}`,
				error && "input-error",
				success && !error && "input-success",
				isEditing && !error && !success && "input-editing",
				pulseBorder && !error && !success && "input-pulse-border",
				pafffMoment && !error && !success && "input-pafff-moment",
			);
		}, [inputId, error, success, isEditing, pulseBorder, pafffMoment]);

		const inputClasses = cn(
			"peer flex w-full rounded-md border transition-all duration-200",
			...paddingClasses,
			stateClasses,
			className,
		);

		const showCharCountEffective =
			showCharacterCount &&
			maxLength &&
			maxLength > 0 &&
			!disabled &&
			!readOnly;

		// 🔄 Event handler
		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange?.(e);
		};

		// 🔄 FALLBACK: Si tokens no están listos
		if (!sizeTokens || !styleTokens) {
			return (
				<input
					ref={ref}
					disabled
					className="opacity-50 border rounded px-3 py-2 w-full"
					placeholder="Cargando..."
				/>
			);
		}

		//#region [render] - 🎨 RENDER 🎨
		return (
			<div className="w-full">
				<div className="relative w-full">
					<input
						id={id}
						name={name}
						type={inputType}
						className={inputClasses}
						ref={inputRef}
						value={value ?? ""}
						onChange={handleChange}
						onFocus={onFocus}
						onBlur={onBlur}
						disabled={disabled}
						maxLength={maxLength}
						readOnly={readOnly}
						autoComplete={
							autoComplete !== undefined ? autoComplete
							: type === "password" ?
								"current-password"
							:	"off"
						}
						style={{ ...sizeStyles, ...style }}
						aria-invalid={!!error}
						aria-required={isRequired}
						aria-describedby={ariaDescribedBy}
						{...props}
					/>
					{leadingIcon && (
						<div
							className={`absolute ${getIconLeftPosition()} top-0 h-full flex items-center pointer-events-none`}>
							<StandardIcon
								styleType="outline"
								colorScheme="primary"
								colorShade="text"
								size={iconInternalSize}>
								{React.createElement(leadingIcon)}
							</StandardIcon>
						</div>
					)}
					<div
						className={`absolute right-3 top-0 h-full flex items-center gap-2`}>
						{type === "password" && !readOnly && !disabled && (
							<button
								type="button"
								className="outline-none focus:outline-none"
								onClick={togglePasswordVisibility}
								tabIndex={-1}
								aria-label={
									showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
								}>
								<StandardIcon
									styleType="outline"
									colorScheme="primary"
									colorShade="text"
									size={iconInternalSize}>
									{React.createElement(showPassword ? EyeOff : Eye)}
								</StandardIcon>
							</button>
						)}
						{value && onClear && !disabled && !readOnly && (
							<button
								type="button"
								className="outline-none focus:outline-none"
								onClick={onClear}
								tabIndex={-1}
								aria-label="Limpiar campo">
								<StandardIcon
									colorScheme="primary"
									colorShade="text"
									size={iconInternalSize}>
									<X />
								</StandardIcon>
							</button>
						)}
						{(error || (success && !error)) && !disabled && !readOnly && (
							<StandardIcon
								styleType="outline"
								colorScheme={error ? "danger" : "success"}
								colorShade="pure"
								size={iconInternalSize}>
								{error ?
									<AlertCircle className="pointer-events-none" />
								:	<CheckCircle className="pointer-events-none" />}
							</StandardIcon>
						)}
						{trailingIcon &&
							!error &&
							!(success && !error) &&
							!(value && onClear && !disabled && !readOnly) &&
							type !== "password" &&
							!disabled &&
							!readOnly && (
								<div className="pointer-events-none">
									<StandardIcon
										styleType="outline"
										colorScheme="primary"
										colorShade="text"
										size={iconInternalSize}>
										{React.createElement(trailingIcon)}
									</StandardIcon>
								</div>
							)}
					</div>
				</div>

				{showCharCountEffective && (
					<div className="mt-1.5 flex justify-end">
						<StandardText
							size="xs"
							colorScheme={error ? "danger" : "neutral"}
							colorShade={error ? "pure" : "textShade"}
							className="opacity-70">
							{charCount}/{maxLength}
						</StandardText>
					</div>
				)}
			</div>
		);
		//#endregion ![render]
	},
);
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
StandardInput.displayName = "StandardInput";
export { StandardInput };
//#endregion ![foo]
