// Ruta: components/charts/StandardPieChart.tsx

'use client';

import { useTheme } from '@/app/theme-provider';
import { StandardText } from '@/components/ui/StandardText';
import { StandardButton } from '@/components/ui/StandardButton';
import { generateNivoTheme } from '@/lib/theme/components/nivo-pie-chart-tokens';
import { ResponsivePie } from '@nivo/pie';
import { useMemo, useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

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
  /** Habilitar exportación SVG */
  enableExport?: boolean;
  /** Nombre para el archivo exportado */
  exportFilename?: string;
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

export function StandardPieChart({ 
  data, 
  onColorMapGenerated, 
  totalValue,
  enableExport = true,
  exportFilename = 'grafico-circular'
}: StandardPieChartProps) {
  const totalForPercentage = totalValue ?? data.reduce((acc, item) => acc + item.value, 0);
  const { appColorTokens } = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);

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

  // 📥 Función para exportar gráfico como SVG
  const exportChartAsSvg = () => {
    if (!chartRef.current) {
      toast.error('No se pudo exportar el gráfico');
      return;
    }

    try {
      const svgElement = chartRef.current.querySelector('svg');
      
      if (!svgElement) {
        toast.error('No se encontró el gráfico para exportar');
        return;
      }
      
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `${exportFilename}.svg`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Gráfico exportado como SVG');
    } catch (error) {
      console.error('Error exportando SVG:', error);
      toast.error('Error al exportar el gráfico');
    }
  };
  if (!appColorTokens) {
    return <div style={{ height: '300px' }} className="flex items-center justify-center">Cargando gráfico...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Botón de exportación */}
      {enableExport && (
        <div className="flex justify-end">
          <StandardButton
            size="sm"
            styleType="outline"
            colorScheme="primary"
            leftIcon={Download}
            onClick={exportChartAsSvg}
          >
            Exportar SVG
          </StandardButton>
        </div>
      )}
      
      <div style={{ height: '300px', position: 'relative' }} ref={chartRef}>
        <ResponsivePie
          data={data}
          theme={theme}
          colors={getSliceColor}
          margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
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
    </div>
  );
}
