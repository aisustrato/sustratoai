//. 📍 app/showroom/standard-input/page.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSelect } from "@/components/ui/StandardSelect";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import {
	StandardTabs,
	StandardTabsContent,
	StandardTabsList,
	StandardTabsTrigger,
} from "@/components/ui/StandardTabs/StandardTabs";
import { AtSign, Lock, User, Mail, HelpCircle } from "lucide-react";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import type { StandardInputSize } from "@/lib/theme/components/standard-input-tokens";
//#endregion ![head]

//#region [def] - 📦 TYPES & CONSTANTS 📦
const colorSchemesForDemo: ColorSchemeVariant[] = [
	"primary",
	"secondary",
	"tertiary",
	"accent",
	"success",
	"warning",
	"danger",
	"neutral",
];
const sizesForDemo: StandardInputSize[] = ["sm", "md", "lg"];
const iconMap = { none: null, user: User, mail: Mail, lock: Lock };
type IconKey = keyof typeof iconMap;
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function StandardInputShowroomPage() {
	//#region [sub] - ✨ STATE MANAGEMENT ✨
	const [activeTab, setActiveTab] = useState("interactive");

	const [demoValue, setDemoValue] = useState("Valor de prueba");
	const [demoColorScheme, setDemoColorScheme] =
		useState<ColorSchemeVariant>("primary");
	const [demoSize, setDemoSize] = useState<StandardInputSize>("md");
	const [demoPlaceholder, setDemoPlaceholder] = useState("Escribe aquí...");
	const [demoLeadingIcon, setDemoLeadingIcon] = useState<IconKey>("none");
	const [demoTrailingIcon, setDemoTrailingIcon] = useState<IconKey>("none");
	const [demoIsDisabled, setDemoIsDisabled] = useState(false);
	const [demoIsReadOnly, setDemoIsReadOnly] = useState(false);
	const [demoIsEditing, setDemoIsEditing] = useState(false);
	const [demoIsSuccess, setDemoIsSuccess] = useState(false);
	const [demoError, setDemoError] = useState("");
	const [demoMaxLength, setDemoMaxLength] = useState(50);
	const [demoShowCharCount, setDemoShowCharCount] = useState(true);
	const [demoType, setDemoType] = useState<"text" | "password">("text");
	//#endregion ![sub]

	//#region [sub] - 🎨 ANIMATION VARIANTS 🎨
	const gridContainerVariants = {
		hidden: { opacity: 0 },
		visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
	};
	const itemVariants = {
		hidden: { opacity: 0, y: 20, scale: 0.95 },
		visible: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: { type: "spring", stiffness: 120, damping: 12 },
		},
	};
	const tabContentVariants = {
		hidden: { opacity: 0, x: -20 },
		visible: {
			opacity: 1,
			x: 0,
			transition: { duration: 0.3, ease: "easeInOut" },
		},
		exit: {
			opacity: 0,
			x: 20,
			transition: { duration: 0.2, ease: "easeInOut" },
		},
	};
	//#endregion ![sub]

	const LeadingIconComponent = iconMap[demoLeadingIcon];
	const TrailingIconComponent = iconMap[demoTrailingIcon];

	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		<div className="container mx-auto py-10 px-4">
			<header className="mb-12 text-center">
				<StandardText
					asElement="h1"
					size="3xl"
					className="mb-3"
					weight="bold"
					colorScheme="primary">
					StandardInput Showroom
				</StandardText>
				<StandardText
					size="lg"
					colorScheme="neutral"
					className="max-w-2xl mx-auto">
					Explora las capacidades y configuraciones del nuevo componente
					StandardInput.
				</StandardText>
				<div className="mt-4">
					<ThemeSwitcher />
				</div>
			</header>

			<StandardTabs
				defaultValue="interactive"
				className="w-full"
				onValueChange={setActiveTab}>
				<StandardTabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-8">
					<StandardTabsTrigger value="interactive">
						Interactivo
					</StandardTabsTrigger>
					<StandardTabsTrigger value="schemes">Esquemas</StandardTabsTrigger>
					<StandardTabsTrigger value="sizes">Tamaños</StandardTabsTrigger>
					<StandardTabsTrigger value="states">Estados</StandardTabsTrigger>
					<StandardTabsTrigger value="icons">Con Iconos</StandardTabsTrigger>
				</StandardTabsList>

				<AnimatePresence mode="wait">
					{activeTab === "interactive" && (
						<StandardTabsContent forceMount value="interactive" asChild>
							<motion.section
								key="interactive"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="space-y-8 p-4 border rounded-lg bg-neutral-bg-subtle dark:bg-neutral-bg-subtle-dark">
								<StandardText size="xl" weight="semibold" className="mb-1">
									Demo Interactivo
								</StandardText>
								<StandardText
									colorScheme="neutral"
									colorShade="textShade"
									className="mb-6">
									Modifica las props para ver los cambios en tiempo real.
								</StandardText>

								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 items-end">
									<div className="space-y-1">
										<StandardText size="sm" weight="medium">
											Color Scheme:
										</StandardText>
										<StandardSelect
											value={demoColorScheme}
											onChange={(val) =>
												setDemoColorScheme(val as ColorSchemeVariant)
											}
											options={colorSchemesForDemo.map((s) => ({
												value: s,
												label: s,
											}))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText size="sm" weight="medium">
											Size:
										</StandardText>
										<StandardSelect
											value={demoSize}
											onChange={(val) => setDemoSize(val as StandardInputSize)}
											options={sizesForDemo.map((s) => ({
												value: s,
												label: s,
											}))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText size="sm" weight="medium">
											Leading Icon:
										</StandardText>
										<StandardSelect
											value={demoLeadingIcon}
											onChange={(val) => setDemoLeadingIcon(val as IconKey)}
											options={Object.keys(iconMap).map((k) => ({
												value: k,
												label: k,
											}))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText size="sm" weight="medium">
											Trailing Icon:
										</StandardText>
										<StandardSelect
											value={demoTrailingIcon}
											onChange={(val) => setDemoTrailingIcon(val as IconKey)}
											options={Object.keys(iconMap).map((k) => ({
												value: k,
												label: k,
											}))}
										/>
									</div>
									<div className="space-y-1">
										<StandardText size="sm" weight="medium">
											Error Message:
										</StandardText>
										<StandardInput
											value={demoError}
											onChange={(e) => setDemoError(e.target.value)}
											placeholder="Texto del error..."
										/>
									</div>
									<div className="space-y-1">
										<StandardText size="sm" weight="medium">
											Placeholder:
										</StandardText>
										<StandardInput
											value={demoPlaceholder}
											onChange={(e) => setDemoPlaceholder(e.target.value)}
										/>
									</div>
								</div>
								<div className="flex flex-wrap gap-3 mb-6">
									<StandardButton
										size="sm"
										styleType={demoIsDisabled ? "solid" : "outline"}
										onClick={() => setDemoIsDisabled(!demoIsDisabled)}>
										Disabled
									</StandardButton>
									<StandardButton
										size="sm"
										styleType={demoIsReadOnly ? "solid" : "outline"}
										onClick={() => setDemoIsReadOnly(!demoIsReadOnly)}>
										Read Only
									</StandardButton>
									<StandardButton
										size="sm"
										styleType={demoIsSuccess ? "solid" : "outline"}
										onClick={() => setDemoIsSuccess(!demoIsSuccess)}>
										Success
									</StandardButton>
									<StandardButton
										size="sm"
										styleType={demoIsEditing ? "solid" : "outline"}
										onClick={() => setDemoIsEditing(!demoIsEditing)}>
										Editing
									</StandardButton>
									<StandardButton
										size="sm"
										styleType={demoShowCharCount ? "solid" : "outline"}
										onClick={() => setDemoShowCharCount(!demoShowCharCount)}>
										Char Count
									</StandardButton>
									<StandardButton
										size="sm"
										styleType={demoType === "password" ? "solid" : "outline"}
										onClick={() =>
											setDemoType(demoType === "text" ? "password" : "text")
										}>
										Type: Password
									</StandardButton>
								</div>

								<div className="p-4 bg-neutral-bg dark:bg-neutral-bg-dark rounded-md">
									<StandardInput
										key={Math.random()}
										value={demoValue}
										onChange={(e) => setDemoValue(e.target.value)}
										onClear={() => setDemoValue("")}
										colorScheme={demoColorScheme}
										size={demoSize}
										placeholder={demoPlaceholder}
										leadingIcon={LeadingIconComponent || undefined}
										trailingIcon={TrailingIconComponent || undefined}
										disabled={demoIsDisabled}
										readOnly={demoIsReadOnly}
										isEditing={demoIsEditing}
										success={demoIsSuccess}
										error={demoError}
										maxLength={demoMaxLength}
										showCharacterCount={demoShowCharCount}
										type={demoType}
										isRequired
									/>
								</div>
							</motion.section>
						</StandardTabsContent>
					)}

					{activeTab === "schemes" && (
						<StandardTabsContent forceMount value="schemes" asChild>
							<motion.section
								key="schemes"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit">
								<motion.div
									className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
									variants={gridContainerVariants}
									initial="hidden"
									animate="visible">
									{colorSchemesForDemo.map((cs) => (
										<motion.div
											key={`scheme-${cs}`}
											variants={itemVariants}
											className="space-y-2">
											<label htmlFor={`input-scheme-${cs}`}>
												<StandardText weight="medium" className="capitalize">
													{cs}
												</StandardText>
											</label>
											<StandardInput
												id={`input-scheme-${cs}`}
												colorScheme={cs}
												placeholder={`Esquema ${cs}`}
											/>
										</motion.div>
									))}
								</motion.div>
							</motion.section>
						</StandardTabsContent>
					)}

					{activeTab === "sizes" && (
						<StandardTabsContent forceMount value="sizes" asChild>
							<motion.section
								key="sizes"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit">
								<motion.div
									className="flex flex-col items-start gap-6"
									variants={gridContainerVariants}
									initial="hidden"
									animate="visible">
									{sizesForDemo.map((s) => (
										<motion.div
											key={`size-${s}`}
											variants={itemVariants}
											className="space-y-2 w-full max-w-sm">
											<label htmlFor={`input-size-${s}`}>
												<StandardText weight="medium" className="uppercase">
													{s}
												</StandardText>
											</label>
											<StandardInput
												id={`input-size-${s}`}
												size={s}
												placeholder={`Tamaño ${s}`}
												leadingIcon={AtSign}
											/>
										</motion.div>
									))}
								</motion.div>
							</motion.section>
						</StandardTabsContent>
					)}

					{activeTab === "states" && (
						<StandardTabsContent forceMount value="states" asChild>
							<motion.section
								key="states"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit">
								<motion.div
									className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
									variants={gridContainerVariants}
									initial="hidden"
									animate="visible">
									<motion.div variants={itemVariants} className="space-y-2">
										<label htmlFor="input-disabled">
											<StandardText>Disabled</StandardText>
										</label>
										<StandardInput
											id="input-disabled"
											placeholder="No se puede editar"
											disabled
										/>
									</motion.div>
									<motion.div variants={itemVariants} className="space-y-2">
										<label htmlFor="input-readonly">
											<StandardText>Read Only</StandardText>
										</label>
										<StandardInput
											id="input-readonly"
											value="Valor de solo lectura"
											readOnly
										/>
									</motion.div>
									<motion.div variants={itemVariants} className="space-y-2">
										<label htmlFor="input-success">
											<StandardText>Success</StandardText>
										</label>
										<StandardInput
											id="input-success"
											value="¡Correcto!"
											success
										/>
									</motion.div>
									<motion.div variants={itemVariants} className="space-y-2">
										<label htmlFor="input-error">
											<StandardText>Error</StandardText>
										</label>
										<StandardInput
											id="input-error"
											value="Algo salió mal"
											error="Este es un mensaje de error."
										/>
									</motion.div>
									<motion.div variants={itemVariants} className="space-y-2">
										<label htmlFor="input-editing">
											<StandardText>Editing</StandardText>
										</label>
										<StandardInput
											id="input-editing"
											value="Modo edición"
											isEditing
										/>
									</motion.div>
									<motion.div variants={itemVariants} className="space-y-2">
										<label htmlFor="input-password">
											<StandardText>Password</StandardText>
										</label>
										<StandardInput
											id="input-password"
											type="password"
											value="secret123"
										/>
									</motion.div>
								</motion.div>
							</motion.section>
						</StandardTabsContent>
					)}

					{activeTab === "icons" && (
						<StandardTabsContent forceMount value="icons" asChild>
							<motion.section
								key="icons"
								variants={tabContentVariants}
								initial="hidden"
								animate="visible"
								exit="exit">
								<motion.div
									className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
									variants={gridContainerVariants}
									initial="hidden"
									animate="visible">
									<motion.div variants={itemVariants} className="space-y-2">
										<label htmlFor="input-leading">
											<StandardText>Leading Icon</StandardText>
										</label>
										<StandardInput
											id="input-leading"
											placeholder="Usuario"
											leadingIcon={User}
										/>
									</motion.div>
									<motion.div variants={itemVariants} className="space-y-2">
										<label htmlFor="input-trailing">
											<StandardText>Trailing Icon</StandardText>
										</label>
										<StandardInput
											id="input-trailing"
											placeholder="Ayuda"
											trailingIcon={HelpCircle}
										/>
									</motion.div>
									<motion.div variants={itemVariants} className="space-y-2">
										<label htmlFor="input-both">
											<StandardText>Ambos Iconos</StandardText>
										</label>
										<StandardInput
											id="input-both"
											placeholder="Email"
											leadingIcon={Mail}
											trailingIcon={Lock}
										/>
									</motion.div>
								</motion.div>
							</motion.section>
						</StandardTabsContent>
					)}
				</AnimatePresence>
			</StandardTabs>
		</div>
	);
	//#endregion ![render]
}
//#endregion ![main]
