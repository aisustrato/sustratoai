// 📍 components/ui/StandardInput.tsx (v4.3 - EFECTOS SUSTRATO)
// 🎯 PROPÓSITO: Input estándar con validación visual en tiempo real
// 🔧 DECISIÓN: CSS dinámico para animaciones, inline para colores (patrón Flex)
// ✅ ARQUITECTURA: Tokens precalculados + compatibilidad Zod/react-hook-form
// 🌸 FILOSOFÍA: Humanismo en co-evolución AI - feedback visual inmediato

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, X, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import { StandardIcon, type StandardIconProps } from "./StandardIcon";
import { StandardText } from "./StandardText";
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

// 🎯 Extensión para CSS Properties personalizadas
interface CustomCSSProperties extends React.CSSProperties {
	"--input-border-color"?: string;
	"--input-focus-border-color"?: string;
	"--input-focus-ring-color"?: string;
}

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
			placeholder, // 🎯 AÑADIR: Extraer placeholder de las props
			...props
		},
		ref,
	) => {
		// 💎 CORE: Tokens precalculados - NO recalcula en cada render
		const { tokens } = useDesignTokens();
		const inputRef = React.useRef<HTMLInputElement>(null);
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

		// � INLINE STYLES COMPUTADOS (patrón StandardSelect v4.3)
		const [isHovered, setIsHovered] = React.useState(false);
		const [isFocused, setIsFocused] = React.useState(false);

		// Estilos base según tokens + CSS Variables para animaciones
		const computedStyle = useMemo((): CustomCSSProperties => {
			if (!styleTokens) return {};

			// Disabled state
			if (disabled) {
				return {
					backgroundColor: styleTokens.disabledBackground,
					borderColor: styleTokens.disabledBorder,
					color: styleTokens.disabledText,
					cursor: "not-allowed",
					opacity: 0.7,
					// CSS Variables para animaciones
					"--input-border-color": styleTokens.disabledBorder,
					"--input-focus-border-color": styleTokens.focusBorder,
					"--input-focus-ring-color": styleTokens.focusRing,
				};
			}

			// ReadOnly state
			if (readOnly) {
				return {
					backgroundColor: styleTokens.readOnlyBackground,
					borderColor: styleTokens.readOnlyBorder,
					color: styleTokens.readOnlyText,
					cursor: "default",
					// CSS Variables para animaciones
					"--input-border-color": styleTokens.readOnlyBorder,
					"--input-focus-border-color": styleTokens.focusBorder,
					"--input-focus-ring-color": styleTokens.focusRing,
				};
			}

			// Error state
			if (error) {
				return {
					backgroundColor: styleTokens.errorBackground,
					borderColor: styleTokens.errorBorder,
					outline: "none",
					boxShadow: isFocused ? `0 0 0 3px ${styleTokens.errorRing}` : "none",
					// CSS Variables para animaciones
					"--input-border-color": styleTokens.errorBorder,
					"--input-focus-border-color": styleTokens.focusBorder,
					"--input-focus-ring-color": styleTokens.errorRing,
				};
			}

			// Success state
			if (success && !error) {
				return {
					backgroundColor: styleTokens.successBackground,
					borderColor: styleTokens.successBorder,
					outline: "none",
					boxShadow:
						isFocused ? `0 0 0 3px ${styleTokens.successRing}` : "none",
					// CSS Variables para animaciones
					"--input-border-color": styleTokens.successBorder,
					"--input-focus-border-color": styleTokens.focusBorder,
					"--input-focus-ring-color": styleTokens.successRing,
				};
			}

			// Editing state
			if (isEditing && !error && !success) {
				return {
					backgroundColor: styleTokens.editingBackground,
					borderColor: styleTokens.border,
					color: styleTokens.text,
					// CSS Variables para animaciones
					"--input-border-color": styleTokens.border,
					"--input-focus-border-color": styleTokens.focusBorder,
					"--input-focus-ring-color": styleTokens.focusRing,
				};
			}

			// Focus state
			if (isFocused) {
				return {
					backgroundColor: styleTokens.background,
					borderColor: styleTokens.focusBorder,
					color: styleTokens.text,
					outline: "none",
					boxShadow: `0 0 0 3px ${styleTokens.focusRing}`,
					// CSS Variables para animaciones
					"--input-border-color": styleTokens.border,
					"--input-focus-border-color": styleTokens.focusBorder,
					"--input-focus-ring-color": styleTokens.focusRing,
				};
			}

			// Default state
			return {
				backgroundColor: styleTokens.background,
				borderColor: styleTokens.border,
				color: styleTokens.text,
				// CSS Variables para animaciones
				"--input-border-color": styleTokens.border,
				"--input-focus-border-color": styleTokens.focusBorder,
				"--input-focus-ring-color": styleTokens.focusRing,
			};
		}, [styleTokens, disabled, readOnly, error, success, isEditing, isFocused]);

		// Hover style (solo si no está focused, disabled, o con error/success)
		const hoverStyle = useMemo((): CustomCSSProperties => {
			if (
				!styleTokens ||
				disabled ||
				readOnly ||
				isFocused ||
				error ||
				(success && !error)
			) {
				return {};
			}
			if (isHovered) {
				return { borderColor: styleTokens.hoverBorder };
			}
			return {};
		}, [styleTokens, isHovered, disabled, readOnly, isFocused, error, success]);

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
		const sizeStyles = useMemo((): CustomCSSProperties => {
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

		// 🏷️ CSS Classes para animaciones (solo pulseBorder y pafffMoment)
		const stateClasses = useMemo(() => {
			return cn(
				pulseBorder && !error && !success && "input-pulse-border",
				pafffMoment && !error && !success && "input-pafff-moment",
			);
		}, [pulseBorder, pafffMoment, error, success]);

		const inputClasses = cn(
			"flex w-full rounded-md border transition-all duration-200",
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

		// 🔄 Event handlers
		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange?.(e);
		};

		const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(true);
			onFocus?.(e);
		};

		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(false);
			onBlur?.(e);
		};

		const handleMouseEnter = () => setIsHovered(true);
		const handleMouseLeave = () => setIsHovered(false);

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
						onFocus={handleFocus}
						onBlur={handleBlur}
						onMouseEnter={handleMouseEnter}
						onMouseLeave={handleMouseLeave}
						disabled={disabled}
						maxLength={maxLength}
						readOnly={readOnly}
						autoComplete={
							autoComplete !== undefined ? autoComplete
							: type === "password" ?
								"current-password"
							:	"off"
						}
						style={{ ...sizeStyles, ...computedStyle, ...hoverStyle, ...style }}
						placeholder={placeholder}
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
