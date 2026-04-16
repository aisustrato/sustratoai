"use client";

import { useMemo, useState } from "react";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardBarChart } from "@/components/charts/StandardBarChart";
import { StandardPieChart } from "@/components/charts/StandardPieChart";
import { ChevronDown, ChevronUp, BarChart3, PieChart } from "lucide-react";
import type {
	DiscrepancyByDimension,
	DiscrepancySummary,
} from "@/lib/actions/preclassification-actions";
import type { BarChartDimension } from "@/components/charts/StandardBarChart";

interface DiscrepancyVisualizationProps {
	summary: DiscrepancySummary;
	byDimension: DiscrepancyByDimension[];
}

export function DiscrepancyVisualization({
	summary,
	byDimension,
}: DiscrepancyVisualizationProps) {
	const [showAgreementChart, setShowAgreementChart] = useState(true);
	const [showDimBreakdown, setShowDimBreakdown] = useState(true);
	const [showConfusionMatrix, setShowConfusionMatrix] = useState(false);
	const [chartType, setChartType] = useState<"bar" | "pie">("bar");
	const [selectedDimForMatrix, setSelectedDimForMatrix] = useState<string>(
		byDimension[0]?.dimensionId || "",
	);

	// Datos para gráfico de acuerdos vs discrepancias global
	const globalPieData = useMemo(() => {
		return [
			{ id: "Acuerdos", label: "Acuerdos", value: summary.agreements },
			{
				id: "Discrepancias",
				label: "Discrepancias",
				value: summary.discrepancies,
			},
			{
				id: "Solo IA",
				label: "Solo IA (sin revisión)",
				value: summary.onlyIter1,
			},
		].filter((d) => d.value > 0);
	}, [summary]);

	// Datos para gráfico de estado de reconciliación
	const reconciliationPieData = useMemo(() => {
		return [
			{
				id: "Reconciliados",
				label: "Reconciliados",
				value: summary.reconciled,
			},
			{ id: "En Disputa", label: "En Disputa", value: summary.disputed },
			{
				id: "Pend. Reconciliación",
				label: "Pend. Reconciliación",
				value: summary.pendingReconciliation,
			},
		].filter((d) => d.value > 0);
	}, [summary]);

	// Datos para barras por dimensión (solo dimensiones con valores > 0)
	const dimensionBarData = useMemo<BarChartDimension[]>(() => {
		return byDimension
			.filter((dim) => dim.totalPairs > 0)
			.map((dim) => ({
				id: dim.dimensionId,
				name: dim.dimensionName,
				values: [
					{ value: "Acuerdos", count: dim.agreements },
					{ value: "Discrepancias", count: dim.discrepancies },
				],
			}));
	}, [byDimension]);

	// Tasa de acuerdo por dimensión para barras
	const agreementRateBarData = useMemo<BarChartDimension[]>(() => {
		return byDimension
			.filter((dim) => dim.totalPairs > 0)
			.map((dim) => {
				const rate = Math.round((dim.agreements / dim.totalPairs) * 100);
				return {
					id: dim.dimensionId,
					name: dim.dimensionName,
					values: [{ value: "% Acuerdo", count: rate }],
				};
			});
	}, [byDimension]);

	// Matriz de confusión para la dimensión seleccionada
	const selectedDimMatrix = useMemo(() => {
		const dim = byDimension.find((d) => d.dimensionId === selectedDimForMatrix);
		if (!dim) return null;

		const matrix = dim.confusionMatrix;
		const allValues = new Set<string>();

		for (const [fromVal, toMap] of Object.entries(matrix)) {
			allValues.add(fromVal);
			for (const toVal of Object.keys(toMap)) {
				allValues.add(toVal);
			}
		}

		return {
			dimensionName: dim.dimensionName,
			values: [...allValues].sort(),
			matrix,
		};
	}, [byDimension, selectedDimForMatrix]);

	return (
		<div className="space-y-6">
			{/* Sección 1: Distribución Global */}
			<StandardCard styleType="subtle" hasOutline>
				<div className="p-4">
					<div className="flex items-center justify-between mb-4">
						<StandardButton
							styleType="ghost"
							size="sm"
							onClick={() => setShowAgreementChart(!showAgreementChart)}
							leftIcon={showAgreementChart ? ChevronUp : ChevronDown}>
							<StandardText size="sm" weight="semibold">
								Distribución Global IA vs Humano
							</StandardText>
						</StandardButton>
					</div>

					{showAgreementChart && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Pie de acuerdos vs discrepancias */}
							<div>
								<StandardText
									size="xs"
									weight="medium"
									colorShade="subtle"
									className="mb-2 block">
									Comparación IA vs Humano
								</StandardText>
								{globalPieData.length > 0 ?
									<div className="h-64">
										<StandardPieChart
											data={globalPieData}
											title="Comparación IA vs Humano"
											enableExport={false}
										/>
									</div>
								:	<StandardText size="sm" colorShade="subtle">
										Sin datos suficientes
									</StandardText>
								}
							</div>

							{/* Pie de estado de reconciliación */}
							<div>
								<StandardText
									size="xs"
									weight="medium"
									colorShade="subtle"
									className="mb-2 block">
									Estado de Reconciliación
								</StandardText>
								{reconciliationPieData.length > 0 ?
									<div className="h-64">
										<StandardPieChart
											data={reconciliationPieData}
											title="Estado de Reconciliación"
											enableExport={false}
										/>
									</div>
								:	<StandardText size="sm" colorShade="subtle">
										Sin reconciliaciones aún
									</StandardText>
								}
							</div>
						</div>
					)}
				</div>
			</StandardCard>

			{/* Sección 2: Desglose por Dimensión */}
			<StandardCard styleType="subtle" hasOutline>
				<div className="p-4">
					<div className="flex items-center justify-between mb-4">
						<StandardButton
							styleType="ghost"
							size="sm"
							onClick={() => setShowDimBreakdown(!showDimBreakdown)}
							leftIcon={showDimBreakdown ? ChevronUp : ChevronDown}>
							<StandardText size="sm" weight="semibold">
								Desglose por Dimensión
							</StandardText>
						</StandardButton>
						<div className="flex items-center gap-2">
							<StandardButton
								styleType={chartType === "bar" ? "solid" : "outline"}
								size="sm"
								iconOnly
								onClick={() => setChartType("bar")}
								tooltip="Gráfico de barras">
								<BarChart3 size={14} />
							</StandardButton>
							<StandardButton
								styleType={chartType === "pie" ? "solid" : "outline"}
								size="sm"
								iconOnly
								onClick={() => setChartType("pie")}
								tooltip="Gráfico circular">
								<PieChart size={14} />
							</StandardButton>
						</div>
					</div>

					{showDimBreakdown && (
						<div className="space-y-6">
							{/* Barras: Acuerdos vs Discrepancias por dimensión */}
							{chartType === "bar" ?
								<div>
									<StandardText
										size="xs"
										weight="medium"
										colorShade="subtle"
										className="mb-2 block">
										Acuerdos vs Discrepancias
									</StandardText>
									{dimensionBarData.length > 0 ?
										<StandardBarChart
											dimensions={dimensionBarData}
											height={300}
											layout="vertical"
										/>
									:	<StandardText size="sm" colorShade="subtle">
											Sin datos
										</StandardText>
									}
								</div>
							:	<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{byDimension
										.filter((dim) => dim.totalPairs > 0)
										.map((dim) => {
											const pieData = [
												{
													id: "Acuerdos",
													label: "Acuerdos",
													value: dim.agreements,
												},
												{
													id: "Discrepancias",
													label: "Discrepancias",
													value: dim.discrepancies,
												},
											].filter((d) => d.value > 0);

											return (
												<div key={dim.dimensionId}>
													<StandardText
														size="xs"
														weight="semibold"
														className="mb-2 block">
														{dim.dimensionName}
													</StandardText>
													{pieData.length > 0 ?
														<div className="h-48">
															<StandardPieChart
																data={pieData}
																enableExport={false}
															/>
														</div>
													:	<StandardText size="sm" colorShade="subtle">
															Sin datos
														</StandardText>
													}
												</div>
											);
										})}
								</div>
							}

							{/* Tasa de acuerdo */}
							<div>
								<StandardText
									size="xs"
									weight="medium"
									colorShade="subtle"
									className="mb-2 block">
									Tasa de Acuerdo por Dimensión (%)
								</StandardText>
								{agreementRateBarData.length > 0 ?
									<StandardBarChart
										dimensions={agreementRateBarData}
										height={250}
										layout="vertical"
										maxValue={100}
									/>
								:	<StandardText size="sm" colorShade="subtle">
										Sin datos
									</StandardText>
								}
							</div>
						</div>
					)}
				</div>
			</StandardCard>

			{/* Sección 3: Matriz de Confusión */}
			{byDimension.some((d) => Object.keys(d.confusionMatrix).length > 0) && (
				<StandardCard styleType="subtle" hasOutline>
					<div className="p-4">
						<div className="flex items-center justify-between mb-4">
							<StandardButton
								styleType="ghost"
								size="sm"
								onClick={() => setShowConfusionMatrix(!showConfusionMatrix)}
								leftIcon={showConfusionMatrix ? ChevronUp : ChevronDown}>
								<StandardText size="sm" weight="semibold">
									Matriz de Confusión (IA vs Humano)
								</StandardText>
							</StandardButton>
							{showConfusionMatrix && (
								<div className="w-64">
									<StandardSelect
										value={selectedDimForMatrix}
										onChange={(val) => {
											if (typeof val === "string") {
												setSelectedDimForMatrix(val);
											}
										}}
										options={byDimension
											.filter((d) => Object.keys(d.confusionMatrix).length > 0)
											.map((d) => ({
												value: d.dimensionId,
												label: d.dimensionName,
											}))}
										size="sm"
										placeholder="Seleccionar dimensión"
									/>
								</div>
							)}
						</div>

						{showConfusionMatrix && selectedDimMatrix && (
							<div className="overflow-x-auto">
								<StandardText
									size="xs"
									colorShade="subtle"
									className="mb-3 block">
									Filas = Clasificación IA (Iter 1) | Columnas = Clasificación
									Humano (Iter 2)
								</StandardText>
								<table className="min-w-full text-sm border-collapse">
									<thead>
										<tr>
											<th className="border border-neutral-300 p-2 bg-neutral-100 text-left">
												<StandardText size="xs" weight="semibold">
													IA \ Humano
												</StandardText>
											</th>
											{selectedDimMatrix.values.map((val) => (
												<th
													key={val}
													className="border border-neutral-300 p-2 bg-neutral-100 text-center">
													<StandardText size="xs" weight="semibold">
														{val}
													</StandardText>
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{selectedDimMatrix.values.map((rowVal) => (
											<tr key={rowVal}>
												<td className="border border-neutral-300 p-2 bg-neutral-50">
													<StandardText size="xs" weight="medium">
														{rowVal}
													</StandardText>
												</td>
												{selectedDimMatrix.values.map((colVal) => {
													const count =
														selectedDimMatrix.matrix[rowVal]?.[colVal] || 0;
													const isDiagonal = rowVal === colVal;
													return (
														<td
															key={colVal}
															className={`border border-neutral-300 p-2 text-center ${
																isDiagonal ? "bg-success-50"
																: count > 0 ? "bg-danger-50"
																: ""
															}`}>
															<StandardText
																size="xs"
																weight={count > 0 ? "semibold" : "normal"}>
																{count || "—"}
															</StandardText>
														</td>
													);
												})}
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</StandardCard>
			)}
		</div>
	);
}
