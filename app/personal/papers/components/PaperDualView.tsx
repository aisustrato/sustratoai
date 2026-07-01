// 📍 app/personal/papers/components/PaperDualView.tsx
// Toggle entre vista humana (imagen) y vista máquina (descripción textual)

"use client";

import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { Eye, Code } from "lucide-react";
import Image from "next/image";

interface PaperDualViewProps {
	imageUrl: string | null;
	altText: string;
	descriptionAi: string;
	mode: "human" | "machine";
	onModeChange: (mode: "human" | "machine") => void;
}

export function PaperDualView({
	imageUrl,
	altText,
	descriptionAi,
	mode,
	onModeChange,
}: PaperDualViewProps) {
	return (
		<div className="space-y-3">
			{/* Toggle Buttons */}
			<div className="flex gap-2">
				<StandardButton
					styleType={mode === "human" ? "solid" : "ghost"}
					colorScheme="primary"
					size="sm"
					onClick={() => onModeChange("human")}
					leftIcon={Eye}>
					Ver como humano
				</StandardButton>
				<StandardButton
					styleType={mode === "machine" ? "solid" : "ghost"}
					colorScheme="accent"
					size="sm"
					onClick={() => onModeChange("machine")}
					leftIcon={Code}>
					Ver como máquina
				</StandardButton>
			</div>

			{/* Preview Area */}
			<StandardCard styleType="filled" colorScheme="neutral" noPadding>
				<div className="min-h-[200px] flex items-center justify-center p-6">
					{
						mode === "human" ?
							// Vista Humana: Imagen
							imageUrl ?
								<div className="relative w-full max-w-2xl">
									<Image
										src={imageUrl}
										alt={altText || "Imagen del paper"}
										width={800}
										height={600}
										className="rounded-lg object-contain w-full h-auto"
										unoptimized
									/>
								</div>
							:	<div className="text-center">
									<StandardText
										size="base"
										colorScheme="neutral"
										colorShade="subtle">
										No hay imagen cargada
									</StandardText>
								</div>

							// Vista Máquina: Descripción textual
						:	<div className="w-full max-w-2xl">
								<div className="bg-background-default rounded-lg p-4 border border-border-neutral">
									<StandardText
										size="xs"
										colorScheme="neutral"
										colorShade="subtle"
										className="mb-2">
										Descripción para AI/Robots:
									</StandardText>
									<pre className="font-mono text-sm text-text-primary whitespace-pre-wrap">
										{descriptionAi || "(Sin descripción)"}
									</pre>
								</div>
								{altText && (
									<div className="mt-3 bg-background-default rounded-lg p-4 border border-border-neutral">
										<StandardText
											size="xs"
											colorScheme="neutral"
											colorShade="subtle"
											className="mb-2">
											Alt text (HTML):
										</StandardText>
										<pre className="font-mono text-sm text-text-primary whitespace-pre-wrap">
											{altText}
										</pre>
									</div>
								)}
							</div>

					}
				</div>
			</StandardCard>
		</div>
	);
}
