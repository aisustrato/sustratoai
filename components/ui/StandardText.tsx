"use client";

import * as React from "react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import { 
    generateStandardTextTokens,
    type StandardTextSize as ImportedTextSize,
    type StandardTextWeight as ImportedTextWeight,
    type StandardTextAlign as ImportedTextAlign,
    type StandardTextColorShade as ImportedTextColorShade,
    type StandardTextGradient as ImportedTextGradient
} from "@/lib/theme/components/standard-text-tokens";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";


export type StandardTextPreset = "heading" | "subheading" | "title" | "subtitle" | "body" | "caption";

export interface StandardTextStyleProps {
    preset?: StandardTextPreset;
    size?: ImportedTextSize;
    weight?: ImportedTextWeight;
    align?: ImportedTextAlign;
    truncate?: boolean;
    colorScheme?: ColorSchemeVariant;
    colorShade?: ImportedTextColorShade;
    applyGradient?: ImportedTextGradient;
}

interface StandardTextOwnProps extends StandardTextStyleProps {
    asElement?: React.ElementType;
    children?: React.ReactNode; 
    className?: string;
}

type PolymorphicComponentProps<
    C extends React.ElementType,
    Props = {}
> = React.PropsWithChildren<Props & { asElement?: C }> &
    Omit<React.ComponentPropsWithoutRef<C>, keyof (Props & { asElement?: C })>;

export type StandardTextProps<C extends React.ElementType> = PolymorphicComponentProps<C, StandardTextOwnProps>;

export type {
    ImportedTextSize as StandardTextSize,
    ImportedTextWeight as StandardTextWeight,
    ImportedTextAlign as StandardTextAlign,
    ImportedTextColorShade as StandardTextColorShade,
    ImportedTextGradient as StandardTextGradient
};

const StandardTextComponent = React.forwardRef(
    function StandardText<C extends React.ElementType = "p">(
        {
            preset, 
            asElement, 
            size, 
            weight, 
            align, 
            truncate = false, 
            colorScheme, 
            colorShade = "text",
            applyGradient, 
            children, 
            className, 
            ...props 
        }: StandardTextProps<C>,
        ref: React.Ref<any>
    ) {
    
        const { appColorTokens, mode } = useTheme();

        const { baseAsElement, baseSize, baseWeight, baseColorScheme, baseApplyGradient, baseFontType } = useMemo(() => {
            switch (preset) {
                case "heading":	return { baseAsElement: "h1" as const, baseSize: "3xl" as const, baseWeight: "bold" as const, baseApplyGradient: true, baseFontType: "heading" as const };
                case "subheading": return { baseAsElement: "h2" as const, baseSize: "2xl" as const, baseWeight: "semibold" as const, baseColorScheme: "secondary" as const, baseFontType: "heading" as const };
                case "title":	return { baseAsElement: "h3" as const, baseSize: "xl" as const, baseWeight: "semibold" as const, baseFontType: "heading" as const };
                case "subtitle":	return { baseAsElement: "h4" as const, baseSize: "lg" as const, baseWeight: "medium" as const, baseColorScheme: "neutral" as const, baseFontType: "heading" as const };
                case "body":	return { baseAsElement: "p" as const, baseSize: "base" as const, baseWeight: "normal" as const, baseFontType: "body" as const };
                case "caption":	return { baseAsElement: "span" as const, baseSize: "xs" as const, baseWeight: "normal" as const, baseColorScheme: "neutral" as const, baseFontType: "body" as const };
                default:	return { baseAsElement: "span" as const, baseSize: "base" as const, baseWeight: "normal" as const, baseFontType: "body" as const };
            }
        }, [preset]);

        const FinalComponent: React.ElementType = asElement || baseAsElement;
        
        const finalSize = size || baseSize;
        const finalWeight = weight || baseWeight;
        const finalColorScheme = colorScheme || baseColorScheme;
        const finalApplyGradient = applyGradient !== undefined ? applyGradient : baseApplyGradient;
        const finalFontType = (typeof FinalComponent === 'string' && ["h1", "h2", "h3", "h4"].includes(FinalComponent)) ? "heading" : baseFontType;

        const textStyle = useMemo<React.CSSProperties>(() => {
            if (!appColorTokens || !mode || finalApplyGradient) return {};
            if (finalColorScheme) {
                const allTokens = generateStandardTextTokens(appColorTokens, mode);
                const colorSet = allTokens.colors[finalColorScheme];
                const finalColor = colorSet ? colorSet[colorShade] : 'inherit';
                return { color: finalColor };
            }
            return {};
        }, [finalColorScheme, colorShade, finalApplyGradient, appColorTokens, mode]);
        
        const gradientStyle = useMemo<React.CSSProperties>(() => {
            if (!finalApplyGradient || !appColorTokens || !mode) return {};
            const allTokens = generateStandardTextTokens(appColorTokens, mode);
            const gradientScheme = finalApplyGradient === true ? 'primary' : finalApplyGradient;
            const gradientString = allTokens.gradients[gradientScheme];
            if (!gradientString) return {};
            return {	
                backgroundImage: gradientString,	
                backgroundSize: "100%",	
                WebkitBackgroundClip: "text",	
                backgroundClip: "text",	
                color: "transparent",
                display: "inline-block",
            };
        }, [finalApplyGradient, appColorTokens, mode]);

        const lineClampStyle = useMemo<React.CSSProperties>(() => {
            if (!className) return {};
            const match = className.match(/line-clamp-(\d+)/);
            if (match && match[1]) {
                const clampValue = parseInt(match[1], 10);
                return {
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: clampValue,
                };
            }
            return {};
        }, [className]);

        const typographyClasses = cn(
            { 'font-heading': finalFontType === 'heading', 'font-body': finalFontType === 'body' },
            { "text-[10px]": finalSize === "4xs", "text-3xs": finalSize === "3xs", "text-2xs": finalSize === "2xs", "text-xs": finalSize === "xs", "text-sm": finalSize === "sm", "text-base": finalSize === "base", "text-lg": finalSize === "lg", "text-xl": finalSize === "xl", "text-2xl": finalSize === "2xl", "text-3xl": finalSize === "3xl", "text-4xl": finalSize === "4xl", "text-5xl": finalSize === "5xl" },
            { "font-normal": finalWeight === "normal", "font-medium": finalWeight === "medium", "font-semibold": finalWeight === "semibold", "font-bold": finalWeight === "bold" },
            { "text-left": align === "left", "text-center": align === "center", "text-right": align === "right", "text-justify": align === "justify" },
            finalFontType === "heading" && "tracking-tight",
            truncate && "truncate",
            className
        );

        return (
            <FinalComponent
                ref={ref}
                className={typographyClasses} 
                style={{ ...textStyle, ...lineClampStyle, ...props.style }} 
                {...props}
            >
                {finalApplyGradient ? (<span style={gradientStyle}>{children}</span>) : (children)}
            </FinalComponent>
        );
    }
);

// --- ✅ LA MODIFICACIÓN CLAVE ---
// Le asignamos su "cédula de identidad" para que otros componentes puedan reconocerlo.
StandardTextComponent.displayName = "StandardText";

export const StandardText = StandardTextComponent;