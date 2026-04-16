// 📍 app/showroom/standard-input/page.tsx
// 🎯 PROPÓSITO: Showroom interactivo del StandardInput v4.3
// 🌸 ONTOLOGÍA: Segunda flor del jardín de componentes SUSTRATO.AI

"use client";

import React, { useState } from "react";
import { StandardInput, type StandardInputSize, type StandardInputVariant } from "@/components/ui/StandardInput";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardSelect, type SelectOption } from "@/components/ui/StandardSelect";
import { StandardCard } from "@/components/ui/StandardCard";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { User, Mail, Lock, Search } from "lucide-react";
import { useTranslations } from "next-intl";

const colorSchemeOptions: SelectOption[] = [
	{ value: "default", label: "Default" },
	{ value: "primary", label: "Primary" },
	{ value: "secondary", label: "Secondary" },
	{ value: "tertiary", label: "Tertiary" },
	{ value: "accent", label: "Accent" },
	{ value: "neutral", label: "Neutral" },
];

const sizeOptions: SelectOption[] = [
	{ value: "sm", label: "Small" },
	{ value: "md", label: "Medium" },
	{ value: "lg", label: "Large" },
];

const iconOptions: SelectOption[] = [
	{ value: "none", label: "Sin icono" },
	{ value: "user", label: "User" },
	{ value: "mail", label: "Mail" },
	{ value: "lock", label: "Lock" },
	{ value: "search", label: "Search" },
];

const typeOptions: SelectOption[] = [
	{ value: "text", label: "Text" },
	{ value: "password", label: "Password" },
	{ value: "email", label: "Email" },
	{ value: "number", label: "Number" },
];

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>> | undefined> = {
	none: undefined, user: User, mail: Mail, lock: Lock, search: Search
};

export default function StandardInputShowroomPage() {
	const t = useTranslations("common");
	
	const [value, setValue] = useState("");
	const [colorScheme, setColorScheme] = useState<StandardInputVariant>("default");
	const [size, setSize] = useState<StandardInputSize>("md");
	const [leadingIcon, setLeadingIcon] = useState("none");
	const [inputType, setInputType] = useState("text");
	const [isDisabled, setIsDisabled] = useState(false);
	const [isReadOnly, setIsReadOnly] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [hasError, setHasError] = useState(false);
	const [hasSuccess, setHasSuccess] = useState(false);
	const [showCharCount, setShowCharCount] = useState(false);
	const [hasClearButton, setHasClearButton] = useState(false);
	const [pulseBorder, setPulseBorder] = useState(false);
	const [pafffMoment, setPafffMoment] = useState(false);
	const [autoDemo, setAutoDemo] = useState(true); // Demo automática del Pafff

	const handleClear = () => setValue("");
	
	// 🪩 DEMO: Pafff automático al 5to carácter (momento de coherencia emergente)
	const shouldShowPafff = autoDemo && value.length >= 5 && !hasError && !hasSuccess;

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			{/* Header */}
			<div className="flex items-center justify-between mb-8">
				<div>
					<StandardText size="3xl" weight="bold" colorScheme="primary">
						StandardInput v4.3
					</StandardText>
					<StandardText size="md" colorScheme="neutral" className="mt-1">
						Efectos SUSTRATO: pulseBorder + pafffMoment 🪩
					</StandardText>
				</div>
				<div className="flex items-center gap-3">
					<LocaleSwitcher />
					<ThemeSwitcher />
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Panel de control */}
				<StandardCard colorScheme="secondary" styleType="subtle" className="lg:col-span-1">
					<StandardCard.Header>
						<StandardText size="lg" weight="semibold">Configuración</StandardText>
					</StandardCard.Header>
					<StandardCard.Content className="space-y-4">
						<div>
							<StandardText size="sm" weight="medium" className="mb-1">ColorScheme</StandardText>
							<StandardSelect
								options={colorSchemeOptions}
								value={colorScheme}
								onChange={(v) => setColorScheme(v as StandardInputVariant)}
							/>
						</div>
						<div>
							<StandardText size="sm" weight="medium" className="mb-1">Size</StandardText>
							<StandardSelect
								options={sizeOptions}
								value={size}
								onChange={(v) => setSize(v as StandardInputSize)}
							/>
						</div>
						<div>
							<StandardText size="sm" weight="medium" className="mb-1">Type</StandardText>
							<StandardSelect
								options={typeOptions}
								value={inputType}
								onChange={(v) => setInputType(v as string)}
							/>
						</div>
						<div>
							<StandardText size="sm" weight="medium" className="mb-1">Leading Icon</StandardText>
							<StandardSelect
								options={iconOptions}
								value={leadingIcon}
								onChange={(v) => setLeadingIcon(v as string)}
							/>
						</div>

						{/* Estados */}
						<div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
							<StandardText size="sm" weight="medium">Estados</StandardText>
							<div className="flex flex-wrap gap-2">
								<StandardButton size="xs" styleType={isDisabled ? "solid" : "outline"} colorScheme="neutral" onClick={() => setIsDisabled(!isDisabled)}>Disabled</StandardButton>
								<StandardButton size="xs" styleType={isReadOnly ? "solid" : "outline"} colorScheme="neutral" onClick={() => setIsReadOnly(!isReadOnly)}>ReadOnly</StandardButton>
								<StandardButton size="xs" styleType={isEditing ? "solid" : "outline"} colorScheme="tertiary" onClick={() => setIsEditing(!isEditing)}>Editing</StandardButton>
							</div>
							<div className="flex flex-wrap gap-2 mt-2">
								<StandardButton size="xs" styleType={hasError ? "solid" : "outline"} colorScheme="danger" onClick={() => { setHasError(!hasError); if (!hasError) setHasSuccess(false); }}>Error</StandardButton>
								<StandardButton size="xs" styleType={hasSuccess ? "solid" : "outline"} colorScheme="success" onClick={() => { setHasSuccess(!hasSuccess); if (!hasSuccess) setHasError(false); }}>Success</StandardButton>
							</div>
							<div className="flex flex-wrap gap-2 mt-2">
								<StandardButton size="xs" styleType={showCharCount ? "solid" : "outline"} colorScheme="accent" onClick={() => setShowCharCount(!showCharCount)}>Char Count</StandardButton>
								<StandardButton size="xs" styleType={hasClearButton ? "solid" : "outline"} colorScheme="accent" onClick={() => setHasClearButton(!hasClearButton)}>Clear Button</StandardButton>
							</div>
						</div>

						{/* Efectos SUSTRATO */}
						<div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
							<StandardText size="sm" weight="medium">Efectos SUSTRATO 🌸</StandardText>
							<div className="flex flex-wrap gap-2">
								<StandardButton size="xs" styleType={pulseBorder ? "solid" : "outline"} colorScheme="primary" onClick={() => { setPulseBorder(!pulseBorder); if (!pulseBorder) setPafffMoment(false); }}>🌊 Pulse Border</StandardButton>
								<StandardButton size="xs" styleType={pafffMoment ? "solid" : "outline"} colorScheme="warning" onClick={() => { setPafffMoment(!pafffMoment); if (!pafffMoment) setPulseBorder(false); }}>🪩 Pafff Moment</StandardButton>
							</div>
							<div className="mt-2">
								<StandardButton size="xs" styleType={autoDemo ? "solid" : "outline"} colorScheme="accent" onClick={() => setAutoDemo(!autoDemo)}>
									✨ Auto-Pafff al 5to char
								</StandardButton>
								{autoDemo && (
									<StandardText size="xs" colorScheme="neutral" className="mt-1 block">
										Escribe 5+ caracteres para ver el momento Pafff 🪩
									</StandardText>
								)}
							</div>
						</div>
					</StandardCard.Content>
				</StandardCard>

				{/* Preview */}
				<StandardCard colorScheme="primary" styleType="subtle" className="lg:col-span-2">
					<StandardCard.Header>
						<StandardText size="lg" weight="semibold">Preview Interactivo</StandardText>
					</StandardCard.Header>
					<StandardCard.Content className="space-y-6">
						<div className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-lg space-y-3">
							{autoDemo && (
								<div className="flex items-center gap-2 text-sm">
									<span className={value.length >= 5 ? "text-amber-500 font-medium" : "text-neutral-400"}>
										{value.length >= 5 ? "🪩 ¡Pafff! Coherencia emergente" : `${value.length}/5 caracteres para Pafff`}
									</span>
								</div>
							)}
							<StandardInput
								placeholder="Escribe algo aquí..."
								value={value}
								onChange={(e) => setValue(e.target.value)}
								colorScheme={colorScheme}
								size={size}
								type={inputType}
								leadingIcon={iconMap[leadingIcon]}
								disabled={isDisabled}
								readOnly={isReadOnly}
								isEditing={isEditing}
								error={hasError ? "Este campo tiene un error" : undefined}
								success={hasSuccess}
								showCharacterCount={showCharCount}
								maxLength={showCharCount ? 100 : undefined}
								onClear={hasClearButton ? handleClear : undefined}
								pulseBorder={pulseBorder}
								pafffMoment={pafffMoment || shouldShowPafff}
							/>
						</div>
						<div className="p-4 bg-neutral-900 rounded-lg text-sm font-mono text-green-400 overflow-x-auto">
							<pre>{`<StandardInput
  colorScheme="${colorScheme}"
  size="${size}"
  type="${inputType}"${leadingIcon !== "none" ? `\n  leadingIcon={${leadingIcon.charAt(0).toUpperCase() + leadingIcon.slice(1)}}` : ""}${isDisabled ? "\n  disabled" : ""}${isReadOnly ? "\n  readOnly" : ""}${isEditing ? "\n  isEditing" : ""}${hasError ? '\n  error="..."' : ""}${hasSuccess ? "\n  success" : ""}${showCharCount ? "\n  showCharacterCount\n  maxLength={100}" : ""}${hasClearButton ? "\n  onClear={handleClear}" : ""}${pulseBorder ? "\n  pulseBorder  // 🌊" : ""}${pafffMoment ? "\n  pafffMoment  // 🪩" : ""}
/>`}</pre>
						</div>
					</StandardCard.Content>
				</StandardCard>
			</div>

			{/* Galería */}
			<StandardCard colorScheme="secondary" styleType="subtle" className="mt-8">
				<StandardCard.Header>
					<StandardText size="lg" weight="semibold">Galería de Estados</StandardText>
				</StandardCard.Header>
				<StandardCard.Content>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<div className="space-y-2">
							<StandardText size="sm" weight="medium">Normal</StandardText>
							<StandardInput placeholder="Input normal" />
						</div>
						<div className="space-y-2">
							<StandardText size="sm" weight="medium">Con icono</StandardText>
							<StandardInput placeholder="Con icono" leadingIcon={Mail} />
						</div>
						<div className="space-y-2">
							<StandardText size="sm" weight="medium">Error</StandardText>
							<StandardInput placeholder="Campo con error" error="Campo requerido" />
						</div>
						<div className="space-y-2">
							<StandardText size="sm" weight="medium">Success</StandardText>
							<StandardInput placeholder="Campo válido" success value="Correcto" />
						</div>
						<div className="space-y-2">
							<StandardText size="sm" weight="medium">Disabled</StandardText>
							<StandardInput placeholder="Deshabilitado" disabled value="No editable" />
						</div>
						<div className="space-y-2">
							<StandardText size="sm" weight="medium">Password</StandardText>
							<StandardInput type="password" placeholder="Contraseña" leadingIcon={Lock} />
						</div>
						<div className="space-y-2">
							<StandardText size="sm" weight="medium">🌊 Pulse Border</StandardText>
							<StandardInput placeholder="Respiración sutil..." pulseBorder />
						</div>
						<div className="space-y-2">
							<StandardText size="sm" weight="medium">🪩 Pafff Moment</StandardText>
							<StandardInput placeholder="Momento coherencia..." pafffMoment />
						</div>
					</div>
				</StandardCard.Content>
			</StandardCard>

			{/* Tamaños */}
			<StandardCard colorScheme="secondary" styleType="subtle" className="mt-8">
				<StandardCard.Header>
					<StandardText size="lg" weight="semibold">Tamaños</StandardText>
				</StandardCard.Header>
				<StandardCard.Content>
					<div className="space-y-4">
						<div className="flex items-center gap-4">
							<StandardText size="sm" className="w-16">sm</StandardText>
							<StandardInput size="sm" placeholder="Small input" leadingIcon={Search} className="flex-1" />
						</div>
						<div className="flex items-center gap-4">
							<StandardText size="sm" className="w-16">md</StandardText>
							<StandardInput size="md" placeholder="Medium input (default)" leadingIcon={Search} className="flex-1" />
						</div>
						<div className="flex items-center gap-4">
							<StandardText size="sm" className="w-16">lg</StandardText>
							<StandardInput size="lg" placeholder="Large input" leadingIcon={Search} className="flex-1" />
						</div>
					</div>
				</StandardCard.Content>
			</StandardCard>

			{/* Footer */}
			<div className="mt-8 text-center">
				<StandardText size="sm" colorScheme="neutral">
					📍 components/ui/StandardInput.tsx | 🎯 Ontología Visual SUSTRATO.AI | 🪩 v4.3
				</StandardText>
			</div>
		</div>
	);
}
