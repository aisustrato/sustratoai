"use client";

// 📍 app/cognetica/[id]/DocumentoMdjViewer.tsx
// 🎯 Wrapper del visor MDJ para documentos de texto de Cognética.
// 🔧 Imita la forma de props de DocumentoMarkdownViewer (content/titulo) para que
//    el reemplazo en ArtefactoView sea un ternario mínimo detrás de un flag.
//
// Resalta las entidades (autores/pensadores, conceptos, teorías, disciplinas)
// del artefacto dentro del texto. Las menciones se cargan desde un cache
// compartido por artefacto (precargable en segundo plano). El documento se
// muestra enseguida; un indicador en la esquina avisa mientras se buscan las
// marcas, que aparecen cuando las menciones están listas.

import { useEffect, useState } from "react";
import { StandardMDJViewerClient } from "@/components/mdj-viewer";
import { StandardText } from "@/components/ui/StandardText";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { parsearMDJ } from "@/lib/mdj/parser";
import type { Anotacion } from "@/lib/mdj/types";
import { cargarMencionesEntidades } from "./menciones-cache";
import { mencionesAAnotaciones } from "./menciones-a-anotaciones";

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
	const [cargando, setCargando] = useState(true);

	useEffect(() => {
		let cancelado = false;
		setCargando(true);
		cargarMencionesEntidades(artefactoId)
			.then((menciones) => {
				if (cancelado) return;
				const doc = parsearMDJ(content, artefactoId);
				setAnotaciones(mencionesAAnotaciones(doc, menciones));
				setCargando(false);
			})
			.catch((err) => {
				console.error("[cognetica:visor-mdj] resaltado de entidades:", err);
				if (!cancelado) setCargando(false);
			});
		return () => {
			cancelado = true;
		};
	}, [content, artefactoId]);

	return (
		<div className={`relative ${className}`}>
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

			{cargando ? (
				<div className="absolute top-2 right-2 z-10 flex items-center gap-2 rounded-md border border-neutral-200 bg-white/90 px-2 py-1 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/90">
					<SustratoLoadingLogo size={18} text="" />
					<StandardText size="xs" colorScheme="neutral" colorShade="subtle">
						Buscando menciones…
					</StandardText>
				</div>
			) : null}

			<StandardMDJViewerClient
				md={content}
				artefactoId={artefactoId}
				anotaciones={anotaciones}
			/>
		</div>
	);
}
