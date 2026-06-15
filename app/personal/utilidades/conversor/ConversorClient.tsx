// 📍 app/personal/utilidades/conversor/ConversorClient.tsx
"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { StandardAlert } from "@/components/ui/StandardAlert";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardFileUpload } from "@/components/ui/StandardFileUpload";
import { StandardText } from "@/components/ui/StandardText";

type ConversionId = "md-to-docx" | "md-to-pdf" | "docx-to-pdf" | "docx-to-md";

interface ConversionOption {
	id: ConversionId;
	label: string;
	hint: string;
}

const conversionsByExt: Record<string, ConversionOption[]> = {
	md: [
		{ id: "md-to-docx", label: "→ DOCX", hint: "Word editable" },
		{ id: "md-to-pdf", label: "→ PDF", hint: "PDF final (Word intermedio)" },
	],
	docx: [
		{ id: "docx-to-pdf", label: "→ PDF", hint: "PDF directo" },
		{ id: "docx-to-md", label: "→ Markdown", hint: "Para Obsidian / cognética" },
	],
};

function extOf(name: string): string {
	const dot = name.lastIndexOf(".");
	return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function ConversorClient() {
	const [file, setFile] = useState<File | null>(null);
	const [running, setRunning] = useState<ConversionId | null>(null);

	const ext = file ? extOf(file.name) : "";
	const conversions = conversionsByExt[ext] ?? [];

	async function runConversion(id: ConversionId) {
		if (!file) return;
		setRunning(id);
		const toastId = toast.loading(`Convirtiendo ${file.name}…`);
		try {
			const formData = new FormData();
			formData.append("file", file);
			const res = await fetch(`/api/personal/conversor/${id}`, {
				method: "POST",
				body: formData,
			});
			if (!res.ok) {
				const errBody = await res.json().catch(() => ({ error: "Error desconocido" }));
				throw new Error(errBody.error || `HTTP ${res.status}`);
			}
			const blob = await res.blob();
			const cd = res.headers.get("Content-Disposition") ?? "";
			const match = cd.match(/filename="([^"]+)"/);
			const filename = match ? decodeURIComponent(match[1]) : `output-${id}.bin`;

			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toast.success(`Descargado: ${filename}`, { id: toastId });
		} catch (err) {
			console.error("[ConversorClient:runConversion]", err);
			const msg = err instanceof Error ? err.message : "Error desconocido";
			toast.error(`Error al convertir: ${msg}`, {
				id: toastId,
				duration: Infinity,
			});
		} finally {
			setRunning(null);
		}
	}

	return (
		<div className="container mx-auto py-8 max-w-3xl space-y-6">
			<header className="space-y-2">
				<StandardText
					asElement="h1"
					size="3xl"
					weight="bold"
					colorScheme="primary"
					applyGradient>
					Conversor de documentos
				</StandardText>
				<StandardText size="base" colorScheme="neutral" colorShade="text">
					Convierte entre Markdown, DOCX y PDF preservando fórmulas LaTeX,
					estructura y citas. Pandoc + LibreOffice corren localmente — los
					archivos no se persisten en el servidor.
				</StandardText>
			</header>

			<StandardCard colorScheme="neutral">
				<StandardCard.Content>
					<StandardFileUpload
						onFileSelect={setFile}
						accept=".md,.docx"
						maxSizeMB={50}
						title="Arrastra un .md o un .docx aquí"
						description="Markdown (.md) o Word (.docx). Hasta 50MB."
					/>
				</StandardCard.Content>
			</StandardCard>

			{file && conversions.length === 0 && (
				<StandardAlert
					colorScheme="warning"
					styleType="subtle"
					title="Formato no soportado"
					message={`El archivo ".${ext}" no tiene conversiones disponibles. Subí un .md o un .docx.`}
				/>
			)}

			{file && conversions.length > 0 && (
				<StandardCard colorScheme="primary" styleType="subtle">
					<StandardCard.Header>
						<div className="flex flex-col gap-1">
							<StandardText weight="semibold">
								Conversiones disponibles
							</StandardText>
							<StandardText size="sm" colorScheme="neutral" colorShade="textShade">
								{file.name} · {(file.size / 1024).toFixed(1)} KB
							</StandardText>
						</div>
					</StandardCard.Header>
					<StandardCard.Content>
						<div className="flex flex-wrap gap-3">
							{conversions.map((c) => (
								<StandardButton
									key={c.id}
									colorScheme="primary"
									onClick={() => runConversion(c.id)}
									disabled={running !== null}
									leftIcon={running === c.id ? Loader2 : FileDown}
									tooltip={c.hint}>
									{running === c.id ? "Convirtiendo…" : c.label}
								</StandardButton>
							))}
						</div>
					</StandardCard.Content>
				</StandardCard>
			)}
		</div>
	);
}
