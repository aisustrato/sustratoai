// 📍 lib/theme/components/nivo-bar-chart-tokens.ts
// Tokens para gráficos de barras usando Nivo

import { AllSemanticColors, ColorShade } from '@/lib/theme/colors';

export interface NivoBarChartTokens {
    backgroundColor: string;
    textColor: string;
    gridColor: string;
    axisColor: string;
    barColors: string[];
}

export function generateNivoBarChartTokens(
    palette: AllSemanticColors,
    colorScheme: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral' = 'primary'
): NivoBarChartTokens {
    // Para primary/secondary/tertiary, necesitamos obtener del tema activo
    // Por ahora usaremos los colores semánticos que están disponibles directamente
    const getColorScheme = (scheme: string) => {
        switch (scheme) {
            case 'primary': return palette.accent; // Usar accent como sustituto
            case 'secondary': return palette.accent;
            case 'tertiary': return palette.neutral;
            case 'accent': return palette.accent;
            case 'success': return palette.success;
            case 'warning': return palette.warning;
            case 'danger': return palette.danger;
            case 'neutral': return palette.neutral;
            default: return palette.neutral;
        }
    };
    
    const scheme = getColorScheme(colorScheme);
    
    return {
        backgroundColor: scheme.bg,
        textColor: scheme.text,
        gridColor: scheme.bgShade,
        axisColor: scheme.textShade,
        barColors: [
            scheme.pure,
            scheme.pureShade,
            scheme.text,
            scheme.bgShade,
            scheme.textShade,
        ]
    };
}

/**
 * Genera el tema completo para Nivo Bar Chart
 * Incluye tema visual, mapa de colores y funciones auxiliares
 */
interface AppColorTokens {
    neutral: ColorShade;
    accent: ColorShade;
    success: ColorShade;
    warning: ColorShade;
    danger: ColorShade;
}

export function generateNivoBarTheme(appColorTokens: AppColorTokens) {
    const theme = {
        background: 'transparent',
        textColor: appColorTokens.neutral.text,
        grid: {
            line: {
                stroke: appColorTokens.neutral.bgShade,
                strokeWidth: 1,
            },
        },
        axis: {
            ticks: {
                line: {
                    stroke: appColorTokens.neutral.textShade,
                    strokeWidth: 1,
                },
                text: {
                    fill: appColorTokens.neutral.text,
                    fontSize: 12,
                },
            },
            legend: {
                text: {
                    fill: appColorTokens.neutral.text,
                    fontSize: 14,
                    fontWeight: 500,
                },
            },
        },
    };

    // Función para generar mapa de colores inteligente
    const generateColorMap = (keys: string[]) => {
        const colorSchemes: (keyof AppColorTokens)[] = ['accent', 'success', 'warning', 'danger', 'neutral'];
        const colorMap: Record<string, string> = {};
        
        keys.forEach((key, index) => {
            const schemeIndex = index % colorSchemes.length;
            const colorScheme = colorSchemes[schemeIndex];
            colorMap[key] = appColorTokens[colorScheme].pure;
        });
        
        return colorMap;
    };

    // Función para obtener colores de vista detallada
    const getDetailViewColor = (index: number) => {
        const colorSchemes: (keyof AppColorTokens)[] = ['accent', 'success', 'warning', 'danger', 'neutral'];
        const schemeIndex = index % colorSchemes.length;
        const colorScheme = colorSchemes[schemeIndex];
        return appColorTokens[colorScheme].pure;
    };

    return {
        theme,
        generateColorMap,
        getDetailViewColor,
    };
}
