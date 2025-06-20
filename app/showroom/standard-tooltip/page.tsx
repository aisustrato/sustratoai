//. 📍 app/showroom/standard-tooltip/page.tsx (CORREGIDO)

"use client";

import React from "react";
import { StandardTooltip } from "@/components/ui/StandardTooltip";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";

const SAMPLE_ABSTRACT_FULL = `En este estudio exhaustivo, exploramos la convergencia de la inteligencia artificial y la filosofía posestructuralista, un campo emergente que desafía las nociones tradicionales de subjetividad y conocimiento en la era digital. Analizamos cómo estas tecnologías no solo procesan información, sino que reconfiguran activamente los paisajes semióticos. La investigación se centra en la "agencia difusa" de las IA, argumentando que su capacidad para crear narrativas las posiciona como actores semi-autónomos. Examinamos críticamente el concepto de "verdad" en un mundo saturado de información generada algorítmicamente, proponiendo marcos para una deconstrucción rigurosa de los sesgos inherentes a los grandes modelos de lenguaje.`;

const SAMPLE_ABSTRACT_TRUNCATED = SAMPLE_ABSTRACT_FULL.substring(0, 150) + "...";

export default function StandardTooltipShowroomPage() {
	return (
		<div className="container mx-auto py-10 px-4">
			<header className="mb-12 text-center">
				<StandardText
					preset="heading"
					size="3xl"
					applyGradient="primary"
					className="mb-3 font-bold">
					StandardTooltip Showroom
				</StandardText>
				<StandardText
					preset="body"
					size="lg"
					colorScheme="neutral"
					colorShade="textShade"
					className="max-w-3xl mx-auto">
					Pruebas exhaustivas para el componente StandardTooltip, incluyendo el
					modo de texto largo.
				</StandardText>
			</header>

			<main className="mt-12 space-y-12">
				{/* SECCIÓN 1: TOOLTIPS BÁSICOS */}
				<section>
					<StandardText preset="subheading" size="xl" className="mb-4">
						Variantes y Posiciones
					</StandardText>
					<div className="flex flex-wrap items-center gap-6 mt-4 p-6 border rounded-lg bg-neutral-softBg dark:bg-neutral-softBgDark">
						<StandardTooltip trigger={<StandardButton>Hover Me (Top)</StandardButton>}>
							Tooltip en la parte superior
						</StandardTooltip>
						<StandardTooltip
							trigger={<StandardButton styleType="outline">Hover Me (Right)</StandardButton>}
                            side="right"
                            colorScheme="secondary">
							Tooltip a la derecha
						</StandardTooltip>
					</div>
				</section>
                
				{/* SECCIÓN 2: MODO TEXTO LARGO (isLongText) */}
				<section>
					<StandardText preset="subheading" size="xl" className="mb-4">
						Prueba de `isLongText` para Contenidos Extensos
					</StandardText>
					<div className="p-6 border rounded-lg bg-neutral-softBg dark:bg-neutral-softBgDark">
						<div className="border p-4 rounded-md bg-neutral-bg dark:bg-neutral-bgDark">
							<StandardTooltip
								trigger={
									// ✨ CORRECCIÓN: Se usa un <div> en lugar de <p> para evitar anidación inválida.
									<div className="cursor-pointer max-w-lg">
										<StandardText truncate>
											{SAMPLE_ABSTRACT_TRUNCATED}
										</StandardText>
									</div>
								}
								isLongText={true}
								colorScheme="neutral"
                                isAccentuated={false}>
								<div className="prose prose-sm dark:prose-invert max-w-none p-2">
									<h4 className="text-lg font-bold mb-2">Abstract Completo</h4>
									<p>{SAMPLE_ABSTRACT_FULL}</p>
								</div>
							</StandardTooltip>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}