// Ruta: components/charts/StandardPieChart.tsx

'use client';

import { useTheme } from '@/app/theme-provider';
import { StandardText } from '@/components/ui/StandardText';
import { generateNivoTheme } from '@/lib/theme/components/nivo-pie-chart-tokens';
import { ResponsivePie } from '@nivo/pie';
import { useMemo, useEffect, useState } from 'react';

export interface PieChartData {
  id: string;      // ej: 'pendientesRevision'
  value: number;
  label: string;   // ej: 'Pend. Revisión'
}

export interface StandardPieChartProps {
  data: PieChartData[];
  onColorMapGenerated?: (colorMap: Record<string, string>) => void;
}

const CustomArcLabel = ({ datum, label, style }: any) => {
  return (
    <g transform={style.transform} style={{ pointerEvents: 'none' }}>
      <StandardText
        asElement="text"
        weight="bold"
        align="center"
        style={{ fill: datum.color }}
        dominantBaseline="central"
      >
        {label}
      </StandardText>
    </g>
  );
};

export function StandardPieChart({ data, onColorMapGenerated }: StandardPieChartProps) {
  const { appColorTokens, mode } = useTheme();

  const { theme, colorMap } = useMemo(() => {
    if (!appColorTokens) return { theme: {}, colorMap: {} };
    return generateNivoTheme(appColorTokens, mode);
  }, [appColorTokens, mode]);

  useEffect(() => {
    if (onColorMapGenerated && colorMap) {
      onColorMapGenerated(colorMap as Record<string, string>);
    }
  }, [colorMap, onColorMapGenerated]);

  const getSliceColor = (slice: { id: string | number }) => (colorMap as Record<string, string>)[slice.id] || '#ccc';

  if (!appColorTokens) {
    return <div style={{ height: '300px' }} className="flex items-center justify-center">Cargando gráfico...</div>;
  }

  return (
    <div style={{ height: '300px' }}>
      <ResponsivePie
        data={data}
        theme={theme}
        arcLabelsComponent={CustomArcLabel}
        colors={getSliceColor}
        margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
        innerRadius={0.5}
        padAngle={1}
        cornerRadius={3}
        activeOuterRadiusOffset={8}
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor={appColorTokens.neutral.text}
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
      />
    </div>
  );
}
