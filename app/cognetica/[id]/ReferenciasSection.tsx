"use client";

import { useEffect, useState } from "react";
import {
	BookOpen,
	AlertCircle,
	CheckCircle,
	AlertTriangle,
	Download,
	FileDown,
	XCircle,
} from "lucide-react";
import {
	listarReferenciasPorArtefacto,
	type ReferenciaArtefacto,
} from "@/lib/actions/cognetica-forense-referencias-actions";

interface ReferenciasSectionProps {
	artefactoId: string;
	/** Trigger para forzar recarga de datos. Cada cambio de valor dispara un nuevo fetch. */
	refreshTrigger?: number;
	/** Callback para descarga Obsidian-friendly. Recibe el tipo de sección y el contenido MD. */
	onDescargarObsidiana?: (tipo: "referencias", md: string) => Promise<void>;
	/** SHA-256 de la última descarga (8 chars para tooltip). */
	sha256Descarga?: string | null;
}

/**
 * Convierte confianza 0-1 a escala 1-5
 * 0.0-0.2 → 1 (muy dudoso)
 * 0.2-0.4 → 2 (dudoso)
 * 0.4-0.6 → 3 (aceptable)
 * 0.6-0.8 → 4 (bueno)
 * 0.8-1.0 → 5 (excelente)
 */
function confianzaANivel(confianza: number): number {
	if (confianza >= 0.8) return 5;
	if (confianza >= 0.6) return 4;
	if (confianza >= 0.4) return 3;
	if (confianza >= 0.2) return 2;
	return 1;
}

/**
 * Estilos por nivel de confianza:
 * - 1-2: danger (rojo)
 * - 3: warning (amarillo)
 * - 4-5: success (verde)
 */
function estilosPorConfianza(nivel: number): {
	card: string;
	icon: React.ReactNode;
	badge: string;
	texto: string;
} {
	switch (nivel) {
		case 5:
			return {
				card: "bg-green-50 border-green-200",
				icon: <CheckCircle className="w-4 h-4 text-green-600" />,
				badge: "bg-green-100 text-green-800",
				texto: "Excelente",
			};
		case 4:
			return {
				card: "bg-emerald-50 border-emerald-200",
				icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
				badge: "bg-emerald-100 text-emerald-800",
				texto: "Buena",
			};
		case 3:
			return {
				card: "bg-yellow-50 border-yellow-200",
				icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
				badge: "bg-yellow-100 text-yellow-800",
				texto: "Aceptable",
			};
		case 2:
			return {
				card: "bg-red-50 border-red-200",
				icon: <AlertCircle className="w-4 h-4 text-red-600" />,
				badge: "bg-red-100 text-red-800",
				texto: "Dudosa",
			};
		case 1:
		default:
			return {
				card: "bg-rose-50 border-rose-200",
				icon: <XCircle className="w-4 h-4 text-rose-600" />,
				badge: "bg-rose-100 text-rose-800",
				texto: "Muy dudosa",
			};
	}
}

export function ReferenciasSection({
	artefactoId,
	refreshTrigger,
	onDescargarObsidiana,
	sha256Descarga,
}: ReferenciasSectionProps) {
	const [referencias, setReferencias] = useState<ReferenciaArtefacto[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function cargar() {
			setLoading(true);
			const res = await listarReferenciasPorArtefacto(artefactoId);
			if (res.ok) {
				setReferencias(res.data);
			}
			setLoading(false);
		}
		cargar();
	}, [artefactoId, refreshTrigger]);

	if (loading) {
		return (
			<div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
				<p className="text-sm text-gray-500">Cargando referencias...</p>
			</div>
		);
	}

	if (referencias.length === 0) {
		return (
			<div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
				<p className="text-sm text-gray-500">
					No se encontraron referencias bibliográficas.
				</p>
			</div>
		);
	}

	// Calcular estadísticas de confianza
	const nivelesConfianza = referencias.map((r) =>
		confianzaANivel(r.confianza_extraccion),
	);
	const promedioConfianza =
		nivelesConfianza.reduce((a, b) => a + b, 0) / nivelesConfianza.length;

	// Construir markdown de referencias para descarga Obsidian
	const construirMDReferencias = (): string => {
		const lines: string[] = ["# Referencias bibliográficas", ""];
		for (const ref of referencias) {
			const num = ref.numero_en_artefacto !== null ? `[${ref.numero_en_artefacto}] ` : "";
			const titulo = ref.titulo ?? "Sin título";
			const autores = ref.autores.length > 0 ? ref.autores.join(", ") : "";
			const ano = ref.ano ? ` (${ref.ano})` : "";
			const fuente = ref.fuente ? ` *${ref.fuente}*` : "";
			const url = ref.url ? `\n  ${ref.url}` : "";
			lines.push(`- ${num}**${titulo}**. ${autores}${ano}.${fuente}${url}`);
		}
		return lines.join("\n");
	};

	return (
		<div className="space-y-3">
			{/* Header con estadísticas */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<BookOpen className="w-4 h-4 text-purple-600" />
					<h3 className="font-semibold text-sm">Referencias bibliográficas</h3>
					<span className="text-xs text-gray-500">({referencias.length})</span>
				</div>
				<div className="flex items-center gap-2">
					{onDescargarObsidiana && (
						<button
							type="button"
							onClick={() => onDescargarObsidiana("referencias", construirMDReferencias())}
							title={sha256Descarga ? `SHA-256: ${sha256Descarga.slice(0, 8)}…` : "Descargar para Obsidian"}
							className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors">
							<FileDown className="w-3 h-3" />
							Obsidian
						</button>
					)}
					<div className="text-xs text-gray-600">
						Confianza promedio:{" "}
					<span
						className={`font-medium ${
							promedioConfianza >= 4 ? "text-green-600"
							: promedioConfianza >= 3 ? "text-yellow-600"
							: "text-red-600"
						}`}>
						{promedioConfianza.toFixed(1)}/5
					</span>
				</div>
				</div>
			</div>

			{/* Referencias con colores por confianza */}
			{referencias.map((ref) => {
				const nivel = confianzaANivel(ref.confianza_extraccion);
				const estilos = estilosPorConfianza(nivel);

				return (
					<div key={ref.id} className={`p-3 rounded-lg border ${estilos.card}`}>
						{/* Header: número, título, badge de confianza */}
						<div className="flex items-start justify-between gap-2">
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									{ref.numero_en_artefacto !== null && (
										<span className="text-xs font-medium text-purple-600">
											[{ref.numero_en_artefacto}]
										</span>
									)}
									<span className="font-medium text-sm truncate">
										{ref.titulo ?? "Referencia sin título"}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-1 shrink-0">
								{estilos.icon}
								<span
									className={`text-xs px-2 py-0.5 rounded-full ${estilos.badge}`}>
									{nivel}/5
								</span>
							</div>
						</div>

						{/* Autores y año */}
						{ref.autores.length > 0 && (
							<p className="text-sm text-gray-700 mt-1">
								{ref.autores.join(", ")}
								{ref.ano && ` (${ref.ano})`}
							</p>
						)}

						{/* Tipo y fuente */}
						<div className="flex items-center gap-2 mt-1">
							<span className="text-xs text-gray-500 capitalize">
								{ref.tipo_referencia}
							</span>
							{ref.fuente && (
								<>
									<span className="text-xs text-gray-300">•</span>
									<span className="text-xs text-gray-500">{ref.fuente}</span>
								</>
							)}
						</div>

						{/* URL */}
						{ref.url && (
							<a
								href={ref.url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs text-purple-600 hover:text-purple-800 mt-1 inline-block truncate max-w-full">
								{ref.url.length > 60 ? `${ref.url.slice(0, 60)}...` : ref.url}
							</a>
						)}
					</div>
				);
			})}

			{/* Leyenda de confianza */}
			<div className="mt-4 pt-3 border-t border-gray-100">
				<p className="text-xs text-gray-500 mb-2">Nivel de confianza:</p>
				<div className="flex flex-wrap gap-2">
					<span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
						4-5: Excelente/Buena
					</span>
					<span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
						3: Aceptable
					</span>
					<span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
						1-2: Dudosa
					</span>
				</div>
			</div>
		</div>
	);
}
