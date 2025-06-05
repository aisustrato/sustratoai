// components/ui/select-custom.tsx
// Versión con refactorización de mensajes
"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion"; // Se mantiene para animaciones de dropdown y chevron
import { useTheme } from "@/app/theme-provider";
import {
	generateSelectTokens,
	type SelectSize,
	type SelectVariant,
	type SelectTokens,
	type SelectVariantTokens,
} from "@/lib/theme/components/select-tokens";
import { Icon, type IconProps } from "@/components/ui/icon";
// import { Text } from "@/components/ui/text"; // Eliminado: FormField maneja los mensajes de texto

export interface SelectOption {
	value: string;
	label: string;
	disabled?: boolean;
	description?: string;
	icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface SelectCustomProps
	extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange" | "value"> {
	options: SelectOption[];
	value?: string | string[];
	defaultValue?: string | string[];
	onChange?: (value: string | string[] | undefined) => void;
	onBlur?: () => void;
	variant?: SelectVariant;
	size?: SelectSize;
	error?: string;
	placeholder?: string;
	leadingIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
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

const dropdownVariantsBase = {
	hidden: {
		opacity: 0,
		y: -5,
		scale: 0.98,
		transition: { duration: 0.1, ease: "easeInOut" },
	},
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { duration: 0.15, ease: "easeOut" },
	},
};

const optionVariantsBase = {
	hidden: { opacity: 0, y: -3 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { delay: i * 0.02, duration: 0.15, ease: "easeOut" },
	}),
};

const SelectCustom = React.forwardRef<HTMLDivElement, SelectCustomProps>(
	(
		{
			options = [],
			className,
			variant = "default",
			size = "md",
			error: errorProp,
			placeholder = "Seleccione una opción",
			leadingIcon,
			clearable = false,
			multiple = false,
			onChange,
			onBlur: onBlurProp,
			value,
			defaultValue,
			disabled = false,
			readOnly = false,
			isRequired = false,
			name,
			id,
			fullWidth = true,
			isEditing = false,
			success = false,
			autoFocus = false,
			"aria-describedby": ariaDescribedBy,
			...restRootProps
		},
		forwardedRef
	) => {
		const { appColorTokens, mode } = useTheme();
		const [isOpen, setIsOpen] = React.useState(false);
		const [isFocused, setIsFocused] = React.useState(false);

		const componentRootRef = React.useRef<HTMLDivElement>(null);
		React.useImperativeHandle(
			forwardedRef,
			() => componentRootRef.current as HTMLDivElement
		);

		const selectClickableRef = React.useRef<HTMLDivElement>(null);
		const optionsRef = React.useRef<HTMLDivElement>(null);
		const hiddenInputRef = React.useRef<HTMLInputElement>(null);

		const [selectedValues, setSelectedValues] = React.useState<string[]>(() => {
			const initialVal = value !== undefined ? value : defaultValue;
			if (initialVal !== undefined) {
				return Array.isArray(initialVal)
					? initialVal
					: initialVal
					? [initialVal]
					: [];
			}
			return [];
		});

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
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [value, defaultValue]);

		const selectTokensInternal: SelectTokens | null = React.useMemo(() => {
			if (!appColorTokens || !mode) return null;
			return generateSelectTokens(appColorTokens, mode);
		}, [appColorTokens, mode]);

		React.useEffect(() => {
			const rootElement = componentRootRef.current;
			if (rootElement && selectTokensInternal) {
				const cvt: SelectVariantTokens = selectTokensInternal.variants[variant];
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
				rootElement.style.setProperty(
					"--select-internal-border",
					internalBorder
				);
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
				rootElement.style.setProperty(
					"--select-success-bg",
					cvt.successBackground
				);
				rootElement.style.setProperty(
					"--select-success-border",
					cvt.successBorder
				);
				rootElement.style.setProperty("--select-success-ring", cvt.successRing);
				rootElement.style.setProperty(
					"--select-disabled-bg",
					cvt.disabledBackground
				);
				rootElement.style.setProperty(
					"--select-disabled-border",
					cvt.disabledBorder
				);
				rootElement.style.setProperty(
					"--select-disabled-text",
					cvt.disabledText
				);
				rootElement.style.setProperty(
					"--select-readonly-bg",
					cvt.readOnlyBackground
				);
				rootElement.style.setProperty(
					"--select-readonly-border",
					cvt.readOnlyBorder
				);
				rootElement.style.setProperty(
					"--select-readonly-text",
					cvt.readOnlyText
				);
				rootElement.style.setProperty(
					"--select-editing-bg",
					cvt.editingBackground
				);
				rootElement.style.setProperty(
					"--select-dropdown-bg",
					cvt.dropdownBackground
				);
				rootElement.style.setProperty(
					"--select-dropdown-border",
					cvt.dropdownBorder
				);
				rootElement.style.setProperty("--select-option-text", cvt.optionText);
				rootElement.style.setProperty(
					"--select-option-hover-bg",
					cvt.optionHoverBackground
				);
				rootElement.style.setProperty(
					"--select-option-selected-bg",
					cvt.optionSelectedBackground
				);
				rootElement.style.setProperty(
					"--select-option-selected-text",
					cvt.optionSelectedText
				);
				rootElement.style.setProperty(
					"--select-chevron-button-bg",
					cvt.chevronButtonBackground
				);
			}
		}, [
			selectTokensInternal,
			variant,
			disabled,
			readOnly,
			errorProp,
			success,
			isEditing,
			appColorTokens,
			mode,
		]);

		const currentSizeTokens = selectTokensInternal
			? selectTokensInternal.sizes[size]
			: {
					height: "h-10",
					fontSize: "text-sm",
					paddingX: "px-3",
					paddingY: "py-2",
					optionPaddingX: "px-3",
					optionPaddingY: "py-2",
					dropdownMaxHeight: "max-h-60",
			  };

		const selectedOptions = React.useMemo(
			() => options.filter((o) => selectedValues.includes(o.value)),
			[options, selectedValues]
		);

		const mapSelectSizeToIconSize = (s: SelectSize): IconProps["size"] => {
			switch (s) {
				case "sm":
					return "xs";
				case "lg":
					return "md";
				default:
					return "sm";
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
				const currentSingleValue =
					selectedValues.length > 0 ? selectedValues[0] : undefined;

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

		React.useEffect(() => {
			const handleClickOutside = (event: MouseEvent) => {
				if (
					selectClickableRef.current &&
					!selectClickableRef.current.contains(event.target as Node) &&
					optionsRef.current &&
					!optionsRef.current.contains(event.target as Node)
				) {
					if (isOpen) {
						setIsOpen(false);
						setIsFocused(false);
						onBlurProp?.();
					}
				}
			};
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}, [isOpen, onBlurProp]);

		const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
			if (disabled || readOnly) return;
			switch (e.key) {
				case "Enter":
				case " ":
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
					if (isOpen) {
						setIsOpen(
							false
						); /* onBlur del div se encargará de setIsFocused y onBlurProp */
					}
					break;
			}
		};

		React.useEffect(() => {
			if (autoFocus && selectClickableRef.current && !disabled && !readOnly) {
				selectClickableRef.current.focus();
			}
		}, [autoFocus, disabled, readOnly]);

		const hasActualLeadingIcon =
			leadingIcon &&
			(!multiple || selectedOptions.length === 0) &&
			(selectedOptions.length === 0 || !selectedOptions[0].icon);
		const hasSelectedOptionIcon =
			selectedOptions.length > 0 && !multiple && selectedOptions[0].icon;
		let effectivePaddingLeft = currentSizeTokens.paddingX.replace("px-", "pl-");
		if (hasActualLeadingIcon || hasSelectedOptionIcon) {
			effectivePaddingLeft =
				size === "sm" ? "pl-7" : size === "lg" ? "pl-10" : "pl-8";
		}
		const clearButtonVisible =
			clearable && selectedValues.length > 0 && !disabled && !readOnly;
		let effectivePaddingRight =
			size === "sm" ? "pr-7" : size === "lg" ? "pr-10" : "pr-8";
		if (clearButtonVisible) {
			effectivePaddingRight =
				size === "sm" ? "pr-12" : size === "lg" ? "pr-16" : "pr-14";
		}
		const isErrorActive = !!errorProp;

		const finalSelectContainerClasses = cn(
			"relative",
			"rounded-md",
			"border",
			"transition-colors",
			"duration-150",
			"flex",
			"items-center",
			"w-full",
			currentSizeTokens.height,
			currentSizeTokens.fontSize,
			currentSizeTokens.paddingY,
			"bg-[var(--select-internal-bg)]",
			"border-[var(--select-internal-border)]",
			disabled
				? "cursor-not-allowed opacity-70"
				: readOnly
				? "cursor-default"
				: "",
			isFocused &&
				!disabled &&
				!readOnly &&
				(isErrorActive
					? [
							"outline-none",
							"!border-[var(--select-error-border)]",
							"shadow-[0_0_0_3px_var(--select-error-ring)]",
					  ]
					: success
					? [
							"outline-none",
							"!border-[var(--select-success-border)]",
							"shadow-[0_0_0_3px_var(--select-success-ring)]",
					  ]
					: [
							"outline-none",
							"!border-[var(--select-focus-border)]",
							"shadow-[0_0_0_3px_var(--select-focus-ring)]",
					  ]),
			effectivePaddingLeft,
			effectivePaddingRight,
			className
		);

		return (
			<div
				className={cn("relative", fullWidth ? "w-full" : "w-auto")}
				ref={componentRootRef}
				{...restRootProps}>
				<div
					ref={selectClickableRef}
					id={id}
					className={finalSelectContainerClasses}
					tabIndex={disabled || readOnly ? -1 : 0}
					onKeyDown={handleKeyDown}
					onFocus={() => {
						if (!disabled && !readOnly) setIsFocused(true);
					}}
					onBlur={(e) => {
						if (
							optionsRef.current &&
							optionsRef.current.contains(e.relatedTarget as Node)
						) {
							return;
						}
						setIsFocused(false);
						if (isOpen) setIsOpen(false);
						onBlurProp?.();
					}}
					onClick={() => {
						if (!disabled && !readOnly) {
							setIsOpen(!isOpen);
							if (!isOpen) {
								selectClickableRef.current?.focus();
								setIsFocused(true);
							}
						}
					}}
					aria-expanded={isOpen}
					aria-haspopup="listbox"
					aria-disabled={disabled}
					aria-readonly={readOnly}
					aria-invalid={isErrorActive}
					aria-required={isRequired}
					aria-describedby={ariaDescribedBy}
					role="combobox">
					{(hasActualLeadingIcon || hasSelectedOptionIcon) && (
						<div
							className={`absolute top-0 h-full flex items-center pointer-events-none ${
								size === "sm"
									? "left-2"
									: size === "lg"
									? "left-3.5"
									: "left-2.5"
							}`}>
							<Icon
								size={iconInternalSize}
								className="text-[var(--select-icon-color)]">
								{React.createElement(
									hasSelectedOptionIcon && selectedOptions[0].icon
										? selectedOptions[0].icon
										: leadingIcon!
								)}
							</Icon>
						</div>
					)}
					<div className="flex-1 flex flex-wrap gap-1 items-center overflow-hidden">
						{selectedOptions.length > 0 ? (
							multiple ? (
								selectedOptions.map((option) => (
									<div
										key={option.value}
										className={cn(
											"rounded px-1.5 py-0.5 flex items-center gap-1 max-w-[calc(100%-4px)]",
											"bg-[var(--select-option-selected-bg)] text-[var(--select-option-selected-text)]"
										)}>
										{option.icon && (
											<span className="flex-shrink-0 mr-1">
												<Icon
													size="xs"
													className="text-[var(--select-option-selected-text)]">
													{React.createElement(option.icon)}
												</Icon>
											</span>
										)}
										<span className="truncate text-xs font-medium">
											{option.label}
										</span>
										{clearable && !disabled && !readOnly && (
											<button
												type="button"
												onClick={(e) => handleClear(e, option.value)}
												className={cn(
													"cursor-pointer flex-shrink-0 ml-1 p-0.5 rounded-full",
													"hover:bg-[rgba(255,255,255,0.2)]"
												)}
												aria-label={`Quitar ${option.label}`}>
												<Icon
													size="xs"
													className="text-[var(--select-option-selected-text)]">
													<X />
												</Icon>
											</button>
										)}
									</div>
								))
							) : (
								<span className="truncate text-[var(--select-internal-text)]">
									{selectedOptions[0].label}
								</span>
							)
						) : (
							<span className="text-[var(--select-placeholder)]">
								{placeholder}
							</span>
						)}
					</div>
					<div className="absolute right-1.5 top-0 h-full flex items-center gap-0.5">
						{clearButtonVisible && (
							<button
								type="button"
								onClick={handleClear}
								className="rounded-full p-0.5 hover:bg-[rgba(0,0,0,0.05)] transition-colors flex items-center justify-center mr-0.5"
								aria-label="Limpiar selección">
								<Icon
									size={iconInternalSize}
									className="text-[var(--select-icon-color)]">
									<X />
								</Icon>
							</button>
						)}
						<div
							className="flex items-center justify-center p-0.5 rounded cursor-pointer"
							style={{ backgroundColor: "var(--select-chevron-button-bg)" }}
							onClick={(e) => {
								e.stopPropagation();
								if (!disabled && !readOnly) {
									setIsOpen(!isOpen);
									if (!isOpen) selectClickableRef.current?.focus();
								}
							}}>
							<AnimatePresence initial={false} mode="wait">
								<motion.div
									key={isOpen ? "up" : "down"}
									initial={{
										opacity: 0,
										rotate: isOpen ? 180 : -180,
										scale: 0.8,
									}}
									animate={{ opacity: 1, rotate: 0, scale: 1 }}
									exit={{ opacity: 0, rotate: isOpen ? 180 : -180, scale: 0.8 }}
									transition={{ duration: 0.2 }}>
									<Icon
										size={iconInternalSize}
										className="text-[var(--select-icon-color)]">
										{isOpen ? <ChevronUp /> : <ChevronDown />}
									</Icon>
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
							className={cn(
								"absolute z-50 mt-1 w-full rounded-md border shadow-lg overflow-auto outline-none",
								"bg-[var(--select-dropdown-bg)] border-[var(--select-dropdown-border)]",
								currentSizeTokens.dropdownMaxHeight
							)}
							role="listbox"
							aria-multiselectable={multiple}
							initial="hidden"
							animate="visible"
							exit="hidden"
							variants={dropdownVariantsBase}>
							<div className="py-1">
								{options.map((option, index) => {
									const isSelected = selectedValues.includes(option.value);
									return (
										<motion.div
											key={option.value}
											custom={index}
											variants={optionVariantsBase}
											initial="hidden"
											animate="visible"
											exit="hidden"
											className={cn(
												currentSizeTokens.optionPaddingX,
												currentSizeTokens.optionPaddingY,
												"text-sm flex items-center justify-between cursor-pointer",
												option.disabled
													? "opacity-50 cursor-not-allowed text-[var(--select-option-text)]"
													: isSelected
													? "bg-[var(--select-option-selected-bg)] text-[var(--select-option-selected-text)] font-medium"
													: "text-[var(--select-option-text)] hover:bg-[var(--select-option-hover-bg)]"
											)}
											onClick={() =>
												!option.disabled && handleOptionClick(option.value)
											}
											role="option"
											aria-selected={isSelected}
											aria-disabled={option.disabled}>
											<div className="flex items-center flex-1 overflow-hidden gap-2">
												{option.icon && (
													<span className="flex-shrink-0 flex items-center">
														<Icon
															size={iconInternalSize}
															className={
																isSelected && !option.disabled
																	? "text-[var(--select-option-selected-text)]"
																	: "text-[var(--select-icon-color)]"
															}>
															{React.createElement(option.icon)}
														</Icon>
													</span>
												)}
												<div className="flex-1 overflow-hidden">
													<div
														className={cn(
															"truncate",
															!isSelected && !option.disabled
																? "font-medium"
																: ""
														)}>
														{option.label}
													</div>
													{option.description && (
														<div className="text-xs truncate opacity-70">
															{" "}
															{option.description}
														</div>
													)}
												</div>
											</div>
											{isSelected && !option.disabled && (
												<Icon
													size={iconInternalSize}
													className={cn(
														"ml-2 flex-shrink-0",
														"text-[var(--select-option-selected-text)]"
													)}>
													<Check />
												</Icon>
											)}
										</motion.div>
									);
								})}
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				<input
					ref={hiddenInputRef}
					type="hidden"
					name={name}
					value={multiple ? selectedValues.join(",") : selectedValues[0] || ""}
					id={id ? `${id}-hidden-input` : undefined}
					aria-hidden="true"
					tabIndex={-1}
				/>
			</div>
		);
	}
);

SelectCustom.displayName = "SelectCustom";
export { SelectCustom };
// API compatible para el showroom (placeholders)
export { SelectCustom as Select };
export const SelectContent = React.Fragment;
export const SelectItem = (props: any) => <div {...props} />;
export const SelectTrigger = (props: any) => <div {...props} />;
export const SelectValue = (props: any) => <div {...props} />;
