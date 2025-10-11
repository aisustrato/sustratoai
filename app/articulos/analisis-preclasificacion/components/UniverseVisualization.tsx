"use client";

import { useMemo } from "react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardBarChart } from "@/components/charts/StandardBarChart";
import { StandardPieChart } from "@/components/charts/StandardPieChart";
import type { PreclassifiedArticleForAnalysis } from "@/lib/actions/preclassification-actions";
import type { BarChartDimension } from "@/components/charts/StandardBarChart";

interface UniverseVisualizationProps {
  articles: PreclassifiedArticleForAnalysis[];
  dimensions: {
    id: string;
    name: string;
    type: string;
    icon: string | null;
    options: { value: string; emoticon: string | null }[];
  }[];
}

export function UniverseVisualization({ articles, dimensions }: UniverseVisualizationProps) {
  // Preparar datos para StandardBarChart
  const chartDimensions = useMemo<BarChartDimension[]>(() => {
    return dimensions
      .filter(dim => dim.options.length > 0) // Solo dimensiones con opciones
      .map(dim => {
        // Contar artículos por valor
        const valueCounts: Record<string, number> = {};
        
        dim.options.forEach(opt => {
          valueCounts[opt.value] = 0;
        });

        articles.forEach(article => {
          const classification = article.classifications[dim.id];
          if (classification && classification.value) {
            if (valueCounts[classification.value] !== undefined) {
              valueCounts[classification.value]++;
            }
          }
        });

        // Convertir a formato BarChartValue[]
        const values = dim.options.map(opt => ({
          value: opt.value,
          count: valueCounts[opt.value] || 0,
          emoticon: opt.emoticon
        }));

        return {
          id: dim.id,
          name: dim.name,
          icon: dim.icon,
          values
        };
      });
  }, [articles, dimensions]);

  // Calcular estadísticas globales
  const stats = useMemo(() => {
    const totalClassifications = articles.reduce((sum, article) => {
      return sum + Object.keys(article.classifications).length;
    }, 0);

    const avgClassificationsPerArticle = articles.length > 0
      ? (totalClassifications / articles.length).toFixed(1)
      : '0';

    const classifiedArticles = articles.filter(article => 
      Object.keys(article.classifications).length > 0
    ).length;

    const coveragePercentage = articles.length > 0
      ? ((classifiedArticles / articles.length) * 100).toFixed(1)
      : '0';

    return {
      totalArticles: articles.length,
      classifiedArticles,
      totalClassifications,
      avgClassificationsPerArticle,
      coveragePercentage,
      totalDimensions: dimensions.length
    };
  }, [articles, dimensions.length]);

  // Calcular cobertura por dimensión
  const dimensionCoverage = useMemo(() => {
    return dimensions.map(dim => {
      const classified = articles.filter(article => {
        const classification = article.classifications[dim.id];
        return classification && classification.value;
      }).length;

      const percentage = articles.length > 0
        ? ((classified / articles.length) * 100).toFixed(1)
        : '0';

      return {
        name: dim.name,
        classified,
        total: articles.length,
        percentage
      };
    });
  }, [articles, dimensions]);

  // 📊 GRÁFICO 1: Distribución Global de Confianza
  const confidenceDistribution = useMemo(() => {
    const allHigh = articles.filter(article => {
      const classifications = Object.values(article.classifications);
      if (classifications.length === 0) return false;
      return classifications.every(c => c && c.confidence === 3);
    }).length;

    const atLeastOneMedium = articles.filter(article => {
      const classifications = Object.values(article.classifications);
      if (classifications.length === 0) return false;
      const hasAllHigh = classifications.every(c => c && c.confidence === 3);
      if (hasAllHigh) return false; // Ya contados en "todas altas"
      return classifications.some(c => c && c.confidence === 2);
    }).length;

    const atLeastOneLow = articles.filter(article => {
      const classifications = Object.values(article.classifications);
      if (classifications.length === 0) return false;
      return classifications.some(c => c && c.confidence === 1);
    }).length;

    return [
      { id: 'alta', label: 'Todas Altas', value: allHigh },
      { id: 'media', label: 'Al menos 1 Media', value: atLeastOneMedium },
      { id: 'baja', label: 'Al menos 1 Baja', value: atLeastOneLow }
    ];
  }, [articles]);

  // 📊 GRÁFICO 2: Dimensiones con Confianza Media/Baja
  const dimensionConfidenceIssues = useMemo<BarChartDimension[]>(() => {
    return dimensions.map(dim => {
      let mediumCount = 0;
      let lowCount = 0;

      articles.forEach(article => {
        const classification = article.classifications[dim.id];
        if (classification) {
          if (classification.confidence === 2) mediumCount++;
          if (classification.confidence === 1) lowCount++;
        }
      });

      return {
        id: dim.id,
        name: dim.name,
        icon: dim.icon,
        values: [
          { value: 'Baja', count: lowCount },
          { value: 'Media', count: mediumCount }
        ]
      };
    }).filter(dim => {
      // Solo incluir dimensiones que tengan al menos una confianza media o baja
      return dim.values.some(v => v.count > 0);
    });
  }, [articles, dimensions]);

  if (articles.length === 0) {
    return (
      <StandardCard>
        <div className="p-8 text-center">
          <StandardText colorShade="subtle">
            No hay artículos para visualizar
          </StandardText>
        </div>
      </StandardCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas Globales */}
      <StandardCard>
        <div className="p-6">
          <StandardText size="lg" weight="semibold" className="mb-4">
            Estadísticas Globales del Universo
          </StandardText>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <StandardText size="3xl" weight="bold" colorScheme="primary">
                {stats.totalArticles}
              </StandardText>
              <StandardText size="sm" colorShade="subtle">
                Artículos Totales
              </StandardText>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <StandardText size="3xl" weight="bold" colorScheme="success">
                {stats.coveragePercentage}%
              </StandardText>
              <StandardText size="sm" colorShade="subtle">
                Cobertura Global
              </StandardText>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <StandardText size="3xl" weight="bold" colorScheme="accent">
                {stats.totalClassifications}
              </StandardText>
              <StandardText size="sm" colorShade="subtle">
                Total Clasificaciones
              </StandardText>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <StandardText size="3xl" weight="bold" colorScheme="neutral">
                {stats.avgClassificationsPerArticle}
              </StandardText>
              <StandardText size="sm" colorShade="subtle">
                Promedio por Artículo
              </StandardText>
            </div>
          </div>
        </div>
      </StandardCard>

      {/* Gráfico de Distribución con Tabs */}
      {chartDimensions.length > 0 && (
        <StandardCard>
          <div className="p-6">
            <StandardText size="lg" weight="semibold" className="mb-4">
              Distribución de Clasificaciones por Dimensión
            </StandardText>
            <StandardBarChart
              dimensions={chartDimensions}
              height={450}
              showLegend={true}
              layout="vertical"
            />
          </div>
        </StandardCard>
      )}

      {/* 📊 GRÁFICO 1: Distribución Global de Confianza */}
      <StandardCard>
        <div className="p-6">
          <StandardText size="lg" weight="semibold" className="mb-2">
            Distribución Global de Confianza
          </StandardText>
          <StandardText size="sm" colorShade="subtle" className="mb-4">
            Análisis del nivel de confianza de las clasificaciones por artículo
          </StandardText>
          {confidenceDistribution.some(d => d.value > 0) ? (
            <StandardPieChart
              data={confidenceDistribution}
              totalValue={articles.length}
              enableExport={true}
              exportFilename="distribucion-confianza"
            />
          ) : (
            <div className="py-8 text-center">
              <StandardText colorShade="subtle">
                No hay datos de confianza disponibles
              </StandardText>
            </div>
          )}
        </div>
      </StandardCard>

      {/* 📊 GRÁFICO 2: Dimensiones con Confianza Media/Baja */}
      {dimensionConfidenceIssues.length > 0 && (
        <StandardCard>
          <div className="p-6">
            <StandardText size="lg" weight="semibold" className="mb-2">
              Análisis de Confianza por Dimensión
            </StandardText>
            <StandardText size="sm" colorShade="subtle" className="mb-4">
              Dimensiones que requieren revisión: clasificaciones con confianza media o baja
            </StandardText>
            <StandardBarChart
              dimensions={dimensionConfidenceIssues}
              height={400}
              showLegend={true}
              layout="horizontal"
              enableExport={true}
            />
          </div>
        </StandardCard>
      )}

      {/* Cobertura por Dimensión */}
      <StandardCard>
        <div className="p-6">
          <StandardText size="lg" weight="semibold" className="mb-4">
            Cobertura por Dimensión
          </StandardText>
          <div className="space-y-3">
            {dimensionCoverage.map(dim => (
              <div key={dim.name} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="flex-1">
                  <StandardText size="sm" weight="medium">
                    {dim.name}
                  </StandardText>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-neutral-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all"
                        style={{ width: `${dim.percentage}%` }}
                      />
                    </div>
                    <StandardText size="xs" colorShade="subtle">
                      {dim.classified}/{dim.total}
                    </StandardText>
                  </div>
                </div>
                <StandardBadge
                  colorScheme={
                    parseFloat(dim.percentage) >= 90 ? "success" :
                    parseFloat(dim.percentage) >= 70 ? "warning" :
                    "neutral"
                  }
                  size="sm"
                  className="ml-4"
                >
                  {dim.percentage}%
                </StandardBadge>
              </div>
            ))}
          </div>
        </div>
      </StandardCard>
    </div>
  );
}
