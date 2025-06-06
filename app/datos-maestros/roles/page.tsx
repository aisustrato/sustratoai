// app/datos-maestros/roles/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/auth-provider";
import { obtenerRolesDelProyecto } from "@/lib/actions/proyect-role-actions";
import type { ProjectRoleRow } from "@/lib/actions/proyect-role-actions"; // Corregido el nombre del archivo
import { Text } from "@/components/ui/text";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { ProTable } from "@/components/ui/pro-table";
import type { ColumnDef } from "@tanstack/react-table";
import { CustomButton } from "@/components/ui/custom-button";
import {
	ShieldPlus,
	AlertCircle,
	Trash2,
	PenLine,
	Eye,
	CheckSquare,
	XSquare,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState } from "@/components/common/empty-state";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { PageBackground } from "@/components/ui/page-background";
import { PageTitle } from "@/components/ui/page-title";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "@/components/ui/icon";

export default function RolesPage() {
	const router = useRouter();
	const { proyectoActual } = useAuth();
	const { toast } = useToast();

	const [roles, setRoles] = useState<ProjectRoleRow[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const puedeGestionarRoles =
		proyectoActual?.permissions?.can_manage_master_data || false;

	const cargarRoles = async () => {
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
	};

	useEffect(() => {
		if (proyectoActual?.id) {
			cargarRoles();
		} else {
			setIsLoading(false);
		}
	}, [proyectoActual?.id]);

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

	// Helper para renderizar celdas de permisos
	const PermisoCell = ({
		value,
		tooltipText,
	}: {
		value: boolean;
		tooltipText: string;
	}) => (
		<TooltipProvider delayDuration={100}>
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="flex justify-center items-center w-full">
						{value ? (
							<Icon color="success" size="sm" colorVariant="pure">
								<CheckSquare className="h-4 w-4" />
							</Icon>
						) : (
							<Icon color="neutral" size="sm" colorVariant="pure">
								<XSquare className="h-4 w-4" />
							</Icon>
						)}
					</span>
				</TooltipTrigger>
				<TooltipContent side="top" className="text-xs max-w-xs">
					<p>{tooltipText}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);

	const columnas: ColumnDef<ProjectRoleRow>[] = [
		{
			accessorKey: "role_name",
			header: "Nombre del Rol",
			cell: (info) => (
				<Text variant="default" weight="medium" className="text-primary-text">
					{info.getValue() as string}
				</Text>
			),
			meta: {
				className: "min-w-[150px] w-1/5", // Ajustar ancho
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
			meta: { className: "text-center w-[100px]" },
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
			meta: { className: "text-center w-[100px]" },
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
			meta: { className: "text-center w-[100px]" },
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
			meta: { className: "text-center w-[100px]" },
		},
		{
			id: "actions",
			header: () => <div className="text-right pr-2">Acciones</div>,
			cell: ({ row }) => {
				const rol = row.original;
				return (
					<div className="flex gap-1 justify-end">
						<CustomButton
							variant="ghost"
							size="icon"
							onClick={() => handleVerRol(rol)}
							iconOnly
							aria-label={`Ver detalles del rol ${rol.role_name}`}
							tooltip="Ver detalles">
							<Eye className="h-5 w-5" />
						</CustomButton>
						{puedeGestionarRoles && (
							<>
								<CustomButton
									variant="ghost"
									size="icon"
									onClick={() => handleEditarRol(rol)}
									iconOnly
									aria-label={`Editar el rol ${rol.role_name}`}
									tooltip="Editar rol">
									<PenLine className="h-5 w-5" />
								</CustomButton>
								<CustomButton
									variant="ghost"
									size="icon"
									onClick={() => handleEliminarRol(rol)}
									iconOnly
									color="danger"
									aria-label={`Eliminar el rol ${rol.role_name}`}
									tooltip="Eliminar rol">
									<Trash2 className="h-5 w-5 text-destructive" />
								</CustomButton>
							</>
						)}
					</div>
				);
			},
			meta: {
				className: "text-right sticky right-0 bg-background z-10 shadow-sm", // Para fijar y asegurar visibilidad
				isFixed: true, // Asumiendo que ProTable lo soporta
			},
		},
	];

	return (
		<PageBackground>
			<div className="container mx-auto py-6">
				<div className="space-y-6">
					<PageTitle
						title="Roles del Proyecto"
						subtitle={`Gestión de roles y permisos para el proyecto ${
							proyectoActual?.name || "actual"
						}`}
						mainIcon={ShieldPlus}
						breadcrumbs={[
							{ label: "Datos Maestros", href: "/datos-maestros" },
							{ label: "Roles" },
						]}
					/>

					{puedeGestionarRoles && (
						<div className="flex justify-end">
							<CustomButton
								onClick={handleAgregarRol}
								leftIcon={<ShieldPlus className="h-4 w-4" />}
								color="primary">
								Agregar Nuevo Rol
							</CustomButton>
						</div>
					)}

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
							colorScheme="secondary"
							accentPlacement="top"
							accentColorScheme="primary"
							className="overflow-hidden hover:shadow-md transition-shadow duration-300"
							styleType="subtle"
							hasOutline={false} // border="top"
						>
							<StandardCard styleType="subtle" hasOutline={false} accentPlacement="none">
								<StandardCard.Header>
									<Text
										variant="subheading"
										color="danger"
										className="flex items-center gap-2">
										<AlertCircle className="h-5 w-5" /> Error al Cargar Roles
									</Text>
								</StandardCard.Header>
								<StandardCard.Content>
									<Text>{error}</Text>
									<CustomButton
										onClick={cargarRoles}
										variant="outline"
										className="mt-4">
										{" "}
										Reintentar Carga{" "}
									</CustomButton>
								</StandardCard.Content>
							</StandardCard>
						</StandardCard>
					) : roles.length === 0 ? (
						<EmptyState
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
										{" "}
										<CustomButton color="primary" leftIcon={<ShieldPlus />}>
											{" "}
											Crear Primer Rol{" "}
										</CustomButton>{" "}
									</Link>
								) : undefined
							}
						/>
					) : (
						<StandardCard
							colorScheme="secondary"
							accentPlacement="top"
							accentColorScheme="primary"
							className="overflow-hidden hover:shadow-md transition-shadow duration-300"
							styleType="subtle"
							hasOutline={false} // border="top"
						>
							<StandardCard className="overflow-x-auto" styleType="subtle" hasOutline={false} accentPlacement="none">
								<ProTable<ProjectRoleRow>
									data={roles}
									columns={columnas}
									showColumnSelector={true} // Mostrar selector de columnas
									stickyHeader={true}
								/>
							</StandardCard>
						</StandardCard>
					)}
				</div>
			</div>
		</PageBackground>
	);
}
