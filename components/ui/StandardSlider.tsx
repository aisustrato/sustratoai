//. 📍 components/ui/StandardSlider.tsx (v4.0 - Estrategia Portal)

"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
  generateStandardSliderTokens,
  type StandardSliderSize,
  type StandardSliderStyleType,
} from "@/lib/theme/components/standard-slider-tokens";
import type { ProCardVariant } from "@/lib/theme/ColorToken";

//#region [def] - 📦 INTERFACES 📦
export interface StandardSliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  colorScheme?: ProCardVariant;
  styleType?: StandardSliderStyleType;
  size?: StandardSliderSize;
  showTooltip?: boolean;
}
//#endregion ![def]

//#region [main] - 🧱 COMPONENT 🧱
const StandardSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  StandardSliderProps
>(
  (
    {
      className,
      colorScheme = "primary",
      styleType = "solid",
      size = "md",
      showTooltip = false, 
      ...props
    },
    ref
  ) => {
    const { appColorTokens, mode } = useTheme();
    
    const orientation = props.orientation || 'horizontal';
    const sliderValues = props.value ?? props.defaultValue ?? [0];
    const valueArray = Array.isArray(sliderValues) ? sliderValues : [sliderValues];

    const [activeThumbIndex, setActiveThumbIndex] = React.useState<number | null>(null);
    const [hoveredThumbIndex, setHoveredThumbIndex] = React.useState<number | null>(null);
    const thumbRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
    const [tooltipPosition, setTooltipPosition] = React.useState({ top: 0, left: 0, opacity: 0 });
    
    const cssVariables = React.useMemo(() => {
      if (!appColorTokens || !mode) return {};
      return generateStandardSliderTokens(appColorTokens, mode, colorScheme, styleType);
    }, [appColorTokens, mode, colorScheme, styleType]);

    const sizeClasses = React.useMemo(() => {
      const map = {
        xs: { track: "h-1", thumb: "h-4 w-4" },
        sm: { track: "h-1.5", thumb: "h-5 w-5" },
        md: { track: "h-2", thumb: "h-6 w-6" },
        lg: { track: "h-2.5", thumb: "h-7 w-7" },
        xl: { track: "h-3", thumb: "h-8 w-8" },
      };
      return map[size] || map.md;
    }, [size]);

    // ✅ EFECTO PARA CALCULAR LA POSICIÓN DEL TOOLTIP
    React.useEffect(() => {
      const thumbIndex = activeThumbIndex ?? hoveredThumbIndex;
      if (showTooltip && thumbIndex !== null && thumbRefs.current[thumbIndex]) {
        const thumbRect = thumbRefs.current[thumbIndex]!.getBoundingClientRect();
        const top = thumbRect.top - thumbRect.height - 4; // 4px de offset
        const left = thumbRect.left + thumbRect.width / 2;
        setTooltipPosition({ top: top + window.scrollY, left: left + window.scrollX, opacity: 1 });
      } else {
        setTooltipPosition(pos => ({ ...pos, opacity: 0 }));
      }
    }, [sliderValues, activeThumbIndex, hoveredThumbIndex, showTooltip]);

    return (
      <>
        <SliderPrimitive.Root
          ref={ref}
          className={cn("relative flex touch-none select-none items-center py-2", { "w-full": orientation === "horizontal", "h-48 flex-col w-fit px-2": orientation === "vertical" }, className)}
          style={cssVariables}
          {...props}
        >
          <SliderPrimitive.Track
            className={cn("relative grow overflow-hidden rounded-full bg-[var(--sl-track-bg)]", orientation === 'horizontal' ? `w-full ${sizeClasses.track}` : `h-full ${sizeClasses.track.replace('h-','w-')}`)}
          >
            <SliderPrimitive.Range
              className={cn("absolute", orientation === 'horizontal' ? 'h-full' : 'w-full', { "bg-[var(--sl-range-bg)]": styleType === 'solid', "bg-gradient-to-r from-[var(--sl-range-gradient-start)] to-[var(--sl-range-gradient-end)]": styleType === 'gradient' && orientation === 'horizontal', "bg-gradient-to-b from-[var(--sl-range-gradient-start)] to-[var(--sl-range-gradient-end)]": styleType === 'gradient' && orientation === 'vertical' })}
            />
          </SliderPrimitive.Track>
          
          {valueArray.map((value, index) => {
            const thumbStyle = React.useMemo<React.CSSProperties>(() => {
              const isHovered = hoveredThumbIndex === index;
              const isActive = activeThumbIndex === index;
              
              const restingOutline = '0 0 0 1px var(--sl-thumb-outline-color)';
              const aestheticShadow = 'var(--sl-thumb-shadow)';
              const focusHalo = '0 0 10px 3px var(--sl-thumb-halo-color)';

              let finalBoxShadow = `${restingOutline}, ${aestheticShadow}`;
              if (isActive && !props.disabled) {
                finalBoxShadow = `${focusHalo}, ${finalBoxShadow}`;
              }
              let finalTransform = 'scale(1)';
              if (isActive && !props.disabled) {
                finalTransform = 'scale(1.05)';
              } else if (isHovered && !props.disabled) {
                finalTransform = 'scale(1.1)';
              }
              return { display: 'block', width: '100%', height: '100%', borderRadius: '9999px', backgroundColor: 'var(--sl-thumb-bg)', boxShadow: finalBoxShadow, transform: finalTransform, transition: 'transform 150ms ease, box-shadow 150ms ease' };
            }, [hoveredThumbIndex, activeThumbIndex, props.disabled]);

            return (
              <SliderPrimitive.Thumb
                key={index}
                ref={el => { thumbRefs.current[index] = el; }}
                onMouseEnter={() => setHoveredThumbIndex(index)}
                onMouseLeave={() => setHoveredThumbIndex(null)}
                onPointerDown={() => setActiveThumbIndex(index)}
                onPointerUp={() => setActiveThumbIndex(null)}
                onFocus={() => setActiveThumbIndex(index)}
                onBlur={() => setActiveThumbIndex(null)}
                className={cn("flex items-center justify-center bg-transparent focus-visible:outline-none", sizeClasses.thumb)}
              >
                <div style={thumbStyle} />
              </SliderPrimitive.Thumb>
            );
          })}
        </SliderPrimitive.Root>

        {/* ✅ EL TOOLTIP AHORA VIVE EN UN PORTAL, FUERA DEL SLIDER */}
        {typeof window !== 'undefined' && ReactDOM.createPortal(
            <div
              className="pointer-events-none absolute z-50 rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-gray-50 shadow-lg transition-opacity dark:bg-gray-50 dark:text-gray-900"
              style={{ 
                left: tooltipPosition.left, 
                top: tooltipPosition.top,
                opacity: tooltipPosition.opacity,
                transform: 'translate(-50%, -100%)', // Centra y posiciona arriba
              }}
            >
              {(activeThumbIndex ?? hoveredThumbIndex) !== null ? valueArray[activeThumbIndex ?? hoveredThumbIndex ?? 0] : ''}
            </div>,
            document.body
        )}
      </>
    );
  }
);
StandardSlider.displayName = "StandardSlider";

export { StandardSlider };
//#endregion ![main]