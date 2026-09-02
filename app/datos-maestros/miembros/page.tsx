//. 📍 app/datos-maestros/miembros/page.tsx
"use client";

// 📚 DOCUMENTACIÓN 📚
/* *
 * Página principal de gestión de miembros del proyecto
 * Permite ver, agregar, editar y eliminar miembros del proyecto actual
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/auth-provider";
import { obtenerMiembrosConPerfilesYRolesDelProyecto } from "@/lib/actions/member-actions";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { User, UserPlus, AlertCircle, Trash2, PenLine, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import type { ProjectMemberDetails } from "@/lib/actions/member-actions";
import type { ColumnDef } from "@tanstack/react-table";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// Los tipos principales ya están importados arriba
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function MiembrosPage() {
	const router = useRouter();
	const t = useTranslations("datosMaestrosPages.miembrosListPage");
	//#region [sub] - 🧰 HOOKS, STATE, EFFECTS & HANDLERS 🧰
	const { proyectoActual } = useAuth();
	const { toast } = useToast();

	const [miembros, setMiembros] = useState<ProjectMemberDetails[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const puedeGestionarMiembros =
		proyectoActual?.permissions?.can_manage_master_data || false;

	const cargarMiembros = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		if (!proyectoActual?.id) {
			setError(t("errorNoProject"));
			setIsLoading(false);
			return;
		}

		try {
			const resultado = await obtenerMiembrosConPerfilesYRolesDelProyecto(
				proyectoActual.id
			);

			if (resultado.success) {
				setMiembros(resultado.data);
			} else {
				setError(
					resultado.error || t("errorLoadingGeneric")
				);
				toast({
					title: t("toastErrorLoadingTitle"),
					description: resultado.error,
					variant: "destructive",
				});
			}
		} catch (err) {
			setError(t("errorLoadingGeneric"));
			console.error("Error cargando miembros:", err);
		} finally {
			setIsLoading(false);
		}
	}, [proyectoActual?.id, toast, t]);

  useEffect(() => {
    if (proyectoActual?.id) {
      cargarMiembros();
    }
  }, [proyectoActual?.id, cargarMiembros]);

	const handleAgregarMiembro = () => {
		router.push(`/datos-maestros/miembros/nuevo/crear`);
	};

	const handleEditarMiembro = (miembro: ProjectMemberDetails) => {
		router.push(
			`/datos-maestros/miembros/${miembro.project_member_id}/modificar`
		);
	};

	const handleVerMiembro = (miembro: ProjectMemberDetails) => {
		router.push(`/datos-maestros/miembros/${miembro.project_member_id}/ver`);
	};

	const handleEliminarMiembro = (miembro: ProjectMemberDetails) => {
		router.push(
			`/datos-maestros/miembros/${miembro.project_member_id}/eliminar`
		);
	};
	//#endregion ![sub]

	//#region [sub_render_logic] - 📊 Pro-Table Column Definitions 📊
	const columnas: ColumnDef<ProjectMemberDetails>[] = [
		{
			header: t("columnName"),
			accessorFn: (row: ProjectMemberDetails) => {
				const profile = row.profile;
				if (profile?.public_display_name) return profile.public_display_name;
				if (profile?.first_name || profile?.last_name) return `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
				return t("noNameRegistered");
			},
			cell: ({ getValue }) => (
				<div className="font-medium">
					<StandardText weight="semibold">{getValue() as string}</StandardText>
				</div>
			),
			meta: { size: 250 },
		},
		{
			header: t("columnInstitution"),
			accessorFn: (row: ProjectMemberDetails) => row.profile?.primary_institution || t("notSpecifiedFem"),
			cell: ({ getValue }) => (
				<div className="truncate">
					{getValue() as string}
				</div>
			),
			meta: {
				size: 200,
				isTruncatable: true
			},
		},
		{
			header: t("columnUserProfile"),
			accessorFn: (row: ProjectMemberDetails) => row.profile?.public_contact_email || t("notSpecifiedMasc"),
			cell: ({ getValue }) => (
				<div className="truncate">
					{getValue() as string}
				</div>
			),
			meta: {
				size: 200,
				isTruncatable: true
			},
		},
		{
			header: t("columnRole"),
			accessorFn: (row: ProjectMemberDetails) => row.role_name || t("noRoleAssigned"),
			cell: ({ getValue }) => (
				<div className="flex justify-center">
					<StandardBadge size="xs" colorScheme="primary" styleType="subtle">
						{getValue() as string}
					</StandardBadge>
				</div>
			),
			meta: {
				size: 180,
				align: 'center'
			},
		},
		{
			id: 'actions',
			header: () => <div className="text-center">{t("columnActions")}</div>,
			meta: {
				align: 'center',
				isSticky: 'right',
				size: 200 // Ancho fijo para la columna de acciones
			},
			cell: ({ row }) => {
				const miembro = row.original as ProjectMemberDetails;
				return (
					<div className="flex justify-center gap-1">
						<StandardButton
							styleType="outline"
							colorScheme="primary"
							size="sm"
							iconOnly={true}
							onClick={() => handleVerMiembro(miembro)}
							tooltip={t("viewDetailsTooltip")}
							leftIcon={Eye}
							aria-label={t("viewDetailsAria")}
						/>
						{puedeGestionarMiembros && (
							<>
								<StandardButton
									styleType="outline"
									colorScheme="primary"
									size="sm"
									iconOnly={true}
									onClick={() => handleEditarMiembro(miembro)}
									tooltip={t("editMemberTooltip")}
									leftIcon={PenLine}
									aria-label={t("editMemberAria")}
								/>
								<StandardButton
									styleType="outline"
									size="sm"
									iconOnly={true}
									onClick={() => handleEliminarMiembro(miembro)}
									colorScheme="danger"
									tooltip={t("deleteMemberTooltip")}
									leftIcon={Trash2}
									aria-label={t("deleteMemberAria")}
								>
									{t("deleteButton")}
								</StandardButton>
							</>
						)}
					</div>
				);
			},
		},
	];
	//#endregion ![sub_render_logic]

	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		<StandardPageBackground variant="gradient">
			<div className="container mx-auto py-6">
				<div className="space-y-6">
					<StandardPageTitle
						title={t("pageTitle")}
						subtitle={t("pageSubtitle")}
						description={t("pageDescription")}
						mainIcon={User}
						showBackButton={{ href: "/datos-maestros" }}
						breadcrumbs={[
							{ label: t("breadcrumbDatosMaestros"), href: "/datos-maestros" },
							{ label: t("breadcrumbMiembros") },
						]}
						actions={
							puedeGestionarMiembros ? (
								<StandardButton
									onClick={handleAgregarMiembro}
									colorScheme="primary"
									leftIcon={UserPlus}
								>
									{t("addMemberButton")}
								</StandardButton>
							) : undefined
						}
					/>

					{/* //#region [render_sub] - LOADING, ERROR, EMPTY STATES & MAIN CONTENT 🎨 */}
					{isLoading ? (
						<div className="flex justify-center py-8">
							<SustratoLoadingLogo
								size={50}
								variant="spin-pulse"
								showText={true}
								text={t("loadingMembers")}
							/>
						</div>
					) : error ? (
						<StandardCard
							disableShadowHover={true}
							className="border-destructive bg-destructive/5"
							colorScheme="danger" // Assuming intent from className
							styleType="subtle"
							hasOutline={false} // Defaulting as no border prop was specified
							accentPlacement="none" // Defaulting
						>
							<div className="flex items-center gap-3">
								<StandardIcon><AlertCircle className="h-6 w-6 text-destructive" /></StandardIcon>
								<StandardText>{t("errorPrefix", { error })}</StandardText>
							</div>
						</StandardCard>
					) : miembros.length === 0 ? (
						<StandardEmptyState
							icon={UserPlus}
							title={t("emptyTitle")}
							description={
								puedeGestionarMiembros
								? t("emptyDescriptionCanManage")
								: t("emptyDescriptionCannotManage")
							}
							action={
								puedeGestionarMiembros ? (
									<StandardButton
										onClick={handleAgregarMiembro}
										colorScheme="primary"
										leftIcon={UserPlus}
									>
										{t("addMemberButton")}
									</StandardButton>
								) : undefined
							}
						/>
					) : (
						<StandardCard
							disableShadowHover={true}
							styleType="subtle"
							colorScheme="primary"
							accentPlacement="top"
							shadow="md"

						>
							<StandardCard.Content>
							<StandardTable<ProjectMemberDetails>
								data={miembros}
								columns={columnas}
								filterPlaceholder={t("searchPlaceholder")}
							>
								<StandardTable.Table />
							</StandardTable>
						</StandardCard.Content>
						</StandardCard>
					)}
				</div>
			</div>
		</StandardPageBackground>
	);
	//#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration
//#endregion [foo]

//#region [todo] - 👀 PENDIENTES 👀
// Implementar la funcionalidad de eliminación real (actualmente redirige a una página de confirmación).
// Considerar paginación para la tabla si la lista de miembros puede ser muy larga.
// Mejorar el feedback visual durante la carga o errores (ej. skeletons).
//#endregion [todo]
