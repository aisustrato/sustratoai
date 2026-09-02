// En pages/update-password.tsx o app/update-password/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";

export default function UpdatePasswordPage() {
	const t = useTranslations("auth.updatePassword");
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
						setSessionError(t("invalidLinkError"));
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
					setSessionError(t("invalidLinkError"));
				}
			})
			.catch((err) => {
				console.error("Excepción al verificar sesión:", err);
			});
	}, [code, token, type, t]);

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
		toast.success(t("updatingToast"), {
			description: t("validationsOkToast"),
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
					message: updateError.message || t("passwordUpdateError"),
				});
				toast.error(t("serverErrorToast"), { description: updateError.message });
				return;
			}

			// Éxito: mostrar mensaje y preparar redirección
			setSuccess(true);
			toast.success(t("successToast"), {
				description: t("redirectingToast"),
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
				err instanceof Error ? err.message : t("unexpectedError");
			setError("password", { type: "server", message: errorMessage });
			toast.error(t("unexpectedErrorToast"), { description: errorMessage });
		}
		// Nota: No agregamos finally aquí porque queremos mantener isSubmitting=true
		// hasta que se complete la redirección para evitar que el usuario haga clic nuevamente
	};

	// Handler para envío inválido del formulario
	const onInvalidSubmit = () => {
		console.log("UpdatePassword_OnSubmit (Inválido):", errors);
		toast.error(t("formErrorToast"), {
			description: t("formErrorDescription"),
		});
	};

	return (
		<StandardPageBackground variant="subtle" bubbles={true}>
			<div className="fixed top-4 right-4 z-50">
				<LocaleSwitcher />
			</div>
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
							{t("title")}
						</StandardText>
						<StandardText
							asElement="p"
							colorScheme="neutral"
							className="text-center text-muted-foreground">
							{!success ? t("instructions") : t("successMessage")}
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
									{t("backToResetPassword")}
								</StandardButton>
							</div>
						: !success ?
							<form
								onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
								className="space-y-4">
								<StandardFormField
									label={t("newPasswordLabel")}
									htmlFor="password"
									hint={t("newPasswordHint")}
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
									label={t("confirmPasswordLabel")}
									htmlFor="confirmPassword"
									hint={t("confirmPasswordHint")}
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
									loadingText={t("submittingButton")}
									colorScheme="primary"
									leftIcon={KeyRound}
									className="mt-6"
									disabled={isSubmitting}>
									{t("submitButton")}
								</StandardButton>
							</form>
						:	<div className="text-center py-4 flex flex-col items-center">
								<CheckCircle className="h-16 w-16 text-green-500 mb-4" />
								<StandardText
									colorScheme="positive"
									size="sm"
									className="text-sm">
									{t("successReady")}
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
								{t("backToLogin")}
							</StandardButton>
						</Link>
					</StandardCard.Footer>
				</StandardCard>
			</div>
		</StandardPageBackground>
	);
}
