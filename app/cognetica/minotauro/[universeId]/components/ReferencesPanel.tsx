// 📍 app/cognetica/minotauro/[universeId]/components/ReferencesPanel.tsx
// 🎯 Panel de referencias curadas con números asignados

import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { ExternalLink, Plus } from "lucide-react";

export interface CuratedSourceWithNumber {
	id: string;
	numero: number;
	titulo: string;
	autor?: string;
	año?: number;
	url?: string;
	tipo: "paper" | "libro" | "articulo" | "web" | "otro";
	resumen?: string;
	timestamp: string;
}

interface ReferencesPanelProps {
	fuentes: CuratedSourceWithNumber[];
	onSelectReference?: (numero: number) => void;
	onAddSource?: () => void;
}

const getTipoConfig = (tipo: string) => {
	const configs = {
		paper: { emoji: "📄", label: "Paper", color: "primary" as const },
		libro: { emoji: "📚", label: "Libro", color: "success" as const },
		articulo: { emoji: "📰", label: "Artículo", color: "warning" as const },
		web: { emoji: "🌐", label: "Web", color: "accent" as const },
		otro: { emoji: "📎", label: "Otro", color: "neutral" as const },
	};
	return configs[tipo as keyof typeof configs] || configs.otro;
};

export function ReferencesPanel({
	fuentes,
	onSelectReference,
	onAddSource,
}: ReferencesPanelProps) {
	return (
		<StandardCard className="p-4">
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-sm font-medium">
					📚 Referencias Curadas ({fuentes.length})
				</h3>
				{onAddSource && (
					<StandardButton
						size="xs"
						colorScheme="primary"
						styleType="ghost"
						onClick={onAddSource}
						leftIcon={Plus}>
						Agregar
					</StandardButton>
				)}
			</div>

			{fuentes.length === 0 ?
				<div className="text-center py-6 text-sm text-muted-foreground">
					<p>No hay referencias curadas aún</p>
					<p className="text-xs mt-1">
						Agrega fuentes para citarlas en el texto
					</p>
				</div>
			:	<div className="space-y-2">
					{fuentes.map((fuente) => {
						const tipoConfig = getTipoConfig(fuente.tipo);

						return (
							<div
								key={fuente.id}
								className={`
                  p-3 bg-muted/30 rounded-lg border border-transparent
                  transition-all duration-200
                  ${onSelectReference ? "cursor-pointer hover:bg-muted/50 hover:border-primary/30" : ""}
                `}
								onClick={() => onSelectReference?.(fuente.numero)}>
								<div className="flex items-start gap-3">
									{/* Número de referencia */}
									<div className="flex-shrink-0">
										<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
											<span className="font-mono text-sm font-bold text-primary">
												{fuente.numero}
											</span>
										</div>
									</div>

									{/* Contenido */}
									<div className="flex-1 min-w-0">
										{/* Autor y año */}
										<div className="text-xs font-medium text-foreground mb-1">
											{fuente.autor && <span>{fuente.autor}</span>}
											{fuente.autor && fuente.año && <span> </span>}
											{fuente.año && <span>{fuente.año}</span>}
											{!fuente.autor && !fuente.año && (
												<span className="text-muted-foreground">Sin autor</span>
											)}
										</div>

										{/* Título */}
										<div className="text-xs text-muted-foreground mb-2 line-clamp-2">
											&ldquo;{fuente.titulo}&rdquo;
										</div>

										{/* Tipo y URL */}
										<div className="flex items-center gap-2">
											<StandardBadge colorScheme={tipoConfig.color} size="xs">
												{tipoConfig.emoji} {tipoConfig.label}
											</StandardBadge>

											{fuente.url && (
												<a
													href={fuente.url}
													target="_blank"
													rel="noopener noreferrer"
													className="text-xs text-primary hover:underline flex items-center gap-1"
													onClick={(e) => e.stopPropagation()}>
													<ExternalLink className="w-3 h-3" />
													Ver fuente
												</a>
											)}
										</div>

										{/* Resumen (si existe) */}
										{fuente.resumen && (
											<div className="mt-2 text-xs text-muted-foreground line-clamp-2 italic">
												{fuente.resumen}
											</div>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			}

			{/* Ayuda de uso */}
			{fuentes.length > 0 && (
				<div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
					<p className="font-medium mb-1">💡 Cómo citar en el texto:</p>
					<p>
						• Usa el número entre paréntesis:{" "}
						<code className="bg-muted px-1 rounded">(1)</code>
					</p>
					<p>
						• O con autor:{" "}
						<code className="bg-muted px-1 rounded">Altman 2022 (1)</code>
					</p>
				</div>
			)}
		</StandardCard>
	);
}
