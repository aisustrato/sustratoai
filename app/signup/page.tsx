"use client";

import { useState } from "react";
import Link from "next/link";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import {
	Mail,
	Lock,
	ArrowRight,
	UserPlus,
	Send,
	Users,
	Shield,
} from "lucide-react";
import { toast } from "sonner";
import { SustratoLogoWithFixedText } from "@/components/ui/sustrato-logo-with-fixed-text";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";

export default function SignUpPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name || !email || !message) {
			toast.error("Por favor, completa todos los campos");
			return;
		}

		setLoading(true);

		try {
			// Aquí iría la lógica para enviar el formulario de contacto
			// Por ahora solo simulamos una espera
			await new Promise((resolve) => setTimeout(resolve, 1500));

			toast.success(
				"Tu solicitud ha sido enviada correctamente. Nos pondremos en contacto contigo pronto."
			);
			setName("");
			setEmail("");
			setMessage("");
		} catch (error) {
			console.error("Error al enviar el formulario:", error);
			toast.error(
				"Ocurrió un error al enviar tu solicitud. Por favor, intenta nuevamente."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<StandardPageBackground variant="gradient" bubbles={true}>
			<div className="flex items-center justify-center min-h-screen p-4">
				<StandardCard className="max-w-4xl w-full" accentPlacement="top" colorScheme="primary" styleType="subtle">
					<StandardCard.Header className="space-y-2 text-center">
						<div className="flex justify-center mb-6">
							<SustratoLogoWithFixedText
								size={70}
								variant="vertical"
								speed="slow"
								initialTheme="orange"
							/>
						</div>
						<StandardText
							asElement="h2"
							size="2xl"
							weight="bold"
							colorScheme="primary"
							className="text-center">
							Beta Privada
						</StandardText>
						<StandardText
							asElement="p"
							colorScheme="neutral"
							className="text-center max-w-2xl mx-auto text-muted-foreground">
							Sustrato.ai se encuentra actualmente en fase de beta privada. Si
							estás interesado en participar, por favor déjanos tus datos y nos
							pondremos en contacto contigo.
						</StandardText>
					</StandardCard.Header>

					<StandardCard.Content>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div className="space-y-6">
								<div className="flex items-start gap-4">
									<div className="bg-primary/10 p-3 rounded-full">
										<Shield size={24} className="text-primary" />
									</div>
									<div>
										<StandardText asElement="h3" size="lg" weight="bold" colorScheme="primary">
											Acceso exclusivo
										</StandardText>
										<StandardText
											asElement="p"
											colorScheme="neutral"
											colorShade="subtle"
											className="mt-1">
											Estamos ofreciendo acceso limitado a nuestra plataforma en
											esta etapa inicial para garantizar una experiencia óptima.
										</StandardText>
									</div>
								</div>

								<div className="flex items-start gap-4">
									<div className="bg-primary/10 p-3 rounded-full">
										<Users size={24} className="text-primary" />
									</div>
									<div>
										<StandardText asElement="h3" size="lg" weight="bold" colorScheme="primary">
											Comunidad de pioneros
										</StandardText>
										<StandardText
											asElement="p"
											colorScheme="neutral"
											colorShade="subtle"
											className="mt-1">
											Únete a nuestra comunidad de usuarios pioneros y ayúdanos
											a moldear el futuro de la plataforma con tu valioso
											feedback.
										</StandardText>
									</div>
								</div>

								<StandardCard colorScheme="secondary" styleType="subtle">
									<StandardCard.Content>
										<StandardText
											asElement="h4"
											size="md"
											weight="bold"
											colorScheme="secondary"
											className="mb-2">
											¿Ya tienes una cuenta?
										</StandardText>
										<StandardText
											asElement="p"
											colorScheme="neutral"
											className="mb-4 text-muted-foreground">
											Si ya cuentas con acceso a nuestra beta, puedes iniciar
											sesión con tus credenciales.
										</StandardText>
										<Link href="/login">
											<StandardButton
												styleType="outline"
												colorScheme="secondary"
												className="mt-2"
												rightIcon={ArrowRight}>
												Ir a iniciar sesión
											</StandardButton>
										</Link>
									</StandardCard.Content>
								</StandardCard>
							</div>

							<div>
								<StandardCard styleType="subtle">
									<StandardCard.Header>
										<StandardText asElement="h3" size="lg" weight="bold" colorScheme="primary">
											Solicitar acceso
										</StandardText>
										<StandardText
											asElement="p"
											colorScheme="neutral"
											colorShade="subtle">
											Completa el formulario para solicitar acceso a la beta
											privada.
										</StandardText>
									</StandardCard.Header>

									<StandardCard.Content>
										<form onSubmit={handleSubmit} className="space-y-4">
											<StandardFormField label="Nombre" htmlFor="name">
												<StandardInput
													id="name"
													value={name}
													onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
													placeholder="Tu nombre completo"
													required
												/>
											</StandardFormField>

											<StandardFormField label="Correo electrónico" htmlFor="email">
												<StandardInput
													id="email"
													type="email"
													leadingIcon={Mail}
													value={email}
													onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
													placeholder="tucorreo@ejemplo.com"
													required
												/>
											</StandardFormField>

											<StandardFormField label="Mensaje" htmlFor="message">
												<StandardTextarea
													id="message"
													value={message}
													onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
													placeholder="Cuéntanos por qué estás interesado en participar en nuestra beta"
													required
													rows={4}
												/>
											</StandardFormField>

											<StandardButton
												type="submit"
												fullWidth
												loading={loading}
												loadingText="Enviando solicitud..."
												colorScheme="primary"
												leftIcon={Send}
												className="mt-6">
												Enviar solicitud
											</StandardButton>
										</form>
									</StandardCard.Content>
								</StandardCard>
							</div>
						</div>
					</StandardCard.Content>

					<StandardCard.Footer className="text-center">
						<StandardText
							asElement="p"
							size="sm"
							colorScheme="neutral"
							colorShade="subtle">
							Al enviar este formulario, aceptas recibir comunicaciones
							relacionadas con Sustrato.ai.
						</StandardText>
					</StandardCard.Footer>
				</StandardCard>
			</div>
		</StandardPageBackground>
	);
}
