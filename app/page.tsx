// app/page.tsx
"use client";

import { StandardText } from "@/components/ui/StandardText";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardDivider } from "@/components/ui/StandardDivider";
import { useAuth } from "@/app/auth-provider";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import {
	StandardCard,
	StandardCardContent,
	StandardCardHeader,
	StandardCardTitle,
} from "@/components/ui/StandardCard";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { StandardPieChart } from "@/components/charts/StandardPieChart";
import { StickyNote, FolderOpen, History } from "lucide-react";
import { useEffect, useState } from "react";
import {
	getProjectMasterData,
	getActivePhaseStatus,
	getUserPersonalData,
} from "@/lib/actions/dashboard-actions";
import type {
	ProjectMasterData,
	ActivePhaseStatus,
	UserPersonalData,
} from "@/lib/types/dashboard-types";
import {
	EquipoIcon,
	ArticulosIcon,
	FasesIcon,
	DimensionesIcon,
	LotesIcon,
	AnalisisIcon,
} from "@/lib/svg/components";

export default function Home() {
	const { proyectoActual, authInitialized, user } = useAuth();

	// Estados para datos del dashboard
	const [masterData, setMasterData] = useState<ProjectMasterData | null>(null);
	const [activePhaseData, setActivePhaseData] =
		useState<ActivePhaseStatus | null>(null);
	const [personalData, setPersonalData] = useState<UserPersonalData | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);

	// Textos por defecto (los que están actualmente hardcodeados)
	const defaultClientName = "Universidad Católica de Chile";
	const defaultProjectName = "Ayudas Técnicas";
	const defaultDepartmentName = "Escuela de Trabajo Social";

	// Cargar datos del dashboard
	useEffect(() => {
		async function loadDashboardData() {
			console.log("[Home] useEffect ejecutado:", {
				proyectoActualId: proyectoActual?.id,
				userId: user?.id,
				proyectoActual,
			});

			if (!proyectoActual?.id || !user?.id) {
				console.log(
					"[Home] Falta proyectoActual.id o user.id, abortando carga",
				);
				setIsLoading(false);
				return;
			}

			setIsLoading(true);

			try {
				console.log(
					"[Home] Llamando server actions con projectId:",
					proyectoActual.id,
				);
				const [masterResult, phaseResult, personalResult] = await Promise.all([
					getProjectMasterData(proyectoActual.id),
					getActivePhaseStatus(proyectoActual.id),
					getUserPersonalData(user.id, proyectoActual.id),
				]);

				console.log("[Home] Resultados:", {
					masterResult,
					phaseResult,
					personalResult,
				});

				if (masterResult.success) setMasterData(masterResult.data!);
				if (phaseResult.success) setActivePhaseData(phaseResult.data!);
				if (personalResult.success) setPersonalData(personalResult.data!);
			} catch (error) {
				console.error("[Home] Error cargando datos:", error);
			} finally {
				setIsLoading(false);
			}
		}

		loadDashboardData();
	}, [proyectoActual?.id, user?.id, proyectoActual]);

	// Mientras la autenticación no se haya inicializado
	if (!authInitialized || (user && !proyectoActual)) {
		return (
			<StandardPageBackground variant="gradient">
				<div className="flex flex-col items-center justify-center min-h-screen">
					<SustratoLoadingLogo
						size={60}
						text="Cargando información del proyecto..."
						colorTransition={false}
					/>
				</div>
			</StandardPageBackground>
		);
	}

	// Si no hay usuario y la página es pública (o si auth no está inicializado),
	// es posible que queramos mostrar los datos por defecto.
	// Si hay usuario, esperamos que proyectoActual tenga datos.
	const clientName = proyectoActual?.institution_name || defaultClientName;
	const projectName = proyectoActual?.name || defaultProjectName;
	const departmentName = proyectoActual?.description || defaultDepartmentName;
	const projectDescription =
		"Plataforma de herramientas para investigación y análisis de datos cualitativos";
	// Para el footer, si es específico del cliente también se podría obtener de proyectoActual
	const footerProjectText = `Proyecto desarrollado por ${departmentName} de ${clientName}`;

	return (
		<StandardPageBackground variant="gradient">
			{/* Hero Section */}
			<section className="text-center pt-20 pb-8 md:pt-24 md:pb-10">
				<div className="flex flex-col items-center mb-4">
					<StandardText
						colorScheme="tertiary"
						colorShade="subtle"
						size="md"
						className="uppercase tracking-wider mb-3 font-bold"
						preset="subtitle">
						{clientName}
					</StandardText>
					<StandardDivider variant="gradient" size="md" className="mb-8" />
				</div>

				<StandardText
					preset="heading"
					size="5xl"
					applyGradient="primary"
					className="mb-2">
					{projectName}
				</StandardText>

				<StandardText
					asElement="h2"
					preset="subheading"
					size="2xl"
					applyGradient="secondary"
					className="mb-6">
					{departmentName}
				</StandardText>

				<StandardText
					preset="subtitle"
					size="xl"
					colorShade="subtle"
					colorScheme="neutral"
					className="max-w-2xl mx-auto">
					{projectDescription}
				</StandardText>
			</section>

			{/* Dashboard Sections */}
			<div className="max-w-7xl mx-auto px-4 pb-12 space-y-8">
				{/* Sección 2: Datos Maestros del Proyecto */}
				<StandardCard
					colorScheme="neutral"
					styleType="subtle"
					accentPlacement="top">
					<StandardCardHeader>
						<StandardCardTitle>
							<StandardText
								applyGradient="neutral"
								preset="heading"
								size="2xl"
								className="font-bold">
								Datos Maestros del Proyecto
							</StandardText>
						</StandardCardTitle>
					</StandardCardHeader>
					<StandardCardContent>
						{isLoading ?
							<div className="flex justify-center py-8">
								<SustratoLoadingLogo size={40} text="Cargando datos..." />
							</div>
						:	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{/* Equipo y Roles */}
								<DashboardMetricCard
									title="Equipo"
									value={masterData?.members.total || 0}
									detail={
										masterData?.members.roles.length ?
											`${masterData.members.roles.length} roles: ${masterData.members.roles.join(
												", ",
											)}`
										:	"Sin roles definidos"
									}
									colorScheme="primary"
									isEmpty={!masterData?.members.total}
									emptyMessage="Aún no hay miembros en el equipo"
									customIcon={<EquipoIcon width={80} height={80} />}
									clickable={true}
									href="/datos-maestros/miembros"
								/>

								{/* Biblioteca de Artículos */}
								<DashboardMetricCard
									title="Artículos"
									value={masterData?.articles.total || 0}
									detail={
										masterData?.articles.total ?
											`${masterData.articles.total} artículos cargados`
										:	undefined
									}
									colorScheme="secondary"
									isEmpty={!masterData?.articles.total}
									emptyMessage="Comienza cargando artículos"
									customIcon={<ArticulosIcon width={80} height={80} />}
									clickable={true}
									href="/articulos/base-original"
								/>

								{/* Fases de Investigación */}
								<DashboardMetricCard
									title="Fases"
									value={masterData?.phases.total || 0}
									detail={
										masterData?.phases.activePhase ?
											`Fase activa: ${masterData.phases.activePhase.name}`
										:	"Sin fase activa"
									}
									colorScheme="tertiary"
									isEmpty={!masterData?.phases.total}
									emptyMessage="Crea tu primera fase"
									customIcon={<FasesIcon width={80} height={80} />}
									clickable={true}
									href="/datos-maestros/fases-preclasificacion"
								/>

								{/* Dimensiones de Análisis */}
								<DashboardMetricCard
									title="Dimensiones"
									value={masterData?.dimensions.total || 0}
									detail={
										masterData?.dimensions.byPhase.length ?
											masterData.dimensions.byPhase
												.map((p) => `${p.phaseName}: ${p.count}`)
												.join(", ")
										:	undefined
									}
									colorScheme="tertiary"
									isEmpty={!masterData?.dimensions.total}
									emptyMessage="Define dimensiones de análisis"
									customIcon={<DimensionesIcon width={80} height={80} />}
									clickable={true}
									href="/datos-maestros/dimensiones"
								/>

								{/* Lotes de Preclasificación */}
								<DashboardMetricCard
									title="Lotes"
									value={masterData?.batches.total || 0}
									detail={
										masterData?.batches.total ?
											`${masterData.batches.active} activos, ${masterData.batches.completed} completados`
										:	undefined
									}
									colorScheme="success"
									isEmpty={!masterData?.batches.total}
									emptyMessage="Crea lotes para organizar"
									customIcon={<LotesIcon width={80} height={80} />}
									clickable={true}
									href="/datos-maestros/lote"
								/>

								{/* Análisis */}
								<DashboardMetricCard
									title="Análisis"
									value={
										masterData?.preclassification.totalArticlesAnalyzed || 0
									}
									detail={
										masterData?.preclassification.totalReviews ?
											`${masterData.preclassification.totalReviews} revisiones realizadas`
										:	undefined
									}
									colorScheme="primary"
									isEmpty={!masterData?.preclassification.totalArticlesAnalyzed}
									emptyMessage="Aún no hay artículos analizados"
									customIcon={<AnalisisIcon width={80} height={80} />}
									clickable={true}
									href="/articulos/analisis-preclasificacion"
								/>
							</div>
						}
					</StandardCardContent>
				</StandardCard>

				{/* Sección 3: Estado de la Fase Activa (condicional) */}
				{activePhaseData?.phase && activePhaseData.hasLotes && (
					<StandardCard
						colorScheme="accent"
						styleType="subtle"
						accentPlacement="top">
						<StandardCardHeader>
							<StandardCardTitle>
								<StandardText
									applyGradient="neutral"
									preset="heading"
									size="2xl"
									className="font-bold">
									Fase Activa: {activePhaseData.phase.name}
								</StandardText>
							</StandardCardTitle>
						</StandardCardHeader>
						<StandardCardContent>
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{/* Gráfico del Universo */}
								<div>
									<h3 className="text-lg font-semibold mb-4">
										Estado del Universo
									</h3>
									<StandardPieChart
										data={[
											{
												id: "pending",
												label: "Pendientes",
												value: activePhaseData.articleCounts.pending,
												color: "#94a3b8",
											},
											{
												id: "translated",
												label: "Traducidos",
												value: activePhaseData.articleCounts.translated,
												color: "#f59e0b",
											},
											{
												id: "pending_review",
												label: "Pend. Revisión",
												value: activePhaseData.articleCounts.pending_review,
												color: "#3b82f6",
											},
											{
												id: "reconciliation_pending",
												label: "Pend. Reconciliación",
												value:
													activePhaseData.articleCounts.reconciliation_pending,
												color: "#8b5cf6",
											},
											{
												id: "validated",
												label: "Validados",
												value: activePhaseData.articleCounts.validated,
												color: "#10b981",
											},
											{
												id: "reconciled",
												label: "Reconciliados",
												value: activePhaseData.articleCounts.reconciled,
												color: "#3b82f6",
											},
											{
												id: "disputed",
												label: "En Disputa",
												value: activePhaseData.articleCounts.disputed,
												color: "#ef4444",
											},
										].filter((item) => item.value > 0)}
									/>
								</div>

								{/* Estadísticas */}
								<div className="space-y-4">
									<h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
									<div className="space-y-3">
										<div className="flex justify-between items-center p-3 bg-white/10 dark:bg-black/10 rounded-lg">
											<span className="text-sm font-medium">
												Total de artículos
											</span>
											<span className="text-xl font-bold">
												{activePhaseData.progress.total}
											</span>
										</div>
										<div className="flex justify-between items-center p-3 bg-white/10 dark:bg-black/10 rounded-lg">
											<span className="text-sm font-medium">Lotes activos</span>
											<span className="text-xl font-bold">
												{activePhaseData.batchStats.active}
											</span>
										</div>
										<div className="flex justify-between items-center p-3 bg-white/10 dark:bg-black/10 rounded-lg">
											<span className="text-sm font-medium">
												Lotes completados
											</span>
											<span className="text-xl font-bold">
												{activePhaseData.batchStats.completed}
											</span>
										</div>
										<div className="flex justify-between items-center p-3 bg-success-100 dark:bg-success-900/20 rounded-lg">
											<span className="text-sm font-medium">
												Progreso general
											</span>
											<span className="text-xl font-bold">
												{activePhaseData.progress.percentage}%
											</span>
										</div>
									</div>
								</div>
							</div>
						</StandardCardContent>
					</StandardCard>
				)}

				{/* Sección 4: Trabajo Personal del Investigador */}
				<StandardCard
					colorScheme="tertiary"
					styleType="subtle"
					accentPlacement="top">
					<StandardCardHeader>
						<StandardCardTitle>
							Hola{" "}
							{user?.user_metadata?.full_name || user?.email || "Investigador"}
						</StandardCardTitle>
					</StandardCardHeader>
					<StandardCardContent>
						{isLoading ?
							<div className="flex justify-center py-8">
								<SustratoLoadingLogo
									size={40}
									text="Cargando datos personales..."
								/>
							</div>
						:	<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{/* Notas Personales */}
								<DashboardMetricCard
									icon={StickyNote}
									title="Notas Personales"
									value={personalData?.notes.total || 0}
									detail={
										personalData?.notes.total ?
											`${personalData.notes.total} notas creadas`
										:	undefined
									}
									buttonText="Ver Notas"
									buttonHref="/personal/notas"
									colorScheme="warning"
									isEmpty={!personalData?.notes.total}
									emptyMessage="Aún no has creado notas"
								/>

								{/* Grupos de Artículos */}
								<DashboardMetricCard
									icon={FolderOpen}
									title="Grupos de Artículos"
									value={personalData?.groups.total || 0}
									detail={
										personalData?.groups.totalArticles ?
											`${personalData.groups.totalArticles} artículos en grupos`
										:	undefined
									}
									buttonText="Ver Grupos"
									buttonHref="/articulos/grupos"
									colorScheme="secondary"
									isEmpty={!personalData?.groups.total}
									emptyMessage="Aún no has creado grupos"
								/>

								{/* Historial de Trabajos IA */}
								<DashboardMetricCard
									icon={History}
									title="Historial IA"
									value={personalData?.recentJobs.length || 0}
									detail={
										personalData?.recentJobs.length ?
											"Trabajos recientes disponibles"
										:	undefined
									}
									buttonText="Ver Historial"
									buttonHref="/personal/historial_ai"
									colorScheme="accent"
									isEmpty={!personalData?.recentJobs.length}
									emptyMessage="Sin trabajos recientes"
								/>
							</div>
						}
					</StandardCardContent>
				</StandardCard>
			</div>

			{/* Footer Section */}
			<div className="text-center pb-8">
				<StandardText colorShade="subtle" className="mb-1">
					{footerProjectText}
				</StandardText>
			</div>
		</StandardPageBackground>
	);
}
