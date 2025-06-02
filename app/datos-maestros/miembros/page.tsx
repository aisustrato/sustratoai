//. 📍 app/datos-maestros/miembros/page.tsx
"use client";

//#region [comment] - 📚 DOCUMENTACIÓN 📚
/* *
 * Definiciones de animaciones para el componente Button                       *
 * Contiene configuraciones y utilidades de animación                          *
 */
//#endregion ![comment]

//#region [imports] - 🏷️ IMPORTS 🏷️
import { Variants, Variant } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { obtenerMiembrosConPerfilesYRolesDelProyecto } from "@/lib/actions/member-actions";
import { Text } from "@/components/ui/text";
import { ProCard } from "@/components/ui/pro-card";
import { ProTable } from "@/components/ui/pro-table";
import { CustomButton } from "@/components/ui/custom-button";
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
//#endregion ![imports]

//#region [main] - 🏷️ DEFAULT 🏷️
export default function MiembrosPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
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

	//#region [setup] - 🏷️ Pro-Table 🏷️
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
						<CustomButton
							variant="ghost"
							size="icon"
							onClick={() => handleVerMiembro(miembro)}
							iconOnly
							tooltip="Ver detalles">
							<Eye className="h-5 w-5" />
							<span className="sr-only">Ver detalles</span>
						</CustomButton>
						{puedeGestionarMiembros && (
							<>
								<CustomButton
									variant="ghost"
									size="icon"
									onClick={() => handleEditarMiembro(miembro)}
									iconOnly
									tooltip="Editar miembro">
									<PenLine className="h-5 w-5" />
									<span className="sr-only">Editar</span>
								</CustomButton>
								<CustomButton
									variant="ghost"
									size="icon"
									onClick={() => handleEliminarMiembro(miembro)}
									iconOnly
									color="danger"
									tooltip="Eliminar miembro">
									<Trash2 className="h-5 w-5 text-destructive" />
									<span className="sr-only">Eliminar</span>
								</CustomButton>
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
	//#endregion ![setup]
	//#endregion ![main]

	//#region [render] - 🏷️ Render 🏷️
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
						<ProCard className="border-destructive bg-destructive/5">
							<div className="flex items-center gap-3">
								<AlertCircle className="h-6 w-6 text-destructive" />
								<Text>Error: {error}</Text>
							</div>
						</ProCard>
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
										<CustomButton color="primary" leftIcon={<UserPlus />}>
											Agregar Nuevo Miembro
										</CustomButton>
									</Link>
								) : undefined
							}
						/>
					) : (
						<ProCard
							variant="secondary"
							border="top"
							className="overflow-hidden hover:shadow-md transition-shadow duration-300"
							borderVariant="primary">
							{puedeGestionarMiembros && (
								// ... existing code ...
								<div className="flex justify-end mb-4 pt-4">
									<CustomButton
										onClick={handleAgregarMiembro}
										leftIcon={<UserPlus className="h-4 w-4" />}
										color="primary">
										Agregar Miembro
									</CustomButton>
								</div>
							)}
							<ProCard>
								<ProTable
									data={miembros}
									columns={columnas}
									showColumnSelector={false}
								/>
							</ProCard>
						</ProCard>
					)}
				</div>
			</div>
		</PageBackground>
	);
}
//#endregion ![render]
