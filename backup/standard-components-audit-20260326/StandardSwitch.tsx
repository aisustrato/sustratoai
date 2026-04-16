//. 📍 components/ui/StandardSwitch.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import type { SwitchSize } from "@/app/providers/DesignTokensProvider";
import { type ColorSchemeVariant } from "@/lib/theme/ColorToken";
//#endregion ![head]


//#region [def] - 📦 INTERFACES, TYPES & VARIANTS 📦

export interface StandardSwitchProps 
    extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
    colorScheme?: ColorSchemeVariant;
    size?: SwitchSize;
}

//#endregion ![def]


//#region [main] - 🧱 ROOT COMPONENT 🧱

const StandardSwitch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitive.Root>,
    StandardSwitchProps
>(({ className, colorScheme = 'primary', size = 'md', ...props }, ref) => {
    
    //#region [sub_init] - 🪧 HOOKS, STATE, MEMOS 🪧
    const { tokens } = useDesignTokens();

    //#endregion ![sub_init]


    //#region [sub_logic] - ⚙️ DATA & CALCULATIONS ⚙️

    if (!tokens) {
        return <div className="w-11 h-6 bg-neutral-200 rounded-full animate-pulse" />;
    }

    const currentSize = tokens.switch.sizes[size];
    const currentColorScheme = tokens.switch.colors[colorScheme];

    const cssVariables: React.CSSProperties & { [key: `--${string}`]: string } = {
        '--switch-height': currentSize.height,
        '--switch-width': currentSize.width,
        '--switch-thumb-size': currentSize.thumbSize,
        '--switch-thumb-translate': currentSize.thumbTranslate,
        
        '--switch-track-on-bg': currentColorScheme.on.trackBackground,
        '--switch-thumb-on-bg': currentColorScheme.on.thumbBackground,

        '--switch-track-off-bg': currentColorScheme.off.trackBackground,
        '--switch-thumb-off-bg': currentColorScheme.off.thumbBackground,
        '--switch-thumb-off-border': currentColorScheme.off.thumbBorderColor || 'transparent',
        
        '--switch-track-disabled-bg': currentColorScheme.disabled.trackBackground,
        '--switch-thumb-disabled-bg': currentColorScheme.disabled.thumbBackground,
    };
    
    //#endregion ![sub_logic]


    //#region [render] - 🖼️ JSX STRUCTURE 🖼️
    return (
        <SwitchPrimitive.Root
            className={cn(
                // --- Base y Posicionamiento ---
                "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
                // ✨ CORRECCIÓN: Se añaden las clases de tamaño al contenedor principal (el 'track')
                "h-[var(--switch-height)] w-[var(--switch-width)]",
                // --- Estados ---
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed",
                // --- Aplicación de Colores usando data-state y variables CSS ---
                "bg-[var(--switch-track-off-bg)] data-[state=checked]:bg-[var(--switch-track-on-bg)]",
                "disabled:bg-[var(--switch-track-disabled-bg)]",
                // --- Anclaje para el offset del anillo de foco ---
                "focus-visible:ring-offset-white dark:focus-visible:ring-offset-black",
                className // <-- Aquí se añade la prop className
            )}
            style={cssVariables}
            ref={ref}
            {...props}
        >
            <SwitchPrimitive.Thumb
                className={cn(
                    // --- Base y Posicionamiento ---
                    "pointer-events-none block rounded-full shadow-lg ring-0 transition-transform",
                    // --- Aplicación de Tamaño y Transformación ---
                    "h-[var(--switch-thumb-size)] w-[var(--switch-thumb-size)]",
                    "data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-[var(--switch-thumb-translate)]",
                    // --- Aplicación de Colores ---
                    "bg-[var(--switch-thumb-off-bg)] border border-[var(--switch-thumb-off-border)]",
                    "data-[state=checked]:bg-[var(--switch-thumb-on-bg)] data-[state=checked]:border-transparent",
                    "data-[disabled]:bg-[var(--switch-thumb-disabled-bg)] data-[disabled]:border-transparent"
                )}
            />
        </SwitchPrimitive.Root>
    );
    //#endregion ![render]
});

StandardSwitch.displayName = SwitchPrimitive.Root.displayName;

export { StandardSwitch };

//#endregion ![main]