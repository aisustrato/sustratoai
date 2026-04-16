// 📍 components/charts/StandardPieChart.tsx
// 🎨 COMPONENTE AGNÓSTICO - CANON 4.0
// Consume tokens centralizados desde DesignTokensProvider

"use client";

import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import { ResponsivePie } from "@nivo/pie";
import { useRef, useState } from "react";
import { Download, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { toPng } from "html-to-image";

export interface PieChartData {
	id: string; // ej: 'pendientesRevision'
	value: number;
	label: string; // ej: 'Pend. Revisión'
	emoticon?: string; // ej: '🔍'
	color?: string; // 🎨 Color personalizado (opcional)
}

export interface StandardPieChartProps {
	data: PieChartData[];
	totalValue?: number;
	/** Habilitar exportación SVG */
	enableExport?: boolean;
	/** Nombre para el archivo exportado */
	exportFilename?: string;
	/** Título opcional para mostrar arriba del gráfico */
	title?: string;
}

import type { ComputedDatum } from "@nivo/pie";

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

const CenteredMetric = ({
	dataWithArc,
	centerX,
	centerY,
	totalValue,
}: CenteredMetricProps) => {
	const total =
		totalValue ??
		dataWithArc.reduce((acc, datum) => acc + (datum.value || 0), 0);
	return (
		<StandardText
			asElement="text"
			x={centerX}
			y={centerY}
			textAnchor="middle"
			dominantBaseline="central"
			className="text-2xl font-bold">
			{total}
		</StandardText>
	);
};

export function StandardPieChart({
	data,
	totalValue,
	enableExport = true,
	exportFilename = "grafico-circular",
	title,
}: StandardPieChartProps) {
	const totalForPercentage =
		totalValue ?? data.reduce((acc, item) => acc + item.value, 0);
	const { tokens } = useDesignTokens();
	const chartRef = useRef<HTMLDivElement>(null);
	const exportContainerRef = useRef<HTMLDivElement>(null);
	const [showExportTypeDialog, setShowExportTypeDialog] = useState(false);
	const [showBackgroundDialog, setShowBackgroundDialog] = useState(false);
	const [exportType, setExportType] = useState<"chart-only" | "complete">(
		"chart-only",
	);

	// 🎨 Helper para obtener color de slice (prioriza color personalizado)
	const getSliceColor = (slice: {
		id: string | number;
		data?: PieChartData;
	}) => {
		// ✨ Prioridad 1: Color personalizado en los datos
		if (slice.data?.color) {
			return slice.data.color;
		}

		// ✨ Prioridad 2: Color desde tokens centralizados
		if (!tokens?.nivoChart) return "#cccccc";
		const sliceId = String(slice.id);
		return (
			tokens.nivoChart.colors[
				sliceId as keyof typeof tokens.nivoChart.colors
			] || "#cccccc"
		);
	};

	// 📥 Función para exportar gráfico como PNG
	const exportChartAsPng = async (withBackground: boolean) => {
		const containerRef =
			exportType === "complete" ? exportContainerRef : chartRef;

		if (!containerRef.current) {
			toast.error("No se pudo exportar el gráfico");
			return;
		}

		const el = containerRef.current;
		const isComplete = exportType === "complete";
		const savedStyles = new Map<HTMLElement, string>();

		// 🔧 Helper para restaurar estilos originales
		const restoreStyles = () => {
			savedStyles.forEach((cssText, element) => {
				element.style.cssText = cssText;
			});
		};

		try {
			// 🔧 Para exportación completa, expandir layout temporalmente.
			// html-to-image clona el DOM con getComputedStyle — si el layout
			// está comprimido, el clon también lo estará y cortará contenido.
			if (isComplete) {
				// Expandir contenedor principal
				savedStyles.set(el, el.style.cssText);
				el.style.width = "auto";
				el.style.maxWidth = "none";
				el.style.overflow = "visible";

				// Expandir contenedor de leyenda para mostrar todo el contenido
				const legend = el.querySelector(
					"[data-export-legend]",
				) as HTMLElement | null;
				if (legend) {
					savedStyles.set(legend, legend.style.cssText);
					legend.style.width = "max-content";
					legend.style.minWidth = "auto";
					legend.style.overflow = "visible";
				}

				// Forzar reflow para que getComputedStyle refleje el layout expandido
				void el.offsetWidth;
			}

			const dataUrl = await toPng(el, {
				pixelRatio: 2,
				backgroundColor: withBackground ? "#ffffff" : undefined,
			});

			restoreStyles();

			const link = document.createElement("a");
			const suffix = withBackground ? "" : "-transparente";
			const completeLabel = isComplete ? "-completo" : "";
			link.download = `${exportFilename}${completeLabel}${suffix}.png`;
			link.href = dataUrl;
			link.click();

			const bgText = withBackground ? "fondo blanco" : "fondo transparente";
			const modeText = isComplete ? "completo " : "";
			toast.success(`Gráfico ${modeText}exportado como PNG (${bgText})`);
			setShowBackgroundDialog(false);
		} catch (error) {
			console.error("Error exportando PNG:", error);
			toast.error("Error al exportar el gráfico");
			restoreStyles();
		}
	};

	// 📥 Función para exportar gráfico como SVG (siempre exporta solo el gráfico)
	const exportChartAsSvg = () => {
		if (!chartRef.current) {
			toast.error("No se pudo exportar el gráfico");
			return;
		}

		try {
			const svgElement = chartRef.current.querySelector("svg");

			if (!svgElement) {
				toast.error("No se encontró el gráfico para exportar");
				return;
			}

			const clonedSvg = svgElement.cloneNode(true) as SVGElement;
			clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
			clonedSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

			const serializer = new XMLSerializer();
			const svgString = serializer.serializeToString(clonedSvg);

			const blob = new Blob([svgString], {
				type: "image/svg+xml;charset=utf-8",
			});
			const url = URL.createObjectURL(blob);

			const link = document.createElement("a");
			link.download = `${exportFilename}.svg`;
			link.href = url;
			link.click();

			URL.revokeObjectURL(url);
			toast.success("Gráfico exportado como SVG");
		} catch (error) {
			console.error("Error exportando SVG:", error);
			toast.error("Error al exportar el gráfico");
		}
	};
	if (!tokens?.nivoChart) {
		return (
			<div
				style={{ height: "300px" }}
				className="flex items-center justify-center">
				Cargando gráfico...
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Botones de exportación */}
			<div className="flex justify-end gap-2">
				{enableExport && (
					<>
						<StandardButton
							size="sm"
							styleType="outline"
							colorScheme="primary"
							leftIcon={ImageIcon}
							onClick={() => setShowExportTypeDialog(true)}>
							Exportar PNG
						</StandardButton>
						<StandardButton
							size="sm"
							styleType="outline"
							colorScheme="primary"
							leftIcon={Download}
							onClick={() => exportChartAsSvg()}>
							Exportar SVG
						</StandardButton>
					</>
				)}
			</div>

			{/* Contenedor para exportación - compacto y centrado */}
			<div
				ref={exportContainerRef}
				className="bg-white p-8 rounded-lg max-w-fit mx-auto">
				{/* Título */}
				{title && (
					<div className="mb-8 text-center">
						<StandardText size="xl" weight="semibold">
							{title}
						</StandardText>
					</div>
				)}

				{/* Contenedor flex para gráfico y leyenda */}
				<div className="flex items-center justify-center gap-8">
					{/* Gráfico */}
					<div
						style={{ height: "350px", width: "450px", position: "relative" }}
						ref={chartRef}>
						<ResponsivePie
							data={data}
							theme={{
								tooltip: {
									container: {
										background: tokens.nivoChart.theme.tooltip.background,
										color: tokens.nivoChart.theme.tooltip.color,
										border: tokens.nivoChart.theme.tooltip.border,
										borderRadius: tokens.nivoChart.theme.tooltip.borderRadius,
										boxShadow: tokens.nivoChart.theme.tooltip.boxShadow,
									},
								},
								legends: {
									text: {
										fill: tokens.nivoChart.theme.legends.fill,
										fontSize: tokens.nivoChart.theme.legends.fontSize,
									},
								},
							}}
							colors={getSliceColor}
							margin={{ top: 40, right: 40, bottom: 80, left: 80 }}
							padAngle={1}
							cornerRadius={3}
							activeOuterRadiusOffset={8}
							borderWidth={1}
							borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
							arcLinkLabelsSkipAngle={10}
							arcLinkLabelsTextColor={tokens.nivoChart.theme.textColor}
							arcLinkLabelsThickness={2}
							arcLinkLabelsColor={{ from: "color" }}
							arcLabelsSkipAngle={15}
							arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
							arcLinkLabel={(
								datum: ComputedDatum<PieChartData> & {
									data: { emoticon?: string };
								},
							) => {
								if (totalForPercentage === 0) return `${datum.value}`;
								const percentage = (
									(datum.value / totalForPercentage) *
									100
								).toFixed(1);
								return `${datum.data.emoticon || ""} ${datum.value} (${percentage}%)`;
							}}
							legends={[]}
							layers={[
								"arcs",
								"arcLabels",
								"arcLinkLabels",
								(props) => (
									<CenteredMetric {...props} totalValue={totalValue} />
								),
							]}
						/>
					</div>

					{/* Leyenda personalizada */}
					<div className="min-w-[280px]" data-export-legend>
						<div className="space-y-3">
							{data.map((item) => {
								const percentage =
									totalForPercentage > 0 ?
										((item.value / totalForPercentage) * 100).toFixed(1)
									:	"0";
								const color =
									item.color ||
									tokens.nivoChart.colors[
										item.id as keyof typeof tokens.nivoChart.colors
									] ||
									"#cccccc";

								return (
									<div
										key={item.id}
										style={{ lineHeight: "1.8" }}
										className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors">
										{/* Indicador de color - 100% inline para compatibilidad con html2canvas */}
										<div
											data-color-indicator="true"
											style={{
												backgroundColor: color,
												width: "12px",
												height: "12px",
												minWidth: "12px",
												minHeight: "12px",
												borderRadius: "50%",
												flexShrink: 0,
											}}
										/>
										{/* Emoticon */}
										{item.emoticon && (
											<span className="text-base flex-shrink-0">
												{item.emoticon}
											</span>
										)}
										{/* Label - FIX: sin truncate para compatibilidad con html2canvas */}
										<div className="flex-1 min-w-0">
											<StandardText
												size="sm"
												weight="medium"
												className="break-words">
												{item.label}
											</StandardText>
										</div>
										{/* Valor y porcentaje alineados a la derecha */}
										<div className="flex items-baseline gap-1.5 flex-shrink-0 min-w-[90px] justify-end">
											<StandardText size="base" weight="bold">
												{item.value}
											</StandardText>
											<StandardText size="sm" colorShade="subtle">
												({percentage}%)
											</StandardText>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			{/* Dialog 1: Seleccionar qué exportar */}
			<StandardDialog
				open={showExportTypeDialog}
				onOpenChange={setShowExportTypeDialog}>
				<StandardDialog.Content>
					<StandardDialog.Header>
						<StandardDialog.Title>Exportar como PNG</StandardDialog.Title>
						<StandardDialog.Description>
							¿Qué deseas exportar?
						</StandardDialog.Description>
					</StandardDialog.Header>
					<StandardDialog.Body>
						<div className="flex flex-col gap-3">
							<StandardButton
								styleType="solid"
								colorScheme="primary"
								onClick={() => {
									setExportType("chart-only");
									setShowExportTypeDialog(false);
									setShowBackgroundDialog(true);
								}}
								className="w-full">
								Solo el Gráfico
							</StandardButton>
							<StandardButton
								styleType="outline"
								colorScheme="primary"
								onClick={() => {
									setExportType("complete");
									setShowExportTypeDialog(false);
									setShowBackgroundDialog(true);
								}}
								className="w-full">
								Gráfico Completo (con título y leyenda)
							</StandardButton>
						</div>
					</StandardDialog.Body>
				</StandardDialog.Content>
			</StandardDialog>

			{/* Dialog 2: Seleccionar tipo de fondo */}
			<StandardDialog
				open={showBackgroundDialog}
				onOpenChange={setShowBackgroundDialog}>
				<StandardDialog.Content>
					<StandardDialog.Header>
						<StandardDialog.Title>Tipo de Fondo</StandardDialog.Title>
						<StandardDialog.Description>
							Selecciona el tipo de fondo para la imagen
						</StandardDialog.Description>
					</StandardDialog.Header>
					<StandardDialog.Body>
						<div className="flex flex-col gap-3">
							<StandardButton
								styleType="solid"
								colorScheme="primary"
								onClick={() => exportChartAsPng(false)}
								className="w-full">
								Fondo Transparente
							</StandardButton>
							<StandardButton
								styleType="outline"
								colorScheme="neutral"
								onClick={() => exportChartAsPng(true)}
								className="w-full">
								Fondo Blanco
							</StandardButton>
						</div>
					</StandardDialog.Body>
				</StandardDialog.Content>
			</StandardDialog>
		</div>
	);
}
