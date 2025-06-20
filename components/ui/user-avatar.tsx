// components/ui/user-avatar.tsx
// Versión: 1.1 (Refactor handleProjectChange con setProyectoActivoLocal y toasts locales)
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Check, Loader2 } from "lucide-react"; // Añadido Loader2 para feedback visual
import { StandardIcon } from "@/components/ui/StandardIcon"; // Added StandardIcon import
import { useTheme } from "@/app/theme-provider";
import { useAuth } from "@/app/auth-provider";
import { toast } from "sonner"; // Re-importado para toasts locales
import { StandardText } from "@/components/ui/StandardText";
import { StandardSelect, type SelectOption } from "@/components/ui/StandardSelect"; // Assuming SelectOption type is compatible or similar
import { generateUserAvatarTokens } from "@/lib/theme/components/user-avatar-tokens";
import { actualizarProyectoActivo } from "@/app/actions/proyecto-actions"; // Importar server action y tipo

// Traducciones amigables para los nombres de permisos (sin cambios)
const permissionTranslations = {
  can_manage_master_data: "Administrar datos maestros",
  can_create_batches: "Crear lotes",
  can_upload_files: "Subir archivos",
  can_bulk_edit_master_data: "Edición masiva de datos",
};

export function UserAvatar() {
  const {
    user,
    logout,
    proyectoActual,
    proyectosDisponibles,
    setProyectoActivoLocal, // NUEVO: Reemplaza a seleccionarProyecto
  } = useAuth();
  const { mode, appColorTokens } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isChangingProject, setIsChangingProject] = useState(false); // NUEVO: Estado de carga local
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const avatarTokens = useMemo(() => {
    return appColorTokens
      ? generateUserAvatarTokens(appColorTokens, mode)
      : null;
  }, [appColorTokens, mode]);

  const hasTokens = !!avatarTokens;

  const getInitial = () => {
    const displayName =
      user?.user_metadata?.public_display_name ||
      user?.user_metadata?.name ||
      user?.email ||
      "U";
    return displayName.charAt(0).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const menuVariants = {
    hidden: { opacity: 0, y: -5, scale: 0.95, transition: { duration: 0.2, ease: "easeInOut" }},
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" }},
    exit: { opacity: 0, y: -5, scale: 0.95, transition: { duration: 0.15, ease: "easeInOut" }},
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (custom: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: custom * 0.05, duration: 0.2, ease: "easeOut" },
    }),
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      console.log("[UserAvatar v1.1] Logout completado, toast manejado por AuthProvider.");
    } catch (error) {
      console.error("[UserAvatar v1.1] Error al llamar a auth.logout:", error);
      // AuthProvider maneja el toast de error de logout si es necesario.
    }
  };

  // REFACTORIZADO: handleProjectChange
  const handleProjectChange = async (selectedProjectIdValue: string | string[] | undefined) => {
    setIsOpen(false); // Cerrar el menú independientemente del resultado

    let projectIdToProcess: string | undefined;

    if (typeof selectedProjectIdValue === "string" && selectedProjectIdValue) {
      projectIdToProcess = selectedProjectIdValue;
    } else if (Array.isArray(selectedProjectIdValue) && selectedProjectIdValue.length > 0) {
      projectIdToProcess = selectedProjectIdValue[0];
    }

    if (!projectIdToProcess) {
      console.warn("[UserAvatar v1.1] No se proporcionó un ID de proyecto válido.");
      return;
    }
    
    if (projectIdToProcess === proyectoActual?.id) {
      console.log("[UserAvatar v1.1] El proyecto seleccionado ya es el actual. No se necesita cambio.");
      return;
    }

    if (!user?.id) {
      console.error("[UserAvatar v1.1] User ID no disponible. No se puede cambiar el proyecto.");
      toast.error("Error de autenticación al cambiar proyecto.");
      return;
    }

    const finalProjectId = projectIdToProcess;
    const proyectoSeleccionado = proyectosDisponibles.find(p => p.id === finalProjectId);

    if (!proyectoSeleccionado) {
      console.error(`[UserAvatar v1.1] Proyecto con ID ${finalProjectId} no encontrado en proyectosDisponibles.`);
      toast.error("Error: Proyecto no encontrado en la lista disponible.");
      return;
    }

    setIsChangingProject(true);
    toast.loading("Cambiando proyecto...", { id: "changing-project-toast" });

    try {
      const result = await actualizarProyectoActivo(user.id, finalProjectId);
      if (result.success) {
        setProyectoActivoLocal(proyectoSeleccionado); // Actualiza el contexto localmente
        toast.success("Proyecto cambiado exitosamente.", { id: "changing-project-toast" });
        console.log(`[UserAvatar v1.1] Proyecto cambiado a ${proyectoSeleccionado.name} via setProyectoActivoLocal.`);
      } else {
        toast.error(result.error || "Error al cambiar de proyecto.", { id: "changing-project-toast" });
        console.error("[UserAvatar v1.1] Error desde actualizarProyectoActivo:", result.error);
      }
    } catch (error) {
      console.error("[UserAvatar v1.1] Excepción al cambiar de proyecto:", error);
      toast.error("Se produjo una excepción al cambiar de proyecto.", { id: "changing-project-toast" });
    } finally {
      setIsChangingProject(false);
    }
  };


  const projectOptions: SelectOption[] = proyectosDisponibles.map(
    (proyecto) => ({
      value: proyecto.id,
      label: proyecto.name,
      disabled: isChangingProject, // Deshabilitar opciones mientras se cambia
    })
  );

  const activePermissions = proyectoActual?.permissions
    ? Object.entries(proyectoActual.permissions)
        .filter(([key, value]) => value === true && key !== "role_name")
        .map(([key]) => key as keyof typeof permissionTranslations)
    : [];

  const shouldShowProjectSelector = proyectosDisponibles.length > 0; // Mostrar siempre si hay proyectos, incluso si solo hay uno para ver el rol.

  const defaultBackgroundColor = "rgba(200, 200, 200, 0.5)";
  const defaultBorderColor = "rgba(150, 150, 150, 0.3)";
  const defaultTextColor = "#333333";

  const userDisplayName =
    user?.user_metadata?.public_display_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "Usuario";

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center rounded-full border transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        style={{
          background: hasTokens && avatarTokens
            ? avatarTokens.avatar.backgroundGradient
            : defaultBackgroundColor,
          borderColor: hasTokens && avatarTokens
            ? avatarTokens.avatar.borderColor
            : defaultBorderColor,
          width: "36px",
          height: "36px",
          color: hasTokens && avatarTokens
            ? avatarTokens.avatar.textColor
            : defaultTextColor,
          transition: hasTokens && avatarTokens
            ? avatarTokens.avatar.transition
            : "all 0.2s ease-in-out",
        }}
        aria-label="Menú de usuario"
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={isChangingProject} // Deshabilitar botón mientras se cambia
      >
        {isChangingProject ? (
          <StandardIcon><Loader2 className="h-4 w-4 animate-spin" /></StandardIcon>
        ) : (
          <StandardText
            size="2xl"
            weight="bold"
            colorScheme="primary"
            colorShade="text"
            style={{
              fontWeight: hasTokens && avatarTokens
                ? avatarTokens.avatar.fontWeight
                : "700",
            }}
          >
            {getInitial()}
          </StandardText>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && !isChangingProject && ( // No mostrar menú si está cargando cambio de proyecto
          <motion.div
            ref={menuRef}
            className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border"
            style={{
              backgroundColor: hasTokens && avatarTokens
                ? avatarTokens.menu.backgroundColor
                : "#ffffff",
              borderColor: hasTokens && avatarTokens
                ? avatarTokens.menu.borderColor
                : defaultBorderColor,
              boxShadow: hasTokens && avatarTokens
                ? avatarTokens.menu.boxShadow
                : "0 4px 12px rgba(0, 0, 0, 0.1)",
              padding: hasTokens && avatarTokens
                ? avatarTokens.menu.padding
                : "0.75rem",
              borderRadius: hasTokens && avatarTokens
                ? avatarTokens.menu.borderRadius
                : "0.75rem",
            }}
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Información del usuario */}
            <div
              className="mb-3 px-2 py-1 border-b pb-3"
              style={{
                borderColor: hasTokens && avatarTokens
                  ? avatarTokens.menuHeader.borderColor
                  : "rgba(150, 150, 150, 0.3)",
              }}
            >
              <StandardText
                preset="title"
                size="base"
                weight="medium"
                colorScheme="primary"
                colorShade="text"
                style={{
                  color: hasTokens && avatarTokens
                    ? avatarTokens.menuHeader.titleColor
                    : undefined,
                }}
              >
                {userDisplayName}
              </StandardText>
              <StandardText
                size="xs"
                colorScheme="neutral"
                colorShade="textShade"
                className="opacity-70"
                style={{
                  color: hasTokens && avatarTokens
                    ? avatarTokens.menuHeader.subtitleColor
                    : undefined,
                }}
              >
                {user?.email}
              </StandardText>
            </div>

            {/* Proyecto actual */}
            {shouldShowProjectSelector ? (
               <div className="mb-3">
               <StandardText
                 size="xs"
                 weight="medium"
                 colorScheme="neutral"
                 colorShade="textShade"
                 className="mb-1 px-2"
               >
                 Proyecto actual
               </StandardText>
               <div className="px-2 mb-2">
                 <StandardSelect
                   size="sm"
                   options={projectOptions}
                   value={proyectoActual?.id || ""}
                   onChange={handleProjectChange}
                   placeholder="Seleccionar proyecto"
                   disabled={isChangingProject} // Deshabilitar select mientras se cambia
                 />
                 {proyectoActual && proyectoActual.permissions?.role_name && (
                   <div className="mt-2 flex items-center">
                     <StandardText size="xs" weight="medium" colorScheme="neutral" className="mr-2">
                       Rol:
                     </StandardText>
                     <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                       {proyectoActual.permissions.role_name}
                     </span>
                   </div>
                 )}
               </div>
             </div>
            ) : (
              proyectoActual && ( // Mostrar solo si hay un proyecto actual y no hay selector
                <div className="mb-3">
                  <StandardText size="xs" weight="medium" colorScheme="neutral" colorShade="textShade" className="mb-1 px-2">
                    Proyecto actual
                  </StandardText>
                  <div className="px-2 py-1 mb-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <StandardText size="sm" weight="medium" colorScheme="primary">
                      {proyectoActual.name}
                    </StandardText>
                    {proyectoActual.permissions?.role_name && (
                      <div className="mt-1 flex items-center">
                          <StandardText size="xs" weight="medium" colorScheme="neutral" className="mr-2">
                            Rol:
                          </StandardText>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                          {proyectoActual.permissions.role_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}


            {/* Permisos activos */}
            {activePermissions.length > 0 && (
              <div className="mb-3">
                <StandardText
                  size="xs"
                  weight="medium"
                  colorScheme="neutral"
                  colorShade="textShade"
                  className="mb-1 px-2"
                >
                  Tus permisos
                </StandardText>
                <div className="px-2 space-y-1">
                  {activePermissions.map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center gap-2 py-0.5"
                    >
                      <StandardIcon styleType="outline" size="xs" colorScheme="tertiary" colorShade="pure">
                        <Check className="h-3.5 w-3.5" />
                      </StandardIcon>
                      <StandardText size="xs" colorScheme="neutral">
                        {permissionTranslations[permission] || permission}
                      </StandardText>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className="h-px w-full bg-gray-200 dark:bg-gray-700 my-2" // Separador visual
              style={{
                backgroundColor: hasTokens && avatarTokens
                  ? avatarTokens.menuDivider.color
                  : undefined,
                margin: hasTokens && avatarTokens
                  ? avatarTokens.menuDivider.margin
                  : undefined,
              }}
            ></div>

            <div className="grid gap-1 mt-2">
              <motion.button
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                custom={0}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={handleLogout}
              >
                <div className="flex items-center gap-2">
                  <StandardIcon colorScheme="secondary" colorShade="pure" styleType="outline">
                    <LogOut className="h-4 w-4" />
                  </StandardIcon>
                  <StandardText colorScheme="secondary" colorShade="pure" size="sm">
                    Cerrar sesión
                  </StandardText>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}