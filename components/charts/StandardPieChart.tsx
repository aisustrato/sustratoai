// Ruta: components/charts/StandardPieChart.tsx

'use client';

import { useTheme } from '@/app/theme-provider';
import { StandardText } from '@/components/ui/StandardText';
import { generateNivoTheme } from '@/lib/theme/components/nivo-pie-chart-tokens';
import { ResponsivePie } from '@nivo/pie';
import { useMemo, useEffect } from 'react';

export interface PieChartData {
  id: string;      // ej: 'pendientesRevision'
  value: number;
  label: string;   // ej: 'Pend. Revisión'
  emoticon?: string; // ej: '🔍'
}

export interface StandardPieChartProps {
  data: PieChartData[];
  onColorMapGenerated?: (colorMap: Record<string, string>) => void;
  totalValue?: number;
}

import type { ComputedDatum } from '@nivo/pie';

interface CenteredMetricProps {
  dataWithArc: readonly ComputedDatum<PieChartData>[];
  centerX: number;
  centerY: number;
  totalValue?: number;
  radius?: number;
  innerRadius?: number;
  arcGenerator?: (params: {
    startAngle: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
    cornerRadius?: number;
    padAngle?: number;
  }) => string | null;
}

const CenteredMetric = ({ dataWithArc, centerX, centerY, totalValue }: CenteredMetricProps) => {
  const total = totalValue ?? dataWithArc.reduce((acc, datum) => acc + (datum.value || 0), 0);
  return (
    <StandardText
      asElement="text"
      x={centerX}
      y={centerY}
      textAnchor="middle"
      dominantBaseline="central"
      className="text-2xl font-bold"
    >
      {total}
    </StandardText>
  );
};

export function StandardPieChart({ data, onColorMapGenerated, totalValue }: StandardPieChartProps) {
  const totalForPercentage = totalValue ?? data.reduce((acc, item) => acc + item.value, 0);
  const { appColorTokens } = useTheme();

  const { theme, colorMap } = useMemo(() => {
    if (!appColorTokens) return { theme: {}, colorMap: {} };
    return generateNivoTheme(appColorTokens);
  }, [appColorTokens]);

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
        colors={getSliceColor}
        margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
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
        arcLabelsSkipAngle={15}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        arcLinkLabel={(datum: ComputedDatum<PieChartData> & { data: { emoticon?: string } }) => {
          if (totalForPercentage === 0) return `${datum.value}`;
          const percentage = ((datum.value / totalForPercentage) * 100).toFixed(1);
          return `${datum.data.emoticon || ''} ${datum.value} (${percentage}%)`;
        }}
        layers={['arcs', 'arcLabels', 'arcLinkLabels', 'legends', (props) => <CenteredMetric {...props} totalValue={totalValue} />]}
      />
    </div>
  );
}
