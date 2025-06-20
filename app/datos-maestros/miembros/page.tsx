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
import { useAuth } from "@/app/auth-provider";
import { obtenerMiembrosConPerfilesYRolesDelProyecto } from "@/lib/actions/member-actions";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { UserPlus, AlertCircle, Trash2, PenLine, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState } from "@/components/common/empty-state";
import type { ProjectMemberDetails } from "@/lib/actions/member-actions";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
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
			setError("No hay un proyecto seleccionado.");
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
					resultado.error || "Error al cargar los miembros del proyecto."
				);
				toast({
					title: "Error al cargar miembros",
					description: resultado.error,
					variant: "destructive",
				});
			}
		} catch (err) {
			setError("Error al cargar los miembros del proyecto.");
			console.error("Error cargando miembros:", err);
		} finally {
			setIsLoading(false);
		}
	}, [proyectoActual?.id, toast]);

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
			header: "Nombre",
			accessorFn: (row: ProjectMemberDetails) => {
				const profile = row.profile;
				if (profile?.public_display_name) {
					return profile.public_display_name;
				}
				if (profile?.first_name || profile?.last_name) {
					return `${profile.first_name || ""} ${
						profile.last_name || ""
					}`.trim();
				}
				return "Sin nombre registrado";
			},
						cell: ({ getValue }: CellContext<ProjectMemberDetails, unknown>) => <StandardText weight="semibold">{getValue() as string}</StandardText>,
			meta: {
				size: 250,
			},
		},
		{
			header: "Institución",
			accessorFn: (row: ProjectMemberDetails) =>
				row.profile?.primary_institution || "No especificada",
			cell: ({ getValue }: CellContext<ProjectMemberDetails, unknown>) => getValue() as string,
			meta: {
				size: 200,
			},
		},
		{
			header: "Perfil de Usuario",
			accessorFn: (row: ProjectMemberDetails) =>
				row.profile?.public_contact_email || "No especificado",
			cell: ({ getValue }: CellContext<ProjectMemberDetails, unknown>) => getValue() as string,
			meta: { size: 200 },
		},
		{
			header: "Rol en el Proyecto",
			accessorFn: (row: ProjectMemberDetails) =>
				row.role_name || "Sin rol asignado",
						cell: ({ getValue }: CellContext<ProjectMemberDetails, unknown>) => (
				<StandardBadge size="md" colorScheme="primary" styleType="subtle">
					{getValue() as string}
				</StandardBadge>
			),
			meta: { size: 200 },
		},
		{
			id: 'actions',
			header: () => <div className="text-right pr-2">Acciones</div>,
			meta: { align: 'right', isSticky: 'right' },
						cell: ({ row }: CellContext<ProjectMemberDetails, unknown>) => {
				const miembro = row.original as ProjectMemberDetails;
				return (
					<div className="flex gap-2 justify-end">
						<StandardButton
							styleType="ghost"
							colorScheme="primary"
							size="sm"
							iconOnly={true}
							onClick={() => handleVerMiembro(miembro)}
							tooltip="Ver detalles"
						>
							<StandardIcon colorScheme="primary"><Eye /></StandardIcon>
							<span className="sr-only">Ver detalles</span>
						</StandardButton>
						{puedeGestionarMiembros && (
							<>
								<StandardButton
									styleType="ghost"
									colorScheme="primary"
									size="sm"
									iconOnly={true}
									onClick={() => handleEditarMiembro(miembro)}
									tooltip="Editar miembro"
								>
									<StandardIcon colorScheme="primary"><PenLine /></StandardIcon>
									<span className="sr-only">Editar</span>
								</StandardButton>
								<StandardButton
									styleType="ghost"
									size="sm"
									iconOnly={true}
									onClick={() => handleEliminarMiembro(miembro)}
									colorScheme="danger"
									tooltip="Eliminar miembro"
								>
									<StandardIcon colorScheme="danger"><Trash2 /></StandardIcon>
									<span className="sr-only">Eliminar</span>
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
						title="Miembros del Proyecto"
						subtitle={`Creación, visualización, modificación de miembros del proyecto ${
							proyectoActual?.name || "actual"
						}`}
						breadcrumbs={[
							{ label: "Datos Maestros", href: "/datos-maestros" },
							{ label: "Miembros" },
						]}
					/>

					{/* //#region [render_sub] - LOADING, ERROR, EMPTY STATES & MAIN CONTENT 🎨 */}
					{isLoading ? (
						<div className="flex justify-center py-8">
							<SustratoLoadingLogo
								size={50}
								variant="spin-pulse"
								showText={true}
								text="Cargando miembros..."
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
								<StandardText>Error: {error}</StandardText>
							</div>
						</StandardCard>
					) : miembros.length === 0 ? (
						<EmptyState
							icon={UserPlus}
							title="No hay miembros en este proyecto"
							description={
								puedeGestionarMiembros
								? "Agrega investigadores al proyecto para comenzar a colaborar."
								: "Aún no hay investigadores asociados a este proyecto."
							}
							action={
								puedeGestionarMiembros ? (
									<StandardButton 
										onClick={handleAgregarMiembro}
										colorScheme="primary"
										leftIcon={UserPlus}
									>
										Agregar Miembro
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
							className="overflow-hidden hover:shadow-md transition-shadow duration-300"
						>
							{puedeGestionarMiembros && (
								<div className="flex justify-end mb-4 pt-4">
									<StandardButton
										onClick={handleAgregarMiembro}
										colorScheme="primary"
										leftIcon={UserPlus}
									>
										Agregar Miembro
									</StandardButton>
								</div>
							)}
							<StandardTable<ProjectMemberDetails>
								data={miembros}
								columns={columnas}
								filterPlaceholder="Buscar por nombre, rol o perfil..."
							>
								<StandardTable.Table />
							</StandardTable>
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
