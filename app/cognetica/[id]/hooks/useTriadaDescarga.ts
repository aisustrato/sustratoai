//. 📍 app/cognetica/[id]/hooks/useTriadaDescarga.ts
/**
 * Hook para descargar la tríada completa del artefacto (MD + JSON + YAML).
 *
 * Toma el estado actual del artefacto y genera tres archivos:
 * - Markdown para Obsidian (con frontmatter y ajuste de headings)
 * - JSON para pipelines y RAG
 * - YAML para portabilidad fría
 *
 * Cada formato tiene su propio SHA-256 de certificación.
 * Las secciones no metabolizadas se marcan como advertencia, no bloquean.
 */
"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/app/auth-provider";
import { generarTriadaObsidian } from "@/lib/cognetica-forense/exportacion";
import type {
	TriadaParams,
	MencionesExport,
	ReferenciaExport,
} from "@/lib/cognetica-forense/exportacion";

/**
 * SHA de cada formato después de la última generación.
 */
interface ShaTriada {
	md: string | null;
	json: string | null;
	yaml: string | null;
}

export type FormatoTriada = "md" | "json" | "yaml";

export function useTriadaDescarga(params: TriadaParams) {
	const { proyectoActual } = useAuth();
	const [descargando, setDescargando] = useState(false);
	const [shaActual, setShaActual] = useState<ShaTriada>({
		md: null,
		json: null,
		yaml: null,
	});

	/**
	 * Genera la tríada y descarga el formato seleccionado.
	 * Si ya se generó antes en esta sesión, usa el mismo resultado
	 * (mismo SHA) para garantizar consistencia.
	 */
	const [cached, setCached] = useState<{
		md: { contenido: string; sha256: string; nombreArchivo: string };
		json: { contenido: string; sha256: string; nombreArchivo: string };
		yaml: { contenido: string; sha256: string; nombreArchivo: string };
	} | null>(null);

	const descargarTriada = useCallback(
		async (formato: FormatoTriada) => {
			setDescargando(true);
			try {
				// Usar caché si ya se generó en esta sesión
				let resultado = cached;
				if (!resultado) {
					resultado = await generarTriadaObsidian(params);
					setCached(resultado);
				}
				if (!resultado) return; // safety: no debiera ocurrir

				const archivo =
					formato === "md" ? resultado.md
					: formato === "json" ? resultado.json
					: resultado.yaml;

				// Disparar descarga
				const blob = new Blob([archivo.contenido], {
					type:
						formato === "json" ? "application/json;charset=utf-8"
						: formato === "yaml" ? "text/yaml;charset=utf-8"
						: "text/markdown;charset=utf-8",
				});
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = archivo.nombreArchivo;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);

				setShaActual((prev) => ({
					...prev,
					[formato]: archivo.sha256,
				}));
			} catch (err) {
				console.error("[useTriadaDescarga] Error generando tríada:", err);
			} finally {
				setDescargando(false);
			}
		},
		[params, cached],
	);

	/** Regenera la tríada (invalida caché). */
	const regenerar = useCallback(() => {
		setCached(null);
		setShaActual({ md: null, json: null, yaml: null });
	}, []);

	return {
		descargarTriada,
		regenerar,
		descargando,
		shaActual,
	};
}
