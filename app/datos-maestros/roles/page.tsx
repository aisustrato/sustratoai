//. 📍 app/datos-maestros/roles/page.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/auth-provider";
import { obtenerRolesDelProyecto } from "@/lib/actions/proyect-role-actions";
import type { ProjectRoleRow } from "@/lib/actions/proyect-role-actions"; // Corregido el nombre del archivo
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardBadge } from "@/components/ui/StandardBadge";
import type { ColumnDef } from "@tanstack/react-table";

import {
	Shield,
	ShieldPlus,
	AlertCircle,
	Trash2,
	PenLine,
	Eye,
	CheckSquare,
	XSquare,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardTooltip } from "@/components/ui/StandardTooltip";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// Types are imported (ProjectRoleRow, ColumnDef) or defined by usage (columnas for ProTable).
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function RolesPage() {
	const router = useRouter();
	//#region [sub] - 🧰 HOOKS, STATE, EFFECTS & HANDLERS 🧰
	const { proyectoActual } = useAuth();
	const { toast } = useToast();

	const [roles, setRoles] = useState<ProjectRoleRow[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const puedeGestionarRoles =
		proyectoActual?.permissions?.can_manage_master_data || false;

	const cargarRoles = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		if (!proyectoActual?.id) {
			setError("No hay un proyecto seleccionado.");
			setIsLoading(false);
			return;
		}

		try {
			const resultado = await obtenerRolesDelProyecto(proyectoActual.id);

			if (resultado.success) {
				setRoles(resultado.data);
			} else {
				setError(resultado.error || "Error al cargar los roles del proyecto.");
				toast({
					title: "Error al cargar roles",
					description: resultado.error,
					variant: "destructive",
				});
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Error desconocido al cargar roles.";
			setError(errorMessage);
			console.error("Error cargando roles:", err);
			toast({
				title: "Error Inesperado",
				description: errorMessage,
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	}, [proyectoActual?.id, toast]);

	useEffect(() => {
		if (proyectoActual?.id) {
			cargarRoles();
		} else {
			setIsLoading(false);
		}
	}, [proyectoActual?.id, cargarRoles]);

	const handleAgregarRol = () => {
		router.push(`/datos-maestros/roles/crear`);
	};

	const handleEditarRol = (rol: ProjectRoleRow) => {
		router.push(`/datos-maestros/roles/${rol.id}/modificar`);
	};

	const handleVerRol = (rol: ProjectRoleRow) => {
		router.push(`/datos-maestros/roles/${rol.id}/ver`);
	};

	const handleEliminarRol = (rol: ProjectRoleRow) => {
		router.push(`/datos-maestros/roles/${rol.id}/eliminar`);
	};
	//#endregion ![sub]

	//#region [sub_render_logic] - 📊 Pro-Table Column Definitions & Helpers 📊
	// Helper para renderizar celdas de permisos
	const PermisoCell = ({
		value,
		tooltipText,
	}: {
		value: boolean;
		tooltipText: string;
	}) => (
		<StandardTooltip
			delayDuration={100}
			side="top"
			className="text-xs max-w-xs"
			trigger={
				<span className="flex justify-center items-center w-full">
					{value ? (
						<StandardIcon colorScheme="success" size="sm">
							<CheckSquare />
						</StandardIcon>
					) : (
						<StandardIcon colorScheme="danger" size="sm">
							<XSquare />
						</StandardIcon>
					)}
				</span>
			}
		>
			<StandardText preset="caption">
				{tooltipText}
			</StandardText>
		</StandardTooltip>
	);

	const columnas: ColumnDef<ProjectRoleRow>[] = [
		{
			accessorKey: "role_name",
			header: () => <StandardText weight="semibold">Nombre del Rol</StandardText>,
			cell: (info) => <StandardBadge size="sm" colorScheme="primary">{String(info.getValue())}</StandardBadge>,
			meta: {
				size: 200, // Ajustar ancho
			},
		},

		// Columnas de Permisos Separadas
		{
			accessorKey: "can_manage_master_data",
			header: () => <div className="text-center">Gest. Datos</div>,
			cell: (info) => (
				<PermisoCell
					value={info.getValue() as boolean}
					tooltipText="Permite gestionar datos maestros (miembros, roles, etc.)"
				/>
			),
			meta: {
				align: "center",
			},
		},
		{
			accessorKey: "can_create_batches",
			header: () => <div className="text-center">Crear Lotes</div>,
			cell: (info) => (
				<PermisoCell
					value={info.getValue() as boolean}
					tooltipText="Permite crear nuevos lotes de trabajo o análisis"
				/>
			),
			meta: {
				align: "center",
			},
		},
		{
			accessorKey: "can_upload_files",
			header: () => <div className="text-center">Subir Archs.</div>,
			cell: (info) => (
				<PermisoCell
					value={info.getValue() as boolean}
					tooltipText="Permite subir archivos al proyecto"
				/>
			),
			meta: {
				align: "center",
			},
		},
		{
			accessorKey: "can_bulk_edit_master_data",
			header: () => <div className="text-center">Edit. Masiva</div>,
			cell: (info) => (
				<PermisoCell
					value={info.getValue() as boolean}
					tooltipText="Permite editar datos maestros de forma masiva"
				/>
			),
			meta: {
				align: "center",
			},
		},
		{
			id: "actions",
			header: () => <div className="text-right pr-2">Acciones</div>,
			cell: ({ row }) => {
				const rol = row.original;
				return (
					<div className="flex gap-1 justify-end">
						<StandardButton
							styleType="ghost"
							colorScheme="secondary"
							onClick={() => handleVerRol(rol)}
							aria-label={`Ver detalles del rol ${rol.role_name}`}
							tooltip="Ver detalles"
							leftIcon={Eye}
							iconOnly={true}
						>
							Ver
						</StandardButton>
						{puedeGestionarRoles && (
							<>
								<StandardButton
									styleType="ghost"
									colorScheme="secondary"
									onClick={() => handleEditarRol(rol)}
									aria-label={`Editar el rol ${rol.role_name}`}
									tooltip="Editar rol"
									leftIcon={PenLine}
									iconOnly={true}
									>
									Editar	
								</StandardButton>
								<StandardButton
									styleType="ghost"
									colorScheme="danger"
									onClick={() => handleEliminarRol(rol)}
									aria-label={`Eliminar el rol ${rol.role_name}`}
									tooltip="Eliminar rol"
									leftIcon={Trash2}
									iconOnly={true}
								>
									Eliminar
								</StandardButton>
							</>
						)}
					</div>
				);
			},
			meta: {
				align: "right",
				isSticky: "right",
			},
		},
	];
	//#endregion ![sub_render_logic]

	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		<StandardPageBackground>
			<div className="container mx-auto py-6">
				<div className="space-y-6">
					<StandardPageTitle
						title="Roles y Permisos"
						subtitle="Definición de permisos y capacidades"
						description="Crea y gestiona los roles que determinan qué acciones pueden realizar los miembros dentro del proyecto."
						mainIcon={Shield}
						breadcrumbs={[
							{ label: "Datos Maestros", href: "/datos-maestros" },
							{ label: "Roles" },
						]}
						actions={
							puedeGestionarRoles ? (
								<StandardButton
									onClick={handleAgregarRol}
									leftIcon={ShieldPlus}
									colorScheme="primary">
									Crear Rol
								</StandardButton>
							) : undefined
						}
					/>

					

					{/* //#region [render_sub] - LOADING, ERROR, EMPTY STATES & TABLE DISPLAY 🎨 */}
					{isLoading ? (
						<div className="flex justify-center py-10">
							<SustratoLoadingLogo
								size={50}
								variant="spin-pulse"
								showText={true}
								text="Cargando roles..."
							/>
						</div>
					) : error ? (
						<StandardCard
							disableShadowHover={true}
							styleType="subtle"
							colorScheme="primary"
							accentPlacement="top"
							accentColorScheme="primary"
							shadow="md"
							className="overflow-hidden hover:shadow-md transition-shadow duration-300"
						>
							<StandardCard
								styleType="subtle"
								colorScheme="primary"
								accentPlacement="none"
								hasOutline={false}
								shadow="none"
								disableShadowHover={true}
							>
								<StandardCard.Header>
									<StandardText
										preset="subheading"
										colorScheme="danger"
										className="flex items-center gap-2">
										<StandardIcon colorScheme="danger"><AlertCircle className="h-5 w-5" /></StandardIcon> Error al Cargar Roles
									</StandardText>
								</StandardCard.Header>
								<StandardCard.Content>
									<StandardText>{error}</StandardText>
									<StandardButton
										onClick={cargarRoles}
										styleType="outline"
										className="mt-4">
										Reintentar Carga
									</StandardButton>
								</StandardCard.Content>
							</StandardCard>
						</StandardCard>
					) : roles.length === 0 ? (
						<StandardEmptyState
							icon={ShieldPlus}
							title="No hay roles definidos para este proyecto"
							description={
								puedeGestionarRoles
									? "Crea roles para definir los conjuntos de permisos para los miembros."
									: "Aún no se han configurado roles específicos para este proyecto."
							}
							action={
								puedeGestionarRoles ? (
									<Link href="/datos-maestros/roles/crear" passHref>
										<StandardButton colorScheme="primary" leftIcon={ShieldPlus}>
											Crear Primer Rol
										</StandardButton>
									</Link>
								) : undefined
							}
						/>
					) : (
						<StandardCard
							disableShadowHover={true}
							styleType="subtle"
							colorScheme="primary"
							accentPlacement="top"
							accentColorScheme="primary"
							shadow="md"
							className="overflow-hidden hover:shadow-md transition-shadow duration-300"
						>
							<StandardCard
								styleType="subtle"
								className="overflow-x-auto"
								colorScheme="primary"
								accentPlacement="none"
								hasOutline={false}
								shadow="none"
								disableShadowHover={true}
							>
								<StandardTable<ProjectRoleRow>
									data={roles}
									columns={columnas}
									filterPlaceholder="Buscar por nombre de rol..."
								>
									<StandardTable.Table />
								</StandardTable>
							</StandardCard>
						</StandardCard>
					)}
					{/* //#endregion [render_sub] */}
				</div>
			</div>
		</StandardPageBackground>
	);
	//#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Implementar la funcionalidad de eliminación real (actualmente redirige a una página de confirmación).
// Considerar feedback visual más integrado para acciones de edición/eliminación en la tabla.
// La paginación para la tabla ProTable podría ser necesaria si la lista de roles es extensa.
//#endregion ![todo]
