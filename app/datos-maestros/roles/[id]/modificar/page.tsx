//. 📍 app/datos-maestros/roles/[id]/modificar/page.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/auth-provider"; //> 📝 Solo se usa proyectoActual y user
import { RolForm, type RolFormValues } from "../../components/RolForm";
import {
	modificarRolEnProyecto,
	obtenerDetallesRolProyecto,
	type ProjectRoleRow,
	type ResultadoOperacion,
} from "@/lib/actions/proyect-role-actions";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import Link from "next/link";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
//> 📝 No local types defined in this file, types are imported or inline with usage.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function ModificarRolPage() {
	const router = useRouter();
	const params = useParams();
	const t = useTranslations("datosMaestrosPages.rolesModificarPage");
	const { proyectoActual } = useAuth(); //> 📝 CORRECCIÓN: Eliminado isLoading de aquí

	const roleId = params && typeof params.id === "string" ? params.id : null;

	const [rolParaEditar, setRolParaEditar] = useState<ProjectRoleRow | null>(
		null,
	);
	//> 📝 isPageLoading: true inicialmente, se pone a false después del primer useEffect o dentro de cargarDetallesRol
	const [isPageLoading, setIsPageLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [pageError, setPageError] = useState<string | null>(null);

	const puedeGestionarRoles =
		proyectoActual?.permissions?.can_manage_master_data || false;

	//#region [sub] - 🧰 HELPER FUNCTIONS 🧰
	const cargarDetallesRol = useCallback(async () => {
		if (!roleId || !proyectoActual?.id) {
			setIsPageLoading(false);
			return;
		}

		//> 📝 No necesitamos setIsPageLoading(true) aquí porque ya está en true o useEffect lo maneja
		setPageError(null);
		setRolParaEditar(null);

		try {
			const resultado: ResultadoOperacion<ProjectRoleRow | null> =
				await obtenerDetallesRolProyecto(roleId, proyectoActual.id);

			if (resultado.success) {
				if (resultado.data) {
					if (resultado.data.project_id !== proyectoActual.id) {
						setPageError(t("errorConsistency"));
						setRolParaEditar(null);
						sonnerToast.error(t("toastDataErrorTitle"), {
							description: t("toastDataErrorDescription"),
						});
					} else {
						setRolParaEditar(resultado.data);
					}
				} else {
					setPageError(
						t("errorNotFound", { roleId: roleId ?? "", projectName: proyectoActual.name }),
					);
					sonnerToast.warning(t("toastNotFoundTitle"), {
						description: t("toastNotFoundDescription", { projectName: proyectoActual.name }),
					});
				}
			} else {
				setPageError(
					resultado.error || t("errorLoadingDetails"),
				);
				sonnerToast.error(t("toastLoadErrorTitle"), {
					description: resultado.error,
				});
			}
		} catch (err) {
			console.error("Error al cargar el rol:", err);
			setPageError(t("errorLoadingGeneric"));
			sonnerToast.error(t("toastLoadErrorGenericTitle"), {
				description: t("toastLoadErrorGenericDescription"),
			});
		} finally {
			setIsPageLoading(false);
		}
	}, [roleId, proyectoActual?.id, proyectoActual?.name, t]);

	useEffect(() => {
		//> 📝 Este useEffect determina si se puede proceder a cargar el rol.
		//> 📝 Se asume que `proyectoActual` de `useAuth` está disponible (o es null) sincrónicamente
		//> 📝 después de la carga inicial de la app/layout.
		if (roleId && proyectoActual?.id) {
			//> 📝 Si tenemos todo, procedemos a cargar, isPageLoading ya está true.
			cargarDetallesRol();
		} else {
			//> 📝 Si falta algo crucial al inicio, terminamos la carga y establecemos error.
			setIsPageLoading(false);
			if (!proyectoActual?.id) {
				setPageError(t("noActiveProjectSelected"));
			} else if (!roleId) {
				setPageError(t("noRoleIdSpecifiedModify"));
			}
		}
	}, [roleId, proyectoActual, cargarDetallesRol, t]); //> 📝 Depender de proyectoActual completo

	const handleModificarRol = async (data: RolFormValues) => {
		if (!roleId || !proyectoActual?.id || !rolParaEditar) {
			sonnerToast.error(t("toastAppErrorTitle"), {
				description: t("toastAppErrorDescription"),
			});
			return;
		}

		setIsSubmitting(true);
		setPageError(null);

		const payload = {
			role_id: roleId,
			project_id: proyectoActual.id,
			updates: {
				/* ...data... */ role_name: data.role_name,
				role_description: data.role_description,
				can_manage_master_data: data.can_manage_master_data,
				can_create_batches: data.can_create_batches,
				can_upload_files: data.can_upload_files,
				can_bulk_edit_master_data: data.can_bulk_edit_master_data,
			},
		};

		const resultado: ResultadoOperacion<ProjectRoleRow> =
			await modificarRolEnProyecto(payload);

		if (resultado.success) {
			sonnerToast.success(t("toastUpdatedTitle"), {
				description: t("toastUpdatedDescription", { roleName: data.role_name }),
			});
			router.push("/datos-maestros/roles");
		} else {
			sonnerToast.error(t("toastUpdateErrorTitle"), {
				description: resultado.error || t("toastUpdateErrorFallback"),
			});
			setPageError(resultado.error);
		}
		setIsSubmitting(false);
	};
	//#endregion ![sub]

	//#region [render] - 🎨 RENDER SECTION 🎨
	//> 📝 ------ RENDERIZADO CONDICIONAL ------
	if (isPageLoading) {
		//> 📝 Solo este estado de carga para la página
		return (
			<StandardPageBackground variant="gradient">
				{" "}
				<SustratoLoadingLogo size={50} showText text={t("loadingGeneric")} />{" "}
			</StandardPageBackground>
		);
	}

	//> 📝 Los siguientes checks se hacen DESPUÉS de que isPageLoading es false.
	if (!proyectoActual?.id) {
		return (
			<StandardPageBackground variant="default">
				{" "}
				<StandardCard
					className="max-w-md text-center"
					styleType="subtle"
					hasOutline={false}
					accentPlacement="none"
					disableShadowHover={true}>
					{" "}
					<StandardCard.Header>
						{" "}
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100">
							{" "}
							<StandardIcon colorScheme="warning" size="md">
								<AlertTriangle />
							</StandardIcon>{" "}
						</div>{" "}
						<StandardPageTitle
							title={t("projectRequiredTitle")}
							className="mt-4"
						/>{" "}
					</StandardCard.Header>{" "}
					<StandardCard.Content>
						<StandardText>
							{pageError || t("noActiveProject")}
						</StandardText>
					</StandardCard.Content>{" "}
					<StandardCard.Footer>
						{" "}
						<Link href="/" passHref>
							<StandardButton styleType="outline">{t("goHomeButton")}</StandardButton>
						</Link>{" "}
					</StandardCard.Footer>{" "}
				</StandardCard>{" "}
			</StandardPageBackground>
		);
	}

	if (!puedeGestionarRoles) {
		return (
			<StandardPageBackground variant="gradient">
				{" "}
				<StandardCard
					className="max-w-md text-center"
					styleType="subtle"
					hasOutline={false}
					accentPlacement="none"
					disableShadowHover={true}>
					{" "}
					<StandardCard.Header>
						{" "}
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-100">
							{" "}
							<StandardIcon colorScheme="warning" size="md">
								<AlertTriangle />
							</StandardIcon>{" "}
						</div>{" "}
						<StandardPageTitle title={t("accessDeniedTitle")} className="mt-4" />{" "}
					</StandardCard.Header>{" "}
					<StandardCard.Content>
						<StandardText>
							{t("accessDeniedDescriptionModify")}
						</StandardText>
					</StandardCard.Content>{" "}
					<StandardCard.Footer>
						{" "}
						<Link href="/datos-maestros/roles" passHref>
							<StandardButton styleType="outline">
								{t("backToList")}
							</StandardButton>
						</Link>{" "}
					</StandardCard.Footer>{" "}
				</StandardCard>{" "}
			</StandardPageBackground>
		);
	}

	if (pageError && !rolParaEditar) {
		return (
			<StandardPageBackground variant="gradient">
				{" "}
				<StandardCard
					styleType="subtle"
					className="max-w-md text-center"
					colorScheme="primary" // Rule: Inner card for info/error block
					accentPlacement="none" // Rule: Inner card
					hasOutline={false} // Rule: Inner card
					shadow="none" // Rule: Inner card
					disableShadowHover={true} // Rule: Inner card
				>
					{" "}
					<StandardCard.Header>
						{" "}
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-100">
							{" "}
							<StandardIcon colorScheme="danger" size="md">
								<AlertTriangle />
							</StandardIcon>{" "}
						</div>{" "}
						<StandardPageTitle
							title={t("errorLoadingTitle")}
							className="mt-4"
						/>{" "}
					</StandardCard.Header>{" "}
					<StandardCard.Content>
						<StandardText>{pageError}</StandardText>
					</StandardCard.Content>{" "}
					<StandardCard.Footer>
						{" "}
						<Link href="/datos-maestros/roles" passHref>
							<StandardButton styleType="outline">
								{t("backToList")}
							</StandardButton>
						</Link>{" "}
					</StandardCard.Footer>{" "}
				</StandardCard>{" "}
			</StandardPageBackground>
		);
	}

	if (!rolParaEditar) {
		return (
			<StandardPageBackground variant="gradient">
				{" "}
				<StandardCard
					styleType="subtle"
					className="max-w-md text-center"
					colorScheme="primary" // Rule: Inner card for info/error block
					accentPlacement="none" // Rule: Inner card
					hasOutline={false} // Rule: Inner card
					shadow="none" // Rule: Inner card
					disableShadowHover={true} // Rule: Inner card
				>
					{" "}
					<StandardCard.Header>
						<StandardPageTitle title={t("notFoundTitle")} />
					</StandardCard.Header>{" "}
					<StandardCard.Content>
						<StandardText>
							{pageError || t("notFoundDescription")}
						</StandardText>
					</StandardCard.Content>{" "}
					<StandardCard.Footer>
						{" "}
						<Link href="/datos-maestros/roles" passHref>
							<StandardButton styleType="outline">
								{t("backToList")}
							</StandardButton>
						</Link>{" "}
					</StandardCard.Footer>{" "}
				</StandardCard>{" "}
			</StandardPageBackground>
		);
	}

	const valoresInicialesParaForm: RolFormValues = {
		role_name: rolParaEditar.role_name,
		role_description: rolParaEditar.role_description,
		can_manage_master_data: rolParaEditar.can_manage_master_data ?? false,
		can_create_batches: rolParaEditar.can_create_batches ?? false,
		can_upload_files: rolParaEditar.can_upload_files ?? false,
		can_bulk_edit_master_data: rolParaEditar.can_bulk_edit_master_data ?? false,
	};

	return (
		<StandardPageBackground variant="gradient">
			<div className="container mx-auto py-6">
				<StandardPageTitle
					title={t("pageTitle", { roleName: rolParaEditar.role_name })}
					subtitle={t("pageSubtitle", { projectName: proyectoActual.name })}
					mainIcon={ShieldCheck}
					breadcrumbs={[
						{ label: t("breadcrumbDatosMaestros"), href: "/datos-maestros" },
						{ label: t("breadcrumbRoles"), href: "/datos-maestros/roles" },
						{
							label: rolParaEditar.role_name,
							href: `/datos-maestros/roles/${roleId}/ver`,
						},
						{ label: t("breadcrumbModificar") },
					]}
					showBackButton={{ href: `/datos-maestros/roles` }}
				/>
				<StandardCard
					colorScheme="secondary" // Rule: Main form card colorScheme is secondary
					accentPlacement="top" // Rule: Main form card accentPlacement is top
					accentColorScheme="primary" // Rule: Main form card accent for create/edit is primary
					shadow="md" // Rule: Main form card shadow is md by default
					disableShadowHover={true}
					styleType="subtle"
					// styleType and hasOutline removed
				>
					<StandardCard.Content>
						{pageError && rolParaEditar && (
							<div className="mb-4 p-3 text-sm text-destructive-foreground border border-destructive bg-destructive/10 rounded-md">
								<div className="flex items-center gap-2">
									{" "}
									<StandardIcon size="sm" colorScheme="danger">
										<AlertTriangle />
									</StandardIcon>{" "}
									<span>{pageError}</span>{" "}
								</div>
							</div>
						)}
						<RolForm
							modo="editar"
							valoresIniciales={valoresInicialesParaForm}
							onSubmit={handleModificarRol}
							isEditingForm={true}
							loading={isSubmitting}
						/>
					</StandardCard.Content>
				</StandardCard>
			</div>
		</StandardPageBackground>
	);
	//#endregion ![render]

	//#region [todo] - 👀 PENDIENTES 👀
	// ! ❌ Considerar si hay tareas pendientes específicas para esta página.
	//#endregion ![todo]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
//> 📝 Default export is part of the [main] component definition.
//#endregion ![foo]
