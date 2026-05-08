//. 📍 app/cognetica/[id]/hooks/useDescargaObsidiana.ts
/**
 * Hook compartido para descargas Obsidian-friendly por sección.
 *
 * Toma el artefacto + proyecto del auth context y expone
 * `descargarSeccion(tipoSeccion, contenidoMD)` que genera el MD
 * con frontmatter YAML, lo hashea, y dispara la descarga.
 *
 * Fase 2 del plan de descargas Obsidian-friendly (2026-05-06).
 */
"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/app/auth-provider";
import { generarDescargaObsidian } from "@/lib/cognetica-forense/exportacion";
import type { TipoSeccionDescarga } from "@/lib/cognetica-forense/exportacion";

interface UseDescargaObsidianaParams {
	/** ID del artefacto (para validación cruzada contra proyecto). */
	artefactoId: string;
	/** ID del proyecto al que pertenece el artefacto. */
	projectId: string;
	/** Título del artefacto. */
	titulo: string;
	/** Tipo del artefacto. */
	tipoArtefacto: string;
	/** SHA256 canónico del artefacto. */
	sha256Artefacto: string;
	/** Tags extraídos de menciones (semillas para el grafo Obsidian). */
	semillas?: string[];
}

interface UseDescargaObsidianaReturn {
	/** Descarga una sección específica como archivo `.md` Obsidian-friendly. */
	descargarSeccion: (
		tipoSeccion: TipoSeccionDescarga,
		contenidoMD: string,
	) => Promise<void>;
	/** SHA-256 de la última descarga generada (primeros 8 chars para UI). */
	sha256Actual: string | null;
	/** `true` mientras se está generando/hasheando la descarga. */
	descargando: boolean;
}

/**
 * Hook para descargar secciones del artefacto en formato
 * Obsidian-friendly con frontmatter y certificación SHA-256.
 */
export function useDescargaObsidiana({
	artefactoId,
	projectId,
	titulo,
	tipoArtefacto,
	sha256Artefacto,
	semillas = [],
}: UseDescargaObsidianaParams): UseDescargaObsidianaReturn {
	const { proyectoActual } = useAuth();
	const [sha256Actual, setSha256Actual] = useState<string | null>(null);
	const [descargando, setDescargando] = useState(false);

	const descargarSeccion = useCallback(
		async (tipoSeccion: TipoSeccionDescarga, contenidoMD: string) => {
			// Validación cruzada: el artefacto debe pertenecer al proyecto activo
			const proyectoNombre = proyectoActual?.name ?? "Proyecto sin nombre";
			const proyectoUUID = proyectoActual?.id ?? projectId;

			if (proyectoActual && proyectoActual.id !== projectId) {
				console.warn(
					`[useDescargaObsidiana] Artefacto ${artefactoId.slice(0, 8)} pertenece al proyecto ${projectId.slice(0, 8)}, pero el proyecto activo es ${proyectoActual.id.slice(0, 8)}. Se usan tags genéricos.`,
				);
			}

			setDescargando(true);
			setSha256Actual(null);

			try {
				const { contenido, sha256, nombreArchivo } =
					await generarDescargaObsidian({
						titulo,
						proyecto: proyectoNombre,
						proyectoId: proyectoUUID,
						tipoArtefacto,
						tipoSeccion,
						sha256Artefacto,
						contenidoMD,
						semillas,
					});

				// Crear Blob y disparar descarga
				const blob = new Blob([contenido], {
					type: "text/markdown;charset=utf-8",
				});
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = nombreArchivo;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);

				setSha256Actual(sha256);
			} catch (err) {
				console.error(
					`[useDescargaObsidiana] Error al descargar ${tipoSeccion}:`,
					err,
				);
			} finally {
				setDescargando(false);
			}
		},
		[
			artefactoId,
			projectId,
			titulo,
			tipoArtefacto,
			sha256Artefacto,
			semillas,
			proyectoActual,
		],
	);

	return {
		descargarSeccion,
		sha256Actual,
		descargando,
	};
}
