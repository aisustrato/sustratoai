import {
	getArtifactWithUrl,
	getChronicleForArtifact,
} from "@/lib/actions/cognetica-old-actions";
import { getCognitiveElementOccurrences } from "@/lib/actions/cognetica-old-filters-actions";
import {
	ArrowLeft,
	FileAudio,
	FileText,
	Presentation,
	Calendar,
	Clock,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CogneticaPipeline } from "./CogneticaPipeline";
import { CogneticaChat } from "./CogneticaChat";
import { CogneticaAudioPlayer } from "./components/CogneticaAudioPlayer";
import { CogneticaMarkdownViewer } from "./components/CogneticaMarkdownViewer";
import { CogneticaExportPanel } from "./components/CogneticaExportPanel";
import { PresentationPagesInfo } from "./components/PresentationPagesInfo";
import { PresentationSlidesViewer } from "./components/PresentationSlidesViewer";
import { DeleteArtifactButton } from "./DeleteArtifactButton";
import { CognitiveBadges } from "./components/CognitiveBadges";
import { ChroniclePanel } from "./ChroniclePanel";
import { DistilledEssayPanel } from "./components/DistilledEssayPanel";
import { InfographicImagesPanel } from "./components/InfographicImagesPanel";
import { ChronologicalDataPanel } from "./components/ChronologicalDataPanel";
import { createSupabaseServerClient } from "@/lib/server";

// Interfaces para tipar los datos
interface TranscriptionSegment {
	start: number;
	end: number;
	text: string;
	speaker?: string;
	sentences?: Array<{ text: string }>;
}

interface PlayerSegment {
	text: string;
	start: number;
	end: number;
	speaker: string;
	textOriginal: string;
}

interface Seed {
	id?: string;
	content: string;
	tags?: string[];
	properties?: Record<string, unknown>;
	context?: string;
}

interface Discipline {
	id: string;
	name: string;
	discipline?: { id: string; name: string };
}

interface Theory {
	id: string;
	name: string;
	theory?: { id: string; name: string };
}

interface ThinkerReference {
	id: string;
	name: string;
	era?: string | null;
	bio_snippet?: string | null;
	key_contributions?: string[];
	discipline?: { name: string } | null;
}

interface Thinker {
	id: string;
	name: string;
	reference?: ThinkerReference;
	context_snippet?: string | null;
}

export default async function ArtifactDetailPage({
	params,
}: {
	params: { id: string };
}) {
	const response = await getArtifactWithUrl(params.id);

	if (!response.success || !response.data) {
		return notFound();
	}

	const artifact = response.data;
	const transcription = artifact.transcription;

	// Detectar tipo de artefacto
	const sourceMetadata = artifact.source_metadata as Record<
		string,
		unknown
	> | null;

	// Verificar si hay páginas en cog_artifact_pages (para detectar presentaciones)
	const supabase = await createSupabaseServerClient();
	const { data: allPages } = await supabase
		.from("cog_artifact_pages")
		.select("id, status")
		.eq("artifact_id", artifact.id)
		.limit(1);

	// Es presentación si: type='pdf_slides' O tiene processing_mode='presentacion' O tiene páginas en cog_artifact_pages
	const isPresentation =
		artifact.type === "pdf_slides" ||
		sourceMetadata?.processing_mode === "presentacion" ||
		(!!allPages && allPages.length > 0);
	const hasPagesReady =
		isPresentation &&
		sourceMetadata?.has_pages === true &&
		typeof sourceMetadata?.total_pages === "number" &&
		sourceMetadata.total_pages > 0;

	// Verificar si hay páginas procesadas
	let hasPagesProcessed = false;
	if (isPresentation) {
		const { data: processedPages } = await supabase
			.from("cog_artifact_pages")
			.select("id, status")
			.eq("artifact_id", artifact.id)
			.eq("status", "processed")
			.limit(1);

		hasPagesProcessed = !!processedPages && processedPages.length > 0;
	}
	// Tipos que usan el visor MD: markdown y pdf_report (después de procesarse)
	const isMarkdownDocument =
		(artifact.type === "markdown" || artifact.type === "pdf_report") &&
		!isPresentation;
	const isAudioVideo = artifact.type === "audio" || artifact.type === "video";

	// Transformar segmentos al formato del player mejorado (solo para audio/video)
	const rawSegments: TranscriptionSegment[] =
		Array.isArray(transcription?.segments) ?
			(transcription.segments as unknown as TranscriptionSegment[])
		:	[];

	// Mapear segmentos individuales
	const mappedSegments = rawSegments.map((p: TranscriptionSegment) => ({
		text: p.sentences?.map((s: { text: string }) => s.text).join(" ") || p.text,
		start: p.start,
		end: p.end,
		speaker: p.speaker || "SPEAKER_00",
		textOriginal: p.text,
	}));

	// Consolidar segmentos consecutivos del mismo speaker
	const playerSegments: PlayerSegment[] = [];
	let currentSegment: PlayerSegment | null = null;

	for (const seg of mappedSegments) {
		if (!currentSegment) {
			// Primer segmento
			currentSegment = { ...seg };
		} else if (currentSegment.speaker === seg.speaker) {
			// Mismo speaker: consolidar
			currentSegment.text += " " + seg.text;
			currentSegment.end = seg.end; // Actualizar timestamp final
		} else {
			// Cambio de speaker: guardar segmento actual y empezar uno nuevo
			playerSegments.push(currentSegment);
			currentSegment = { ...seg };
		}
	}

	// Agregar el último segmento
	if (currentSegment) {
		playerSegments.push(currentSegment);
	}

	console.log(
		`🎙️ [Segmentos] Raw: ${rawSegments.length}, Consolidados: ${playerSegments.length}`,
	);

	// Leer crónica forense ya guardada (si existe)
	const chronicleResult = await getChronicleForArtifact(artifact.id);
	const initialChronicle =
		chronicleResult.success ? (chronicleResult.data?.chronicle ?? null) : null;

	// El artefacto tiene contenido textual si: tiene transcripción, páginas procesadas, o es markdown con texto
	const hasTextContent = !!(
		transcription?.full_text ||
		(isPresentation && hasPagesProcessed) ||
		(isMarkdownDocument && transcription?.full_text)
	);

	// Obtener conteos de ocurrencias para elementos cognitivos
	const projectId = artifact.project_id;

	// Procesar semillas con conteos (filtrar citas Y frases notables)
	const seedsWithCounts = await Promise.all(
		((artifact.seeds || []) as Seed[])
			.filter((seed: Seed) => {
				// Excluir citas (tienen tag 'cita' o properties.type === 'quote')
				const hasCitaTag =
					seed.tags && Array.isArray(seed.tags) && seed.tags.includes("cita");
				const isQuoteType = seed.properties?.type === "quote";

				// Excluir frases notables (tienen tag 'frase-notable' o properties.type === 'notable_phrase')
				const hasFraseTag =
					seed.tags &&
					Array.isArray(seed.tags) &&
					seed.tags.includes("frase-notable");
				const isNotablePhrase = seed.properties?.type === "notable_phrase";

				return !hasCitaTag && !isQuoteType && !hasFraseTag && !isNotablePhrase;
			})
			.map(async (seed: Seed) => {
				const result = await getCognitiveElementOccurrences(
					projectId,
					"seed",
					seed.content,
				);
				return {
					content: seed.content,
					count: result.success ? result.data : 0,
				};
			}),
	);

	// Procesar frases notables por separado
	const notablePhrasesWithCounts = await Promise.all(
		((artifact.seeds || []) as Seed[])
			.filter((seed: Seed) => {
				// Solo incluir frases notables
				const hasFraseTag =
					seed.tags &&
					Array.isArray(seed.tags) &&
					seed.tags.includes("frase-notable");
				const isNotablePhrase = seed.properties?.type === "notable_phrase";
				return hasFraseTag || isNotablePhrase;
			})
			.map(async (phrase: Seed) => {
				const result = await getCognitiveElementOccurrences(
					projectId,
					"seed",
					phrase.content,
				);
				return {
					content: phrase.content,
					context: phrase.context || "",
					count: result.success ? result.data : 0,
				};
			}),
	);

	// Procesar disciplinas con conteos
	const disciplinesWithCounts = await Promise.all(
		((artifact.disciplines || []) as any[]).map(async (disc: any) => {
			const discId = disc.discipline?.id || disc.id;
			const discName = disc.discipline?.name || disc.name;
			const result = await getCognitiveElementOccurrences(
				projectId,
				"discipline",
				discId,
			);
			return {
				id: discId,
				name: discName,
				count: result.success ? result.data : 0,
			};
		}),
	);

	// Procesar teorías con conteos
	const theoriesWithCounts = await Promise.all(
		((artifact.theories || []) as any[]).map(async (theory: any) => {
			const theoryId = theory.theory?.id || theory.id;
			const theoryName = theory.theory?.name || theory.name;
			const result = await getCognitiveElementOccurrences(
				projectId,
				"theory",
				theoryId,
			);
			return {
				id: theoryId,
				name: theoryName,
				count: result.success ? result.data : 0,
			};
		}),
	);

	// Procesar pensadores con conteos y datos completos
	const thinkersWithCounts = await Promise.all(
		((artifact.thinkers || []) as any[]).map(async (thinker: any) => {
			const thinkerId = thinker.reference?.id || thinker.id;
			const thinkerName = thinker.reference?.name || thinker.name;
			const result = await getCognitiveElementOccurrences(
				projectId,
				"thinker",
				thinkerId,
			);
			return {
				id: thinkerId,
				name: thinkerName,
				era: thinker.reference?.era || null,
				bio_snippet: thinker.reference?.bio_snippet || null,
				key_contributions: thinker.reference?.key_contributions || [],
				discipline: thinker.reference?.discipline?.name || null,
				context_snippet: thinker.context_snippet || null,
				count: result.success ? result.data : 0,
			};
		}),
	);

	// Obtener datos cronológicos del artefacto
	const { data: chronologicalData } = await supabase
		.from("cog_chronological_data")
		.select("*")
		.eq("artifact_id", artifact.id)
		.order("created_at", { ascending: false });

	return (
		<div className="container mx-auto p-6 space-y-8 max-w-5xl">
			{/* Header */}
			<div className="space-y-4">
				<div className="flex items-start justify-between">
					<div className="space-y-2">
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<Link
								href="/cognetica_old"
								className="hover:text-primary transition-colors flex items-center gap-1">
								<ArrowLeft className="w-4 h-4" /> Volver a Cognética
							</Link>
							<span>/</span>
							<span>{artifact.id.slice(0, 8)}...</span>
						</div>
						<h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
							{isPresentation ?
								<Presentation className="w-8 h-8 text-primary" />
							: isAudioVideo ?
								<FileAudio className="w-8 h-8 text-primary" />
							:	<FileText className="w-8 h-8 text-primary" />}
							{artifact.title}
						</h1>
						<div className="flex items-center gap-4 text-sm text-muted-foreground">
							<div className="flex items-center gap-1">
								<Calendar className="w-4 h-4" />
								{new Date(artifact.created_at!).toLocaleDateString()}
							</div>
							{artifact.duration_seconds && (
								<div className="flex items-center gap-1">
									<Clock className="w-4 h-4" />
									{Math.floor(artifact.duration_seconds / 60)}m{" "}
									{Math.floor(artifact.duration_seconds % 60)}s
								</div>
							)}
							<span
								className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
									artifact.status === "completed" ?
										"bg-green-100 text-green-700 border-green-200"
									: artifact.status === "analyzing" ?
										"bg-blue-100 text-blue-700 border-blue-200"
									:	"bg-slate-100 text-slate-700 border-slate-200"
								}`}>
								{artifact.status}
							</span>
						</div>
					</div>

					<DeleteArtifactButton
						artifactId={artifact.id}
						artifactTitle={artifact.title || "Sin título"}
					/>
				</div>

				{/* Botones de acción rápida debajo del título */}
				<div className="flex items-center gap-3">
					{hasTextContent && (
						<Link href={`#chronicle`}>
							<button className="px-4 py-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 border border-violet-200 rounded-lg text-sm font-medium text-violet-700 transition-all">
								🍄 Crónica Miselio
							</button>
						</Link>
					)}
					{(() => {
						const metadata = artifact.source_metadata as Record<
							string,
							unknown
						> | null;
						const imagePrompts =
							(metadata?.image_prompts as Array<{
								style: string;
								prompt: string;
							}>) || [];
						return (
							imagePrompts.length > 0 && (
								<Link href={`#images`}>
									<button className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-all">
										🎨 Imágenes Infográficas
									</button>
								</Link>
							)
						);
					})()}
				</div>
			</div>

			{/* Pipeline Visual de Procesamiento - Acordeón */}
			<details className="bg-card rounded-xl border shadow-sm group">
				<summary className="p-4 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between">
					<h3 className="font-semibold text-lg flex items-center gap-2">
						🔄 Pipeline de Procesamiento
					</h3>
					<span className="text-muted-foreground text-sm group-open:rotate-180 transition-transform">
						▼
					</span>
				</summary>
				<div className="px-6 pb-6">
					<CogneticaPipeline
						artifactId={artifact.id}
						hasTranscription={!!transcription?.full_text}
						hasSeeds={artifact.seeds && artifact.seeds.length > 0}
						hasImages={
							!!(artifact.source_metadata as Record<string, unknown>)
								?.images_generated
						}
						status={artifact.status || "pending"}
						mimeType={artifact.mime_type || undefined}
						isPresentation={isPresentation}
						hasPagesReady={hasPagesReady}
						hasPagesProcessed={hasPagesProcessed}
					/>
				</div>
			</details>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Left Column: Player/Viewer & Chat (2/3) */}
				<div className="lg:col-span-2 space-y-6">
					{/* Audio Player (solo para audio/video) */}
					{isAudioVideo && artifact.signedUrl && (
						<CogneticaAudioPlayer
							src={artifact.signedUrl}
							segments={playerSegments}
							artifactTitle={artifact.title || "Artefacto"}
							artifactId={artifact.id}
						/>
					)}

					{/* Markdown Viewer (para markdown y pdf_report) */}
					{isMarkdownDocument &&
						(transcription?.full_text ?
							<CogneticaMarkdownViewer
								content={transcription.full_text}
								artifactTitle={artifact.title || "Documento"}
							/>
						: artifact.status === "completed" ?
							<div className="flex items-center justify-center h-64 bg-card rounded-xl border shadow-sm">
								<div className="text-center space-y-3">
									<p className="text-lg font-medium text-amber-600">
										⚠️ Transcripción no disponible
									</p>
									<p className="text-sm text-muted-foreground max-w-md">
										El documento fue procesado pero el texto no se guardó
										correctamente. Puedes usar el chat Quipu con las semillas
										extraídas.
									</p>
								</div>
							</div>
						:	<div className="flex items-center justify-center h-64 bg-card rounded-xl border shadow-sm text-muted-foreground">
								<div className="text-center">
									<p className="text-lg mb-2">Procesando documento...</p>
									<p className="text-sm">
										El contenido aparecerá aquí una vez completado el
										procesamiento.
									</p>
								</div>
							</div>)}

					{/* Presentation Slides Viewer (cuando hay páginas procesadas) */}
					{isPresentation && hasPagesProcessed && (
						<PresentationSlidesViewer artifactId={artifact.id} />
					)}

					{/* Presentation Pages Info (solo para presentaciones sin procesar) */}
					{isPresentation && !hasPagesProcessed && (
						<PresentationPagesInfo artifactId={artifact.id} />
					)}

					{/* Fallback si no hay contenido */}
					{!isMarkdownDocument && !isAudioVideo && !isPresentation && (
						<div className="flex items-center justify-center h-64 bg-card rounded-xl border shadow-sm text-muted-foreground">
							Contenido no disponible.
						</div>
					)}

					{/* Chat con Calibrador QUIPU - Si hay transcripción, páginas procesadas, o metabolización completada */}
					{(transcription?.full_text ||
						(isPresentation && hasPagesProcessed) ||
						(artifact.seeds && artifact.seeds.length > 0)) && (
						<CogneticaChat
							artifactId={artifact.id}
							projectId={artifact.project_id}
							maxMessages={5}
						/>
					)}

					{/* Panel de Ensayo Destilado - Debajo del chat Quipu */}
					{hasTextContent && (
						<DistilledEssayPanel
							artifactId={artifact.id}
							artifactTitle={artifact.title || "Artefacto"}
						/>
					)}

					{/* Panel de Exportación - Movido aquí para acortar columna derecha */}
					<CogneticaExportPanel
						artifactId={artifact.id}
						artifactTitle={artifact.title || "Artefacto"}
					/>
				</div>

				{/* Right Column: Analysis & Seeds (1/3) */}
				<div className="space-y-6">
					{/* Crónica Forense Micelio */}
					<div id="chronicle">
						<ChroniclePanel
							artifactId={artifact.id}
							hasTextContent={hasTextContent}
							initialChronicle={initialChronicle}
						/>
					</div>

					{/* Elementos Cognitivos con Badges Clicables */}
					<CognitiveBadges
						seeds={seedsWithCounts}
						disciplines={disciplinesWithCounts}
						theories={theoriesWithCounts}
						thinkers={thinkersWithCounts}
						artifactId={artifact.id}
					/>

					{/* Datos Cronológicos Extraídos */}
					{chronologicalData && chronologicalData.length > 0 && (
						<ChronologicalDataPanel data={chronologicalData} />
					)}

					{/* Frases Notables */}
					{notablePhrasesWithCounts.length > 0 && (
						<div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200 shadow-sm">
							<h3 className="font-semibold text-lg mb-2 flex items-center gap-2 text-amber-800">
								✨ Frases Notables
							</h3>
							<p className="text-xs text-amber-600 mb-4 italic">
								Expresiones clave extraídas del contenido
							</p>
							<div className="space-y-3">
								{notablePhrasesWithCounts.map((phrase, idx) => (
									<div
										key={idx}
										className="p-4 bg-white/70 rounded-lg border border-amber-100">
										<p className="text-sm font-medium text-slate-800 mb-2">
											&ldquo;{phrase.content}&rdquo;
										</p>
										{phrase.context && (
											<p className="text-xs text-slate-600 italic">
												{phrase.context}
											</p>
										)}
										{(phrase.count ?? 0) > 0 && (
											<div className="mt-2 pt-2 border-t border-amber-100">
												<span className="text-xs text-amber-700">
													Aparece en {phrase.count} artefacto
													{(phrase.count ?? 0) !== 1 ? "s" : ""} del proyecto
												</span>
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Citas Célebres */}
					{(artifact.seeds as Seed[] | undefined)?.some(
						(s: Seed) => s.properties?.type === "quote",
					) && (
						<div className="bg-card p-6 rounded-xl border shadow-sm">
							<h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
								💬 Citas Célebres
							</h3>
							<div className="space-y-3">
								{(artifact.seeds as Seed[])
									.filter((s: Seed) => s.properties?.type === "quote")
									.slice(0, 5)
									.map((quote: Seed) => (
										<blockquote
											key={quote.id}
											className="pl-4 border-l-2 border-primary/30 italic text-sm text-muted-foreground">
											{quote.content}
										</blockquote>
									))}
							</div>
						</div>
					)}

					{/* Analogías de Cultura Pop */}
					{(() => {
						const metadata = artifact.source_metadata as Record<
							string,
							unknown
						> | null;
						const analogies =
							(metadata?.pop_culture_analogies as Array<{
								reference: string;
								analogy: string;
								connection: string;
							}>) || [];
						return (
							analogies.length > 0 && (
								<div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-xl border border-pink-200 shadow-sm">
									<h3 className="font-semibold text-lg mb-2 flex items-center gap-2 text-pink-800">
										🎬 Analogías de Cultura Pop
									</h3>
									<p className="text-xs text-pink-600 mb-4 italic">
										Para humildad epistémica: lo lúdico pero coherente
									</p>
									<div className="space-y-4">
										{analogies.map((analogy, idx) => (
											<div
												key={idx}
												className="p-4 bg-white/70 rounded-lg border border-pink-100">
												<div className="flex items-start gap-2 mb-2">
													<span className="text-lg">🎭</span>
													<span className="text-sm font-semibold text-pink-700">
														{analogy.reference}
													</span>
												</div>
												<p className="text-sm text-slate-700 mb-2 pl-7">
													{analogy.analogy}
												</p>
												<div className="pl-7 pt-2 border-t border-pink-100">
													<span className="text-xs font-medium text-pink-600">
														Conexión:
													</span>
													<p className="text-xs text-slate-600 mt-1">
														{analogy.connection}
													</p>
												</div>
											</div>
										))}
									</div>
								</div>
							)
						);
					})()}

					{/* Prompts de Imágenes/Diagramas con conversión a imágenes */}
					{(() => {
						const metadata = artifact.source_metadata as Record<
							string,
							unknown
						> | null;
						const imagePrompts =
							(metadata?.image_prompts as Array<{
								style: string;
								prompt: string;
							}>) || [];
						return (
							imagePrompts.length > 0 && (
								<div id="images">
									<InfographicImagesPanel
										artifactId={artifact.id}
										prompts={imagePrompts}
									/>
								</div>
							)
						);
					})()}

					{/* Metadata Técnica */}
					<div className="bg-card p-6 rounded-xl border shadow-sm">
						<h3 className="font-semibold text-lg mb-4">📋 Metadata Técnica</h3>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Tipo</span>
								<span className="font-medium uppercase">{artifact.type}</span>
							</div>
							{isAudioVideo && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">Modelo STT</span>
									<span className="font-medium">
										{transcription?.provider === "deepgram" ?
											"Deepgram Nova-2"
										:	"Whisper X"}
									</span>
								</div>
							)}
							{isMarkdownDocument && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">Formato</span>
									<span className="font-medium">Markdown</span>
								</div>
							)}
							<div className="flex justify-between">
								<span className="text-muted-foreground">Modelo LLM</span>
								<span className="font-medium">DeepSeek Chat</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Confianza</span>
								<span className="font-medium">
									{transcription?.confidence_score ?
										`${(transcription.confidence_score * 100).toFixed(1)}%`
									:	"-"}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
