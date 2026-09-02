//. 📍 app/datos-maestros/dimensiones/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import {
	listDimensions,
	hardDeleteDimension, // <-- NOMBRE CORRECTO DE LA FUNCIÓN
	type FullDimension,
	type HardDeleteDimensionPayload, // <-- NOMBRE CORRECTO DEL TIPO
} from "@/lib/actions/dimension-actions";
import { getPhasesForProject } from "@/lib/actions/preclassification_phases_actions";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import { StandardTabs } from "@/components/ui/StandardTabs/StandardTabs";
import { StandardTabsList } from "@/components/ui/StandardTabs/StandardTabsList";
import { StandardTabsTrigger } from "@/components/ui/StandardTabs/StandardTabsTrigger";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { AlertTriangle, LayoutGrid, Trash2, Plus, Layers } from "lucide-react";
import { DimensionCard } from "./components/DimensionCard"; // Tu componente DimensionCard
import { toast as sonnerToast } from "sonner";
import { useLoading } from "@/contexts/LoadingContext"; // Opcional, si lo usas
// Validación de modificación por fase se hará vía fetch a la ruta API
//#endregion ![head]

// No specific types defined directly in this file, they are imported or inline.
// //#region [def] - 📦 TYPES 📦
// //#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
// Definir el tipo de fase para TypeScript
type Phase = {
	id: string;
	name: string;
	phase_number: number;
	status: "active" | "inactive" | "completed" | "annulled";
	project_id: string;
	created_at: string;
	description: string | null;
};

export default function DimensionesPage() {
	const t = useTranslations("datosMaestrosPages.dimensionesListPage");
	const router = useRouter();
	const searchParams = useSearchParams();
	const { proyectoActual, loadingProyectos } = useAuth();
	//#region [sub] - 🧰 HELPER FUNCTIONS & LOGIC 🧰
	useLoading(); // Opcional para feedback global

	// Estados para fases
	const [phases, setPhases] = useState<Phase[]>([]);
	const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
	const [loadingPhases, setLoadingPhases] = useState(true);

	// Estados para dimensiones
	const [dimensions, setDimensions] = useState<FullDimension[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState<string | null>(null); // string: ID de la dimensión borrándose
	const [error, setError] = useState<string | null>(null);
	const [dialogToDelete, setDialogToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [restrictionDialog, setRestrictionDialog] = useState<{
		action: "edit" | "delete";
		name: string;
		reason: string;
	} | null>(null);

	const puedeGestionarDimensiones =
		proyectoActual?.permissions?.can_manage_master_data || false;

	// Función para cargar las fases del proyecto
	const cargarFases = useCallback(async () => {
		if (!proyectoActual?.id) {
			if (!loadingProyectos) {
				setPhases([]);
				setActivePhaseId(null);
			}
			setLoadingPhases(false);
			return;
		}

		setLoadingPhases(true);
		try {
			const resultado = await getPhasesForProject(proyectoActual.id);
			if (resultado.data && !resultado.error) {
				setPhases(resultado.data as any);
				// Establecer la fase activa desde la URL o la primera fase disponible
				const phaseFromUrl = searchParams.get("phase");
				if (phaseFromUrl && resultado.data.find((p) => p.id === phaseFromUrl)) {
					setActivePhaseId(phaseFromUrl);
				} else if (resultado.data.length > 0) {
					// Priorizar fase activa, luego la primera disponible
					const activePhase = resultado.data.find((p) => p.status === "active");
					setActivePhaseId(activePhase?.id || resultado.data[0].id);
				}
			} else {
				setPhases([]);
				setActivePhaseId(null);
				if (resultado.error) {
					sonnerToast.error(t("toastErrorLoadingPhasesTitle"), {
						description: resultado.error.message,
					});
				}
			}
		} catch (err) {
			const errorMsg =
				err instanceof Error ? err.message : t("unknownError");
			setPhases([]);
			setActivePhaseId(null);
			sonnerToast.error(t("toastErrorUnexpectedTitle"), { description: errorMsg });
		} finally {
			setLoadingPhases(false);
		}
	}, [proyectoActual?.id, loadingProyectos, searchParams, t]);

	// Función para cargar dimensiones de una fase específica
	const cargarDimensiones = useCallback(async (phaseId: string) => {
		if (!phaseId) {
			setDimensions([]);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(null);
		try {
			const resultado = await listDimensions(phaseId);
			if (resultado.success) {
				setDimensions(resultado.data);
			} else {
				setError(resultado.error || t("errorLoadingDimensionsFallback"));
				sonnerToast.error(t("toastErrorLoadingDimensionsTitle"), {
					description: resultado.error,
				});
			}
		} catch (err) {
			const errorMsg =
				err instanceof Error ? err.message : t("unknownError");
			setError(t("errorUnexpectedLoadingDimensions", { message: errorMsg }));
			sonnerToast.error(t("toastErrorUnexpectedTitle"), { description: errorMsg });
		} finally {
			setIsLoading(false);
		}
	}, [t]);

	// Función para manejar el cambio de pestaña
	const handleTabChange = useCallback((phaseId: string) => {
		setActivePhaseId(phaseId);
		// Actualizar la URL para mantener el estado
		const newUrl = new URL(window.location.href);
		newUrl.searchParams.set("phase", phaseId);
		window.history.replaceState({}, "", newUrl.toString());
	}, []);

	// Efecto para cargar las fases cuando cambia el proyecto
	useEffect(() => {
		if (proyectoActual?.id || !loadingProyectos) {
			cargarFases();
		}
	}, [proyectoActual?.id, loadingProyectos, cargarFases]);

	// Efecto para cargar dimensiones cuando cambia la fase activa
	useEffect(() => {
		if (activePhaseId) {
			cargarDimensiones(activePhaseId);
		} else {
			setDimensions([]);
			setIsLoading(false);
		}
	}, [activePhaseId, cargarDimensiones]);

	const handleCrearDimension = () => {
		// Incluir la fase activa en la URL de creación
		const url =
			activePhaseId ?
				`/datos-maestros/dimensiones/crear?phase=${activePhaseId}`
			:	"/datos-maestros/dimensiones/crear";
		router.push(url);
	};

	const verifyCanModify = useCallback(async (): Promise<{
		allowed: boolean;
		reason?: string;
	}> => {
		if (!activePhaseId) {
			return { allowed: false, reason: t("noActivePhaseReason") };
		}
		try {
			const res = await fetch(`/api/phases/${activePhaseId}/can-modify`, {
				method: "GET",
			});
			if (!res.ok) {
				return {
					allowed: false,
					reason: t("verificationErrorReason", { status: res.status }),
				};
			}
			const json: {
				success: boolean;
				data?: { allowed: boolean; reason?: string };
				error?: string;
			} = await res.json();
			if (!json.success) {
				return {
					allowed: false,
					reason:
						json.error || t("couldNotVerifyBatchesReason"),
				};
			}
			return (
				json.data ?? {
					allowed: false,
					reason: t("invalidServerResponseReason"),
				}
			);
		} catch (e) {
			const msg = e instanceof Error ? e.message : t("unknownError");
			return {
				allowed: false,
				reason: t("couldNotVerifyBatchesWithMessage", { message: msg }),
			};
		}
	}, [activePhaseId, t]);

	const handleEditarDimension = async (
		dimensionId: string,
		dimensionName: string,
	) => {
		const check = await verifyCanModify();
		if (!check.allowed) {
			setRestrictionDialog({
				action: "edit",
				name: dimensionName,
				reason: check.reason || t("actionNotAllowedReason"),
			});
			return;
		}
		// Incluir la fase activa en la URL de edición
		const url =
			activePhaseId ?
				`/datos-maestros/dimensiones/${dimensionId}/modificar?phase=${activePhaseId}`
			:	`/datos-maestros/dimensiones/${dimensionId}/modificar`;
		router.push(url);
	};

	const handleVerDimension = (dimensionId: string) => {
		// Incluir la fase activa en la URL de visualización
		const url =
			activePhaseId ?
				`/datos-maestros/dimensiones/${dimensionId}/ver?phase=${activePhaseId}`
			:	`/datos-maestros/dimensiones/${dimensionId}/ver`;
		router.push(url);
	};

	// --- FUNCIÓN handleEliminarDimension ACTUALIZADA ---
	const handleEliminarDimension = async (
		dimensionId: string,
		dimensionName: string,
	) => {
		if (!proyectoActual?.id || !puedeGestionarDimensiones) {
			sonnerToast.error(t("toastActionNotAllowedTitle"), {
				description: t("toastActionNotAllowedDescription"),
			});
			return;
		}
		const check = await verifyCanModify();
		if (!check.allowed) {
			setRestrictionDialog({
				action: "delete",
				name: dimensionName,
				reason: check.reason || t("actionNotAllowedReason"),
			});
			return;
		}
		setDialogToDelete({ id: dimensionId, name: dimensionName });
	};

	const handleConfirmDelete = async () => {
		if (!dialogToDelete || !proyectoActual?.id) return;

		const { id: dimensionId, name: dimensionName } = dialogToDelete;

		setIsDeleting(dimensionId);

		try {
			const payload: HardDeleteDimensionPayload = {
				dimensionId: dimensionId,
				projectId: proyectoActual.id,
			};
			const resultado = await hardDeleteDimension(payload);

			if (resultado.success) {
				sonnerToast.success(t("toastDeletedSuccess", { name: dimensionName }));
				// Actualización optimista: removemos la dimensión del estado local inmediatamente.
				setDimensions((dims) => dims.filter((d) => d.id !== dimensionId));
			} else {
				sonnerToast.error(t("toastErrorDeletingTitle"), {
					description: resultado.error,
				});
			}
		} catch (error) {
			sonnerToast.error(t("toastErrorUnexpectedTitle"), {
				description:
					error instanceof Error ?
						error.message
					:	t("unknownErrorLong"),
			});
		} finally {
			setIsDeleting(null);
			setDialogToDelete(null);
		}
	};
	// --- FIN FUNCIÓN ACTUALIZADA ---
	//#endregion ![sub]

	//#region [render] - 🎨 RENDER SECTION 🎨
	if (isLoading || (loadingProyectos && !proyectoActual?.id && !error)) {
		return (
			<div className="p-4 md:p-6 lg:p-8">
				<div
					style={{
						minHeight: "80vh",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}>
					<SustratoLoadingLogo
						showText
						text={
							loadingProyectos ?
								t("loadingMasterData")
							:	t("loadingDimensions")
						}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-start mb-6">
				<StandardPageTitle
					title={t("pageTitle")}
					subtitle={t("pageSubtitle")}
					description={t("pageDescription")}
					mainIcon={LayoutGrid}
					showBackButton={{ href: "/datos-maestros" }}
					breadcrumbs={[
						{ label: t("breadcrumbDatosMaestros"), href: "/datos-maestros" },
						{ label: t("breadcrumbDimensiones") },
					]}
				/>
				{puedeGestionarDimensiones && proyectoActual?.id && activePhaseId && (
					<StandardButton
						onClick={handleCrearDimension}
						colorScheme="primary"
						leftIcon={Plus}>
						{t("createDimensionButton")}
					</StandardButton>
				)}
			</div>

			{/* Estado de carga de fases */}
			{loadingPhases && (
				<div className="flex justify-center items-center py-12">
					<SustratoLoadingLogo />
				</div>
			)}

			{/* Error general */}
			{error && (
				<StandardCard
					colorScheme="primary"
					accentPlacement="none"
					hasOutline={false}
					shadow="none"
					disableShadowHover={true}
					styleType="subtle"
					className="my-6">
					<div className="flex items-start gap-3">
						<StandardIcon>
							<AlertTriangle className="h-5 w-5 mt-0.5 text-danger-fg" />
						</StandardIcon>
						<div>
							<StandardText weight="bold" colorScheme="danger">
								{t("errorLoadingTitle")}
							</StandardText>
							<StandardText size="sm" className="text-danger-fg/90 mt-1">
								{error}
							</StandardText>
						</div>
					</div>
				</StandardCard>
			)}

			{/* Proyecto no seleccionado */}
			{!proyectoActual?.id && !loadingProyectos && !error && (
				<StandardCard
					colorScheme="primary"
					accentPlacement="none"
					hasOutline={false}
					shadow="none"
					disableShadowHover={true}
					styleType="subtle"
					className="my-6 p-6 text-center">
					<StandardText preset="subheading" weight="medium" className="mb-2">
						{t("projectNotSelectedTitle")}
					</StandardText>
					<StandardText colorScheme="neutral">
						{t("projectNotSelectedDescription")}
					</StandardText>
				</StandardCard>
			)}

			{/* Sin fases creadas */}
			{proyectoActual?.id &&
				!loadingPhases &&
				phases.length === 0 &&
				!error && (
					<StandardEmptyState
						icon={Layers}
						title={t("noPhasesTitle")}
						description={
							puedeGestionarDimensiones ?
								t("noPhasesDescriptionCanManage")
							:	t("noPhasesDescriptionCannotManage")
						}
						action={
							puedeGestionarDimensiones ?
								<StandardButton
									onClick={() => router.push("/datos-maestros/fases/crear")}
									colorScheme="primary"
									leftIcon={Plus}>
									{t("createFirstPhaseButton")}
								</StandardButton>
							:	undefined
						}
					/>
				)}

			{/* Sistema de pestañas por fases */}
			{proyectoActual?.id && !loadingPhases && phases.length > 0 && !error && (
				<StandardTabs
					value={activePhaseId || ""}
					onValueChange={handleTabChange}
					colorScheme="primary"
					styleType="line"
					size="md"
					className="w-full">
					{/* Lista de pestañas */}
					<StandardTabsList
						className="grid w-full"
						style={{
							gridTemplateColumns: `repeat(${phases.length}, minmax(0, 1fr))`,
						}}>
						{phases.map((phase) => {
							// Contar dimensiones por fase (esto se podría optimizar con una consulta separada)
							const dimensionCount =
								phase.id === activePhaseId ? dimensions.length : 0;
							return (
								<StandardTabsTrigger
									key={phase.id}
									value={phase.id}
									className="flex flex-col gap-1 py-3">
									<span className="font-medium">{phase.name}</span>
									<span className="text-xs opacity-70">
										{t("phaseNumberLabel", { number: phase.phase_number })}
										{phase.id === activePhaseId &&
											t("dimensionsCountSuffix", { count: dimensionCount })}
									</span>
								</StandardTabsTrigger>
							);
						})}
					</StandardTabsList>

					{/* Contenido de cada pestaña */}
					{phases.map((phase) => (
						<TabsPrimitive.Content
							key={phase.id}
							value={phase.id}
							className="mt-6">
							{/* Estado de carga de dimensiones */}
							{isLoading && (
								<div className="flex justify-center items-center py-12">
									<SustratoLoadingLogo />
								</div>
							)}

							{/* Sin dimensiones en esta fase */}
							{!isLoading && dimensions.length === 0 && (
								<StandardEmptyState
									icon={LayoutGrid}
									title={t("noDimensionsInPhaseTitle", { phaseName: phase.name })}
									description={
										puedeGestionarDimensiones ?
											t("noDimensionsDescriptionCanManage", { phaseName: phase.name })
										:	t("noDimensionsDescriptionCannotManage")
									}
									action={
										puedeGestionarDimensiones ?
											<StandardButton
												onClick={handleCrearDimension}
												colorScheme="primary"
												leftIcon={Plus}>
												{t("createFirstDimensionButton")}
											</StandardButton>
										:	undefined
									}
								/>
							)}

							{/* Grid de dimensiones */}
							{!isLoading && dimensions.length > 0 && (
								<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
									{dimensions.map((dim) => (
										<DimensionCard
											key={dim.id}
											dimension={dim}
											onEdit={() => handleEditarDimension(dim.id, dim.name)}
											onDelete={() => handleEliminarDimension(dim.id, dim.name)}
											onViewDetails={() => handleVerDimension(dim.id)}
											canManage={puedeGestionarDimensiones}
											isBeingDeleted={isDeleting === dim.id}
										/>
									))}
								</div>
							)}
						</TabsPrimitive.Content>
					))}
				</StandardTabs>
			)}

			{/* Diálogo de confirmación destructiva */}
			<StandardDialog
				open={!!dialogToDelete}
				onOpenChange={(open: boolean) => {
					if (!open) setDialogToDelete(null);
				}}>
				<StandardDialog.Content colorScheme="danger" size="md">
					<StandardDialog.Header>
						<StandardDialog.Title>{t("deleteDialogTitle")}</StandardDialog.Title>
					</StandardDialog.Header>
					<StandardDialog.Body>
						<StandardDialog.Description>
							{dialogToDelete ?
								t("deleteDialogDescription", { name: dialogToDelete.name })
							:	""}
						</StandardDialog.Description>
					</StandardDialog.Body>
					<StandardDialog.Footer>
						<StandardDialog.Close asChild>
							<StandardButton
								styleType="outline"
								onClick={() => setDialogToDelete(null)}>
								{t("cancelButton")}
							</StandardButton>
						</StandardDialog.Close>
						<StandardButton
							colorScheme="danger"
							onClick={handleConfirmDelete}
							loading={isDeleting === dialogToDelete?.id}
							leftIcon={Trash2}>
							{t("deleteButton")}
						</StandardButton>
					</StandardDialog.Footer>
				</StandardDialog.Content>
			</StandardDialog>

			{/* Diálogo de restricción para edición/eliminación cuando hay lotes avanzados */}
			<StandardDialog
				open={!!restrictionDialog}
				onOpenChange={(open: boolean) => {
					if (!open) setRestrictionDialog(null);
				}}>
				<StandardDialog.Content colorScheme="warning" size="md">
					<StandardDialog.Header>
						<StandardDialog.Title>
							{restrictionDialog?.action === "edit" ?
								t("restrictionCannotEditTitle")
							:	t("restrictionCannotDeleteTitle")}
						</StandardDialog.Title>
					</StandardDialog.Header>
					<StandardDialog.Body>
						<StandardDialog.Description>
							{restrictionDialog?.reason ||
								t("restrictionDefaultReason")}
						</StandardDialog.Description>
					</StandardDialog.Body>
					<StandardDialog.Footer>
						<StandardDialog.Close asChild>
							<StandardButton colorScheme="warning">{t("understoodButton")}</StandardButton>
						</StandardDialog.Close>
					</StandardDialog.Footer>
				</StandardDialog.Content>
			</StandardDialog>
		</div>
	);
	//#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Considerar implementar drag-and-drop para reordenar dimensiones.
// Añadir paginación o carga infinita si la lista de dimensiones puede crecer mucho.
// Refinar el feedback visual durante las operaciones (ej. shimmer/esqueletos para tarjetas).
//#endregion ![todo]
