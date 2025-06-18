import { AppColorTokens } from '../types';
import tinycolor from 'tinycolor2';
import { Mode } from '../ThemeProvider';
import { ColorScheme } from '../constants';

// Tokens específicos para las esferas
export type SphereSizeVariant = 'sm' | 'md' | 'lg';
export type SphereStyleType = 'filled' | 'subtle' | 'outline';

export interface SphereTokens {
    // Tamaños base (serán modificados dinámicamente según la cantidad de esferas)
    size: {
        sm: string;
        md: string;
        lg: string;
    };
    
    // Colores por variante y tipo de estilo
    styles: {
        [key in SphereStyleType]: {
            backgroundColor: string;
            foregroundColor: string;
            borderColor: string;
            gradient?: string;
            hoverBackgroundColor?: string;
            hoverForegroundColor?: string;
            activeBorderColor?: string;
        }
    };
    
    // Token para badge si está presente
    badge: {
        offset: string;
        size: string;
    };

    // Transiciones y animaciones
    transition: string;
    hoverTransform: string;
    activeTransform: string;
}

// Función para generar degradado para esferas
function generateSphereGradient(baseColor: string, isDark: boolean): string {
    const lighter = tinycolor(baseColor).lighten(12).toHexString();
    const base = baseColor;
    const darker = tinycolor(baseColor).darken(15).toHexString();
    
    // Degradado tipo "esfera" radial desde arriba-izquierda
    return `radial-gradient(circle at 30% 30%, ${lighter}, ${base} 50%, ${darker})`;
}

export function generateSphereTokens(appColorTokens: AppColorTokens, mode: Mode): Record<ColorScheme, SphereTokens> {
    const isDark = mode === 'dark';
    const tokens: Record<ColorScheme, SphereTokens> = {} as Record<ColorScheme, SphereTokens>;
    
    // Tamaños base (serán ajustados dinámicamente según la cantidad)
    const baseSize = {
        sm: '2.5rem', // 40px
        md: '3rem',   // 48px
        lg: '3.5rem', // 56px
    };
    
    // Para cada esquema de color (primary, secondary, etc.)
    for (const colorScheme of Object.keys(appColorTokens) as ColorScheme[]) {
        const palette = appColorTokens[colorScheme];
        const neutral = appColorTokens.neutral;
        
        // Tokenización para cada esquema de color
        tokens[colorScheme] = {
            size: { ...baseSize },
            
            styles: {
                filled: {
                    backgroundColor: palette.pure,
                    foregroundColor: palette.on,
                    borderColor: 'transparent',
                    gradient: generateSphereGradient(palette.pure, isDark),
                    hoverBackgroundColor: tinycolor(palette.pure).darken(5).toString(),
                    hoverForegroundColor: palette.on,
                    activeBorderColor: tinycolor(palette.pure).darken(10).toString(),
                },
                subtle: {
                    backgroundColor: isDark 
                        ? tinycolor(palette.pure).setAlpha(0.15).toString()
                        : tinycolor(palette.pure).setAlpha(0.1).toString(),
                    foregroundColor: isDark ? palette.pure : palette.dark,
                    borderColor: 'transparent',
                    gradient: isDark 
                        ? `radial-gradient(circle at 30% 30%, ${tinycolor(palette.pure).setAlpha(0.2)}, ${tinycolor(palette.pure).setAlpha(0.1)})`
                        : `radial-gradient(circle at 30% 30%, ${tinycolor(palette.pure).setAlpha(0.15)}, ${tinycolor(palette.pure).setAlpha(0.05)})`,
                    hoverBackgroundColor: isDark 
                        ? tinycolor(palette.pure).setAlpha(0.25).toString()
                        : tinycolor(palette.pure).setAlpha(0.2).toString(),
                    hoverForegroundColor: isDark ? palette.light : palette.dark,
                    activeBorderColor: tinycolor(palette.pure).setAlpha(0.3).toString(),
                },
                outline: {
                    backgroundColor: 'transparent',
                    foregroundColor: isDark ? palette.light : palette.dark,
                    borderColor: isDark 
                        ? tinycolor(palette.pure).darken(10).toString()
                        : palette.pure,
                    hoverBackgroundColor: isDark 
                        ? tinycolor(palette.pure).setAlpha(0.1).toString()
                        : tinycolor(palette.pure).setAlpha(0.05).toString(),
                    hoverForegroundColor: palette.pure,
                    activeBorderColor: palette.pure,
                }
            },
            
            badge: {
                offset: '0.7rem', // Aumentado para que el badge sea más visible
                size: '1rem',     // Tamaño base del badge
            },
            
            transition: 'all 0.2s ease-in-out',
            hoverTransform: 'translateY(-2px) scale(1.05)',
            activeTransform: 'translateY(0) scale(0.98)'
        };
    }
    
    return tokens;
}
