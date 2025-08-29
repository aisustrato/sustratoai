//. 📍 components/ui/StandardSelect.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/app/theme-provider";
import {
	generateStandardSelectTokens,
	type StandardSelectSize,
	type StandardSelectVariant,
	type StandardSelectTokens,
	type StandardSelectVariantTokens,
} from "@/lib/theme/components/standard-select-tokens";
import { StandardIcon, type StandardIconProps } from "./StandardIcon";
import { StandardText } from "./StandardText";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
//#endregion ![head]

//#region [def] - 📦 TYPES & CONSTANTS 📦
export type IconProps = React.SVGProps<SVGSVGElement>;

export interface SelectOption {
	value: string;
	label: string;
	disabled?: boolean;
	description?: string;
	icon?: React.ComponentType<IconProps>;
}

export interface StandardSelectProps
	extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange" | "value"> {
	options: SelectOption[];
	value?: string | string[];
	defaultValue?: string | string[];
	onChange?: (value: string | string[] | undefined) => void;
	onBlur?: () => void;
	colorScheme?: ColorSchemeVariant;
	size?: StandardSelectSize;
	error?: string;
	placeholder?: string;
	leadingIcon?: React.ComponentType<IconProps>;
	clearable?: boolean;
	multiple?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	isRequired?: boolean;
	name?: string;
	id?: string;
	fullWidth?: boolean;
	isEditing?: boolean;
	success?: boolean;
	autoFocus?: boolean;
	"aria-describedby"?: string;
}



const optionVariantsBase = {
	hidden: { opacity: 0, y: -3 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { delay: i * 0.02, duration: 0.15, ease: "easeOut" },
	}),
};
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
const StandardSelect = React.forwardRef<HTMLDivElement, StandardSelectProps>(
	(
		{
			options = [], className, colorScheme, size = "md", error: errorProp,
			placeholder = "Seleccione una opción", leadingIcon, clearable = false,
			multiple = false, onChange, onBlur: onBlurProp, value, defaultValue,
			disabled = false, readOnly = false, isRequired = false, name, id,
			fullWidth = true, isEditing = false, success = false, autoFocus = false,
			"aria-describedby": ariaDescribedBy, ...restRootProps
		},
		forwardedRef
	) => {
		//#region [sub_bridge] - 🌉 THE BRIDGE 🌉
		const validVariants: StandardSelectVariant[] = [ "default", "primary", "secondary", "tertiary", "accent", "neutral", ];
		const effectiveColorScheme: StandardSelectVariant =
			colorScheme && validVariants.includes(colorScheme as StandardSelectVariant)
				? (colorScheme as StandardSelectVariant)
				: "default";
		//#endregion ![sub_bridge]

		//#region [sub_init] - 🪝 HOOKS, STATE, REFS, MEMOS 🪝
		const { appColorTokens, mode } = useTheme();
		const [isOpen, setIsOpen] = React.useState(false);
		const [isFocused, setIsFocused] = React.useState(false);

		const componentRootRef = React.useRef<HTMLDivElement>(null);
		React.useImperativeHandle(forwardedRef, () => componentRootRef.current as HTMLDivElement);

		const selectClickableRef = React.useRef<HTMLDivElement>(null);
		const optionsRef = React.useRef<HTMLDivElement>(null);
		const hiddenInputRef = React.useRef<HTMLInputElement>(null);

		const [selectedValues, setSelectedValues] = React.useState<string[]>(() => {
			const initialVal = value !== undefined ? value : defaultValue;
			if (initialVal !== undefined) {
				return Array.isArray(initialVal) ? initialVal : initialVal ? [initialVal] : [];
			}
			return [];
		});
		
		const selectTokensInternal: StandardSelectTokens | null = React.useMemo(
			() => (appColorTokens ? generateStandardSelectTokens(appColorTokens, mode) : null),
			[appColorTokens, mode]
		);

        const selectedOptions = React.useMemo(
			() => options.filter((o) => selectedValues.includes(o.value)),
			[options, selectedValues]
		);
		//#endregion ![sub_init]

		//#region [sub_effects] - 💡 EFFECTS 💡
		React.useEffect(() => {
			if (value !== undefined) {
				const newSelected = Array.isArray(value) ? value : value ? [value] : [];
				if (JSON.stringify(newSelected) !== JSON.stringify(selectedValues)) {
					setSelectedValues(newSelected);
				}
			} else if (defaultValue === undefined && value === undefined) {
				if (selectedValues.length > 0) {
					setSelectedValues([]);
				}
			}
		}, [value, defaultValue, selectedValues]);

		React.useEffect(() => {
			const rootElement = componentRootRef.current;
			if (rootElement && selectTokensInternal) {
				const cvt: StandardSelectVariantTokens = selectTokensInternal.variants[effectiveColorScheme];
				let internalBg = cvt.background;
				let internalBorder = cvt.border;
				let internalText = cvt.text;
				const hasError = !!errorProp;

				if (disabled) {
					internalBg = cvt.disabledBackground;
					internalBorder = cvt.disabledBorder;
					internalText = cvt.disabledText;
				} else if (readOnly) {
					internalBg = cvt.readOnlyBackground;
					internalBorder = cvt.readOnlyBorder;
					internalText = cvt.readOnlyText;
				} else if (hasError) {
					internalBg = cvt.errorBackground;
					internalBorder = cvt.errorBorder;
				} else if (success) {
					internalBg = cvt.successBackground;
					internalBorder = cvt.successBorder;
				} else if (isEditing) {
					internalBg = cvt.editingBackground;
					internalBorder = cvt.border;
				}
				
				rootElement.style.setProperty("--select-internal-bg", internalBg);
				rootElement.style.setProperty("--select-internal-border", internalBorder);
				rootElement.style.setProperty("--select-internal-text", internalText);
				rootElement.style.setProperty("--select-text", cvt.text);
				rootElement.style.setProperty("--select-placeholder", cvt.placeholder);
				rootElement.style.setProperty("--select-icon-color", cvt.iconColor);
				rootElement.style.setProperty("--select-hover-border", cvt.hoverBorder);
				rootElement.style.setProperty("--select-focus-border", cvt.focusBorder);
				rootElement.style.setProperty("--select-focus-ring", cvt.focusRing);
				rootElement.style.setProperty("--select-error-bg", cvt.errorBackground);
				rootElement.style.setProperty("--select-error-border", cvt.errorBorder);
				rootElement.style.setProperty("--select-error-ring", cvt.errorRing);
				rootElement.style.setProperty("--select-success-bg", cvt.successBackground);
				rootElement.style.setProperty("--select-success-border", cvt.successBorder);
				rootElement.style.setProperty("--select-success-ring", cvt.successRing);
				rootElement.style.setProperty("--select-disabled-bg", cvt.disabledBackground);
				rootElement.style.setProperty("--select-disabled-border", cvt.disabledBorder);
				rootElement.style.setProperty("--select-disabled-text", cvt.disabledText);
				rootElement.style.setProperty("--select-readonly-bg", cvt.readOnlyBackground);
				rootElement.style.setProperty("--select-readonly-border", cvt.readOnlyBorder);
				rootElement.style.setProperty("--select-readonly-text", cvt.readOnlyText);
				rootElement.style.setProperty("--select-editing-bg", cvt.editingBackground);
				rootElement.style.setProperty("--select-dropdown-bg", cvt.dropdownBackground);
				rootElement.style.setProperty("--select-dropdown-border", cvt.dropdownBorder);
				rootElement.style.setProperty("--select-option-text", cvt.optionText);
				rootElement.style.setProperty("--select-option-hover-bg", cvt.optionHoverBackground);
				rootElement.style.setProperty("--select-option-selected-bg", cvt.optionSelectedBackground);
				rootElement.style.setProperty("--select-option-selected-text", cvt.optionSelectedText);
				rootElement.style.setProperty("--select-chevron-button-bg", cvt.chevronButtonBackground);
			}
		}, [selectTokensInternal, effectiveColorScheme, disabled, readOnly, errorProp, success, isEditing, appColorTokens, mode]);

        React.useEffect(() => {
			const handleClickOutside = (event: MouseEvent) => {
				if (
					selectClickableRef.current && !selectClickableRef.current.contains(event.target as Node) &&
					optionsRef.current && !optionsRef.current.contains(event.target as Node)
				) {
					if (isOpen) {
						setIsOpen(false);
						setIsFocused(false);
						onBlurProp?.();
					}
				}
			};
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}, [isOpen, onBlurProp]);
        
        React.useEffect(() => {
			if (autoFocus && selectClickableRef.current && !disabled && !readOnly) {
				selectClickableRef.current.focus();
			}
		}, [autoFocus, disabled, readOnly]);
		//#endregion ![sub_effects]

		//#region [sub_helpers] - 🧰 HELPER FUNCTIONS 🧰
		const mapSelectSizeToIconSize = (s: StandardSelectSize): StandardIconProps["size"] => {
			switch (s) {
				case "sm": return "xs";
				case "lg": return "md";
				default: return "sm";
			}
		};
		const iconInternalSize = mapSelectSizeToIconSize(size);

		const handleOptionClick = (optionValue: string) => {
			if (disabled || readOnly) return;
			let newSelectedValuesArray: string[];
			let finalValueToEmit: string | string[] | undefined;
			let valueActuallyChanged = false;

			if (multiple) {
				const isCurrentlySelected = selectedValues.includes(optionValue);
				newSelectedValuesArray = isCurrentlySelected
					? selectedValues.filter((v) => v !== optionValue)
					: [...selectedValues, optionValue];
				finalValueToEmit = newSelectedValuesArray;
				valueActuallyChanged = true;
			} else {
				const currentSingleValue = selectedValues.length > 0 ? selectedValues[0] : undefined;
				if (currentSingleValue === optionValue) {
					newSelectedValuesArray = [];
					finalValueToEmit = undefined;
					valueActuallyChanged = true;
				} else {
					newSelectedValuesArray = [optionValue];
					finalValueToEmit = newSelectedValuesArray[0];
					valueActuallyChanged = currentSingleValue !== optionValue;
				}
				setIsOpen(false);
			}

			if (valueActuallyChanged) {
				setSelectedValues(newSelectedValuesArray);
				onChange?.(finalValueToEmit);
			}

			if (!multiple && valueActuallyChanged) {
				setIsFocused(false);
				onBlurProp?.();
			}
		};

		const handleClear = (e: React.MouseEvent, valueToRemove?: string) => {
			if (disabled || readOnly) return;
			e.preventDefault();
			e.stopPropagation();
			let newValues: string[];
			let finalValueToEmit: string | string[] | undefined;

			if (valueToRemove && multiple) {
				newValues = selectedValues.filter((v) => v !== valueToRemove);
				finalValueToEmit = newValues;
			} else {
				newValues = [];
				finalValueToEmit = multiple ? [] : undefined;
			}
			setSelectedValues(newValues);
			onChange?.(finalValueToEmit);
			setIsOpen(false);
			setIsFocused(false);
			selectClickableRef.current?.focus();
			onBlurProp?.();
		};

        const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
			if (disabled || readOnly) return;
			switch (e.key) {
				case "Enter": case " ":
					e.preventDefault();
					setIsOpen(!isOpen);
					if (!isOpen) setIsFocused(true);
					break;
				case "Escape":
					if (isOpen) {
						e.preventDefault();
						setIsOpen(false);
						setIsFocused(false);
						selectClickableRef.current?.focus();
						onBlurProp?.();
					}
					break;
				case "Tab":
					if (isOpen) { setIsOpen(false); }
					break;
			}
		};
		//#endregion ![sub_helpers]

		const currentSizeTokens = selectTokensInternal
			? selectTokensInternal.sizes[size]
			: { height: "h-10", fontSize: "text-sm", paddingX: "px-3", paddingY: "py-2", optionPaddingX: "px-3", optionPaddingY: "py-2", dropdownMaxHeight: "max-h-60" };

		const [dropdownPosition, setDropdownPosition] = React.useState<React.CSSProperties>({});

		const dropdownVariants = React.useMemo(() => {
			const base = {
				hidden: { opacity: 0, y: -5, scale: 0.98, transition: { duration: 0.1, ease: "easeInOut" } },
				visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: "easeOut" } },
			};

			if (!appColorTokens || !mode || !selectTokensInternal) return base;

			const variantTokens = selectTokensInternal.variants[effectiveColorScheme];

			return {
				...base,
				visible: {
					...base.visible,
					backgroundColor: variantTokens.dropdownBackground,
					borderColor: variantTokens.dropdownBorder,
				},
			};
		}, [appColorTokens, mode, effectiveColorScheme, selectTokensInternal]);

		React.useLayoutEffect(() => {
			if (!isOpen) return;

			const updatePosition = () => {
				if (!selectClickableRef.current) return;

				const rect = selectClickableRef.current.getBoundingClientRect();
				const spaceBelow = window.innerHeight - rect.bottom - 8;
				
				const maxHeightRem = parseInt(currentSizeTokens.dropdownMaxHeight.replace('max-h-', ''));
				const maxHeightPx = maxHeightRem * 16;
				const estimatedDropdownHeight = Math.min(options.length * 44 + 8, maxHeightPx || 240);

				let top = rect.bottom + 4;
				if (spaceBelow < estimatedDropdownHeight && rect.top > spaceBelow) {
					top = rect.top - estimatedDropdownHeight - 4;
				}

				setDropdownPosition({
					position: 'fixed',
					top: `${top}px`,
					left: `${rect.left}px`,
					width: `${rect.width}px`,
					// Z-index alto para estar por encima de popups (2010) y dialogs (3000)
					zIndex: 4000,
				});
			};

			updatePosition();
			window.addEventListener('resize', updatePosition);
			window.addEventListener('scroll', updatePosition, true);

			return () => {
				window.removeEventListener('resize', updatePosition);
				window.removeEventListener('scroll', updatePosition, true);
			};
		}, [isOpen, options.length, currentSizeTokens.dropdownMaxHeight, appColorTokens, mode]);
		
		const hasLeadingIcon = (leadingIcon && (!multiple || selectedOptions.length === 0) && (selectedOptions.length === 0 || !selectedOptions[0].icon)) || (selectedOptions.length > 0 && !multiple && selectedOptions[0].icon);
		const hasClearButton = clearable && selectedValues.length > 0 && !disabled && !readOnly;
		const paddings = {
			sm: { withIcon: "pl-7",  withoutIcon: "pl-3",  withChevron: "pr-7",  withChevronAndClear: "pr-12" },
			md: { withIcon: "pl-8",  withoutIcon: "pl-4",  withChevron: "pr-8",  withChevronAndClear: "pr-14" },
			lg: { withIcon: "pl-10", withoutIcon: "pl-4",  withChevron: "pr-10", withChevronAndClear: "pr-16" },
		};
		const currentPaddings = paddings[size];
		const paddingClasses = [
			hasLeadingIcon ? currentPaddings.withIcon : currentPaddings.withoutIcon,
			hasClearButton ? currentPaddings.withChevronAndClear : currentPaddings.withChevron,
		];
		const isErrorActive = !!errorProp;
		const finalSelectContainerClasses = cn(
			"relative", "rounded-md", "border", "transition-colors", "duration-150",
			"flex", "items-center", "w-full", currentSizeTokens.height,
			currentSizeTokens.fontSize, currentSizeTokens.paddingY,
			...paddingClasses,
			"bg-[var(--select-internal-bg)]", "border-[var(--select-internal-border)]",
			"text-[var(--select-internal-text)]",
			disabled ? "cursor-not-allowed opacity-70" : readOnly ? "cursor-default" : "hover:border-[var(--select-hover-border)]",
			isFocused && !disabled && !readOnly &&
				(isErrorActive
					? ["outline-none", "!border-[var(--select-error-border)]", "shadow-[0_0_0_3px_var(--select-error-ring)]"]
					: success
					? ["outline-none", "!border-[var(--select-success-border)]", "shadow-[0_0_0_3px_var(--select-success-ring)]"]
					: ["outline-none", "!border-[var(--select-focus-border)]", "shadow-[0_0_0_3px_var(--select-focus-ring)]"]),
			className
		);
		
		const getIconLeftPosition = () => {
			switch (size) {
				case "sm": return "left-2.5";
				case "lg": return "left-3.5";
				default: return "left-3";
			}
		};

		//#region [render] - RENDER 
		return (
			<div
				className={cn("relative", { "w-full": fullWidth })}
				ref={componentRootRef}
				{...restRootProps}
			>
				<div
					ref={selectClickableRef}
					className={finalSelectContainerClasses}
					onClick={() => !disabled && !readOnly && setIsOpen(!isOpen)}
					onKeyDown={handleKeyDown}
					onFocus={() => !disabled && !readOnly && setIsFocused(true)}
					onBlur={() => { if (!isOpen) { setIsFocused(false); onBlurProp?.(); } }}
					tabIndex={disabled ? -1 : 0}
					role="combobox"
					aria-haspopup="listbox"
					aria-expanded={isOpen}
					aria-controls={id ? `${id}-options` : undefined}
					aria-required={isRequired}
					aria-invalid={isErrorActive}
					aria-disabled={disabled}
					aria-readonly={readOnly}
					aria-describedby={ariaDescribedBy}
				>
					{hasLeadingIcon && (
						<div className={`absolute ${getIconLeftPosition()} top-1/2 -translate-y-1/2 flex items-center pointer-events-none`}>
							<StandardIcon size={iconInternalSize} styleType="outline" colorScheme="primary" colorShade="text">
								{selectedOptions.length > 0 && !multiple && selectedOptions[0].icon 
									? React.createElement(selectedOptions[0].icon!) 
									: React.createElement(leadingIcon!)
								}
							</StandardIcon>
						</div>
					)}
					<div className="flex-1 flex flex-wrap gap-1 items-center overflow-hidden">
						{selectedOptions.length > 0 ? (
							multiple ? (
								selectedOptions.map((option) => (
									<div key={option.value} className={cn( "rounded px-1.5 py-0.5 flex items-center gap-1 max-w-[calc(100%-4px)]", "bg-[var(--select-option-selected-bg)] text-[var(--select-option-selected-text)]" )}>
										{option.icon && (
											<span className="flex-shrink-0 mr-1">
												<StandardIcon styleType="outline" size="xs" colorScheme="primary">{React.createElement(option.icon)}</StandardIcon>
											</span>
										)}
										<StandardText size="xs" weight="medium" truncate>{option.label}</StandardText>
										{clearable && !disabled && !readOnly && (
											<button type="button" onClick={(e) => handleClear(e, option.value)} className={cn("cursor-pointer flex-shrink-0 ml-1 p-0.5 rounded-full", "hover:bg-[rgba(255,255,255,0.2)]")} aria-label={`Quitar ${option.label}`}>
												<StandardIcon styleType="outline" size="xs" colorScheme="primary"><X /></StandardIcon>
											</button>
										)}
									</div>
								))
							) : (
								<StandardText truncate>{selectedOptions[0].label}</StandardText>
							)
						) : (
							<StandardText colorScheme="neutral" colorShade="textShade">{placeholder}</StandardText>
						)}
					</div>
					<div className="absolute right-1.5 top-0 h-full flex items-center gap-0.5">
						{hasClearButton && (
							<button type="button" onClick={handleClear} className="rounded-full p-0.5 hover:bg-[rgba(0,0,0,0.05)] transition-colors flex items-center justify-center mr-0.5" aria-label="Limpiar selección">
								<StandardIcon styleType="outline" size={iconInternalSize} colorScheme="primary">
									<X />
								</StandardIcon>
							</button>
						)}
						<div className="flex items-center justify-center p-0.5 rounded cursor-pointer" style={{ backgroundColor: "var(--select-chevron-button-bg)" }} onClick={(e) => { e.stopPropagation(); if (!disabled && !readOnly) { setIsOpen(!isOpen); if (!isOpen) selectClickableRef.current?.focus(); } }}>
							<AnimatePresence initial={false} mode="wait">
								<motion.div key={isOpen ? "up" : "down"}
                                    initial={{ opacity: 0, rotate: isOpen ? 180 : -180, scale: 0.8 }}
                                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                    exit={{ opacity: 0, rotate: isOpen ? 180 : -180, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                >
									<StandardIcon styleType="outline" size={iconInternalSize} colorScheme={colorScheme}>
										{isOpen ? <ChevronUp /> : <ChevronDown />}
									</StandardIcon>
								</motion.div>
							</AnimatePresence>
						</div>
					</div>
				</div>

				<AnimatePresence>
					{isOpen && !readOnly && (
						<motion.div
							ref={optionsRef}
							tabIndex={-1}
							role="listbox"
							id={id ? `${id}-options` : undefined}
							aria-multiselectable={multiple}
							className={cn(
								"rounded-md border shadow-lg overflow-auto outline-none",
								currentSizeTokens.dropdownMaxHeight
							)}
							style={dropdownPosition}
							initial="hidden"
							animate="visible"
							exit="hidden"
							variants={dropdownVariants}
						>
							<div className="py-1">
								{options.map((option, index) => {
									const isSelected = selectedValues.includes(option.value);
									return (
										<motion.div key={option.value} custom={index} variants={optionVariantsBase}
                                            initial="hidden" animate="visible" exit="hidden" role="option" aria-selected={isSelected} aria-disabled={option.disabled}
											className={cn(
												currentSizeTokens.optionPaddingX, currentSizeTokens.optionPaddingY,
												"text-sm flex items-center justify-between cursor-pointer",
												option.disabled
													? "opacity-50 cursor-not-allowed text-[var(--select-option-text)]"
													: isSelected
													? "bg-[var(--select-option-selected-bg)] text-[var(--select-option-selected-text)] font-medium"
													: "text-[var(--select-option-text)] hover:bg-[var(--select-option-hover-bg)]"
											)}
											onClick={() => !option.disabled && handleOptionClick(option.value)}
                                        >
											<div className="flex items-center flex-1 overflow-hidden gap-2">
												{option.icon && (
													<span className="flex-shrink-0 flex items-center">
														<StandardIcon styleType="outline" size={iconInternalSize} colorScheme="primary" colorShade="text">
															{React.createElement(option.icon)}
														</StandardIcon>
													</span>
												)}
												<div className="flex-1 overflow-hidden">
													<StandardText truncate weight={!isSelected && !option.disabled ? "medium" : "normal"}>
                                                        {option.label}
                                                    </StandardText>
													{option.description && (
														<StandardText size="xs" truncate className="opacity-70">
                                                            {option.description}
                                                        </StandardText>
													)}
												</div>
											</div>
											{isSelected && !option.disabled && (
												<StandardIcon 	styleType="outline" size={iconInternalSize} colorScheme={colorScheme}><Check /></StandardIcon>
											)}
										</motion.div>
									);
								})}
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				<input ref={hiddenInputRef} type="hidden" name={name} value={multiple ? selectedValues.join(",") : selectedValues[0] || ""} 
                    id={id ? `${id}-hidden-input` : undefined} aria-hidden="true" tabIndex={-1} />
			</div>
		);
		//#endregion ![render]
	}
);
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
StandardSelect.displayName = "StandardSelect";
export { StandardSelect };
export { StandardSelect as Select };
export const SelectContent = React.Fragment;
export const SelectItem = (props: React.ComponentPropsWithoutRef<'div'>) => <div {...props} />;
export const SelectTrigger = (props: React.ComponentPropsWithoutRef<'div'>) => <div {...props} />;
export const SelectValue = (props: React.ComponentPropsWithoutRef<'div'>) => <div {...props} />;
//#endregion ![foo]