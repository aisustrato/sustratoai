//. 📍 lib/theme/components/standard-slider-tokens.ts (v1.3 - Añadido Halo Color)

//#region [head] - 🏷️ IMPORTS 🏷️
import type { AppColorTokens, ProCardVariant, Mode } from "../ColorToken";
import { neutral } from "../colors";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACES 📦
export type StandardSliderStyleType = 'solid' | 'gradient';
export type StandardSliderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type StandardSliderTokens = {
  [key: `--sl-${string}`]: string;
};
//#endregion ![def]

//#region [main] - 🏭 TOKEN GENERATOR FUNCTION 🏭
export function generateStandardSliderTokens(
  appColorTokens: AppColorTokens,
  mode: Mode,
  colorScheme: ProCardVariant,
  styleType: StandardSliderStyleType
): StandardSliderTokens {
  const isDark = mode === "dark";
  const vars: StandardSliderTokens = {};
  
  const colorSet = appColorTokens[colorScheme] || appColorTokens.primary;

  vars['--sl-track-bg'] = colorSet.bgShade;
  
  if (styleType === 'solid') {
    vars['--sl-range-bg'] = colorSet.pure;
  } else { 
    let endGradientColor = appColorTokens.secondary.pure;
    if (colorScheme === 'secondary') endGradientColor = appColorTokens.tertiary.pure;
    if (colorScheme === 'tertiary') endGradientColor = appColorTokens.primary.pure;
    
    vars['--sl-range-gradient-start'] = colorSet.pure;
    vars['--sl-range-gradient-end'] = endGradientColor;
  }
  
  vars['--sl-thumb-bg'] = isDark ? neutral.gray[300] : neutral.white;
  vars['--sl-thumb-outline-color'] = colorSet.pure;
  vars['--sl-thumb-shadow'] = isDark ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.2)';
  
  // ✅ NUEVO: Variable para el color del halo de foco, usa el 'bgShade' para un efecto diluido.
  vars['--sl-thumb-halo-color'] = colorSet.bgShade; 
  
  return vars;
}
//#endregion ![main]