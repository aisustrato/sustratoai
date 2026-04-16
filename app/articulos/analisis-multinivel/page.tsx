"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardPieChart } from "@/components/charts/StandardPieChart";
import { StandardBarChart } from "@/components/charts/StandardBarChart";
import {
	Network,
	Filter,
	TrendingUp,
	PieChart,
	BarChart3,
	Layers,
} from "lucide-react";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { useAuth } from "@/app/auth-provider";
import { getPhasesForProject } from "@/lib/actions/preclassification_phases_actions";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";

type Phase = Database["public"]["Tables"]["preclassification_phases"]["Row"];

export default function AnalisisMultinivelPage() {
	const { proyectoActual } = useAuth();

	// Estados de fases
	const [allPhases, setAllPhases] = useState<Phase[]>([]);
	const [isLoadingPhases, setIsLoadingPhases] = useState(true);
	const hasInitializedRef = useRef(false);

	// Filtro Base (Universo)
	const [basePhaseId, setBasePhaseId] = useState<string>("");
	const [baseDimensionId, setBaseDimensionId] = useState<string>("");
	const [baseValue, setBaseValue] = useState<string>("");

	// Filtro Secundario (Análisis Detallado)
	const [detailPhaseId, setDetailPhaseId] = useState<string>("");
	const [detailDimensionId, setDetailDimensionId] = useState<string>("");

	// Cargar fases
	const loadPhases = useCallback(async () => {
		if (!proyectoActual?.id || hasInitializedRef.current) return;
		hasInitializedRef.current = true;
		setIsLoadingPhases(true);

		try {
			const result = await getPhasesForProject(proyectoActual.id);

			if (result.data) {
				// Filtrar solo fases válidas
				const validPhases = result.data.filter(
					(p) =>
						p.status && ["active", "completed", "planning"].includes(p.status),
				);
				setAllPhases(validPhases);

				// Seleccionar primera fase por defecto
				if (validPhases.length > 0) {
					setBasePhaseId(validPhases[0].id);
				}
			}
		} catch (error) {
			console.error("Error cargando fases:", error);
			toast.error("Error al cargar fases");
		} finally {
			setIsLoadingPhases(false);
		}
	}, [proyectoActual?.id]);

	useEffect(() => {
		loadPhases();
	}, [loadPhases]);

	// Breadcrumbs
	const breadcrumbs = [
		{ label: "Artículos", href: "/articulos" },
		{ label: "Análisis Multinivel" },
	];

	// Loading
	if (!proyectoActual?.id) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
				<SustratoLoadingLogo size={64} />
				<StandardText colorShade="subtle">
					Cargando información del proyecto...
				</StandardText>
			</div>
		);
	}

	if (isLoadingPhases) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
				<SustratoLoadingLogo size={64} />
				<StandardText colorShade="subtle">Cargando fases...</StandardText>
			</div>
		);
	}

	if (allPhases.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
				<Network className="h-12 w-12 text-neutral-300" />
				<StandardText size="lg" weight="semibold">
					No hay fases disponibles
				</StandardText>
				<StandardText colorShade="subtle">
					Crea fases desde la gestión de fases para comenzar el análisis
					multinivel.
				</StandardText>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6 space-y-6">
			{/* Título */}
			<StandardPageTitle
				title="Análisis Multinivel"
				subtitle="Análisis jerárquico de clasificaciones entre fases padre-hijo"
				description="Define un universo base filtrando por una fase/dimensión, y analiza la distribución de otra dimensión dentro de ese subconjunto."
				mainIcon={Network}
				breadcrumbs={breadcrumbs}
			/>

			{/* Configuración de Filtros */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Filtro Base (Universo) */}
				<StandardCard styleType="filled" hasOutline>
					<div className="p-6 space-y-4">
						<div className="flex items-center gap-2 mb-4">
							<Filter className="h-5 w-5 text-primary-500" />
							<StandardText size="lg" weight="semibold">
								1️⃣ Filtro Base (Universo)
							</StandardText>
						</div>

						<StandardText size="sm" colorShade="subtle" className="mb-4">
							Define el subconjunto de artículos que será tu universo de
							análisis
						</StandardText>

						<div className="space-y-3">
							<div>
								<StandardText size="sm" weight="medium" className="mb-2">
									Fase Base
								</StandardText>
								<StandardSelect
									value={basePhaseId}
									onChange={(value) => {
										if (typeof value === "string") {
											setBasePhaseId(value);
											setBaseDimensionId("");
											setBaseValue("");
										}
									}}
									placeholder="Seleccionar fase"
									options={allPhases.map((phase) => ({
										value: phase.id,
										label: `Fase ${phase.phase_number}: ${phase.name}`,
									}))}
								/>
							</div>

							<div>
								<StandardText size="sm" weight="medium" className="mb-2">
									Dimensión Base
								</StandardText>
								<StandardSelect
									value={baseDimensionId}
									onChange={(value) => {
										if (typeof value === "string") {
											setBaseDimensionId(value);
											setBaseValue("");
										}
									}}
									placeholder="Seleccionar dimensión"
									options={[
										{ value: "dim1", label: "Profundidad Ética" },
										{ value: "dim2", label: "Tipo de Estudio" },
									]}
									disabled={!basePhaseId}
								/>
							</div>

							<div>
								<StandardText size="sm" weight="medium" className="mb-2">
									Valor a Filtrar
								</StandardText>
								<StandardSelect
									value={baseValue}
									onChange={(value) => {
										if (typeof value === "string") {
											setBaseValue(value);
										}
									}}
									placeholder="Seleccionar valor"
									options={[
										{ value: "si", label: "Sí" },
										{ value: "no", label: "No" },
									]}
									disabled={!baseDimensionId}
								/>
							</div>
						</div>

						{basePhaseId && baseDimensionId && baseValue && (
							<StandardCard
								styleType="subtle"
								colorScheme="primary"
								className="mt-4 p-3">
								<StandardText size="sm" weight="medium">
									📊 Universo Filtrado
								</StandardText>
								<StandardText size="xs" colorShade="subtle">
									Fase{" "}
									{allPhases.find((p) => p.id === basePhaseId)?.phase_number} →
									Profundidad Ética = Sí
								</StandardText>
								<StandardText size="xl" weight="bold" className="mt-2">
									64 artículos
								</StandardText>
								<StandardBadge size="sm" colorScheme="primary" className="mt-1">
									64% del total
								</StandardBadge>
							</StandardCard>
						)}
					</div>
				</StandardCard>

				{/* Filtro Secundario (Análisis Detallado) */}
				<StandardCard styleType="filled" hasOutline>
					<div className="p-6 space-y-4">
						<div className="flex items-center gap-2 mb-4">
							<Layers className="h-5 w-5 text-accent-500" />
							<StandardText size="lg" weight="semibold">
								2️⃣ Análisis Detallado
							</StandardText>
						</div>

						<StandardText size="sm" colorShade="subtle" className="mb-4">
							Selecciona qué dimensión analizar dentro del universo filtrado
						</StandardText>

						<div className="space-y-3">
							<div>
								<StandardText size="sm" weight="medium" className="mb-2">
									Fase a Analizar
								</StandardText>
								<StandardSelect
									value={detailPhaseId}
									onChange={(value) => {
										if (typeof value === "string") {
											setDetailPhaseId(value);
											setDetailDimensionId("");
										}
									}}
									placeholder="Seleccionar fase"
									options={allPhases
										.filter((p) => p.id !== basePhaseId)
										.map((phase) => ({
											value: phase.id,
											label: `Fase ${phase.phase_number}: ${phase.name}`,
										}))}
									disabled={!baseValue}
								/>
							</div>

							<div>
								<StandardText size="sm" weight="medium" className="mb-2">
									Dimensión a Analizar
								</StandardText>
								<StandardSelect
									value={detailDimensionId}
									onChange={(value) => {
										if (typeof value === "string") {
											setDetailDimensionId(value);
										}
									}}
									placeholder="Seleccionar dimensión"
									options={[
										{
											value: "dim3",
											label: "Considera Implicaciones Éticas",
										},
										{ value: "dim4", label: "Metodología Aplicada" },
									]}
									disabled={!detailPhaseId}
								/>
							</div>
						</div>

						{detailPhaseId && detailDimensionId && (
							<StandardCard
								styleType="subtle"
								colorScheme="accent"
								className="mt-4 p-3">
								<StandardText size="sm" weight="medium">
									🔍 Análisis Configurado
								</StandardText>
								<StandardText size="xs" colorShade="subtle">
									Distribución de &quot;Considera Implicaciones Éticas&quot;
									dentro del universo de 64 artículos
								</StandardText>
							</StandardCard>
						)}
					</div>
				</StandardCard>
			</div>

			{/* Visualizaciones */}
			{baseValue && detailDimensionId && (
				<>
					{/* KPIs del Universo Filtrado */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<StandardCard
							styleType="subtle"
							hasOutline
							className="p-4 text-center">
							<StandardText size="xs" colorShade="subtle" className="block">
								Universo Total
							</StandardText>
							<StandardText size="2xl" weight="bold">
								100
							</StandardText>
							<StandardText size="xs" colorShade="subtle">
								artículos
							</StandardText>
						</StandardCard>

						<StandardCard
							styleType="subtle"
							hasOutline
							className="p-4 text-center">
							<StandardText size="xs" colorShade="subtle" className="block">
								Universo Filtrado
							</StandardText>
							<StandardText size="2xl" weight="bold" colorScheme="primary">
								64
							</StandardText>
							<StandardBadge size="sm" colorScheme="primary">
								64%
							</StandardBadge>
						</StandardCard>

						<StandardCard
							styleType="subtle"
							hasOutline
							className="p-4 text-center">
							<StandardText size="xs" colorShade="subtle" className="block">
								Sí (en detalle)
							</StandardText>
							<StandardText size="2xl" weight="bold" colorScheme="success">
								45
							</StandardText>
							<StandardBadge size="sm" colorScheme="success">
								70% del filtrado
							</StandardBadge>
						</StandardCard>

						<StandardCard
							styleType="subtle"
							hasOutline
							className="p-4 text-center">
							<StandardText size="xs" colorShade="subtle" className="block">
								No (en detalle)
							</StandardText>
							<StandardText size="2xl" weight="bold" colorScheme="danger">
								19
							</StandardText>
							<StandardBadge size="sm" colorScheme="danger">
								30% del filtrado
							</StandardBadge>
						</StandardCard>
					</div>

					{/* Gráficos */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Gráfico de Torta */}
						<StandardCard styleType="filled" hasOutline>
							<div className="p-6">
								<div className="flex items-center gap-2 mb-4">
									<PieChart className="h-5 w-5 text-primary-500" />
									<StandardText size="lg" weight="semibold">
										Distribución en Universo Filtrado
									</StandardText>
								</div>

								<StandardText size="sm" colorShade="subtle" className="mb-4">
									Universo: 64 artículos (Fase 4: Profundidad Ética = Sí)
								</StandardText>

								<div className="h-80">
									<StandardPieChart
										data={[
											{
												id: "si",
												label: "Sí",
												value: 45,
												emoticon: "✅",
											},
											{
												id: "no",
												label: "No",
												value: 19,
												emoticon: "❌",
											},
										]}
										totalValue={64}
										enableExport={true}
										exportFilename="distribucion-universo-filtrado"
									/>
								</div>

								<div className="mt-4 space-y-2">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="w-3 h-3 rounded-full bg-success-500" />
											<StandardText size="sm">Sí</StandardText>
										</div>
										<StandardText size="sm" weight="semibold">
											45 (70%)
										</StandardText>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="w-3 h-3 rounded-full bg-danger-500" />
											<StandardText size="sm">No</StandardText>
										</div>
										<StandardText size="sm" weight="semibold">
											19 (30%)
										</StandardText>
									</div>
								</div>
							</div>
						</StandardCard>

						{/* Gráfico de Barras Comparativo */}
						<StandardCard styleType="filled" hasOutline>
							<div className="p-6">
								<div className="flex items-center gap-2 mb-4">
									<BarChart3 className="h-5 w-5 text-accent-500" />
									<StandardText size="lg" weight="semibold">
										Comparación: Total vs Filtrado
									</StandardText>
								</div>

								<StandardText size="sm" colorShade="subtle" className="mb-4">
									Compara la distribución en el universo total vs el filtrado
								</StandardText>

								<div className="h-80">
									<StandardBarChart
										dimensions={[
											{
												id: "universo-total",
												name: "Universo Total",
												values: [
													{ value: "Sí", count: 58, emoticon: "✅" },
													{ value: "No", count: 42, emoticon: "❌" },
												],
											},
											{
												id: "universo-filtrado",
												name: "Universo Filtrado",
												values: [
													{ value: "Sí", count: 70, emoticon: "✅" },
													{ value: "No", count: 30, emoticon: "❌" },
												],
											},
										]}
										height={320}
										layout="vertical"
										showLegend={true}
										enableExport={true}
										maxValue={100}
									/>
								</div>

								<div className="mt-4 p-3 bg-accent-50 dark:bg-accent-950 rounded-lg">
									<StandardText size="sm" weight="medium">
										💡 Insight
									</StandardText>
									<StandardText size="xs" colorShade="subtle">
										En el universo filtrado (artículos con profundidad ética),
										el 70% considera implicaciones éticas, vs 58% en el total.
									</StandardText>
								</div>
							</div>
						</StandardCard>
					</div>

					{/* Gráfico de Flujo (Sankey-like con barras) */}
					<StandardCard styleType="filled" hasOutline>
						<div className="p-6">
							<div className="flex items-center gap-2 mb-4">
								<TrendingUp className="h-5 w-5 text-success-500" />
								<StandardText size="lg" weight="semibold">
									Flujo Jerárquico: Fase 4 → Fase 6
								</StandardText>
							</div>

							<StandardText size="sm" colorShade="subtle" className="mb-6">
								Visualización del filtrado en cascada
							</StandardText>

							<div className="space-y-6">
								{/* Nivel 1: Total */}
								<div>
									<StandardText size="sm" weight="medium" className="mb-2">
										Total de Artículos
									</StandardText>
									<div className="relative">
										<div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded-lg flex items-center px-4">
											<StandardText size="sm" weight="semibold">
												100 artículos
											</StandardText>
										</div>
									</div>
								</div>

								{/* Nivel 2: Filtro Base */}
								<div>
									<StandardText size="sm" weight="medium" className="mb-2">
										Fase 4: Profundidad Ética = Sí
									</StandardText>
									<div className="relative">
										<div className="h-12 bg-primary-200 dark:bg-primary-900 rounded-lg flex items-center px-4 w-[64%]">
											<StandardText size="sm" weight="semibold">
												64 artículos (64%)
											</StandardText>
										</div>
									</div>
								</div>

								{/* Nivel 3: Análisis Detallado */}
								<div className="pl-8 space-y-3">
									<StandardText size="sm" weight="medium" className="mb-2">
										Fase 6: Considera Implicaciones Éticas
									</StandardText>

									<div>
										<StandardText
											size="xs"
											colorShade="subtle"
											className="mb-1">
											Sí
										</StandardText>
										<div className="h-10 bg-success-200 dark:bg-success-900 rounded-lg flex items-center px-4 w-[45%]">
											<StandardText size="sm" weight="semibold">
												45 artículos (70% del filtrado)
											</StandardText>
										</div>
									</div>

									<div>
										<StandardText
											size="xs"
											colorShade="subtle"
											className="mb-1">
											No
										</StandardText>
										<div className="h-10 bg-danger-200 dark:bg-danger-900 rounded-lg flex items-center px-4 w-[19%]">
											<StandardText size="sm" weight="semibold">
												19 artículos (30% del filtrado)
											</StandardText>
										</div>
									</div>
								</div>
							</div>
						</div>
					</StandardCard>
				</>
			)}

			{/* Estado vacío */}
			{(!baseValue || !detailDimensionId) && (
				<StandardCard styleType="subtle" hasOutline>
					<div className="p-12 text-center">
						<Network className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
						<StandardText size="lg" weight="semibold">
							Configura los filtros para ver el análisis
						</StandardText>
						<StandardText colorShade="subtle" className="mt-2">
							Selecciona un filtro base y una dimensión a analizar para generar
							las visualizaciones
						</StandardText>
					</div>
				</StandardCard>
			)}
		</div>
	);
}
