//. 📍 app/cognetica/[id]/MetabolizarButton.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, RefreshCw, FastForward } from "lucide-react";

import { StandardAlert } from "@/components/ui/StandardAlert";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { metabolizarArtefacto } from "@/lib/actions/cognetica-forense-metabolizacion-actions";
import type { CgtEstadoMetabolizacion } from "@/lib/cognetica-forense/types";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
type FormatoFaltante = "cronica" | "destilado" | "nucleo" | "germinal";

interface MetabolizarButtonProps {
	artefactoId: string;
	estado: CgtEstadoMetabolizacion;
	/**
	 * Lista de formatos cuya fila aún NO existe en DB para este artefacto.
	 * La deriva `ArtefactoView` a partir del payload de `obtenerArtefactoCompleto`
	 * (`data.cronica === null`, etc.).
	 */
	faltantes: FormatoFaltante[];
}

const ETIQUETA_FORMATO: Record<FormatoFaltante, string> = {
	cronica: "Crónica",
	destilado: "Destilado",
	nucleo: "Núcleo",
	germinal: "Germinal",
};
//#endregion ![def]

//#region [helpers] - 🛠️ MODO DEL BOTÓN 🛠️
/**
 * El botón tiene 3 modos visuales/textuales mutuamente excluyentes. Se
 * calculan a partir del estado del artefacto y de los formatos faltantes:
 *
 *   - `iniciar`   → artefacto recién ingresado, ningún formato generado aún.
 *   - `reintentar`→ artefacto en estado `error` (cualquier combo de faltantes).
 *   - `continuar` → artefacto ya `metabolizado` (o en estado sano) pero con
 *                   al menos un formato faltante — resume-from-last.
 *   - `null`      → no hay nada que hacer (artefacto completo y sano); el
 *                   componente no se renderiza.
 */
type ModoBoton = "iniciar" | "reintentar" | "continuar" | null;

function calcularModo(
	estado: CgtEstadoMetabolizacion,
	faltantes: FormatoFaltante[],
): ModoBoton {
	if (estado === "metabolizando") return null; // el stepper ya refleja el progreso
	if (estado === "error") return "reintentar";
	if (estado === "ingresado") return "iniciar";
	// estado === "metabolizado"
	if (faltantes.length > 0) return "continuar";
	return null;
}
//#endregion ![helpers]

//#region [main] - 🔧 COMPONENT 🔧
/**
 * Botón para **iniciar**, **continuar** o **reintentar** la metabolización.
 *
 * Lógica de visibilidad (ver `calcularModo`):
 *   - `ingresado`               → "Iniciar metabolización"
 *   - `error`                   → "Reintentar metabolización"
 *   - `metabolizado` + faltantes→ "Continuar metabolización"
 *   - otros                     → no se renderiza
 *
 * El Server Action `metabolizarArtefacto` es **resume-from-last** por
 * default: al arrancar hace un scan y saltea los formatos que ya existen.
 * Esto significa que "Continuar" nunca re-genera lo que ya está bueno —
 * sólo corre los pasos faltantes. No hay costo LLM redundante.
 */
export function MetabolizarButton({
	artefactoId,
	estado,
	faltantes,
}: MetabolizarButtonProps) {
	const router = useRouter();
	const [running, setRunning] = useState(false);
	const [errorCode, setErrorCode] = useState<string | null>(null);

	const modo = calcularModo(estado, faltantes);
	if (!modo) return null;

	const etiquetasFaltantes = faltantes.map((f) => ETIQUETA_FORMATO[f]).join(", ");

	const config = {
		iniciar: {
			label: "Iniciar metabolización",
			loadingText: "Metabolizando…",
			colorScheme: "primary" as const,
			icon: PlayCircle,
		},
		reintentar: {
			label: "Reintentar metabolización",
			loadingText: "Reintentando…",
			colorScheme: "warning" as const,
			icon: RefreshCw,
		},
		continuar: {
			label: "Continuar metabolización",
			loadingText: "Continuando…",
			colorScheme: "primary" as const,
			icon: FastForward,
		},
	}[modo];

	async function handleClick() {
		setErrorCode(null);
		setRunning(true);
		try {
			const res = await metabolizarArtefacto(artefactoId);
			if (!res.ok) {
				setErrorCode(res.error);
			}
		} catch (err) {
			console.error("[MetabolizarButton] excepción inesperada:", err);
			setErrorCode(
				err instanceof Error ? err.message : "Error desconocido del cliente",
			);
		} finally {
			setRunning(false);
			router.refresh();
		}
	}

	return (
		<div className="flex flex-col items-end gap-2">
			<StandardButton
				colorScheme={config.colorScheme}
				styleType="solid"
				leftIcon={config.icon}
				loading={running}
				loadingText={config.loadingText}
				onClick={handleClick}
			>
				{config.label}
			</StandardButton>

			{modo === "continuar" && faltantes.length > 0 && !running && (
				<StandardText size="xs" colorScheme="neutral">
					Se generará: {etiquetasFaltantes}
				</StandardText>
			)}

			{running && (
				<StandardText size="xs" colorScheme="neutral">
					No cierres esta pestaña. Puede tomar 1–5 minutos.
				</StandardText>
			)}

			{errorCode && (
				<StandardAlert
					colorScheme="danger"
					styleType="subtle"
					title={`Falló: ${errorCode}`}
					message="Revisa la consola del servidor para ver la traza completa del pipeline."
					className="w-full"
				/>
			)}
		</div>
	);
}
//#endregion ![main]
