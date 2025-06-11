//. 📍 lib/theme/components/standard-progress-bar-tokens.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import type { AppColorTokens, ProCardVariant, Mode } from "../ColorToken";
import { neutral } from "../colors";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACES 📦
export type StandardProgressBarStyleType = 
  | 'solid' 
  | 'gradient' 
  | 'accent-gradient' 
  | 'thermometer';
  
export type StandardProgressBarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// La función generadora devolverá un objeto de este tipo.
export type StandardProgressBarTokens = {
  [key: `--spb-${string}`]: string;
};
//#endregion ![def]

//#region [main] - 🏭 TOKEN GENERATOR FUNCTION 🏭
export function generateStandardProgressBarTokens(
  appColorTokens: AppColorTokens,
  mode: Mode,
  colorScheme: ProCardVariant,
  styleType: StandardProgressBarStyleType
): StandardProgressBarTokens {
  const isDark = mode === "dark";
  const vars: StandardProgressBarTokens = {};
  
  // Obtener el set de colores principal
  const colorSet = appColorTokens[colorScheme] || appColorTokens.primary;

  // --- 1. Definir el color del Track (fondo) ---
  vars['--spb-track-bg'] = colorSet.bgShade;
  
  // --- 2. Definir los colores de la Barra según el styleType ---
  switch (styleType) {
    case 'solid':
      vars['--spb-bar-bg'] = colorSet.pure;
      break;
      
    case 'gradient':
      // Lógica de gradiente por defecto (ej. primary -> secondary)
      let endGradientColor = appColorTokens.secondary.pure;
      if (colorScheme === 'secondary') endGradientColor = appColorTokens.tertiary.pure;
      if (colorScheme === 'tertiary') endGradientColor = appColorTokens.primary.pure;

      vars['--spb-gradient-start'] = colorSet.pure;
      vars['--spb-gradient-end'] = endGradientColor;
      break;

    case 'accent-gradient':
      vars['--spb-gradient-start'] = colorSet.pure;
      vars['--spb-gradient-end'] = appColorTokens.accent.pure;
      break;

    case 'thermometer':
      vars['--spb-thermometer-start'] = appColorTokens.danger.pure;
      vars['--spb-thermometer-mid'] = appColorTokens.warning.pure;
      vars['--spb-thermometer-end'] = appColorTokens.success.pure;
      break;
  }
  
  // --- 3. Casos especiales ---
  if (colorScheme === 'neutral') {
    vars['--spb-track-bg'] = isDark ? neutral.gray[800] : neutral.gray[200];
    if (styleType === 'solid') {
      vars['--spb-bar-bg'] = isDark ? neutral.gray[400] : neutral.gray[600];
    } else { // Para gradientes en neutral, hacemos un gradiente tonal
      vars['--spb-gradient-start'] = isDark ? neutral.gray[500] : neutral.gray[500];
      vars['--spb-gradient-end'] = isDark ? neutral.gray[300] : neutral.gray[700];
    }
  }

  return vars;
}
//#endregion ![main]