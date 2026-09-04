// En pages/update-password.tsx o app/update-password/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
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
import { KeyRound, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { StandardSustratoLogoWithFixedText } from "@/components/ui/StandardSustratoLogoWithFixedText";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";

export default function UpdatePasswordPage() {
	// 🔧 DECISIÓN: el formulario se muestra de inmediato, sin pantalla de
	// "Verificando tu enlace..." bloqueante. El canje del code PKCE corre en
	// segundo plano (ver useEffect abajo) sin que el usuario tenga que
	// esperarlo: si el usuario ve esta página, es porque llegó por un enlace
	// de recuperación real, y para cuando termine de escribir su nueva
	// contraseña el canje casi siempre ya habrá terminado. Si el canje
	// realmente falla, se reemplaza el formulario por un mensaje de error en
	// cuanto ese resultado llega (nunca antes de mostrar el formulario) — y
	// si por lo que sea el canje nunca resuelve (deadlock), la contraseña
	// simplemente fallará al enviarla con un error claro, en vez de dejar al
	// usuario mirando un spinner que nunca se resuelve.
	const [success, setSuccess] = useState(false);
	const [sessionError, setSessionError] = useState<string | null>(null);
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const tokenHash = searchParams.get("token_hash");
	const type = searchParams.get("type");
	const code = searchParams.get("code");

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

	// Evita procesar el enlace dos veces dentro de la misma carga de página
	// (el efecto podría re-dispararse por cambios en las dependencias).
	const hasProcessedRef = useRef(false);

	// Canje del code PKCE en segundo plano. A propósito NO bloquea el
	// renderizado del formulario ni tiene su propio estado de "cargando":
	// se dispara y, si falla, recién ahí se reemplaza el formulario por un
	// error (ver JSX abajo). Si nunca resuelve, el formulario simplemente
	// sigue mostrado y la contraseña fallará al enviarla — nunca queda una
	// pantalla de espera bloqueada indefinidamente.
	useEffect(() => {
		if (hasProcessedRef.current) return;
		hasProcessedRef.current = true;

		if (tokenHash && type) {
			// Camino recomendado por Supabase para links de recuperación por
			// correo: `verifyOtp` con `token_hash` no depende de nada guardado
			// en el navegador (a diferencia del `code` PKCE, que requiere el
			// "code verifier" que Supabase guardó en el localStorage del
			// navegador que pidió el correo — si el link se abre en otro
			// navegador, otra pestaña de incógnito, o ese storage se perdió,
			// el canje PKCE falla con "code verifier vacío" aunque el link sea
			// válido). `token_hash` viaja completo en la URL y Supabase lo
			// valida contra su propio servidor, sin ese requisito.
			const exchangedKey = `otp_verified_${tokenHash}`;
			try {
				if (sessionStorage.getItem(exchangedKey) === "success") return;
			} catch {
				// sessionStorage no disponible (modo privado, etc.) — seguimos.
			}

			supabase.auth
				.verifyOtp({ token_hash: tokenHash, type: type as "recovery" })
				.then(({ error: verifyError }) => {
					if (verifyError) {
						console.error("Error al verificar el token:", verifyError);
						setSessionError(
							"Enlace inválido o expirado. Por favor, solicita un nuevo enlace de recuperación.",
						);
						return;
					}
					try {
						sessionStorage.setItem(exchangedKey, "success");
					} catch {
						// No crítico: en el peor caso se reintenta si hay remount.
					}
				})
				.catch((err) => {
					console.error("Excepción al verificar el token:", err);
				});
			return;
		}

		if (code) {
			// Un `code` PKCE es de un solo uso: si ya lo canjeamos con éxito
			// antes en esta misma pestaña (ej. el componente se volvió a montar),
			// no lo reintentamos — sessionStorage sobrevive un remount dentro de
			// la misma pestaña, a diferencia de un simple useRef.
			const exchangedKey = `pkce_exchanged_${code}`;
			try {
				if (sessionStorage.getItem(exchangedKey) === "success") return;
			} catch {
				// sessionStorage no disponible (modo privado, etc.) — seguimos.
			}

			supabase.auth
				.exchangeCodeForSession(code)
				.then(({ error: exchangeError }) => {
					if (exchangeError) {
						console.error("Error al canjear el código:", exchangeError);
						setSessionError(
							"Enlace inválido o expirado. Por favor, solicita un nuevo enlace de recuperación.",
						);
						return;
					}
					try {
						sessionStorage.setItem(exchangedKey, "success");
					} catch {
						// No crítico: en el peor caso se reintenta si hay remount.
					}
				})
				.catch((err) => {
					console.error("Excepción al canjear el código:", err);
					// No mostramos error aquí a propósito: puede ser un problema de
					// red pasajero. El formulario sigue disponible y, si la sesión
					// nunca quedó lista, el envío de la nueva contraseña fallará con
					// un mensaje claro en vez de dejar al usuario sin nada.
				});
			return;
		}

		if (token && type === "recovery") {
			// Formato legado (`?token=&type=recovery`); no requiere canje propio.
			return;
		}

		// Sin `code` ni `token`: no hay nada que canjear. Verificamos en segundo
		// plano si ya existe una sesión válida (ej. el usuario recargó la
		// página después de canjear el código); si no la hay, recién ahí se
		// muestra el error — el formulario no espera por esto.
		supabase.auth
			.getSession()
			.then(({ data: { session }, error: sessionErr }) => {
				if (sessionErr || !session) {
					setSessionError(
						"Enlace inválido o expirado. Por favor, solicita un nuevo enlace de recuperación.",
					);
				}
			})
			.catch((err) => {
				console.error("Excepción al verificar sesión:", err);
			});
	}, [code, token, tokenHash, type]);

	// Función para obtener el estado de éxito de un campo
	const getSuccessState = (
		fieldName: keyof UpdatePasswordFormValues,
	): boolean => {
		if (
			errors[fieldName] ||
			(!touchedFields[fieldName] && !dirtyFields[fieldName])
		) {
			return false;
		}
		return true;
	};

	// Handler para envío válido del formulario
	const onValidSubmit: SubmitHandler<UpdatePasswordFormValues> = async (
		data,
	) => {
		console.log("UpdatePassword_OnSubmit (Válido):", { password: "[HIDDEN]" });
		toast.success("Actualizando contraseña...", {
			description: "Validaciones exitosas.",
		});

		try {
			// Actualizar la contraseña en Supabase
			const { error: updateError } = await supabase.auth.updateUser({
				password: data.password,
			});

			if (updateError) {
				// Si hay error de servidor, mostrarlo en el campo de contraseña
				setError("password", {
					type: "server",
					message: updateError.message || "Error al actualizar la contraseña",
				});
				toast.error("Error del servidor", { description: updateError.message });
				return;
			}

			// Éxito: mostrar mensaje y preparar redirección
			setSuccess(true);
			toast.success("¡Contraseña actualizada con éxito!", {
				description: "Redirigiendo al inicio de sesión...",
			});

			// Cerrar sesión después de actualizar la contraseña
			await supabase.auth.signOut();

			// Redirigir al login después de un breve delay
			setTimeout(() => {
				router.push("/login?password_updated=true");
			}, 1500);
		} catch (err: unknown) {
			console.error("Error al actualizar la contraseña:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Ocurrió un error inesperado.";
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
			description: "Por favor, revisa los campos marcados.",
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
							<StandardSustratoLogoWithFixedText
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
							{!success ?
								"Ingresa tu nueva contraseña. Debe cumplir con los requisitos de seguridad."
							:	"Contraseña actualizada. Serás redirigido al inicio de sesión."}
						</StandardText>
					</StandardCard.Header>

					<StandardCard.Content>
						{sessionError ?
							<div className="text-center py-6 space-y-4">
								<StandardText colorScheme="destructive" className="mb-4">
									{sessionError}
								</StandardText>
								<StandardButton
									onClick={() => (window.location.href = "/reset-password")}
									leftIcon={ArrowLeft}
									colorScheme="primary">
									Volver a recuperar contraseña
								</StandardButton>
							</div>
						: !success ?
							<form
								onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
								className="space-y-4">
								<StandardFormField
									label="Nueva contraseña"
									htmlFor="password"
									hint="Mínimo 8 caracteres, una mayúscula, un número y un símbolo"
									error={errors.password?.message}
									isRequired>
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
									isRequired>
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
									disabled={isSubmitting}>
									Actualizar contraseña
								</StandardButton>
							</form>
						:	<div className="text-center py-4 flex flex-col items-center">
								<CheckCircle className="h-16 w-16 text-green-500 mb-4" />
								<StandardText
									colorScheme="positive"
									size="sm"
									className="text-sm">
									¡Todo listo! Tu acceso ha sido restaurado. En breves momentos
									te llevaremos al inicio de sesión.
								</StandardText>
							</div>
						}
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
