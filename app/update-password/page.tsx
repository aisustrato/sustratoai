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
import { KeyRound, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StandardSustratoLogoWithFixedText } from "@/components/ui/StandardSustratoLogoWithFixedText";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";

export default function UpdatePasswordPage() {
	const t = useTranslations("auth.updatePassword");
	const [sessionLoading, setSessionLoading] = useState(true); // Para la verificación inicial de sesión
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

	// Evita procesar el enlace dos veces. searchParams.get("code") vuelve a
	// leerse en cada render, y si el `code` desaparece de la URL en algún
	// momento (p. ej. por una navegación/re-render posterior), este efecto
	// re-ejecutaría con code=null — una segunda pasada totalmente redundante
	// (el canje ya se hizo o está en curso) que puede quedar esperando algo
	// que nunca va a pasar y trabar la pantalla en "Verificando tu enlace...".
	// El código PKCE es de un solo uso de todos modos, así que solo tiene
	// sentido intentarlo una vez por carga de página.
	const hasProcessedRef = useRef(false);

	// Verificar la sesión al cargar el componente
	useEffect(() => {
		if (hasProcessedRef.current) {
			console.log(
				"[DEBUG_UPDATE_PW] useEffect re-disparado, IGNORADO por hasProcessedRef (esto confirma que había una segunda pasada redundante)",
			);
			return;
		}
		hasProcessedRef.current = true;

		// 🔍 TEMPORAL: diagnóstico del cuelgue tras clickear el enlace de
		// recuperación — sacar estos logs (y el prefijo DEBUG_UPDATE_PW) una vez
		// resuelto.
		const t0 = Date.now();
		const log = (msg: string, extra?: unknown) =>
			console.log(`[DEBUG_UPDATE_PW +${Date.now() - t0}ms] ${msg}`, extra ?? "");

		log("useEffect montado", { code, token, type });

		const checkSession = async () => {
			try {
				// Flujo PKCE (el que realmente emite el cliente de @supabase/ssr):
				// el enlace del correo trae `?code=...` y hay que canjearlo por una
				// sesión explícitamente. Antes esta página solo sabía leer el
				// formato viejo `?token=&type=recovery`, así que un `code` nunca se
				// canjeaba: getSession() no encontraba sesión y la página quedaba
				// mostrando "Verificando tu enlace..." para terminar en un error
				// de enlace inválido / redirect, sin haber intentado nunca el canje.
				if (code) {
					// Un `code` PKCE es de un solo uso: si YA lo canjeamos con éxito
					// antes en esta misma pestaña, cualquier intento posterior de
					// volver a canjearlo fallará con "código inválido/expirado" aunque
					// la sesión siga siendo perfectamente válida. `hasProcessedRef` no
					// alcanza a cubrir esto porque es un `useRef` en memoria: si por
					// lo que sea el componente se vuelve a montar (o el efecto se
					// re-dispara desde una instancia nueva), el ref arranca de cero.
					// `sessionStorage` sí sobrevive un remount dentro de la misma
					// pestaña, así que lo usamos como memoria de "este code ya está
					// validado" y saltamos derecho a mostrar el formulario sin volver
					// a tocar la red.
					const exchangedKey = `pkce_exchanged_${code}`;
					let alreadyExchanged = false;
					try {
						alreadyExchanged =
							sessionStorage.getItem(exchangedKey) === "success";
					} catch {
						// sessionStorage puede no estar disponible (modo privado, etc.)
						// — si falla, seguimos con el flujo normal de canje.
					}

					if (alreadyExchanged) {
						log(
							"code ya fue canjeado con éxito antes en esta pestaña, no se reintenta",
						);
						setSessionLoading(false);
						return;
					}

					log("hay code, llamando a exchangeCodeForSession...");
					const { data: exchangeData, error: exchangeError } =
						await supabase.auth.exchangeCodeForSession(code);
					log("exchangeCodeForSession resolvió", {
						error: exchangeError,
						hasSession: !!exchangeData?.session,
					});
					if (exchangeError) {
						console.error("Error al canjear el código:", exchangeError);
						toast.error(
							t("invalidLinkError"),
						);
						setSessionError(t("invalidSessionError"));
						setTimeout(() => {
							router.push("/reset-password");
						}, 3000);
						return;
					}
					try {
						sessionStorage.setItem(exchangedKey, "success");
					} catch {
						// No crítico si no se puede persistir: en el peor caso, si el
						// componente se remonta de nuevo, se repite el intento fallido
						// de antes — no empeora la situación previa.
					}
					log("seteando sessionLoading=false");
					setSessionLoading(false);
					return;
				}

				// Formato legado (`?token=&type=recovery`), por si algún enlace
				// viejo sigue circulando.
				if (token && type === "recovery") {
					log("formato legado token+type=recovery detectado");
					setSessionLoading(false);
					return;
				}

				// Sin `code` ni `token`: verificar si ya hay una sesión válida
				// (ej. el usuario recargó la página después de canjear el código).
				log("sin code ni token, llamando a getSession()...");
				const {
					data: { session },
					error: sessionError,
				} = await supabase.auth.getSession();
				log("getSession() resolvió", { hasSession: !!session, sessionError });

				if (sessionError || !session) {
					toast.error(
						t("invalidLinkError"),
					);
					setSessionError(t("invalidSessionError"));
					setTimeout(() => {
						router.push("/reset-password");
					}, 3000);
					return;
				}

				setSessionLoading(false);
			} catch (err) {
				log("EXCEPCIÓN en checkSession", err);
				console.error("Error al verificar sesión:", err);
				setSessionError(
					t("sessionCheckError"),
				);
				setSessionLoading(false);
			}
		};

		checkSession();

		return () => {
			log("useEffect DESMONTADO (cleanup) — si esto se repite en loop, ahí está el problema");
		};
	}, [router, token, type, code, t]);

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
						{sessionLoading ?
							<div className="flex flex-col items-center justify-center py-8">
								<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
								<StandardText>{t("verifyingLink")}</StandardText>
							</div>
						: sessionError ?
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
