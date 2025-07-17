//. 📍 components/ui/StandardTooltip.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import { generateStandardTooltipTokens, type StandardTooltipStyleType, type TooltipStyleTokens } from "@/lib/theme/components/standard-tooltip-tokens";
import { type ColorSchemeVariant } from "@/lib/theme/ColorToken";
//#endregion ![head]

//#region [def] - 📦 INTERFACES, TYPES & VARIANTS 📦

export interface StandardTooltipProps
    extends Omit<React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>, 'content'> {
    content?: React.ReactNode; // Hecho opcional para retrocompatibilidad
    children?: React.ReactNode; // Para el contenido pasado como hijo
    trigger: React.ReactElement;
    colorScheme?: ColorSchemeVariant;
    styleType?: StandardTooltipStyleType;
    isAccentuated?: boolean;
    isLongText?: boolean;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    sideOffset?: number;
    delayDuration?: number;
    hideArrow?: boolean;
}

//#endregion ![def]

//#region [main] - 🧱 ROOT TOOLTIP COMPONENT 🧱
const renderContent = (content: React.ReactNode) => {
  if (typeof content === 'string') {
    const lines = content.split('\n').map((line, index, arr) => {
      const parts = line.split(/(\*.*?\*)/g).map((part, partIndex) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          return <strong key={partIndex}>{part.slice(1, -1)}</strong>;
        }
        return part;
      });

      return (
        <React.Fragment key={index}>
          {parts}
          {index < arr.length - 1 && <br />}
        </React.Fragment>
      );
    });
    return <div>{lines}</div>;
  }
  return content;
};

const StandardTooltip = ({
    content, // Prop explícita para el contenido
    children, // Contenido pasado como hijo (para retrocompatibilidad)
    trigger,
    colorScheme = "neutral",
    styleType = "solid",
    isAccentuated = true,
    isLongText = false,
    side = "top",
    align = "center",
    sideOffset = 8,
    delayDuration = 300,
    className,
    hideArrow = isAccentuated ? true : false,
    ...props
}: StandardTooltipProps) => {
    //#region [sub_init] - 🪝 HOOKS, STATE, MEMOS 🪝
    const { appColorTokens, mode } = useTheme();

    // Lógica de retrocompatibilidad: usa 'content' si existe, si no, usa 'children'.
    const finalContent = content ?? children;

    const tooltipTokens = React.useMemo(() => {
        if (!appColorTokens || !mode) return null;
        return generateStandardTooltipTokens(appColorTokens, mode, isAccentuated);
    }, [appColorTokens, mode, isAccentuated]);

    const currentStyleTokens: TooltipStyleTokens | null = React.useMemo(() => {
        if (!tooltipTokens) return null;
        return tooltipTokens[colorScheme]?.[styleType] || tooltipTokens.neutral.solid;
    }, [tooltipTokens, colorScheme, styleType]);

    const cssVariables: React.CSSProperties & { [key: `--${string}`]: string | undefined } = React.useMemo(() => {
        if (!currentStyleTokens) return {};

        return {
            "--st-bg": currentStyleTokens.background,
            "--st-text-color": currentStyleTokens.textColor,
            "--st-border-color": currentStyleTokens.borderColor,
            "--st-shadow": currentStyleTokens.shadow,
        };
    }, [currentStyleTokens]);

    const longTextClasses = isLongText ?
        "z-[1000]" : "";

    const longTextContentStyles: React.CSSProperties = isLongText ? {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: "min(90vw, 800px)",
        maxHeight: "min(90vh, 600px)",
        width: "auto",
        minWidth: "350px",
        overflowY: "auto",
        overflowX: "hidden",
        transition: "none",
        animation: "none",
        boxSizing: "border-box",
    } : {};

    const effectiveHideArrow = isLongText ? true : hideArrow;

    //#endregion ![sub_init]

    //#region [render] - 🖼️ JSX STRUCTURE 🖼️
    if (!currentStyleTokens) {
        // Devolvemos solo el trigger si los estilos no estan listos
        return trigger;
    }

    return (
        <TooltipPrimitive.Provider delayDuration={delayDuration}>
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>
                    {trigger}
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        {...(!isLongText && { side, align, sideOffset })}
                        className={cn(
                            "rounded-md border",
                            "px-3 py-1.5 text-sm",
                            !isLongText && "animate-in fade-in-0 zoom-in-95",
                            !isLongText && "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                            !isLongText && "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                            className,
                            longTextClasses
                        )}
                        style={{
                            ...cssVariables,
                            backgroundColor: "var(--st-bg)",
                            color: "var(--st-text-color)",
                            borderColor: "var(--st-border-color)",
                            boxShadow: "var(--st-shadow)",
                            padding: isLongText ? "1.5rem" : undefined,
                            ...longTextContentStyles,
                        }}
                        {...props}
                    >
                        {isLongText ? (
                            <div className="w-full h-full p-0" style={{ overflowY: "auto", overflowX: "hidden" }}>
                                {renderContent(finalContent)}
                            </div>
                        ) : (
                            renderContent(finalContent)
                        )}

                        {!effectiveHideArrow && (
                            <TooltipPrimitive.Arrow
                                className="fill-[var(--st-bg)]"
                            />
                        )}
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
    //#endregion ![render]
};

StandardTooltip.displayName = "StandardTooltip";

export { StandardTooltip };