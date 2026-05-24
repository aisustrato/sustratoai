//. 📍 app/cognetica/[id]/MetabolizarButton.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, RefreshCw, FastForward } from "lucide-react";

import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { metabolizarArtefacto } from "@/lib/actions/cognetica-forense-metabolizacion-actions";
import type { CgtEstadoMetabolizacion } from "@/lib/cognetica-forense/types";
import { useJobManager } from "@/app/contexts/JobManagerContext";
import { useAuth } from "@/app/auth-provider";
import { toast } from "sonner";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
type FormatoFaltante = "cronica" | "destilado" | "nucleo" | "germinal";

interface MetabolizarButtonProps {
	artefactoId: string;
	/** UUID del proyecto al que pertenece el artefacto — para registrar el job. */
	projectId: string;
	/** Título del artefacto — para el `title` visible en el panel del JobManager. */
	artefactoTitulo: string;
	estado: CgtEstadoMetabolizacion;
	/**
	 * Lista de formatos cuya fila aún NO existe en DB para este artefacto.
	 * La deriva `ArtefactoView` a partir del payload de `obtenerArtefactoCompleto`
	 * (`data.cronica === null`, etc.).
	 */
	faltantes: FormatoFaltante[];
	/**
	 * Callback opcional disparado apenas la action retorna `{jobId}` con éxito.
	 * Permite al padre (ArtefactoView) **encender el stepper optimísticamente**
	 * sin esperar a que llegue el primer evento Realtime del INSERT del job
	 * maestro (~ms a ~1s de latencia que se sentía como freeze al usuario).
	 *
	 * Si la suscripción Realtime falla más tarde, los toasts de error del
	 * handler ya cubren la situación.
	 */
	onMetabolizacionIniciada?: (jobId: string) => void;
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
	projectId,
	artefactoTitulo,
	estado,
	faltantes,
	onMetabolizacionIniciada,
}: MetabolizarButtonProps) {
	const router = useRouter();
	const { startJob } = useJobManager();
	const { user } = useAuth();
	const [running, setRunning] = useState(false);

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
		setRunning(true);
		const toastId = toast.loading("Iniciando metabolización…");

		try {
			// La action ahora es fire-and-forget: retorna `{jobId}` en ms.
			// El proceso real (3+ min) corre en background. El stepper se
			// actualiza vía Realtime al job maestro desde ArtefactoView.
			const res = await metabolizarArtefacto(artefactoId);
			if (!res.ok) {
				toast.error(`No se pudo iniciar: ${res.error}`, {
					id: toastId,
					description:
						"Revisa la consola del servidor. Puedes reintentar — los formatos ya generados no se vuelven a procesar.",
					duration: Infinity,
				});
			} else {
				const jobIdBackend = res.data.jobId;

				// Avisar al padre con el jobId ANTES de toast/refresh para que
				// el stepper se encienda de inmediato (no espere el primer
				// evento Realtime).
				onMetabolizacionIniciada?.(jobIdBackend);

				// Registrar el job en el JobManager — el panel flotante se
				// abre solo y `CogneticaJobHandler` se monta para trackear
				// el progreso vía Realtime sobre el row de ai_job_history.
				// `originPath`: para que el handler ofrezca "Ir al artefacto"
				// cuando termine y el usuario esté en otra ruta.
				const originPath =
					typeof window !== "undefined"
						? window.location.pathname
						: undefined;
				startJob({
					type: "COGNETICA_METABOLIZE",
					title: `Cognética: ${artefactoTitulo}`,
					payload: {
						artefactoId,
						jobIdBackend,
						userId: user?.id ?? "",
						projectId,
						originPath,
					},
				});

				toast.success("Metabolización iniciada", {
					id: toastId,
					description:
						"El stepper muestra el progreso paso a paso, y el panel del JobManager también. Podés cerrar esta pestaña — el proceso sigue en el servidor.",
				});
				// Refrescar para que el estado cambie a "metabolizando" y el
				// botón se oculte (calcularModo). El Realtime de cgt_artefactos
				// también dispara un refresh; este es preventivo.
				router.refresh();
			}
		} catch (err) {
			console.error("[MetabolizarButton] excepción inesperada:", err);
			const msg = err instanceof Error ? err.message : "Error desconocido del cliente";
			toast.error(`No se pudo iniciar: ${msg}`, {
				id: toastId,
				duration: Infinity,
			});
		} finally {
			setRunning(false);
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

		</div>
	);
}
//#endregion ![main]
