"use client";

import { useMemo, useState } from "react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardBarChart } from "@/components/charts/StandardBarChart";
import { StandardPieChart } from "@/components/charts/StandardPieChart";
import { ChevronDown, ChevronUp, BarChart3, PieChart } from "lucide-react";
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
		statistics?: {
			total_articles: number;
			classified_count: number;
			by_option: Record<string, number>;
		};
	}[];
	/** Total de artículos únicos en el universo (para porcentajes multifase) */
	totalUniverseArticles?: number;
}

export function UniverseVisualization({
	articles,
	dimensions,
	totalUniverseArticles,
}: UniverseVisualizationProps) {
	// 🎯 Estados para controlar visibilidad de secciones
	const [showDistribution, setShowDistribution] = useState(true);
	const [showConfidence, setShowConfidence] = useState(false);
	const [showConfidenceByDim, setShowConfidenceByDim] = useState(false);
	const [showCoverage, setShowCoverage] = useState(false);

	// 📊 Estado para selector de dimensión individual y tipo de gráfico
	const [selectedDimensionId, setSelectedDimensionId] = useState<string>("all");
	const [chartType, setChartType] = useState<"bar" | "pie">("bar");

	// 🔧 Helper: Detectar si un valor es "Otros:"
	const isOtherValue = (value: string): boolean => {
		return value.toLowerCase().startsWith("otros");
	};

	// 🔧 Helper: Agrupar valores "Otros:" en una categoría
	const groupOtherValues = (
		valueCounts: Record<string, number>,
	): Record<string, number> => {
		const grouped: Record<string, number> = {};
		let othersTotal = 0;

		Object.entries(valueCounts).forEach(([value, count]) => {
			if (isOtherValue(value)) {
				othersTotal += count;
			} else {
				grouped[value] = count;
			}
		});

		if (othersTotal > 0) {
			grouped["Otros"] = othersTotal;
		}

		return grouped;
	};

	// Preparar datos para StandardBarChart con agrupación de "Otros"
	const chartDimensions = useMemo<BarChartDimension[]>(() => {
		return dimensions
			.filter((dim) => dim.options.length > 0)
			.map((dim) => {
				const valueCounts: Record<string, number> = {};

				// 🎯 PRIORIDAD INVERTIDA para multifase:
				// Usar estadísticas pre-calculadas del backend (ya deduplicadas y correctas)
				// Solo usar artículos como fallback si no hay estadísticas
				if (dim.statistics?.by_option) {
					// Estadísticas pre-calculadas del backend (fuente de verdad)
					Object.entries(dim.statistics.by_option).forEach(([key, count]) => {
						valueCounts[key] = count;
					});
				} else if (articles.length > 0) {
					// Fallback: Calcular desde artículos cargados
					dim.options.forEach((opt) => {
						valueCounts[opt.value.trim()] = 0;
					});

					articles.forEach((article) => {
						const classification = article.classifications[dim.id];
						if (classification && classification.value) {
							const value = (classification.value || "").trim();
							if (valueCounts[value] !== undefined) {
								valueCounts[value]++;
							} else {
								valueCounts[value] = 1;
							}
						}
					});
				}

				// 🔄 Agrupar valores "Otros:"
				const groupedCounts = groupOtherValues(valueCounts);

				// Convertir a formato BarChartValue[] con porcentajes
				// 🎯 UNIVERSO UNIFICADO: usar totalUniverseArticles como denominador si está disponible
				const dimTotal = Object.values(groupedCounts).reduce(
					(sum, count) => sum + count,
					0,
				);
				const percentageDenominator = totalUniverseArticles || dimTotal;
				const values = Object.entries(groupedCounts)
					.map(([value, count]) => {
						// Buscar emoticon (si existe en opciones planificadas)
						const option = dim.options.find(
							(opt) => opt.value.trim() === value,
						);
						const percentage =
							percentageDenominator > 0 ?
								((count / percentageDenominator) * 100).toFixed(1)
							:	"0";

						return {
							value: value === "Otros" ? "🎁 Otros (Serendipia)" : value,
							count,
							emoticon: option?.emoticon || (value === "Otros" ? "🎁" : null),
							percentage: `${percentage}%`,
						};
					})
					.filter((v) => v.count > 0) // Solo valores con conteo
					.sort((a, b) => b.count - a.count); // Ordenar por conteo descendente

				return {
					id: dim.id,
					name: dim.name,
					icon: dim.icon,
					values,
				};
			});
	}, [
		articles,
		dimensions,
		groupOtherValues,
		isOtherValue,
		totalUniverseArticles,
	]);

	// Calcular estadísticas globales
	const stats = useMemo(() => {
		// 🎯 PRIORIDAD: Usar estadísticas pre-calculadas del backend (fuente de verdad multifase)
		const hasPreCalculatedStats = dimensions.some((d) => d.statistics);
		if (hasPreCalculatedStats) {
			// Usar totalUniverseArticles si disponible, sino el total de la primera dimensión
			const totalArticles =
				totalUniverseArticles || dimensions[0]?.statistics?.total_articles || 0;
			const totalClassifications = dimensions.reduce(
				(sum, dim) => sum + (dim.statistics?.classified_count || 0),
				0,
			);
			const avgClassificationsPerArticle =
				totalArticles > 0 ?
					(totalClassifications / totalArticles).toFixed(1)
				:	"0";

			// Calcular cobertura: artículos que tienen al menos una clasificación
			// En multifase, usamos el total de clasificaciones de la dimensión con más cobertura
			const maxClassifiedCount = Math.max(
				...dimensions.map((d) => d.statistics?.classified_count || 0),
			);
			const coveragePercentage =
				totalArticles > 0 ?
					((maxClassifiedCount / totalArticles) * 100).toFixed(1)
				:	"0";

			return {
				totalArticles,
				classifiedArticles: maxClassifiedCount,
				totalClassifications,
				avgClassificationsPerArticle,
				coveragePercentage,
				totalDimensions: dimensions.length,
			};
		}

		// Fallback: Calcular desde artículos cargados
		if (articles.length > 0) {
			const totalClassifications = articles.reduce((sum, article) => {
				return sum + Object.keys(article.classifications).length;
			}, 0);

			const avgClassificationsPerArticle =
				articles.length > 0 ?
					(totalClassifications / articles.length).toFixed(1)
				:	"0";

			const classifiedArticles = articles.filter(
				(article) => Object.keys(article.classifications).length > 0,
			).length;

			const universeTotal = totalUniverseArticles || articles.length;
			const coveragePercentage =
				universeTotal > 0 ?
					((classifiedArticles / universeTotal) * 100).toFixed(1)
				:	"0";

			return {
				totalArticles: universeTotal,
				classifiedArticles,
				totalClassifications,
				avgClassificationsPerArticle,
				coveragePercentage,
				totalDimensions: dimensions.length,
			};
		}

		// Fallback si no hay ni artículos ni estadísticas
		return {
			totalArticles: 0,
			classifiedArticles: 0,
			avgClassificationsPerArticle: "0",
			coveragePercentage: "0",
			totalDimensions: dimensions.length,
		};
	}, [articles, dimensions, totalUniverseArticles]);

	// Calcular cobertura por dimensión
	const dimensionCoverage = useMemo(() => {
		const universeTotal = totalUniverseArticles || 0;

		return dimensions.map((dim) => {
			// Usar estadísticas pre-calculadas si disponibles
			if (dim.statistics) {
				const classified = dim.statistics.classified_count;
				const total = universeTotal || dim.statistics.total_articles;
				const percentage =
					total > 0 ? ((classified / total) * 100).toFixed(1) : "0";

				return {
					name: dim.name,
					classified,
					total,
					percentage,
				};
			}

			// Fallback: calcular desde artículos
			const classified = articles.filter((article) => {
				const classification = article.classifications[dim.id];
				return classification && classification.value;
			}).length;

			const total = universeTotal || articles.length;
			const percentage =
				total > 0 ? ((classified / total) * 100).toFixed(1) : "0";

			return {
				name: dim.name,
				classified,
				total,
				percentage,
			};
		});
	}, [articles, dimensions, totalUniverseArticles]);

	// 📊 GRÁFICO 1: Distribución Global de Confianza
	const confidenceDistribution = useMemo(() => {
		const allHigh = articles.filter((article) => {
			const classifications = Object.values(article.classifications);
			if (classifications.length === 0) return false;
			return classifications.every((c) => c && c.confidence === 3);
		}).length;

		const atLeastOneMedium = articles.filter((article) => {
			const classifications = Object.values(article.classifications);
			if (classifications.length === 0) return false;
			const hasAllHigh = classifications.every((c) => c && c.confidence === 3);
			if (hasAllHigh) return false; // Ya contados en "todas altas"
			return classifications.some((c) => c && c.confidence === 2);
		}).length;

		const atLeastOneLow = articles.filter((article) => {
			const classifications = Object.values(article.classifications);
			if (classifications.length === 0) return false;
			return classifications.some((c) => c && c.confidence === 1);
		}).length;

		return [
			{ id: "alta", label: "Todas Altas", value: allHigh },
			{ id: "media", label: "Al menos 1 Media", value: atLeastOneMedium },
			{ id: "baja", label: "Al menos 1 Baja", value: atLeastOneLow },
		];
	}, [articles]);

	// 📊 GRÁFICO 2: Dimensiones con Confianza Media/Baja
	const dimensionConfidenceIssues = useMemo<BarChartDimension[]>(() => {
		return dimensions
			.map((dim) => {
				let mediumCount = 0;
				let lowCount = 0;

				articles.forEach((article) => {
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
						{ value: "Baja", count: lowCount },
						{ value: "Media", count: mediumCount },
					],
				};
			})
			.filter((dim) => {
				// Solo incluir dimensiones que tengan al menos una confianza media o baja
				return dim.values.some((v) => v.count > 0);
			});
	}, [articles, dimensions]);

	// 🎯 Verificar si hay datos (artículos O estadísticas pre-calculadas)
	const hasData = articles.length > 0 || dimensions.some((d) => d.statistics);

	if (!hasData) {
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

			{/* 📊 Gráfico de Distribución (Colapsable - Abierto por defecto) */}
			{chartDimensions.length > 0 && (
				<StandardCard>
					<div className="p-6">
						<div className="flex items-center justify-between mb-4">
							<StandardText size="lg" weight="semibold">
								Distribución de Clasificaciones por Dimensión
							</StandardText>
							<StandardButton
								styleType="ghost"
								size="sm"
								onClick={() => setShowDistribution(!showDistribution)}
								leftIcon={showDistribution ? ChevronUp : ChevronDown}>
								{showDistribution ? "Ocultar" : "Mostrar"}
							</StandardButton>
						</div>

						{showDistribution && (
							<div className="space-y-4">
								{/* Selector de dimensión y tipo de gráfico */}
								<div className="flex items-center gap-4">
									<div className="flex-1">
										<StandardSelect
											options={[
												{ value: "all", label: "Todas las dimensiones" },
												...chartDimensions.map((dim) => ({
													value: dim.id,
													label: dim.name,
												})),
											]}
											value={selectedDimensionId}
											onChange={(value) => {
												if (typeof value === "string") {
													setSelectedDimensionId(value);
												}
											}}
											size="sm"
										/>
									</div>

									{/* Selector de tipo de gráfico (solo para dimensión individual) */}
									{selectedDimensionId !== "all" && (
										<div className="flex gap-2">
											<StandardButton
												styleType={chartType === "bar" ? "solid" : "outline"}
												size="sm"
												iconOnly
												onClick={() => setChartType("bar")}
												tooltip="Gráfico de barras">
												<BarChart3 size={16} />
											</StandardButton>
											<StandardButton
												styleType={chartType === "pie" ? "solid" : "outline"}
												size="sm"
												iconOnly
												onClick={() => setChartType("pie")}
												tooltip="Gráfico circular">
												<PieChart size={16} />
											</StandardButton>
										</div>
									)}
								</div>

								{/* Renderizar gráfico según selección */}
								{
									selectedDimensionId === "all" ?
										// Todas las dimensiones - Barras (porcentajes incluidos en datos)
										<StandardBarChart
											dimensions={chartDimensions}
											height={450}
											showLegend={true}
											layout="vertical"
											maxValue={totalUniverseArticles}
										/>
										// Dimensión individual - Barra o Pie con leyenda detallada
									:	(() => {
											const selectedDim = chartDimensions.find(
												(d) => d.id === selectedDimensionId,
											);
											if (!selectedDim) return null;

											const classifiedCount = selectedDim.values.reduce(
												(sum, v) => sum + v.count,
												0,
											);
											// 🔧 FIX: Usar classifiedCount (total filtrado) para el centro del PieChart
											// El universo total solo controla la escala Y del BarChart (via maxValue)
											const universeTotal = classifiedCount;

											// 🎨 Paleta de colores compartida entre pie y leyenda
											const colorPalette = [
												"#3b82f6",
												"#10b981",
												"#f59e0b",
												"#ef4444",
												"#8b5cf6",
												"#ec4899",
												"#06b6d4",
												"#f97316",
												"#14b8a6",
												"#a855f7",
											];

											return (
												<div className="space-y-4">
													{chartType === "pie" ?
														(() => {
															const pieData = selectedDim.values.map(
																(v, idx) => ({
																	id: v.value,
																	label:
																		v.emoticon ?
																			`${v.emoticon} ${v.value}`
																		:	v.value,
																	value: v.count,
																	color:
																		colorPalette[idx % colorPalette.length],
																}),
															);

															return (
																<StandardPieChart
																	data={pieData}
																	totalValue={universeTotal}
																	enableExport={true}
																	exportFilename={`distribucion-${selectedDim.name.toLowerCase().replace(/\s+/g, "-")}`}
																	title={selectedDim.name}
																/>
															);
														})()
													:	<StandardBarChart
															dimensions={[selectedDim]}
															height={400}
															showLegend={false}
															layout="horizontal"
															maxValue={totalUniverseArticles}
														/>
													}
												</div>
											);
										})()

								}
							</div>
						)}
					</div>
				</StandardCard>
			)}

			{/* 📊 GRÁFICO 1: Distribución Global de Confianza (Colapsable) */}
			<StandardCard>
				<div className="p-6">
					<div className="flex items-center justify-between mb-2">
						<StandardText size="lg" weight="semibold">
							Distribución Global de Confianza
						</StandardText>
						<StandardButton
							styleType="ghost"
							size="sm"
							onClick={() => setShowConfidence(!showConfidence)}
							leftIcon={showConfidence ? ChevronUp : ChevronDown}>
							{showConfidence ? "Ocultar" : "Mostrar"}
						</StandardButton>
					</div>

					{showConfidence && (
						<>
							<StandardText size="sm" colorShade="subtle" className="mb-4">
								Análisis del nivel de confianza de las clasificaciones por
								artículo
							</StandardText>
							{confidenceDistribution.some((d) => d.value > 0) ?
								<StandardPieChart
									data={confidenceDistribution}
									totalValue={articles.length}
									enableExport={true}
									exportFilename="distribucion-confianza"
								/>
							:	<div className="py-8 text-center">
									<StandardText colorShade="subtle">
										No hay datos de confianza disponibles
									</StandardText>
								</div>
							}
						</>
					)}
				</div>
			</StandardCard>

			{/* 📊 GRÁFICO 2: Dimensiones con Confianza Media/Baja (Colapsable) */}
			{dimensionConfidenceIssues.length > 0 && (
				<StandardCard>
					<div className="p-6">
						<div className="flex items-center justify-between mb-2">
							<StandardText size="lg" weight="semibold">
								Análisis de Confianza por Dimensión
							</StandardText>
							<StandardButton
								styleType="ghost"
								size="sm"
								onClick={() => setShowConfidenceByDim(!showConfidenceByDim)}
								leftIcon={showConfidenceByDim ? ChevronUp : ChevronDown}>
								{showConfidenceByDim ? "Ocultar" : "Mostrar"}
							</StandardButton>
						</div>

						{showConfidenceByDim && (
							<>
								<StandardText size="sm" colorShade="subtle" className="mb-4">
									Dimensiones que requieren revisión: clasificaciones con
									confianza media o baja
								</StandardText>
								<StandardBarChart
									dimensions={dimensionConfidenceIssues}
									height={400}
									showLegend={true}
									layout="horizontal"
									enableExport={true}
								/>
							</>
						)}
					</div>
				</StandardCard>
			)}

			{/* Cobertura por Dimensión (Colapsable) */}
			<StandardCard>
				<div className="p-6">
					<div className="flex items-center justify-between mb-4">
						<StandardText size="lg" weight="semibold">
							Cobertura por Dimensión
						</StandardText>
						<StandardButton
							styleType="ghost"
							size="sm"
							onClick={() => setShowCoverage(!showCoverage)}
							leftIcon={showCoverage ? ChevronUp : ChevronDown}>
							{showCoverage ? "Ocultar" : "Mostrar"}
						</StandardButton>
					</div>

					{showCoverage && (
						<div className="space-y-3">
							{dimensionCoverage.map((dim) => (
								<div
									key={dim.name}
									className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
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
											parseFloat(dim.percentage) >= 90 ? "success"
											: parseFloat(dim.percentage) >= 70 ?
												"warning"
											:	"neutral"
										}
										size="sm"
										className="ml-4">
										{dim.percentage}%
									</StandardBadge>
								</div>
							))}
						</div>
					)}
				</div>
			</StandardCard>
		</div>
	);
}
