//. 📍 app/cognetica/[id]/CartografiadorButton.tsx
/**
 * Botón de UI del **Cartografiador** (segundo pipeline, Hito 3 · Oleada 2).
 *
 * Se habilita cuando el artefacto tiene los 4 formatos primarios en
 * verde (Crónica + Destilado + Núcleo + Germinal). Al disparar, ejecuta
 * `ejecutarCartografiador(artefactoId)` y muestra un resumen de la
 * corrida (`N matches, M nuevas, K ambiguas`).
 *
 * **Filosofía:** UI mínima viable (guía §3 HITO 3). El detalle visual de
 * las menciones resueltas se implementa en Hito 4 (tabs de menciones en
 * `ArtefactoView`).
 */
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState } from "react";
import { Compass } from "lucide-react";
import { toast } from "sonner";

import { StandardButton } from "@/components/ui/StandardButton";
import {
	ejecutarCartografiador,
	type ResultadoCartografiador,
} from "@/lib/actions/cognetica-forense-cartografiador-actions";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
interface CartografiadorButtonProps {
	artefactoId: string;
	/**
	 * Se pasa en `true` cuando los 4 formatos primarios están generados
	 * y el estado no es `metabolizando`. Si es `false`, el botón no se
	 * renderiza — evita que el usuario intente cartografiar un artefacto
	 * incompleto.
	 */
	habilitado: boolean;
	/**
	 * Callback llamado cuando la cartografiación es exitosa.
	 * Permite al padre refrescar solo la sección de menciones
	 * sin hacer un refresh completo de la página.
	 */
	onSuccess?: () => void;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export function CartografiadorButton({
	artefactoId,
	habilitado,
	onSuccess,
}: CartografiadorButtonProps) {
	const [running, setRunning] = useState(false);

	if (!habilitado) return null;

	async function handleClick() {
		setRunning(true);
		const toastId = toast.loading(
			"Cartografiando menciones… No cierres esta pestaña. Puede tomar 30s–2 min.",
		);

		try {
			const res = await ejecutarCartografiador(artefactoId);

			if (!res.ok) {
				toast.error(`Falló la cartografiación: ${res.error}`, {
					id: toastId,
					description:
						"Revisa la consola del servidor. Puedes reintentar — las menciones ya cartografiadas no se re-procesan.",
					duration: Infinity,
				});
			} else {
				const data = res.data;
				const mensaje = formatearResumen(data);

				if (data.total_menciones === 0) {
					toast.info("Sin menciones pendientes", {
						id: toastId,
						description:
							"No hay menciones con estado 'sin cartografiar' en este artefacto.",
					});
				} else {
					toast.success("Cartografiado completado", {
						id: toastId,
						description: mensaje,
					});
				}

				// Llamar al callback para refrescar solo la sección de menciones
				onSuccess?.();
			}
		} catch (err) {
			console.error("[CartografiadorButton] excepción inesperada:", err);
			toast.error("Error inesperado", {
				id: toastId,
				description:
					err instanceof Error ? err.message : "Error desconocido del cliente",
				duration: Infinity,
			});
		} finally {
			setRunning(false);
		}
	}

	return (
		<StandardButton
			colorScheme="tertiary"
			styleType="solid"
			leftIcon={Compass}
			loading={running}
			loadingText="Cartografiando…"
			onClick={handleClick}>
			Ejecutar Cartografiador
		</StandardButton>
	);
}
//#endregion ![main]

//#region [helpers] - 🛠️ FORMATEADOR DE RESUMEN 🛠️
function formatearResumen(r: ResultadoCartografiador): string {
	if (r.total_menciones === 0) {
		return "No hay menciones con estado 'sin cartografiar' en este artefacto.";
	}
	const partes = [
		`${r.matches} match${r.matches === 1 ? "" : "es"}`,
		`${r.nuevas} nueva${r.nuevas === 1 ? "" : "s"}`,
		`${r.ambiguas} ambigua${r.ambiguas === 1 ? "" : "s"}`,
	];
	if (r.inconsistentes > 0) {
		partes.push(
			`${r.inconsistentes} inconsistente${r.inconsistentes === 1 ? "" : "s"}`,
		);
	}
	if (r.canonicas_creadas > 0) {
		partes.push(
			`${r.canonicas_creadas} canónica${r.canonicas_creadas === 1 ? "" : "s"} creada${r.canonicas_creadas === 1 ? "" : "s"}`,
		);
	}
	const costo = r.costo_usd > 0 ? ` · US$${r.costo_usd.toFixed(4)}` : "";
	return `${partes.join(", ")}${costo}`;
}
//#endregion ![helpers]
