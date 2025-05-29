// components/ui/input.tsx
// Versión 1.0.2 (Corrección de espaciado inferior y duplicación)

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, X, CheckCircle, Eye, EyeOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "@/app/theme-provider";
import {
	generateInputTokens,
	type InputSize,
	type InputVariant,
	type InputTokens,
} from "@/lib/theme/components/input-tokens";
import {
	Icon,
	type Color as IconColorType,
	type IconProps,
} from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

export interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
	leadingIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	trailingIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	error?: string;
	success?: boolean;
	isEditing?: boolean;
	showCharacterCount?: boolean;
	onClear?: () => void;
	variant?: InputVariant;
	size?: InputSize;
	isRequired?: boolean;
	"aria-describedby"?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className,
			type,
			leadingIcon,
			trailingIcon,
			error,
			success,
			isEditing,
			showCharacterCount,
			onClear,
			variant = "default",
			size = "md",
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
			...props
		},
		ref
	) => {
		const { appColorTokens, mode } = useTheme();
		const inputRef = React.useRef<HTMLInputElement>(null);
		React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

		const [showPassword, setShowPassword] = React.useState(false);
		const inputType = type === "password" && showPassword ? "text" : type;

		const charCount = React.useMemo(() => {
			if (value === null || value === undefined) return 0;
			return String(value).length;
		}, [value]);

		const inputTokens: InputTokens | null = React.useMemo(() => {
			if (!appColorTokens || !mode) return null;
			return generateInputTokens(appColorTokens, mode);
		}, [appColorTokens, mode]);

		React.useEffect(() => {
			const element = inputRef.current;
			if (element && inputTokens && appColorTokens) {
				const cvt = inputTokens.variants[variant];
				let effectiveBackgroundColor = cvt.background;
				let effectiveTextColor = cvt.text;

				if (disabled) {
					effectiveBackgroundColor = cvt.disabledBackground;
					effectiveTextColor = cvt.disabledText;
				} else if (readOnly) {
					effectiveBackgroundColor = cvt.readOnlyBackground;
					effectiveTextColor = cvt.readOnlyText;
				} else if (error) {
					effectiveBackgroundColor = cvt.errorBackground;
				} else if (success) {
					effectiveBackgroundColor = cvt.successBackground;
				} else if (isEditing) {
					effectiveBackgroundColor = cvt.editingBackground;
				}

				element.style.setProperty("--input-bg", cvt.background);
				element.style.setProperty("--input-border", cvt.border);
				element.style.setProperty("--input-placeholder", cvt.placeholder);
				element.style.setProperty("--input-focus-border", cvt.focusBorder);
				element.style.setProperty("--input-focus-ring", cvt.focusRing);
				element.style.setProperty(
					"--input-readonly-focus-border",
					cvt.readOnlyBorder
				);
				element.style.setProperty("--input-error-bg", cvt.errorBackground);
				element.style.setProperty("--input-error-border", cvt.errorBorder);
				element.style.setProperty("--input-error-ring", cvt.errorRing);
				element.style.setProperty("--input-success-bg", cvt.successBackground);
				element.style.setProperty("--input-success-border", cvt.successBorder);
				element.style.setProperty("--input-success-ring", cvt.successRing);
				element.style.setProperty(
					"--input-disabled-bg",
					cvt.disabledBackground
				);
				element.style.setProperty(
					"--input-disabled-border",
					cvt.disabledBorder
				);
				element.style.setProperty("--input-disabled-text", cvt.disabledText);
				element.style.setProperty(
					"--input-readonly-bg",
					cvt.readOnlyBackground
				);
				element.style.setProperty(
					"--input-readonly-border",
					cvt.readOnlyBorder
				);
				element.style.setProperty("--input-readonly-text", cvt.readOnlyText);
				element.style.setProperty("--input-editing-bg", cvt.editingBackground);
				element.style.setProperty(
					"--input-autofill-bg",
					effectiveBackgroundColor
				);
				element.style.setProperty("--input-text", effectiveTextColor);
			}
		}, [
			inputTokens,
			variant,
			appColorTokens,
			disabled,
			error,
			success,
			isEditing,
			readOnly,
			id,
			name,
		]);

		const sizeTokens = inputTokens
			? inputTokens.sizes[size]
			: {
					height: "h-10",
					fontSize: "text-sm",
					paddingX: "px-3",
					paddingY: "py-2",
			  };

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange?.(e);
		};

		const mapInputSizeToIconInternalSize = (
			s: InputSize
		): IconProps["size"] => {
			switch (s) {
				case "sm":
					return "xs";
				case "lg":
					return "md";
				default:
					return "sm";
			}
		};
		const iconInternalSize = mapInputSizeToIconInternalSize(size);
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
		const togglePasswordVisibility = () => setShowPassword(!showPassword);

		const paddingClassesArray: string[] = [];
		if (inputTokens) {
			const basePaddingXFromTokens = sizeTokens.paddingX;
			const specificLeadingPaddingClass =
				size === "sm" ? "pl-7" : size === "lg" ? "pl-12" : "pl-10";
			const specificTrailingPaddingClassBase =
				size === "sm" ? "pr-7" : size === "lg" ? "pr-12" : "pr-10";
			const hasLeadingIcon = !!leadingIcon;
			const hasAnyVisibleTrailingElement =
				!!trailingIcon ||
				(value && onClear && !disabled && !readOnly) ||
				!!error ||
				success ||
				type === "password";

			if (hasLeadingIcon) {
				paddingClassesArray.push(specificLeadingPaddingClass);
			} else {
				if (basePaddingXFromTokens.startsWith("px-")) {
					paddingClassesArray.push(
						basePaddingXFromTokens.replace("px-", "pl-")
					);
				} else {
					paddingClassesArray.push(basePaddingXFromTokens);
				}
			}

			if (hasAnyVisibleTrailingElement) {
				let numTrailingElements = 0;
				if (type === "password" && !readOnly && !disabled)
					numTrailingElements++;
				if (value && onClear && !disabled && !readOnly) numTrailingElements++;
				if ((error || (success && !error)) && !disabled && !readOnly)
					numTrailingElements++;
				if (
					trailingIcon &&
					!error &&
					!(success && !error) &&
					!(value && onClear && !disabled && !readOnly) &&
					type !== "password"
				)
					numTrailingElements++;

				if (numTrailingElements > 1) {
					const basePrValue = size === "sm" ? 7 : size === "md" ? 10 : 12;
					const iconWidthApprox = size === "sm" ? 5 : size === "md" ? 6 : 7;
					paddingClassesArray.push(
						`pr-${basePrValue + (numTrailingElements - 1) * iconWidthApprox}`
					);
				} else if (numTrailingElements === 1) {
					paddingClassesArray.push(specificTrailingPaddingClassBase);
				} else {
					if (basePaddingXFromTokens.startsWith("px-")) {
						paddingClassesArray.push(
							basePaddingXFromTokens.replace("px-", "pr-")
						);
					} else {
						paddingClassesArray.push(basePaddingXFromTokens);
					}
				}
			} else {
				if (basePaddingXFromTokens.startsWith("px-")) {
					paddingClassesArray.push(
						basePaddingXFromTokens.replace("px-", "pr-")
					);
				} else {
					paddingClassesArray.push(basePaddingXFromTokens);
				}
			}
		} else {
			paddingClassesArray.push("px-3");
		}

		const baseClasses = [
			"peer",
			"flex",
			"w-full",
			"rounded-md",
			"transition-all",
			"border",
			sizeTokens.height,
			sizeTokens.fontSize,
			...paddingClassesArray,
			sizeTokens.paddingY,
			"placeholder:text-[var(--input-placeholder)]",
			"text-[var(--input-text)]",
		];
		const stateClasses: string[] = [];
		if (disabled) {
			stateClasses.push(
				"border-[var(--input-disabled-border)]",
				"bg-[var(--input-disabled-bg)]",
				"cursor-not-allowed",
				"opacity-70"
			);
		} else if (readOnly) {
			stateClasses.push(
				"border-[var(--input-readonly-border)]",
				"bg-[var(--input-readonly-bg)]",
				"cursor-default",
				"read-only:focus:outline-none",
				"read-only:focus:ring-0",
				"read-only:focus:border-[var(--input-readonly-focus-border)]"
			);
		} else if (error) {
			stateClasses.push(
				"border-[var(--input-error-border)]",
				"bg-[var(--input-error-bg)]"
			);
		} else if (success) {
			stateClasses.push(
				"border-[var(--input-success-border)]",
				"bg-[var(--input-success-bg)]"
			);
		} else if (isEditing) {
			stateClasses.push(
				"border-[var(--input-border)]",
				"bg-[var(--input-editing-bg)]"
			);
		} else {
			stateClasses.push("border-[var(--input-border)]", "bg-[var(--input-bg)]");
		}

		const focusClasses: string[] = [];
		if (!disabled && !readOnly) {
			focusClasses.push("focus:outline-none");
			if (error) {
				focusClasses.push(
					"focus:border-[var(--input-error-border)]",
					"focus:shadow-[0_0_0_3px_var(--input-error-ring)]"
				);
			} else if (success) {
				focusClasses.push(
					"focus:border-[var(--input-success-border)]",
					"focus:shadow-[0_0_0_3px_var(--input-success-ring)]"
				);
			} else {
				focusClasses.push(
					"focus:border-[var(--input-focus-border)]",
					"focus:shadow-[0_0_0_3px_var(--input-focus-ring)]"
				);
			}
		}
		const inputClasses = cn(
			...baseClasses,
			...stateClasses,
			...focusClasses,
			className
		);

		let baseIconColor: IconColorType = "neutral";
		let baseIconColorVariant: IconProps["colorVariant"] = "text";
		if (disabled) {
			baseIconColor = "neutral";
			baseIconColorVariant = "text";
		} else if (readOnly) {
			baseIconColor = "neutral";
			baseIconColorVariant = "text";
		} else if (variant === "default") {
			baseIconColor = "primary";
			baseIconColorVariant = "shade";
		} else if (
			["primary", "secondary", "tertiary", "accent", "neutral"].includes(
				variant
			)
		) {
			baseIconColor = variant as IconColorType;
			baseIconColorVariant = "shade";
		}

		const dynamicInputStyle: React.CSSProperties = { ...style };

		const showCharCountEffective =
			showCharacterCount &&
			maxLength &&
			maxLength > 0 &&
			!disabled &&
			!readOnly;

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
							autoComplete !== undefined
								? autoComplete
								: type === "password"
								? "current-password"
								: "off"
						}
						style={dynamicInputStyle}
						aria-invalid={!!error}
						aria-required={isRequired}
						aria-describedby={ariaDescribedBy}
						{...props}
					/>
					{leadingIcon && (
						<div
							className={`absolute ${getIconLeftPosition()} top-0 h-full flex items-center pointer-events-none`}>
							{" "}
							<Icon
								color={baseIconColor}
								colorVariant={baseIconColorVariant}
								size={iconInternalSize}>
								{" "}
								{React.createElement(leadingIcon)}{" "}
							</Icon>{" "}
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
								<Icon
									color={baseIconColor}
									colorVariant={baseIconColorVariant}
									size={iconInternalSize}>
									{React.createElement(showPassword ? EyeOff : Eye)}
								</Icon>
							</button>
						)}
						{value && onClear && !disabled && !readOnly && (
							<button
								type="button"
								className="outline-none focus:outline-none"
								onClick={onClear}
								tabIndex={-1}
								aria-label="Limpiar campo">
								<Icon
									color={error ? "danger" : baseIconColor}
									colorVariant={error ? "pure" : baseIconColorVariant}
									size={iconInternalSize}>
									{" "}
									<X />{" "}
								</Icon>
							</button>
						)}
						{(error || (success && !error)) && !disabled && !readOnly && (
							<Icon
								color={error ? "danger" : "success"}
								colorVariant="pure"
								size={iconInternalSize}>
								{" "}
								{error ? (
									<AlertCircle className="pointer-events-none" />
								) : (
									<CheckCircle className="pointer-events-none" />
								)}{" "}
							</Icon>
						)}
						{trailingIcon &&
							!error &&
							!(success && !error) &&
							!(value && onClear && !disabled && !readOnly) &&
							type !== "password" &&
							!disabled &&
							!readOnly && (
								<div className="pointer-events-none">
									{" "}
									<Icon
										color={baseIconColor}
										colorVariant={baseIconColorVariant}
										size={iconInternalSize}>
										{" "}
										{React.createElement(trailingIcon)}{" "}
									</Icon>{" "}
								</div>
							)}
					</div>
				</div>

				{showCharCountEffective && (
					<div className="mt-1.5 flex justify-end">
						<Text
							size="xs"
							color={error && appColorTokens ? "danger" : "neutral"}
							colorVariant={error && appColorTokens ? "pure" : "textShade"}
							className="opacity-70">
							{charCount}/{maxLength}
						</Text>
					</div>
				)}
			</div>
		);
	}
);

Input.displayName = "Input";
export { Input };
