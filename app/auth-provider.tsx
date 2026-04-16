// app/auth-provider.tsx
// Versión: 10.19 (useEffect de sincronización de UI con dependencias estrictas y refs para funciones externas)
"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useRef,
	useCallback,
	ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
	supabase, // ✅ Importar la instancia Singleton
	signInWithEmail as clientSignIn,
	signUp as clientSignUp,
	signOut as clientSignOut,
} from "@/app/auth/client";
import { User, Session } from "@supabase/supabase-js";
import { type FontTheme } from "@/lib/fonts";
import { type ColorScheme } from "@/lib/theme/ColorToken";
import {
	type SupabaseClient, // Se mantiene por si se usa como tipo en otro lado
} from "@supabase/supabase-js";

import {
	obtenerProyectosConSettingsUsuario,
	actualizarProyectoActivo,
	type UserProjectSetting,
	type ResultadoOperacion,
} from "@/lib/actions/project-dashboard-actions";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { toast } from "sonner";

import { useFontTheme } from "@/app/font-provider";
import { useTheme } from "@/app/theme-provider";

const LOG_PREFIX = "[AUTH_PROVIDER_V10.19]";
const isDev = process.env.NODE_ENV === 'development';
const VERBOSE_LOGS = false; // Cambiar a true solo para debugging profundo

interface AuthContextType {
	supabase: SupabaseClient;
	user: User | null;
	session: Session | null;
	authLoading: boolean;
	authInitialized: boolean;
	proyectoActual: UserProjectSetting | null;
	proyectosDisponibles: UserProjectSetting[];
	loadingProyectos: boolean;
	loadingCambioProyecto: boolean;
	loadingSignOut: boolean;
	seleccionarProyecto: (proyectoId: string) => Promise<void>;
	signIn: (
		email: string,
		password: string
	) => Promise<{ error: unknown | null; success: boolean }>;
	signUp: (
		email: string,
		password: string
	) => Promise<{ error: unknown | null; success: boolean }>;
	logout: () => Promise<void>;
	setProyectoActivoLocal: (proyecto: UserProjectSetting | null) => void;
	setUiThemeLocal: (theme: string | null) => void;
	setUiFontPairLocal: (fontPair: string | null) => void;
	setUiIsDarkModeLocal: (isDark: boolean | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = [
	"/login",
	"/signup",
	"/reset-password",
	"/update-password",
	"/contact",
];
const isPublicPage = (pathname: string | null): boolean => {
	if (!pathname) return false;
	return PUBLIC_PATHS.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`)
	);
};

export function AuthProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();

	// ✅ Ya no se crea un cliente local, se usa el singleton importado.

	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [authLoading, setAuthLoading] = useState(true);
	const [authInitialized, setAuthInitialized] = useState(false);
	const [proyectoActual, setProyectoActual] =
		useState<UserProjectSetting | null>(null);
	const [proyectosDisponibles, setProyectosDisponibles] = useState<
		UserProjectSetting[]
	>([]);
	const [loadingProyectos, setLoadingProyectos] = useState(false);
	const [loadingCambioProyecto, setLoadingCambioProyecto] = useState(false);
	const [loadingSignOut, setLoadingSignOut] = useState(false);

	const userRef = useRef(user);
	const proyectoActualRef = useRef(proyectoActual);
	const authInitializedRef = useRef(authInitialized);
	const authLoadingRef = useRef(authLoading);
	const initialLoadAttemptedRef = useRef(false);
	const configAppliedForProjectId = useRef<string | null>(null);
	const signedInProcessedRef = useRef(false);
	const welcomeToastShownRef = useRef(false);
	const authLoadingGlobalActivationAttemptRef = useRef(0);

	// --- Obtener funciones de providers visuales ---
	const { setFontTheme } = useFontTheme();
	const { setColorScheme, setMode } = useTheme();

	// --- Usar useRef para mantener referencias estables a estas funciones ---
	// Esto es para usarlas dentro del useEffect de sincronización de UI
	// sin que este useEffect principal dependa directamente de sus cambios de referencia.
	const aplicarFuenteRef = useRef(setFontTheme);
	const aplicarTemaRef = useRef(setColorScheme);
	const aplicarModoRef = useRef(setMode);

	// Actualizar las refs si las funciones originales cambian
	// (esto es una salvaguarda; si son estables en origen, estas refs no cambiarán mucho)
	useEffect(() => {
		aplicarFuenteRef.current = setFontTheme;
	}, [setFontTheme]);
	useEffect(() => {
		aplicarTemaRef.current = setColorScheme;
	}, [setColorScheme]);
	useEffect(() => {
		aplicarModoRef.current = setMode;
	}, [setMode]);

	// ========================================================================
	// ✅ EFECTO PRINCIPAL: SUSCRIPCIÓN AL ESTADO DE AUTENTICACIÓN
	// Este es el corazón del provider. Escucha los cambios en Supabase
	// y actualiza el estado de la aplicación de forma reactiva.
	// ========================================================================
	// Eliminado efecto duplicado de onAuthStateChange.
	// La carga inicial de sesión y la suscripción activa están manejadas por
	// InitializeEffect y onAuthStateChangeEffect más abajo para evitar eventos dobles
	// y re-renderizados innecesarios.

	useEffect(() => {
		userRef.current = user;
	}, [user]);
	useEffect(() => {
		proyectoActualRef.current = proyectoActual;
	}, [proyectoActual]);
	useEffect(() => {
		authInitializedRef.current = authInitialized;
	}, [authInitialized]);
	useEffect(() => {
		authLoadingRef.current = authLoading;
	}, [authLoading]);

	const cargarProyectosUsuario = useCallback(
		async (userId: string, forceReload: boolean = false): Promise<boolean> => {
			if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} Cargando proyectos para ${userId.substring(0, 8)}`);
			setLoadingProyectos(true);
			let GenuinelyLoadedNewData = false;
			try {
				if (
					!forceReload &&
					proyectoActualRef.current &&
					proyectoActualRef.current.id === configAppliedForProjectId.current
				) {
					if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} No se recarga de BD (ya aplicado)`);
					setProyectosDisponibles((prev) =>
						prev.length > 0
							? prev
							: proyectoActualRef.current
							? [proyectoActualRef.current]
							: []
					);
				} else {
					if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} Obteniendo proyectos de BD`);
					const result: ResultadoOperacion<UserProjectSetting[]> =
						await obtenerProyectosConSettingsUsuario(userId);
					if (result.success) {
						GenuinelyLoadedNewData = true;
						setProyectosDisponibles(result.data);
						const activo =
							result.data.find((p) => p.is_active_for_user) ||
							result.data[0] ||
							null;
						setProyectoActual(activo);
						if (activo) {
							configAppliedForProjectId.current = activo.id;
							if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} Proyecto activo: ${activo.id.substring(0, 8)}`);
						} else {
							configAppliedForProjectId.current = null;
						}
					} else {
						console.error(`${LOG_PREFIX} Error cargar proyectos BD:`, result.error);
						setProyectoActual(null);
						setProyectosDisponibles([]);
						configAppliedForProjectId.current = null;
					}
				}
			} catch (error) {
				console.error(`${LOG_PREFIX} Excepción cargar proyectos BD:`, error);
				setProyectoActual(null);
				setProyectosDisponibles([]);
				configAppliedForProjectId.current = null;
			} finally {
				setLoadingProyectos(false);
			}
			return GenuinelyLoadedNewData;
		},
		[]
	);

	useEffect(() => {
		// InitializeEffect
		if (initialLoadAttemptedRef.current) return;
		initialLoadAttemptedRef.current = true;
		if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} [InitializeEffect] Iniciando`);
		if (authLoading) {
			authLoadingGlobalActivationAttemptRef.current++;
		}
		(async () => {
			try {
				const {
					data: { session: initialSession },
				} = await supabase.auth.getSession();
				if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} Sesión inicial:`, initialSession ? `User: ${initialSession.user.id.substring(0, 8)}` : "No hay sesión");
				setSession(initialSession);
				setUser(initialSession?.user ?? null);
				if (initialSession?.user && !signedInProcessedRef.current) {
					await cargarProyectosUsuario(initialSession.user.id, true);
				}
			} catch (error) {
				console.error(`${LOG_PREFIX} [InitializeEffect] Excepción:`, error);
				setSession(null);
				setUser(null);
				setProyectoActual(null);
				setProyectosDisponibles([]);
				configAppliedForProjectId.current = null;
				signedInProcessedRef.current = false;
				welcomeToastShownRef.current = false;
			} finally {
				if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} Auth inicializado`);
				setAuthInitialized(true);
				setAuthLoading(false);
			}
		})();
	}, [cargarProyectosUsuario, authLoading]);

	useEffect(() => {
		// onAuthStateChangeEffect
		if (!supabase) return;
		if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} Suscribiendo a auth changes`);
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, newSession) => {
			if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} [${event}] User: ${newSession?.user?.id?.substring(0, 8) ?? "ninguno"}`);
			const previousUser = userRef.current;
			let needsProjectLoad = false;
			let GenuinelyLoadedNewDataInEvent = false;
			setSession(newSession);
			setUser(newSession?.user ?? null);
			if (event === "SIGNED_IN") {
				if (
					newSession?.user &&
					(!previousUser ||
						previousUser.id !== newSession.user.id ||
						!proyectoActualRef.current)
				) {
					needsProjectLoad = true;
				}
				if (needsProjectLoad) {
					if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} Cargando proyectos para ${newSession!.user!.id.substring(0,8)}`);
					configAppliedForProjectId.current = null;
					GenuinelyLoadedNewDataInEvent = await cargarProyectosUsuario(
						newSession!.user!.id,
						true
					);
					if (
						(GenuinelyLoadedNewDataInEvent || proyectoActualRef.current) &&
						!welcomeToastShownRef.current
					) {
						toast.success("¡Bienvenido de nuevo!");
						welcomeToastShownRef.current = true;
					}
				} else if (newSession?.user) {
					if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} Proyecto ya cargado, no recarga`);
					setProyectosDisponibles((prev) =>
						prev.length > 0
							? prev
							: proyectoActualRef.current
							? [proyectoActualRef.current]
							: []
					);
				}
				signedInProcessedRef.current = true;
			} else if (event === "SIGNED_OUT") {
				console.log(`${LOG_PREFIX} [${event}] Limpiando estados.`);
				setProyectoActual(null);
				setProyectosDisponibles([]);
				configAppliedForProjectId.current = null;
				signedInProcessedRef.current = false;
				welcomeToastShownRef.current = false;
			} else if (
				(event === "TOKEN_REFRESHED" || event === "USER_UPDATED") &&
				newSession?.user &&
				!proyectoActualRef.current
			) {
				console.warn(
					`${LOG_PREFIX} [${event}] Se necesitan proyectos pero authLoading global (Contador: ${authLoadingGlobalActivationAttemptRef.current}) ya se usó o no aplica. Cargando proyectos sin loader global.`
				);
				await cargarProyectosUsuario(newSession.user.id, false);
			} else if (event === "INITIAL_SESSION") {
				if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} [${event}] Recibido.`);
				if (!newSession?.user && authInitializedRef.current) {
					setProyectoActual(null);
					setProyectosDisponibles([]);
					configAppliedForProjectId.current = null;
					signedInProcessedRef.current = false;
					welcomeToastShownRef.current = false;
				} else if (newSession?.user && proyectoActualRef.current) {
					if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} [${event}] Confirmación de sesión existente.`);
				} else if (
					newSession?.user &&
					!authInitializedRef.current &&
					!signedInProcessedRef.current
				) {
					console.warn(
						`${LOG_PREFIX} [${event}] Carga por INITIAL_SESSION antes de InitializeEffect/SIGNED_IN. Contador: ${authLoadingGlobalActivationAttemptRef.current}. Cargando proyectos sin loader global.`
					);
					await cargarProyectosUsuario(newSession.user.id, true);
				}
			}
			if (
				authInitializedRef.current &&
				authLoadingRef.current &&
				authLoadingGlobalActivationAttemptRef.current === 1 &&
				(event === "SIGNED_IN" ||
					(event === "INITIAL_SESSION" && signedInProcessedRef.current))
			) {
				if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} [${event}] Fin de ciclo de login (Contador=1). Poniendo authLoading=false.`);
				setAuthLoading(false);
			}
			if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} [${event}] Completado`);
		});
		return () => {
			subscription?.unsubscribe();
		};
	}, [cargarProyectosUsuario]); // authLoading removido - se usa authLoadingRef dentro del callback

	// --- USEEFFECT DE SINCRONIZACIÓN DE UI CON DEPENDENCIAS ESTRICTAS ---
	useEffect(() => {
		// Solo se ejecuta si authInitialized es true o si proyectoActual.id cambia.
		if (authInitialized && proyectoActual) {
			if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} Sincronizando UI para proyecto ${proyectoActual.id.substring(0,8)}`);
			// Sincronizar Fuente
			if (typeof proyectoActual.ui_font_pair === "string") {
				if (VERBOSE_LOGS) console.log("Aplicando fuente:", proyectoActual.ui_font_pair);
				aplicarFuenteRef.current(proyectoActual.ui_font_pair as FontTheme);
			}

			// Sincronizar Esquema de Color (ui_theme)
			if (typeof proyectoActual.ui_theme === "string") {
				if (VERBOSE_LOGS) console.log("Aplicando tema:", proyectoActual.ui_theme);
				aplicarTemaRef.current(proyectoActual.ui_theme as ColorScheme);
			}

			// Sincronizar Modo Oscuro/Claro (ui_is_dark_mode)
			// Asegúrate que el nombre del campo aquí (ui_is_dark_mode) coincida exactamente con tu UserProjectSetting
			if (
				proyectoActual.ui_is_dark_mode !== null &&
				proyectoActual.ui_is_dark_mode !== undefined
			) {
				const newMode = proyectoActual.ui_is_dark_mode ? "dark" : "light";
				if (VERBOSE_LOGS) console.log(`Aplicando modo: ${newMode}`);
				aplicarModoRef.current(newMode);
			}
		}
		// Array de dependencias ESTRICTO: solo se re-ejecuta si authInitialized cambia
		// o si la IDENTIDAD del proyecto (su ID) cambia.
		// No se re-ejecutará si solo cambia ui_theme dentro del mismo proyectoActual.
	}, [authInitialized, proyectoActual]);

	useEffect(() => {
		// RedirectEffect
		const currentAuthInitialized = authInitializedRef.current;
		const currentUser = userRef.current;

		// 🔍 LOGS DETALLADOS PARA DEBUGGING DE PASSWORD RESET
		if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} [Redirect] pathname: ${pathname}, user: ${user ? user.id.substring(0, 8) : "null"}`);

		// 🔧 SOLUCIÓN PARA CARRERA DE CONDICIONES: Omitir redirección en /update-password
		// Esto permite que Supabase procese el token de recuperación antes de que
		// el AuthProvider intente redirigir por falta de sesión activa
		if (pathname === "/update-password") {
			if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} [Redirect] En /update-password, omitiendo redirección para permitir procesamiento del token de recuperación.`);
			return;
		}

		if (!currentAuthInitialized) {
			if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} Auth no inicializado, saliendo`);
			return;
		}
		if (
			authLoading &&
			currentUser &&
			authLoadingGlobalActivationAttemptRef.current === 1
		) {
			if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} [Redirect] Esperando fin de ciclo de login (Contador=1). AuthLoading: ${authLoading}`);
			return;
		}
		const currentPageIsPublic = isPublicPage(pathname);
		if (currentUser) {
			if (currentPageIsPublic) {
				router.replace(proyectoActualRef.current ? "/" : "/");
			}
		} else {
			if (!currentPageIsPublic) {
				if (authLoading) setAuthLoading(false);
				const loginUrl = new URL("/login", window.location.origin);
				if (pathname && pathname !== "/")
					loginUrl.searchParams.set("redirectTo", pathname);
				router.replace(loginUrl.toString());
			} else {
				if (authLoading) setAuthLoading(false);
			}
		}
	}, [user, authInitialized, authLoading, proyectoActual, pathname, router]);

	const handleSignIn = async (
		email: string,
		password: string
	): Promise<{ error: unknown | null; success: boolean }> => {
		if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} handleSignIn: Iniciado. Contador actual: ${authLoadingGlobalActivationAttemptRef.current}`);
		if (authLoadingGlobalActivationAttemptRef.current === 0) {
			setAuthLoading(true);
			authLoadingGlobalActivationAttemptRef.current++;
			if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} handleSignIn iniciado`);
		} else {
			if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} AuthLoading ya activo, no se cambia`);
		}
		signedInProcessedRef.current = false;
		welcomeToastShownRef.current = false;
		const { error } = await clientSignIn(email, password);
		if (error) {
			console.error(`${LOG_PREFIX} handleSignIn: Error de Supabase:`, error.message ? error.message : error);
			toast.error(error.message || "Error al iniciar sesión.");
			if (authLoadingGlobalActivationAttemptRef.current === 1 && authLoading) {
				setAuthLoading(false);
				if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} handleSignIn: authLoading global puesto a FALSE por error. Contador: ${authLoadingGlobalActivationAttemptRef.current}`);
			}
			return { error, success: false };
		}
		if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} Auth OK, esperando evento SIGNED_IN`);
		return { error: null, success: true };
	};
	const handleSignUp = async (
		email: string,
		password: string
	): Promise<{ error: unknown | null; success: boolean }> => {
		if (VERBOSE_LOGS) console.log(`${LOG_PREFIX} signUp iniciado`);
		/* ... sin cambios ... */
		console.log(`${LOG_PREFIX} signUp iniciado`);
		setAuthLoading(true);
		const { error } = await clientSignUp(email, password);
		if (error) {
			toast.error(error.message || "Error al registrar usuario.");
		} else {
			toast.success("Registro exitoso. Revisa tu email para confirmar.");
		}
		setAuthLoading(false);
		return { error, success: !error };
	};
	const handleSignOut = async () => {
		/* ... sin cambios ... */
		console.log(`${LOG_PREFIX} handleSignOut: Iniciado.`);
		setLoadingSignOut(true);
		toast.info("Cerrando sesión...");
		await clientSignOut();
		signedInProcessedRef.current = false;
		welcomeToastShownRef.current = false;
		setLoadingSignOut(false);
	};
	const seleccionarProyecto = async (proyectoId: string) => {
		/* ... sin cambios por ahora ... */
		if (!userRef.current) return;
		if (proyectoActualRef.current?.id === proyectoId) return;
		console.log(`${LOG_PREFIX} Seleccionando proyecto: ${proyectoId}`);
		setLoadingCambioProyecto(true);
		try {
			const updateResult = await actualizarProyectoActivo(
				userRef.current.id,
				proyectoId
			);
			if (!updateResult.success) {
				toast.error(updateResult.error || "Error al cambiar de proyecto.");
			} else {
				configAppliedForProjectId.current = null;
				welcomeToastShownRef.current = false;
				await cargarProyectosUsuario(userRef.current.id, true);
				toast.success("Proyecto cambiado exitosamente.");
			}
		} catch (e: unknown) {
			const errorMessage =
				e instanceof Error ? e.message : "Excepción al cambiar de proyecto.";
			toast.error(errorMessage);
		} finally {
			setLoadingCambioProyecto(false);
		}
	};

	const setProyectoActivoLocal = useCallback(
		(proyecto: UserProjectSetting | null) => {
			console.log(
				`${LOG_PREFIX} setProyectoActivoLocal: Cambiando proyecto localmente a:`,
				proyecto
					? `${proyecto.name} (ID: ${proyecto.id.substring(0, 8)})`
					: "null"
			);
			setProyectoActual(proyecto); // Este cambio en proyectoActual.id SÍ disparará el useEffect de sincronización
			if (proyecto) {
				configAppliedForProjectId.current = proyecto.id;
			} else {
				configAppliedForProjectId.current = null;
			}
		},
		[]
	);
	const setUiThemeLocal = useCallback((theme: string | null) => {
		setProyectoActual((prev) => {
			if (prev) {
				console.log(
					`${LOG_PREFIX} setUiThemeLocal: Cambiando tema localmente a: ${theme} para proyecto ${prev.id.substring(
						0,
						8
					)}`
				);
				return { ...prev, ui_theme: theme }; // Esto cambia el objeto proyectoActual, pero NO su ID.
			}
			return null;
		});
	}, []);
	const setUiFontPairLocal = useCallback((fontPair: string | null) => {
		setProyectoActual((prev) => {
			if (prev) {
				console.log(
					`${LOG_PREFIX} setUiFontPairLocal: Cambiando font pair localmente a: ${fontPair} para proyecto ${prev.id.substring(
						0,
						8
					)}`
				);
				return { ...prev, ui_font_pair: fontPair }; // Esto cambia el objeto proyectoActual, pero NO su ID.
			}
			return null;
		});
	}, []);
	const setUiIsDarkModeLocal = useCallback((isDark: boolean | null) => {
		setProyectoActual((prev) => {
			if (prev) {
				console.log(
					`${LOG_PREFIX} setUiIsDarkModeLocal: Cambiando modo oscuro localmente a: ${isDark} para proyecto ${prev.id.substring(
						0,
						8
					)}`
				);
				return { ...prev, ui_is_dark_mode: isDark }; // Esto cambia el objeto proyectoActual, pero NO su ID.
			}
			return null;
		});
	}, []);

	const authContextValue: AuthContextType = {
		/* ... sin cambios ... */ supabase,
		user,
		session,
		authLoading,
		authInitialized,
		proyectoActual,
		proyectosDisponibles,
		loadingProyectos,
		loadingCambioProyecto,
		loadingSignOut,
		seleccionarProyecto,
		signIn: handleSignIn,
		signUp: handleSignUp,
		logout: handleSignOut,
		setProyectoActivoLocal,
		setUiThemeLocal,
		setUiFontPairLocal,
		setUiIsDarkModeLocal,
	};

	const mostrarOverlayGlobal =
		(authLoading && !authInitializedRef.current) ||
		(authLoading && authLoadingGlobalActivationAttemptRef.current === 1);

	return (
		<AuthContext.Provider value={authContextValue}>
			{mostrarOverlayGlobal ? (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						width: "100vw",
						height: "100vh",
						background: "rgba(var(--background-rgb),0.9)",
						zIndex: 10001,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}>
					<SustratoLoadingLogo
						size={60}
						variant="spin-pulse"
						speed="normal"
						colorTransition={false}
						text={
							loadingSignOut
								? "Cerrando sesión..."
								: loadingCambioProyecto
								? "Cambiando proyecto..."
								: loadingProyectos
								? "Cargando proyecto..."
								: authLoadingGlobalActivationAttemptRef.current === 1
								? "Iniciando sesión..."
								: "Inicializando Sustrato AI..."
						}
					/>
				</div>
			) : (
				children
			)}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth debe ser usado dentro de un AuthProvider");
	}
	return context;
}
