//. 📍 lib/theme/components/standard-table-tokens.ts (v1.4)

import type { AppColorTokens, ColorSchemeVariant, Mode } from "../ColorToken";
import tinycolor from "tinycolor2";

// --- Definiciones de Tipo ---

export type CellVariant = 'highlight' | 'muted';

interface TablePartTokens {
    backgroundColor: string;
    foregroundColor: string;
    borderColor: string;
    hoverBackgroundColor?: string;
}

export type TableTokens = {
    container: Pick<TablePartTokens, 'backgroundColor' | 'borderColor'>;
    header: TablePartTokens & { sortIconColor: string; sortIconHoverColor: string; };
    row: {
        default: TablePartTokens;
        status: Record<Exclude<ColorSchemeVariant, 'neutral' | 'white' | 'default' | 'info'>, TablePartTokens>;
    };
    cell: Pick<TablePartTokens, 'foregroundColor' | 'borderColor'> & {
        variants: Record<CellVariant, TablePartTokens>;
    };
    expander: { 
        circleBackground: string;
        circleBorderColor: string;
        iconColor: string;
        expandedCircleBackground: string;
        expandedIconColor: string;
    };
    // ✅ RESPONSABILIDAD MOVIDA AQUÍ
    subRowBackgroundColor: string; 
};

/**
 * Genera un degradado para encabezados de tabla, exactamente igual al de los botones
 */
function generateHeaderGradient(appColorTokens: AppColorTokens): string {
    const primary = appColorTokens.primary;
    
    // Replicamos EXACTAMENTE el mismo degradado que usan los botones con el modificador 'gradient'
    const start = tinycolor(primary.pure).lighten(10).toHexString();
    const end = tinycolor(primary.pure).darken(10).toHexString();
    
    // Usamos la misma dirección diagonal que los botones: 'to bottom right'
    return `linear-gradient(to bottom right, ${start}, ${end})`;
}

export function generateTableTokens(appColorTokens: AppColorTokens, mode: Mode): TableTokens {
    const isDark = mode === "dark";
    const neutral = appColorTokens.neutral;

    return {
        container: { backgroundColor: isDark ? neutral.bgShade : appColorTokens.white.bg, borderColor: isDark ? neutral.pureShade : neutral.bgShade },
        header: { 
            backgroundColor: generateHeaderGradient(appColorTokens), 
            foregroundColor: appColorTokens.primary.contrastText, 
            borderColor: isDark ? appColorTokens.primary.pureShade : appColorTokens.primary.pureShade, 
            sortIconColor: appColorTokens.primary.contrastText, 
            sortIconHoverColor: appColorTokens.primary.contrastText 
        },
        row: {
            default: { backgroundColor: isDark ? neutral.bgShade : appColorTokens.white.bg, foregroundColor: neutral.text, borderColor: isDark ? neutral.bg : neutral.bgShade, hoverBackgroundColor: isDark ? tinycolor(neutral.bgShade).lighten(5).toHexString() : neutral.bg, },
            status: {
                primary: { backgroundColor: appColorTokens.primary.bg, hoverBackgroundColor: appColorTokens.primary.bgShade, foregroundColor: appColorTokens.primary.text, borderColor: appColorTokens.primary.bgShade },
                secondary: { backgroundColor: appColorTokens.secondary.bg, hoverBackgroundColor: appColorTokens.secondary.bgShade, foregroundColor: appColorTokens.secondary.text, borderColor: appColorTokens.secondary.bgShade },
                tertiary: { backgroundColor: appColorTokens.tertiary.bg, hoverBackgroundColor: appColorTokens.tertiary.bgShade, foregroundColor: appColorTokens.tertiary.text, borderColor: appColorTokens.tertiary.bgShade },
                accent: { backgroundColor: appColorTokens.accent.bg, hoverBackgroundColor: appColorTokens.accent.bgShade, foregroundColor: appColorTokens.accent.text, borderColor: appColorTokens.accent.bgShade },
                success: { backgroundColor: appColorTokens.success.bg, hoverBackgroundColor: appColorTokens.success.bgShade, foregroundColor: appColorTokens.success.text, borderColor: appColorTokens.success.bgShade },
                warning: { backgroundColor: appColorTokens.warning.bg, hoverBackgroundColor: appColorTokens.warning.bgShade, foregroundColor: appColorTokens.warning.text, borderColor: appColorTokens.warning.bgShade },
                danger: { backgroundColor: appColorTokens.danger.bg, hoverBackgroundColor: appColorTokens.danger.bgShade, foregroundColor: appColorTokens.danger.text, borderColor: appColorTokens.danger.bgShade },
            },
        },
        cell: {
            foregroundColor: neutral.text,
            borderColor: isDark ? neutral.bg : neutral.bgShade,
            variants: {
                highlight: {
                    backgroundColor: appColorTokens.primary.bg,
                    foregroundColor: appColorTokens.primary.text,
                    borderColor: appColorTokens.primary.bgShade,
                    hoverBackgroundColor: appColorTokens.primary.bgShade,
                },
                muted: {
                    backgroundColor: 'transparent',
                    foregroundColor: neutral.textShade,
                    borderColor: 'transparent',
                    hoverBackgroundColor: neutral.bg,
                }
            }
        },
        expander: { circleBackground: "transparent", circleBorderColor: neutral.bgShade, iconColor: neutral.text, expandedCircleBackground: appColorTokens.primary.pure, expandedIconColor: appColorTokens.primary.contrastText, },
        // ✅ CÁLCULO HECHO EN SU LUGAR CORRECTO
        subRowBackgroundColor: isDark ? tinycolor(neutral.bgShade).lighten(2).toHexString() : tinycolor(neutral.bg).darken(2).toHexString(),
    } as TableTokens;
}