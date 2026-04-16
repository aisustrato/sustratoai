//. 📍 components/ui/StandardSlider.tsx (v4.0 - Estrategia Portal)

"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import type { SliderSize, SliderStyleType } from "@/app/providers/DesignTokensProvider";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

//#region [def] - 📦 INTERFACES 📦
export interface StandardSliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  colorScheme?: ColorSchemeVariant;
  styleType?: SliderStyleType;
  size?: SliderSize;
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
    const { tokens } = useDesignTokens();
    
    const orientation = props.orientation || 'horizontal';
    const valueArray = React.useMemo(() => {
      const values = props.value ?? props.defaultValue ?? [0];
      return Array.isArray(values) ? values : [values];
    }, [props.value, props.defaultValue]);

    const [activeThumbIndex, setActiveThumbIndex] = React.useState<number | null>(null);
    const [hoveredThumbIndex, setHoveredThumbIndex] = React.useState<number | null>(null);
    const thumbRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
    const [tooltipPosition, setTooltipPosition] = React.useState({ top: 0, left: 0, opacity: 0 });
    
    const sliderTokens = React.useMemo(() => {
      if (!tokens) return null;
      return tokens.slider.styles[colorScheme][styleType];
    }, [tokens, colorScheme, styleType]);

    const sizeClasses = React.useMemo(() => {
      if (!tokens) return { track: "h-2", thumb: "h-6 w-6" };
      return tokens.slider.sizes[size];
    }, [tokens, size]);

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
    }, [valueArray, activeThumbIndex, hoveredThumbIndex, showTooltip]);

    if (!sliderTokens) return null;

    return (
      <>
        <SliderPrimitive.Root
          ref={ref}
          className={cn("relative flex touch-none select-none items-center py-2", { "w-full": orientation === "horizontal", "h-48 flex-col w-fit px-2": orientation === "vertical" }, className)}
          {...props}
        >
          <SliderPrimitive.Track
            className={cn("relative grow overflow-hidden rounded-full", orientation === 'horizontal' ? `w-full ${sizeClasses.track}` : `h-full ${sizeClasses.track.replace('h-','w-')}`)}  
            style={{ backgroundColor: sliderTokens.trackBg }}
          >
            <SliderPrimitive.Range
              className={cn("absolute", orientation === 'horizontal' ? 'h-full' : 'w-full')}
              style={{
                background: styleType === 'solid' 
                  ? sliderTokens.rangeBg 
                  : orientation === 'horizontal'
                    ? `linear-gradient(to right, ${sliderTokens.rangeGradientStart}, ${sliderTokens.rangeGradientEnd})`
                    : `linear-gradient(to bottom, ${sliderTokens.rangeGradientStart}, ${sliderTokens.rangeGradientEnd})`
              }}
            />
          </SliderPrimitive.Track>
          
          {valueArray.map((value, index) => {
            const isHovered = hoveredThumbIndex === index;
            const isActive = activeThumbIndex === index;
            
            const restingOutline = `0 0 0 1px ${sliderTokens.thumbOutlineColor}`;
            const aestheticShadow = sliderTokens.thumbShadow;
            const focusHalo = `0 0 10px 3px ${sliderTokens.thumbHaloColor}`;

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
            const thumbStyle: React.CSSProperties = { display: 'block', width: '100%', height: '100%', borderRadius: '9999px', backgroundColor: sliderTokens.thumbBg, boxShadow: finalBoxShadow, transform: finalTransform, transition: 'transform 150ms ease, box-shadow 150ms ease' };

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