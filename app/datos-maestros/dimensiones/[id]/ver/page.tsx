//. 📍 app/datos-maestros/dimensiones/[id]/ver/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import {
	listDimensions, // Usaremos esta y filtraremos, o podríamos crear getDimensionDetails
	type FullDimension,
} from "@/lib/actions/dimension-actions";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { AlertTriangle, ArrowLeft, Edit, Eye } from "lucide-react"; // Eye para ver
import {
	DimensionForm,
	type DimensionFormValues,
} from "../../components/DimensionForm"; // Ajustar ruta si es necesario
import { toast as sonnerToast } from "sonner"; // Aunque no hay submits, por si hay errores de carga
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// No specific types defined directly in this file.
// Types are imported or inferred.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function VerDimensionPage() {
	//#region [sub] - 🧰 HOOKS, STATE, EFFECTS & HELPER FUNCTIONS 🧰
	const t = useTranslations("datosMaestrosPages.dimensionesVerPage");
	const router = useRouter();
	const params = useParams();
	const searchParams = useSearchParams();
	const dimensionId = params?.id ? String(params.id) : "";

	// Obtener la fase activa desde la URL
	const activePhaseId = searchParams.get("phase") || "";

	const { proyectoActual, loadingProyectos } = useAuth();

	const [dimensionActual, setDimensionActual] = useState<FullDimension | null>(
		null,
	);
	const [isPageLoading, setIsPageLoading] = useState(true);
	const [errorPage, setErrorPage] = useState<string | null>(null);

	const puedeGestionarDimensiones =
		proyectoActual?.permissions?.can_manage_master_data || false;

	const cargarDimension = useCallback(async () => {
		if (!proyectoActual?.id || !dimensionId || !activePhaseId) {
			if (!loadingProyectos) {
				setErrorPage(
					!dimensionId ? t("idNotSpecified")
					: !activePhaseId ? t("phaseNotSpecified")
					: t("projectNotSelected"),
				);
			}
			setIsPageLoading(false);
			setDimensionActual(null);
			return;
		}

		setIsPageLoading(true);
		setErrorPage(null);
		setDimensionActual(null);

		try {
			const resultado = await listDimensions(activePhaseId); // Usar phaseId en lugar de projectId
			if (resultado.success) {
				const dim = resultado.data.find((d) => d.id === dimensionId);
				if (dim) {
					setDimensionActual(dim);
				} else {
					setErrorPage(
						t("notFoundInActivePhase", { id: dimensionId }),
					);
				}
			} else {
				setErrorPage(
					resultado.error || t("errorLoadingDataFallback"),
				);
				sonnerToast.error(t("errorLoadingDataTitle"), {
					description: resultado.error,
				});
			}
		} catch (err) {
			const errorMsg =
				err instanceof Error ? err.message : t("unknownError");
			setErrorPage(t("unexpectedErrorLoading", { message: errorMsg }));
			sonnerToast.error(t("unexpectedErrorTitle"), { description: errorMsg });
		} finally {
			setIsPageLoading(false);
		}
	}, [
		proyectoActual?.id,
		dimensionId,
		activePhaseId,
		loadingProyectos,
		setErrorPage,
		setIsPageLoading,
		setDimensionActual,
		t,
	]);

	useEffect(() => {
		if ((proyectoActual?.id && dimensionId) || !loadingProyectos) {
			cargarDimension();
		}
	}, [proyectoActual?.id, dimensionId, loadingProyectos, cargarDimension]);

	const handleVolver = () => {
		// Incluir la fase activa en la URL de regreso
		const url =
			activePhaseId ?
				`/datos-maestros/dimensiones?phase=${activePhaseId}`
			:	"/datos-maestros/dimensiones";
		router.push(url);
	};

	const handleEditar = () => {
		if (dimensionId) {
			// Incluir la fase activa en la URL de edición
			const url =
				activePhaseId ?
					`/datos-maestros/dimensiones/${dimensionId}/modificar?phase=${activePhaseId}`
				:	`/datos-maestros/dimensiones/${dimensionId}/modificar`;
			router.push(url);
		}
	};

	const valoresFormIniciales: DimensionFormValues | undefined =
		dimensionActual ?
			({
				name: dimensionActual.name,
				phaseId: dimensionActual.phase_id || "", // Incluir el phaseId de la dimensión
				type: dimensionActual.type as "finite" | "open",
				description: dimensionActual.description || "",
				options: dimensionActual.options.map((o) => ({
					id: o.id,
					value: o.value,
					ordering: o.ordering,
				})),
				questions: dimensionActual.questions.map((q) => ({
					id: q.id,
					question: q.question,
					ordering: q.ordering,
				})),
				examples: dimensionActual.examples.map((e) => ({
					id: e.id,
					example: e.example,
				})),
			} as any)
		:	undefined;
	//#endregion ![sub]

	//#region [render] - 🎨 RENDER SECTION 🎨

	if (isPageLoading || (loadingProyectos && !dimensionActual && !errorPage)) {
		return (
			<div
				style={{
					minHeight: "80vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}>
				<div
					style={{
						minHeight: "80vh",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}>
					<SustratoLoadingLogo
						showText
						text={t("loadingDetail")}
					/>
				</div>
			</div>
		);
	}

	if (errorPage) {
		return (
			<div>
				<div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[70vh]">
					<StandardCard
						colorScheme="danger"
						className="max-w-lg w-full"
						styleType="subtle"
						disableShadowHover={true}
						hasOutline={false} // No border prop originally
						accentPlacement="none" // No border prop originally
					>
						<StandardCard.Header className="items-center flex flex-col text-center">
							<StandardIcon>
								<AlertTriangle className="h-12 w-12 text-danger-fg mb-4" />
							</StandardIcon>
							<StandardText size="lg" weight="bold" colorScheme="danger">
								{t("errorLoadingDimensionTitle")}
							</StandardText>
						</StandardCard.Header>
						<StandardCard.Content className="text-center">
							<StandardText>{errorPage}</StandardText>
						</StandardCard.Content>
						<StandardCard.Footer className="flex justify-center">
							<StandardButton
								onClick={handleVolver}
								styleType="outline"
								colorScheme="danger">
								<StandardIcon>
									<ArrowLeft />
								</StandardIcon>
								{t("backToDimensionsButton")}
							</StandardButton>
						</StandardCard.Footer>
					</StandardCard>
				</div>
			</div>
		);
	}

	if (!dimensionActual || !valoresFormIniciales) {
		return (
			<div
				style={{
					minHeight: "80vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}>
				<StandardCard
					colorScheme="warning"
					className="text-center p-6"
					styleType="subtle"
					disableShadowHover={true}
					hasOutline={false} // No border prop originally
					accentPlacement="none" // No border prop originally
				>
					<StandardText size="lg" weight="semibold">
						{t("notAvailableTitle")}
					</StandardText>
					<StandardText colorScheme="neutral" className="mt-2">
						{t("notAvailableDescription")}
					</StandardText>
					<StandardButton
						onClick={handleVolver}
						styleType="outline"
						className="mt-4">
						<StandardIcon>
							<ArrowLeft />
						</StandardIcon>
						{t("backToDimensionsButton")}
					</StandardButton>
				</StandardCard>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
			<div className="max-w-3xl mx-auto">
				{" "}
				{/* Centrar contenido */}
				<StandardPageTitle
					title={t("pageTitle", { name: dimensionActual.name })}
					subtitle={t("pageSubtitle")}
					mainIcon={Eye} // Icono para ver
					breadcrumbs={[
						{ label: t("breadcrumbDatosMaestros"), href: "/datos-maestros" },
						{
							label: t("breadcrumbDimensiones"),
							href:
								activePhaseId ?
									`/datos-maestros/dimensiones?phase=${activePhaseId}`
								:	"/datos-maestros/dimensiones",
						},
						{ label: t("breadcrumbVer") },
					]}
					showBackButton={{
						href:
							activePhaseId ?
								`/datos-maestros/dimensiones?phase=${activePhaseId}`
							:	"/datos-maestros/dimensiones",
					}}
					actions={
						// Botón de editar como una acción del PageTitle
						puedeGestionarDimensiones ?
							<StandardButton
								onClick={handleEditar}
								colorScheme="secondary"
								styleType="outline"
								size="sm"
								leftIcon={Edit}>
								{t("editButton")}
							</StandardButton>
						:	undefined
					}
				/>
				<StandardCard
					className="mt-6"
					accentPlacement="top"
					colorScheme="primary" // Rule: Main form card colorScheme is secondary
					accentColorScheme="neutral" // Rule: Main form card accent for view is neutral
					shadow="md" // Rule: Main form card shadow is md by default
					disableShadowHover={true}
					styleType="subtle"
					// styleType and hasOutline removed to use default or theme-defined values
				>
					<DimensionForm
						modo="ver" // Modo solo lectura
						valoresIniciales={valoresFormIniciales}
						// No se necesita onSubmit para el modo "ver"
					/>
				</StandardCard>
			</div>
		</div>
	);
	//#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration.
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// TODO: Consider if any specific actions or information should be added to this view page.
// For example, linking to related entities or providing more detailed explanations.
//#endregion ![todo]
