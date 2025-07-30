// En pages/update-password.tsx o app/update-password/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePasswordSchema, type UpdatePasswordFormValues } from "./schema";
import { supabase } from "@/lib/supabase";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { KeyRound, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SustratoLogoWithFixedText } from "@/components/ui/sustrato-logo-with-fixed-text";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";

export default function UpdatePasswordPage() {
	const [sessionLoading, setSessionLoading] = useState(true); // Para la verificación inicial de sesión
	const [success, setSuccess] = useState(false);
	const [sessionError, setSessionError] = useState<string | null>(null);
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get('token');
	const type = searchParams.get('type');

	// Configuración del formulario con react-hook-form y Zod
	const {
		handleSubmit,
		formState: { errors, isSubmitting, touchedFields, dirtyFields },
		control,
		setError,
	} = useForm<UpdatePasswordFormValues>({
		resolver: zodResolver(updatePasswordSchema),
		mode: "onBlur",
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
	});

	// Verificar la sesión al cargar el componente
	useEffect(() => {
		const checkSession = async () => {
			try {
				// Verificar si hay un token en la URL (para el flujo de recuperación de contraseña)
				if (token && type === 'recovery') {
					setSessionLoading(false);
					return;
				}

				// Si no hay token, verificar si ya hay una sesión válida
				const { data: { session }, error: sessionError } = await supabase.auth.getSession();
				
				if (sessionError || !session) {
					toast.error("Enlace inválido o expirado. Por favor, solicita un nuevo enlace de recuperación.");
					setSessionError("Sesión inválida o expirada");
					setTimeout(() => {
						router.push('/reset-password');
					}, 3000);
					return;
				}

				setSessionLoading(false);
			} catch (err) {
				console.error("Error al verificar sesión:", err);
				setSessionError("Error al verificar la sesión. Por favor, intenta de nuevo.");
				setSessionLoading(false);
			}
		};

		checkSession();
	}, [router, token, type]);

	// Función para obtener el estado de éxito de un campo
	const getSuccessState = (fieldName: keyof UpdatePasswordFormValues): boolean => {
		if (errors[fieldName] || (!touchedFields[fieldName] && !dirtyFields[fieldName])) {
			return false;
		}
		return true;
	};

	// Handler para envío válido del formulario
	const onValidSubmit: SubmitHandler<UpdatePasswordFormValues> = async (data) => {
		console.log("UpdatePassword_OnSubmit (Válido):", { password: "[HIDDEN]" });
		toast.success("Actualizando contraseña...", { description: "Validaciones exitosas." });

		try {
			// Actualizar la contraseña en Supabase
			const { error: updateError } = await supabase.auth.updateUser({
				password: data.password,
			});

			if (updateError) {
				// Si hay error de servidor, mostrarlo en el campo de contraseña
				setError("password", { 
					type: "server", 
					message: updateError.message || "Error al actualizar la contraseña" 
				});
				toast.error("Error del servidor", { description: updateError.message });
				return;
			}

			// Éxito: mostrar mensaje y preparar redirección
			setSuccess(true);
			toast.success("¡Contraseña actualizada con éxito!", { 
				description: "Redirigiendo al inicio de sesión..." 
			});

			// Cerrar sesión después de actualizar la contraseña
			await supabase.auth.signOut();

			// Redirigir al login después de un breve delay
			setTimeout(() => {
				router.push("/login?password_updated=true");
			}, 1500);

		} catch (err: any) {
			console.error("Error al actualizar la contraseña:", err);
			const errorMessage = err.message || "Ocurrió un error inesperado.";
			setError("password", { type: "server", message: errorMessage });
			toast.error("Error inesperado", { description: errorMessage });
		}
		// Nota: No agregamos finally aquí porque queremos mantener isSubmitting=true
		// hasta que se complete la redirección para evitar que el usuario haga clic nuevamente
	};

	// Handler para envío inválido del formulario
	const onInvalidSubmit = () => {
		console.log("UpdatePassword_OnSubmit (Inválido):", errors);
		toast.error("El formulario tiene errores.", { 
			description: "Por favor, revisa los campos marcados." 
		});
	};

	return (
		<StandardPageBackground variant="subtle" bubbles={true}>
			<div className="flex items-center justify-center min-h-screen p-4">
				<StandardCard
					className="max-w-md w-full"
					accentPlacement="top"
					colorScheme="primary"
					styleType="filled">
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
							Crear nueva contraseña
						</StandardText>
						<StandardText
							asElement="p"
							colorScheme="neutral"
							className="text-center text-muted-foreground">
							{!success
								? "Ingresa tu nueva contraseña. Debe cumplir con los requisitos de seguridad."
								: "Contraseña actualizada. Serás redirigido al inicio de sesión."}
						</StandardText>
					</StandardCard.Header>

					<StandardCard.Content>
						{sessionLoading ? (
							<div className="flex flex-col items-center justify-center py-8">
								<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
								<StandardText>Verificando tu enlace...</StandardText>
							</div>
						) : sessionError ? (
							<div className="text-center py-6 space-y-4">
								<StandardText colorScheme="destructive" className="mb-4">
									{sessionError}
								</StandardText>
								<StandardButton
									onClick={() => window.location.href = '/reset-password'}
									leftIcon={ArrowLeft}
									colorScheme="primary"
								>
									Volver a recuperar contraseña
								</StandardButton>
							</div>
						) : !success ? (
							<form onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} className="space-y-4">
								<StandardFormField
									label="Nueva contraseña"
									htmlFor="password"
									hint="Mínimo 8 caracteres, una mayúscula, un número y un símbolo"
									error={errors.password?.message}
									isRequired
								>
									<Controller 
										name="password" 
										control={control} 
										render={({ field, fieldState }) => (
											<StandardInput
												id="password"
												type="password"
												leadingIcon={KeyRound}
												placeholder="••••••••"
												disabled={isSubmitting}
												success={getSuccessState("password")}
												error={fieldState.error?.message}
												{...field}
											/>
										)}
									/>
								</StandardFormField>

								<StandardFormField
									label="Confirmar nueva contraseña"
									htmlFor="confirmPassword"
									hint="Vuelve a escribir la misma contraseña"
									error={errors.confirmPassword?.message}
									isRequired
								>
									<Controller 
										name="confirmPassword" 
										control={control} 
										render={({ field, fieldState }) => (
											<StandardInput
												id="confirmPassword"
												type="password"
												leadingIcon={KeyRound}
												placeholder="••••••••"
												disabled={isSubmitting}
												success={getSuccessState("confirmPassword")}
												error={fieldState.error?.message}
												{...field}
											/>
										)}
									/>
								</StandardFormField>

								<StandardButton
									type="submit"
									fullWidth
									loading={isSubmitting}
									loadingText="Actualizando..."
									colorScheme="primary"
									leftIcon={KeyRound}
									className="mt-6"
									disabled={isSubmitting}
								>
									Actualizar contraseña
								</StandardButton>
							</form>
						) : (
							<div className="text-center py-4 flex flex-col items-center">
								<CheckCircle className="h-16 w-16 text-green-500 mb-4" />
								<StandardText
									colorScheme="positive"
									size="sm"
									className="text-sm">
									¡Todo listo! Tu acceso ha sido restaurado. En breves
									momentos te llevaremos al inicio de sesión.
								</StandardText>
							</div>
						)}
					</StandardCard.Content>

					<StandardCard.Footer className="text-center">
						<Link href="/login">
							<StandardButton
								styleType="ghost"
								leftIcon={ArrowLeft}
								size="sm"
								disabled={isSubmitting}>
								Volver a inicio de sesión
							</StandardButton>
						</Link>
					</StandardCard.Footer>
				</StandardCard>
			</div>
		</StandardPageBackground>
	);
}