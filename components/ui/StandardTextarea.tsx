//. 📍 components/ui/StandardTextarea.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
	generateStandardTextareaTokens,
	type StandardTextareaSize,
	type StandardTextareaVariant,
	type StandardTextareaTokens,
} from "@/lib/theme/components/standard-textarea-tokens";
import { StandardText } from "./StandardText"; //> 💡 Usando StandardText
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACE 📦
export interface StandardTextareaProps
	extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
	colorScheme?: ColorSchemeVariant;
	size?: StandardTextareaSize;
	error?: string;
	success?: boolean;
	isEditing?: boolean;
	showCharacterCount?: boolean;
	isRequired?: boolean;
	"aria-describedby"?: string;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
const StandardTextarea = React.forwardRef<
	HTMLTextAreaElement,
	StandardTextareaProps
>(
	(
		{
			className, error, success, isEditing, showCharacterCount,
			colorScheme, size = "md", disabled, id, name, value,
			onChange, maxLength, readOnly, onFocus, onBlur, style,
			isRequired, "aria-describedby": ariaDescribedBy, rows = 3, ...props
		},
		ref
	) => {
		//#region [sub_bridge] - 🌉 THE BRIDGE 🌉
		let variant: StandardTextareaVariant;
		if (colorScheme) {
			variant = colorScheme as StandardTextareaVariant;
		} else {
			variant = "default";
		}
		//#endregion ![sub_bridge]

		//#region [sub_init] - 🪝 HOOKS, STATE, REFS, MEMOS 🪝
		const { appColorTokens, mode } = useTheme();
		const textareaRef = React.useRef<HTMLTextAreaElement>(null);
		React.useImperativeHandle(
			ref,
			() => textareaRef.current as HTMLTextAreaElement
		);

		const charCount = React.useMemo(() => {
			if (value === null || value === undefined) return 0;
			return String(value).length;
		}, [value]);

		const textareaTokens: StandardTextareaTokens | null = React.useMemo(() => {
			if (!appColorTokens || !mode) return null;
			return generateStandardTextareaTokens(appColorTokens, mode);
		}, [appColorTokens, mode]);
		//#endregion ![sub_init]

		//#region [sub_effects] - 💡 EFFECTS 💡
		React.useEffect(() => {
			const element = textareaRef.current;
			if (element && textareaTokens && appColorTokens) {
				const cvt = textareaTokens.variants[variant];

				let effectiveBackgroundColor = cvt.background;
				if (disabled) { effectiveBackgroundColor = cvt.disabledBackground; } 
                else if (readOnly) { effectiveBackgroundColor = cvt.readOnlyBackground; } 
                else if (error) { effectiveBackgroundColor = cvt.errorBackground; } 
                else if (success) { effectiveBackgroundColor = cvt.successBackground; } 
                else if (isEditing) { effectiveBackgroundColor = cvt.editingBackground; }

				element.style.setProperty("--textarea-bg", cvt.background);
				element.style.setProperty("--textarea-border", cvt.border);
				element.style.setProperty("--textarea-text", cvt.text);
				element.style.setProperty("--textarea-placeholder", cvt.placeholder);
				element.style.setProperty("--textarea-focus-border", cvt.focusBorder);
				element.style.setProperty("--textarea-focus-ring", cvt.focusRing);
				element.style.setProperty("--textarea-error-bg", cvt.errorBackground);
				element.style.setProperty("--textarea-error-border", cvt.errorBorder);
				element.style.setProperty("--textarea-error-ring", cvt.errorRing);
				element.style.setProperty("--textarea-success-bg", cvt.successBackground);
				element.style.setProperty("--textarea-success-border", cvt.successBorder);
				element.style.setProperty("--textarea-success-ring", cvt.successRing);
				element.style.setProperty("--textarea-disabled-bg", cvt.disabledBackground);
				element.style.setProperty("--textarea-disabled-border", cvt.disabledBorder);
				element.style.setProperty("--textarea-disabled-text", cvt.disabledText);
				element.style.setProperty("--textarea-readonly-bg", cvt.readOnlyBackground);
				element.style.setProperty("--textarea-readonly-border", cvt.readOnlyBorder);
				element.style.setProperty("--textarea-readonly-text", cvt.readOnlyText);
				element.style.setProperty("--textarea-editing-bg", cvt.editingBackground);
				element.style.setProperty("--textarea-autofill-bg", effectiveBackgroundColor);
			}
		}, [ textareaTokens, variant, appColorTokens, disabled, error, success, isEditing, readOnly, id, name, ]);
		//#endregion ![sub_effects]

		const sizeTokens = textareaTokens
			? textareaTokens.sizes[size]
			: { height: "h-auto", minHeight: "min-h-[80px]", fontSize: "text-sm", paddingX: "px-3", paddingY: "py-2" };

		const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
			onChange?.(e);
		};

		const baseClasses = [ "peer", "w-full", "rounded-md", "transition-all", "border", sizeTokens.height, sizeTokens.minHeight, sizeTokens.fontSize, sizeTokens.paddingX, sizeTokens.paddingY, "placeholder:text-[var(--textarea-placeholder)]", "text-[var(--textarea-text)]", "resize-y" ];
		const stateClasses: string[] = [];
		if (disabled) { stateClasses.push("border-[var(--textarea-disabled-border)]", "bg-[var(--textarea-disabled-bg)]", "text-[var(--textarea-disabled-text)]", "cursor-not-allowed", "opacity-70"); } 
        else if (readOnly) { stateClasses.push("border-[var(--textarea-readonly-border)]", "bg-[var(--textarea-readonly-bg)]", "text-[var(--textarea-readonly-text)]", "cursor-default", "read-only:focus:outline-none", "read-only:focus:ring-0", "read-only:focus:border-[var(--textarea-readonly-border)]"); } 
        else if (error) { stateClasses.push("border-[var(--textarea-error-border)]", "bg-[var(--textarea-error-bg)]"); } 
        else if (success) { stateClasses.push("border-[var(--textarea-success-border)]", "bg-[var(--textarea-success-bg)]"); } 
        else if (isEditing) { stateClasses.push("border-[var(--textarea-border)]", "bg-[var(--textarea-editing-bg)]"); } 
        else { stateClasses.push("border-[var(--textarea-border)]", "bg-[var(--textarea-bg)]"); }
		
		const focusClasses: string[] = [];
		if (!disabled && !readOnly) {
			focusClasses.push("focus:outline-none");
			if (error) { focusClasses.push("focus:border-[var(--textarea-error-border)]", "focus:shadow-[0_0_0_3px_var(--textarea-error-ring)]"); } 
            else if (success) { focusClasses.push("focus:border-[var(--textarea-success-border)]", "focus:shadow-[0_0_0_3px_var(--textarea-success-ring)]"); } 
            else { focusClasses.push("focus:border-[var(--textarea-focus-border)]", "focus:shadow-[0_0_0_3px_var(--textarea-focus-ring)]"); }
		}

		const textareaClasses = cn(...baseClasses, ...stateClasses, ...focusClasses, className);
		const showCharCountEffective = showCharacterCount && maxLength && maxLength > 0 && !disabled && !readOnly;

		//#region [render] - 🎨 RENDER 🎨
		return (
			<div className="w-full">
				<textarea
					id={id} name={name} className={textareaClasses} ref={textareaRef}
					value={value ?? ""} onChange={handleChange} onFocus={onFocus}
					onBlur={onBlur} disabled={disabled} maxLength={maxLength}
					readOnly={readOnly} style={style} rows={rows}
					aria-invalid={!!error} aria-required={isRequired}
					aria-describedby={ariaDescribedBy} {...props}
				/>
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
StandardTextarea.displayName = "StandardTextarea";
export { StandardTextarea };
//#endregion ![foo]