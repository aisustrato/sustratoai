// 📍 app/personal/papers/components/PaperAnnexStep.tsx
// Paso 4: Gestión de anexos / material suplementario

"use client";

import { useState } from "react";
import { supabase } from "@/app/auth/client";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardEmptyState } from "@/components/ui/StandardEmptyState";
import { File, Plus, Info } from "lucide-react";
import { PaperAnnexCard } from "./PaperAnnexCard";
import type { PaperAnnex } from "@/lib/papers/types";
import { ALLOWED_ANNEX_EXTENSIONS } from "@/lib/papers/types";
import { createPaperAnnex, deletePaperAnnex } from "@/lib/papers/queries";

interface PaperAnnexStepProps {
	paperId: string | null;
	existingAnnexes?: PaperAnnex[];
	onAnnexesChange?: (annexes: PaperAnnex[]) => void;
}

export function PaperAnnexStep({
	paperId,
	existingAnnexes = [],
	onAnnexesChange,
}: PaperAnnexStepProps) {
	const [annexes, setAnnexes] = useState<PaperAnnex[]>(existingAnnexes);

	const handleUpload = async (
		file: File,
		description: string,
	): Promise<void> => {
		if (!paperId) {
			throw new Error(
				"No hay paper ID. Guarda el borrador primero.",
			);
		}

		const storagePath = `paper-annexes/${paperId}/${file.name}`;

		const { error: uploadError } = await supabase.storage
			.from("paper-annexes")
			.upload(storagePath, file, {
				cacheControl: "3600",
				upsert: true,
			});

		if (uploadError) {
			throw new Error(`Error subiendo anexo: ${uploadError.message}`);
		}

		const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
		const languageMap: Record<string, string> = {
			".py": "python",
			".ipynb": "jupyter",
			".csv": "csv",
			".json": "json",
			".zip": "zip",
		};

		const annex = await createPaperAnnex({
			paper_id: paperId,
			filename: file.name,
			storage_path: storagePath,
			file_size: file.size,
			mime_type: file.type || "application/octet-stream",
			language: (languageMap[ext] || "text") as PaperAnnex["language"],
			description,
			position: annexes.length + 1,
		});

		const next = [...annexes, annex];
		setAnnexes(next);
		onAnnexesChange?.(next);
	};

	const handleDelete = async (annex: PaperAnnex) => {
		try {
			await supabase.storage
				.from("paper-annexes")
				.remove([annex.storage_path]);
		} catch (e) {
			console.warn("[PaperAnnexStep] No se pudo borrar de storage:", e);
		}
		await deletePaperAnnex(annex.id);
		const next = annexes.filter((a) => a.id !== annex.id);
		setAnnexes(next);
		onAnnexesChange?.(next);
	};

	const addSlot = () => {
		// Los slots se manejan por posición; el usuario simplemente sube archivos
		// en orden. No necesitamos estado explícito de "slots vacíos".
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<StandardCard styleType="filled" colorScheme="primary">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-3 rounded-lg bg-primary-bg">
							<File className="h-6 w-6 text-primary-pure" />
						</div>
						<div>
							<StandardText size="lg" weight="semibold">
								Anexos / Material Suplementario
							</StandardText>
							<StandardText
								size="sm"
								colorScheme="neutral"
								colorShade="subtle"
							>
								{annexes.length} anexo{annexes.length !== 1 ? "s" : ""}{" "}
								cargado{annexes.length !== 1 ? "s" : ""}
							</StandardText>
						</div>
					</div>
				</div>
			</StandardCard>

			{/* Lista de anexos existentes */}
			{annexes.length > 0 && (
				<div className="space-y-4">
					{annexes.map((annex) => (
						<PaperAnnexCard
							key={annex.id}
							position={annex.position}
							totalAnnexes={annexes.length}
							paperId={paperId}
							onAnnexUpload={handleUpload}
							onAnnexDelete={() => handleDelete(annex)}
							existingAnnex={annex}
						/>
					))}
				</div>
			)}

			{/* Slot para nuevo anexo */}
			<PaperAnnexCard
				position={annexes.length + 1}
				totalAnnexes={annexes.length + 1}
				paperId={paperId}
				onAnnexUpload={handleUpload}
			/>

			{/* Info Card */}
			<StandardCard styleType="subtle" colorScheme="neutral">
				<StandardText size="sm" colorScheme="neutral" colorShade="subtle">
					<strong>Formatos aceptados:</strong>{" "}
					{(
						ALLOWED_ANNEX_EXTENSIONS as readonly string[]
					).join(", ")}{" "}
					• Máx 50 MB por archivo. Los anexos aparecerán como material
					descargable en la vista pública de tu paper.
				</StandardText>
			</StandardCard>
		</div>
	);
}
