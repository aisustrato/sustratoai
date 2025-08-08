// Ruta: lib/theme/components/nivo-pie-chart-tokens.ts

import type { AppColorTokens } from "../ColorToken";


// Mapeo de estados de lotes a los 'colorScheme' del tema
const BATCH_STATUS_TO_COLOR_SCHEME_MAP: Record<string, keyof AppColorTokens> = {
  // Estados de lotes reales
  'PENDING': 'neutral',
  'TRANSLATED': 'tertiary',
  'REVIEW_PENDING': 'primary',
  'RECONCILIATION_PENDING': 'secondary',
  'VALIDATED': 'warning',
  'RECONCILED': 'success',
  'DISPUTED': 'danger',
  'AGREED': 'accent',
  'UNKNOWN': 'neutral',
  
  // Mapeo adicional para compatibilidad (minúsculas)
  'pending': 'neutral',
  'translated': 'tertiary',
  'review_pending': 'primary',
  'reconciliation_pending': 'secondary',
  'validated': 'warning',
  'reconciled': 'success',
  'disputed': 'danger',
  'agreed': 'accent',
  'unknown': 'neutral',
};

export function generateNivoTheme(appColorTokens: AppColorTokens) {

  // Define el tema base para Nivo (fuentes, tooltips, etc.)
  const theme = {

    fontSize: 12,
    tooltip: {
      container: {
        background: appColorTokens.neutral.bg,
        color: appColorTokens.neutral.text,
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)',
      },
    },
  };

  // Crea un mapa de colores Hex para las porciones del gráfico
  const colorMap: Record<string, string> = {};
  for (const status in BATCH_STATUS_TO_COLOR_SCHEME_MAP) {
    const colorScheme = BATCH_STATUS_TO_COLOR_SCHEME_MAP[status];
    if (appColorTokens[colorScheme]) {
      colorMap[status] = appColorTokens[colorScheme].pure;
    }
  }

  return { theme, colorMap };
}
