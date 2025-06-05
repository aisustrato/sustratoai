// components/ui/color-scheme-switcher.tsx
// Versión: 1.1 (Lógica optimista: cambio visual inmediato, persistencia silenciosa de ui_theme)
"use client";

import { useTheme } from "@/app/theme-provider";
import { Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useMemo } from "react";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { generateFontSelectorTokens } from "@/lib/theme/components/font-selector-tokens"; // Asumo que estos tokens también son útiles aquí o se pueden adaptar

// --- NUEVAS IMPORTACIONES ---
import { useAuth } from "@/app/auth-provider";
import { actualizarPreferenciasUI } from "@/app/actions/proyecto-actions";
import { toast } from "sonner";

// Tipos para los esquemas de color disponibles
type ColorSchemeId = "blue" | "green" | "orange";

export function ColorSchemeSwitcher() {
  const { colorScheme, mode, setColorScheme, appColorTokens } = useTheme();
  const auth = useAuth(); // Hook para acceder al contexto de autenticación

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  


  const navTokens = useMemo(() => {
    return appColorTokens ? generateFontSelectorTokens(appColorTokens, mode) : null;
  }, [appColorTokens, mode]);

  const hasTokens = !!navTokens;


  const handleColorSchemeChange = async (scheme: ColorSchemeId) => {
    setIsOpen(false); // Cerrar el menú desplegable primero

    const visualChangeNeeded = scheme !== colorScheme;

    // 1. Aplicar el cambio visual inmediato si es diferente al visual actual
    if (visualChangeNeeded) {
      setColorScheme(scheme); // Esto actualiza ThemeProvider y la UI
      console.log(`[ColorSchemeSwitcher v1.1] Cambio visual inmediato a tema: ${scheme}`);
      // El setTimeout para forceUpdate se mantiene por ahora, como en el código original.
      // Considerar si es necesario después de pruebas completas.
    
    }

    // 2. Proceder con la persistencia silenciosa si es necesario
    const currentPersistedTheme = auth.proyectoActual?.ui_theme;
    const needsPersistence = auth.user?.id &&
                             auth.proyectoActual?.id &&
                             (scheme !== currentPersistedTheme || !currentPersistedTheme);

    if (!needsPersistence) {
      if (!auth.user?.id || !auth.proyectoActual?.id) {
        console.warn("[ColorSchemeSwitcher v1.1] Persistencia omitida: Usuario o proyecto no disponible.");
      } else if (scheme === currentPersistedTheme) {
        console.log("[ColorSchemeSwitcher v1.1] Persistencia omitida: El tema seleccionado ya está persistido.");
      }
      return;
    }
    
    console.log(`[ColorSchemeSwitcher v1.1] Iniciando persistencia silenciosa para tema: ${scheme}`);
    try {
      // Aseguramos que user.id y proyectoActual.id existen antes de usarlos
      // (aunque la lógica de needsPersistence ya debería haberlo cubierto)
      if (!auth.user?.id || !auth.proyectoActual?.id) {
          throw new Error("Usuario o ID de proyecto no disponible para la persistencia.");
      }

      const result = await actualizarPreferenciasUI(
        auth.user.id,
        auth.proyectoActual.id,
        { ui_theme: scheme } // Solo enviamos la preferencia de tema
      );

      if (result.success) {
        auth.setUiThemeLocal(scheme); // Actualiza AuthProvider silenciosamente
        console.log(`[ColorSchemeSwitcher v1.1] Persistencia exitosa y AuthProvider actualizado para tema: ${scheme}`);
      } else {
        toast.error(result.error || "Ups! Tuvimos un problema al guardar tu preferencia de tema. Es posible que en tu próximo inicio de sesión se cargue la configuración anterior.");
        console.error("[ColorSchemeSwitcher v1.1] Error en persistencia desde actualizarPreferenciasUI:", result.error);
      }
    } catch (error: any) {
      console.error("[ColorSchemeSwitcher v1.1] Excepción durante la persistencia del tema:", error);
      toast.error(error.message || "Ups! Hubo una excepción al guardar tu preferencia de tema. Es posible que en tu próximo inicio de sesión se cargue la configuración anterior.");
    }
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

  const menuVariants = { /* ... sin cambios ... */
    hidden: { opacity: 0, y: -5, scale: 0.95, transition: { duration: 0.2, ease: "easeInOut" }},
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" }},
    exit: { opacity: 0, y: -5, scale: 0.95, transition: { duration: 0.15, ease: "easeInOut" }},
  };
  const itemVariants = { /* ... sin cambios ... */
    hidden: { opacity: 0, x: -10 },
    visible: (custom: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: custom * 0.05, duration: 0.2, ease: "easeOut" },
    }),
  };

  const colorSchemes: { id: ColorSchemeId, name: string, bgColorClass: string }[] = [
    { id: "blue", name: "Azul", bgColorClass: "bg-blue-600" },
    { id: "green", name: "Verde", bgColorClass: "bg-green-600" },
    { id: "orange", name: "Naranja", bgColorClass: "bg-orange-500" },
  ];

  const getCurrentColorSchemeName = () => {
    // La UI del selector se basa en `colorScheme` de `useTheme()`, que es actualizado por `setColorScheme`
    const current = colorSchemes.find(s => s.id === colorScheme);
    return current ? current.name : "Azul"; // Fallback a Azul si no se encuentra
  };

  const getColorCircleClass = () => {
    const current = colorSchemes.find(s => s.id === colorScheme);
    return current ? current.bgColorClass : "bg-blue-600"; // Fallback
  };
  
  const defaultBackgroundColor = "rgba(200, 200, 200, 0.5)";
  const defaultBorderColor = "rgba(150, 150, 150, 0.3)";
  const defaultTextColor = "#333333";
  const defaultIconColor = "rgba(100, 100, 100, 0.7)";

  return (
    <div className="relative flex items-center gap-1">
      <Text variant="caption" color="neutral" colorVariant="textShade" className="text-xs opacity-50 whitespace-nowrap">
        Tema:
      </Text>
      
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between rounded-full border px-2 py-1 text-xs transition-colors"
        style={{
          backgroundColor: hasTokens && navTokens 
            ? `${navTokens.dropdown.backgroundColor}80` 
            : defaultBackgroundColor,
          borderColor: hasTokens && navTokens 
            ? `${navTokens.dropdown.borderColor}30` 
            : defaultBorderColor,
          minWidth: "80px",
          color: hasTokens && navTokens 
            ? navTokens.closedLabelText.color 
            : defaultTextColor,
        }}
        aria-label="Seleccionar tema de color"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center gap-1.5">
          <div className={`h-2.5 w-2.5 rounded-full ${getColorCircleClass()}`} />
          <span style={{ fontSize: "0.75rem", opacity: 0.7, }}>
            {getCurrentColorSchemeName()}
          </span>
        </div>
        <ChevronDown
          style={{
            color: hasTokens && navTokens 
              ? `${navTokens.icon.color}70` 
              : defaultIconColor,
            width: "12px", height: "12px", transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border"
            style={{
              backgroundColor: hasTokens && navTokens 
                ? navTokens.dropdown.backgroundColor 
                : "#ffffff",
              borderColor: hasTokens && navTokens 
                ? `${navTokens.dropdown.borderColor}40` 
                : defaultBorderColor,
              boxShadow: hasTokens && navTokens 
                ? navTokens.dropdown.boxShadow 
                : "0 4px 12px rgba(0, 0, 0, 0.1)",
              padding: "0.5rem",
            }}
            variants={menuVariants} initial="hidden" animate="visible" exit="exit"
          >
            <div className="grid gap-1">
              {colorSchemes.map((schemeItem, index) => (
                <motion.button
                  key={schemeItem.id}
                  variants={itemVariants} initial="hidden" animate="visible" custom={index}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 transition-colors"
                  style={{
                    backgroundColor: colorScheme === schemeItem.id && hasTokens && navTokens
                      ? `${navTokens.item.selected.backgroundColor}50` 
                      : colorScheme === schemeItem.id
                        ? "rgba(200, 200, 255, 0.25)" // Fallback si no hay tokens
                        : "transparent",
                  }}
                  onClick={() => handleColorSchemeChange(schemeItem.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${schemeItem.bgColorClass}`} />
                    <Text color="secondary" colorVariant="text" size="xs">
                      {schemeItem.name}
                    </Text>
                  </div>
                  {colorScheme === schemeItem.id && (
                    <Icon size="xs" color="primary" colorVariant="pure">
                      <Check className="h-3 w-3" />
                    </Icon>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}