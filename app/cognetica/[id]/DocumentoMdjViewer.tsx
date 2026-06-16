"use client";

// 📍 app/cognetica/[id]/DocumentoMdjViewer.tsx
// 🎯 Wrapper de solo lectura del visor MDJ para documentos de texto de Cognética.
// 🔧 Imita la forma de props de DocumentoMarkdownViewer (content/titulo) para que
//    el reemplazo en ArtefactoView sea un ternario mínimo detrás de un flag.
//
// Fase 1 del requerimiento docs/cognetica/2026-06-16_REQUERIMIENTO_visor-mdj-en-cognetica.md:
// solo render (sin menciones, sin selección, sin callbacks). Las anotaciones y
// el anclaje por nodo_id llegan en fases siguientes.

import { StandardMDJViewerClient } from "@/components/mdj-viewer";
import { StandardText } from "@/components/ui/StandardText";

interface DocumentoMdjViewerProps {
	/** Contenido markdown a visualizar */
	content: string;
	/** Título del documento (cabecera opcional) */
	titulo?: string;
	/** ID del artefacto — el visor lo necesita aunque no haya callbacks */
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
			<StandardMDJViewerClient md={content} artefactoId={artefactoId} />
		</div>
	);
}
