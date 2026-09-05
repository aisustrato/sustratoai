"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
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
	const t = useTranslations("articulos.analisisMultinivel");
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
			toast.error(t("toastErrorLoadingPhases"));
		} finally {
			setIsLoadingPhases(false);
		}
	}, [proyectoActual?.id, t]);

	useEffect(() => {
		loadPhases();
	}, [loadPhases]);

	// Breadcrumbs
	const breadcrumbs = [
		{ label: t("breadcrumbArticulos"), href: "/articulos" },
		{ label: t("pageTitle") },
	];

	// Loading
	if (!proyectoActual?.id) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
				<SustratoLoadingLogo size={64} />
				<StandardText colorShade="subtle">
					{t("loadingProjectInfo")}
				</StandardText>
			</div>
		);
	}

	if (isLoadingPhases) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
				<SustratoLoadingLogo size={64} />
				<StandardText colorShade="subtle">{t("loadingPhases")}</StandardText>
			</div>
		);
	}

	if (allPhases.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
				<Network className="h-12 w-12 text-neutral-300" />
				<StandardText size="lg" weight="semibold">
					{t("noPhasesTitle")}
				</StandardText>
				<StandardText colorShade="subtle">
					{t("noPhasesDescription")}
				</StandardText>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6 space-y-6">
			{/* Título */}
			<StandardPageTitle
				title={t("pageTitle")}
				subtitle={t("pageSubtitle")}
				description={t("pageDescription")}
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
								{t("baseFilterTitle")}
							</StandardText>
						</div>

						<StandardText size="sm" colorShade="subtle" className="mb-4">
							{t("baseFilterDescription")}
						</StandardText>

						<div className="space-y-3">
							<div>
								<StandardText size="sm" weight="medium" className="mb-2">
									{t("basePhaseLabel")}
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
									placeholder={t("selectPhasePlaceholder")}
									options={allPhases.map((phase) => ({
										value: phase.id,
										label: t("phaseOptionLabel", { number: phase.phase_number, name: phase.name }),
									}))}
								/>
							</div>

							<div>
								<StandardText size="sm" weight="medium" className="mb-2">
									{t("baseDimensionLabel")}
								</StandardText>
								<StandardSelect
									value={baseDimensionId}
									onChange={(value) => {
										if (typeof value === "string") {
											setBaseDimensionId(value);
											setBaseValue("");
										}
									}}
									placeholder={t("selectDimensionPlaceholder")}
									options={[
										{ value: "dim1", label: t("dimEthicalDepth") },
										{ value: "dim2", label: t("dimStudyType") },
									]}
									disabled={!basePhaseId}
								/>
							</div>

							<div>
								<StandardText size="sm" weight="medium" className="mb-2">
									{t("valueToFilterLabel")}
								</StandardText>
								<StandardSelect
									value={baseValue}
									onChange={(value) => {
										if (typeof value === "string") {
											setBaseValue(value);
										}
									}}
									placeholder={t("selectValuePlaceholder")}
									options={[
										{ value: "si", label: t("yesLabel") },
										{ value: "no", label: t("noLabel") },
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
									{t("filteredUniverseTitle")}
								</StandardText>
								<StandardText size="xs" colorShade="subtle">
									{t("filteredUniverseSummary", {
										number: allPhases.find((p) => p.id === basePhaseId)?.phase_number ?? 0,
									})}
								</StandardText>
								<StandardText size="xl" weight="bold" className="mt-2">
									{t("mockFilteredCount")}
								</StandardText>
								<StandardBadge size="sm" colorScheme="primary" className="mt-1">
									{t("mockPercentOfTotal")}
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
								{t("detailedAnalysisTitle")}
							</StandardText>
						</div>

						<StandardText size="sm" colorShade="subtle" className="mb-4">
							{t("detailedAnalysisDescription")}
						</StandardText>

						<div className="space-y-3">
							<div>
								<StandardText size="sm" weight="medium" className="mb-2">
									{t("phaseToAnalyzeLabel")}
								</StandardText>
								<StandardSelect
									value={detailPhaseId}
									onChange={(value) => {
										if (typeof value === "string") {
											setDetailPhaseId(value);
											setDetailDimensionId("");
										}
									}}
									placeholder={t("selectPhasePlaceholder")}
									options={allPhases
										.filter((p) => p.id !== basePhaseId)
										.map((phase) => ({
											value: phase.id,
											label: t("phaseOptionLabel", { number: phase.phase_number, name: phase.name }),
										}))}
									disabled={!baseValue}
								/>
							</div>

							<div>
								<StandardText size="sm" weight="medium" className="mb-2">
									{t("dimensionToAnalyzeLabel")}
								</StandardText>
								<StandardSelect
									value={detailDimensionId}
									onChange={(value) => {
										if (typeof value === "string") {
											setDetailDimensionId(value);
										}
									}}
									placeholder={t("selectDimensionPlaceholder")}
									options={[
										{
											value: "dim3",
											label: t("dimEthicalImplications"),
										},
										{ value: "dim4", label: t("dimMethodology") },
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
									{t("configuredAnalysisTitle")}
								</StandardText>
								<StandardText size="xs" colorShade="subtle">
									{t("configuredAnalysisDescription")}
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
								{t("kpiTotalUniverseLabel")}
							</StandardText>
							<StandardText size="2xl" weight="bold">
								100
							</StandardText>
							<StandardText size="xs" colorShade="subtle">
								{t("articlesUnit")}
							</StandardText>
						</StandardCard>

						<StandardCard
							styleType="subtle"
							hasOutline
							className="p-4 text-center">
							<StandardText size="xs" colorShade="subtle" className="block">
								{t("kpiFilteredUniverseLabel")}
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
								{t("kpiYesDetailLabel")}
							</StandardText>
							<StandardText size="2xl" weight="bold" colorScheme="success">
								45
							</StandardText>
							<StandardBadge size="sm" colorScheme="success">
								{t("mockPercentFiltered70")}
							</StandardBadge>
						</StandardCard>

						<StandardCard
							styleType="subtle"
							hasOutline
							className="p-4 text-center">
							<StandardText size="xs" colorShade="subtle" className="block">
								{t("kpiNoDetailLabel")}
							</StandardText>
							<StandardText size="2xl" weight="bold" colorScheme="danger">
								19
							</StandardText>
							<StandardBadge size="sm" colorScheme="danger">
								{t("mockPercentFiltered30")}
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
										{t("pieChartTitle")}
									</StandardText>
								</div>

								<StandardText size="sm" colorShade="subtle" className="mb-4">
									{t("pieChartSubtitle")}
								</StandardText>

								<div className="h-80">
									<StandardPieChart
										data={[
											{
												id: "si",
												label: t("yesLabel"),
												value: 45,
												emoticon: "✅",
											},
											{
												id: "no",
												label: t("noLabel"),
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
											<StandardText size="sm">{t("yesLabel")}</StandardText>
										</div>
										<StandardText size="sm" weight="semibold">
											{t("countPercentLabel", { count: 45, percent: 70 })}
										</StandardText>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="w-3 h-3 rounded-full bg-danger-500" />
											<StandardText size="sm">{t("noLabel")}</StandardText>
										</div>
										<StandardText size="sm" weight="semibold">
											{t("countPercentLabel", { count: 19, percent: 30 })}
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
										{t("barChartTitle")}
									</StandardText>
								</div>

								<StandardText size="sm" colorShade="subtle" className="mb-4">
									{t("barChartSubtitle")}
								</StandardText>

								<div className="h-80">
									<StandardBarChart
										dimensions={[
											{
												id: "universo-total",
												name: t("kpiTotalUniverseLabel"),
												values: [
													{ value: t("yesLabel"), count: 58, emoticon: "✅" },
													{ value: t("noLabel"), count: 42, emoticon: "❌" },
												],
											},
											{
												id: "universo-filtrado",
												name: t("kpiFilteredUniverseLabel"),
												values: [
													{ value: t("yesLabel"), count: 70, emoticon: "✅" },
													{ value: t("noLabel"), count: 30, emoticon: "❌" },
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
										{t("insightTitle")}
									</StandardText>
									<StandardText size="xs" colorShade="subtle">
										{t("insightText")}
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
									{t("flowTitle")}
								</StandardText>
							</div>

							<StandardText size="sm" colorShade="subtle" className="mb-6">
								{t("flowSubtitle")}
							</StandardText>

							<div className="space-y-6">
								{/* Nivel 1: Total */}
								<div>
									<StandardText size="sm" weight="medium" className="mb-2">
										{t("totalArticlesLabel")}
									</StandardText>
									<div className="relative">
										<div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded-lg flex items-center px-4">
											<StandardText size="sm" weight="semibold">
												{t("mockTotalArticlesCount")}
											</StandardText>
										</div>
									</div>
								</div>

								{/* Nivel 2: Filtro Base */}
								<div>
									<StandardText size="sm" weight="medium" className="mb-2">
										{t("phase4Label")}
									</StandardText>
									<div className="relative">
										<div className="h-12 bg-primary-200 dark:bg-primary-900 rounded-lg flex items-center px-4 w-[64%]">
											<StandardText size="sm" weight="semibold">
												{t("mockFilteredCountPercent")}
											</StandardText>
										</div>
									</div>
								</div>

								{/* Nivel 3: Análisis Detallado */}
								<div className="pl-8 space-y-3">
									<StandardText size="sm" weight="medium" className="mb-2">
										{t("phase6Label")}
									</StandardText>

									<div>
										<StandardText
											size="xs"
											colorShade="subtle"
											className="mb-1">
											{t("yesLabel")}
										</StandardText>
										<div className="h-10 bg-success-200 dark:bg-success-900 rounded-lg flex items-center px-4 w-[45%]">
											<StandardText size="sm" weight="semibold">
												{t("mockYesDetailCount")}
											</StandardText>
										</div>
									</div>

									<div>
										<StandardText
											size="xs"
											colorShade="subtle"
											className="mb-1">
											{t("noLabel")}
										</StandardText>
										<div className="h-10 bg-danger-200 dark:bg-danger-900 rounded-lg flex items-center px-4 w-[19%]">
											<StandardText size="sm" weight="semibold">
												{t("mockNoDetailCount")}
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
							{t("emptyStateTitle")}
						</StandardText>
						<StandardText colorShade="subtle" className="mt-2">
							{t("emptyStateDescription")}
						</StandardText>
					</div>
				</StandardCard>
			)}
		</div>
	);
}
