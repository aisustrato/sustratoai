//. 📍 lib/theme/components/standard-button-tokens.ts (v3.1 - Lógica Dimensional Corregida)

//#region [head] - 🏷️ IMPORTS 🏷️
import type { AppColorTokens, ColorSchemeVariant, ColorShade, Mode } from "../ColorToken";
import type { StandardIconColorShade, StandardIconSize } from "./standard-icon-tokens";
import type { StandardTextSize } from "./standard-text-tokens";
import tinycolor from "tinycolor2";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACES 📦
export type StandardButtonStyleType = "solid" | "outline" | "ghost" | "subtle" | "link";
export type StandardButtonModifier = "gradient" | "elevated";
// ✅ CORRECCIÓN ARQUITECTÓNICA: Se elimina 'icon' como un tamaño. 'iconOnly' es un modificador de layout, no un tamaño.
export type StandardButtonSize = Extract<StandardTextSize, 'xs' | 'sm' | 'md' | 'lg' | 'xl'>;
export type StandardButtonRounded = 'none' | 'sm' | 'md' | 'lg' | 'full';

export interface StandardButtonRecipe {
	height: string; padding: string; fontSize: string; gap: string; width?: string;
	background: string; color: string; border: string;
	boxShadow: string; transform: string; opacity: number;
	cursor: string; iconColorShade: StandardIconColorShade;
	iconSize: StandardIconSize; textDecoration?: string;
    rippleColor: string;
}

export interface StandardButtonTokenOptions {
	styleType: StandardButtonStyleType; colorScheme: ColorSchemeVariant;
	size: StandardButtonSize; rounded: StandardButtonRounded;
	modifiers: StandardButtonModifier[]; isHovered: boolean;
	isPressed: boolean; isDisabled: boolean; iconOnly: boolean;
}
//#endregion ![def]

//#region [main] - 🏭 TOKEN GENERATOR FUNCTION 🏭
export function generateStandardButtonTokens(
	appTokens: AppColorTokens, mode: Mode, options: StandardButtonTokenOptions
): StandardButtonRecipe {
	const { styleType, colorScheme, size, modifiers, isHovered, isPressed, isDisabled, iconOnly } = options;
	const isDark = mode === 'dark';
	const palette: ColorShade = appTokens[colorScheme] || appTokens.neutral;

    // ✅ La lógica ahora es más simple y correcta. Ya no hay un 'resolvedSize'.
    const heightMap: Record<StandardButtonSize, string> = { xs: "1.75rem", sm: "2rem", md: "2.25rem", lg: "2.75rem", xl: "3rem" };
    const paddingMap: Record<StandardButtonSize, string> = { xs: "0.5rem", sm: "0.75rem", md: "1rem", lg: "1.25rem", xl: "1.5rem" };
    const fontMap: Record<StandardButtonSize, string> = { xs: "0.75rem", sm: "0.875rem", md: "0.875rem", lg: "1rem", xl: "1rem" };
    const gapMap: Record<StandardButtonSize, string> = { xs: "0.25rem", sm: "0.375rem", md: "0.5rem", lg: "0.5rem", xl: "0.75rem" };
    const iconSizeMap: Record<StandardButtonSize, StandardIconSize> = { xs: 'xs', sm: 'sm', md: 'md', lg: 'lg', xl: 'lg' };
    
	const recipe: StandardButtonRecipe = {
        height: heightMap[size],
        padding: `0 ${paddingMap[size]}`,
        fontSize: fontMap[size],
        gap: iconOnly ? '0' : gapMap[size],
		background: 'transparent', color: palette.pure, border: '1px solid transparent',
		boxShadow: 'none', transform: 'translateY(0)', opacity: 1, cursor: 'pointer',
		iconColorShade: 'pure', iconSize: iconSizeMap[size], textDecoration: 'none',
        rippleColor: tinycolor(palette.pure).setAlpha(0.3).toRgbString()
	};
    
    // ✅ La lógica de 'iconOnly' ahora simplemente ajusta el padding y el ancho.
    if(iconOnly) {
        recipe.padding = '0';
        recipe.width = recipe.height;
    }

	// --- Lógica de Estilos de Color y Estado (sin cambios sustanciales respecto a la v3.0 original, solo adaptaciones menores si fueran necesarias) ---
	switch (styleType) {
		case 'solid':
			recipe.background = palette.pure; recipe.color = palette.contrastText;
			recipe.border = `1px solid ${palette.pure}`; recipe.iconColorShade = 'contrastText'; break;
		case 'outline':
			recipe.background = 'transparent'; recipe.color = palette.pure;
			recipe.border = `1px solid ${palette.pure}`; break;
		case 'ghost':
			recipe.background = 'transparent'; recipe.color = palette.pure;
			// Asegurar contraste en warning: texto amarillo puro no contrasta sobre fondos claros/transparente
			if (colorScheme === 'warning') { recipe.color = palette.textShade; recipe.iconColorShade = 'textShade'; }
			break;
		case 'subtle':
			recipe.background = palette.bg; 
			// En warning, privilegiar texto más oscuro (textShade) sobre bg claro para accesibilidad
			recipe.color = colorScheme === 'warning' ? palette.textShade : palette.pure;
			if (colorScheme === 'warning') { recipe.iconColorShade = 'textShade'; }
			recipe.border = `1px solid ${palette.bg}`; break;
		case 'link':
			recipe.background = 'transparent'; recipe.color = palette.pure;
			recipe.textDecoration = 'none'; break;
	}
    if (modifiers.includes('gradient') && styleType === 'solid') {
        const start = tinycolor(palette.pure).lighten(10).toHexString();
        const end = tinycolor(palette.pure).darken(10).toHexString();
		recipe.background = `linear-gradient(to bottom right, ${start}, ${end})`;
	}
    if (modifiers.includes('elevated')) {
        recipe.boxShadow = isDark ? '0 4px 15px -3px rgba(0,0,0, 0.4)' : '0 4px 6px -1px rgba(0,0,0, 0.1), 0 2px 4px -2px rgba(0,0,0, 0.1)';
    }
    if (isHovered && !isPressed && !isDisabled) {
        recipe.transform = 'translateY(-1px)';
        if (styleType === 'link') { recipe.textDecoration = 'underline'; }
        else {
            switch (styleType) {
                case 'solid':
                    if (modifiers.includes('gradient')) {
                        const start = tinycolor(palette.pure).darken(10).toHexString();
                        const end = tinycolor(palette.pure).lighten(10).toHexString();
                        recipe.background = `linear-gradient(to bottom right, ${start}, ${end})`;
                    } else { recipe.background = tinycolor(palette.pure).darken(8).toHexString(); }
                    recipe.border = `1px solid ${tinycolor(palette.pure).darken(8).toHexString()}`; break;
                case 'outline': case 'ghost': case 'subtle':
                    recipe.background = palette.bgShade; break;
            }
        }
        if (modifiers.includes('elevated')) {
            recipe.transform = 'translateY(-3px)';
            recipe.boxShadow = isDark ? '0 10px 25px -3px rgba(0,0,0, 0.3)' : '0 10px 15px -3px rgba(0,0,0, 0.1), 0 4px 6px -4px rgba(0,0,0, 0.1)';
        }
    }
    if (isPressed && !isDisabled) {
        recipe.transform = 'translateY(0.5px)';
        recipe.boxShadow = isDark ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.06)';
        if (styleType === 'solid') {
            if (modifiers.includes('gradient')) {
                const start = tinycolor(palette.pure).lighten(10).darken(12).toHexString();
                const end = tinycolor(palette.pure).darken(10).darken(12).toHexString();
                recipe.background = `linear-gradient(to bottom right, ${start}, ${end})`;
            } else { recipe.background = tinycolor(palette.pure).darken(12).toHexString(); }
        }
    }
    if (isDisabled) {
        recipe.opacity = 0.6; recipe.cursor = 'not-allowed';
        recipe.boxShadow = 'none'; recipe.transform = 'none';
        recipe.iconColorShade = 'text'; recipe.textDecoration = 'none';
        recipe.rippleColor = 'transparent';
        switch (styleType) {
            case 'solid':
                recipe.background = isDark ? appTokens.neutral.bgShade : appTokens.neutral.bg;
                recipe.color = tinycolor(appTokens.neutral.text).setAlpha(0.6).toRgbString();
                recipe.border = `1px solid ${isDark ? appTokens.neutral.bgShade : appTokens.neutral.bg}`; break;
            case 'outline': case 'ghost': case 'subtle': case 'link':
                recipe.background = 'transparent';
                recipe.color = tinycolor(appTokens.neutral.text).setAlpha(0.6).toRgbString();
                recipe.border = styleType === 'outline' ? `1px solid ${tinycolor(appTokens.neutral.text).setAlpha(0.2).toRgbString()}` : '1px solid transparent'; break;
        }
    }
    if (styleType === 'solid' && !isDisabled) {
        recipe.rippleColor = palette.bgShade;
    } else if (!isDisabled) {
        recipe.rippleColor = tinycolor(palette.pure).setAlpha(0.3).toRgbString();
    }

	return recipe;
}
//#endregion ![main]