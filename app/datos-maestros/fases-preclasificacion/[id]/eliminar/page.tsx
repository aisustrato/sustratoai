//. 📍 app/datos-maestros/fases-preclasificacion/[id]/eliminar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/auth-provider";
import {
	getPhasesForProject,
	deletePhase,
} from "@/lib/actions/preclassification_phases_actions";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import {
	AlertCircle,
	Trash2,
	ArrowLeft,
	RotateCw,
	Loader2,
	Network,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function EliminarFasePage() {
	const router = useRouter();
	const t = useTranslations("datosMaestrosPages.fasesEliminarPage");
	const { id } = useParams<{ id: string }>();
	const { proyectoActual } = useAuth();
	const { toast } = useToast();

	const [loading, setLoading] = useState(true);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// Definición local de la interfaz Phase basada en la estructura de la base de datos
	type PhaseStatus = "inactive" | "active" | "completed" | "annulled";

	const [fase, setFase] = useState<{
		id: string;
		name: string;
		status: PhaseStatus;
		project_id: string;
		phase_number: number;
		description: string | null;
		created_at: string;
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

				// Asegurar que el status sea uno de los permitidos
				const faseValidada = {
					...faseEncontrada,
					status:
						(
							faseEncontrada.status &&
							["inactive", "active", "completed", "annulled"].includes(
								faseEncontrada.status,
							)
						) ?
							(faseEncontrada.status as PhaseStatus)
						:	"inactive",
				} as any;
				setFase(faseValidada);
			} catch (err) {
				console.error("Error cargando la fase:", err);
				setError(
					err instanceof Error ?
						err.message
					:	t("errorUnknownLoading"),
				);
			} finally {
				setLoading(false);
			}
		};

		cargarFase();
	}, [id, proyectoActual?.id, t]);

	const handleEliminar = async () => {
		if (!fase) return;

		try {
			setDeleting(true);

			const { error } = await deletePhase(fase.id);

			if (error) {
				throw new Error(error.message || t("errorDeletingPhase"));
			}

			toast({
				title: t("toastDeletedTitle"),
				description: t("toastDeletedDescription", { name: fase.name }),
			});

			// Redirigir a la lista de fases
			router.push("/datos-maestros/fases-preclasificacion");
		} catch (err) {
			console.error("Error al eliminar la fase:", err);
			setError(
				err instanceof Error ?
					err.message
				:	t("errorUnknownDeleting"),
			);
		} finally {
			setDeleting(false);
		}
	};

	const handleCancel = () => {
		router.back();
	};

	const handleDelete = handleEliminar;

	if (loading) {
		return (
			<StandardPageBackground className="flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<StandardText>{t("loadingText")}</StandardText>
				</div>
			</StandardPageBackground>
		);
	}

	if (error) {
		return (
			<StandardPageBackground variant="gradient">
				<StandardCard className="max-w-2xl mx-auto">
					<div className="p-6 space-y-4 text-center">
						<StandardIcon>
							<AlertCircle className="h-12 w-12 text-destructive mx-auto" />
						</StandardIcon>
						<StandardText variant="h4" className="text-destructive">
							{t("errorTitle")}
						</StandardText>
						<StandardText className="text-muted-foreground">
							{error}
						</StandardText>
						<div className="pt-4">
							<StandardButton
								onClick={() => window.location.reload()}
								styleType="solid"
								colorScheme="primary"
								leftIcon={RotateCw}
								aria-label={t("retryButton")}>
								{t("retryButton")}
							</StandardButton>
						</div>
					</div>
				</StandardCard>
			</StandardPageBackground>
		);
	}

	if (!fase) {
		return (
			<StandardPageBackground variant="gradient">
				<StandardCard className="max-w-2xl mx-auto">
					<div className="p-6 space-y-4 text-center">
						<StandardIcon>
							<AlertCircle className="h-12 w-12 text-warning mx-auto" />
						</StandardIcon>
						<StandardText variant="h4" className="text-warning">
							{t("notFoundTitle")}
						</StandardText>
						<StandardText className="text-muted-foreground">
							{t("notFoundDescription")}
						</StandardText>
						<div className="pt-4">
							<StandardButton
								onClick={() => router.back()}
								styleType="outline"
								colorScheme="neutral"
								leftIcon={ArrowLeft}
								aria-label={t("backButton")}>
								{t("backButton")}
							</StandardButton>
						</div>
					</div>
				</StandardCard>
			</StandardPageBackground>
		);
	}

	return (
		<StandardPageBackground variant="gradient">
			<div className="container mx-auto py-6">
				<div className="space-y-6">
					<StandardPageTitle
						title={t("pageTitle", { name: fase.name })}
						subtitle={t("pageSubtitle")}
						description={t("pageDescription")}
						mainIcon={Network}
						showBackButton={{
							href: `/datos-maestros/fases-preclasificacion/${id}/ver`,
						}}
						breadcrumbs={[
							{ label: t("breadcrumbDatosMaestros"), href: "/datos-maestros" },
							{
								label: t("breadcrumbFases"),
								href: "/datos-maestros/fases-preclasificacion",
							},
							{
								label: fase.name,
								href: `/datos-maestros/fases-preclasificacion/${id}/ver`,
							},
							{ label: t("breadcrumbEliminar") },
						]}
					/>

					<StandardCard className="max-w-3xl mx-auto">
						<div className="p-6">
							<div className="flex flex-col items-center text-center space-y-6">
								<div className="bg-destructive/10 p-4 rounded-full">
									<AlertCircle className="h-12 w-12 text-destructive" />
								</div>

								<div className="space-y-2">
									<StandardText variant="h3">
										{t("confirmTitle")}
									</StandardText>
									<StandardText className="text-muted-foreground">
										{t("confirmDescription", { name: fase.name })}
									</StandardText>
								</div>

								<div className="bg-muted/50 p-4 rounded-lg w-full text-left space-y-2">
									<StandardText variant="small" className="font-medium">
										{t("detailsLabel")}
									</StandardText>
									<StandardText
										variant="small"
										className="text-muted-foreground">
										{t("nameLabel")}{" "}
										<span className="font-medium text-foreground">
											{fase.name}
										</span>
									</StandardText>
									<StandardText
										variant="small"
										className="text-muted-foreground">
										{t("numberLabel")}{" "}
										<span className="font-medium text-foreground">
											{fase.phase_number}
										</span>
									</StandardText>
									<StandardText
										variant="small"
										className="text-muted-foreground">
										{t("statusLabel")}{" "}
										<span className="font-medium text-foreground">
											{fase.status === "active" ?
												t("statusActive")
											: fase.status === "completed" ?
												t("statusCompleted")
											: fase.status === "annulled" ?
												t("statusAnnulled")
											:	t("statusInactive")}
										</span>
									</StandardText>
								</div>

								<div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
									<StandardButton
										onClick={handleCancel}
										styleType="outline"
										colorScheme="neutral"
										className="flex-1"
										leftIcon={ArrowLeft}
										disabled={deleting}
										aria-label={t("ariaCancel")}>
										{t("cancelButton")}
									</StandardButton>
									<StandardButton
										onClick={handleDelete}
										styleType="solid"
										colorScheme="danger"
										className="flex-1"
										leftIcon={Trash2}
										loading={deleting}
										disabled={deleting}
										aria-label={t("ariaConfirmDelete")}>
										{deleting ? t("deletingButton") : t("deleteButton")}
									</StandardButton>
								</div>
							</div>
						</div>
					</StandardCard>
				</div>
			</div>
		</StandardPageBackground>
	);
}
