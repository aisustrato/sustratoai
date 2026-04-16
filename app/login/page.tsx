// app/login/page.tsx
// Versión: 17.2 (Mínimamente Invasiva - Lógica de AuthProvider centralizada - Base corregida)
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { Mail, Lock, LogIn } from "lucide-react";
// MODIFICACIÓN: toast ya no se importa/usa aquí para el flujo principal de signIn, AuthProvider lo maneja.
// Sin embargo, se mantiene por si lo usas para la validación de campos vacíos.
import { toast } from "sonner";
import { StandardSustratoLogoWithFixedText } from "@/components/ui/StandardSustratoLogoWithFixedText";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";

export default function LoginPage() {
	const searchParams = useSearchParams();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	// MODIFICACIÓN: Se obtiene authLoading del provider para deshabilitar el botón si es necesario.
	const {
		signIn,
		user,
		authInitialized,
		authLoading: authProviderLoading,
	} = useAuth();

	// 🔧 DETECCIÓN DE ERRORES DE ENLACE EXPIRADO
	// Detecta parámetros de error en la URL y muestra toast informativo
	useEffect(() => {
		// Leemos los parámetros de error de la URL
		const errorCode = searchParams.get("error_code");
		const errorDescription = searchParams.get("error_description");

		// 🧠 Lógica clave: Si detectamos el error específico de link expirado...
		if (
			errorCode === "otp_expired" ||
			(errorDescription && errorDescription.toLowerCase().includes("expired"))
		) {
			// ...mostramos un toast de error informativo y amigable.
			toast.error("El enlace de recuperación ha expirado", {
				description:
					"Por favor, solicita un nuevo enlace para restablecer tu contraseña.",
				duration: 8000, // Duración extendida para que el usuario pueda leerlo
			});
		}
	}, [searchParams]); // Este efecto se ejecuta cada vez que los parámetros de la URL cambien

	// La lógica de redirección ahora es manejada por AuthProvider

	const handleSubmit = async (e: React.FormEvent) => {
		// Tipo de evento especificado
		e.preventDefault();
		console.log("[LOGIN_PAGE] Iniciando proceso de login");

		if (!email || !password) {
			toast.error("Por favor, completa todos los campos"); // Este toast local para validación de form se mantiene
			return;
		}

		setLoading(true);

		try {
			console.log(`[LOGIN_PAGE] Intentando login con: ${email}`);
			// La función signIn del AuthProvider ahora maneja los toasts de éxito/error de la operación de login.
			const { success, error } = await signIn(email, password);

			if (!success) {
				console.error("[LOGIN_PAGE] ❌ Error CRÍTICO en signIn:", error);
				// Forzamos el toast aquí para asegurar que lo veas
				toast.error("Error de inicio de sesión", {
					description:
						(error as any)?.message ||
						"Credenciales inválidas o error de conexión",
					duration: 5000,
				});
				setLoading(false); // Asegurar que el loading local se quite si el signIn falla
				return;
			}

			console.log(
				"[LOGIN_PAGE] ✅ signIn exitoso! Esperando redirección del AuthProvider...",
			);
			toast.success("¡Bienvenido de vuelta!", {
				description: "Redirigiendo al sistema...",
			});

			// MODIFICACIÓN: AuthProvider se encarga de la redirección principal post-login.
			// La lógica de 'redirectTo' idealmente también debería ser manejada por AuthProvider
			// o coordinada con él si se necesita una lógica de redirección más compleja aquí.
			// Por ahora, se confía en que AuthProvider redirigirá a '/'.
			// const redirectTo = searchParams ? (searchParams.get('redirectTo') || '/') : '/';
			// console.log(`[LOGIN_PAGE] 🔄 Login exitoso, AuthProvider debería redirigir. redirectTo evaluado: ${redirectTo}`);
			// router.push(redirectTo); // Comentado

			// No desactivamos loading aquí si queremos que el loader se mantenga hasta que
			// AuthProvider termine su ciclo y la redirección ocurra.
			// Pero si signIn ya terminó y AuthProvider no pone su authLoading en true inmediatamente,
			// es mejor quitar el loading local.
			// Dado que handleSignIn en AuthProvider pone authLoading=true, el loading del botón se puede quitar aquí.
			setLoading(false);
		} catch (err) {
			let errorMessage = "Ocurrió un error inesperado.";
			if (err instanceof Error) {
				errorMessage = err.message;
			}
			console.error("Error en el inicio de sesión:", errorMessage);
			// MODIFICACIÓN: AuthProvider debería capturar y manejar errores de Supabase. Este catch es un fallback.
			// toast.error(err.message || "Error inesperado al iniciar sesión"); // Comentado
			setLoading(false);
		}
	};

	// El JSX de "Ya has iniciado sesión" se mantiene, pero AuthProvider debería
	// redirigir antes de que esto se muestre de forma prolongada.
	if (authInitialized && user) {
		return (
			<StandardPageBackground variant="gradient">
				<div className="flex items-center justify-center min-h-screen p-4">
					<div className="text-center">
						<StandardSustratoLogoWithFixedText
							size={60}
							variant="vertical"
							speed="fast"
							initialTheme="blue"
						/>
						<StandardText
							preset="heading"
							colorScheme="primary"
							className="mt-4">
							Ya has iniciado sesión
						</StandardText>
						<StandardText preset="body" colorScheme="neutral" className="mt-2">
							Redirigiendo a tu página...
						</StandardText>
					</div>
				</div>
			</StandardPageBackground>
		);
	}

	return (
		<StandardPageBackground variant="gradient">
			<div className="flex items-center justify-center min-h-screen p-4">
				<StandardCard
					className="max-w-4xl w-full"
					accentPlacement="top"
					colorScheme="primary">
					<StandardCard.Content className="p-0">
						<div className="grid grid-cols-1 md:grid-cols-2">
							{/* Columna izquierda con imagen/información */}
							<div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-8 hidden md:flex md:flex-col md:justify-center rounded-l-lg">
								<div className="flex justify-center mb-6">
									<StandardSustratoLogoWithFixedText
										size={80}
										variant="vertical"
										speed="fast"
										initialTheme="blue"
									/>
								</div>

								<div className="space-y-4 mt-8">
									<div className="bg-white/30 dark:bg-gray-800/30 p-4 rounded-lg">
										<StandardText
											asElement="h3"
											size="lg"
											weight="semibold"
											colorScheme="tertiary"
											className="mb-2">
											Investigación Cualitativa Aumentada
										</StandardText>
										<StandardText asElement="p" colorScheme="neutral" size="sm">
											Potencia tu análisis cualitativo con nuestra plataforma
											que combina el rigor académico con la innovación
											tecnológica. Diseñada por humanistas, para humanistas.
										</StandardText>
									</div>

									<div className="bg-white/30 dark:bg-gray-800/30 p-4 rounded-lg">
										<StandardText
											asElement="p"
											colorScheme="neutral"
											size="sm"
											className="italic">
											&quot;No buscamos reemplazar el pensamiento crítico, sino
											expandir su alcance a través de la co-creación entre la
											perspectiva humana y las capacidades de la IA.&quot;
										</StandardText>
									</div>
								</div>
							</div>

							{/* Columna derecha con formulario */}
							<div className="p-8">
								<div className="mb-6 md:hidden flex flex-col items-center">
									<StandardSustratoLogoWithFixedText
										size={50}
										variant="vertical"
										speed="normal"
										initialTheme="orange"
									/>
								</div>

								<StandardText
									asElement="h1"
									size="xl"
									weight="bold"
									colorScheme="primary"
									className="mb-2">
									Inicio de sesión
								</StandardText>
								<StandardText
									asElement="p"
									size="base"
									colorScheme="neutral"
									colorShade="text"
									className="mb-6">
									Ingresa tus credenciales para acceder a la plataforma
								</StandardText>

								<form onSubmit={handleSubmit} className="space-y-4">
									<StandardFormField label="Correo electrónico" htmlFor="email">
										<StandardInput
											id="email"
											type="email"
											leadingIcon={Mail} // Manteniendo tu prop
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="tucorreo@ejemplo.com"
											required
											disabled={loading || authProviderLoading} // Añadido authProviderLoading
										/>
									</StandardFormField>

									<StandardFormField label="Contraseña" htmlFor="password">
										<StandardInput
											id="password"
											type="password"
											leadingIcon={Lock} // Manteniendo tu prop
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											placeholder="Tu contraseña"
											required
											disabled={loading || authProviderLoading} // Añadido authProviderLoading
										/>
									</StandardFormField>

									<div className="flex justify-end">
										<Link
											href="/reset-password"
											className="text-primary text-sm hover:underline"
											onClick={() => {
												console.log(
													"Clic en enlace de recuperación de contraseña - Navegando a /reset-password",
												);
											}}>
											¿Olvidaste tu contraseña?
										</Link>
									</div>

									<div className="pt-2">
										<StandardButton
											type="submit"
											fullWidth
											loading={loading}
											loadingText="Iniciando sesión..."
											colorScheme="primary"
											leftIcon={LogIn} // Pass component reference
											disabled={loading || authProviderLoading}>
											Iniciar sesión
										</StandardButton>
									</div>

									<div className="flex items-center justify-center mt-6">
										<div className="text-sm text-neutral-600 dark:text-neutral-400">
											¿No tienes una cuenta?{" "}
											<Link
												href="/signup"
												className="text-primary hover:underline font-medium">
												Solicita acceso
											</Link>
										</div>
									</div>
								</form>
							</div>
						</div>
					</StandardCard.Content>
				</StandardCard>
			</div>
		</StandardPageBackground>
	);
}
