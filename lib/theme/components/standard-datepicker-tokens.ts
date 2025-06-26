import type { CSSProperties } from 'react';
import type { AppColorTokens, ColorSchemeVariant, Mode } from '@/lib/theme/ColorToken';
import type { Size } from '@/lib/theme/size-tokens';

export type DatePickerSizeVariant = Extract<Size, 'sm' | 'md' | 'lg'>;

export interface StandardDatePickerTokenArgs {
  colorScheme?: ColorSchemeVariant;
  size?: DatePickerSizeVariant;
}

// La receta devuelve un objeto con estilos para el Popover y para el DayPicker.
export interface StandardDatePickerRecipe {
  popover: CSSProperties;
  dayPicker: { [key: string]: CSSProperties };
}

export const generateStandardDatePickerTokens = (
  appColorTokens: AppColorTokens,
  mode: Mode,
  {
    colorScheme = 'primary',
    size = 'md',
  }: StandardDatePickerTokenArgs
): StandardDatePickerRecipe => {
  const colorPalette = appColorTokens[colorScheme];
  const neutralPalette = appColorTokens.neutral;
  const isDark = mode === 'dark';

  // Colores base del tema
  const popoverBg = isDark ? neutralPalette.bg : appColorTokens.white.pure;
  const popoverBorder = neutralPalette.bgShade;
  const popoverText = neutralPalette.text;
  const mutedText = neutralPalette.textShade;

  // Mapeo de tamaños
  const sizeStyles = {
    sm: { fontSize: '0.875rem', daySize: '2rem' },
    md: { fontSize: '0.875rem', daySize: '2.25rem' },
    lg: { fontSize: '1rem', daySize: '2.5rem' },
  };

  const currentSize = sizeStyles[size];

  return {
    popover: {
      backgroundColor: popoverBg,
      borderColor: popoverBorder,
      color: popoverText,
    },
    dayPicker: {
      caption_label: { 
        fontSize: currentSize.fontSize, 
        fontWeight: '500' 
      },
      head_cell: {
        color: mutedText,
        fontSize: '0.8rem',
        fontWeight: '400',
      },
      day: {
        height: currentSize.daySize,
        width: currentSize.daySize,
        fontSize: currentSize.fontSize,
        borderRadius: '0.375rem',
      },
      day_selected: {
        backgroundColor: colorPalette.pure,
        color: colorPalette.contrastText,
        fontWeight: '700',
      },
      day_today: {
        fontWeight: '700',
        color: colorPalette.pure,
        border: `1px solid ${colorPalette.pure}`,
      },
      day_outside: {
        color: mutedText,
        opacity: 0.5,
      },
      day_disabled: {
        color: mutedText,
        opacity: 0.5,
      },
    },
  };
};
