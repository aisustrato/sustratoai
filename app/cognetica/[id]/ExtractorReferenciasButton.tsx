//. 📍 app/cognetica/[id]/ExtractorReferenciasButton.tsx
/**
 * Botón de UI del **Extractor de Referencias** (pipeline post-Destilado, Hito 6 · Opción B).
 *
 * Se habilita cuando el artefacto tiene Destilado completado (incluyendo
 * total_referencias_detectadas). Ejecuta el pipeline con validación de
 * exhaustividad y máximo 2 reintentos.
 *
 * Muestra resultados con colores por nivel de confianza 1-5:
 * - 4-5: Verde (Excelente/Buena)
 * - 3: Amarillo (Aceptable)
 * - 1-2: Rojo (Dudosa/Muy dudosa)
 */
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

import { StandardButton } from "@/components/ui/StandardButton";
import {
	ejecutarExtraccionReferencias,
	type ResultadoExtraccionReferencias,
} from "@/lib/actions/cognetica-forense-extractor-referencias-actions";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
interface ExtractorReferenciasButtonProps {
	artefactoId: string;
	/**
	 * Se pasa en `true` cuando el Destilado está completo.
	 * Si es `false`, el botón no se renderiza.
	 */
	habilitado: boolean;
	/**
	 * Callback llamado cuando la extracción es exitosa.
	 * Permite al padre refrescar solo las secciones necesarias (referencias/fuentes)
	 * sin hacer un refresh completo de la página.
	 */
	onSuccess?: () => void;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export function ExtractorReferenciasButton({
	artefactoId,
	habilitado,
	onSuccess,
}: ExtractorReferenciasButtonProps) {
	const [running, setRunning] = useState(false);

	if (!habilitado) return null;

	async function handleClick() {
		setRunning(true);
		const toastId = toast.loading(
			"Extrayendo referencias con validación de exhaustividad…",
		);

		try {
			const res = await ejecutarExtraccionReferencias({ artefactoId });

			if (!res.ok) {
				toast.error(`Falló la extracción: ${res.error}`, {
					id: toastId,
					description:
						"Revisa la consola del servidor. Puedes reintentar — las referencias ya extraídas no se duplican.",
					duration: Infinity,
				});
			} else {
				const data = res.data;
				const mensaje = formatearResumen(data);

				if (data.faltantes > 0) {
					toast.warning(`Extracción parcial (${data.intentos} intentos)`, {
						id: toastId,
						description: mensaje,
						duration: Infinity,
					});
				} else {
					toast.success(`Extracción completada (${data.intentos} intentos)`, {
						id: toastId,
						description: mensaje,
					});
				}

				// Llamar al callback para refrescar solo las secciones necesarias
				onSuccess?.();
			}
		} catch (err) {
			console.error("[ExtractorReferenciasButton] excepción inesperada:", err);
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
			colorScheme="accent"
			styleType="solid"
			leftIcon={BookOpen}
			loading={running}
			loadingText="Extrayendo…"
			onClick={handleClick}>
			Extraer Referencias
		</StandardButton>
	);
}
//#endregion ![main]

//#region [helpers] - 🛠️ FORMATEADOR DE RESUMEN 🛠️
function formatearResumen(r: ResultadoExtraccionReferencias): string {
	const partes = [`${r.extraidas} de ${r.esperadas} referencias extraídas`];

	if (r.faltantes > 0) {
		partes.push(`${r.faltantes} faltantes`);
	}

	// Calcular distribución por confianza
	const porConfianza = contarPorConfianza(r.referencias);
	if (porConfianza.excelente > 0) {
		partes.push(
			`${porConfianza.excelente} excelente${porConfianza.excelente === 1 ? "" : "s"}`,
		);
	}
	if (porConfianza.buena > 0) {
		partes.push(
			`${porConfianza.buena} buena${porConfianza.buena === 1 ? "" : "s"}`,
		);
	}
	if (porConfianza.aceptable > 0) {
		partes.push(
			`${porConfianza.aceptable} aceptable${porConfianza.aceptable === 1 ? "" : "s"}`,
		);
	}
	if (porConfianza.dudosa > 0) {
		partes.push(
			`${porConfianza.dudosa} dudosa${porConfianza.dudosa === 1 ? "" : "s"}`,
		);
	}
	if (porConfianza.muyDudosa > 0) {
		partes.push(
			`${porConfianza.muyDudosa} muy dudosa${porConfianza.muyDudosa === 1 ? "" : "s"}`,
		);
	}

	return partes.join(" · ");
}

function contarPorConfianza(referencias: { nivel_confianza: number }[]): {
	excelente: number;
	buena: number;
	aceptable: number;
	dudosa: number;
	muyDudosa: number;
} {
	return referencias.reduce(
		(acc, ref) => {
			switch (ref.nivel_confianza) {
				case 5:
					acc.excelente++;
					break;
				case 4:
					acc.buena++;
					break;
				case 3:
					acc.aceptable++;
					break;
				case 2:
					acc.dudosa++;
					break;
				case 1:
				default:
					acc.muyDudosa++;
					break;
			}
			return acc;
		},
		{ excelente: 0, buena: 0, aceptable: 0, dudosa: 0, muyDudosa: 0 },
	);
}
//#endregion ![helpers]
