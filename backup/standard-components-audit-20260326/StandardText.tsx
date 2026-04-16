// 📍 components/ui/StandardText.tsx (v4.4 - Patrón Flex + Tokens Provider + i18n)
// 🎯 PROPÓSITO: Texto tipográfico con tokens precalculados + soporte i18n
// 🌍 FILOSOFÍA: Interfaces que hablan tu idioma - humanismo global
// 🔧 ARQUITECTURA: Consume tokens desde DesignTokensProvider (sin recálculos)

"use client";

import * as React from "react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import { useTranslations } from "next-intl";
import type { TextSize, TextWeight, TextAlign, TextColorShade } from "@/app/providers/DesignTokensProvider";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

export type StandardTextGradient = ColorSchemeVariant | boolean;


export type StandardTextPreset = "heading" | "subheading" | "title" | "subtitle" | "body" | "caption";

export interface StandardTextStyleProps {
    preset?: StandardTextPreset;
    size?: TextSize;
    weight?: TextWeight;
    align?: TextAlign;
    truncate?: boolean;
    colorScheme?: ColorSchemeVariant;
    colorShade?: TextColorShade;
    applyGradient?: StandardTextGradient;
}

// 🌍 Props de internacionalización
export interface StandardTextI18nProps {
    /** 
     * Key de traducción (ej. "common.save", "errors.required")
     * Busca en messages/{locale}.json siguiendo la notación de puntos
     */
    i18nKey?: string;
    /** 
     * Namespace para agrupar traducciones (ej. "common", "auth", "errors")
     * Si i18nKey incluye puntos, el primer segmento es el namespace
     */
    i18nNamespace?: string;
    /** 
     * Valores para interpolación en la traducción
     * Ej: { count: 5 } → "Quedan {count} caracteres" → "Quedan 5 caracteres"
     */
    i18nValues?: Record<string, string | number>;
}

interface StandardTextOwnProps extends StandardTextStyleProps, StandardTextI18nProps {
    asElement?: React.ElementType;
    children?: React.ReactNode; 
    className?: string;
}

type PolymorphicComponentProps<
    C extends React.ElementType,
    Props = object  // Cambiado de {} a object según la regla @typescript-eslint/no-empty-object-type
> = React.PropsWithChildren<Props & { asElement?: C }> &
    Omit<React.ComponentPropsWithoutRef<C>, keyof (Props & { asElement?: C })>;

export type StandardTextProps<C extends React.ElementType> = PolymorphicComponentProps<C, StandardTextOwnProps>;

export type {
    TextSize as StandardTextSize,
    TextWeight as StandardTextWeight,
    TextAlign as StandardTextAlign,
    TextColorShade as StandardTextColorShade,
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
            // 🌍 i18n props
            i18nKey,
            i18nNamespace,
            i18nValues,
            children, 
            className, 
            ...props 
        }: StandardTextProps<C>,
        ref: React.Ref<HTMLElement>
    ) {
    
        // 💎 CORE: Tokens precalculados - NO recalcula en cada render
        const { tokens } = useDesignTokens();

        // 🌍 Hook de traducción - determina namespace desde i18nKey o prop explícita
        const namespace = useMemo(() => {
            if (i18nNamespace) return i18nNamespace;
            if (i18nKey?.includes('.')) return i18nKey.split('.')[0];
            return undefined;
        }, [i18nKey, i18nNamespace]);
        
        // Usar hook de traducción solo si hay namespace válido
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const t = namespace ? useTranslations(namespace) : null;

        // 🌍 Resolver contenido: children > i18nKey > fallback
        const resolvedContent = useMemo(() => {
            // Prioridad 1: children siempre gana (escape hatch)
            if (children !== undefined && children !== null) return children;
            
            // Prioridad 2: traducción por i18nKey
            if (i18nKey && t) {
                // Extraer la key sin namespace (ej: "common.save" → "save")
                const keyWithoutNamespace = i18nKey.includes('.') 
                    ? i18nKey.split('.').slice(1).join('.') 
                    : i18nKey;
                try {
                    return t(keyWithoutNamespace, i18nValues as Record<string, string>);
                } catch {
                    // Fallback: mostrar la key si no existe traducción
                    console.warn(`[StandardText] Translation not found: ${i18nKey}`);
                    return `[${i18nKey}]`;
                }
            }
            
            // Fallback: string vacío
            return '';
        }, [children, i18nKey, i18nValues, t]);

        const { baseAsElement, baseSize, baseWeight, baseColorScheme, baseApplyGradient, baseFontType } = useMemo(() => {
            switch (preset) {
                case "heading":	return { baseAsElement: "h1" as const, baseSize: "3xl" as const, baseWeight: "bold" as const, baseApplyGradient: true, baseFontType: "heading" as const };
                case "subheading": return { baseAsElement: "h2" as const, baseSize: "2xl" as const, baseWeight: "semibold" as const, baseColorScheme: "secondary" as const, baseFontType: "heading" as const };
                case "title":	return { baseAsElement: "h3" as const, baseSize: "xl" as const, baseWeight: "semibold" as const, baseFontType: "heading" as const };
                case "subtitle":	return { baseAsElement: "h4" as const, baseSize: "lg" as const, baseWeight: "medium" as const, baseColorScheme: "neutral" as const, baseFontType: "heading" as const };
                case "body":	return { baseAsElement: "p" as const, baseSize: "base" as const, baseWeight: "normal" as const, baseFontType: "body" as const };
                case "caption":	return { baseAsElement: "span" as const, baseSize: "sm" as const, baseWeight: "normal" as const, baseColorScheme: "neutral" as const, baseFontType: "body" as const };
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
            if (!tokens || finalApplyGradient) return {};
            if (finalColorScheme) {
                const colorSet = tokens.text.colors[finalColorScheme];
                const finalColor = colorSet ? colorSet[colorShade] : 'inherit';
                return { color: finalColor };
            }
            return {};
        }, [finalColorScheme, colorShade, finalApplyGradient, tokens]);
        
        const gradientStyle = useMemo<React.CSSProperties>(() => {
            if (!finalApplyGradient || !tokens) return {};
            const gradientScheme = finalApplyGradient === true ? 'primary' : finalApplyGradient;
            const gradientString = tokens.text.gradients[gradientScheme];
            if (!gradientString) return {};
            return {	
                backgroundImage: gradientString,	
                backgroundSize: "100%",	
                WebkitBackgroundClip: "text",	
                backgroundClip: "text",	
                color: "transparent",
                display: "inline-block",
            };
        }, [finalApplyGradient, tokens]);

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
                {finalApplyGradient ? (<span style={gradientStyle}>{resolvedContent}</span>) : (resolvedContent)}
            </FinalComponent>
        );
    }
);

// --- ✅ LA MODIFICACIÓN CLAVE ---
// Le asignamos su "cédula de identidad" para que otros componentes puedan reconocerlo.
StandardTextComponent.displayName = "StandardText";

export const StandardText = StandardTextComponent;