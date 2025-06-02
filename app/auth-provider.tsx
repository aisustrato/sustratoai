// app/auth-provider.tsx
// Versión: 10.16 (Contador Acumulativo "Sin Reseteos" para authLoading global)
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
import { type Json } from "@/lib/database.types"; 

import {
  obtenerProyectosConSettingsUsuario,
  actualizarProyectoActivo,
  type UserProjectSetting, 
  type ResultadoOperacion,
} from "@/app/actions/proyecto-actions"; 
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { toast } from "sonner";

const LOG_PREFIX = "[AUTH_PROVIDER_V10.16]";

interface AuthContextType {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  authLoading: boolean; // Estado de carga global principal
  authInitialized: boolean; 
  proyectoActual: UserProjectSetting | null; 
  proyectosDisponibles: UserProjectSetting[]; 
  loadingProyectos: boolean; 
  loadingCambioProyecto: boolean; 
  loadingSignOut: boolean; // NUEVO V10.16: Loader específico para logout
  seleccionarProyecto: (proyectoId: string) => Promise<void>; 
  signIn: ( email: string, password: string) => Promise<{ error: any | null; success: boolean; }>;
  signUp: ( email: string, password: string) => Promise<{ error: any | null; success: boolean; }>;
  logout: () => Promise<void>;
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
  const [loadingSignOut, setLoadingSignOut] = useState(false); // NUEVO V10.16
  
  const userRef = useRef(user);
  const proyectoActualRef = useRef(proyectoActual);
  const authInitializedRef = useRef(authInitialized);
  const initialLoadAttemptedRef = useRef(false); 
  const configAppliedForProjectId = useRef<string | null>(null);
  const signedInProcessedRef = useRef(false); 
  const welcomeToastShownRef = useRef(false); 

  // MODIFICACIÓN V10.16: Contador acumulativo "Sin Reseteos Post-Montaje".
  const authLoadingGlobalActivationAttemptRef = useRef(0); 

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
          setProyectoActual(activo); 
          if (activo) {
            configAppliedForProjectId.current = activo.id;
            console.log(`${LOG_PREFIX} Proyecto activo desde BD: ${activo.id}.`);
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
    // El authLoading inicial (useState(true)) es la primera activación.
    if (authLoading) { // Si el estado inicial es true
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
        configAppliedForProjectId.current = null; 
        signedInProcessedRef.current = false; welcomeToastShownRef.current = false;
      } finally {
        console.log(`${LOG_PREFIX} [InitializeEffect] Finalizando. AuthInitialized: true, AuthLoading: false.`);
        setAuthInitialized(true); 
        setAuthLoading(false); // Fin de la carga inicial. Contador NO se resetea.
      }
    })();
  }, [supabase, cargarProyectosUsuario, authLoading]);


  useEffect(() => { // onAuthStateChangeEffect
    if (!supabase) return;
    console.log(`${LOG_PREFIX} [onAuthStateChangeEffect] Suscribiendo.`);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`${LOG_PREFIX} [EVENT:${event}] Nuevo estado. User: ${newSession?.user?.id?.substring(0,8) ?? 'ninguno'}. AuthInit: ${authInitializedRef.current}, GlobalLoadingActivations: ${authLoadingGlobalActivationAttemptRef.current}`);
      
      const previousUser = userRef.current; 
      let needsProjectLoad = false;
      let GenuinelyLoadedNewDataInEvent = false;
      // MODIFICACIÓN V10.16: onAuthStateChange NO debe poner authLoading = true global si el contador ya se usó.
      // Solo setAuthLoading(false) al final si una operación iniciada por handleSignIn terminó.

      setSession(newSession); 
      setUser(newSession?.user ?? null); 

      if (event === "SIGNED_IN") {
        // Este evento ocurre después de que handleSignIn (idealmente) ya puso authLoading=true y contador a 1.
        // Ocurre también en revalidaciones de sesión.
        // La activación del loader la hizo handleSignIn. Aquí solo procesamos datos y ponemos loader a false.
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
        // authLoading se maneja en handleSignOut (pone true) y RedirectEffect (pone false). Contador no se resetea.
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
      
      // MODIFICACIÓN V10.16: Poner authLoading a false si fue un ciclo de login (contador=1) que terminó.
      if (authInitializedRef.current && authLoading && authLoadingGlobalActivationAttemptRef.current === 1 && (event === "SIGNED_IN" || (event === "INITIAL_SESSION" && signedInProcessedRef.current))) {
          console.log(`${LOG_PREFIX} [EVENT:${event}] Fin de ciclo de login (Contador=1). Poniendo authLoading=false.`);
          setAuthLoading(false); 
          // NO se resetea el contador aquí, se queda en 1.
      }
      console.log(`${LOG_PREFIX} [EVENT:${event}] Procesamiento completado. AuthLoading: ${authLoading}, ContadorGlobal: ${authLoadingGlobalActivationAttemptRef.current}`);
    });

    return () => { subscription?.unsubscribe(); };
  }, [supabase, cargarProyectosUsuario, authLoading]);


  useEffect(() => { // RedirectEffect
    const currentAuthInitialized = authInitializedRef.current;
    const currentUser = userRef.current;

    if (!currentAuthInitialized) return;
    
    // Si hay un usuario Y estamos en el único ciclo de authLoading global permitido para login, esperar.
    if (authLoading && currentUser && authLoadingGlobalActivationAttemptRef.current === 1) {
        console.log(`${LOG_PREFIX} [RedirectEffect] Esperando fin de ciclo de login (Contador=1). AuthLoading: ${authLoading}`);
        return;
    }
    // Si authLoading es true por otra razón (ej. logout), sí permitir que actúe.

    const currentPageIsPublic = isPublicPage(pathname);

    if (currentUser) { 
      if (currentPageIsPublic) {
        router.replace(proyectoActualRef.current ? '/' : '/');
      }
    } else { // No hay usuario
      if (!currentPageIsPublic) {
        if (authLoading) setAuthLoading(false); // authLoading fue puesto por handleSignOut, aquí se limpia.
        const loginUrl = new URL('/login', window.location.origin);
        if (pathname && pathname !== "/") loginUrl.searchParams.set('redirectTo', pathname);
        router.replace(loginUrl.toString());
      } else { 
        if(authLoading) setAuthLoading(false); 
      }
    }
  }, [user, authInitialized, authLoading, proyectoActual, pathname, router]); 

  const handleSignIn = async (email: string, password: string): Promise<{ error: any | null; success: boolean; }> => {
    console.log(`${LOG_PREFIX} handleSignIn: Iniciado. Contador actual: ${authLoadingGlobalActivationAttemptRef.current}`);
    
    // MODIFICACIÓN V10.16: Lógica del contador "un solo disparo" para authLoading GLOBAL
    if (authLoadingGlobalActivationAttemptRef.current === 0) {
      setAuthLoading(true); 
      authLoadingGlobalActivationAttemptRef.current++; // Incrementa y se queda en 1 para toda la vida del provider
      console.log(`${LOG_PREFIX} handleSignIn: authLoading global puesto a TRUE (Contador ahora: ${authLoadingGlobalActivationAttemptRef.current})`);
    } else {
      console.warn(`${LOG_PREFIX} [ACUSADOR-handleSignIn] Intento de activar authLoading global cuando el contador ya es ${authLoadingGlobalActivationAttemptRef.current}. No se cambió authLoading global. El login usará loader local si es necesario.`);
      // En este caso, la página de Login debería mostrar su propio loader local si 'loading' (local) es true.
      // authLoading (global) no se activa.
    }
    
    signedInProcessedRef.current = false; 
    welcomeToastShownRef.current = false; 
    
    const { error } = await clientSignIn(email, password); 
    if (error) {
      console.error(`${LOG_PREFIX} handleSignIn: Error de Supabase:`, error.message ? error.message : error);
      toast.error(error.message || "Error al iniciar sesión.");
      // Si signIn falla, y habíamos puesto authLoading=true (y contador a 1), lo ponemos a false.
      // El contador NO se resetea.
      if (authLoadingGlobalActivationAttemptRef.current === 1 && authLoading) { 
         setAuthLoading(false);
         console.log(`${LOG_PREFIX} handleSignIn: authLoading global puesto a FALSE por error. Contador: ${authLoadingGlobalActivationAttemptRef.current}`);
      }
      return { error, success: false };
    }
    console.log(`${LOG_PREFIX} handleSignIn: Autenticación Supabase OK. Esperando evento SIGNED_IN para completar.`);
    return { error: null, success: true };
  };

  const handleSignUp = async (email: string, password: string): Promise<{ error: any | null; success: boolean; }> => {
    console.log(`${LOG_PREFIX} signUp iniciado`);
    // SignUp usa su propio ciclo de authLoading simple, no el contador global de login.
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
    console.log(`${LOG_PREFIX} handleSignOut: Iniciado.`);
    setLoadingSignOut(true); // Usar loader local para signOut
    // NO usar authLoading global si el contador ya se gastó.
    // Si quisiéramos un loader global para logout siempre: setAuthLoading(true);
    toast.info("Cerrando sesión..."); 
    await clientSignOut();
    signedInProcessedRef.current = false; 
    welcomeToastShownRef.current = false; 
    // El contador authLoadingGlobalActivationAttemptRef NO se resetea.
    // El evento SIGNED_OUT y RedirectEffect pondrán authLoading a false si se había puesto a true por este handle.
    // Para asegurar, si no usamos el global:
    setLoadingSignOut(false);
    // Si hubiéramos usado setAuthLoading(true) aquí, RedirectEffect se encargaría de ponerlo a false.
  };

  const seleccionarProyecto = async (proyectoId: string) => { 
    if (!userRef.current) return;
    if (proyectoActualRef.current?.id === proyectoId) return;

    console.log(`${LOG_PREFIX} Seleccionando proyecto: ${proyectoId}`);
    // seleccionarProyecto usará su propio loader local. NO el authLoading global.
    setLoadingCambioProyecto(true); 
    let opSuccess = false;
    try {
      const updateResult = await actualizarProyectoActivo(userRef.current.id, proyectoId);
      if (!updateResult.success) {
        toast.error(updateResult.error || "Error al cambiar de proyecto.");
      } else {
        opSuccess = true;
        configAppliedForProjectId.current = null; 
        welcomeToastShownRef.current = false; 
        await cargarProyectosUsuario(userRef.current.id, true); 
        toast.success("Proyecto cambiado exitosamente."); 
      }
    } catch (e: any) {
      toast.error(e.message || "Excepción al cambiar de proyecto.");
    } finally {
      setLoadingCambioProyecto(false);
    }
  };
    
  const authContextValue: AuthContextType = {
    supabase, user, session,
    authLoading, authInitialized,
    proyectoActual, proyectosDisponibles, 
    loadingProyectos, loadingCambioProyecto, loadingSignOut,
    seleccionarProyecto, signIn: handleSignIn, signUp: handleSignUp, logout: handleSignOut,
  };
  
  // El overlay global se muestra solo en la carga inicial crítica (antes de authInitialized)
  // O si estamos en el ÚNICO ciclo de authLoading global permitido para el login.
  const mostrarOverlayGlobal = (authLoading && !authInitializedRef.current) || 
                             (authLoading && authLoadingGlobalActivationAttemptRef.current === 1);

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