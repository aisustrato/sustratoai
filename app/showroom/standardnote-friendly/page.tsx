"use client";

import React from "react";
import { StandardText } from "@/components/ui/StandardText";
import { StandardNoteBetaFriendly } from "@/components/ui/StandardNote_betaFriendly";
import { StandardSelect } from "@/components/ui/StandardSelect";

export default function StandardNoteFriendlyShowroom() {
	const [value, setValue] = React.useState(`# Análisis Bibliográfico - Ejemplo

Esta es una **demostración interactiva** del nuevo editor de notas *sin dependencias externas*.

## Características Principales

1. **Negrita** y *cursiva* funcionales
2. <mark>Texto resaltado</mark> nativo
3. Títulos de diferentes niveles

### Lista de Funcionalidades

- Editor con <mark>highlighting</mark> sutil
- Vista previa en tiempo real
- Toolbar intuitiva con lenguaje académico
- Lógica toggle inteligente

### Lista Numerada

1. Implementación limpia
2. Sin librerías externas
3. Performance optimizada

**Ejemplo de enlace:** [Documentación](https://example.com)

---

*Perfecto para investigadores humanistas que necesitan una herramienta de escritura académica sin tecnicismos.*`);

	const [livePreview, setLivePreview] = React.useState(true);
	const [debounceMs, setDebounceMs] = React.useState(300);
	const [minimalToolbar, setMinimalToolbar] = React.useState(false);
	const [viewMode, setViewMode] = React.useState<'divided' | 'editor' | 'preview'>('divided');

	const debounceOptions = [
		{ value: "100", label: "100ms - Muy rápido" },
		{ value: "300", label: "300ms - Rápido" },
		{ value: "500", label: "500ms - Equilibrado" },
		{ value: "800", label: "800ms - Pausado" },
		{ value: "1000", label: "1000ms - Lento" }
	];

	return (
		<div className="container mx-auto p-6 space-y-8">
			{/* Header */}
			<div className="space-y-4">
				<StandardText size="2xl" weight="bold" colorScheme="primary">
					StandardNote Friendly - Showroom
				</StandardText>
				<StandardText size="md" colorScheme="neutral" className="max-w-3xl">
					Editor de notas diseñado específicamente para investigadores humanistas. 
					Interfaz académica intuitiva que oculta la complejidad técnica mientras mantiene 
					toda la potencia de Markdown en el backend para compatibilidad con sistemas AI.
				</StandardText>
			</div>

			{/* Controles */}
			<div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border">
				<StandardText size="sm" weight="semibold" className="mb-3">
					Configuración de Vista Previa
				</StandardText>
				<div className="flex flex-wrap gap-4 items-center">
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={livePreview}
							onChange={(e) => setLivePreview(e.target.checked)}
							className="rounded"
						/>
						<StandardText size="sm">Vista previa en vivo (pantalla dividida)</StandardText>
					</label>
					
					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={minimalToolbar}
							onChange={(e) => setMinimalToolbar(e.target.checked)}
							className="rounded"
						/>
						Toolbar minimalista (solo iconos)
					</label>
							
					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Modo de Visualización:
						</label>
						<div className="flex gap-2">
							<label className="flex items-center gap-2 text-sm">
								<input
									type="radio"
									name="viewMode"
									value="divided"
									checked={viewMode === 'divided'}
									onChange={(e) => setViewMode(e.target.value as any)}
									className="rounded"
								/>
								Dividido
							</label>
							<label className="flex items-center gap-2 text-sm">
								<input
									type="radio"
									name="viewMode"
									value="editor"
									checked={viewMode === 'editor'}
									onChange={(e) => setViewMode(e.target.value as any)}
									className="rounded"
								/>
								Solo Editor
							</label>
							<label className="flex items-center gap-2 text-sm">
								<input
									type="radio"
									name="viewMode"
									value="preview"
									checked={viewMode === 'preview'}
									onChange={(e) => setViewMode(e.target.value as any)}
									className="rounded"
								/>
								Solo Preview
							</label>
						</div>
					</div>

					{livePreview && (
						<div className="flex items-center gap-2">
							<StandardText size="sm">Velocidad de actualización:</StandardText>
							<StandardSelect
								value={debounceMs.toString()}
								onChange={(value) => {
									const stringValue = Array.isArray(value) ? value[0] : value;
									setDebounceMs(parseInt(stringValue || '500'));
								}}
								options={debounceOptions}
								placeholder="Seleccionar velocidad"
								size="sm"
							/>
						</div>
					)}
				</div>
			</div>

			{/* Características Destacadas */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
					<StandardText size="sm" weight="semibold" colorScheme="primary" className="mb-2">
						🎯 Lenguaje Académico
					</StandardText>
					<StandardText size="xs" colorScheme="neutral">
						Toolbar con terminología familiar: "Título", "Subtítulo", "Lista" en lugar de tecnicismos.
					</StandardText>
				</div>
				
				<div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
					<StandardText size="sm" weight="semibold" colorScheme="accent" className="mb-2">
						🔄 Toggle Inteligente
					</StandardText>
					<StandardText size="xs" colorScheme="neutral">
						Detecta formatos existentes y los quita/agrega inteligentemente. Maneja combinaciones como ***texto***.
					</StandardText>
				</div>
				
				<div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
					<StandardText size="sm" weight="semibold" colorScheme="secondary" className="mb-2">
						🧠 Backend Inteligente
					</StandardText>
					<StandardText size="xs" colorScheme="neutral">
						Persiste en Markdown puro para compatibilidad total con sistemas AI y análisis automático.
					</StandardText>
				</div>
			</div>

			{/* Editor Principal */}
			<div className="space-y-4">
				<StandardText size="lg" weight="semibold">
					Editor en Acción
				</StandardText>
				
				<StandardNoteBetaFriendly
					value={value}
					onChange={setValue}
					placeholder="Comience escribiendo su análisis académico aquí..."
					livePreview={livePreview}
					previewDebounceMs={debounceMs}
					minimalToolbar={minimalToolbar}
					viewMode={viewMode}
					onViewModeChange={setViewMode}
					showToolbar={true}
					minHeight="400px"
					colorScheme="neutral"
				/>
			</div>

			{/* Guía de Uso */}
			<div className="bg-amber-50 dark:bg-amber-950 p-6 rounded-lg border border-amber-200 dark:border-amber-800">
				<StandardText size="md" weight="semibold" colorScheme="accent" className="mb-4">
					💡 Guía Rápida para Investigadores
				</StandardText>
				
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<StandardText size="sm" weight="semibold" className="mb-2">
							Formato de Texto:
						</StandardText>
						<ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
							<li>• <strong>Negrita:</strong> Seleccionar texto + clic "Negrita"</li>
							<li>• <em>Cursiva:</em> Seleccionar texto + clic "Cursiva"</li>
							<li>• <mark>Resaltado:</mark> Para destacar conceptos clave</li>
						</ul>
					</div>
					
					<div>
						<StandardText size="sm" weight="semibold" className="mb-2">
							Estructura del Documento:
						</StandardText>
						<ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
							<li>• <strong>Título:</strong> Para secciones principales</li>
							<li>• <strong>Subtítulo:</strong> Para subsecciones</li>
							<li>• <strong>Lista:</strong> Para enumerar puntos</li>
							<li>• <strong>Enlace:</strong> Para referencias externas</li>
						</ul>
					</div>
				</div>
			</div>

			{/* Información Técnica */}
			<details className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
				<summary className="cursor-pointer font-medium text-sm mb-2">
					ℹ️ Información Técnica (Para Desarrolladores)
				</summary>
				<div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
					<p><strong>Backend:</strong> Markdown puro compatible con sistemas AI</p>
					<p><strong>Frontend:</strong> React + TypeScript con tokens de diseño</p>
					<p><strong>Características:</strong> Toggle inteligente, scroll sincronizado, validación de markup</p>
					<p><strong>Filosofía:</strong> Componente orquestador agnóstico a estilos, consumidor de tokens</p>
				</div>
			</details>
		</div>
	);
}
