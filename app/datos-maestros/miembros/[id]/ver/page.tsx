// app/datos-maestros/miembros/[id]/ver/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import {
	obtenerDetallesMiembroProyecto,
	obtenerRolesDisponiblesProyecto,
	type ProjectMemberDetails,
	type ProjectRoleInfo,
} from "@/lib/actions/member-actions";
import { CustomButton } from "@/components/ui/custom-button";
import { PageHeader } from "@/components/common/page-header";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { ArrowLeft, PenLine, User } from "lucide-react";
import {
	MiembroForm,
	type MiembroFormValues,
} from "@/app/datos-maestros/miembros/components/MiembroForm";
import type { SelectOption } from "@/components/ui/select-custom";
import { Text } from "@/components/ui/text";
import { PageBackground } from "@/components/ui/page-background";
import { PageTitle } from "@/components/ui/page-title";
import { ProCard } from "@/components/ui/pro-card";

export default function VerMiembroPage() {
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
				setError("No hay un proyecto seleccionado.");
				setIsLoading(false);
			}
			return;
		}
		if (!memberId) {
			if (isMounted) {
				setError("ID de miembro no especificado.");
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
				setError(resultadoMiembro.error || "Error al cargar datos del miembro");
			} else if (!resultadoMiembro.data) {
				setError("No se encontró información para este miembro.");
			} else {
				setMiembro(resultadoMiembro.data);
			}
		} catch (err) {
			console.error("Error al cargar datos:", err);
			if (isMounted) {
				setError(`Error inesperado al cargar datos: ${(err as Error).message}`);
			}
		} finally {
			if (isMounted) {
				setIsLoading(false);
			}
		}
		return () => {
			isMounted = false;
		}; // Cleanup function para el useCallback
	}, [proyectoActual?.id, memberId]);

	useEffect(() => {
		let active = true; // Para evitar setear estado si el componente se desmonta

		if (proyectoActual?.id && memberId) {
			setIsLoading(true); // Poner isLoading en true ANTES de llamar a cargar
			cargarDatosCompletos();
		} else {
			// Si no hay proyecto o memberId, no estamos cargando activamente desde el servidor.
			// Decidir qué error mostrar y asegurarse que isLoading sea false.
			if (!proyectoActual?.id) {
				setError("Esperando selección de proyecto...");
			} else if (!memberId) {
				setError("ID de miembro no especificado.");
			}
			setIsLoading(false); // Importante: poner a false si no se cumplen las condiciones de carga
		}

		return () => {
			active = false;
		};
	}, [proyectoActual?.id, memberId, cargarDatosCompletos]);

	const handleVolver = () => {
		router.push("/datos-maestros/miembros");
	};

	const handleEditar = () => {
		router.push(`/datos-maestros/miembros/${memberId}/modificar`);
	};

	const getNombreMiembro = (): string => {
		if (!miembro?.profile) return "Miembro";
		const { public_display_name, first_name, last_name } = miembro.profile;
		if (public_display_name) return public_display_name;
		if (first_name || last_name)
			return `${first_name || ""} ${last_name || ""}`.trim();
		return (
			miembro.profile?.public_contact_email ||
			`Usuario ID: ${miembro.user_id.substring(0, 8)}...`
		);
	};

	const valoresFormulario: MiembroFormValues | undefined = miembro
		? {
				emailUsuario:
					miembro.profile?.public_contact_email ||
					(miembro.user_id
						? `No disponible (ID: ${miembro.user_id.substring(0, 8)}...)`
						: "Email no disponible"),
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

	if (isLoading) {
		return (
			<div className="flex justify-center py-8">
				<SustratoLoadingLogo
					size={50}
					variant="spin-pulse"
					showText
					text="Cargando datos del miembro..."
				/>
			</div>
		);
	}

	if (error && !miembro) {
		return (
			<PageBackground>
				<div className="container mx-auto py-6">
					<div className="space-y-6">
						<PageHeader
							title="Error"
							description={error}
							actions={
								<CustomButton
									onClick={handleVolver}
									leftIcon={<ArrowLeft className="h-4 w-4" />}
									variant="outline">
									Volver a Miembros
								</CustomButton>
							}
						/>
					</div>
				</div>
			</PageBackground>
		);
	}

	if (!miembro || !valoresFormulario) {
		return (
			<PageBackground>
				<div className="container mx-auto py-6">
					<div className="space-y-6">
						<PageHeader
							title="Miembro no encontrado"
							description={
								error ||
								"No se pudo cargar la información del miembro o el miembro no existe."
							}
							actions={
								<CustomButton
									onClick={handleVolver}
									leftIcon={<ArrowLeft className="h-4 w-4" />}
									variant="outline">
									Volver a Miembros
								</CustomButton>
							}
						/>
					</div>
				</div>
			</PageBackground>
		);
	}

	return (
		<PageBackground>
			<div className="container mx-auto py-6">
				<div className="space-y-6">
					<PageTitle
						title={`Detalle de ${getNombreMiembro()}`}
						subtitle="Información del miembro en el proyecto (solo lectura)"
						mainIcon={User}
						breadcrumbs={[
							{ label: "Datos Maestros", href: "/datos-maestros" },
							{ label: "Miembros ", href: "/datos-maestros/miembros" },
							{ label: "Verr Miembro" },
						]}
						showBackButton={{ href: "/datos-maestros/miembros" }}
					/>

					<ProCard border="top" color="primary"   >
						{puedeGestionarMiembros && (
              <div className="flex justify-end pt-3">
							<CustomButton
								onClick={handleEditar}
								leftIcon={<PenLine className="h-4 w-4" />}
								color="primary"
                className="w-full text-right-0 py=3">
								Editar Miembro
							</CustomButton>
              </div>
						)}
				

					<MiembroForm
						modo="ver"
						valoresIniciales={valoresFormulario}
						rolesDisponibles={rolesDisponibles}
					/>
	</ProCard>
					{error && miembro && (
						<div className="mt-4 p-4 bg-warning-muted text-warning-foreground rounded-md text-center ">
							<Text variant="caption" weight="medium">
								Advertencia:
							</Text>
							<Text variant="caption" className="mt-1">
								{error}
							</Text>
							<Text variant="caption" size="xs" className="mt-1 opacity-80">
								(Se muestran los datos de miembro disponibles. Alguna
								información adicional, como la lista completa de roles, podría
								no haberse cargado correctamente).
							</Text>
						</div>
					)}
				</div>
			</div>
		</PageBackground>
	);
}
