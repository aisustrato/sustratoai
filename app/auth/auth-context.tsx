"use client";

import React, { 
    createContext, 
    useContext, 
    useEffect, 
    useState, 
    // 👇 Eliminado useRef ya que no se usaba en el código que me pasaste para esta versión
    //    Si lo necesitas para otras cosas, puedes re-añadirlo.
} from "react";
import { useRouter } from "next/navigation"; // Eliminado usePathname si no se usa
import { User, Session } from "@supabase/supabase-js";
// 👇 Asumo que createBrowserSupabaseClient, signInWithEmail, signOut, signUp están en un archivo client.ts
//    Si están en @/lib/supabase, ajusta la ruta.
import { createBrowserSupabaseClient, signInWithEmail, signOut, signUp } from "./client"; 
import { 
    // 👇 CORRECCIONES EN LOS IMPORTS DE PROYECTO-ACTIONS 👇
    obtenerProyectosConSettingsUsuario, // NOMBRE CORRECTO DE LA FUNCIÓN
    obtenerProyectoPorId, 
    type Project,                     // TIPO CORRECTO ES Project (CON J)
    type UserProjectSetting,           // AÑADIDO UserProjectSetting para el tipo de proyectoActual y proyectosDisponibles
    type ResultadoOperacion,           // AÑADIDO ResultadoOperacion para tipar los retornos
} from "@/app/actions/proyecto-actions"; // MANTENGO ESTA RUTA SEGÚN TU ERROR

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  proyectoActual: UserProjectSetting | null; // CAMBIADO A UserProjectSetting
  proyectosDisponibles: UserProjectSetting[]; // CAMBIADO A UserProjectSetting[]
  cargandoProyectos: boolean;
  seleccionarProyecto: (proyectoId: string) => Promise<void>;
  signIn: ( email: string, password: string ) => Promise<{ error: any; success: boolean; }>;
  signUp: ( email: string, password: string ) => Promise<{ error: any; success: boolean; }>;
  logout: () => Promise<void>;
  // authInitialized no estaba en tu tipo, pero sí en el estado, la quito para consistencia.
  // cambiandoProyecto tampoco estaba en el tipo, la quito.
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [proyectoActual, setProyectoActual] = useState<UserProjectSetting | null>(null); // Tipo corregido
  const [proyectosDisponibles, setProyectosDisponibles] = useState<UserProjectSetting[]>([]); // Tipo corregido
  const [cargandoProyectos, setCargandoProyectos] = useState(false);
  // const [mostrarSelectorProyecto, setMostrarSelectorProyecto] = useState(false); // Comentado si no se usa en el return

  const cargarProyectosUsuario = async (userId: string) => {
    if (!userId) return;    
    console.log("🔍 Cargando proyectos para usuario:", userId);
    setCargandoProyectos(true);
    try {
      // 👇 Usar la función importada correctamente
      const resultado: ResultadoOperacion<UserProjectSetting[]> = await obtenerProyectosConSettingsUsuario(userId);
      console.log("📊 Proyectos obtenidos:", resultado);
      
      if (resultado.success) { // Verificar .success
        setProyectosDisponibles(resultado.data); // resultado.data es UserProjectSetting[]
        console.log(`🔢 Número de proyectos encontrados: ${resultado.data.length}`);
        
        const proyectoGuardadoId = localStorage.getItem('proyectoActualId');
        console.log("💾 Proyecto guardado en localStorage:", proyectoGuardadoId);
        
        let proyectoParaActivar: UserProjectSetting | null = null;

        if (proyectoGuardadoId) {
          proyectoParaActivar = resultado.data.find((p) => p.id === proyectoGuardadoId) || null;
          if (proyectoParaActivar) {
            console.log("✅ Usando proyecto guardado:", proyectoParaActivar);
          } else {
            console.log("⚠️ Proyecto guardado no encontrado.");
          }
        }
        
        if (!proyectoParaActivar && resultado.data.length > 0) {
          // Si no hay guardado o no se encontró, o si solo hay uno
          if (resultado.data.length === 1) {
            console.log("🔄 Auto-seleccionando único proyecto disponible");
            proyectoParaActivar = resultado.data[0];
          } else {
            // Si hay múltiples y ninguno guardado/encontrado, podrías mostrar selector o tomar el primero.
            // Por ahora, si no hay activo y hay varios, tomamos el primero como fallback.
            console.log("🔄 Múltiples proyectos, seleccionando el primero como fallback:", resultado.data[0]);
            // setMostrarSelectorProyecto(true); // Descomenta si quieres mostrar selector
            proyectoParaActivar = resultado.data[0]; // Opcional: seleccionar el primero si no hay activo
          }
        }

        if (proyectoParaActivar) {
            setProyectoActual(proyectoParaActivar);
            localStorage.setItem('proyectoActualId', proyectoParaActivar.id);
            // Aquí podrías llamar a aplicarConfiguracionUI(proyectoParaActivar) si esa función existe en este contexto
        } else if (resultado.data.length === 0) {
            setProyectoActual(null); // No hay proyectos, limpiar el actual
            localStorage.removeItem('proyectoActualId');
        }

      } else { // !resultado.success
        console.error("❌ Error al cargar proyectos del usuario (API):", resultado.error); // Acceso seguro a .error
      }
    } catch (error) {
      console.error("❌ Excepción al cargar proyectos del usuario:", error);
    } finally {
      setCargandoProyectos(false);
    }
  };
  
  const seleccionarProyecto = async (proyectoId: string) => {
    try {
      // 👇 Usar ResultadoOperacion<Project | null> para el tipo de retorno
      const resultado: ResultadoOperacion<Project | null> = await obtenerProyectoPorId(proyectoId);
      
      if (resultado.success) { // Verificar .success
        if (resultado.data) { // Verificar que .data no sea null
          // Necesitamos convertir Project a UserProjectSetting para setProyectoActual
          // Esto es un placeholder, necesitarías la lógica real para obtener los settings del rol y UI
          const proyectoComoSetting: UserProjectSetting = {
            ...(resultado.data as Project), // Cast a Project
            project_role_id: proyectoActual?.project_role_id || "default_placeholder", // Usar del actual o un default
            ui_theme: proyectoActual?.ui_theme || null,
            ui_font_pair: proyectoActual?.ui_font_pair || null,
            ui_is_dark_mode: proyectoActual?.ui_is_dark_mode || false,
            is_active_for_user: true, // Al seleccionar, se vuelve activo
            permissions: proyectoActual?.permissions || null, // Usar del actual o un default
            contextual_notes: proyectoActual?.contextual_notes || null,
            contact_email_for_project: proyectoActual?.contact_email_for_project || null
          };
          setProyectoActual(proyectoComoSetting);
          localStorage.setItem('proyectoActualId', proyectoId);
          // setMostrarSelectorProyecto(false); // Si usas el selector modal
          console.log("✅ Proyecto seleccionado:", proyectoComoSetting);
        } else {
          console.warn("⚠️ Proyecto no encontrado al seleccionar (ID:", proyectoId, ")");
          // Quizás limpiar proyectoActual si el ID no se encuentra
          // setProyectoActual(null); 
          // localStorage.removeItem('proyectoActualId');
        }
      } else { // !resultado.success
        // 👇 CORRECCIÓN: Acceder a resultado.error aquí
        console.error("❌ Error al seleccionar proyecto (API):", resultado.error); 
      }
    } catch (error) {
      console.error("❌ Excepción al seleccionar proyecto:", error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const supabase = createBrowserSupabaseClient();
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          // Cargar proyectos DESPUÉS de establecer el usuario
          // El timeout aquí puede no ser la mejor solución para sincronización
          // Es mejor depender del estado del usuario.
          // La carga de proyectos se moverá a un useEffect que dependa de 'user'.
        }
      } catch (error) {
        console.error("Error al inicializar la autenticación:", error);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
    
    const supabase = createBrowserSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("🔄 Evento de autenticación:", event, session);
        setSession(session);
        setUser(session?.user || null);
        
        if (event === "SIGNED_OUT") {
          console.log("🚪 Usuario cerró sesión");
          setProyectoActual(null);
          setProyectosDisponibles([]);
          localStorage.removeItem('proyectoActualId');
        }
        // La carga de proyectos por SIGNED_IN se manejará por el useEffect que depende de 'user'
      }
    );
    return () => { subscription.unsubscribe(); };
  }, []);

  // Nuevo useEffect para cargar proyectos cuando el usuario cambia o se establece por primera vez
  useEffect(() => {
    if (user?.id && !cargandoProyectos) { // Solo cargar si hay usuario y no se está cargando ya
        console.log("useEffect[user]: Usuario detectado/cambiado, cargando proyectos...");
        cargarProyectosUsuario(user.id);
    } else if (!user) {
        // Limpiar datos de proyectos si el usuario hace logout o la sesión expira
        setProyectoActual(null);
        setProyectosDisponibles([]);
        localStorage.removeItem('proyectoActualId');
    }
  }, [user]); // Dependencia en 'user'


  const login = async (email: string, password: string) => { /* ... tu código original ... */ return {} as any };
  const signup = async (email: string, password: string) => { /* ... tu código original ... */ return {} as any };
  const logout = async () => { /* ... tu código original ... */ };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        proyectoActual,
        proyectosDisponibles,
        cargandoProyectos,
        seleccionarProyecto,
        signIn: login,
        signUp: signup,
        logout,
      }}
    >
      {children}
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