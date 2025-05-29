"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { signIn, signOut, getSession, supabaseClient } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import {
  obtenerProyectosConSettingsUsuario,
  obtenerProyectoPorId,
  actualizarPreferenciasUI,
  actualizarProyectoActivo,
  type Project,
  type UserProjectSetting,
} from "@/app/actions/proyecto-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CustomButton } from "@/components/ui/custom-button";
import { ProCard } from "@/components/ui/pro-card";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authInitialized: boolean; // Nuevo estado para indicar que la autenticación se ha inicializado
  proyectoActual: UserProjectSetting | null;
  proyectosDisponibles: UserProjectSetting[];
  cargandoProyectos: boolean;
  cambiandoProyecto: boolean; // Nuevo estado para indicar que se está cambiando de proyecto
  seleccionarProyecto: (proyectoId: string) => Promise<void>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: any;
    success: boolean;
  }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{
    error: any;
    success: boolean;
  }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [proyectoActual, setProyectoActual] =
    useState<UserProjectSetting | null>(null);
  const [proyectosDisponibles, setProyectosDisponibles] = useState<
    UserProjectSetting[]
  >([]);
  const [cargandoProyectos, setCargandoProyectos] = useState(false);
  const [cambiandoProyecto, setCambiandoProyecto] = useState(false); // Nuevo estado para cambio de proyecto
  const [mostrarSelectorProyecto, setMostrarSelectorProyecto] = useState(false);

  // Referencias para controlar estados y evitar operaciones duplicadas
  const authStateProcessed = useRef(false);
  const proyectosCargados = useRef(false);
  const processingAuthEvent = useRef(false);
  const loadingProjectsForUserId = useRef<string | null>(null);
  const currentAuthUserId = useRef<string | null>(null);
  const lastProjectLoadTime = useRef<number>(0); // Para controlar recargas por tiempo
  const navigationInProgress = useRef<boolean>(false); // Evitar múltiples redirecciones
  const initialRedirectDone = useRef<boolean>(false); // Control de redirección inicial

  const currentThemeRef = useRef<string | null>(null);
  const currentFontRef = useRef<string | null>(null);
  const currentDarkModeRef = useRef<boolean | null>(null);
  const configAppliedForProjectId = useRef<string | null>(null);

  // Función para cargar los proyectos del usuario con mejor manejo de errores y debugging
  const cargarProyectosUsuario = async (userId: string) => {
    // Verificación de parámetros y estado
    if (!userId) {
      console.error("❌ Error: Se intentó cargar proyectos sin ID de usuario");
      return;
    }

    // ID único para seguimiento de logs
    const operationId = Math.floor(Math.random() * 1000);

    // Verificar si hay una carga reciente (menos de 30 segundos) y tenemos datos
    const ahora = Date.now();
    const tiempoDesdeUltimaCarga = ahora - lastProjectLoadTime.current;
    if (
      tiempoDesdeUltimaCarga < 30000 &&
      proyectosCargados.current &&
      proyectosDisponibles.length > 0
    ) {
      console.log(
        `🔄 [${operationId}] Carga reciente (hace ${Math.round(
          tiempoDesdeUltimaCarga / 1000
        )}s), usando caché`
      );
      return;
    }

    // NUEVA LÓGICA: Verificar si ya hay una carga en progreso para este usuario
    if (loadingProjectsForUserId.current === userId) {
      console.log(
        `⏳ [${operationId}] Ya hay una carga en progreso para ${userId.substring(
          0,
          8
        )}, esperando...`
      );

      // Esperar a que termine la carga actual antes de continuar
      let attempts = 0;
      while (loadingProjectsForUserId.current === userId && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        attempts++;
      }

      // Si después de esperar ya tenemos proyectos, usamos los datos existentes
      if (proyectosCargados.current && proyectosDisponibles.length > 0) {
        console.log(
          `✅ [${operationId}] Proyectos ya cargados mientras esperábamos, usando datos existentes`
        );
        return;
      }
    }

    // Verificar si ya estamos cargando proyectos o si ya se cargaron
    if (cargandoProyectos && loadingProjectsForUserId.current) {
      console.log(
        `⏳ [${operationId}] Carga de proyectos ya en progreso para otro usuario, omitiendo llamada`
      );
      return;
    }

    if (proyectosCargados.current && proyectosDisponibles.length > 0) {
      console.log(
        `✅ [${operationId}] Proyectos ya cargados, usando datos existentes`
      );
      return;
    }

    console.log(
      `🔍 [${operationId}] Iniciando carga de proyectos para: ${userId.substring(
        0,
        8
      )}...`
    );

    // Marcar que estamos cargando y para qué usuario
    setCargandoProyectos(true);
    loadingProjectsForUserId.current = userId;

    try {
      // Capturar el ID del usuario al inicio para comparaciones posteriores
      const targetUserId = userId;

      // Llamada al servidor - acción de proyecto
      console.log(
        `📡 [${operationId}] Llamando a API obtenerProyectosConSettingsUsuario...`
      );
      const resultado = await obtenerProyectosConSettingsUsuario(targetUserId);

      // Verificar si el usuario ha cambiado significativamente (por ejemplo, logout seguido de otro login)
      // Solo cancelamos si el usuario actual es nulo o completamente diferente
      const currentUserIdInAuth = currentAuthUserId.current;

      // Si no hay usuario de referencia o coincide con el que estamos cargando, continuamos
      // Solo abortamos si hay un usuario de referencia y es diferente del actual
      if (currentUserIdInAuth && currentUserIdInAuth !== targetUserId) {
        console.log(
          `⚠️ [${operationId}] Usuario cambió significativamente durante carga (${currentUserIdInAuth.substring(
            0,
            8
          )} ≠ ${targetUserId.substring(0, 8)}), abortando procesamiento`
        );
        setCargandoProyectos(false);
        loadingProjectsForUserId.current = null;
        return;
      }

      // Procesar resultados de la API
      if (resultado.success && resultado.data) {
        console.log(
          `✅ [${operationId}] API retornó ${resultado.data.length} proyectos`
        );

        // Registrar tiempo de carga exitosa para caché
        lastProjectLoadTime.current = Date.now();

        setProyectosDisponibles(resultado.data);

        // Seleccionar automáticamente el proyecto activo (is_active_for_user = true)
        const proyectoActivo = resultado.data.find(
          (p) => p.is_active_for_user === true
        );

        if (proyectoActivo) {
          console.log(
            `✅ [${operationId}] Proyecto activo encontrado y seleccionado: ${proyectoActivo.name}`
          );
          setProyectoActual(proyectoActivo);
          localStorage.setItem("proyectoActualId", proyectoActivo.id);

          // Aplicar configuración de UI inmediatamente
          aplicarConfiguracionUI(proyectoActivo);
        } else if (resultado.data.length > 0) {
          // Si no hay proyecto activo, usar el primer proyecto disponible
          console.log(
            `ℹ️ [${operationId}] No hay proyecto activo, seleccionando el primero disponible: ${resultado.data[0].name}`
          );
          setProyectoActual(resultado.data[0]);
          localStorage.setItem("proyectoActualId", resultado.data[0].id);

          // Aplicar configuración de UI inmediatamente
          aplicarConfiguracionUI(resultado.data[0]);
        } else {
          console.log(
            `⚠️ [${operationId}] No se encontraron proyectos para el usuario`
          );
        }

        // Marcar operación como completada
        proyectosCargados.current = true;
      } else {
        // Manejar error de la API - verificamos que es un resultado con error
        if ("error" in resultado) {
          console.error(
            `❌ [${operationId}] Error retornado por API:`,
            resultado.error
          );
        } else {
          console.error(
            `❌ [${operationId}] API retornó estado error sin mensaje de error`
          );
        }
        setProyectosDisponibles([]);
      }
    } catch (error) {
      console.error(
        `❌ [${operationId}] Excepción al cargar proyectos:`,
        error
      );
      setProyectosDisponibles([]);
      proyectosCargados.current = false;
    } finally {
      setCargandoProyectos(false);
      loadingProjectsForUserId.current = null; // Liberar el bloqueo
    }
  };

  // Función para aplicar la configuración de UI según las preferencias del proyecto
  const aplicarConfiguracionUI = (proyecto: UserProjectSetting) => {
    if (!proyecto) return;

    // Evitar reconfiguraciones para el mismo proyecto (previene recursión)
    if (configAppliedForProjectId.current === proyecto.id) {
      console.log(
        `⏭️ Configuración ya aplicada para proyecto ${proyecto.id.substring(
          0,
          8
        )}, omitiendo`
      );
      return;
    }

    // Normalizar valores para evitar problemas con espacios en blanco
    const uiTheme = proyecto.ui_theme ? proyecto.ui_theme.trim() : null;
    const uiFontPair = proyecto.ui_font_pair
      ? proyecto.ui_font_pair.trim()
      : null;
    const uiIsDarkMode = !!proyecto.ui_is_dark_mode; // Asegurar que es booleano

    // Evitar aplicar las mismas configuraciones otra vez
    const themeChanged = currentThemeRef.current !== uiTheme;
    const fontChanged = currentFontRef.current !== uiFontPair;
    const darkModeChanged = currentDarkModeRef.current !== uiIsDarkMode;

    // Solo registrar el cambio si hay algo que cambiar
    if (!themeChanged && !fontChanged && !darkModeChanged) {
      console.log(
        `⏭️ No hay cambios en configuración UI, omitiendo aplicación`
      );
      // Aún así marcamos el proyecto como configurado
      configAppliedForProjectId.current = proyecto.id;
      return;
    }

    console.log(`🔄 Aplicando configuración UI para proyecto:`, {
      id: proyecto.id,
      name: proyecto.name,
      ui_theme: uiTheme,
      ui_font_pair: uiFontPair,
      ui_is_dark_mode: uiIsDarkMode,
      themeChanged,
      fontChanged,
      darkModeChanged,
    });

    // Disparar eventos para actualizar tema y fuentes SOLO si hubo cambios
    if (themeChanged || darkModeChanged) {
      console.log(
        `🎨 Aplicando tema UI: ${uiTheme}, modo oscuro: ${
          uiIsDarkMode ? "activado" : "desactivado"
        }`
      );

      // Crear evento con detalles completos del tema
      const themeEvent = new CustomEvent("theme-change", {
        detail: {
          theme: uiTheme,
          isDarkMode: uiIsDarkMode,
        },
      });

      // Disparar evento theme-change
      document.dispatchEvent(themeEvent);

      // Actualizar referencias
      currentThemeRef.current = uiTheme;
      currentDarkModeRef.current = uiIsDarkMode;
    }

    if (fontChanged) {
      console.log(`🔤 Aplicando par de fuentes: ${uiFontPair}`);

      // Crear evento con detalles de la fuente
      const fontEvent = new CustomEvent("font-change", {
        detail: {
          fontPair: uiFontPair,
        },
      });

      // Disparar evento font-change
      document.dispatchEvent(fontEvent);

      // Actualizar referencia
      currentFontRef.current = uiFontPair;
    }

    // Marcar este proyecto como configurado
    configAppliedForProjectId.current = proyecto.id;
  };

  // Función para seleccionar un proyecto
  const seleccionarProyecto = async (proyectoId: string) => {
    try {
      // Activar el estado de carga
      setCambiandoProyecto(true);

      const resultado = await obtenerProyectoPorId(proyectoId);

      if (resultado.success && resultado.data) {
        // Resetear las referencias de configuración para forzar la aplicación de nuevos temas
        currentThemeRef.current = null;
        currentFontRef.current = null;
        currentDarkModeRef.current = null;
        configAppliedForProjectId.current = null;

        // Intentar persistir el cambio de proyecto activo en la base de datos
        if (user) {
          try {
            await actualizarProyectoActivo(user.id, proyectoId);
            console.log("✅ Proyecto activo actualizado en base de datos");

            // Actualizar el estado local para reflejar el cambio
            const proyectosActualizados = proyectosDisponibles.map(
              (proyecto) => ({
                ...proyecto,
                is_active_for_user: proyecto.id === proyectoId,
              })
            );

            setProyectosDisponibles(proyectosActualizados);

            const proyectoEncontrado = proyectosDisponibles.find(
              (p) => p.id === proyectoId
            );

            if (proyectoEncontrado) {
              const proyectoActualizado = {
                ...proyectoEncontrado,
                is_active_for_user: true,
              };

              // Aquí aplicamos la configuración antes de actualizar el estado
              // para evitar problemas de timing con el useEffect
              console.log(
                "🚀 Forzando aplicación de configuración UI para nuevo proyecto"
              );
              aplicarConfiguracionUI(proyectoActualizado);

              // Pequeño retraso para asegurar que los cambios visuales se apliquen completamente
              setTimeout(() => {
                setProyectoActual(proyectoActualizado);
                localStorage.setItem("proyectoActualId", proyectoId);
                setMostrarSelectorProyecto(false);

                // Desactivar estado de carga después de completar todo
                setCambiandoProyecto(false);
              }, 300);
            } else {
              // Si no lo encontramos en la lista disponible, crear un UserProjectSetting básico
              // con los datos del proyecto y valores predeterminados para los campos adicionales
              const proyectoBasico: UserProjectSetting = {
                ...resultado.data,
                project_role_id: "default", // Valor por defecto
                ui_theme: null,
                ui_font_pair: null,
                ui_is_dark_mode: false,
                is_active_for_user: true,
                permissions: null,
              };

              setProyectoActual(proyectoBasico);
              localStorage.setItem("proyectoActualId", proyectoId);
            }
          } catch (error) {
            console.error("❌ Error actualizando proyecto activo:", error);
            setCambiandoProyecto(false);
          }
        } else {
          // Si no hay usuario, simplemente actualizar la UI sin persistencia
          const proyectoEncontrado = proyectosDisponibles.find(
            (p) => p.id === proyectoId
          );

          if (proyectoEncontrado) {
            const proyectoActualizado = {
              ...proyectoEncontrado,
              is_active_for_user: true,
            };

            // Aplicar configuración antes de actualizar estado
            console.log(
              "🚀 Forzando aplicación de configuración UI para nuevo proyecto"
            );
            aplicarConfiguracionUI(proyectoActualizado);

            setProyectoActual(proyectoActualizado);
            localStorage.setItem("proyectoActualId", proyectoId);
          } else {
            // Código existente para manejo de proyecto no encontrado
            const proyectoBasico: UserProjectSetting = {
              ...resultado.data,
              project_role_id: "default",
              ui_theme: null,
              ui_font_pair: null,
              ui_is_dark_mode: false,
              is_active_for_user: true,
              permissions: null,
            };

            setProyectoActual(proyectoBasico);
            localStorage.setItem("proyectoActualId", proyectoId);
          }

          setMostrarSelectorProyecto(false);
          // Desactivar estado de carga después de completar
          setCambiandoProyecto(false);
        }
      } else {
        // Si no hay datos o hay error, desactivar carga
        setCambiandoProyecto(false);
      }
    } catch (error) {
      console.error("Error al seleccionar proyecto:", error);
      setCambiandoProyecto(false);
    }
  };

  // Función mejorada para cargar la sesión inicial
  const loadSession = async () => {
    // Evitar inicializaciones redundantes
    if (authStateProcessed.current) {
      console.log("⏳ Omitiendo carga de sesión - ya procesada");
      return;
    }

    try {
      // Marcamos que estamos procesando para evitar operaciones en paralelo
      authStateProcessed.current = true;

      // Intentar recuperar de localStorage primero (como caché inicial)
      const cachedUser = localStorage.getItem("cachedUser");
      if (cachedUser) {
        try {
          const userObj = JSON.parse(cachedUser);
          console.log(
            "🔄 Usando datos de usuario en caché mientras verificamos sesión"
          );
          // Pre-cargar la UI con datos en caché para evitar parpadeos
          setUser(userObj);
        } catch (e) {
          console.log("⚠️ Error al parsear usuario en caché, ignorando");
          localStorage.removeItem("cachedUser");
        }
      }

      const { data, error } = await getSession();
      if (error) throw error;

      if (data.session) {
        console.log(
          "✅ Sesión activa:",
          data.session.user.id.substring(0, 8) + "..."
        );

        // Guardar en caché para futuras cargas rápidas
        localStorage.setItem("cachedUser", JSON.stringify(data.session.user));

        setUser(data.session.user);
        setSession(data.session);

        // Inicializamos la referencia del usuario durante la carga inicial
        currentAuthUserId.current = data.session.user.id;

        // Solo cargamos proyectos si no hay datos o ha pasado tiempo
        if (
          !proyectosCargados.current ||
          Date.now() - lastProjectLoadTime.current > 60000
        ) {
          await cargarProyectosUsuario(data.session.user.id);
        }
      } else {
        console.log("❌ Sin sesión activa");
        localStorage.removeItem("cachedUser");
        setUser(null);
        setSession(null);
        currentAuthUserId.current = null;
      }
    } catch (error) {
      console.error("❌ Error obteniendo sesión:", error);
      localStorage.removeItem("cachedUser");
      authStateProcessed.current = false; // Permitir reintento en caso de error
    } finally {
      setLoading(false);
      setAuthInitialized(true);
    }
  };

  // Inicializar AuthProvider una sola vez al cargar
  useEffect(() => {
    if (!authInitialized && !authStateProcessed.current) {
      console.log("🔄 Inicializando AuthProvider");
      loadSession();
    } else if (
      user &&
      !proyectosCargados.current &&
      !loadingProjectsForUserId.current
    ) {
      // Solo cargar proyectos si tenemos usuario y no se han cargado aún
      // Y no hay carga en progreso
      console.log(
        "🔄 Cargando proyectos pendientes en inicialización secundaria"
      );
      cargarProyectosUsuario(user.id);
    }
  }, [authInitialized, user]);

  // Manejar eventos de autenticación de forma unificada
  useEffect(() => {
    // Evitar suscribirse múltiples veces al mismo evento
    let isMounted = true;
    let eventLock = false; // Bloqueo local para este efecto específico

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, newSession) => {
      // Evitar procesamiento de eventos mientras otro está en progreso
      if (eventLock || processingAuthEvent.current || !isMounted) return;

      // Bloqueamos inmediatamente para evitar carreras
      eventLock = true;
      processingAuthEvent.current = true;

      try {
        // Registrar el evento con ID corto para facilitar depuración
        const eventId = Math.floor(Math.random() * 1000);
        console.log(`🔄 [${eventId}] Evento auth: ${event}`);

        // Determinar si necesitamos actualizar el usuario y la sesión
        const shouldUpdateSession =
          event === "SIGNED_IN" &&
          newSession &&
          (!user || user.id !== newSession.user.id);

        // Actualizar el usuario y la sesión si es necesario
        if (shouldUpdateSession) {
          console.log(
            `✅ [${eventId}] Usuario autenticado: ${newSession.user.id.substring(
              0,
              8
            )}...`
          );

          // Guardar en caché para futuras cargas rápidas
          localStorage.setItem("cachedUser", JSON.stringify(newSession.user));

          setUser(newSession.user);
          setSession(newSession);
          // Actualizamos la referencia al usuario actual
          currentAuthUserId.current = newSession.user.id;
        }

        // SIGNED_IN (login exitoso)
        if (event === "SIGNED_IN" && newSession) {
          // IMPORTANTE: Cargar proyectos en cada inicio de sesión exitoso
          // pero evitamos carreras con otros eventos

          // Resetear el estado de carga solo si estamos seguros que es un nuevo login
          // o ha pasado tiempo suficiente desde la última carga
          const debeRecargarProyectos =
            shouldUpdateSession ||
            !proyectosCargados.current ||
            proyectosDisponibles.length === 0 ||
            Date.now() - lastProjectLoadTime.current > 60000;

          if (debeRecargarProyectos) {
            console.log(
              `🔄 [${eventId}] Cargando proyectos tras login exitoso (recarga: ${shouldUpdateSession})`
            );

            // Si es un nuevo login, forzar recarga
            if (shouldUpdateSession) {
              proyectosCargados.current = false;
            }

            try {
              // Solo un intento, más inteligente y confiable
              await cargarProyectosUsuario(newSession.user.id);
            } catch (error) {
              console.error(
                `❌ [${eventId}] Error al cargar proyectos:`,
                error
              );
            }
          } else {
            console.log(
              `ℹ️ [${eventId}] Proyectos ya cargados recientemente, omitiendo carga`
            );
          }
        }
        // SIGNED_OUT (logout exitoso)
        else if (event === "SIGNED_OUT") {
          console.log(`🔒 [${eventId}] Sesión cerrada`);
          localStorage.removeItem("cachedUser");
          setUser(null);
          setSession(null);
          setProyectoActual(null);
          setProyectosDisponibles([]);
          proyectosCargados.current = false;
          loadingProjectsForUserId.current = null;
          currentAuthUserId.current = null; // Limpiar referencia de usuario
        }
        // La primera carga de la sesión
        else if (event === "INITIAL_SESSION" && newSession) {
          console.log(`🔄 [${eventId}] Estado inicial con sesión detectada`);

          // Solo actuar si tenemos una sesión válida
          if (!user && newSession?.user) {
            console.log(
              `🔄 [${eventId}] Estableciendo usuario de sesión inicial`
            );

            // Guardar en caché para futuras cargas rápidas
            localStorage.setItem("cachedUser", JSON.stringify(newSession.user));

            setUser(newSession.user);
            setSession(newSession);
            // Inicializamos la referencia del usuario también durante el evento inicial
            currentAuthUserId.current = newSession.user.id;

            // Forzar carga de proyectos solo si es necesario y no fue cargado recientemente
            const tiempoDesdeUltimaCarga =
              Date.now() - lastProjectLoadTime.current;
            if (
              (!proyectosCargados.current ||
                proyectosDisponibles.length === 0) &&
              tiempoDesdeUltimaCarga > 10000
            ) {
              console.log(
                `🔄 [${eventId}] Cargando proyectos desde INITIAL_SESSION`
              );
              await cargarProyectosUsuario(newSession.user.id);
            } else {
              console.log(
                `ℹ️ [${eventId}] Omitiendo carga de proyectos en INITIAL_SESSION (cargados hace ${Math.round(
                  tiempoDesdeUltimaCarga / 1000
                )}s)`
              );
            }
          }
        }
      } finally {
        // Siempre liberar los bloqueos, incluso en caso de error
        eventLock = false;
        processingAuthEvent.current = false;
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Quitamos la dependencia en user para evitar reconexiones y problemas

  // Redirigir según el estado de autenticación - optimizado para evitar redirecciones múltiples
  useEffect(() => {
    if (loading || navigationInProgress.current) return;

    const currentPath = pathname || "";

    // Verificar si estamos en una página de autenticación
    const isAuthPage =
      currentPath === "/login" ||
      currentPath === "/register" ||
      currentPath === "/reset-password" ||
      currentPath === "/";

    // Evitar redirecciones repetidas
    if (initialRedirectDone.current) {
      // Hay casos específicos donde queremos forzar redirección fuera de la inicial
      const forceRedirect =
        (!user && !isAuthPage) || // Usuario no autenticado en página protegida
        (user &&
          (currentPath === "/login" ||
            currentPath === "/register" ||
            currentPath === "/reset-password")); // Usuario autenticado en login/register

      if (!forceRedirect) return;
    }

    // Reglas de redirección
    if (!user && !isAuthPage) {
      navigationInProgress.current = true;
      initialRedirectDone.current = true;
      console.log(
        "Redirigiendo a login: usuario no autenticado y página requiere autenticación"
      );

      // Usar una promesa para manejar la redirección
      router.push("/login");
      // Liberar el bloqueo después de un tiempo para asegurar que la navegación haya ocurrido
      setTimeout(() => {
        navigationInProgress.current = false;
      }, 500);
    } else if (user && isAuthPage && currentPath !== "/") {
      navigationInProgress.current = true;
      initialRedirectDone.current = true;
      console.log("Redirigiendo a home: usuario ya autenticado");

      // Usar una promesa para manejar la redirección
      router.push("/");
      // Liberar el bloqueo después de un tiempo para asegurar que la navegación haya ocurrido
      setTimeout(() => {
        navigationInProgress.current = false;
      }, 500);
    } else {
      // Si no necesitamos redireccionar, marcamos como completado para no revisar de nuevo
      initialRedirectDone.current = true;
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        console.error("❌ Error en login:", error);
        return { error, success: false };
      }

      // No forzar recarga completa, dejamos que los eventos de autenticación manejen todo
      console.log("✅ Login exitoso");
      return { error: null, success: true };
    } catch (error) {
      console.error("❌ Excepción en login:", error);
      return { error, success: false };
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        return { error, success: false };
      }
      return { error: null, success: true };
    } catch (error) {
      return { error, success: false };
    }
  };

  const logout = async () => {
    // Generar ID único para logs
    const logoutId = Math.floor(Math.random() * 1000);
    console.log(`🔒 [${logoutId}] Iniciando logout...`);

    // Prevenir operaciones duplicadas
    if (processingAuthEvent.current) {
      console.log(`⚠️ [${logoutId}] Logout ya en proceso, abortando`);
      return;
    }

    processingAuthEvent.current = true;

    try {
      // IMPORTANTE: Primero hacer la operación de signOut en Supabase
      // Esto asegura que no tengamos parpadeos de UI mientras se limpia la sesión
      const { error } = await signOut();

      if (error) {
        console.error(`❌ [${logoutId}] Error durante signOut:`, error);
        throw error; // Propagar el error para manejar de forma consistente
      }

      console.log(`✅ [${logoutId}] Sesión cerrada en Supabase`);

      // Limpiar localStorage primero (operación síncrona)
      localStorage.removeItem("proyectoActualId");
      proyectosCargados.current = false;

      // Ahora redireccionar sin setTimeout - la redirección completa ya limpia el estado
      console.log(`🔙 [${logoutId}] Redirigiendo a login...`);

      // Usar replace en lugar de href para evitar entradas en el historial
      window.location.replace("/login");
    } catch (error) {
      console.error(`❌ [${logoutId}] Error en logout:`, error);

      // Solo limpiar estado local en caso de error
      setUser(null);
      setSession(null);
      setProyectoActual(null);
      setProyectosDisponibles([]);
      // Redirigir a login en caso de error (sin setTimeout)
      window.location.replace("/login");
    }
  };

  // Componente para mostrar el proyecto actual y permitir cambiarlo
  const ProyectoIndicator = () => {
    // Ahora ocultamos este componente ya que esta funcionalidad se ha movido al avatar de usuario
    return null;
  };

  // Selector de proyectos (modal) - optimizado para evitar setTimeout
  const ProyectoSelectorModal = () => {
    // Effect simplificado - sin setTimeout
    useEffect(() => {
      if (
        proyectosDisponibles.length > 1 &&
        !proyectoActual &&
        !mostrarSelectorProyecto &&
        !loading
      ) {
        console.log(
          "🚨 ALERTA: Múltiples proyectos disponibles, abriendo selector inmediatamente"
        );
        setMostrarSelectorProyecto(true);
      }
    }, [
      proyectosDisponibles,
      proyectoActual,
      mostrarSelectorProyecto,
      loading,
    ]);

    return (
      <Dialog
        open={mostrarSelectorProyecto && proyectosDisponibles.length > 0}
        onOpenChange={(open) => {
          console.log("🔄 Estado del modal:", open ? "abriendo" : "cerrando");
          setMostrarSelectorProyecto(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecciona un proyecto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {proyectosDisponibles.map((proyecto) => {
              // Obtener información de rol y permisos
              const roleName = proyecto.permissions?.role_name;
              const hasAdminPermission =
                proyecto.permissions?.can_manage_master_data;

              return (
                <ProCard
                  key={proyecto.id}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    console.log("🔄 Seleccionando proyecto:", proyecto);
                    seleccionarProyecto(proyecto.id);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{proyecto.name}</h3>
                    {roleName && (
                      <span
                        className={`text-xs rounded px-2 py-0.5 ${
                          hasAdminPermission
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {roleName}
                      </span>
                    )}
                  </div>
                  {proyecto.code && (
                    <p className="text-sm text-gray-500">
                      Código: {proyecto.code}
                    </p>
                  )}
                  {proyecto.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {proyecto.description}
                    </p>
                  )}
                  {proyecto.permissions && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {proyecto.permissions.can_manage_master_data && (
                        <span className="text-xs bg-blue-50 text-blue-700 rounded px-1.5 py-0.5">
                          Admin Datos
                        </span>
                      )}
                      {proyecto.permissions.can_create_batches && (
                        <span className="text-xs bg-green-50 text-green-700 rounded px-1.5 py-0.5">
                          Crear Lotes
                        </span>
                      )}
                      {proyecto.permissions.can_upload_files && (
                        <span className="text-xs bg-amber-50 text-amber-700 rounded px-1.5 py-0.5">
                          Subir Archivos
                        </span>
                      )}
                      {proyecto.permissions.can_bulk_edit_master_data && (
                        <span className="text-xs bg-purple-50 text-purple-700 rounded px-1.5 py-0.5">
                          Edición Masiva
                        </span>
                      )}
                    </div>
                  )}
                </ProCard>
              );
            })}
          </div>
          <DialogFooter>
            <CustomButton
              variant="outline"
              onClick={() => setMostrarSelectorProyecto(false)}
            >
              Cancelar
            </CustomButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Efecto para mostrar console.log con el proyecto actual
  useEffect(() => {
    if (proyectoActual) {
      console.log("🌟 PROYECTO ACTUAL:", proyectoActual);
    }
  }, [proyectoActual]);

  // Efecto para aplicar la configuración de UI cuando el proyecto actual cambie
  useEffect(() => {
    // Solo aplicar si el proyecto es una instancia de UserProjectSetting con configuración UI
    if (
      proyectoActual &&
      !cargandoProyectos &&
      "ui_theme" in proyectoActual &&
      "ui_font_pair" in proyectoActual &&
      "ui_is_dark_mode" in proyectoActual &&
      configAppliedForProjectId.current !== proyectoActual.id // Solo aplicar si no se ha aplicado ya
    ) {
      console.log("🔄 Proyecto actual cambió, aplicando configuración UI");
      aplicarConfiguracionUI(proyectoActual as UserProjectSetting);
    }
  }, [proyectoActual, cargandoProyectos]);

  // Efecto para escuchar cambios de preferencias UI (tema y fuente)
  useEffect(() => {
    if (!user || !proyectoActual) return;

    const handleThemePreferenceChange = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { theme, isDarkMode } = customEvent.detail;
      console.log("🎨 Evento theme-preference-change recibido:", {
        theme,
        isDarkMode,
      });

      try {
        await actualizarPreferenciasUI(user.id, proyectoActual.id, {
          ui_theme: theme,
          ui_is_dark_mode: isDarkMode,
        });
        console.log("✅ Preferencias de tema guardadas en base de datos");
      } catch (error) {
        console.error("❌ Error guardando preferencias de tema:", error);
      }
    };

    const handleFontPreferenceChange = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { fontPair } = customEvent.detail;
      console.log("🔤 Evento font-preference-change recibido:", { fontPair });

      try {
        await actualizarPreferenciasUI(user.id, proyectoActual.id, {
          ui_font_pair: fontPair,
        });
        console.log("✅ Preferencias de fuente guardadas en base de datos");
      } catch (error) {
        console.error("❌ Error guardando preferencias de fuente:", error);
      }
    };

    document.addEventListener(
      "theme-preference-change",
      handleThemePreferenceChange
    );
    document.addEventListener(
      "font-preference-change",
      handleFontPreferenceChange
    );

    return () => {
      document.removeEventListener(
        "theme-preference-change",
        handleThemePreferenceChange
      );
      document.removeEventListener(
        "font-preference-change",
        handleFontPreferenceChange
      );
    };
  }, [proyectoActual, user]);

  const debeBloquear =
    user && proyectosDisponibles.length > 0 && !proyectoActual;

  // Componente para mostrar overlay bloqueante mientras se cambia de proyecto
  const LoadingProjectOverlay = () => {
    if (!cambiandoProyecto) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.35)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "2rem 2.5rem",
            boxShadow: "0 2px 24px rgba(0,0,0,0.12)",
            textAlign: "center",
          }}
        >
          <div className="mb-6 flex justify-center">
            <SustratoLoadingLogo
              size={50}
              variant="spin-pulse"
              speed="normal"
              colorTransition
              showText
              text="Cambiando a nuevo proyecto..."
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        authInitialized,
        proyectoActual,
        proyectosDisponibles,
        cargandoProyectos,
        cambiandoProyecto,
        seleccionarProyecto,
        signIn: login,
        signUp: signup,
        logout,
      }}
    >
      {/* Overlay bloqueante si no hay proyecto seleccionado o se está cambiando de proyecto */}
      {(debeBloquear || cambiandoProyecto) && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.35)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "2rem 2.5rem",
              boxShadow: "0 2px 24px rgba(0,0,0,0.12)",
              textAlign: "center",
            }}
          >
            <div className="mb-6 flex justify-center">
              <SustratoLoadingLogo
                size={50}
                variant="spin-pulse"
                speed="normal"
                colorTransition
                showText
                text={
                  cambiandoProyecto
                    ? "Cambiando de proyecto..."
                    : "Selecciona un proyecto para continuar"
                }
              />
            </div>
            {!cambiandoProyecto && (
              <p className="mt-4">
                Debes elegir un proyecto válido antes de acceder a la
                plataforma.
              </p>
            )}
          </div>
        </div>
      )}
      {/* Overlay de carga durante cambio de proyecto */}
      <LoadingProjectOverlay />
      {/* Modal y resto de la app */}
      <ProyectoSelectorModal />
      <ProyectoIndicator />
      {/* Solo renderizar children si no está cambiando de proyecto y no debe bloquear */}
      {!debeBloquear && children}
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