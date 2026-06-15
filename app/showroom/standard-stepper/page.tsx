"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Upload,
	Loader2,
	Check,
	FileText,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";

// Components
import { StandardStepper } from "@/components/ui/StandardStepper";
import type { StandardStepperVariant, StepItem } from "@/components/ui/StandardStepper";
import { SimulableStepper } from "./SimulableStepper";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardBadge } from "@/components/ui/StandardBadge";

// Tabs
import {
	StandardTabs,
	StandardTabsList,
	StandardTabsTrigger,
} from "@/components/ui/StandardTabs";
import { TabsContent as StandardTabsContent } from "@radix-ui/react-tabs";

// Theme
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

// ─── Motion variants ─────────────────────────────────────────────
const tabContentVariants = {
	hidden: { opacity: 0, x: -10 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { duration: 0.3, ease: "easeInOut" },
	},
	exit: { opacity: 0, x: 10, transition: { duration: 0.2, ease: "easeInOut" } },
};

const itemVariants = {
	hidden: { opacity: 0, y: 15 },
	visible: { opacity: 1, y: 0 },
};

// ─── Data presets ─────────────────────────────────────────────────
const variantOptions: StandardStepperVariant[] = [
	"primary",
	"secondary",
	"accent",
	"neutral",
];

const defaultSteps: StepItem[] = [
	{ id: 1, label: "Subir archivo", description: "Selecciona el documento" },
	{ id: 2, label: "Procesar", description: "Analizando contenido" },
	{ id: 3, label: "Validar", description: "Verificando datos" },
	{ id: 4, label: "Resultado", description: "Documento listo" },
];

const stepsWithIcons: StepItem[] = [
	{ id: "upload", label: "Subir", description: "Seleccionar archivo", icon: Upload },
	{ id: "process", label: "Procesar", description: "Analizando…", icon: Loader2 },
	{ id: "validate", label: "Validar", description: "Verificando datos", icon: FileText },
	{ id: "done", label: "Listo", description: "Operación completada", icon: Check },
];

const stepsWithError: StepItem[] = [
	{ id: "a", label: "Validar", description: "Verificar sintaxis", status: "completed" },
	{ id: "b", label: "Compilar", description: "Error de sintaxis", status: "error" },
	{ id: "c", label: "Publicar", status: "pending" },
];

const manySteps: StepItem[] = Array.from({ length: 8 }, (_, i) => ({
	id: i + 1,
	label: `Paso ${i + 1}`,
	description: `Descripción del paso ${i + 1}`,
}));

const singleStep: StepItem[] = [
	{ id: 1, label: "Único paso", status: "active" },
];

const longLabelSteps: StepItem[] = [
	{
		id: 1,
		label: "Paso con etiqueta muy larga que podría desbordar",
		description: "Descripción también extensa para probar wrapping",
	},
	{ id: 2, label: "Mediano", status: "active" },
	{ id: 3, label: "Fin" },
];

const orientationOptions: { value: string; label: string }[] = [
	{ value: "horizontal", label: "Horizontal" },
	{ value: "vertical", label: "Vertical" },
];

export default function StandardStepperShowroomPage() {
	const [activeTab, setActiveTab] = useState("interactive");

	// ── Interactive demo state ──
	const [demoVariant, setDemoVariant] = useState<StandardStepperVariant>("primary");
	const [demoOrientation, setDemoOrientation] = useState<"horizontal" | "vertical">("horizontal");
	const [demoStepIndex, setDemoStepIndex] = useState(1);
	const [showDescriptions, setShowDescriptions] = useState(true);
	const [showIcons, setShowIcons] = useState(false);
	const [demoError, setDemoError] = useState(false);

	// ── Simulación interactiva ──
	const [simulatingInteractive, setSimulatingInteractive] = useState(false);

	// Derive interactive steps from toggles (antes del useEffect que lo usa)
	const interactiveSteps: StepItem[] = (showIcons ? stepsWithIcons : defaultSteps).map(
		(step, i) => ({
			...step,
			description: showDescriptions ? step.description : undefined,
			status: demoError && i === 1 ? ("error" as const) : undefined,
		}),
	);

	const totalInteractiveSteps = interactiveSteps.length;

	// Auto‑advance para el botón Simular del tab Interactivo
	useEffect(() => {
		if (!simulatingInteractive) return;
		if (demoStepIndex >= totalInteractiveSteps - 1) {
			setSimulatingInteractive(false);
			return;
		}
		const delay = 4000 + Math.random() * 6000; // 4‑10s
		const timer = setTimeout(() => {
			setDemoStepIndex((prev) => Math.min(prev + 1, totalInteractiveSteps - 1));
		}, delay);
		return () => clearTimeout(timer);
	}, [simulatingInteractive, demoStepIndex, totalInteractiveSteps]);

	// ── onStepClick demo state ──
	const [navStepIndex, setNavStepIndex] = useState(2);

	return (
		<div className="container mx-auto py-10 px-4">
			<header className="mb-12 text-center">
				<StandardText
					asElement="h1"
					size="3xl"
					weight="bold"
					applyGradient
					colorScheme="primary"
					className="mb-3">
					StandardStepper Showroom
				</StandardText>
				<StandardText
					asElement="p"
					size="lg"
					colorScheme="neutral"
					colorShade="text"
					className="max-w-2xl mx-auto">
					Stepper de pasos secuenciales con burbujas numeradas, conectores animados
					y soporte multi-estado.
				</StandardText>
				<div className="mt-4">
					<ThemeSwitcher />
				</div>
			</header>

			<StandardTabs
				defaultValue="interactive"
				className="w-full"
				onValueChange={setActiveTab}
				colorScheme="secondary"
				styleType="line">
				<StandardTabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
					<StandardTabsTrigger value="interactive">
						Interactivo
					</StandardTabsTrigger>
					<StandardTabsTrigger value="variants">
						Variantes
					</StandardTabsTrigger>
					<StandardTabsTrigger value="states">
						Estados
					</StandardTabsTrigger>
					<StandardTabsTrigger value="orientation">
						Orientación
					</StandardTabsTrigger>
				</StandardTabsList>

				<AnimatePresence mode="wait">
					{/* ════════════════ TAB: INTERACTIVO ════════════════ */}
					{activeTab === "interactive" && (
						<StandardTabsContent forceMount value="interactive" asChild>
							<motion.section
								key="interactive"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-8 p-6 border rounded-lg bg-neutral-bg dark:bg-neutral-bgDark">
								<StandardText
									asElement="h2"
									size="xl"
									weight="semibold"
									className="mb-2">
									Demo Interactivo
								</StandardText>

								{/* Controls grid */}
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
									<div className="space-y-1">
										<StandardText asElement="label" size="sm" weight="medium" className="block">
											Variante:
										</StandardText>
										<StandardSelect
											value={demoVariant}
											onChange={(val) => setDemoVariant(val as StandardStepperVariant)}
											options={variantOptions.map((v) => ({ value: v, label: v }))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText asElement="label" size="sm" weight="medium" className="block">
											Orientación:
										</StandardText>
										<StandardSelect
											value={demoOrientation}
											onChange={(val) => setDemoOrientation(val as "horizontal" | "vertical")}
											options={orientationOptions}
										/>
									</div>
									<div className="space-y-1">
										<StandardText asElement="label" size="sm" weight="medium" className="block">
											Paso actual (0‑based):
										</StandardText>
										<StandardInput
											type="number"
											min={0}
											max={totalInteractiveSteps - 1}
											value={String(demoStepIndex)}
											onChange={(e) => {
												const v = parseInt(e.target.value, 10);
												if (
													!isNaN(v) &&
													v >= 0 &&
													v < totalInteractiveSteps
												) {
													setDemoStepIndex(v);
												}
											}}
										/>
									</div>
								</div>

								{/* Toggle buttons */}
								<div className="flex flex-wrap gap-3 pt-2">
									<StandardButton
										size="sm"
										styleType={showDescriptions ? "solid" : "outline"}
										onClick={() => setShowDescriptions(!showDescriptions)}>
										{showDescriptions ? "Con descripciones" : "Sin descripciones"}
									</StandardButton>
									<StandardButton
										size="sm"
										styleType={showIcons ? "solid" : "outline"}
										onClick={() => setShowIcons(!showIcons)}>
										{showIcons ? "Con iconos" : "Sin iconos"}
									</StandardButton>
									<StandardButton
										size="sm"
										colorScheme={demoError ? "danger" : "primary"}
										styleType={demoError ? "solid" : "outline"}
										onClick={() => setDemoError(!demoError)}>
										{demoError ? "Error activo" : "Simular error"}
									</StandardButton>
								</div>

								{/* Simular interactive */}
								<div className="flex flex-wrap items-center gap-3 pt-2">
									<StandardButton
										size="sm"
										colorScheme="accent"
										onClick={() => {
											setDemoStepIndex(0);
											setSimulatingInteractive(true);
										}}
										disabled={simulatingInteractive}>
										{simulatingInteractive ? "Simulando…" : "▶ Simular flujo completo"}
									</StandardButton>
									{simulatingInteractive && (
										<StandardButton
											size="sm"
											colorScheme="danger"
											styleType="outline"
											onClick={() => setSimulatingInteractive(false)}>
											⏹ Detener
										</StandardButton>
									)}
									{simulatingInteractive && (
										<StandardBadge colorScheme="primary" size="sm" styleType="solid">
											Paso {demoStepIndex + 1} de {totalInteractiveSteps}
										</StandardBadge>
									)}
								</div>

							{/* Preview */}
								<div className="mt-8 pt-8 border-t border-dashed">
									{demoOrientation === "horizontal" ? (
										<StandardStepper
											steps={interactiveSteps}
											currentStepIndex={Math.min(demoStepIndex, totalInteractiveSteps - 1)}
											variant={demoVariant}
											orientation="horizontal"
										/>
									) : (
										<div className="max-w-md mx-auto">
											<StandardStepper
												steps={interactiveSteps}
												currentStepIndex={Math.min(demoStepIndex, totalInteractiveSteps - 1)}
												variant={demoVariant}
												orientation="vertical"
											/>
										</div>
									)}
								</div>

								{/* State badges summary */}
								<div className="flex flex-wrap gap-4 justify-center pt-4">
									{interactiveSteps.map((step, i) => (
										<StandardBadge
											key={step.id}
											colorScheme={
												i < demoStepIndex ? "success" :
												i === demoStepIndex ?
													(step.status === "error" ? "danger" : "primary") :
												"neutral"
											}
											size="sm"
											leftIcon={
												i < demoStepIndex ? CheckCircle2 :
												i === demoStepIndex ? Loader2 :
												undefined
											}>
											{step.label}
										</StandardBadge>
									))}
								</div>
							</motion.section>
						</StandardTabsContent>
					)}

					{/* ════════════════ TAB: VARIANTES ════════════════ */}
					{activeTab === "variants" && (
						<StandardTabsContent forceMount value="variants" asChild>
							<motion.section
								key="variants"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-10">
								{/* Horizontal */}
								<motion.div variants={itemVariants}>
									<StandardText
										asElement="h3"
										size="lg"
										weight="medium"
										className="mb-4 border-b pb-2">
										Horizontal — Todas las variantes
									</StandardText>
									<div className="space-y-8">
										{variantOptions.map((v) => (
											<div
												key={v}
												className="p-4 rounded-lg border bg-neutral-bg dark:bg-neutral-bgDark">
												<StandardText
													size="sm"
													weight="semibold"
													colorScheme="neutral"
													colorShade="textShade"
													className="mb-3 capitalize">
													Variante: {v}
												</StandardText>
												<StandardStepper
													steps={defaultSteps}
													currentStepIndex={2}
													variant={v}
													orientation="horizontal"
												/>
											</div>
										))}
									</div>
								</motion.div>

								{/* Vertical */}
								<motion.div variants={itemVariants}>
									<StandardText
										asElement="h3"
										size="lg"
										weight="medium"
										className="mb-4 border-b pb-2">
										Vertical — Todas las variantes
									</StandardText>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
										{variantOptions.map((v) => (
											<div
												key={`vert-${v}`}
												className="p-4 rounded-lg border bg-neutral-bg dark:bg-neutral-bgDark">
												<StandardText
													size="sm"
													weight="semibold"
													colorScheme="neutral"
													colorShade="textShade"
													className="mb-3 capitalize">
													Variante: {v}
												</StandardText>
												<StandardStepper
													steps={defaultSteps}
													currentStepIndex={2}
													variant={v}
													orientation="vertical"
												/>
											</div>
										))}
									</div>
								</motion.div>
							</motion.section>
						</StandardTabsContent>
					)}

					{/* ════════════════ TAB: ESTADOS ════════════════ */}
					{activeTab === "states" && (
						<StandardTabsContent forceMount value="states" asChild>
							<motion.section
								key="states"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-10">
								{/* Flujo completo */}
								<motion.div variants={itemVariants}>
									<StandardText
										asElement="h3"
										size="lg"
										weight="medium"
										className="mb-2 border-b pb-2">
										Flujo completo: completed → active → pending
									</StandardText>
									<StandardText
										size="sm"
										colorScheme="neutral"
										colorShade="textShade"
										className="mb-4">
										Pasos 1-2 completados, paso 3 activo (con animación de
										respiración), pasos 4-6 pendientes.
									</StandardText>
									<div className="p-6 rounded-lg border bg-neutral-bg dark:bg-neutral-bgDark">
										<SimulableStepper
											steps={[
												{ id: 1, label: "Requisitos", description: "Definir alcance", status: "completed" },
												{ id: 2, label: "Diseño", description: "Arquitectura", status: "completed" },
												{ id: 3, label: "Desarrollo", description: "Implementando…", status: "active" },
												{ id: 4, label: "Testing", status: "pending" },
												{ id: 5, label: "QA", status: "pending" },
												{ id: 6, label: "Deploy", description: "Producción", status: "pending" },
											]}
											variant="primary"
											orientation="horizontal"
										/>
									</div>
								</motion.div>

								{/* Error state */}
								<motion.div variants={itemVariants}>
									<StandardText
										asElement="h3"
										size="lg"
										weight="medium"
										className="mb-2 border-b pb-2">
										Estado de error
									</StandardText>
									<StandardText
										size="sm"
										colorScheme="neutral"
										colorShade="textShade"
										className="mb-4">
										Paso 2 en error con anillo rojo y descripción del problema.
									</StandardText>
									<div className="p-6 rounded-lg border bg-neutral-bg dark:bg-neutral-bgDark">
										<SimulableStepper
											steps={stepsWithError}
											variant="primary"
											orientation="horizontal"
											stopAtStep={1}
										/>
									</div>
								</motion.div>

								{/* onStepClick navigable */}
								<motion.div variants={itemVariants}>
									<StandardText
										asElement="h3"
										size="lg"
										weight="medium"
										className="mb-2 border-b pb-2">
										Navegación hacia atrás (onStepClick)
									</StandardText>
									<StandardText
										size="sm"
										colorScheme="neutral"
										colorShade="textShade"
										className="mb-4">
										Los pasos completados son clickeables. Haz clic en &laquo;Paso
										1&raquo; o &laquo;Paso 2&raquo; para volver. Paso actual:{' '}
										{navStepIndex + 1}
									</StandardText>
									<div className="p-6 rounded-lg border bg-neutral-bg dark:bg-neutral-bgDark">
										<StandardStepper
											steps={[
												{ id: 1, label: "Paso 1", status: navStepIndex > 0 ? "completed" : "active" },
												{ id: 2, label: "Paso 2", status: navStepIndex > 1 ? "completed" : navStepIndex === 1 ? "active" : "pending" },
												{ id: 3, label: "Paso 3", status: navStepIndex > 2 ? "completed" : navStepIndex === 2 ? "active" : "pending" },
												{ id: 4, label: "Paso 4", status: navStepIndex > 3 ? "completed" : navStepIndex === 3 ? "active" : "pending" },
											]}
											currentStepIndex={navStepIndex}
											variant="secondary"
											orientation="horizontal"
											onStepClick={(index) => setNavStepIndex(index)}
										/>
									</div>
									<div className="flex gap-2 mt-3">
										<StandardButton
											size="sm"
											onClick={() => setNavStepIndex(Math.max(0, navStepIndex - 1))}
											disabled={navStepIndex === 0}>
											<ChevronLeft className="w-4 h-4 mr-1" /> Anterior
										</StandardButton>
										<StandardButton
											size="sm"
											onClick={() => setNavStepIndex(Math.min(3, navStepIndex + 1))}
											disabled={navStepIndex === 3}>
											Siguiente <ChevronRight className="w-4 h-4 ml-1" />
										</StandardButton>
									</div>
								</motion.div>

								{/* Custom icons */}
								<motion.div variants={itemVariants}>
									<StandardText
										asElement="h3"
										size="lg"
										weight="medium"
										className="mb-2 border-b pb-2">
										Con iconos personalizados
									</StandardText>
									<StandardText
										size="sm"
										colorScheme="neutral"
										colorShade="textShade"
										className="mb-4">
										Cada paso puede mostrar un icono de lucide-react en lugar del
										número.
									</StandardText>
									<div className="p-6 rounded-lg border bg-neutral-bg dark:bg-neutral-bgDark">
										<SimulableStepper
											steps={stepsWithIcons}
											variant="accent"
											orientation="horizontal"
										/>
									</div>
									<div className="mt-4 p-6 rounded-lg border bg-neutral-bg dark:bg-neutral-bgDark">
										<SimulableStepper
											steps={stepsWithIcons}
											variant="accent"
											orientation="vertical"
										/>
									</div>
								</motion.div>

								{/* Edge cases */}
								<motion.div variants={itemVariants}>
									<StandardText
										asElement="h3"
										size="lg"
										weight="medium"
										className="mb-2 border-b pb-2">
										Casos borde
									</StandardText>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="p-6 rounded-lg border bg-neutral-bg dark:bg-neutral-bgDark">
											<StandardText size="sm" weight="semibold" className="mb-3">
												1 solo paso
											</StandardText>
											<StandardStepper
												steps={singleStep}
												currentStepIndex={0}
												variant="primary"
												orientation="horizontal"
											/>
										</div>
										<div className="p-6 rounded-lg border bg-neutral-bg dark:bg-neutral-bgDark">
											<StandardText size="sm" weight="semibold" className="mb-3">
												8 pasos (muchos)
											</StandardText>
											<SimulableStepper
												steps={manySteps}
												variant="neutral"
												orientation="horizontal"
											/>
										</div>
										<div className="md:col-span-2 p-6 rounded-lg border bg-neutral-bg dark:bg-neutral-bgDark">
											<StandardText size="sm" weight="semibold" className="mb-3">
												Etiquetas largas
											</StandardText>
											<StandardStepper
												steps={longLabelSteps}
												currentStepIndex={1}
												variant="secondary"
												orientation="horizontal"
											/>
										</div>
									</div>
								</motion.div>
							</motion.section>
						</StandardTabsContent>
					)}

					{/* ════════════════ TAB: ORIENTACIÓN ════════════════ */}
					{activeTab === "orientation" && (
						<StandardTabsContent forceMount value="orientation" asChild>
							<motion.section
								key="orientation"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-10">
								{/* Side-by-side comparison */}
								<motion.div variants={itemVariants}>
									<StandardText
										asElement="h3"
										size="lg"
										weight="medium"
										className="mb-2 border-b pb-2">
										Horizontal vs Vertical — Mismos pasos
									</StandardText>
									<StandardText
										size="sm"
										colorScheme="neutral"
										colorShade="textShade"
										className="mb-4">
										Comparación lado a lado con exactamente los mismos datos. La
										horizontal usa StandardProgressBar como conector animado; la
										vertical usa línea con transición de color.
									</StandardText>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
										<div className="p-6 rounded-lg border bg-neutral-bg dark:bg-neutral-bgDark">
											<StandardBadge colorScheme="primary" size="sm" className="mb-4">
												Horizontal
											</StandardBadge>
											<SimulableStepper
												steps={[
													{ id: "a", label: "Inicio", description: "Comenzar", status: "completed" },
													{ id: "b", label: "Proceso", description: "En ejecución…", status: "active" },
													{ id: "c", label: "Revisión", description: "Pendiente", status: "pending" },
													{ id: "d", label: "Fin", description: "Resultado", status: "pending" },
												]}
												variant="primary"
												orientation="horizontal"
											/>
										</div>
										<div className="p-6 rounded-lg border bg-neutral-bg dark:bg-neutral-bgDark">
											<StandardBadge colorScheme="secondary" size="sm" className="mb-4">
												Vertical
											</StandardBadge>
											<div className="max-w-sm mx-auto">
												<SimulableStepper
													steps={[
														{ id: "a", label: "Inicio", description: "Comenzar", status: "completed" },
														{ id: "b", label: "Proceso", description: "En ejecución…", status: "active" },
														{ id: "c", label: "Revisión", description: "Pendiente", status: "pending" },
														{ id: "d", label: "Fin", description: "Resultado", status: "pending" },
													]}
													variant="primary"
													orientation="vertical"
												/>
											</div>
										</div>
									</div>
								</motion.div>

								{/* Real use cases */}
								<motion.div variants={itemVariants}>
									<StandardText
										asElement="h3"
										size="lg"
										weight="medium"
										className="mb-2 border-b pb-2">
										Vertical — Casos de uso real
									</StandardText>
									<StandardText
										size="sm"
										colorScheme="neutral"
										colorShade="textShade"
										className="mb-4">
										Ideal para formularios largos, configuraciones paso a paso o
										paneles laterales.
									</StandardText>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
										<div className="p-6 rounded-lg border bg-neutral-bg dark:bg-neutral-bgDark">
											<StandardText size="sm" weight="semibold" className="mb-3">
												Setup de proyecto
											</StandardText>
											<SimulableStepper
												steps={[
													{ id: 1, label: "Crear proyecto", description: "Nombre y stack", status: "completed" },
													{ id: 2, label: "Configurar DB", description: "Conexión Supabase", status: "completed" },
													{ id: 3, label: "Autenticación", description: "Configurar Auth", status: "active" },
													{ id: 4, label: "Desplegar", description: "Vercel deploy", status: "pending" },
												]}
												variant="accent"
												orientation="vertical"
											/>
										</div>
										<div className="p-6 rounded-lg border bg-neutral-bg dark:bg-neutral-bgDark">
											<StandardText size="sm" weight="semibold" className="mb-3">
												Checklist de calidad
											</StandardText>
											<SimulableStepper
												steps={[
													{ id: 1, label: "Linting", description: "Verificar reglas", status: "completed", icon: Check },
													{ id: 2, label: "TypeScript", description: "Compilación", status: "completed", icon: Check },
													{ id: 3, label: "Tests", description: "Unitarios", status: "active", icon: Loader2 },
													{ id: 4, label: "E2E", description: "Cypress", status: "pending" },
													{ id: 5, label: "Build", description: "Producción", status: "pending" },
												]}
												variant="accent"
												orientation="vertical"
											/>
										</div>
									</div>
								</motion.div>
							</motion.section>
						</StandardTabsContent>
					)}
				</AnimatePresence>
			</StandardTabs>
		</div>
	);
}
