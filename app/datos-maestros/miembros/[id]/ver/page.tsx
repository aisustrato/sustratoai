//. 📍 app/datos-maestros/miembros/[id]/ver/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/auth-provider";
import {
	obtenerDetallesMiembroProyecto,
	obtenerRolesDisponiblesProyecto,
	type ProjectMemberDetails,
	type ProjectRoleInfo,
} from "@/lib/actions/member-actions";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { PageHeader } from "@/components/common/page-header";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { ArrowLeft, PenLine, User } from "lucide-react";
import {
	MiembroForm,
	type MiembroFormValues,
} from "@/app/datos-maestros/miembros/components/MiembroForm";

import { StandardText } from "@/components/ui/StandardText";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
//#endregion ![head]

//#region [def] - 📦 SCHEMA, TYPES & PROPS 📦
export type SelectOption = { value: string; label: string };
//> 📝 No custom types or schemas defined outside the component for this page.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function VerMiembroPage() {
  //#region [sub] - 🧰 HOOKS, STATE, LOGIC & HANDLERS 🧰
	const t = useTranslations("datosMaestrosPages.miembrosVerPage");
	const router = useRouter();
	const params = useParams();
	const memberId = params?.id ? String(params.id) : "";
	const { proyectoActual } = useAuth();

	const [isLoading, setIsLoading] = useState(true);
	const [miembro, setMiembro] = useState<ProjectMemberDetails | null>(null);
	const [rolesDisponibles, setRolesDisponibles] = useState<SelectOption[]>([]);
	const [error, setError] = useState<string | null>(null);

	const puedeGestionarMiembros =
		proyectoActual?.permissions?.can_manage_master_data || false;

	const cargarDatosCompletos = useCallback(async () => {
		// No es necesario llamar a setIsLoading(true) aquí si el useEffect que lo llama ya lo hizo
		// o si el estado inicial de isLoading es true.
		// Asegurémonos que se maneje bien desde el useEffect.

		// Si el componente es desmontado mientras esto está corriendo, evitamos errores
		let isMounted = true;

		// Limpiar estados antes de la carga, excepto isLoading que se maneja fuera
		if (isMounted) {
			setError(null);
			setMiembro(null);
			setRolesDisponibles([]);
		}

		if (!proyectoActual?.id) {
			if (isMounted) {
				setError(t("errorNoProject"));
				setIsLoading(false);
			}
			return;
		}
		if (!memberId) {
			if (isMounted) {
				setError(t("errorNoMemberId"));
				setIsLoading(false);
			}
			return;
		}

		try {
			const [resultadoRoles, resultadoMiembro] = await Promise.all([
				obtenerRolesDisponiblesProyecto(proyectoActual.id),
				obtenerDetallesMiembroProyecto(memberId, proyectoActual.id),
			]);

			if (!isMounted) return; // Comprobar antes de actualizar estado

			if (!resultadoRoles.success || !resultadoRoles.data) {
				console.warn(
					"Advertencia al cargar roles para vista de miembro No se pudieron cargar los roles."
				);
			} else {
				const opcionesRoles = resultadoRoles.data.map(
					(rol: ProjectRoleInfo) => ({
						value: rol.id,
						label: rol.role_name,
					})
				);
				setRolesDisponibles(opcionesRoles);
			}

			if (!resultadoMiembro.success) {
				setError(resultadoMiembro.error || t("errorLoadingMemberData"));
			} else if (!resultadoMiembro.data) {
				setError(t("errorMemberNotFound"));
			} else {
				setMiembro(resultadoMiembro.data);
			}
		} catch (err) {
			console.error("Error al cargar datos:", err);
			if (isMounted) {
				setError(t("errorUnexpectedLoading", { message: (err as Error).message }));
			}
		} finally {
			if (isMounted) {
				setIsLoading(false);
			}
		}
		return () => {
			isMounted = false;
		}; // Cleanup function para el useCallback
	}, [proyectoActual?.id, memberId, t]);

	useEffect(() => {
		// Usamos isMounted en cargarDatosCompletos para evitar actualizaciones después de desmontar

		if (proyectoActual?.id && memberId) {
			setIsLoading(true); // Poner isLoading en true ANTES de llamar a cargar
			cargarDatosCompletos();
		} else {
			// Si no hay proyecto o memberId, no estamos cargando activamente desde el servidor.
			// Decidir qué error mostrar y asegurarse que isLoading sea false.
			if (!proyectoActual?.id) {
				setError(t("waitingProjectSelection"));
			} else if (!memberId) {
				setError(t("errorNoMemberId"));
			}
			setIsLoading(false); // Importante: poner a false si no se cumplen las condiciones de carga
		}

		// No es necesaria la limpieza ya que usamos isMounted en cargarDatosCompletos
	}, [proyectoActual?.id, memberId, cargarDatosCompletos, t]);

	const handleVolver = () => {
		router.push("/datos-maestros/miembros");
	};

	const handleEditar = () => {
		router.push(`/datos-maestros/miembros/${memberId}/modificar`);
	};

	const getNombreMiembro = (): string => {
		if (!miembro?.profile) return t("defaultMemberName");
		const { public_display_name, first_name, last_name } = miembro.profile;
		if (public_display_name) return public_display_name;
		if (first_name || last_name)
			return `${first_name || ""} ${last_name || ""}`.trim();
		return (
			miembro.profile?.public_contact_email ||
			t("userIdFallback", { id: miembro.user_id.substring(0, 8) })
		);
	};

	const valoresFormulario: MiembroFormValues | undefined = miembro
		? {
				emailUsuario:
					miembro.profile?.public_contact_email ||
					(miembro.user_id
						? t("unavailableEmailWithId", { id: miembro.user_id.substring(0, 8) })
						: t("unavailableEmail")),
				rolId: miembro.project_role_id || "",
				firstName: miembro.profile?.first_name || "",
				lastName: miembro.profile?.last_name || "",
				displayName: miembro.profile?.public_display_name || "",
				institution: miembro.profile?.primary_institution || "",
				phone: miembro.profile?.contact_phone || "",
				notes: miembro.profile?.general_notes || "",
				language: miembro.profile?.preferred_language || "",
				pronouns: miembro.profile?.pronouns || "",
		  }
		: undefined;
  //#endregion ![sub]

  //#region [render] - 🎨 RENDER SECTION 🎨
	if (isLoading) {
		return (
			<div className="flex justify-center py-8">
				<SustratoLoadingLogo
					size={50}
					variant="spin-pulse"
					showText
					text={t("loadingMemberData")}
				/>
			</div>
		);
	}

	if (error && !miembro) {
		return (
			<StandardPageBackground variant="gradient">
				<div className="container mx-auto py-6">
					<div className="space-y-6">
						<PageHeader
							title={t("errorTitle")}
							description={error}
							actions={
								<StandardButton
									onClick={handleVolver}
									styleType="outline">
									<StandardIcon><ArrowLeft className="h-4 w-4" /></StandardIcon>
									{t("backToMembers")}
								</StandardButton>
							}
						/>
					</div>
				</div>
			</StandardPageBackground>
		);
	}

	if (!miembro || !valoresFormulario) {
		return (
			<StandardPageBackground variant="gradient">
				<div className="container mx-auto py-6">
					<div className="space-y-6">
						<PageHeader
							title={t("memberNotFoundTitle")}
							description={
								error ||
								t("memberNotFoundDescription")
							}
							actions={
								<StandardButton
									onClick={handleVolver}
									styleType="outline">
									<StandardIcon><ArrowLeft className="h-4 w-4" /></StandardIcon>
									{t("backToMembers")}
								</StandardButton>
							}
						/>
					</div>
				</div>
			</StandardPageBackground>
		);
	}

	return (
		<StandardPageBackground variant="gradient">
			<div className="container mx-auto py-6">
				<div className="space-y-6">
					<StandardPageTitle
						title={t("detailOf", { name: getNombreMiembro() })}
						subtitle={t("viewSubtitle")}
						mainIcon={User}
						breadcrumbs={[
							{ label: t("breadcrumbDatosMaestros"), href: "/datos-maestros" },
							{ label: t("breadcrumbMiembros"), href: "/datos-maestros/miembros" },
							{ label: t("breadcrumbVer") },
						]}
						showBackButton={{ href: "/datos-maestros/miembros" }}
					/>
{puedeGestionarMiembros && (
              <div className="flex justify-end pt-3">
							<StandardButton
									onClick={handleEditar}
									colorScheme="primary"

								leftIcon={PenLine}
								>

									{t("editMemberButton")}
								</StandardButton>
              </div>
						)}
					<StandardCard
            disableShadowHover={true}
            styleType="subtle"
            colorScheme="primary"
            accentPlacement="top"
            accentColorScheme="primary"
            shadow="md"
          >
						
				

					<MiembroForm
						modo="ver"
						valoresIniciales={valoresFormulario}
						rolesDisponibles={rolesDisponibles}
					/>
	</StandardCard>
					{error && miembro && (
						<div className="mt-4 p-4 bg-warning-muted text-warning-foreground rounded-md text-center ">
							<StandardText preset="caption">
								{t("warningPrefix")}
							</StandardText>
							<StandardText preset="caption" className="mt-1">
								{error}
							</StandardText>
							<StandardText preset="caption" size="xs" className="mt-1 opacity-80">
								{t("warningPartialData")}
							</StandardText>
						</div>
					)}
				</div>
			</div>
		</StandardPageBackground>
	);
}
//#endregion ![render]
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
//> 📝 Default export is part of the component declaration. No other exports.
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// TODO: Review the `isMounted` pattern in `cargarDatosCompletos` for potential simplification or replacement with AbortController if applicable, though for React state updates, the current pattern is common.
// TODO: Ensure all user-facing messages (errors, warnings) are internationalized if the application supports multiple languages.
// TODO: The warning message for `error && miembro` (lines 279-293) could be made more specific if the nature of the partial error is known.
//#endregion ![todo]
//#endregion ![render]
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
//> 📝 Default export is part of the component declaration. No other exports.
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// TODO: Review the `isMounted` pattern in `cargarDatosCompletos` for potential simplification or replacement with AbortController if applicable, though for React state updates, the current pattern is common.
// TODO: Ensure all user-facing messages (errors, warnings) are internationalized if the application supports multiple languages.
// TODO: The warning message for `error && miembro` (lines 279-293) could be made more specific if the nature of the partial error is known.
//#endregion ![todo]
