"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
	generateSliderTokens,
	type SliderColor,
	type SliderSize,
	type SliderVariant,
} from "@/lib/theme/components/slider-token";

// Definimos las propiedades del slider
export interface CustomSliderProps
	extends Omit<
			React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
			"orientation"
		>,
		VariantProps<typeof sliderVariants> {
	color?: SliderColor;
	size?: SliderSize;
	variant?: SliderVariant;
	showValue?: boolean;
	valuePrefix?: string;
	valueSuffix?: string;
	showTooltip?: boolean;
	showTicks?: boolean;
	tickCount?: number;
	tickLabels?: string[];
	gradient?: boolean;
	thumbLabel?: string;
	ariaValueText?: (value: number) => string;
}

// Definimos las variantes del slider usando CVA
const sliderVariants = cva(
	"relative flex touch-none select-none items-center",
	{
		variants: {
			variant: {
				solid: "",
				outline: "",
				subtle: "",
			},
			size: {
				xs: "",
				sm: "",
				md: "",
				lg: "",
				xl: "",
			},
			orientation: {
				horizontal: "w-full",
				vertical: "h-full flex-col",
			},
			gradient: {
				true: "",
			},
		},
		defaultVariants: {
			variant: "solid",
			size: "md",
			orientation: "horizontal",
		},
	}
);

const CustomSlider = React.forwardRef<
	React.ElementRef<typeof SliderPrimitive.Root>,
	CustomSliderProps
>(
	(
		{
			className,
			variant = "solid",
			size = "md",
			color = "primary",
			orientation = "horizontal",
			showValue = false,
			valuePrefix = "",
			valueSuffix = "",
			showTooltip = false,
			showTicks = false,
			tickCount = 5,
			tickLabels,
			gradient = false,
			thumbLabel,
			ariaValueText,
			...props
		},
		ref
	) => {
		const { appColorTokens, mode } = useTheme();
		const sliderTokens = React.useMemo(() => {
			if (!appColorTokens) return null;
			return generateSliderTokens(appColorTokens, mode);
		}, [appColorTokens, mode]);

		// Ensure orientation is always "horizontal" or "vertical"
		const sliderOrientation =
			orientation === "vertical" ? "vertical" : "horizontal";

		const [hoveredThumb, setHoveredThumb] = React.useState<number | null>(null);
		const [activeThumb, setActiveThumb] = React.useState<number | null>(null);
		const [tooltipVisible, setTooltipVisible] = React.useState<boolean>(false);
		const [tooltipPosition, setTooltipPosition] = React.useState({
			x: 0,
			y: 0,
		});
		const [tooltipValue, setTooltipValue] = React.useState<number | null>(null);

		const isVertical = sliderOrientation === "vertical";
		const isMultiThumb =
			Array.isArray(props.defaultValue) && props.defaultValue.length > 1;
		const value = props.value || props.defaultValue || 0;
		const currentValue = Array.isArray(value)
			? value[0]
			: typeof value === "number"
			? value
			: props.defaultValue
			? Array.isArray(props.defaultValue)
				? props.defaultValue[0]
				: props.defaultValue
			: 0;

		// Generar marcas de ticks si están habilitadas
		const ticks = React.useMemo(() => {
			if (!showTicks) return [];

			const min = props.min || 0;
			const max = props.max || 100;
			const step = (max - min) / (tickCount - 1);

			return Array.from({ length: tickCount }).map((_, i) => {
				const tickValue = min + i * step;
				const percent = ((tickValue - min) / (max - min)) * 100;
				return {
					value: tickValue,
					percent,
					label: tickLabels ? tickLabels[i] : tickValue.toString(),
				};
			});
		}, [showTicks, tickCount, tickLabels, props.min, props.max]);

		// Manejar eventos de mouse para el pulgar
		const handleThumbMouseEnter = (index: number) => {
			setHoveredThumb(index);
			if (showTooltip) {
				setTooltipVisible(true);
			}
		};

		const handleThumbMouseLeave = () => {
			setHoveredThumb(null);
			if (showTooltip && activeThumb === null) {
				setTooltipVisible(false);
			}
		};

		const handleThumbMouseDown = (index: number) => {
			setActiveThumb(index);
		};

		const handleThumbMouseUp = () => {
			setActiveThumb(null);
			if (!hoveredThumb) {
				setTooltipVisible(false);
			}
		};

		// Actualizar posición del tooltip
		const updateTooltipPosition = (e: React.MouseEvent, index: number) => {
			if (showTooltip) {
				const rect = e.currentTarget.getBoundingClientRect();
				setTooltipPosition({
					x: rect.left + rect.width / 2,
					y: rect.top - 30,
				});

				const values = Array.isArray(value) ? value : [value];
				setTooltipValue(values[index]);
			}
		};

		// Efecto para agregar/eliminar listeners globales
		React.useEffect(() => {
			const handleGlobalMouseUp = () => {
				setActiveThumb(null);
				if (!hoveredThumb) {
					setTooltipVisible(false);
				}
			};

			document.addEventListener("mouseup", handleGlobalMouseUp);
			return () => {
				document.removeEventListener("mouseup", handleGlobalMouseUp);
			};
		}, [hoveredThumb]);

		// Si no hay tokens disponibles, mostrar un slider básico
		if (!sliderTokens) {
			return (
				<SliderPrimitive.Root
					ref={ref}
					className={cn(
						"relative flex w-full touch-none select-none items-center",
						className
					)}
					orientation={sliderOrientation}
					{...props}>
					<SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
						<SliderPrimitive.Range className="absolute h-full bg-gray-400 dark:bg-gray-600" />
					</SliderPrimitive.Track>
					<SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-gray-400 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-950 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-600" />
				</SliderPrimitive.Root>
			);
		}

		// Estilos personalizados basados en tokens
		const trackStyles: React.CSSProperties = {
			height: isVertical ? "100%" : sliderTokens.base.trackHeight[size],
			width: isVertical ? sliderTokens.base.trackHeight[size] : "100%",
			borderRadius: sliderTokens.base.borderRadius,
			background: sliderTokens.variants[variant].default.track.background,
			border: sliderTokens.variants[variant].default.track.border,
			transition: sliderTokens.base.transition,
		};

		const rangeStyles: React.CSSProperties = {
			background: gradient
				? sliderTokens.colors[color].range.gradient
				: sliderTokens.colors[color].range.background,
			border: sliderTokens.colors[color].range.border,
			transition: sliderTokens.base.transition,
		};

		const getThumbStyles = (index: number): React.CSSProperties => {
			const isHovered = hoveredThumb === index;
			const isActive = activeThumb === index;
			const isDisabled = props.disabled;

			if (isDisabled) {
				return {
					width: sliderTokens.base.thumbSize[size],
					height: sliderTokens.base.thumbSize[size],
					borderRadius: sliderTokens.base.borderRadius,
					background: sliderTokens.variants[variant].disabled.thumb.background,
					border: sliderTokens.variants[variant].disabled.thumb.border,
					opacity: sliderTokens.variants[variant].disabled.thumb.opacity,
					cursor: sliderTokens.variants[variant].disabled.thumb.cursor,
					transition: sliderTokens.base.transition,
				};
			}

			if (isActive) {
				return {
					width: sliderTokens.base.thumbSize[size],
					height: sliderTokens.base.thumbSize[size],
					borderRadius: sliderTokens.base.borderRadius,
					background: sliderTokens.colors[color].thumb.activeBackground,
					border: sliderTokens.colors[color].thumb.activeBorder,
					boxShadow: sliderTokens.variants[variant].active.thumb.boxShadow,
					transform: sliderTokens.variants[variant].active.thumb.transform,
					transition: sliderTokens.base.transition,
				};
			}

			if (isHovered) {
				return {
					width: sliderTokens.base.thumbSize[size],
					height: sliderTokens.base.thumbSize[size],
					borderRadius: sliderTokens.base.borderRadius,
					background: sliderTokens.colors[color].thumb.hoverBackground,
					border: sliderTokens.colors[color].thumb.hoverBorder,
					boxShadow: sliderTokens.variants[variant].hover.thumb.boxShadow,
					transform: sliderTokens.variants[variant].hover.thumb.transform,
					transition: sliderTokens.base.transition,
				};
			}

			return {
				width: sliderTokens.base.thumbSize[size],
				height: sliderTokens.base.thumbSize[size],
				borderRadius: sliderTokens.base.borderRadius,
				background: sliderTokens.colors[color].thumb.background,
				border: sliderTokens.colors[color].thumb.border,
				boxShadow: sliderTokens.variants[variant].default.thumb.boxShadow,
				transition: sliderTokens.base.transition,
			};
		};

		// Renderizar el tooltip
		const renderTooltip = () => {
			if (!showTooltip || tooltipValue === null || !tooltipVisible) return null;

			return (
				<div
					className="absolute z-50 px-2 py-1 text-xs font-medium text-white bg-black rounded shadow pointer-events-none"
					style={{
						left: `${tooltipPosition.x}px`,
						top: `${tooltipPosition.y}px`,
						transform: "translate(-50%, -100%)",
					}}>
					{valuePrefix}
					{tooltipValue}
					{valueSuffix}
				</div>
			);
		};

		// Renderizar el valor
		const renderValue = () => {
			if (!showValue) return null;

			return (
				<div className="ml-2 text-sm font-medium">
					{valuePrefix}
					{currentValue}
					{valueSuffix}
				</div>
			);
		};

		// Renderizar los ticks
		const renderTicks = () => {
			if (!showTicks) return null;

			return (
				<div
					className={cn(
						"relative w-full mt-2",
						isVertical && "h-full w-auto ml-2 mt-0"
					)}
					style={{
						height: isVertical ? "100%" : "auto",
					}}>
					{ticks.map((tick, i) => (
						<div
							key={i}
							className={cn(
								"absolute -translate-x-1/2 flex flex-col items-center",
								isVertical && "translate-x-0 -translate-y-1/2"
							)}
							style={{
								[isVertical ? "top" : "left"]: `${tick.percent}%`,
							}}>
							<div className="w-1 h-2 bg-gray-400" />
							{tickLabels && <span className="mt-1 text-xs">{tick.label}</span>}
						</div>
					))}
				</div>
			);
		};

		return (
			<div className="flex flex-col w-full">
				<div className="flex items-center w-full">
					<SliderPrimitive.Root
						ref={ref}
						className={cn(
							sliderVariants({
								variant,
								size,
								orientation: sliderOrientation,
								gradient,
								className,
							})
						)}
						orientation={sliderOrientation}
						onValueChange={(newValue) => {
							if (
								showTooltip &&
								(hoveredThumb !== null || activeThumb !== null)
							) {
								const index = activeThumb !== null ? activeThumb : hoveredThumb;
								if (index !== null) {
									setTooltipValue(
										Array.isArray(newValue) ? newValue[index] : newValue
									);
								}
							}
							// Asegurarnos de que siempre llamamos al onValueChange con el valor actualizado
							if (props.onValueChange) {
								props.onValueChange(newValue);
							}
						}}
						aria-valuetext={
							ariaValueText ? ariaValueText(currentValue) : undefined
						}
						{...props}>
						<SliderPrimitive.Track
							className="relative grow overflow-hidden"
							style={trackStyles}>
							<SliderPrimitive.Range
								className="absolute h-full"
								style={rangeStyles}
							/>
						</SliderPrimitive.Track>

						{/* Renderizar un pulgar para cada valor */}
						{Array.isArray(value) ? (
							value.map((_, i) => (
								<SliderPrimitive.Thumb
									key={i}
									className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none"
									style={getThumbStyles(i)}
									onMouseEnter={() => handleThumbMouseEnter(i)}
									onMouseLeave={handleThumbMouseLeave}
									onMouseDown={() => handleThumbMouseDown(i)}
									onMouseUp={handleThumbMouseUp}
									onMouseMove={(e) => updateTooltipPosition(e, i)}
									aria-label={thumbLabel}
								/>
							))
						) : (
							<SliderPrimitive.Thumb
								className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none"
								style={getThumbStyles(0)}
								onMouseEnter={() => handleThumbMouseEnter(0)}
								onMouseLeave={handleThumbMouseLeave}
								onMouseDown={() => handleThumbMouseDown(0)}
								onMouseUp={handleThumbMouseUp}
								onMouseMove={(e) => updateTooltipPosition(e, 0)}
								aria-label={thumbLabel}
							/>
						)}
					</SliderPrimitive.Root>

					{renderValue()}
				</div>

				{renderTicks()}
				{renderTooltip()}
			</div>
		);
	}
);

CustomSlider.displayName = "CustomSlider";

export { CustomSlider };
