//. 📍 app/showroom/standard-switch/page.tsx

"use client";

import React, { useState } from "react";
import { StandardSwitch } from "@/components/ui/StandardSwitch";
import { StandardText } from "@/components/ui/StandardText";
import { StandardLabel } from "@/components/ui/StandardLabel";
import { type ColorSchemeVariant } from "@/lib/theme/ColorToken";

export default function StandardSwitchShowroomPage() {
	// Estado para el ejemplo de componente controlado
	const [isNotificationsEnabled, setNotificationsEnabled] = useState(false);

	const colorSchemes: ColorSchemeVariant[] = [
		"primary",
		"secondary",
		"success",
		"warning",
		"danger",
		"neutral",
	];

	return (
		<div className="container mx-auto py-10 px-4">
			<header className="mb-12 text-center">
				<StandardText
					preset="heading"
					size="3xl"
					applyGradient="primary"
					className="mb-3 font-bold">
					StandardSwitch Showroom
				</StandardText>
				<StandardText
					preset="body"
					size="lg"
					colorScheme="neutral"
					colorShade="textShade"
					className="max-w-3xl mx-auto">
					Aquí probamos todas las variantes y estados del nuevo componente
					StandardSwitch.
				</StandardText>
			</header>

			<main className="mt-12 space-y-12">
				{/* SECCIÓN 1: PRUEBA POR TAMAÑO */}
				<section>
					<StandardText preset="subheading" size="xl" className="mb-4">
						Prueba por Tamaños
					</StandardText>
					<div className="flex items-end gap-8 mt-4 p-6 border rounded-lg bg-neutral-softBg dark:bg-neutral-softBgDark">
						<div>
							<StandardLabel htmlFor="switch-sm" className="mb-2 block">
								Pequeño (sm)
							</StandardLabel>
							<StandardSwitch id="switch-sm" size="sm" defaultChecked />
						</div>
						<div>
							<StandardLabel htmlFor="switch-md" className="mb-2 block">
								Mediano (md)
							</StandardLabel>
							<StandardSwitch id="switch-md" size="md" defaultChecked />
						</div>
						<div>
							<StandardLabel htmlFor="switch-lg" className="mb-2 block">
								Grande (lg)
							</StandardLabel>
							<StandardSwitch id="switch-lg" size="lg" defaultChecked />
						</div>
					</div>
				</section>

				{/* SECCIÓN 2: PRUEBA POR ESQUEMA DE COLOR */}
				<section>
					<StandardText preset="subheading" size="xl" className="mb-4">
						Prueba por Esquemas de Color
					</StandardText>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-4 p-6 border rounded-lg bg-neutral-softBg dark:bg-neutral-softBgDark">
						{colorSchemes.map((scheme) => (
							<div key={scheme} className="flex flex-col items-center">
								<StandardLabel className="mb-2 capitalize">{scheme}</StandardLabel>
								<StandardSwitch colorScheme={scheme} defaultChecked />
							</div>
						))}
					</div>
				</section>

				{/* SECCIÓN 3: PRUEBA DE ESTADOS */}
				<section>
					<StandardText preset="subheading" size="xl" className="mb-4">
						Prueba de Estados
					</StandardText>
					<div className="flex flex-wrap items-end gap-8 mt-4 p-6 border rounded-lg bg-neutral-softBg dark:bg-neutral-softBgDark">
						<div>
							<StandardLabel className="mb-2 block">Apagado</StandardLabel>
							<StandardSwitch />
						</div>
						<div>
							<StandardLabel className="mb-2 block">Encendido</StandardLabel>
							<StandardSwitch defaultChecked />
						</div>
						<div>
							<StandardLabel className="mb-2 block">Deshabilitado</StandardLabel>
							<StandardSwitch disabled />
						</div>
						<div>
							<StandardLabel className="mb-2 block">
								Deshabilitado (Encendido)
							</StandardLabel>
							<StandardSwitch disabled defaultChecked />
						</div>
					</div>
				</section>
                
				{/* SECCIÓN 4: PRUEBA DE ESTADO CONTROLADO */}
				<section>
					<StandardText preset="subheading" size="xl" className="mb-4">
						Prueba de Estado Controlado
					</StandardText>
					<div className="p-6 border rounded-lg bg-neutral-softBg dark:bg-neutral-softBgDark space-y-4">
						<div className="flex items-center space-x-3">
							<StandardSwitch
								id="controlled-switch"
								checked={isNotificationsEnabled}
								onCheckedChange={setNotificationsEnabled}
								colorScheme="success"
							/>
							<StandardLabel htmlFor="controlled-switch">
								Activar notificaciones
							</StandardLabel>
						</div>
						<div className="p-3 bg-neutral-bg dark:bg-neutral-bgDark rounded-md text-sm border">
							El estado del componente es:{" "}
							<strong
								className={
									isNotificationsEnabled
										? "text-success-text"
										: "text-danger-text"
								}>
								{isNotificationsEnabled ? "ENCENDIDO" : "APAGADO"}
							</strong>
							.
							<button
								onClick={() => setNotificationsEnabled(!isNotificationsEnabled)}
								className="ml-4 px-3 py-1 border rounded-md text-xs bg-white dark:bg-black hover:bg-neutral-softBg dark:hover:bg-neutral-softBgDark transition-colors">
								Alternar desde fuera
							</button>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}