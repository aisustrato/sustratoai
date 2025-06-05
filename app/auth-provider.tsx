// app/auth-provider.tsx
// Versión: 10.18 (Sincronización inicial de UI con FontProvider/ThemeProvider)
"use client";

import React, {
  createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  createBrowserSupabaseClient,
  signInWithEmail as clientSignIn,
  signUp as clientSignUp,
  signOut as clientSignOut,
} from "@/app/auth/client";
import { User, Session, SupabaseClient } from "@supabase/supabase-js";
// import { type Json } from "@/lib/database.types"; // No se usa Json directamente aquí

import {
  obtenerProyectosConSettingsUsuario,
  actualizarProyectoActivo,
  type UserProjectSetting,
  type ResultadoOperacion,
} from "@/app/actions/proyecto-actions";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { toast } from "sonner";

// --- NUEVAS IMPORTACIONES PARA SINCRONIZACIÓN DE UI ---
import { useFontTheme } from "@/app/font-provider"; // Para informar la fuente
// import { useTheme } from "@/app/theme-provider"; // Descomentar cuando se implemente para temas

const LOG_PREFIX = "[AUTH_PROVIDER_V10.18]"; // Actualizado para la nueva versión

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
  signIn: (email: string, password: string) => Promise<{ error: any | null; success: boolean; }>;
  signUp: (email: string, password: string) => Promise<{ error: any | null; success: boolean; }>;
  logout: () => Promise<void>;
  setProyectoActivoLocal: (proyecto: UserProjectSetting | null) => void;
  setUiThemeLocal: (theme: string | null) => void;
  setUiFontPairLocal: (fontPair: string | null) => void;
  setUiIsDarkModeLocal: (isDark: boolean | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ["/login", "/signup", "/reset-password", "/contact"];
const isPublicPage = (pathname: string | null): boolean => {
  if (!pathname) return false;
  return PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [supabase] = useState<SupabaseClient>(() => createBrowserSupabaseClient());

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [proyectoActual, setProyectoActual] = useState<UserProjectSetting | null>(null);
  const [proyectosDisponibles, setProyectosDisponibles] = useState<UserProjectSetting[]>([]);
  const [loadingProyectos, setLoadingProyectos] = useState(false);
  const [loadingCambioProyecto, setLoadingCambioProyecto] = useState(false);
  const [loadingSignOut, setLoadingSignOut] = useState(false);

  const userRef = useRef(user);
  const proyectoActualRef = useRef(proyectoActual);
  const authInitializedRef = useRef(authInitialized);
  const initialLoadAttemptedRef = useRef(false);
  const configAppliedForProjectId = useRef<string | null>(null);
  const signedInProcessedRef = useRef(false);
  const welcomeToastShownRef = useRef(false);
  const authLoadingGlobalActivationAttemptRef = useRef(0);

  // --- HOOKS DE PROVIDERS DE UI (PARA INFORMAR PREFERENCIAS) ---
  const { setFontTheme: aplicarFuenteGlobalmente } = useFontTheme();
  // const { setTheme: aplicarTemaGlobalmente, setMode: aplicarModoOscuroGlobalmente } = useTheme(); // Descomentar para temas

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { proyectoActualRef.current = proyectoActual; }, [proyectoActual]);
  useEffect(() => { authInitializedRef.current = authInitialized; }, [authInitialized]);

  const cargarProyectosUsuario = useCallback(async (userId: string, forceReload: boolean = false): Promise<boolean> => {
    console.log(`${LOG_PREFIX} cargarProyectosUsuario: User: ${userId.substring(0,8)}. Forzar: ${forceReload}.`);
    setLoadingProyectos(true);
    let GenuinelyLoadedNewData = false;
    try {
      if (!forceReload && proyectoActualRef.current && proyectoActualRef.current.id === configAppliedForProjectId.current) {
        console.log(`${LOG_PREFIX} cargarProyectosUsuario: No se recarga de BD (ya aplicado).`);
        setProyectosDisponibles(prev => prev.length > 0 ? prev : (proyectoActualRef.current ? [proyectoActualRef.current] : []));
      } else {
        console.log(`${LOG_PREFIX} cargarProyectosUsuario: Obteniendo proyectos de BD.`);
        const result: ResultadoOperacion<UserProjectSetting[]> = await obtenerProyectosConSettingsUsuario(userId);
        if (result.success) {
          GenuinelyLoadedNewData = true;
          setProyectosDisponibles(result.data);
          const activo = result.data.find(p => p.is_active_for_user) || result.data[0] || null;
          setProyectoActual(activo); // <--- Aquí se establece proyectoActual con datos de BD
          if (activo) {
            configAppliedForProjectId.current = activo.id;
            console.log(`${LOG_PREFIX} Proyecto activo desde BD: ${activo.id.substring(0,8)}. Nombre: ${activo.name}`);
          } else { configAppliedForProjectId.current = null; }
        } else {
          console.error(`${LOG_PREFIX} Error cargar proyectos BD:`, result.error);
          setProyectoActual(null); setProyectosDisponibles([]); configAppliedForProjectId.current = null;
        }
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Excepción cargar proyectos BD:`, error);
      setProyectoActual(null); setProyectosDisponibles([]); configAppliedForProjectId.current = null;
    } finally {
      setLoadingProyectos(false);
    }
    return GenuinelyLoadedNewData;
  }, []);

  useEffect(() => { // InitializeEffect
    if (initialLoadAttemptedRef.current) return;
    initialLoadAttemptedRef.current = true;
    console.log(`${LOG_PREFIX} [InitializeEffect] Iniciando. authLoading (estado inicial): ${authLoading}. Contador: ${authLoadingGlobalActivationAttemptRef.current}`);
    if (authLoading) {
      authLoadingGlobalActivationAttemptRef.current++;
      console.log(`${LOG_PREFIX} [InitializeEffect] Contador de activación de authLoading global incrementado a: ${authLoadingGlobalActivationAttemptRef.current} por carga inicial.`);
    }
    (async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log(`${LOG_PREFIX} [InitializeEffect] Sesión inicial:`, initialSession ? `User: ${initialSession.user.id.substring(0,8)}` : "No hay sesión");
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user && !signedInProcessedRef.current) {
          await cargarProyectosUsuario(initialSession.user.id, true);
        }
      } catch (error) {
        console.error(`${LOG_PREFIX} [InitializeEffect] Excepción:`, error);
        setSession(null); setUser(null); setProyectoActual(null); setProyectosDisponibles([]);
        configAppliedForProjectId.current = null; signedInProcessedRef.current = false; welcomeToastShownRef.current = false;
      } finally {
        console.log(`${LOG_PREFIX} [InitializeEffect] Finalizando. AuthInitialized: true, AuthLoading: false.`);
        setAuthInitialized(true); // <--- Aquí authInitialized se vuelve true
        setAuthLoading(false);
      }
    })();
  }, [supabase, cargarProyectosUsuario, authLoading]);


  useEffect(() => { // onAuthStateChangeEffect
    // ... (lógica existente sin cambios)...
    // Este useEffect maneja eventos de Supabase y actualiza user, session, y llama a cargarProyectosUsuario
    // Es importante que el nuevo useEffect de sincronización de UI no interfiera con esta lógica anti-loop.
    if (!supabase) return;
    console.log(`${LOG_PREFIX} [onAuthStateChangeEffect] Suscribiendo.`);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`${LOG_PREFIX} [EVENT:${event}] Nuevo estado. User: ${newSession?.user?.id?.substring(0,8) ?? 'ninguno'}. AuthInit: ${authInitializedRef.current}, GlobalLoadingActivations: ${authLoadingGlobalActivationAttemptRef.current}`);

      const previousUser = userRef.current;
      let needsProjectLoad = false;
      let GenuinelyLoadedNewDataInEvent = false;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === "SIGNED_IN") {
        if (newSession?.user && (!previousUser || previousUser.id !== newSession.user.id || !proyectoActualRef.current)) {
          needsProjectLoad = true;
        }

        if (needsProjectLoad) {
          console.log(`${LOG_PREFIX} [EVENT:SIGNED_IN] (needsProjectLoad=true) Cargando proyectos para ${newSession!.user!.id}`);
          configAppliedForProjectId.current = null;
          GenuinelyLoadedNewDataInEvent = await cargarProyectosUsuario(newSession!.user!.id, true);
          if ((GenuinelyLoadedNewDataInEvent || proyectoActualRef.current) && !welcomeToastShownRef.current) {
            toast.success("¡Bienvenido de nuevo!");
            welcomeToastShownRef.current = true;
          }
        } else if (newSession?.user) {
          console.log(`${LOG_PREFIX} [EVENT:SIGNED_IN] (needsProjectLoad=false) Mismo usuario y proyecto ya cargado. No se recarga.`);
          setProyectosDisponibles(prev => prev.length > 0 ? prev : (proyectoActualRef.current ? [proyectoActualRef.current] : []));
        }
        signedInProcessedRef.current = true;

      } else if (event === "SIGNED_OUT") {
        console.log(`${LOG_PREFIX} [EVENT:SIGNED_OUT] Limpiando estados.`);
        setProyectoActual(null); setProyectosDisponibles([]); configAppliedForProjectId.current = null;
        signedInProcessedRef.current = false; welcomeToastShownRef.current = false;
      } else if ((event === "TOKEN_REFRESHED" || event === "USER_UPDATED") && newSession?.user && !proyectoActualRef.current) {
        console.warn(`${LOG_PREFIX} [ACUSADOR-EVENT:${event}] Se necesitan proyectos pero authLoading global (Contador: ${authLoadingGlobalActivationAttemptRef.current}) ya se usó o no aplica. Cargando proyectos sin loader global.`);
        await cargarProyectosUsuario(newSession.user.id, false);
      } else if (event === "INITIAL_SESSION") {
        console.log(`${LOG_PREFIX} [EVENT:INITIAL_SESSION] Recibido.`);
        if (!newSession?.user && authInitializedRef.current) {
          setProyectoActual(null); setProyectosDisponibles([]); configAppliedForProjectId.current = null;
          signedInProcessedRef.current = false; welcomeToastShownRef.current = false;
        } else if (newSession?.user && proyectoActualRef.current) {
            console.log(`${LOG_PREFIX} [EVENT:INITIAL_SESSION] Confirmación de sesión existente.`);
        } else if (newSession?.user && !authInitializedRef.current && !signedInProcessedRef.current) {
            console.warn(`${LOG_PREFIX} [ACUSADOR-EVENT:INITIAL_SESSION] Carga por INITIAL_SESSION antes de InitializeEffect/SIGNED_IN. Contador: ${authLoadingGlobalActivationAttemptRef.current}. Cargando proyectos sin loader global.`);
            await cargarProyectosUsuario(newSession.user.id, true);
        }
      }

      if (authInitializedRef.current && authLoading && authLoadingGlobalActivationAttemptRef.current === 1 && (event === "SIGNED_IN" || (event === "INITIAL_SESSION" && signedInProcessedRef.current))) {
          console.log(`${LOG_PREFIX} [EVENT:${event}] Fin de ciclo de login (Contador=1). Poniendo authLoading=false.`);
          setAuthLoading(false);
      }
      console.log(`${LOG_PREFIX} [EVENT:${event}] Procesamiento completado. AuthLoading: ${authLoading}, ContadorGlobal: ${authLoadingGlobalActivationAttemptRef.current}`);
    });
    return () => { subscription?.unsubscribe(); };
  }, [supabase, cargarProyectosUsuario, authLoading]); // Mantener dependencias originales de este efecto

  // --- NUEVO USEEFFECT PARA SINCRONIZAR PREFERENCIAS DE UI CON PROVIDERS VISUALES ---
  useEffect(() => {
    if (authInitialized && proyectoActual) {
      // Sincronizar Fuente
      if (typeof proyectoActual.ui_font_pair === 'string') { // Asegurarse que no sea null si se espera string
        console.log(`[AuthProvider v10.18] Sincronizando FontProvider con ui_font_pair: ${proyectoActual.ui_font_pair}`);
        aplicarFuenteGlobalmente(proyectoActual.ui_font_pair as any); // El 'as any' es porque FontProvider puede tener tipos más específicos para sus IDs
      } else {
        // Si ui_font_pair es null o undefined en BD, FontProvider usará su default.
        // Opcionalmente, se podría forzar un default aquí si fuera necesario:
        // console.log("[AuthProvider v10.18] ui_font_pair no definido. Aplicando default a FontProvider.");
        // aplicarFuenteGlobalmente('ID_FUENTE_POR_DEFECTO_DE_FONTPROVIDER');
      }

      // Sincronizar Tema y Modo Oscuro (Platzhalter para futura implementación)
      // if (typeof proyectoActual.ui_theme === 'string') {
      //   console.log(`[AuthProvider v10.18] Sincronizando ThemeProvider con ui_theme: ${proyectoActual.ui_theme}`);
      //   // aplicarTemaGlobalmente(proyectoActual.ui_theme);
      // }
      // if (proyectoActual.ui_is_dark_mode !== null && proyectoActual.ui_is_dark_mode !== undefined) {
      //   console.log(`[AuthProvider v10.18] Sincronizando ThemeProvider con ui_is_dark_mode: ${proyectoActual.ui_is_dark_mode}`);
      //   // aplicarModoOscuroGlobalmente(proyectoActual.ui_is_dark_mode ? "dark" : "light");
      // }
    }
    // Este efecto se ejecuta cuando authInitialized cambia o cuando el objeto proyectoActual cambia.
    // Esto asegura que si el usuario cambia de proyecto, las preferencias del nuevo proyecto se aplican.
  }, [authInitialized, proyectoActual, aplicarFuenteGlobalmente /*, aplicarTemaGlobalmente, aplicarModoOscuroGlobalmente */]);


  useEffect(() => { // RedirectEffect
    // ... (lógica existente sin cambios)...
    const currentAuthInitialized = authInitializedRef.current;
    const currentUser = userRef.current;

    if (!currentAuthInitialized) return;

    if (authLoading && currentUser && authLoadingGlobalActivationAttemptRef.current === 1) {
        console.log(`${LOG_PREFIX} [RedirectEffect] Esperando fin de ciclo de login (Contador=1). AuthLoading: ${authLoading}`);
        return;
    }

    const currentPageIsPublic = isPublicPage(pathname);

    if (currentUser) {
      if (currentPageIsPublic) {
        router.replace(proyectoActualRef.current ? '/' : '/');
      }
    } else { 
      if (!currentPageIsPublic) {
        if (authLoading) setAuthLoading(false); 
        const loginUrl = new URL('/login', window.location.origin);
        if (pathname && pathname !== "/") loginUrl.searchParams.set('redirectTo', pathname);
        router.replace(loginUrl.toString());
      } else {
        if(authLoading) setAuthLoading(false);
      }
    }
  }, [user, authInitialized, authLoading, proyectoActual, pathname, router]); // Mantener dependencias originales

  const handleSignIn = async (email: string, password: string): Promise<{ error: any | null; success: boolean; }> => { /* ... sin cambios ... */
    console.log(`${LOG_PREFIX} handleSignIn: Iniciado. Contador actual: ${authLoadingGlobalActivationAttemptRef.current}`);
    if (authLoadingGlobalActivationAttemptRef.current === 0) {
      setAuthLoading(true);
      authLoadingGlobalActivationAttemptRef.current++;
      console.log(`${LOG_PREFIX} handleSignIn: authLoading global puesto a TRUE (Contador ahora: ${authLoadingGlobalActivationAttemptRef.current})`);
    } else {
      console.warn(`${LOG_PREFIX} [ACUSADOR-handleSignIn] Intento de activar authLoading global cuando el contador ya es ${authLoadingGlobalActivationAttemptRef.current}. No se cambió authLoading global.`);
    }
    signedInProcessedRef.current = false;
    welcomeToastShownRef.current = false;
    const { error } = await clientSignIn(email, password);
    if (error) {
      console.error(`${LOG_PREFIX} handleSignIn: Error de Supabase:`, error.message ? error.message : error);
      toast.error(error.message || "Error al iniciar sesión.");
      if (authLoadingGlobalActivationAttemptRef.current === 1 && authLoading) {
         setAuthLoading(false);
         console.log(`${LOG_PREFIX} handleSignIn: authLoading global puesto a FALSE por error. Contador: ${authLoadingGlobalActivationAttemptRef.current}`);
      }
      return { error, success: false };
    }
    console.log(`${LOG_PREFIX} handleSignIn: Autenticación Supabase OK. Esperando evento SIGNED_IN para completar.`);
    return { error: null, success: true };
  };
  const handleSignUp = async (email: string, password: string): Promise<{ error: any | null; success: boolean; }> => { /* ... sin cambios ... */
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
  const handleSignOut = async () => { /* ... sin cambios ... */
    console.log(`${LOG_PREFIX} handleSignOut: Iniciado.`);
    setLoadingSignOut(true);
    toast.info("Cerrando sesión...");
    await clientSignOut();
    signedInProcessedRef.current = false;
    welcomeToastShownRef.current = false;
    setLoadingSignOut(false);
  };
  const seleccionarProyecto = async (proyectoId: string) => { /* ... lógica original, considerar refactor si usa setters locales ... */
    // Esta función es un candidato a refactorizar para que use setProyectoActivoLocal
    // después de que la acción de BD (actualizarProyectoActivo) sea exitosa,
    // moviendo la llamada a actualizarProyectoActivo al componente que la inicia (UserAvatar).
    // Por ahora, se mantiene su lógica original para no introducir demasiados cambios a la vez.
    if (!userRef.current) return;
    if (proyectoActualRef.current?.id === proyectoId) return;
    console.log(`${LOG_PREFIX} Seleccionando proyecto: ${proyectoId}`);
    setLoadingCambioProyecto(true);
    try {
      const updateResult = await actualizarProyectoActivo(userRef.current.id, proyectoId);
      if (!updateResult.success) {
        toast.error(updateResult.error || "Error al cambiar de proyecto.");
      } else {
        configAppliedForProjectId.current = null;
        welcomeToastShownRef.current = false;
        await cargarProyectosUsuario(userRef.current.id, true); // Esto recarga proyectoActual y disparará el useEffect de sincronización de UI
        toast.success("Proyecto cambiado exitosamente.");
      }
    } catch (e: any) {
      toast.error(e.message || "Excepción al cambiar de proyecto.");
    } finally {
      setLoadingCambioProyecto(false);
    }
  };

  // --- SETTERS LOCALES (v10.17) ---
  const setProyectoActivoLocal = useCallback((proyecto: UserProjectSetting | null) => {
    console.log(`${LOG_PREFIX} setProyectoActivoLocal: Cambiando proyecto localmente a:`, proyecto ? `${proyecto.name} (ID: ${proyecto.id.substring(0,8)})` : 'null');
    setProyectoActual(proyecto); // Esto también disparará el useEffect de sincronización de UI
    if (proyecto) {
      configAppliedForProjectId.current = proyecto.id;
    } else {
      configAppliedForProjectId.current = null;
    }
  }, []);
  const setUiThemeLocal = useCallback((theme: string | null) => {
    setProyectoActual(prev => {
      if (prev) {
        console.log(`${LOG_PREFIX} setUiThemeLocal: Cambiando tema localmente a: ${theme} para proyecto ${prev.id.substring(0,8)}`);
        return { ...prev, ui_theme: theme }; // Disparará el useEffect de sincronización de UI
      }
      console.warn(`${LOG_PREFIX} setUiThemeLocal: proyectoActual es null. No se aplicó el tema.`);
      return null;
    });
  }, []);
  const setUiFontPairLocal = useCallback((fontPair: string | null) => {
    setProyectoActual(prev => {
      if (prev) {
        console.log(`${LOG_PREFIX} setUiFontPairLocal: Cambiando font pair localmente a: ${fontPair} para proyecto ${prev.id.substring(0,8)}`);
        return { ...prev, ui_font_pair: fontPair }; // Disparará el useEffect de sincronización de UI
      }
      console.warn(`${LOG_PREFIX} setUiFontPairLocal: proyectoActual es null. No se aplicó el font pair.`);
      return null;
    });
  }, []);
  const setUiIsDarkModeLocal = useCallback((isDark: boolean | null) => {
    setProyectoActual(prev => {
      if (prev) {
        console.log(`${LOG_PREFIX} setUiIsDarkModeLocal: Cambiando modo oscuro localmente a: ${isDark} para proyecto ${prev.id.substring(0,8)}`);
        return { ...prev, ui_is_dark_mode: isDark }; // Disparará el useEffect de sincronización de UI
      }
      console.warn(`${LOG_PREFIX} setUiIsDarkModeLocal: proyectoActual es null. No se aplicó el modo oscuro.`);
      return null;
    });
  }, []);
  // --- Fin de Setters Locales ---

  const authContextValue: AuthContextType = {
    supabase, user, session,
    authLoading, authInitialized,
    proyectoActual, proyectosDisponibles,
    loadingProyectos, loadingCambioProyecto, loadingSignOut,
    seleccionarProyecto, signIn: handleSignIn, signUp: handleSignUp, logout: handleSignOut,
    setProyectoActivoLocal,
    setUiThemeLocal,
    setUiFontPairLocal,
    setUiIsDarkModeLocal,
  };

  const mostrarOverlayGlobal = (authLoading && !authInitializedRef.current) || (authLoading && authLoadingGlobalActivationAttemptRef.current === 1);

  return (
    <AuthContext.Provider value={authContextValue}>
      {mostrarOverlayGlobal ? (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(var(--background-rgb),0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SustratoLoadingLogo size={60} variant="spin-pulse" speed="normal"
            text={loadingSignOut ? "Cerrando sesión..." :
                  (loadingCambioProyecto ? "Cambiando proyecto..." :
                  (loadingProyectos ? "Cargando proyecto..." :
                  (authLoadingGlobalActivationAttemptRef.current === 1 ? "Iniciando sesión..." : "Inicializando Sustrato AI...")))} />
        </div>
      ) : children }
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