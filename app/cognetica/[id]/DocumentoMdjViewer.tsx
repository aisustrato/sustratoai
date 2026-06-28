"use client";

// 📍 app/cognetica/[id]/DocumentoMdjViewer.tsx
// 🎯 Wrapper del visor MDJ para documentos de texto de Cognética.
// 🔧 Imita la forma de props de DocumentoMarkdownViewer (content/titulo) para que
//    el reemplazo en ArtefactoView sea un ternario mínimo detrás de un flag.
//
// El MDJ es el nuevo MD: el `content` ya puede venir como MDJ serializado (con sus
// anotaciones horneadas) y entonces el visor pinta EN FRÍO desde ahí, sin tocar la
// base. Si `content` todavía es MD plano (legacy), se hornea una vez (server) y se
// usa el resultado. La interacción con las anotaciones es de la próxima fase.

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { StandardMDJViewerClient } from "@/components/mdj-viewer";
import { StandardAlert } from "@/components/ui/StandardAlert";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import type { Anotacion, DocumentoMDJ } from "@/lib/mdj/types";
import { esMdj, mdjDesdeContenido, mdDesdeContenido } from "@/lib/cognetica-forense/mdj-contenido";
import { asegurarMdjCacheado } from "./mdj-cache";

/** Documento que esta instancia está renderizando. */
export type DocumentoTipo =
	| "cronica" | "destilado" | "nucleo" | "germinal" | "original";

interface DocumentoMdjViewerProps {
	/** Contenido del documento (MDJ serializado o MD plano legacy). */
	content: string;
	/** Título opcional del documento */
	titulo?: string;
	/** ID del artefacto */
	artefactoId: string;
	/** Cuál documento es */
	documento: DocumentoTipo;
	/** Clases CSS adicionales para el contenedor */
	className?: string;
	/**
	 * Callback de descarga Obsidian-friendly (frontmatter + semillas + SHA-256).
	 * Misma capacidad que tenía el visor legacy (`DocumentoMarkdownViewer`); el
	 * MDJ no debe perderla al ser el visor por default.
	 */
	onDescargarObsidiana?: () => void;
	/** SHA-256 de la última descarga Obsidian (muestra 8 chars en tooltip). */
	sha256Descarga?: string | null;
}

export function DocumentoMdjViewer({
	content,
	titulo,
	artefactoId,
	documento,
	className = "",
	onDescargarObsidiana,
	sha256Descarga,
}: DocumentoMdjViewerProps) {
	const [docMdj, setDocMdj] = useState<DocumentoMDJ | null>(null);
	const [anotaciones, setAnotaciones] = useState<Anotacion[]>([]);
	const [error, setError] = useState<string | null>(null);

	// MD para el visor (export del MDJ o el MD legacy). Memoizado: el visor pinta
	// desde `docMdj`, así que no re-parsea esto, pero evita exportar en cada render.
	const md = useMemo(() => mdDesdeContenido(content), [content]);

	useEffect(() => {
		let cancelado = false;
		setError(null);

		if (esMdj(content)) {
			// Ya horneado → pintar EN FRÍO desde el propio contenido (sin fetch).
			const doc = mdjDesdeContenido(content, artefactoId);
			setDocMdj(doc);
			setAnotaciones(doc.anotaciones ?? []);
			return () => {
				cancelado = true;
			};
		}

		// Legacy (MD plano): mostrar el documento ya (nodos del MD) y hornear las
		// anotaciones una vez en el server.
		setDocMdj(mdjDesdeContenido(content, artefactoId));
		setAnotaciones([]);
		asegurarMdjCacheado(artefactoId)
			.then((mapa) => {
				if (cancelado) return;
				const doc = (mapa as Record<string, DocumentoMDJ | undefined>)[documento];
				if (doc) {
					setDocMdj(doc);
					setAnotaciones(doc.anotaciones ?? []);
				}
			})
			.catch((err: unknown) => {
				if (cancelado) return;
				const msg = err instanceof Error ? err.message : String(err);
				console.error("[cognetica:visor-mdj] hornear MDJ:", msg);
				setError(msg);
			});

		return () => {
			cancelado = true;
		};
	}, [content, artefactoId, documento]);

	return (
		<div className={`relative ${className}`}>
			{titulo || onDescargarObsidiana ? (
				<div className="mb-3 flex items-center justify-between gap-3">
					{titulo ? (
						<StandardText
							asElement="h3"
							size="lg"
							weight="semibold"
							colorScheme="primary"
						>
							{titulo}
						</StandardText>
					) : <span />}

					{onDescargarObsidiana ? (
						<StandardButton
							styleType="outline"
							size="sm"
							leftIcon={Download}
							onClick={onDescargarObsidiana}
							colorScheme="primary"
							tooltip={
								sha256Descarga
									? `SHA-256: ${sha256Descarga.slice(0, 8)}…`
									: "Descargar para Obsidian (con frontmatter y semillas)"
							}
						>
							Obsidian
						</StandardButton>
					) : null}
				</div>
			) : null}

			{/* Error VISIBLE: si falla el horneado, se muestra (no se pinta el
			    documento en blanco sin explicación). */}
			{error ? (
				<StandardAlert
					className="mb-3"
					colorScheme="danger"
					message={
						<>
							<StandardText size="sm" weight="semibold">
								No se pudo cargar el resaltado MDJ
							</StandardText>
							<StandardText size="xs" colorShade="subtle">
								{error}
							</StandardText>
						</>
					}
				/>
			) : null}

			<StandardMDJViewerClient
				md={md}
				artefactoId={artefactoId}
				documento={docMdj ?? undefined}
				anotaciones={anotaciones}
			/>
		</div>
	);
}
