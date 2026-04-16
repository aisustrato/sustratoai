"use client";

import { useState } from "react";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardAlert } from "@/components/ui/StandardAlert";
import { StandardWrapper } from "@/components/ui/StandardWrapper";
import { StandardBadge } from "@/components/ui/StandardBadge";

export default function DeepSeekTestPage() {
	const [prompt, setPrompt] = useState("");
	const [response, setResponse] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [connectionStatus, setConnectionStatus] = useState<
		"idle" | "testing" | "success" | "error"
	>("idle");

	const testConnection = async () => {
		setLoading(true);
		setError(null);
		setConnectionStatus("testing");
		setResponse("");

		try {
			const res = await fetch("/api/deepseek/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt:
						prompt ||
						"Hola, ¿puedes confirmar que estás funcionando correctamente?",
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || `Error ${res.status}`);
			}

			setResponse(data.response);
			setConnectionStatus("success");
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : "Error desconocido";
			setError(errorMessage);
			setConnectionStatus("error");
		} finally {
			setLoading(false);
		}
	};

	const getStatusBadge = () => {
		switch (connectionStatus) {
			case "idle":
				return (
					<StandardBadge colorScheme="neutral">⏸️ Esperando</StandardBadge>
				);
			case "testing":
				return (
					<StandardBadge colorScheme="warning">🔄 Probando...</StandardBadge>
				);
			case "success":
				return (
					<StandardBadge colorScheme="success">✅ Conectado</StandardBadge>
				);
			case "error":
				return <StandardBadge colorScheme="danger">❌ Error</StandardBadge>;
		}
	};

	return (
		<StandardWrapper>
			<StandardPageTitle
				title="🐍 DeepSeek - Test de Conexión"
				subtitle="Prueba de conexión directa a la API de DeepSeek (no Replicate)"
			/>

			<div className="mt-6 space-y-6">
				{/* Estado de Conexión */}
				<StandardCard className="p-6">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-lg font-semibold">Estado de la API</h3>
							<p className="text-sm text-muted-foreground mt-1">
								Conexión directa a api.deepseek.com
							</p>
						</div>
						{getStatusBadge()}
					</div>
				</StandardCard>

				{/* Formulario de Prueba */}
				<StandardCard className="p-6 space-y-4">
					<div>
						<h3 className="text-lg font-semibold mb-2">Probar Conexión</h3>
						<p className="text-sm text-muted-foreground">
							Envía un mensaje para verificar que la API de DeepSeek está
							configurada correctamente.
						</p>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Mensaje de Prueba</label>
						<StandardTextarea
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							placeholder="Escribe un mensaje de prueba o deja vacío para usar el mensaje por defecto..."
							rows={4}
						/>
					</div>

					<StandardButton
						onClick={testConnection}
						loading={loading}
						disabled={loading}
						colorScheme="primary"
						className="w-full">
						{loading ? "Probando Conexión..." : "🚀 Probar Conexión"}
					</StandardButton>
				</StandardCard>

				{/* Respuesta */}
				{response && (
					<StandardCard className="p-6">
						<h4 className="text-sm font-semibold mb-3 text-success">
							✅ Respuesta de DeepSeek
						</h4>
						<div className="p-4 bg-muted rounded-md">
							<pre className="whitespace-pre-wrap text-sm font-mono">
								{response}
							</pre>
						</div>
					</StandardCard>
				)}

				{/* Error */}
				{error && (
					<StandardAlert
						title="Error de Conexión"
						message={error}
						colorScheme="danger"
					/>
				)}

				{/* Información de Configuración */}
				<StandardCard className="p-6 space-y-4 bg-muted/30">
					<h4 className="text-sm font-semibold">📋 Configuración Requerida</h4>
					<div className="space-y-2 text-sm">
						<p className="font-mono bg-background p-2 rounded">
							DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
						</p>
						<p className="text-muted-foreground">
							Agrega esta variable a tu archivo{" "}
							<code className="bg-background px-1 rounded">.env.local</code>
						</p>
					</div>

					<div className="pt-4 border-t space-y-2">
						<h5 className="text-sm font-semibold">🔗 Obtener API Key</h5>
						<ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
							<li>
								Ve a{" "}
								<a
									href="https://platform.deepseek.com/"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline">
									platform.deepseek.com
								</a>
							</li>
							<li>Crea una cuenta o inicia sesión</li>
							<li>Ve a la sección &ldquo;API Keys&rdquo;</li>
							<li>Crea una nueva clave</li>
							<li>Cópiala y agrégala a .env.local</li>
							<li>Reinicia el servidor de desarrollo</li>
						</ol>
					</div>
				</StandardCard>

				{/* Información Técnica */}
				<StandardCard className="p-6 space-y-3 bg-accent/5">
					<h4 className="text-sm font-semibold">🔧 Información Técnica</h4>
					<div className="space-y-2 text-sm text-muted-foreground">
						<div className="flex justify-between">
							<span>Modelo:</span>
							<span className="font-mono">deepseek-chat</span>
						</div>
						<div className="flex justify-between">
							<span>Endpoint:</span>
							<span className="font-mono">
								https://api.deepseek.com/v1/chat/completions
							</span>
						</div>
						<div className="flex justify-between">
							<span>Temperatura:</span>
							<span className="font-mono">0.2</span>
						</div>
						<div className="flex justify-between">
							<span>Max Tokens:</span>
							<span className="font-mono">8192</span>
						</div>
					</div>
				</StandardCard>
			</div>
		</StandardWrapper>
	);
}
