"use client";

import { useState } from "react";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardAlert } from "@/components/ui/StandardAlert";
import { StandardWrapper } from "@/components/ui/StandardWrapper";
import {
	StandardTabs,
	StandardTabsList,
	StandardTabsTrigger,
	StandardTabsContent,
} from "@/components/ui/StandardTabs";
import {
	runMistralChat,
	runVisionAnalysis,
	runSeedreamGeneration,
	runDeepSeekChat,
	deleteTemporaryImage,
} from "@/lib/actions/replicate-actions";
import { TemporaryImageUpload } from "@/components/showroom/TemporaryImageUpload";

export default function ReplicateShowroomPage() {
	const [activeTab, setActiveTab] = useState("mistral");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Estados Mistral
	const [mistralPrompt, setMistralPrompt] = useState("");
	const [mistralResult, setMistralResult] = useState("");

	// Estados DeepSeek
	const [deepSeekPrompt, setDeepSeekPrompt] = useState("");
	const [deepSeekResult, setDeepSeekResult] = useState("");

	// Estados Vision
	const [visionUrl, setVisionUrl] = useState("");
	const [visionPath, setVisionPath] = useState(""); // Para borrar
	const [visionPrompt, setVisionPrompt] = useState(
		"Describe esta imagen detalladamente.",
	);
	const [visionResult, setVisionResult] = useState("");

	// Estados Seedream
	const [seedreamPrompt, setSeedreamPrompt] = useState(
		"Un paisaje futurista cyberpunk, 4k, detallado, 16:9.",
	);
	const [seedreamRefUrl, setSeedreamRefUrl] = useState("");
	const [seedreamResult, setSeedreamResult] = useState("");

	// Handlers
	const handleMistral = async () => {
		if (!mistralPrompt) return;
		setLoading(true);
		setError(null);
		const res = await runMistralChat(mistralPrompt);
		setLoading(false);
		if (res.success) setMistralResult(res.data ?? "");
		else setError(res.error || "Error desconocido");
	};

	const handleDeepSeek = async () => {
		if (!deepSeekPrompt) return;
		setLoading(true);
		setError(null);
		const res = await runDeepSeekChat(deepSeekPrompt);
		setLoading(false);
		if (res.success) setDeepSeekResult(res.data ?? "");
		else setError(res.error || "Error desconocido");
	};

	const handleVision = async () => {
		if (!visionUrl || !visionPrompt) return;
		setLoading(true);
		setError(null);

		// 1. Analizar
		const res = await runVisionAnalysis(visionUrl, visionPrompt);

		// 2. Borrar imagen si es temporal (tiene path)
		if (visionPath) {
			await deleteTemporaryImage(visionPath);
			// No limpiamos visionUrl para que el usuario siga viendo qué analizó,
			// pero internamente ya se borró del bucket.
			// Para UX, si borramos, la imagen dejará de verse si no es cacheada.
			// El usuario pidió "borrar la referencia del servidor supa pero queden los links del pc",
			// pero 'links del pc' (blob local) no los tenemos aquí persistentes salvo el preview en Upload component.
			// El upload component tiene su propio preview local que sigue vivo.
			// Así que está bien.
			setVisionPath("");
		}

		setLoading(false);
		if (res.success) setVisionResult(res.data ?? "");
		else setError(res.error || "Error desconocido");
	};

	const handleSeedream = async () => {
		if (!seedreamPrompt) return;
		setLoading(true);
		setError(null);
		const res = await runSeedreamGeneration(
			seedreamPrompt,
			seedreamRefUrl || undefined,
		);
		setLoading(false);
		if (res.success) setSeedreamResult(res.data ?? "");
		else setError(res.error || "Error desconocido");
	};

	return (
		<StandardWrapper>
			<StandardPageTitle
				title="Replicate Showroom"
				subtitle="Migración Colectiva: Mistral, Vision, Seedream & DeepSeek"
			/>

			<div className="mt-6">
				<StandardTabs value={activeTab} onValueChange={setActiveTab}>
					<StandardTabsList className="mb-6 grid grid-cols-2 md:grid-cols-4 w-full h-auto">
						<StandardTabsTrigger value="mistral">
							🌪️ Mistral
						</StandardTabsTrigger>
						<StandardTabsTrigger value="deepseek">
							🐍 DeepSeek
						</StandardTabsTrigger>
						<StandardTabsTrigger value="vision">👁️ Vision</StandardTabsTrigger>
						<StandardTabsTrigger value="seedream">
							🎨 Seedream
						</StandardTabsTrigger>
					</StandardTabsList>

					{/* MISTRAL */}
					<StandardTabsContent value="mistral">
						<StandardCard className="p-6 space-y-4">
							<h3 className="text-lg font-semibold">Mistral 8x7B (Mixtral)</h3>
							<div className="space-y-2">
								<StandardTextarea
									value={mistralPrompt}
									onChange={(e) => setMistralPrompt(e.target.value)}
									placeholder="Escribe tu pregunta para Mistral..."
									rows={4}
								/>
							</div>
							<StandardButton
								onClick={handleMistral}
								loading={loading}
								disabled={loading}>
								Enviar a Mistral
							</StandardButton>
							{mistralResult && (
								<div className="mt-4 p-4 bg-muted rounded-md whitespace-pre-wrap">
									{mistralResult}
								</div>
							)}
						</StandardCard>
					</StandardTabsContent>

					{/* DEEPSEEK */}
					<StandardTabsContent value="deepseek">
						<StandardCard className="p-6 space-y-4">
							<h3 className="text-lg font-semibold">DeepSeek R1 (Reasoning)</h3>
							<p className="text-sm text-muted-foreground">
								La serpiente china del razonamiento profundo.
							</p>
							<div className="space-y-2">
								<StandardTextarea
									value={deepSeekPrompt}
									onChange={(e) => setDeepSeekPrompt(e.target.value)}
									placeholder="Pregunta compleja para DeepSeek..."
									rows={4}
								/>
							</div>
							<StandardButton
								onClick={handleDeepSeek}
								loading={loading}
								disabled={loading}
								colorScheme="secondary">
								Consultar DeepSeek
							</StandardButton>
							{deepSeekResult && (
								<div className="mt-4 p-4 bg-muted rounded-md whitespace-pre-wrap font-mono text-sm">
									{deepSeekResult}
								</div>
							)}
						</StandardCard>
					</StandardTabsContent>

					{/* VISION */}
					<StandardTabsContent value="vision">
						<StandardCard className="p-6 space-y-4">
							<h3 className="text-lg font-semibold">Vision (LLaVA 13b)</h3>
							<div className="space-y-4 border p-4 rounded-md bg-muted/20">
								<label className="text-sm font-medium block">
									Imagen a analizar
								</label>

								{/* Selector: URL manual o Upload */}
								<TemporaryImageUpload
									onUploadComplete={(url, path) => {
										setVisionUrl(url);
										setVisionPath(path);
									}}
									onClear={() => {
										setVisionUrl("");
										setVisionPath("");
									}}
								/>

								{visionUrl && (
									<div className="text-xs text-muted-foreground break-all">
										URL activa: {visionUrl}
									</div>
								)}
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">Prompt</label>
								<StandardTextarea
									value={visionPrompt}
									onChange={(e) => setVisionPrompt(e.target.value)}
									placeholder="¿Qué ves en esta imagen?"
									rows={2}
								/>
							</div>
							<StandardButton
								onClick={handleVision}
								loading={loading}
								disabled={loading || !visionUrl}>
								Analizar Imagen
							</StandardButton>

							{visionResult && (
								<div className="mt-4 p-4 bg-muted rounded-md whitespace-pre-wrap">
									<h4 className="font-bold mb-2">Análisis:</h4>
									{visionResult}
								</div>
							)}
						</StandardCard>
					</StandardTabsContent>

					{/* SEEDREAM */}
					<StandardTabsContent value="seedream">
						<StandardCard className="p-6 space-y-4">
							<h3 className="text-lg font-semibold">
								Seedream 4 (16:9 Cinema)
							</h3>
							<div className="space-y-2">
								<label className="text-sm font-medium">Prompt</label>
								<StandardTextarea
									value={seedreamPrompt}
									onChange={(e) => setSeedreamPrompt(e.target.value)}
									placeholder="Descripción detallada..."
									rows={3}
								/>
							</div>
							<div className="space-y-2">
								<label className="text-sm font-medium">Referencia (URL)</label>
								<StandardInput
									value={seedreamRefUrl}
									onChange={(e) => setSeedreamRefUrl(e.target.value)}
									placeholder="https://..."
								/>
							</div>
							<StandardButton
								onClick={handleSeedream}
								loading={loading}
								disabled={loading}>
								Generar 16:9
							</StandardButton>

							{seedreamResult && (
								<div className="mt-4 space-y-4">
									<div>
										<img
											src={seedreamResult}
											alt="Generado"
											className="w-full rounded-lg border shadow-md aspect-video object-cover"
										/>
									</div>
									<StandardButton
										onClick={() => {
											setVisionUrl(seedreamResult);
											setVisionPath(""); // No es temporal nuestra, es de replicate, no borrar
											setActiveTab("vision");
											setVisionPrompt(
												"Analiza esta imagen generada y su composición.",
											);
										}}
										colorScheme="secondary"
										size="sm">
										👁️ Analizar con Vision
									</StandardButton>
								</div>
							)}
						</StandardCard>
					</StandardTabsContent>
				</StandardTabs>

				{error && (
					<div className="mt-6">
						<StandardAlert title="Error" message={error} colorScheme="danger" />
					</div>
				)}
			</div>
		</StandardWrapper>
	);
}
