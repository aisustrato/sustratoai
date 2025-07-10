// Ruta: lib/theme/components/nivo-pie-chart-tokens.ts

import type { AppColorTokens, Mode } from "../ColorToken";


// Mapeo de nuestros IDs de estado a los 'colorScheme' del tema
const STATUS_TO_COLOR_SCHEME_MAP: Record<string, keyof AppColorTokens> = {
  pendientesRevision: 'neutral',
  pendientesReconciliacion: 'secondary',
  reconciliados: 'warning',
  enDisputa: 'danger',
  // Puedes añadir más estados aquí si es necesario
  acordados: 'success', 
  validados: 'success', 
};

export function generateNivoTheme(appColorTokens: AppColorTokens, mode: Mode) {
  const isDark = mode === 'dark';

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
  for (const status in STATUS_TO_COLOR_SCHEME_MAP) {
    const colorScheme = STATUS_TO_COLOR_SCHEME_MAP[status];
    if (appColorTokens[colorScheme]) {
      colorMap[status] = appColorTokens[colorScheme].pure;
    }
  }

  return { theme, colorMap };
}
