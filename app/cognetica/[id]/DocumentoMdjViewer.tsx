"use client";

// 📍 app/cognetica/[id]/DocumentoMdjViewer.tsx
// 🎯 Wrapper del visor MDJ para documentos de texto de Cognética.
// 🔧 Imita la forma de props de DocumentoMarkdownViewer (content/titulo) para que
//    el reemplazo en ArtefactoView sea un ternario mínimo detrás de un flag.
//
// Paso 2 (requerimiento docs/cognetica/2026-06-16_...): resalta los autores
// (pensadores) del artefacto dentro del texto. La dirección se calcula al vuelo
// buscando el nombre canónico (§5), sin persistir en la base. El documento se
// muestra enseguida; los resaltados aparecen cuando llegan las menciones.

import { useEffect, useState } from "react";
import { StandardMDJViewerClient } from "@/components/mdj-viewer";
import { StandardText } from "@/components/ui/StandardText";
import { parsearMDJ } from "@/lib/mdj/parser";
import type { Anotacion } from "@/lib/mdj/types";
import { listarMencionesPorArtefacto } from "@/lib/actions/cognetica-forense-menciones-actions";
import { pensadoresAAnotaciones } from "./menciones-a-anotaciones";

interface DocumentoMdjViewerProps {
	/** Contenido markdown a visualizar */
	content: string;
	/** Título del documento (cabecera opcional) */
	titulo?: string;
	/** ID del artefacto — para resolver sus menciones */
	artefactoId: string;
	/** Clases CSS adicionales para el contenedor */
	className?: string;
}

export function DocumentoMdjViewer({
	content,
	titulo,
	artefactoId,
	className = "",
}: DocumentoMdjViewerProps) {
	const [anotaciones, setAnotaciones] = useState<Anotacion[]>([]);

	useEffect(() => {
		let cancelado = false;
		const cargar = async () => {
			try {
				const res = await listarMencionesPorArtefacto(artefactoId, "pensador");
				if (cancelado) return;
				if (!res.ok) {
					console.error("[cognetica:visor-mdj] listar pensadores:", res);
					return; // degradación: documento sin resaltados
				}
				const doc = parsearMDJ(content, artefactoId);
				const anots = pensadoresAAnotaciones(doc, res.data);
				if (!cancelado) setAnotaciones(anots);
			} catch (err) {
				console.error("[cognetica:visor-mdj] resaltado de autores:", err);
			}
		};
		cargar();
		return () => {
			cancelado = true;
		};
	}, [content, artefactoId]);

	return (
		<div className={className}>
			{titulo ? (
				<StandardText
					asElement="h3"
					size="lg"
					weight="semibold"
					colorScheme="primary"
					className="mb-3"
				>
					{titulo}
				</StandardText>
			) : null}
			<StandardMDJViewerClient
				md={content}
				artefactoId={artefactoId}
				anotaciones={anotaciones}
			/>
		</div>
	);
}
