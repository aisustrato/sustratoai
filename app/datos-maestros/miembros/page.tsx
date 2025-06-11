//. 📍 app/datos-maestros/miembros/page.tsx
"use client";

// 📚 DOCUMENTACIÓN 📚
/* *
 * Definiciones de animaciones para el componente Button                       *
 * Contiene configuraciones y utilidades de animación                          *
 */
// Note: Removed custom region for documentation to adhere to standard format.

//#region [head] - 🏷️ IMPORTS 🏷️
import { Variants, Variant } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { obtenerMiembrosConPerfilesYRolesDelProyecto } from "@/lib/actions/member-actions";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { ProTable } from "@/components/ui/pro-table";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { UserPlus, AlertCircle, Trash2, PenLine, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState } from "@/components/common/empty-state";
import type { ProjectMemberDetails } from "@/lib/actions/member-actions";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { PageBackground } from "@/components/ui/page-background";
import { Divider } from "@/components/ui/divider";
import { CellVariant } from "@/lib/theme/components/table-tokens";
import { BadgeCustom } from "@/components/ui/badge-custom"; //
import type { BadgeVariant } from "@/lib/theme/components/badge-tokens";
import { PageTitle } from "@/components/ui/page-title";
import Link from "next/link";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// Types are imported (ProjectMemberDetails, BadgeVariant, CellVariant)
// or defined by usage (columnas for ProTable).
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function MiembrosPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	//#region [sub] - 🧰 HOOKS, STATE, EFFECTS & HANDLERS 🧰
	const { proyectoActual, loadingProyectos } = useAuth();
	const { toast } = useToast();

	const [miembros, setMiembros] = useState<ProjectMemberDetails[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const puedeGestionarMiembros =
		proyectoActual?.permissions?.can_manage_master_data || false;

	const cargarMiembros = async () => {
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
	};

	useEffect(() => {
		if (proyectoActual?.id) {
			cargarMiembros();
		}
	}, [proyectoActual?.id]);

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
	const columnas = [
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
			cell: ({ getValue }: any) => getValue(),
			meta: {
				textColorVariant: "secondary" as CellVariant,
				isTextBold: true,
			},
		},
		{
			header: "Institución",
			accessorFn: (row: ProjectMemberDetails) =>
				row.profile?.primary_institution || "No especificada",
			cell: ({ getValue }: any) => getValue(),
		},
		{
			header: "Correo",
			accessorFn: (row: ProjectMemberDetails) =>
				row.profile?.public_contact_email || "No especificado",
			cell: ({ getValue }: any) => getValue(),
		},
		{
			header: "Rol",
			accessorFn: (row: ProjectMemberDetails) =>
				row.role_name || "Sin rol asignado",
			cell: ({ getValue }: any) => (
				<BadgeCustom
					variant={"default" as BadgeVariant}
					subtle={true}
					className="text-xs">
					{getValue()}
				</BadgeCustom>
			),
		},
		{
			header: "Acciones",
			cell: ({ row }: any) => {
				const miembro = row.original as ProjectMemberDetails;
				return (
					<div className="flex gap-2 justify-end">
						<StandardButton
							styleType="ghost"
							size="icon"
							onClick={() => handleVerMiembro(miembro)}
							tooltip="Ver detalles"
							
						>
							<StandardIcon><Eye /></StandardIcon>
							<span className="sr-only">Ver detalles</span>
						</StandardButton>
						{puedeGestionarMiembros && (
							<>
								<StandardButton
									styleType="ghost"
									size="icon"
									onClick={() => handleEditarMiembro(miembro)}
									tooltip="Editar miembro"
									
								>
									<StandardIcon><PenLine /></StandardIcon>
									<span className="sr-only">Editar</span>
								</StandardButton>
								<StandardButton
									styleType="ghost"
									size="icon"
									onClick={() => handleEliminarMiembro(miembro)}
									colorScheme="danger"
									tooltip="Eliminar miembro"
									
								>
									<StandardIcon><Trash2 /></StandardIcon>
									<span className="sr-only">Eliminar</span>
								</StandardButton>
							</>
						)}
					</div>
				);
			},
		},
	];
	/*
const getRowTextColorVariantForRow = (row: ProjectMemberDetails): CellVariant | undefined => {
    if (row.profile?.public_display_name === "eRRRe") return "accent"; // Fila de Luis tendrá texto accent como base
    return undefined;
  };
  
  const isRowTextBoldForRow = (row: ProjectMemberDetails): boolean | undefined => {
    if (row.profile?.public_display_name === "eRRRe") return true; // Filas "complicated" serán 
    return undefined;
  };
*/
	//#endregion ![sub_render_logic]

	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		<PageBackground>
			<div className="container mx-auto py-6">
				<div className="space-y-6">
					<PageTitle
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
									<Link href="/datos-maestros/miembros/crear" passHref>
										<StandardButton colorScheme="primary" styleType="solid">
											<StandardIcon><UserPlus /></StandardIcon>
											Agregar Nuevo Miembro
										</StandardButton>
									</Link>
								) : undefined
							}
						/>
					) : (
						<StandardCard
							disableShadowHover={true}
							styleType="subtle"
							colorScheme="secondary"
							accentPlacement="top"
							accentColorScheme="neutral"
							shadow="md"
							className="overflow-hidden hover:shadow-md transition-shadow duration-300"
						>
							{puedeGestionarMiembros && (
								<div className="flex justify-end mb-4 pt-4">
									<StandardButton
										onClick={handleAgregarMiembro}
										colorScheme="primary"
										styleType="solid"
									>
										<StandardIcon><UserPlus /></StandardIcon>
										Agregar Miembro
									</StandardButton>
								</div>
							)}
							<StandardCard
								styleType="subtle"
								colorScheme="primary"
								hasOutline={false}
								shadow="none"
								disableShadowHover={true}
								accentPlacement="none"
							>
								<ProTable
									data={miembros}
									columns={columnas}
									showColumnSelector={false}
								/>
							</StandardCard>
						</StandardCard>
					)}
					{/* //#endregion [render_sub] */}
				</div>
			</div>
		</PageBackground>
	);
	//#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Implementar la funcionalidad de eliminación real (actualmente redirige a una página de confirmación).
// Considerar paginación para la tabla si la lista de miembros puede ser muy larga.
// Mejorar el feedback visual durante la carga o errores (ej. skeletons).
//#endregion ![todo]
