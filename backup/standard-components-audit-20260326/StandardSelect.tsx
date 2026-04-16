// 📍 components/ui/StandardSelect.tsx (v4.3 - EFECTOS SUSTRATO)
// 🎯 PROPÓSITO: Select estándar con validación visual en tiempo real
// 🔧 DECISIÓN: CSS dinámico para animaciones, tokens precalculados (patrón Flex)
// ✅ ARQUITECTURA: Tokens del DesignTokensProvider + portal para dropdown
// 🌸 FILOSOFÍA: Humanismo en co-evolución AI - feedback visual inmediato

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import { useId, useMemo } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	useDesignTokens,
	type SelectStyleTokens,
} from "@/app/providers/DesignTokensProvider";
import { StandardIcon, type StandardIconProps } from "./StandardIcon";
import { StandardText } from "./StandardText";
//#endregion ![head]

//#region [def] - 📦 TYPES & CONSTANTS 📦
export type IconProps = React.SVGProps<SVGSVGElement>;
export type StandardSelectSize = "sm" | "md" | "lg";
export type StandardSelectVariant =
	| "default"
	| "primary"
	| "secondary"
	| "tertiary"
	| "accent"
	| "neutral";

export interface SelectOption<T extends string = string> {
	value: T;
	label: string;
	disabled?: boolean;
	description?: string;
	icon?: React.ComponentType<IconProps>;
}

export interface StandardSelectProps<T extends string = string>
	extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange" | "value"> {
	options: SelectOption<T>[];
	value?: T | T[] | undefined;
	defaultValue?: T | T[] | undefined;
	onChange?: (value: T | T[] | undefined) => void;
	onBlur?: () => void;
	colorScheme?: StandardSelectVariant;
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
	/** 🌊 Efecto de respiración sutil del borde - pulso orgánico */
	pulseBorder?: boolean;
	/** 🪩 Momento Pafff - borde destacado para insight/coherencia */
	pafffMoment?: boolean;
	stableOptions?: boolean; // 🆕 Indica que las opciones son estables para evitar re-renders
}

// 🎯 Componente de opción ligero - hover manejado con estado local, sin CSS inyectado
const SelectOptionItem: React.FC<{
	option: SelectOption<string>;
	isSelected: boolean;
	tokens: SelectStyleTokens | undefined;
	sizeTokens: any;
	iconSize: StandardIconProps["size"];
	onSelect: (value: string) => void;
}> = ({ option, isSelected, tokens, sizeTokens, iconSize, onSelect }) => {
	const [hovered, setHovered] = React.useState(false);

	const optStyle: React.CSSProperties = {
		paddingLeft: sizeTokens.optionPaddingX,
		paddingRight: sizeTokens.optionPaddingX,
		paddingTop: sizeTokens.optionPaddingY,
		paddingBottom: sizeTokens.optionPaddingY,
		color: isSelected ? tokens?.optionSelectedText : tokens?.optionText,
		backgroundColor:
			isSelected ? tokens?.optionSelectedBackground
			: hovered && !option.disabled ? tokens?.optionHoverBackground
			: "transparent",
		cursor: option.disabled ? "not-allowed" : "pointer",
		opacity: option.disabled ? 0.5 : 1,
		fontWeight: isSelected ? 500 : 400,
	};

	return (
		<div
			role="option"
			aria-selected={isSelected}
			aria-disabled={option.disabled}
			className="text-sm flex items-center justify-between"
			style={optStyle}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			onClick={() => !option.disabled && onSelect(option.value)}>
			<div className="flex items-center flex-1 overflow-hidden gap-2">
				{option.icon && (
					<span className="flex-shrink-0 flex items-center">
						<StandardIcon
							styleType="outline"
							size={iconSize}
							colorScheme="primary"
							colorShade="text">
							{React.createElement(option.icon)}
						</StandardIcon>
					</span>
				)}
				<div className="flex-1 overflow-hidden">
					<StandardText truncate>{option.label}</StandardText>
					{option.description && (
						<StandardText size="xs" truncate className="opacity-70">
							{option.description}
						</StandardText>
					)}
				</div>
			</div>
			{isSelected && !option.disabled && (
				<StandardIcon styleType="outline" size={iconSize} colorScheme="primary">
					<Check />
				</StandardIcon>
			)}
		</div>
	);
};
SelectOptionItem.displayName = "SelectOptionItem";

//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
const StandardSelect = React.forwardRef<HTMLDivElement, StandardSelectProps>(
	(
		{
			options = [],
			className,
			colorScheme = "default",
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
			pulseBorder = false,
			pafffMoment = false,
			stableOptions = false,
			...restRootProps
		},
		forwardedRef,
	) => {
		// 💎 CORE: Tokens precalculados - NO recalcula en cada render
		const { tokens } = useDesignTokens();
		const selectId = useId().replace(/:/g, "");

		const [isOpen, setIsOpen] = React.useState(false);
		const [isFocused, setIsFocused] = React.useState(false);
		const [portalContainer, setPortalContainer] =
			React.useState<HTMLElement | null>(null);
		const [isInsideModal, setIsInsideModal] = React.useState(false);
		const [zIndexValue] = React.useState(
			() => Math.floor(Math.random() * 100) + 1000,
		); // z-index único por instancia

		const componentRootRef = React.useRef<HTMLDivElement>(null);
		React.useImperativeHandle(
			forwardedRef,
			() => componentRootRef.current as HTMLDivElement,
		);

		const selectClickableRef = React.useRef<HTMLDivElement>(null);
		const optionsRef = React.useRef<HTMLDivElement>(null);
		const hiddenInputRef = React.useRef<HTMLInputElement>(null);

		const [selectedValues, setSelectedValues] = React.useState<string[]>(() => {
			const initialVal = value !== undefined ? value : defaultValue;
			if (initialVal !== undefined) {
				return (
					Array.isArray(initialVal) ? initialVal
					: initialVal ? [initialVal]
					: []
				);
			}
			return [];
		});

		// 🎨 Tokens específicos para este colorScheme
		const sizeTokens = tokens?.select.sizes[size];
		const styleTokens = tokens?.select.styles[colorScheme];

		const selectedOptions = useMemo(
			() => options.filter((o) => selectedValues.includes(o.value)),
			[options, selectedValues],
		);
		//#endregion ![sub_init]

		//#region [sub_effects] - 💡 EFFECTS 💡
		// 🎯 CONTENEDOR PARA PORTAL: Usar document.body solo si no estamos en un modal
		React.useEffect(() => {
			if (typeof window !== "undefined") {
				// Si estamos dentro de un modal, no usar portal para evitar conflictos de z-index
				if (isInsideModal) {
					setPortalContainer(null);
				} else {
					setPortalContainer(document.body);
				}
			}
		}, [isInsideModal]);

		// 🎯 CERRAR OTROS SELECTS CUANDO UNO SE ABRE (solo dentro de modales)
		React.useEffect(() => {
			if (isOpen && isInsideModal) {
				// Cerrar otros selects dentro del mismo modal
				const allDropdowns = document.querySelectorAll(
					"[data-standard-select-dropdown]",
				);
				allDropdowns.forEach((dropdown) => {
					if (dropdown !== optionsRef.current) {
						const selectElement = dropdown.closest(
							"[data-standard-select-root]",
						) as HTMLElement;
						if (selectElement && selectElement !== componentRootRef.current) {
							// Simular click fuera para cerrar otros selects
							const event = new MouseEvent("mousedown", { bubbles: true });
							selectElement.dispatchEvent(event);
						}
					}
				});
			}
		}, [isOpen, isInsideModal]);

		// 🎯 DETECTAR SI ESTÁ DENTRO DE UN MODAL
		React.useEffect(() => {
			const checkIfInsideModal = () => {
				if (componentRootRef.current) {
					const element = componentRootRef.current;
					// Buscar elementos que indican que estamos dentro de un modal
					const modalSelectors = [
						'[data-state="open"]', // Radix UI dialogs
						'[role="dialog"]',
						".popup-overlay",
						"[data-standard-dialog-body]",
						"[data-radix-dialog-content]",
					];

					let isModal = false;
					let parent = element.parentElement;

					while (parent && parent !== document.body) {
						for (const selector of modalSelectors) {
							if (parent.matches(selector)) {
								isModal = true;
								break;
							}
						}
						if (isModal) break;
						parent = parent.parentElement;
					}

					setIsInsideModal(isModal);
				}
			};

			checkIfInsideModal();

			// Revisar cuando el select se monta o cambia isOpen
			if (isOpen) {
				// Pequeño delay para asegurar que el DOM está actualizado
				const timeoutId = setTimeout(checkIfInsideModal, 10);
				return () => clearTimeout(timeoutId);
			}
		}, [isOpen]);

		// 🎯 FIX: Usar functional updater para evitar selectedValues en dependencias
		// selectedValues en deps creaba loop de re-evaluación + JSON.stringify en cada ciclo
		React.useEffect(() => {
			if (value !== undefined) {
				const newSelected =
					Array.isArray(value) ? value
					: value ? [value]
					: [];
				setSelectedValues((prev) => {
					if (JSON.stringify(prev) !== JSON.stringify(newSelected)) {
						return newSelected;
					}
					return prev;
				});
			} else if (defaultValue === undefined && value === undefined) {
				setSelectedValues((prev) => (prev.length > 0 ? [] : prev));
			}
		}, [value, defaultValue]);

		// 🎨 Inline styles computados - REEMPLAZO de inyección CSS dinámica
		// Se calculan una vez cuando cambian los tokens, sin tocar el DOM
		const computedSelectStyle = useMemo((): React.CSSProperties => {
			if (!styleTokens) return {};
			const st = styleTokens;

			if (disabled) {
				return {
					backgroundColor: st.disabledBackground,
					borderColor: st.disabledBorder,
					color: st.disabledText,
					cursor: "not-allowed",
					opacity: 0.7,
				};
			}
			if (readOnly) {
				return {
					backgroundColor: st.readOnlyBackground,
					borderColor: st.readOnlyBorder,
					color: st.readOnlyText,
					cursor: "default",
				};
			}
			if (errorProp) {
				return {
					backgroundColor: st.errorBackground,
					borderColor: st.errorBorder,
					color: st.text,
					...(isFocused ?
						{ outline: "none", boxShadow: `0 0 0 3px ${st.errorRing}` }
					:	{}),
				};
			}
			if (success) {
				return {
					backgroundColor: st.successBackground,
					borderColor: st.successBorder,
					color: st.text,
					...(isFocused ?
						{ outline: "none", boxShadow: `0 0 0 3px ${st.successRing}` }
					:	{}),
				};
			}
			if (isFocused) {
				return {
					backgroundColor: st.background,
					borderColor: st.focusBorder,
					color: st.text,
					outline: "none",
					boxShadow: `0 0 0 3px ${st.focusRing}`,
				};
			}
			if (isEditing) {
				return {
					backgroundColor: st.editingBackground,
					borderColor: st.border,
					color: st.text,
				};
			}
			return {
				backgroundColor: st.background,
				borderColor: st.border,
				color: st.text,
			};
		}, [
			styleTokens,
			disabled,
			readOnly,
			errorProp,
			success,
			isFocused,
			isEditing,
		]);

		// Hover se maneja con onMouseEnter/Leave porque inline styles no soportan :hover
		const [isHovered, setIsHovered] = React.useState(false);
		const hoverStyle = useMemo((): React.CSSProperties => {
			if (
				!styleTokens ||
				disabled ||
				readOnly ||
				isFocused ||
				errorProp ||
				success
			)
				return {};
			if (isHovered) return { borderColor: styleTokens.hoverBorder };
			return {};
		}, [
			styleTokens,
			isHovered,
			disabled,
			readOnly,
			isFocused,
			errorProp,
			success,
		]);

		React.useEffect(() => {
			const handleClickOutside = (event: MouseEvent) => {
				// 🎯 CORRECCIÓN: Dentro de modales, manejar clicks fuera de forma diferente
				if (isInsideModal) {
					// Dentro de modales, solo cerrar si el click es fuera del modal completo
					const modalElement = componentRootRef.current?.closest(
						'[data-standard-dialog-body], [role="dialog"]',
					);
					if (modalElement && !modalElement.contains(event.target as Node)) {
						if (isOpen) {
							setIsOpen(false);
							setIsFocused(false);
							onBlurProp?.();
						}
					}
					return;
				}

				// Comportamiento normal fuera de modales
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
		}, [isOpen, onBlurProp, isInsideModal]);

		React.useEffect(() => {
			if (autoFocus && selectClickableRef.current && !disabled && !readOnly) {
				selectClickableRef.current.focus();
			}
		}, [autoFocus, disabled, readOnly]);
		//#endregion ![sub_effects]

		//#region [sub_helpers] - 🧰 HELPER FUNCTIONS 🧰
		const mapSelectSizeToIconSize = (
			s: StandardSelectSize,
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
		const iconInternalSize = mapSelectSizeToIconSize(size);

		const handleOptionClick = (optionValue: string) => {
			if (disabled || readOnly) return;
			let newSelectedValuesArray: string[];
			let finalValueToEmit: string | string[] | undefined;
			let valueActuallyChanged = false;

			if (multiple) {
				const isCurrentlySelected = selectedValues.includes(optionValue);
				newSelectedValuesArray =
					isCurrentlySelected ?
						selectedValues.filter((v) => v !== optionValue)
					:	[...selectedValues, optionValue];
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
						setIsOpen(false);
					}
					break;
			}
		};
		//#endregion ![sub_helpers]

		// Tokens de tamaño con fallback
		const currentSizeTokens = sizeTokens || {
			height: "2.5rem",
			fontSize: "0.875rem",
			paddingX: "0.75rem",
			paddingY: "0.5rem",
			optionPaddingX: "0.75rem",
			optionPaddingY: "0.5rem",
			dropdownMaxHeight: "15rem",
		};

		const [dropdownPosition, setDropdownPosition] =
			React.useState<React.CSSProperties>({});

		const composedDropdownStyle = useMemo(
			() => ({ ...dropdownPosition }),
			[dropdownPosition],
		);

		React.useLayoutEffect(() => {
			if (!isOpen) return;

			const updatePosition = () => {
				if (!selectClickableRef.current) return;

				const rect = selectClickableRef.current.getBoundingClientRect();
				const estimatedDropdownHeight = Math.min(options.length * 44 + 8, 280);
				const spaceBelow = window.innerHeight - rect.bottom - 8;
				const spaceAbove = rect.top - 8;

				// 🎯 DENTRO DE MODALES: posición absoluta relativa al propio select
				// El div raíz del select ya tiene position:relative, así que
				// position:absolute se posiciona correctamente sin calcular offsets
				if (isInsideModal) {
					const selectRect = selectClickableRef.current.getBoundingClientRect();
					const selectHeight = selectRect.height;

					let top = selectHeight + 4; // Justo debajo del select
					if (
						spaceBelow < estimatedDropdownHeight &&
						spaceAbove > spaceBelow
					) {
						top = -estimatedDropdownHeight - 4; // Arriba del select
					}

					setDropdownPosition({
						position: "absolute",
						top: `${top}px`,
						left: "0px",
						width: "100%",
						zIndex: zIndexValue,
					});
				} else {
					// Comportamiento normal fuera de modales (con portal)
					let top = rect.bottom + 4;
					if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
						top = rect.top - estimatedDropdownHeight - 4;
					}

					setDropdownPosition({
						position: "fixed",
						top: `${top}px`,
						left: `${rect.left}px`,
						width: `${rect.width}px`,
						zIndex: 10000,
					});
				}
			};

			updatePosition();
			window.addEventListener("resize", updatePosition);
			window.addEventListener("scroll", updatePosition, true);

			return () => {
				window.removeEventListener("resize", updatePosition);
				window.removeEventListener("scroll", updatePosition, true);
			};
		}, [isOpen, options.length, isInsideModal, zIndexValue]);

		const hasLeadingIcon =
			(leadingIcon &&
				(!multiple || selectedOptions.length === 0) &&
				(selectedOptions.length === 0 || !selectedOptions[0].icon)) ||
			(selectedOptions.length > 0 && !multiple && selectedOptions[0].icon);
		const hasClearButton =
			clearable && selectedValues.length > 0 && !disabled && !readOnly;
		const paddings = {
			sm: {
				withIcon: "pl-7",
				withoutIcon: "pl-3",
				withChevron: "pr-7",
				withChevronAndClear: "pr-12",
			},
			md: {
				withIcon: "pl-8",
				withoutIcon: "pl-4",
				withChevron: "pr-8",
				withChevronAndClear: "pr-14",
			},
			lg: {
				withIcon: "pl-10",
				withoutIcon: "pl-4",
				withChevron: "pr-10",
				withChevronAndClear: "pr-16",
			},
		};
		const currentPaddings = paddings[size];
		const paddingClasses = [
			hasLeadingIcon ? currentPaddings.withIcon : currentPaddings.withoutIcon,
			hasClearButton ?
				currentPaddings.withChevronAndClear
			:	currentPaddings.withChevron,
		];
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
			...paddingClasses,
			disabled && "cursor-not-allowed",
			readOnly && "cursor-default",
			className,
		);

		// Estilos inline combinados: tamaño + estado + hover
		const selectCombinedStyles: React.CSSProperties = useMemo(
			() => ({
				height: currentSizeTokens.height,
				fontSize: currentSizeTokens.fontSize,
				paddingTop: currentSizeTokens.paddingY,
				paddingBottom: currentSizeTokens.paddingY,
				...computedSelectStyle,
				...hoverStyle,
			}),
			[currentSizeTokens, computedSelectStyle, hoverStyle],
		);

		const getIconLeftPosition = () => {
			switch (size) {
				case "sm":
					return "left-2.5";
				case "lg":
					return "left-3.5";
				default:
					return "left-3";
			}
		};

		//#region [render] - RENDER
		return (
			<div
				className={cn("relative", { "w-full": fullWidth })}
				ref={componentRootRef}
				data-standard-select-root
				{...restRootProps}>
				<div
					ref={selectClickableRef}
					className={finalSelectContainerClasses}
					style={selectCombinedStyles}
					onClick={() => !disabled && !readOnly && setIsOpen(!isOpen)}
					onKeyDown={handleKeyDown}
					onFocus={() => !disabled && !readOnly && setIsFocused(true)}
					onBlur={() => {
						if (!isOpen) {
							setIsFocused(false);
							onBlurProp?.();
						}
					}}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
					tabIndex={disabled ? -1 : 0}
					role="combobox"
					aria-haspopup="listbox"
					aria-expanded={isOpen}
					aria-controls={id ? `${id}-options` : undefined}
					aria-required={isRequired}
					aria-invalid={isErrorActive}
					aria-disabled={disabled}
					aria-readonly={readOnly}
					aria-describedby={ariaDescribedBy}>
					{hasLeadingIcon && (
						<div
							className={`absolute ${getIconLeftPosition()} top-1/2 -translate-y-1/2 flex items-center pointer-events-none`}>
							<StandardIcon
								size={iconInternalSize}
								styleType="outline"
								colorScheme="primary"
								colorShade="text">
								{(
									selectedOptions.length > 0 &&
									!multiple &&
									selectedOptions[0].icon
								) ?
									React.createElement(selectedOptions[0].icon!)
								:	React.createElement(leadingIcon!)}
							</StandardIcon>
						</div>
					)}
					<div className="flex-1 flex flex-wrap gap-1 items-center overflow-hidden">
						{selectedOptions.length > 0 ?
							multiple ?
								selectedOptions.map((option) => (
									<div
										key={option.value}
										className={cn(
											"rounded px-1.5 py-0.5 flex items-center gap-1 max-w-[calc(100%-4px)]",
											"bg-[var(--select-option-selected-bg)] text-[var(--select-option-selected-text)]",
										)}>
										{option.icon && (
											<span className="flex-shrink-0 mr-1">
												<StandardIcon
													styleType="outline"
													size="xs"
													colorScheme="primary">
													{React.createElement(option.icon)}
												</StandardIcon>
											</span>
										)}
										<StandardText size="xs" weight="medium" truncate>
											{option.label}
										</StandardText>
										{clearable && !disabled && !readOnly && (
											<button
												type="button"
												onClick={(e) => handleClear(e, option.value)}
												className={cn(
													"cursor-pointer flex-shrink-0 ml-1 p-0.5 rounded-full",
													"hover:bg-[rgba(255,255,255,0.2)]",
												)}
												aria-label={`Quitar ${option.label}`}>
												<StandardIcon
													styleType="outline"
													size="xs"
													colorScheme="primary">
													<X />
												</StandardIcon>
											</button>
										)}
									</div>
								))
							:	<StandardText truncate>{selectedOptions[0].label}</StandardText>
						:	<StandardText colorScheme="neutral" colorShade="textShade">
								{placeholder}
							</StandardText>
						}
					</div>
					<div className="absolute right-1.5 top-0 h-full flex items-center gap-0.5">
						{hasClearButton && (
							<button
								type="button"
								onClick={handleClear}
								className="rounded-full p-0.5 hover:bg-[rgba(0,0,0,0.05)] transition-colors flex items-center justify-center mr-0.5"
								aria-label="Limpiar selección">
								<StandardIcon
									styleType="outline"
									size={iconInternalSize}
									colorScheme="primary">
									<X />
								</StandardIcon>
							</button>
						)}
					</div>
				</div>

				{portalContainer ?
					createPortal(
						isOpen && !readOnly ?
							<div
								ref={optionsRef}
								tabIndex={-1}
								role="listbox"
								id={id ? `${id}-options` : undefined}
								aria-multiselectable={multiple}
								data-standard-select-dropdown
								className={cn(
									`select-dropdown-${selectId}`,
									"rounded-md border shadow-lg overflow-auto outline-none",
									currentSizeTokens.dropdownMaxHeight,
								)}
								style={{
									...composedDropdownStyle,
									backgroundColor: styleTokens?.dropdownBackground,
									borderColor: styleTokens?.dropdownBorder,
								}}>
								<div className="py-1">
									{options.map((option) => (
										<SelectOptionItem
											key={option.value}
											option={option}
											isSelected={selectedValues.includes(option.value)}
											tokens={styleTokens}
											sizeTokens={currentSizeTokens}
											iconSize={iconInternalSize}
											onSelect={handleOptionClick}
										/>
									))}
								</div>
							</div>
						:	null,
						portalContainer,
					)
				: isOpen && !readOnly ?
					<div
						ref={optionsRef}
						tabIndex={-1}
						role="listbox"
						id={id ? `${id}-options` : undefined}
						aria-multiselectable={multiple}
						data-standard-select-dropdown
						className={cn(
							"rounded-md border shadow-lg overflow-auto outline-none",
							currentSizeTokens.dropdownMaxHeight,
						)}
						style={{
							...composedDropdownStyle,
							backgroundColor: styleTokens?.dropdownBackground,
							borderColor: styleTokens?.dropdownBorder,
						}}>
						<div className="py-1">
							{options.map((option) => (
								<SelectOptionItem
									key={option.value}
									option={option}
									isSelected={selectedValues.includes(option.value)}
									tokens={styleTokens}
									sizeTokens={currentSizeTokens}
									iconSize={iconInternalSize}
									onSelect={handleOptionClick}
								/>
							))}
						</div>
					</div>
				:	null}

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
		//#endregion ![render]
	},
);
//#endregion ![main]

//#region [foo] - EXPORTS
StandardSelect.displayName = "StandardSelect";
export { StandardSelect };
export { StandardSelect as Select };
export const SelectContent = React.Fragment;
export const SelectItem = (props: React.ComponentPropsWithoutRef<"div">) => (
	<div {...props} />
);
export const SelectTrigger = (props: React.ComponentPropsWithoutRef<"div">) => (
	<div {...props} />
);
export const SelectValue = (props: React.ComponentPropsWithoutRef<"div">) => (
	<div {...props} />
);
//#endregion ![foo]
