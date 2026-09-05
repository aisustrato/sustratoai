//. 📍 app/datos-maestros/fases-preclasificacion/[id]/ver/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/auth-provider";
import FaseForm from "../../components/FaseForm";
import { getPhasesForProject } from "@/lib/actions/preclassification_phases_actions";
import { exportPreclassificationAudit } from "@/lib/actions/preclassification-audit-export-actions";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { StandardText } from "@/components/ui/StandardText";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import {
	Edit,
	ArrowLeft,
	AlertCircle,
	RotateCw,
	CheckCircle2,
	Network,
	ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function VerFasePage() {
	const router = useRouter();
	const t = useTranslations("datosMaestrosPages.fasesVerPage");
	const { id } = useParams<{ id: string }>();
	const { proyectoActual } = useAuth();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [exportandoAuditoria, setExportandoAuditoria] = useState(false);
	const [fase, setFase] = useState<{
		id: string;
		name: string;
		description: string | null;
		created_at: string;
		phase_number: number;
		project_id: string;
		status: "completed" | "active" | "inactive" | "annulled";
	} | null>(null);

	// Cargar datos de la fase
	useEffect(() => {
		const cargarFase = async () => {
			if (!proyectoActual?.id) {
				setError(t("errorNoProject"));
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const { data: fases, error: fetchError } = await getPhasesForProject(
					proyectoActual.id,
				);

				if (fetchError) {
					throw new Error(fetchError.message || t("errorLoadingPhase"));
				}

				const faseEncontrada = fases?.find((f) => f.id === id);

				if (!faseEncontrada) {
					throw new Error(t("errorPhaseNotFound"));
				}

				setFase(faseEncontrada as any);

				// Mostrar toast de éxito solo si no hay error
				toast.success(t("toastLoadedTitle"), {
					description: t("toastLoadedDescription"),
					icon: <CheckCircle2 className="h-5 w-5 text-success" />,
				});
			} catch (err) {
				console.error("Error cargando la fase:", err);
				const errorMsg =
					err instanceof Error ?
						err.message
					:	t("errorUnknownLoading");

				// Mostrar toast de error
				toast.error(t("toastErrorTitle"), {
					description: errorMsg,
					icon: <AlertCircle className="h-5 w-5 text-destructive" />,
				});

				setError(errorMsg);
			} finally {
				setLoading(false);
			}
		};

		cargarFase();
	}, [id, proyectoActual?.id, t]);

	// Fase 4 de la auditoría append-only con SHA-256: descarga con un solo
	// gesto de todo el rastro verificable de la fase (dimensiones + versiones,
	// historial completo de revisiones, interacciones con la IA, traducciones
	// e ingesta), hasheado y registrado en data_export_registry.
	const handleDescargarAuditoria = async () => {
		if (!id) return;
		setExportandoAuditoria(true);
		try {
			const result = await exportPreclassificationAudit(id);
			if (!result.success) {
				throw new Error(result.error);
			}

			const { bundle, sha256, fileName } = result.data;
			const contenido = JSON.stringify({ sha256, bundle }, null, 2);
			const blob = new Blob([contenido], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			toast.success(t("downloadAuditToastTitle"), {
				description: t("downloadAuditToastDescription", {
					reviewCount: bundle.reviews.length,
					dimensionCount: bundle.dimensions.length,
					hashPrefix: sha256.substring(0, 12),
				}),
				icon: <CheckCircle2 className="h-5 w-5 text-success" />,
			});
		} catch (err) {
			const errorMsg =
				err instanceof Error ? err.message : t("errorUnknownLoading");
			toast.error(t("downloadAuditErrorToastTitle"), {
				description: errorMsg,
				icon: <AlertCircle className="h-5 w-5 text-destructive" />,
			});
		} finally {
			setExportandoAuditoria(false);
		}
	};

	if (loading) {
		return (
			<StandardPageBackground>
				<div className="flex items-center justify-center min-h-[60vh]">
					<SustratoLoadingLogo size={64} />
				</div>
			</StandardPageBackground>
		);
	}

	if (error) {
		return (
			<StandardPageBackground>
				<div className="max-w-2xl mx-auto my-8">
					<StandardCard className="p-6">
						<div className="flex flex-col items-center gap-4 text-center">
							<StandardIcon size="xl" colorScheme="danger">
								<AlertCircle />
							</StandardIcon>
							<StandardText variant="h4" className="text-center mb-2">
								{t("errorTitle")}
							</StandardText>
							<StandardText className="text-center mb-6">{error}</StandardText>
							<StandardButton
								onClick={() => window.location.reload()}
								colorScheme="primary"
								styleType="solid"
								leftIcon={RotateCw}
								aria-label={t("retryButton")}>
								{t("retryButton")}
							</StandardButton>
						</div>
					</StandardCard>
				</div>
			</StandardPageBackground>
		);
	}

	if (!fase) {
		return (
			<StandardPageBackground>
				<div className="max-w-2xl mx-auto my-8">
					<StandardCard className="p-6">
						<div className="flex flex-col items-center gap-4 text-center">
							<StandardIcon size="xl" colorScheme="warning">
								<AlertCircle />
							</StandardIcon>
							<StandardText variant="h4" className="text-center mb-2">
								{t("notFoundTitle")}
							</StandardText>
							<StandardText className="text-center mb-6">
								{t("notFoundDescription")}
							</StandardText>
							<StandardButton
								onClick={() => router.back()}
								colorScheme="primary"
								styleType="outline"
								leftIcon={ArrowLeft}
								aria-label={t("backButton")}>
								{t("backButton")}
							</StandardButton>
						</div>
					</StandardCard>
				</div>
			</StandardPageBackground>
		);
	}

	const puedeEditar =
		proyectoActual?.permissions?.can_manage_master_data || false;

	return (
		<StandardPageBackground variant="gradient">
			<div className="container mx-auto py-6">
				<div className="space-y-6">
					<StandardPageTitle
						title={t("pageTitle", { name: fase.name })}
						subtitle={t("pageSubtitle")}
						description={t("pageDescription")}
						mainIcon={Network}
						showBackButton={{ href: "/datos-maestros/fases-preclasificacion" }}
						breadcrumbs={[
							{ label: t("breadcrumbDatosMaestros"), href: "/datos-maestros" },
							{
								label: t("breadcrumbFases"),
								href: "/datos-maestros/fases-preclasificacion",
							},
							{ label: fase.name },
						]}
						actions={
							<div className="flex gap-2">
								<StandardButton
									styleType="outline"
									colorScheme="secondary"
									leftIcon={ShieldCheck}
									loading={exportandoAuditoria}
									loadingText={t("downloadAuditButtonLoading")}
									onClick={handleDescargarAuditoria}
									aria-label={t("downloadAuditButton")}>
									{t("downloadAuditButton")}
								</StandardButton>
								{puedeEditar && (
									<StandardButton
										styleType="solid"
										colorScheme="primary"
										leftIcon={Edit}
										onClick={() =>
											router.push(
												`/datos-maestros/fases-preclasificacion/${id}/editar`,
											)
										}
										aria-label={t("editButton")}>
										{t("editButton")}
									</StandardButton>
								)}
							</div>
						}
					/>

					<FaseForm
						modo="ver"
						proyectoId={proyectoActual?.id || ""}
						valoresIniciales={{
							name: fase.name,
							description: fase.description || "",
							phase_number: fase.phase_number,
							status: fase.status,
						}}
					/>
				</div>
			</div>
		</StandardPageBackground>
	);
}
