//. 📍 app/cognetica/[id]/BorrarButton.tsx
/**
 * Botón de **eliminación de artefacto** con confirmación modal.
 *
 * - Muestra un botón danger (rojo) con ícono de trash
 * - Al hacer click abre un StandardDialog de confirmación
 * - Muestra advertencia sobre los datos que se eliminarán
 * - Requiere escribir "BORRAR" para confirmar (previene clicks accidentales)
 * - Tras éxito: redirige a `/cognetica` con toast de éxito
 *
 * **Destructivo**: Esta acción elimina permanentemente:
 *   - Crónica, Destilado, Núcleo, Germinal
 *   - Todas las menciones cartografiadas y sus ediciones humanas
 *   - Referencias bibliográficas asociadas
 *   - El artefacto mismo
 */
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";

import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardAlert } from "@/components/ui/StandardAlert";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardText } from "@/components/ui/StandardText";
import { toast } from "sonner";

import { borrarArtefacto } from "@/lib/actions/cognetica-forense-borrar-artefacto-actions";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
interface BorrarButtonProps {
	/** ID del artefacto a eliminar */
	artefactoId: string;
	/** Nombre/título del artefacto para mostrar en el modal */
	artefactoTitulo: string;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export function BorrarButton({
	artefactoId,
	artefactoTitulo,
}: BorrarButtonProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [confirmText, setConfirmText] = useState("");
	const [deleting, setDeleting] = useState(false);

	const puedeConfirmar = confirmText.trim().toUpperCase() === "BORRAR";

	async function handleDelete() {
		if (!puedeConfirmar) return;

		setDeleting(true);

		try {
			const res = await borrarArtefacto(artefactoId);
			if (!res.ok) {
				toast.error("No se pudo eliminar el artefacto", {
					description: `Código: ${res.error}. Revisa la consola del servidor.`,
					duration: Infinity,
				});
			} else {
				toast.success("Artefacto eliminado", {
					description: `"${artefactoTitulo}" se eliminó permanentemente.`,
				});
				setOpen(false);
				router.push("/cognetica");
			}
		} catch (err) {
			console.error("[BorrarButton] Excepción inesperada:", err);
			const msg = err instanceof Error ? err.message : "Error desconocido del cliente";
			toast.error("Error al eliminar artefacto", {
				description: msg,
				duration: Infinity,
			});
		} finally {
			setDeleting(false);
		}
	}

	function handleOpenChange(newOpen: boolean) {
		setOpen(newOpen);
		if (!newOpen) {
			setConfirmText("");
		}
	}

	return (
		<StandardDialog open={open} onOpenChange={handleOpenChange}>
			<StandardDialog.Trigger asChild>
				<StandardButton
					colorScheme="danger"
					styleType="outline"
					size="sm"
					leftIcon={Trash2}
					title="Eliminar artefacto">
					Borrar
				</StandardButton>
			</StandardDialog.Trigger>

			<StandardDialog.Content colorScheme="danger" size="md">
				<StandardDialog.Header>
					<StandardDialog.Title className="flex items-center gap-2 text-danger">
						<AlertTriangle className="w-5 h-5" />
						¿Eliminar artefacto?
					</StandardDialog.Title>
				</StandardDialog.Header>

				<StandardDialog.Body className="space-y-4">
					<StandardAlert
						colorScheme="danger"
						styleType="subtle"
						title="Esta acción es irreversible"
						message={
							`Se eliminará permanentemente "${artefactoTitulo}" y todos sus datos asociados: ` +
							"Crónica, Destilado, Núcleo, Germinal, menciones cartografiadas, ediciones humanas y referencias bibliográficas."
						}
					/>

					<div className="space-y-2">
						<StandardText size="sm">
							Para confirmar, escribe{" "}
							<strong className="text-danger">BORRAR</strong>:
						</StandardText>
						<StandardInput
							value={confirmText}
							onChange={(e) => setConfirmText(e.target.value)}
							placeholder="Escribe BORRAR"
							className="uppercase"
							autoComplete="off"
							disabled={deleting}
						/>
					</div>

				</StandardDialog.Body>

				<StandardDialog.Footer className="flex justify-end gap-2">
					<StandardButton
						colorScheme="neutral"
						styleType="ghost"
						onClick={() => setOpen(false)}
						disabled={deleting}>
						Cancelar
					</StandardButton>
					<StandardButton
						colorScheme="danger"
						styleType="solid"
						leftIcon={Trash2}
						loading={deleting}
						loadingText="Eliminando…"
						onClick={handleDelete}
						disabled={!puedeConfirmar || deleting}>
						Eliminar permanentemente
					</StandardButton>
				</StandardDialog.Footer>
			</StandardDialog.Content>
		</StandardDialog>
	);
}
//#endregion ![main]
