// app/auth-provider.tsx
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
  getSession as clientGetSession 
} from "@/app/auth/client";
import { User, Session, SupabaseClient } from "@supabase/supabase-js";
import {
  obtenerProyectosConSettingsUsuario,
  actualizarProyectoActivo,
  type UserProjectSetting,
} from "@/app/actions/proyecto-actions";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";

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
  seleccionarProyecto: (proyectoId: string) => Promise<void>;
  signIn: ( email: string, password: string) => Promise<{ error: any; success: boolean; }>;
  signUp: ( email: string, password: string) => Promise<{ error: any; success: boolean; }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => createBrowserSupabaseClient());

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true); 
  const [authInitialized, setAuthInitialized] = useState(false);
  
  const [proyectoActual, setProyectoActual] = useState<UserProjectSetting | null>(null);
  const [proyectosDisponibles, setProyectosDisponibles] = useState<UserProjectSetting[]>([]);
  const [loadingProyectos, setLoadingProyectos] = useState(false);
  const [loadingCambioProyecto, setLoadingCambioProyecto] = useState(false);

  const navigationInProgress = useRef(false);
  const initialLoadAttempted = useRef(false); 
  const processingAuthEvent = useRef(false);

  const currentThemeRef = useRef<string | null>(null);
  const currentFontRef = useRef<string | null>(null);
  const currentDarkModeRef = useRef<boolean | null>(null);
  const configAppliedForProjectId = useRef<string | null>(null);

  const LOG_PREFIX = "[AUTH_PROVIDER_V8.5_ANTI_LOOP]";

  const publicPages = ['/login', '/signup', '/reset-password', '/contact'];
  const isPublicPage = publicPages.includes(pathname);

  const aplicarConfiguracionUI = useCallback((proyecto: UserProjectSetting | null) => {
    const opId = Math.floor(Math.random() * 1000);
    if (!proyecto) { /* ... */ return; }
    // ... (lógica sin cambios)
    const uiTheme = proyecto.ui_theme?.trim() ?? null;
    const uiFontPair = proyecto.ui_font_pair?.trim() ?? null;
    const uiIsDarkMode = !!proyecto.ui_is_dark_mode;
    if (configAppliedForProjectId.current === proyecto.id && currentThemeRef.current === uiTheme && currentFontRef.current === uiFontPair && currentDarkModeRef.current === uiIsDarkMode ) { return; }
    const themeChanged = currentThemeRef.current !== uiTheme || currentDarkModeRef.current !== uiIsDarkMode;
    const fontChanged = currentFontRef.current !== uiFontPair;
    if (!themeChanged && !fontChanged) { configAppliedForProjectId.current = proyecto.id; return; }
    if (themeChanged) { document.dispatchEvent(new CustomEvent("theme-change", { detail: { theme: uiTheme, isDarkMode: uiIsDarkMode } })); currentThemeRef.current = uiTheme; currentDarkModeRef.current = uiIsDarkMode; }
    if (fontChanged) { document.dispatchEvent(new CustomEvent("font-change", { detail: { fontPair: uiFontPair } })); currentFontRef.current = uiFontPair; }
    configAppliedForProjectId.current = proyecto.id;
  }, []); // Sin dependencias de estado

  const cargarProyectosUsuario = useCallback(async (userId: string, esPrimerCargaTrasLogin: boolean = false): Promise<{ success: boolean, proyectoFueSeleccionado?: boolean, error?: string }> => {
    const opId = Math.floor(Math.random() * 1000);
    if (!userId) { return { success: false, error: "User ID no provisto" }; }
    // Usar una ref para el estado de carga interno si es necesario para anti-duplicación, o manejarlo con el estado
    // if (loadingProyectos && !esPrimerCargaTrasLogin) { // 'loadingProyectos' es un estado, podría causar re-render si es dependencia
    //   return { success: false, error: "Carga de proyectos ya en progreso" }; 
    // }
    console.log(`${LOG_PREFIX} [CARGAR_PROYECTOS:${opId}] Iniciando para user: ${userId.substring(0,8)}. EsPrimerCarga: ${esPrimerCargaTrasLogin}`);
    setLoadingProyectos(true);
    let proyectoFueSeleccionado = false;
    try {
      const resultado = await obtenerProyectosConSettingsUsuario(userId); 
      if (resultado.success) {
        const proyectosDesdeAPI = resultado.data;
        setProyectosDisponibles(proyectosDesdeAPI); // CAMBIO DE ESTADO -> RE-RENDER
        const proyectoActivoEncontrado = proyectosDesdeAPI.find(p => p.is_active_for_user === true);
        let pFinal = proyectoActivoEncontrado || (proyectosDesdeAPI.length > 0 ? proyectosDesdeAPI[0] : null);
        setProyectoActual(pFinal); // CAMBIO DE ESTADO -> RE-RENDER
        if (pFinal) {
          localStorage.setItem("proyectoActualId", pFinal.id); aplicarConfiguracionUI(pFinal); proyectoFueSeleccionado = true;
        } else {
          localStorage.removeItem("proyectoActualId");
        }
        return { success: true, proyectoFueSeleccionado };
      } else { /* ... manejo de error ... */ return { success: false, error: resultado.error }; }
    } catch (error) { /* ... manejo de error ... */ return { success: false, error: error instanceof Error ? error.message : String(error) };
    } finally { setLoadingProyectos(false); } // CAMBIO DE ESTADO -> RE-RENDER
  }, [aplicarConfiguracionUI]); // Solo dependencias estables

  // Guardar cargarProyectosUsuario en un ref para usar en onAuthStateChange sin causar re-suscripción
  const cargarProyectosUsuarioRef = useRef(cargarProyectosUsuario);
  useEffect(() => {
    cargarProyectosUsuarioRef.current = cargarProyectosUsuario;
  }, [cargarProyectosUsuario]);

  // Guardar aplicarConfiguracionUI en un ref
  const aplicarConfiguracionUIRef = useRef(aplicarConfiguracionUI);
  useEffect(() => {
    aplicarConfiguracionUIRef.current = aplicarConfiguracionUI;
  }, [aplicarConfiguracionUI]);

  const initializeAuth = useCallback(async () => {
    // ... (sin cambios significativos, pero usa cargarProyectosUsuarioRef.current)
    if (initialLoadAttempted.current) return; initialLoadAttempted.current = true;
    setAuthLoading(true);
    try {
      const { session: currentSessionData, error: sessionFetchError } = await clientGetSession();
      if (sessionFetchError) throw sessionFetchError;
      setSession(currentSessionData); setUser(currentSessionData?.user ?? null);
      if (currentSessionData?.user) {
        await cargarProyectosUsuarioRef.current(currentSessionData.user.id, true); 
      } else {
        setProyectoActual(null); setProyectosDisponibles([]);
      }
    } catch (error) { /* ... */ } 
    finally { setAuthLoading(false); setAuthInitialized(true); }
  }, []); // Sin dependencias dinámicas, solo se crea una vez

  useEffect(() => { initializeAuth(); }, [initializeAuth]);

  useEffect(() => {
    console.log(`${LOG_PREFIX} [EFFECT_AUTH_LISTENER] Suscribiendo (o re-suscribiendo si supabase cambia).`);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      const eventId = Math.floor(Math.random() * 1000);
      console.log(`${LOG_PREFIX} [AUTH_EVENT:${eventId}] Evento: ${event}. Sesión: ${newSession ? 'Sí' : 'No'}. processingAuthEvent: ${processingAuthEvent.current}`);

      // Prevenir reentrada si un evento ya se está procesando
      if (processingAuthEvent.current && event !== 'SIGNED_OUT') { // Permitir SIGNED_OUT para limpieza rápida
        console.log(`${LOG_PREFIX} [AUTH_EVENT:${eventId}] Omitiendo evento ${event} (otro evento en proceso).`);
        return; // No resetear processingAuthEvent.current aquí
      }
      processingAuthEvent.current = true;

      const currentLocalUserSnapshot = user; // Tomar snapshot del estado user actual
      
      // Actualizar estados de sesión y usuario. Estos SÍ deben causar re-renders.
      setSession(newSession); 
      setUser(newSession?.user ?? null);

      try {
        if (event === "SIGNED_IN") {
          if (newSession?.user) {
              console.log(`${LOG_PREFIX} [AUTH_EVENT:${eventId}] SIGNED_IN. User: ${newSession.user.id.substring(0,8)}. Iniciando carga de proyectos y UI...`);
              setAuthLoading(true); 
              await cargarProyectosUsuarioRef.current(newSession.user.id, true);
              setAuthLoading(false); 
          }
        } else if (event === "SIGNED_OUT") {
          setProyectoActual(null); setProyectosDisponibles([]); localStorage.removeItem("proyectoActualId");
          configAppliedForProjectId.current = null; 
          setAuthLoading(false); 
        } else if ( (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") && newSession?.user ) {
            // Solo recargar proyectos si el ID del usuario cambió o si no había proyectos antes
            // y no hay ya una carga de proyectos en curso (verificado dentro de cargarProyectosUsuarioRef.current)
            if (newSession.user.id !== currentLocalUserSnapshot?.id || proyectosDisponibles.length === 0) {
              setAuthLoading(true);
              await cargarProyectosUsuarioRef.current(newSession.user.id, newSession.user.id !== currentLocalUserSnapshot?.id); 
              setAuthLoading(false);
            } else if (proyectoActual) { // Mismo usuario, proyectos ya cargados, solo reaplicar UI
              aplicarConfiguracionUIRef.current(proyectoActual);
            }
        } else if (!newSession && (event === "TOKEN_REFRESHED" || event === "USER_UPDATED" || event === "INITIAL_SESSION")) { 
            // Caso donde un refresh/update/initial resulta en no sesión
            setProyectoActual(null); setProyectosDisponibles([]); localStorage.removeItem("proyectoActualId");
            setAuthLoading(false);
        } else if (event === "INITIAL_SESSION" && newSession?.user) {
            // INITIAL_SESSION con sesión válida. La carga inicial la maneja initializeAuth.
            // Aquí podríamos solo asegurar que la UI esté actualizada si el proyectoActual ya existe.
            console.log(`${LOG_PREFIX} [AUTH_EVENT:${eventId}] INITIAL_SESSION con sesión. Verificando UI.`);
            if (proyectoActual) {
                aplicarConfiguracionUIRef.current(proyectoActual);
            } else if (!loadingProyectos) { // Si no hay proyecto actual Y no se están cargando proyectos, intentar cargar
                console.log(`${LOG_PREFIX} [AUTH_EVENT:${eventId}] INITIAL_SESSION con sesión pero sin proyecto actual y no cargando. Intentando cargar proyectos.`);
                setAuthLoading(true);
                await cargarProyectosUsuarioRef.current(newSession.user.id, true);
                setAuthLoading(false);
            }
        }
      } catch (error) {
          console.error(`${LOG_PREFIX} [AUTH_EVENT:${eventId}] Error procesando evento ${event}:`, error);
      } finally {
        processingAuthEvent.current = false;
      }
    });
    return () => { 
      console.log(`${LOG_PREFIX} [EFFECT_AUTH_LISTENER] Desuscribiendo.`);
      subscription?.unsubscribe(); 
    };
  // Dependencias MUY reducidas: solo supabase. Las funciones se acceden vía refs.
  // Los estados se actualizan, pero no queremos que esos cambios de estado causen re-suscripción.
  }, [supabase]); 


  // --- EFECTO DE REDIRECCIÓN V8.5 (Más estable con authLoading y authInitialized) ---
  useEffect(() => {
    const effectId = Math.floor(Math.random() * 1000);
    const currentPathname = pathname;

    // console.log(`${LOG_PREFIX} [EFFECT_REDIRECT_V8.5:${effectId}] Eval. Path: ${currentPathname}, authInit: ${authInitialized}, authLoading: ${authLoading}, session: ${!!session}, proyActual: ${!!proyectoActual}, navInProg: ${navigationInProgress.current}, isPublicPage: ${isPublicPage}`);

    if (!authInitialized || authLoading) {
      console.log(`${LOG_PREFIX} [EFFECT_REDIRECT_V8.5:${effectId}] Esperando: authInit=${authInitialized}, authLoading=${authLoading}.`);
      return;
    }
    if (navigationInProgress.current) { return; }

    if (!session) { 
      if (!isPublicPage) { 
        navigationInProgress.current = true; router.push('/login'); setTimeout(() => navigationInProgress.current = false, 300);
      }
    } else { 
      if (currentPathname === '/login' || currentPathname === '/signup' || currentPathname === '/reset-password') {
        if (loadingProyectos && !proyectoActual) { return; }
        const puedeSalir = proyectoActual || proyectosDisponibles.length === 0;
        if (puedeSalir) {
          navigationInProgress.current = true; router.push('/'); setTimeout(() => navigationInProgress.current = false, 300);
        } else if (user?.id && !loadingProyectos) {
             console.warn(`${LOG_PREFIX} [EFFECT_REDIRECT_V8.5:${effectId}] En login con sesión pero sin proyecto. Reintentando carga.`);
             cargarProyectosUsuarioRef.current(user.id, true); // Usar ref
        }
      } else if (!isPublicPage && !proyectoActual && proyectosDisponibles.length > 0 && !loadingProyectos && !loadingCambioProyecto) {
        if (user?.id && !loadingProyectos) {
            console.warn(`${LOG_PREFIX} [EFFECT_REDIRECT_V8.5:${effectId}] En protegida sin proyecto. Reintentando carga.`);
            cargarProyectosUsuarioRef.current(user.id, true); // Usar ref
        }
      }
    }
  }, [session, authLoading, authInitialized, loadingProyectos, proyectoActual, proyectosDisponibles, isPublicPage, router, pathname, user?.id, loadingCambioProyecto]); // cargarProyectosUsuario quitado de aquí, se usa ref


  const handleSignIn = async (email: string, password: string) => {
    // ... (sin cambios desde V8.3)
    setAuthLoading(true); const result = await clientSignIn(email, password); 
    if (result.error) { setAuthLoading(false); return { error: result.error, success: false }; }
    return { error: null, success: true };
  };

  const handleSignUp = async (email: string, password: string) => {
    // ... (sin cambios desde V8.3)
    setAuthLoading(true); const result = await clientSignUp(email, password); setAuthLoading(false);
    if (result.error) { return { error: result.error, success: false };}
    return { error: null, success: true };
  };
  
  const handleSignOut = async () => {
    // ... (sin cambios desde V8.3)
    setAuthLoading(true); 
    setProyectoActual(null); setProyectosDisponibles([]); localStorage.removeItem("proyectoActualId");
    configAppliedForProjectId.current = null; setAuthInitialized(false); 
    await clientSignOut(); 
  };

  const seleccionarProyecto = async (proyectoId: string) => {
    // ... (sin cambios desde V8.3, pero usa cargarProyectosUsuarioRef.current)
    if (!user) return;
    setLoadingCambioProyecto(true); setAuthLoading(true);
    try {
      const updateResult = await actualizarProyectoActivo(user.id, proyectoId);
      if (!updateResult.success) { return; }
      configAppliedForProjectId.current = null; 
      await cargarProyectosUsuarioRef.current(user.id, true);
    } catch (e) { console.error(e); }
    finally { setLoadingCambioProyecto(false); setAuthLoading(false); }
  };
    
  const authContextValue: AuthContextType = {
    supabase, user, session,
    authLoading, authInitialized,
    proyectoActual, proyectosDisponibles, 
    loadingProyectos, loadingCambioProyecto,
    seleccionarProyecto, signIn: handleSignIn, signUp: handleSignUp, logout: handleSignOut,
  };
  
  const mostrarOverlayPrincipal = authLoading && (!isPublicPage || (isPublicPage && !!session));
  
  return (
    <AuthContext.Provider value={authContextValue}>
      {mostrarOverlayPrincipal ? (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SustratoLoadingLogo size={60} variant="spin-pulse" speed="normal" 
            text={loadingCambioProyecto ? "Cambiando proyecto..." : (loadingProyectos ? "Cargando proyecto..." : "Inicializando...")} />
        </div>
      ) : children }
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  return context;
}