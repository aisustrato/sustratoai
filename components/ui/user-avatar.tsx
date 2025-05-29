"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut,Check } from "lucide-react";
import { useTheme } from "@/app/theme-provider";
import { useAuth } from "@/app/auth-provider";
import { toast } from "sonner";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { SelectCustom, type SelectOption } from "@/components/ui/select-custom";
import React from "react";
import { generateUserAvatarTokens } from "@/lib/theme/components/user-avatar-tokens";

// Traducciones amigables para los nombres de permisos
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
    seleccionarProyecto,
  } = useAuth();
  const { mode, appColorTokens } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Usar useMemo para generar los tokens solo cuando cambian las dependencias
  const avatarTokens = appColorTokens
    ? generateUserAvatarTokens(appColorTokens, mode)
    : null;

  // Verificar si tenemos tokens válidos
  const hasTokens = !!avatarTokens;

  // Obtener la primera letra del nombre de usuario desde el perfil
  const getInitial = () => {
    // Buscar un nombre para mostrar, con fallbacks
  
    const displayName =
      user?.user_metadata?.public_display_name ||
      user?.user_metadata?.name ||
      user?.email ||
      "U";

    // Obtener la primera letra y convertirla a mayúscula
    return displayName.charAt(0).toUpperCase();
  };

  // Cerrar el menú cuando se hace clic fuera de él
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

  // Variantes de animación para el menú
  const menuVariants = {
    hidden: {
      opacity: 0,
      y: -5,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -5,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: "easeInOut",
      },
    },
  };

  // Variantes para los elementos del menú
  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (custom: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: custom * 0.05,
        duration: 0.2,
        ease: "easeOut",
      },
    }),
  };

  // Manejar el cierre de sesión
  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      toast.success("Sesión cerrada correctamente");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  // Manejar cambio de proyecto
  const handleProjectChange = (projectId: string | string[] | undefined) => {
    if (typeof projectId === "string" && projectId) {
      seleccionarProyecto(projectId);
      toast.success("Proyecto cambiado exitosamente");
    } else if (Array.isArray(projectId) && projectId.length > 0) {
      // Handle array case if needed
      seleccionarProyecto(projectId[0]);
      toast.success("Proyecto cambiado exitosamente");
    }
  };

  // Convertir proyectos disponibles a opciones para el selector
  const projectOptions: SelectOption[] = proyectosDisponibles.map(
    (proyecto) => ({
      value: proyecto.id,
      label: proyecto.name,
      disabled: false,
    })
  );

  // Verificar si hay permisos activos en el proyecto actual
  const activePermissions = proyectoActual?.permissions
    ? Object.entries(proyectoActual.permissions)
        .filter(([key, value]) => value === true && key !== "role_name")
        .map(([key]) => key as keyof typeof permissionTranslations)
    : [];

  // Determinar si mostrar el selector de proyectos
  const shouldShowProjectSelector = proyectosDisponibles.length > 1;

  // Valores por defecto en caso de que no haya tokens
  const defaultBackgroundColor = "rgba(200, 200, 200, 0.5)";
  const defaultBorderColor = "rgba(150, 150, 150, 0.3)";
  const defaultTextColor = "#333333";

  // Obtener el nombre de usuario para mostrar
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
      >
        <Text 
          size="2xl" 
          weight="bold" 
          color="primary" 
          colorVariant="text"
          style={{
            fontWeight: hasTokens && avatarTokens
              ? avatarTokens.avatar.fontWeight
              : "700",
          }}
        >
          {getInitial()}
        </Text>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
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
              <Text
                variant="title"
                size="base"
                weight="medium"
                color="primary"
                colorVariant="text"
                style={{
                  color: hasTokens && avatarTokens
                    ? avatarTokens.menuHeader.titleColor
                    : undefined,
                }}
              >
                {userDisplayName}
              </Text>
              <Text
                size="xs"
                color="neutral"
                colorVariant="textShade"
                className="opacity-70"
                style={{
                  color: hasTokens && avatarTokens
                    ? avatarTokens.menuHeader.subtitleColor
                    : undefined,
                }}
              >
                {user?.email}
              </Text>
            </div>

            {/* Proyecto actual */}
            <div className="mb-3">
              <Text
                size="xs"
                weight="medium"
                color="neutral"
                colorVariant="textShade"
                className="mb-1 px-2"
              >
                Proyecto actual
              </Text>

              {shouldShowProjectSelector ? (
                <div className="px-2 mb-2">
                  <SelectCustom
                    size="sm"
                    options={projectOptions}
                    value={proyectoActual?.id || ""}
                    onChange={handleProjectChange}
                    placeholder="Seleccionar proyecto"
                  />

                  {/* Mostrar rol solo cuando hay un proyecto seleccionado */}
                  {proyectoActual && proyectoActual.permissions?.role_name && (
                    <div className="mt-2 flex items-center">
                      <Text
                        size="xs"
                        weight="medium"
                        color="neutral"
                        className="mr-2"
                      >
                        Rol:
                      </Text>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                        {proyectoActual.permissions.role_name}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-2 py-1 mb-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <Text size="sm" weight="medium" color="primary">
                    {proyectoActual?.name || "No hay proyectos"}
                  </Text>

                  {/* Mostrar rol solo cuando hay un proyecto seleccionado */}
                  {proyectoActual && proyectoActual.permissions?.role_name && (
                    <div className="mt-1 flex items-center">
                      <Text
                        size="xs"
                        weight="medium"
                        color="neutral"
                        className="mr-2"
                      >
                        Rol:
                      </Text>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                        {proyectoActual.permissions.role_name}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Permisos activos - solo si hay al menos uno */}
            {activePermissions.length > 0 && (
              <div className="mb-3">
                <Text
                  size="xs"
                  weight="medium"
                  color="neutral"
                  colorVariant="textShade"
                  className="mb-1 px-2"
                >
                  Tus permisos
                </Text>
                <div className="px-2 space-y-1">
                  {activePermissions.map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center gap-2 py-0.5"
                    >
                      <Icon size="xs" color="success">
                        <Check className="h-3.5 w-3.5" />
                      </Icon>
                      <Text size="xs" color="neutral">
                        {permissionTranslations[permission] || permission}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div 
              className="h-px w-full bg-gray-200 dark:bg-gray-700 my-2"
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
              {/* Opción para cerrar sesión */}
              <motion.button
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                custom={0}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={handleLogout}
              >
                <div className="flex items-center gap-2">
                  <Icon size="sm" color="secondary" colorVariant="text">
                    <LogOut className="h-4 w-4" />
                  </Icon>
                  <Text color="secondary" colorVariant="text" size="sm">
                    Cerrar sesión
                  </Text>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
