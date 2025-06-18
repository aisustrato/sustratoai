"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { SustratoLogoWithFixedText } from "@/components/ui/sustrato-logo-with-fixed-text";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";

export default function ResetPasswordPage() {
	console.log("ResetPasswordPage - Componente cargado");

	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	useEffect(() => {
		console.log("ResetPasswordPage - useEffect ejecutado");
		// Verificar la URL actual
		if (typeof window !== "undefined") {
			console.log("ResetPasswordPage - URL actual:", window.location.href);
			console.log("ResetPasswordPage - Pathname:", window.location.pathname);
		}
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		console.log("ResetPasswordPage - Formulario enviado");

		if (!email) {
			toast.error("Por favor, ingresa tu correo electrónico");
			return;
		}

		setLoading(true);

		try {
			// Aquí iría la lógica para enviar correo de recuperación de contraseña
			// Por ahora sólo simulamos una espera y éxito
			await new Promise((resolve) => setTimeout(resolve, 1500));

			setSent(true);
			toast.success(
				"Se ha enviado un correo con instrucciones para restablecer tu contraseña"
			);
		} catch (error) {
			console.error("Error al enviar correo de recuperación:", error);
			toast.error("Ocurrió un error. Por favor, intenta nuevamente.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<StandardPageBackground variant="subtle" bubbles={true}>
			<div className="flex items-center justify-center min-h-screen p-4">
				<StandardCard className="max-w-md w-full" accentPlacement="top" colorScheme="primary" styleType="filled">
					<StandardCard.Header className="space-y-2 text-center">
						<div className="flex justify-center mb-2">
							<SustratoLogoWithFixedText
								size={50}
								variant="vertical"
								speed="normal"
								initialTheme="green"
							/>
						</div>
						<StandardText
							asElement="h2"
							size="xl"
							weight="bold"
							colorScheme="primary"
							className="text-center mt-4">
							Recuperar contraseña
						</StandardText>
						<StandardText
							asElement="p"
							colorScheme="neutral"
							className="text-center text-muted-foreground">
							{!sent
								? "Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña"
								: "Hemos enviado instrucciones a tu correo electrónico. Sigue los pasos indicados en el mensaje."}
						</StandardText>
					</StandardCard.Header>

					<StandardCard.Content>
						{!sent ? (
							<form onSubmit={handleSubmit} className="space-y-4">
								<StandardFormField label="Correo electrónico" htmlFor="email">
									<StandardInput
										id="email"
										type="email"
										leadingIcon={Mail}
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="tucorreo@ejemplo.com"
										required
									/>
								</StandardFormField>

								<StandardButton
									type="submit"
									fullWidth
									loading={loading}
									loadingText="Enviando instrucciones..."
									colorScheme="primary"
									leftIcon={Send}
									className="mt-6">
									Enviar instrucciones
								</StandardButton>
							</form>
						) : (
							<div className="text-center py-4">
								<div className="bg-primary/10 rounded-lg p-4 mb-6">
									<StandardText colorScheme="primary" size="sm" className="text-sm">
										Revisa tu bandeja de entrada y sigue las instrucciones
										enviadas a <strong>{email}</strong>. Si no encuentras el
										correo, verifica también tu carpeta de spam.
									</StandardText>
								</div>
								<StandardButton
									onClick={() => setSent(false)}
									colorScheme="secondary"
									styleType="outline"
									fullWidth
									className="mb-2">
									Intentar con otro correo
								</StandardButton>
							</div>
						)}
					</StandardCard.Content>

					<StandardCard.Footer className="text-center">
						<Link href="/login">
							<StandardButton
								styleType="ghost"
								leftIcon={ArrowLeft}
								size="sm">
								Volver a inicio de sesión
							</StandardButton>
						</Link>
					</StandardCard.Footer>
				</StandardCard>
			</div>
		</StandardPageBackground>
	);
}
