"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { StandardNoteBeta } from "@/components/ui/StandardNote_beta";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardButton } from "@/components/ui/StandardButton";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import {
	StandardTabs,
	StandardTabsList,
	StandardTabsTrigger,
} from "@/components/ui/StandardTabs";
import { TabsContent as StandardTabsContent } from "@radix-ui/react-tabs";
import { StandardCard } from "@/components/ui/StandardCard";
import { Copy, Download, RefreshCw, Zap } from "lucide-react";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

//#region [def] - 📦 TYPES & CONSTANTS 📦
type EditorMode = "edit" | "preview";
type EditorSize = "sm" | "md" | "lg";

const colorSchemesForDemo: ColorSchemeVariant[] = [
	"primary",
	"secondary",
	"tertiary",
	"accent",
	"neutral",
	"success",
	"warning",
	"danger",
];

const sizesForDemo: EditorSize[] = ["sm", "md", "lg"];

const sampleContent = `# StandardNote Beta - Demo

Esta es una **demostración interactiva** del nuevo editor de notas *sin dependencias externas*.

## Características Principales

- **Negrita** y *itálica* funcionales
- <mark>Texto resaltado</mark> nativo
- Títulos de diferentes niveles

### Lista de Funcionalidades

- Editor Markdown nativo
- Vista previa en tiempo real
- Toolbar intuitiva
- Lógica toggle inteligente

### Lista Numerada

1. Implementación limpia
2. Sin librerías externas
3. Performance optimizada
4. Integración Standard UI

## Prueba los Formatos

Selecciona texto y usa la **toolbar** para aplicar formatos, o escribe Markdown directamente.

> ¡Prueba alternar entre modo edición y vista previa!`;

const demoContents = {
	basic: `# Mi Primera Nota

Esta es una nota **básica** con algunos *formatos simples*.

- Item 1
- Item 2
- Item 3`,
	
	advanced: sampleContent,
	
	empty: "",
	
	lists: `# Listas de Ejemplo

## Lista con Viñetas
- Primer item
- Segundo item
- Tercer item

## Lista Numerada
1. Paso uno
2. Paso dos  
3. Paso tres

## Lista Mixta
- Categoría A
  1. Subcategoría 1
  2. Subcategoría 2
- Categoría B
  1. Subcategoría 3
  2. Subcategoría 4`,

	formatting: `# Guía de Formatos

## Texto Inline
Este texto tiene **negrita**, *itálica* y <mark>resaltado</mark>.

## Títulos
# Título Principal
## Título Secundario  
### Título Terciario

## Combinaciones
Un texto con **negrita y *itálica anidada*** es posible.
También podemos tener <mark>**texto resaltado en negrita**</mark>.`
};
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function StandardNoteMdShowroomPage() {
	const [activeTab, setActiveTab] = useState("interactive");
	const [demoColorScheme, setDemoColorScheme] = useState<ColorSchemeVariant>("primary");
	const [demoSize, setDemoSize] = useState<EditorSize>("md");
	const [demoContent, setDemoContent] = useState(sampleContent);
	const [demoDisabled, setDemoDisabled] = useState(false);
	const [demoReadOnly, setDemoReadOnly] = useState(false);
	const [demoShowToolbar, setDemoShowToolbar] = useState(true);
	const [demoShowPreview, setDemoShowPreview] = useState(true);
	const [demoInitialMode, setDemoInitialMode] = useState<EditorMode>("edit");
	const [demoLivePreview, setDemoLivePreview] = useState(false);
	const [demoDebounceMs, setDemoDebounceMs] = useState(500);
	const [selectedTemplate, setSelectedTemplate] = useState("advanced");

	const handleTemplateChange = useCallback((template: string | string[] | undefined) => {
		if (typeof template === 'string') {
			setSelectedTemplate(template);
			setDemoContent(demoContents[template as keyof typeof demoContents] || demoContents.basic);
		}
	}, []);

	const handleCopyContent = useCallback(() => {
		navigator.clipboard.writeText(demoContent);
	}, [demoContent]);

	const handleClearContent = useCallback(() => {
		setDemoContent("");
	}, []);

	const handleResetContent = useCallback(() => {
		setDemoContent(sampleContent);
	}, []);

	return (
		<div className="container mx-auto py-10 px-4">
			<header className="mb-12 text-center">
				<StandardText
					asElement="h1"
					size="3xl"
					weight="bold"
					colorScheme="primary"
					className="mb-3">
					StandardNote Beta - Editor Markdown
				</StandardText>
				<StandardText
					size="lg"
					colorScheme="neutral"
					className="max-w-3xl mx-auto mb-4">
					Editor de notas con Markdown nativo, sin dependencias externas. 
					Toolbar intuitiva, vista previa en tiempo real y lógica toggle inteligente.
				</StandardText>
				<div className="flex items-center justify-center gap-4">
					<ThemeSwitcher />
					<StandardText size="sm" colorScheme="accent" weight="medium">
						🚀 Beta v1.0 - Sin librerías externas
					</StandardText>
				</div>
			</header>

			<StandardTabs
				defaultValue="interactive"
				className="w-full"
				onValueChange={setActiveTab}
				colorScheme="tertiary"
				styleType="line">
				
				<StandardTabsList className="grid w-full grid-cols-4 mb-8">
					<StandardTabsTrigger value="interactive">
						Editor Interactivo
					</StandardTabsTrigger>
					<StandardTabsTrigger value="schemes">
						Esquemas de Color
					</StandardTabsTrigger>
					<StandardTabsTrigger value="templates">
						Plantillas
					</StandardTabsTrigger>
					<StandardTabsTrigger value="features">
						Características
					</StandardTabsTrigger>
				</StandardTabsList>

				<AnimatePresence mode="wait">
					{activeTab === "interactive" && (
						<StandardTabsContent forceMount value="interactive" asChild>
							<motion.section
								key="interactive"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								className="grid grid-cols-1 lg:grid-cols-3 gap-8">
								
								{/* Panel de Controles */}
								<div className="lg:col-span-1 space-y-6">
									<StandardCard className="p-6">
										<StandardText size="lg" weight="semibold" className="mb-4">
											Configuración
										</StandardText>
										
										<div className="space-y-4">
											<div>
												<StandardText size="sm" weight="medium" className="mb-2">
													Esquema de Color
												</StandardText>
												<StandardSelect
													value={demoColorScheme}
													onChange={(value) => setDemoColorScheme(value as ColorSchemeVariant)}
													options={[
														{ value: "primary", label: "Primary" },
														{ value: "secondary", label: "Secondary" },
														{ value: "tertiary", label: "Tertiary" },
														{ value: "accent", label: "Accent" },
														{ value: "neutral", label: "Neutral" }
													]}
												/>
											</div>

											<div>
												<StandardText size="sm" weight="medium" className="mb-2">
													Tamaño
												</StandardText>
												<StandardSelect
													value={demoSize}
													onChange={(value) => setDemoSize(value as EditorSize)}
													options={[
														{ value: "sm", label: "Pequeño" },
														{ value: "md", label: "Mediano" },
														{ value: "lg", label: "Grande" }
													]}
												/>
											</div>

											<div>
												<StandardText size="sm" weight="medium" className="mb-2">
													Modo Inicial
												</StandardText>
												<StandardSelect
													value={demoInitialMode}
													onChange={(value) => setDemoInitialMode(value as EditorMode)}
													disabled={demoLivePreview}
													options={[
														{ value: "edit", label: "Edición" },
														{ value: "preview", label: "Vista Previa" }
													]}
												/>
												{demoLivePreview && (
													<StandardText size="xs" colorScheme="neutral" className="mt-1 opacity-70">
														Deshabilitado en modo Live Preview
													</StandardText>
												)}
											</div>

											<div>
												<StandardText size="sm" weight="medium" className="mb-2">
													Plantilla
												</StandardText>
												<StandardSelect
													value={selectedTemplate}
													onChange={handleTemplateChange}
													options={[
														{ value: "basic", label: "Básica" },
														{ value: "advanced", label: "Avanzada" },
														{ value: "lists", label: "Listas" },
														{ value: "formatting", label: "Formatos" },
														{ value: "empty", label: "Vacía" }
													]}
												/>
											</div>
										</div>
									</StandardCard>

									<StandardCard className="p-6">
										<StandardText size="lg" weight="semibold" className="mb-4">
											Vista Previa Avanzada
										</StandardText>
										
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<div>
													<StandardText size="sm" weight="medium">Live Preview</StandardText>
													<StandardText size="xs" colorScheme="neutral" className="opacity-70">
														Pantalla dividida en tiempo real
													</StandardText>
												</div>
												<StandardButton
													size="sm"
													styleType={demoLivePreview ? "solid" : "outline"}
													colorScheme="accent"
													onClick={() => setDemoLivePreview(!demoLivePreview)}>
													{demoLivePreview ? "Activado" : "Desactivado"}
												</StandardButton>
											</div>

											{demoLivePreview && (
												<div>
													<StandardText size="sm" weight="medium" className="mb-2">
														Debounce (ms)
													</StandardText>
													<StandardSelect
														value={demoDebounceMs.toString()}
														onChange={(value) => setDemoDebounceMs(parseInt(value as string))}
														options={[
															{ value: "100", label: "100ms (Muy rápido)" },
															{ value: "300", label: "300ms (Rápido)" },
															{ value: "500", label: "500ms (Balanceado)" },
															{ value: "1000", label: "1000ms (Lento)" },
															{ value: "2000", label: "2000ms (Muy lento)" }
														]}
													/>
													<StandardText size="xs" colorScheme="neutral" className="mt-1 opacity-70">
														Tiempo de espera antes de actualizar preview
													</StandardText>
												</div>
											)}
										</div>
									</StandardCard>

									<StandardCard className="p-6">
										<StandardText size="lg" weight="semibold" className="mb-4">
											Estados
										</StandardText>
										
										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<StandardText size="sm">Toolbar</StandardText>
												<StandardButton
													size="sm"
													styleType={demoShowToolbar ? "solid" : "outline"}
													colorScheme="neutral"
													onClick={() => setDemoShowToolbar(!demoShowToolbar)}>
													{demoShowToolbar ? "Visible" : "Oculta"}
												</StandardButton>
											</div>

											<div className="flex items-center justify-between">
												<StandardText size="sm">Vista Previa</StandardText>
												<StandardButton
													size="sm"
													styleType={demoShowPreview ? "solid" : "outline"}
													colorScheme="neutral"
													disabled={demoLivePreview}
													onClick={() => setDemoShowPreview(!demoShowPreview)}>
													{demoShowPreview ? "Habilitada" : "Deshabilitada"}
												</StandardButton>
											</div>
											{demoLivePreview && (
												<StandardText size="xs" colorScheme="neutral" className="opacity-70 text-center">
													Deshabilitado en modo Live Preview
												</StandardText>
											)}

											<div className="flex items-center justify-between">
												<StandardText size="sm">Deshabilitado</StandardText>
												<StandardButton
													size="sm"
													styleType={demoDisabled ? "solid" : "outline"}
													colorScheme="warning"
													onClick={() => setDemoDisabled(!demoDisabled)}>
													{demoDisabled ? "Sí" : "No"}
												</StandardButton>
											</div>

											<div className="flex items-center justify-between">
												<StandardText size="sm">Solo Lectura</StandardText>
												<StandardButton
													size="sm"
													styleType={demoReadOnly ? "solid" : "outline"}
													colorScheme="secondary"
													onClick={() => setDemoReadOnly(!demoReadOnly)}>
													{demoReadOnly ? "Sí" : "No"}
												</StandardButton>
											</div>
										</div>
									</StandardCard>

									<StandardCard className="p-6">
										<StandardText size="lg" weight="semibold" className="mb-4">
											Acciones
										</StandardText>
										
										<div className="space-y-2">
											<StandardButton
												size="sm"
												styleType="outline"
												colorScheme="neutral"
												leftIcon={Copy}
												onClick={handleCopyContent}
												className="w-full justify-start">
												Copiar Contenido
											</StandardButton>
											
											<StandardButton
												size="sm"
												styleType="outline"
												colorScheme="warning"
												leftIcon={RefreshCw}
												onClick={handleClearContent}
												className="w-full justify-start">
												Limpiar
											</StandardButton>
											
											<StandardButton
												size="sm"
												styleType="outline"
												colorScheme="primary"
												leftIcon={Zap}
												onClick={handleResetContent}
												className="w-full justify-start">
												Restaurar Demo
											</StandardButton>
										</div>
									</StandardCard>
								</div>

								{/* Editor Demo */}
								<div className="lg:col-span-2">
									<StandardCard className="p-6 h-full">
										<div className="flex items-center justify-between mb-4">
											<StandardText size="lg" weight="semibold">
												Editor en Vivo
											</StandardText>
											<StandardText size="sm" colorScheme="neutral" className="opacity-70">
												{demoContent.length} caracteres
											</StandardText>
										</div>
										
										<StandardNoteBeta
											key={`${demoColorScheme}-${demoSize}-${demoInitialMode}-${demoShowToolbar}-${demoShowPreview}-${demoLivePreview}-${demoDebounceMs}`}
											value={demoContent}
											onChange={setDemoContent}
											colorScheme={demoColorScheme}
											size={demoSize}
											disabled={demoDisabled}
											readOnly={demoReadOnly}
											showToolbar={demoShowToolbar}
											showPreview={demoShowPreview}
											initialMode={demoInitialMode}
											livePreview={demoLivePreview}
											previewDebounceMs={demoDebounceMs}
											placeholder="Escribe tu nota aquí... Usa la toolbar o escribe Markdown directamente."
											minHeight="min-h-[400px]"
										/>
									</StandardCard>
								</div>
							</motion.section>
						</StandardTabsContent>
					)}

					{activeTab === "schemes" && (
						<StandardTabsContent forceMount value="schemes" asChild>
							<motion.div
								key="schemes"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}>
								
								<StandardText size="xl" weight="semibold" className="mb-6 text-center">
									Esquemas de Color Disponibles
								</StandardText>
								
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{colorSchemesForDemo.map((scheme) => (
										<motion.div
											key={scheme}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}>
											<StandardCard className="p-4">
												<StandardText size="lg" weight="semibold" className="mb-3 capitalize">
													{scheme}
												</StandardText>
												<StandardNoteBeta
													value={`# Editor ${scheme.charAt(0).toUpperCase() + scheme.slice(1)}

Este editor usa el esquema **${scheme}**.

- Toolbar integrada
- Vista previa funcional  
- <mark>Resaltado nativo</mark>`}
													colorScheme={scheme}
													size="sm"
													showToolbar={true}
													showPreview={true}
													initialMode="edit"
													minHeight="min-h-[200px]"
													readOnly={true}
												/>
											</StandardCard>
										</motion.div>
									))}
								</div>
							</motion.div>
						</StandardTabsContent>
					)}

					{activeTab === "templates" && (
						<StandardTabsContent forceMount value="templates" asChild>
							<motion.div
								key="templates"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}>
								
								<StandardText size="xl" weight="semibold" className="mb-6 text-center">
									Plantillas de Contenido
								</StandardText>
								
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									{Object.entries(demoContents).map(([key, content]) => (
										<motion.div
											key={key}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}>
											<StandardCard className="p-4">
												<div className="flex items-center justify-between mb-3">
													<StandardText size="lg" weight="semibold" className="capitalize">
														{key === "basic" ? "Básica" : 
														 key === "advanced" ? "Avanzada" :
														 key === "lists" ? "Listas" :
														 key === "formatting" ? "Formatos" : "Vacía"}
													</StandardText>
													<StandardButton
														size="sm"
														styleType="outline"
														colorScheme="primary"
														onClick={() => handleTemplateChange(key)}>
														Usar
													</StandardButton>
												</div>
												<StandardNoteBeta
													value={content}
													size="sm"
													showToolbar={false}
													showPreview={false}
													initialMode="preview"
													minHeight="min-h-[150px]"
													readOnly={true}
												/>
											</StandardCard>
										</motion.div>
									))}
								</div>
							</motion.div>
						</StandardTabsContent>
					)}

					{activeTab === "features" && (
						<StandardTabsContent forceMount value="features" asChild>
							<motion.div
								key="features"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}>
								
								<StandardText size="xl" weight="semibold" className="mb-6 text-center">
									Características y Funcionalidades
								</StandardText>
								
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
										<StandardCard className="p-6 text-center">
											<div className="text-4xl mb-4">🚀</div>
											<StandardText size="lg" weight="semibold" className="mb-2">
												Sin Dependencias
											</StandardText>
											<StandardText size="sm" colorScheme="neutral">
												Implementación 100% nativa, sin librerías externas pesadas
											</StandardText>
										</StandardCard>
									</motion.div>

									<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
										<StandardCard className="p-6 text-center">
											<div className="text-4xl mb-4">⚡</div>
											<StandardText size="lg" weight="semibold" className="mb-2">
												Performance
											</StandardText>
											<StandardText size="sm" colorScheme="neutral">
												Renderizado rápido y fluido sin artefactos visuales
											</StandardText>
										</StandardCard>
									</motion.div>

									<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
										<StandardCard className="p-6 text-center">
											<div className="text-4xl mb-4">🎨</div>
											<StandardText size="lg" weight="semibold" className="mb-2">
												Integración Standard
											</StandardText>
											<StandardText size="sm" colorScheme="neutral">
												Usa componentes Standard* y sistema de tokens
											</StandardText>
										</StandardCard>
									</motion.div>

									<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
										<StandardCard className="p-6 text-center">
											<div className="text-4xl mb-4">🔧</div>
											<StandardText size="lg" weight="semibold" className="mb-2">
												Lógica Toggle
											</StandardText>
											<StandardText size="sm" colorScheme="neutral">
												Aplicar/quitar formatos de manera inteligente y predecible
											</StandardText>
										</StandardCard>
									</motion.div>

									<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
										<StandardCard className="p-6 text-center">
											<div className="text-4xl mb-4">👁️</div>
											<StandardText size="lg" weight="semibold" className="mb-2">
												Vista Previa
											</StandardText>
											<StandardText size="sm" colorScheme="neutral">
												Renderizado WYSIWYG fiel al Markdown aplicado
											</StandardText>
										</StandardCard>
									</motion.div>

									<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
										<StandardCard className="p-6 text-center">
											<div className="text-4xl mb-4">♿</div>
											<StandardText size="lg" weight="semibold" className="mb-2">
												Accesibilidad
											</StandardText>
											<StandardText size="sm" colorScheme="neutral">
												Soporte completo para lectores de pantalla y navegación por teclado
											</StandardText>
										</StandardCard>
									</motion.div>
								</div>

								<div className="mt-12 text-center">
									<StandardCard className="p-8 max-w-2xl mx-auto">
										<StandardText size="lg" weight="semibold" className="mb-4">
											Formatos Soportados
										</StandardText>
										<div className="grid grid-cols-2 gap-4 text-left">
											<div>
												<StandardText size="sm" weight="medium" className="mb-2">
													Texto Inline:
												</StandardText>
												<ul className="text-sm space-y-1 text-neutral-600 dark:text-neutral-400">
													<li>• **Negrita**</li>
													<li>• *Itálica*</li>
													<li>• &lt;mark&gt;Resaltado&lt;/mark&gt;</li>
												</ul>
											</div>
											<div>
												<StandardText size="sm" weight="medium" className="mb-2">
													Estructura:
												</StandardText>
												<ul className="text-sm space-y-1 text-neutral-600 dark:text-neutral-400">
													<li>• # Títulos H1-H3</li>
													<li>• - Listas con viñetas</li>
													<li>• 1. Listas numeradas</li>
												</ul>
											</div>
										</div>
									</StandardCard>
								</div>
							</motion.div>
						</StandardTabsContent>
					)}
				</AnimatePresence>
			</StandardTabs>
		</div>
	);
}
//#endregion ![main]
