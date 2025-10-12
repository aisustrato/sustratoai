// Ruta: components/charts/StandardBarChart.tsx

'use client';

import { useMemo, useState, useRef } from 'react';
import { useTheme } from '@/app/theme-provider';
import { StandardSelect } from '@/components/ui/StandardSelect';
import { StandardText } from '@/components/ui/StandardText';
import { StandardBadge } from '@/components/ui/StandardBadge';
import { StandardButton } from '@/components/ui/StandardButton';
import { generateNivoBarTheme } from '@/lib/theme/components/nivo-bar-chart-tokens';
import { ResponsiveBar } from '@nivo/bar';
import { BarChart3, Download } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Datos de una dimensión para el gráfico
 */
export interface BarChartDimension {
  id: string;
  name: string;
  icon?: string | null;
  values: BarChartValue[];
}

/**
 * Valor de una dimensión (ej: "Experimental" en dimensión "Foco del estudio")
 */
export interface BarChartValue {
  value: string;
  count: number;
  emoticon?: string | null;
}

/**
 * Props del componente
 */
export interface StandardBarChartProps {
  /** Dimensiones con sus valores y conteos */
  dimensions: BarChartDimension[];
  /** Altura del gráfico en píxeles */
  height?: number;
  /** Mostrar leyenda */
  showLegend?: boolean;
  /** Orientación del gráfico */
  layout?: 'horizontal' | 'vertical';
  /** Tab inicial (por defecto 'all' para vista agrupada) */
  defaultTab?: string;
  /** Habilitar exportación SVG */
  enableExport?: boolean;
}

/**
 * Componente Standard de gráfico de barras con sistema de tabs
 * Permite ver todas las dimensiones agrupadas o una dimensión individual con detalle
 */
export function StandardBarChart({
  dimensions,
  height = 400,
  showLegend = true,
  layout = 'vertical',
  defaultTab = 'all',
  enableExport = true
}: StandardBarChartProps) {
  const { appColorTokens } = useTheme();
  const [selectedView, setSelectedView] = useState(defaultTab);
  const chartRef = useRef<HTMLDivElement>(null);

  // Generar tema y colores
  const { theme, generateColorMap, getDetailViewColor } = useMemo(() => {
    if (!appColorTokens) return { 
      theme: {}, 
      generateColorMap: () => ({}) as Record<string, string>,
      getDetailViewColor: () => '#ccc'
    };
    return generateNivoBarTheme(appColorTokens);
  }, [appColorTokens]);

  // Preparar datos para vista agrupada (todas las dimensiones)
  const groupedData = useMemo(() => {
    // Cada dimensión es una barra en el eje X
    return dimensions.map(dim => {
      const data: Record<string, string | number> = {
        dimension: dim.name,
      };
      
      // Agregar cada valor como una propiedad
      dim.values.forEach(val => {
        data[val.value] = val.count;
      });
      
      return data;
    });
  }, [dimensions]);

  // Obtener todas las keys (valores únicos) para la vista agrupada
  const allKeys = useMemo(() => {
    const keysSet = new Set<string>();
    dimensions.forEach(dim => {
      dim.values.forEach(val => keysSet.add(val.value));
    });
    return Array.from(keysSet);
  }, [dimensions]);

  // 🎨 Generar mapa de colores INTELIGENTE para vista agrupada
  // Cada dimensión tendrá su propio colorScheme, y sus valores serán variaciones de ese esquema
  const colorMap = useMemo(() => {
    // Preparar metadata de dimensiones para el sistema inteligente
    const dimensionsMetadata = dimensions.map(dim => ({
      name: dim.name,
      values: dim.values.map(v => v.value)
    }));
    
    return generateColorMap(allKeys, dimensionsMetadata);
  }, [allKeys, dimensions, generateColorMap]);

  // 🎨 Preparar datos para vista individual (una dimensión)
  // En vista detalle, cada valor usa un colorScheme diferente (primary, secondary, tertiary, etc.)
  const getSingleDimensionData = (dimensionId: string) => {
    const dim = dimensions.find(d => d.id === dimensionId);
    if (!dim) return [];
    
    return dim.values.map((val, index) => ({
      value: val.value, // Sin emoticon aquí para el eje
      label: val.emoticon ? `${val.emoticon} ${val.value}` : val.value, // Label completo con emoticon
      ...(val.emoticon && { emoticon: val.emoticon }), // Solo agregar si existe
      count: val.count,
      // Cada valor obtiene un colorScheme diferente
      color: getDetailViewColor(index)
    }));
  };

  // Opciones para el selector
  const viewOptions = useMemo(() => {
    const options = [
      { value: 'all', label: `Todas las dimensiones (${dimensions.length})` }
    ];
    
    dimensions.forEach(dim => {
      const totalCount = dim.values.reduce((sum, val) => sum + val.count, 0);
      options.push({
        value: dim.id,
        label: `${dim.name} (${totalCount} artículos)`
      });
    });
    
    return options;
  }, [dimensions]);

  if (!appColorTokens) {
    return (
      <div style={{ height: `${height}px` }} className="flex items-center justify-center">
        <StandardText colorShade="subtle">Cargando gráfico...</StandardText>
      </div>
    );
  }

  if (dimensions.length === 0) {
    return (
      <div style={{ height: `${height}px` }} className="flex flex-col items-center justify-center gap-3">
        <BarChart3 className="h-12 w-12 text-neutral-300" />
        <StandardText colorShade="subtle">No hay datos para mostrar</StandardText>
      </div>
    );
  }

  // 📥 Función para exportar gráfico como SVG
  const exportChartAsSvg = () => {
    if (!chartRef.current) {
      toast.error('No se pudo exportar el gráfico');
      return;
    }

    try {
      // Encontrar el SVG dentro del contenedor
      const svgElement = chartRef.current.querySelector('svg');
      
      if (!svgElement) {
        toast.error('No se encontró el gráfico para exportar');
        return;
      }
      
      // Clonar para no afectar el original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Asegurar namespace correcto
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      
      // Serializar el SVG
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      
      // Crear Blob y descargar
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      const viewName = selectedView === 'all' ? 'todas-dimensiones' : dimensions.find(d => d.id === selectedView)?.name || 'dimension';
      link.download = `grafico-${viewName}.svg`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Gráfico exportado como SVG');
    } catch (error) {
      console.error('Error exportando SVG:', error);
      toast.error('Error al exportar el gráfico');
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Controles superiores */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <StandardText size="sm" weight="medium" colorShade="subtle">
            Vista del gráfico:
          </StandardText>
          <StandardSelect
            options={viewOptions}
            value={selectedView}
            onChange={(value) => {
              if (typeof value === 'string') {
                setSelectedView(value);
              }
            }}
            size="sm"
            className="w-80"
          />
        </div>
        
        {/* Botón de exportación SVG */}
        {enableExport && (
          <StandardButton
            size="sm"
            styleType="outline"
            colorScheme="primary"
            leftIcon={Download}
            onClick={exportChartAsSvg}
          >
            Exportar SVG
          </StandardButton>
        )}
      </div>

      {/* Contenido según selección */}
      <div className="w-full" ref={chartRef}>
        {/* Vista agrupada */}
        {selectedView === 'all' && (
          <div style={{ height: `${height}px` }}>
            <ResponsiveBar
              data={groupedData}
              keys={allKeys}
              indexBy="dimension"
              theme={theme}
              colors={({ id }) => colorMap[id as string] || '#ccc'}
              margin={{ top: 20, right: showLegend ? 150 : 30, bottom: 80, left: 60 }}
              padding={0.3}
              layout={layout}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              borderColor={{
                from: 'color',
                modifiers: [['darker', 0.3]]
              }}
              borderWidth={1}
              borderRadius={4}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Dimensiones',
                legendPosition: 'middle',
                legendOffset: 65
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Cantidad de Artículos',
                legendPosition: 'middle',
                legendOffset: -50
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{
                from: 'color',
                modifiers: [['darker', 2]]
              }}
              legends={showLegend ? [
                {
                  dataFrom: 'keys',
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 14,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 1,
                        itemTextColor: appColorTokens.neutral.text
                      }
                    }
                  ]
                }
              ] : []}
              role="application"
              ariaLabel="Gráfico de barras agrupado por dimensiones"
              tooltip={({ id, value, indexValue, color }) => (
                <div
                  style={{
                    padding: '8px 12px',
                    background: appColorTokens.neutral.bg,
                    border: `1px solid ${appColorTokens.neutral.bgShade}`,
                    borderRadius: '6px',
                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: color
                      }}
                    />
                    <StandardText size="sm" weight="semibold">
                      {id}
                    </StandardText>
                  </div>
                  <StandardText size="xs" colorShade="subtle">
                    {indexValue}: {value} artículo{value !== 1 ? 's' : ''}
                  </StandardText>
                </div>
              )}
            />
          </div>
        )}

        {/* Vistas individuales por dimensión */}
        {dimensions.map(dim => {
          if (selectedView !== dim.id) return null;
          const singleData = getSingleDimensionData(dim.id);
          const totalCount = dim.values.reduce((sum, val) => sum + val.count, 0);

          return (
            <div key={dim.id} className="w-full">
              <div className="space-y-3">
                {/* Header con estadísticas */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <StandardText size="lg" weight="semibold">
                      {dim.name}
                    </StandardText>
                    <StandardText size="sm" colorShade="subtle">
                      {dim.values.length} categoría{dim.values.length !== 1 ? 's' : ''} • {totalCount} artículo{totalCount !== 1 ? 's' : ''}
                    </StandardText>
                  </div>
                  <StandardBadge size="lg" colorScheme="primary">
                    {totalCount}
                  </StandardBadge>
                </div>

                {/* Gráfico individual */}
                <div style={{ height: `${height}px` }}>
                  <ResponsiveBar
                    data={singleData}
                    keys={['count']}
                    indexBy="value"
                    theme={theme}
                    colors={({ data }) => data.color as string}
                    margin={{ top: 20, right: showLegend ? 180 : 30, bottom: 80, left: 60 }}
                    padding={0.3}
                    layout={layout}
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    borderColor={{
                      from: 'color',
                      modifiers: [['darker', 0.3]]
                    }}
                    borderWidth={1}
                    borderRadius={4}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Valores',
                      legendPosition: 'middle',
                      legendOffset: 65
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Cantidad',
                      legendPosition: 'middle',
                      legendOffset: -50
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{
                      from: 'color',
                      modifiers: [['darker', 2]]
                    }}
                    enableLabel={true}
                    legends={showLegend ? [
                      {
                        dataFrom: 'indexes',
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 140,
                        translateY: 0,
                        itemsSpacing: 8,
                        itemWidth: 120,
                        itemHeight: 24,
                        itemDirection: 'left-to-right',
                        itemOpacity: 0.85,
                        symbolSize: 16,
                        symbolShape: 'circle',
                        data: singleData.map((item) => ({
                          id: item.value,
                          label: `${item.label} (${item.count} - ${totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : 0}%)`,
                          color: item.color
                        })),
                        effects: [
                          {
                            on: 'hover',
                            style: {
                              itemOpacity: 1,
                              itemTextColor: appColorTokens.neutral.text
                            }
                          }
                        ]
                      }
                    ] : []}
                    role="application"
                    ariaLabel={`Gráfico detallado de ${dim.name}`}
                    tooltip={({ indexValue, value, color }) => {
                      const itemData = singleData.find(d => d.value === indexValue);
                      return (
                        <div
                          style={{
                            padding: '8px 12px',
                            background: appColorTokens.neutral.bg,
                            border: `1px solid ${appColorTokens.neutral.bgShade}`,
                            borderRadius: '6px',
                            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)',
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                background: color
                              }}
                            />
                            <StandardText size="sm" weight="semibold">
                              {itemData?.label || indexValue}
                            </StandardText>
                          </div>
                          <StandardText size="xs" colorShade="subtle">
                            {value} artículo{value !== 1 ? 's' : ''}
                          </StandardText>
                          <StandardText size="xs" colorShade="subtle">
                            {totalCount > 0 ? `${((value as number / totalCount) * 100).toFixed(1)}%` : '0%'} del total
                          </StandardText>
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
