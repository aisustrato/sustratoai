// 📍 app/showroom/form/page.tsx
// 🎯 PROPÓSITO: Showroom de formulario completo con los 4 componentes SUSTRATO
// 🌸 ONTOLOGÍA: Input + Textarea + Select + Button en armonía

"use client";

import React, { useState, useMemo } from "react";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardSelect, type SelectOption } from "@/components/ui/StandardSelect";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { User, Mail, FileText, Send, Sparkles } from "lucide-react";

const categoryOptions: SelectOption[] = [
	{ value: "feedback", label: "💬 Feedback" },
	{ value: "bug", label: "🐛 Bug Report" },
	{ value: "feature", label: "✨ Feature Request" },
	{ value: "question", label: "❓ Question" },
	{ value: "other", label: "📝 Other" },
];

const priorityOptions: SelectOption[] = [
	{ value: "low", label: "🟢 Low" },
	{ value: "medium", label: "🟡 Medium" },
	{ value: "high", label: "🔴 High" },
];

export default function FormShowroomPage() {
	// Form state
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [category, setCategory] = useState<string | string[] | undefined>(undefined);
	const [priority, setPriority] = useState<string | string[] | undefined>(undefined);
	const [message, setMessage] = useState("");
	
	// Validation state
	const [submitted, setSubmitted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	
	// 🪩 Pafff moments - detectar coherencia
	const nameCoherent = name.length >= 3;
	const emailCoherent = email.includes("@") && email.includes(".");
	const messageCoherent = message.length >= 10; // Coincidir con validación mínima
	const priorityCoherent = !!priority;
	const formCoherent = nameCoherent && emailCoherent && !!category && messageCoherent;

	// Validation
	const nameError = submitted && !name ? "El nombre es requerido" : undefined;
	// Email: error en tiempo real si tiene contenido pero no es válido
	const emailError = submitted && !email ? "El email es requerido" : 
					   email.length > 0 && !emailCoherent ? "Email inválido" : undefined;
	const categoryError = submitted && !category ? "Selecciona una categoría" : undefined;
	const messageError = submitted && !message ? "El mensaje es requerido" : 
						 submitted && message.length < 10 ? "Mínimo 10 caracteres" : undefined;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitted(true);
		
		if (!name || !email || !category || !message || message.length < 10) {
			return;
		}
		
		setIsSubmitting(true);
		
		// Simular envío
		await new Promise(resolve => setTimeout(resolve, 1500));
		
		setIsSubmitting(false);
		alert("🌊 ¡Formulario enviado! Gracias por tu mensaje.");
		
		// Reset
		setName("");
		setEmail("");
		setCategory(undefined);
		setPriority(undefined);
		setMessage("");
		setSubmitted(false);
	};

	const handleReset = () => {
		setName("");
		setEmail("");
		setCategory(undefined);
		setPriority(undefined);
		setMessage("");
		setSubmitted(false);
	};

	// Progress indicator
	const progress = useMemo(() => {
		let count = 0;
		if (nameCoherent) count++;
		if (emailCoherent) count++;
		if (category) count++;
		if (messageCoherent) count++;
		return count;
	}, [nameCoherent, emailCoherent, category, messageCoherent, priorityCoherent]);

	return (
		<div className="container mx-auto py-8 px-4 max-w-4xl">
			{/* Header */}
			<div className="flex items-center justify-between mb-8">
				<div>
					<StandardText size="3xl" weight="bold" colorScheme="primary">
						Showroom Form 🌸
					</StandardText>
					<StandardText size="md" colorScheme="neutral" className="mt-1">
						Button + Input + Textarea + Select en armonía
					</StandardText>
				</div>
				<div className="flex items-center gap-3">
					<LocaleSwitcher />
					<ThemeSwitcher />
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Form */}
				<StandardCard colorScheme="primary" styleType="subtle" className="lg:col-span-2">
					<StandardCard.Header>
						<div className="flex items-center justify-between">
							<StandardText size="lg" weight="semibold">
								<Sparkles className="inline w-5 h-5 mr-2" />
								Formulario de Contacto
							</StandardText>
							<div className="flex items-center gap-2">
								<div className="flex gap-1">
									{[1, 2, 3, 4].map((i) => (
										<div 
											key={i}
											className={`w-2 h-2 rounded-full transition-all duration-300 ${
												i <= progress 
													? "bg-primary-500 scale-110" 
													: "bg-neutral-300 dark:bg-neutral-600"
											}`}
										/>
									))}
								</div>
								<StandardText size="xs" colorScheme="neutral">
									{progress}/4
								</StandardText>
							</div>
						</div>
					</StandardCard.Header>
					<StandardCard.Content>
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Row 1: Name + Email */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<StandardText size="sm" weight="medium">Nombre *</StandardText>
									<StandardInput
										placeholder="Tu nombre"
										value={name}
										onChange={(e) => setName(e.target.value)}
										leadingIcon={User}
										error={nameError}
										success={nameCoherent && !nameError}
										pafffMoment={nameCoherent && !nameError && !submitted}
									/>
								</div>
								<div className="space-y-1.5">
									<StandardText size="sm" weight="medium">Email *</StandardText>
									<StandardInput
										type="email"
										placeholder="tu@email.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										leadingIcon={Mail}
										error={emailError}
										success={emailCoherent && !emailError}
										pafffMoment={emailCoherent && !emailError && !submitted}
									/>
								</div>
							</div>

							{/* Row 2: Category + Priority */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<StandardText size="sm" weight="medium">Categoría *</StandardText>
									<StandardSelect
										options={categoryOptions}
										value={category}
										onChange={(v) => setCategory(v)}
										placeholder="Selecciona categoría"
										error={categoryError}
										success={!!category && !categoryError}
										pafffMoment={!!category && !categoryError && !submitted}
									/>
								</div>
								<div className="space-y-1.5">
									<StandardText size="sm" weight="medium">Prioridad</StandardText>
									<StandardSelect
										options={priorityOptions}
										value={priority}
										onChange={(v) => setPriority(v)}
										placeholder="Selecciona prioridad"
										pulseBorder={!priority}
									/>
								</div>
							</div>

							{/* Row 3: Message */}
							<div className="space-y-1.5">
								<StandardText size="sm" weight="medium">Mensaje *</StandardText>
								<StandardTextarea
									placeholder="Cuéntanos más detalles..."
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									error={messageError}
									success={messageCoherent && !messageError}
									pafffMoment={messageCoherent && !messageError && !submitted}
									showCharacterCount
									maxLength={500}
									rows={4}
								/>
							</div>

							{/* Actions */}
							<div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
								<StandardButton
									type="button"
									styleType="ghost"
									colorScheme="neutral"
									onClick={handleReset}
								>
									Limpiar
								</StandardButton>
								<div className="flex gap-3">
									<StandardButton
										type="submit"
										styleType="solid"
										colorScheme="primary"
										disabled={isSubmitting}
										loading={isSubmitting}
										breathing={formCoherent && !isSubmitting}
										rightIcon={Send}
									>
										{isSubmitting ? "Enviando..." : "Enviar"}
									</StandardButton>
								</div>
							</div>
						</form>
					</StandardCard.Content>
				</StandardCard>

				{/* Info Panel */}
				<StandardCard colorScheme="secondary" styleType="subtle">
					<StandardCard.Header>
						<StandardText size="lg" weight="semibold">
							<FileText className="inline w-5 h-5 mr-2" />
							Efectos SUSTRATO
						</StandardText>
					</StandardCard.Header>
					<StandardCard.Content className="space-y-4">
						<div className="space-y-3">
							<div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
								<StandardText size="sm" weight="semibold" className="mb-1">🪩 Pafff Moment</StandardText>
								<StandardText size="xs" colorScheme="neutral">
									Cuando un campo alcanza coherencia, el borde respira suavemente indicando que el input es válido.
								</StandardText>
							</div>
							<div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
								<StandardText size="sm" weight="semibold" className="mb-1">🌊 Pulse Border</StandardText>
								<StandardText size="xs" colorScheme="neutral">
									Campos opcionales que esperan input pulsan suavemente para indicar que están disponibles.
								</StandardText>
							</div>
							<div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
								<StandardText size="sm" weight="semibold" className="mb-1">💨 Breathe Button</StandardText>
								<StandardText size="xs" colorScheme="neutral">
									Cuando el formulario está completo, el botón respira indicando que está listo para enviar.
								</StandardText>
							</div>
						</div>

						<div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
							<StandardText size="sm" weight="medium" className="mb-2">Estado actual:</StandardText>
							<div className="space-y-1.5">
								<div className="flex items-center gap-2">
									<div className={`w-2 h-2 rounded-full ${nameCoherent ? "bg-green-500" : "bg-neutral-300"}`} />
									<StandardText size="xs">Nombre {nameCoherent ? "✓" : "pendiente"}</StandardText>
								</div>
								<div className="flex items-center gap-2">
									<div className={`w-2 h-2 rounded-full ${emailCoherent ? "bg-green-500" : "bg-neutral-300"}`} />
									<StandardText size="xs">Email {emailCoherent ? "✓" : "pendiente"}</StandardText>
								</div>
								<div className="flex items-center gap-2">
									<div className={`w-2 h-2 rounded-full ${category ? "bg-green-500" : "bg-neutral-300"}`} />
									<StandardText size="xs">Categoría {category ? "✓" : "pendiente"}</StandardText>
								</div>
								<div className="flex items-center gap-2">
									<div className={`w-2 h-2 rounded-full ${priorityCoherent ? "bg-green-500" : "bg-neutral-300"}`} />
									<StandardText size="xs">Prioridad {priorityCoherent ? "✓" : "(opcional)"}</StandardText>
								</div>
								<div className="flex items-center gap-2">
									<div className={`w-2 h-2 rounded-full ${messageCoherent ? "bg-green-500" : "bg-neutral-300"}`} />
									<StandardText size="xs">Mensaje {messageCoherent ? "✓" : `${message.length}/10`}</StandardText>
								</div>
							</div>
						</div>
					</StandardCard.Content>
				</StandardCard>
			</div>

			{/* Footer */}
			<div className="mt-8 text-center">
				<StandardText size="sm" colorScheme="neutral">
					📍 Showroom Form | 🎯 Button + Input + Textarea + Select | 🌊🏄🏽 SUSTRATO.AI
				</StandardText>
			</div>
		</div>
	);
}
