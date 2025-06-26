//. 📍 components/ui/StandardInput.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, X, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useTheme } from "@/app/theme-provider";
import {
	generateStandardInputTokens,
	type StandardInputSize,
	type StandardInputVariant,
	type StandardInputTokens,
} from "@/lib/theme/components/standard-input-tokens";
import { StandardIcon, type StandardIconProps } from "./StandardIcon";
import { StandardText } from "./StandardText";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACE 📦
export type IconProps = React.SVGProps<SVGSVGElement>;

export interface StandardInputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
	colorScheme?: ColorSchemeVariant;
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
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
const StandardInput = React.forwardRef<HTMLInputElement, StandardInputProps>(
	(
		{
			className, type, colorScheme, size = "md", leadingIcon, trailingIcon,
			error, success, isEditing, showCharacterCount, onClear, disabled,
			id, name, value, onChange, maxLength, readOnly, onFocus, onBlur,
			style, autoComplete, isRequired, "aria-describedby": ariaDescribedBy,
			...props
		},
		ref
	) => {
		//> 💡 LÍNEA DE DEPURACIÓN: Verificamos el valor de las props en cada renderizado.
		console.log(
			`[StandardInput ID: ${id}] - Renderizando. Prop 'error':`, error, "| Prop 'success':", success
		);

		//#region [sub_bridge] - 🌉 THE BRIDGE 🌉
		function isStandardInputVariant(value: any): value is StandardInputVariant {
			return ["default", "primary", "secondary", "tertiary", "accent", "neutral"].includes(value);
		}
		const effectiveColorScheme: StandardInputVariant =
			colorScheme && isStandardInputVariant(colorScheme) ? colorScheme : "default";
		//#endregion ![sub_bridge]

		//#region [sub_init] - 🪝 HOOKS, STATE, REFS, MEMOS 🪝
		const { appColorTokens, mode } = useTheme();
		const inputRef = React.useRef<HTMLInputElement>(null);
		React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

		const [showPassword, setShowPassword] = React.useState(false);
		const inputType = type === "password" && showPassword ? "text" : type;

		const charCount = React.useMemo(() => {
			if (value === null || value === undefined) return 0;
			return String(value).length;
		}, [value]);

		const inputTokens: StandardInputTokens | null = React.useMemo(() => {
			if (!appColorTokens) return null;
			return generateStandardInputTokens(appColorTokens, mode);
		}, [appColorTokens, mode]);
		//#endregion ![sub_init]

		//#region [sub_logic_effects] - 💡 LOGIC & EFFECTS 💡
		React.useEffect(() => {
			const element = inputRef.current;
			if (element && inputTokens && appColorTokens) {
				const cvt = inputTokens.variants[effectiveColorScheme];
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
				element.style.setProperty("--input-readonly-focus-border", cvt.readOnlyBorder);
				element.style.setProperty("--input-error-bg", cvt.errorBackground);
				element.style.setProperty("--input-error-border", cvt.errorBorder);
				element.style.setProperty("--input-error-ring", cvt.errorRing);
				element.style.setProperty("--input-success-bg", cvt.successBackground);
				element.style.setProperty("--input-success-border", cvt.successBorder);
				element.style.setProperty("--input-success-ring", cvt.successRing);
				element.style.setProperty("--input-disabled-bg", cvt.disabledBackground);
				element.style.setProperty("--input-disabled-border", cvt.disabledBorder);
				element.style.setProperty("--input-disabled-text", cvt.disabledText);
				element.style.setProperty("--input-readonly-bg", cvt.readOnlyBackground);
				element.style.setProperty("--input-readonly-border", cvt.readOnlyBorder);
				element.style.setProperty("--input-readonly-text", cvt.readOnlyText);
				element.style.setProperty("--input-editing-bg", cvt.editingBackground);
				element.style.setProperty("--input-autofill-bg", effectiveBackgroundColor);
				element.style.setProperty("--input-text", effectiveTextColor);
			}
		}, [ inputTokens, effectiveColorScheme, appColorTokens, disabled, error, success, isEditing, readOnly, id, name, ]);
        
		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange?.(e);
		};
		//#endregion ![sub_logic_effects]

		//#region [sub_helpers] - 🧰 HELPER FUNCTIONS 🧰
		const togglePasswordVisibility = () => setShowPassword(!showPassword);
		
		const getIconSizeForInput = (s: StandardInputSize): StandardIconProps['size'] => {
			switch (s) {
				case "sm": return "xs";
				case "lg": return "md";
				default: return "sm";
			}
		};
		const iconInternalSize = getIconSizeForInput(size);

		const getIconLeftPosition = () => {
			switch (size) {
				case "sm": return "left-2.5";
				case "lg": return "left-4";
				default: return "left-3";
			}
		};
		//#endregion ![sub_helpers]
        
		const sizeTokens = inputTokens ? inputTokens.sizes[size] : { height: "h-10", fontSize: "text-sm", paddingX: "px-3", paddingY: "py-2" };
		const paddings = {
			sm: { withIcon: "pl-7", withoutIcon: "pl-3", withTrailer: "pr-7", withoutTrailer: "pr-3" },
			md: { withIcon: "pl-10", withoutIcon: "pl-4", withTrailer: "pr-10", withoutTrailer: "pr-4" },
			lg: { withIcon: "pl-12", withoutIcon: "pl-4", withTrailer: "pr-12", withoutTrailer: "pr-4" },
		};
		const currentPaddings = paddings[size];
		const hasLeadingIcon = !!leadingIcon;
		const hasAnyVisibleTrailingElement = !!trailingIcon || (value && onClear && !disabled && !readOnly) || !!error || success || type === "password";
		const paddingClassesArray: string[] = [];
		paddingClassesArray.push(hasLeadingIcon ? currentPaddings.withIcon : currentPaddings.withoutIcon);
		if (hasAnyVisibleTrailingElement) {
			let numTrailingElements = 0;
			if (type === "password" && !readOnly && !disabled) numTrailingElements++;
			if (value && onClear && !disabled && !readOnly) numTrailingElements++;
			if ((error || (success && !error)) && !disabled && !readOnly) numTrailingElements++;
			if (trailingIcon && !error && !(success && !error) && !(value && onClear && !disabled && !readOnly) && type !== "password") numTrailingElements++;
			if (numTrailingElements > 1) {
				const basePrValue = size === "sm" ? 7 : size === "md" ? 10 : 12;
				const iconWidthApprox = size === "sm" ? 5 : size === "md" ? 6 : 7;
				paddingClassesArray.push(`pr-${basePrValue + (numTrailingElements - 1) * iconWidthApprox}`);
			} else if (numTrailingElements === 1) {
				paddingClassesArray.push(currentPaddings.withTrailer);
			} else {
				paddingClassesArray.push(currentPaddings.withoutTrailer);
			}
		} else {
			paddingClassesArray.push(currentPaddings.withoutTrailer);
		}

		const baseClasses = [ "peer", "flex", "w-full", "rounded-md", "transition-all", "border", sizeTokens.height, sizeTokens.fontSize, ...paddingClassesArray, sizeTokens.paddingY, "placeholder:text-[var(--input-placeholder)]", "text-[var(--input-text)]", ];
		
        const stateClasses: string[] = [];
		if (disabled) {
			stateClasses.push( "border-[var(--input-disabled-border)]", "bg-[var(--input-disabled-bg)]", "cursor-not-allowed", "opacity-70" );
		} else if (readOnly) {
			stateClasses.push( "border-[var(--input-readonly-border)]", "bg-[var(--input-readonly-bg)]", "cursor-default", "read-only:focus:outline-none", "read-only:focus:ring-0", "read-only:focus:border-[var(--input-readonly-focus-border)]" );
		} else if (error) {
			stateClasses.push( "border-[var(--input-error-border)]", "bg-[var(--input-error-bg)]" );
		} else if (success) {
			stateClasses.push( "border-[var(--input-success-border)]", "bg-[var(--input-success-bg)]" );
		} else if (isEditing) {
			stateClasses.push( "border-[var(--input-border)]", "bg-[var(--input-editing-bg)]" );
		} else {
			stateClasses.push("border-[var(--input-border)]", "bg-[var(--input-bg)]");
		}

		const focusClasses: string[] = [];
		if (!disabled && !readOnly) {
			focusClasses.push("focus:outline-none");
			if (error) { focusClasses.push( "focus:border-[var(--input-error-border)]", "focus:shadow-[0_0_0_3px_var(--input-error-ring)]" ); } 
            else if (success) { focusClasses.push( "focus:border-[var(--input-success-border)]", "focus:shadow-[0_0_0_3px_var(--input-success-ring)]" ); } 
            else { focusClasses.push( "focus:border-[var(--input-focus-border)]", "focus:shadow-[0_0_0_3px_var(--input-focus-ring)]" ); }
		}
		const inputClasses = cn( ...baseClasses, ...stateClasses, ...focusClasses, className );
		const showCharCountEffective = showCharacterCount && maxLength && maxLength > 0 && !disabled && !readOnly;

		//#region [render] - 🎨 RENDER 🎨
		return (
			<div className="w-full">
				<div className="relative w-full">
					<input
						id={id} name={name} type={inputType} className={inputClasses} ref={inputRef}
						value={value ?? ""} onChange={handleChange} onFocus={onFocus} onBlur={onBlur}
						disabled={disabled} maxLength={maxLength} readOnly={readOnly}
						autoComplete={ autoComplete !== undefined ? autoComplete : type === "password" ? "current-password" : "off" }
						style={style} aria-invalid={!!error} aria-required={isRequired}
						aria-describedby={ariaDescribedBy} {...props}
					/>
					{leadingIcon && (
						<div className={`absolute ${getIconLeftPosition()} top-0 h-full flex items-center pointer-events-none`}>
							<StandardIcon  styleType="outline" colorScheme="primary" colorShade="text" size={iconInternalSize}>
								{React.createElement(leadingIcon)}
							</StandardIcon>
						</div>
					)}
					<div className={`absolute right-3 top-0 h-full flex items-center gap-2`}>
						{type === "password" && !readOnly && !disabled && (
							<button type="button" className="outline-none focus:outline-none" onClick={togglePasswordVisibility} tabIndex={-1} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
								<StandardIcon styleType="outline" colorScheme="primary" colorShade="text" size={iconInternalSize}>
									{React.createElement(showPassword ? EyeOff : Eye)}
								</StandardIcon>
							</button>
						)}
						{value && onClear && !disabled && !readOnly && (
							<button type="button" className="outline-none focus:outline-none" onClick={onClear} tabIndex={-1} aria-label="Limpiar campo">
								<StandardIcon colorScheme="primary" colorShade="text" size={iconInternalSize}>
									<X />
								</StandardIcon>
							</button>
						)}
						{(error || (success && !error)) && !disabled && !readOnly && (
							<StandardIcon styleType="outline" colorScheme={error ? "danger" : "success"} colorShade="pure" size={iconInternalSize}>
								{error ? <AlertCircle className="pointer-events-none" /> : <CheckCircle className="pointer-events-none" />}
							</StandardIcon>
						)}
						{trailingIcon && !error && !(success && !error) && !(value && onClear && !disabled && !readOnly) && type !== "password" && !disabled && !readOnly && (
							<div className="pointer-events-none">
								<StandardIcon styleType="outline" colorScheme="primary" colorShade="text" size={iconInternalSize}>
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
	}
);
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
StandardInput.displayName = "StandardInput";
export { StandardInput };
//#endregion ![foo]