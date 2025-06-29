// components/ui/color-scheme-switcher.tsx
// Versión: 1.1 (Lógica optimista: cambio visual inmediato, persistencia silenciosa de ui_theme)
"use client";

import { useTheme } from "@/app/theme-provider";
import { Check, ChevronDown, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useMemo } from "react";
import { StandardText } from "@/components/ui/StandardText";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { generateThemeSelectorTokens } from "@/lib/theme/components/theme-selector-tokens";

// --- NUEVAS IMPORTACIONES ---
import { useAuth } from "@/app/auth-provider";
import { actualizarPreferenciasUI } from "@/app/actions/proyecto-actions";
import { toast } from "sonner";

// Tipos para los esquemas de color disponibles
type ColorSchemeId = "blue" | "green" | "orange" | "artisticGreen" | "graphite" | "roseGold" | "midnight" | "burgundy" | "zenith";

export function ColorSchemeSwitcher() {
  const { colorScheme, mode, setColorScheme, appColorTokens } = useTheme();
  const auth = useAuth(); // Hook para acceder al contexto de autenticación

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  


  const themeSelectorTokens = useMemo(() => {
    return appColorTokens ? generateThemeSelectorTokens(appColorTokens, mode) : null;
  }, [appColorTokens, mode]);

  const hasTokens = !!themeSelectorTokens;


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
    } catch (error: unknown) {
      console.error("[ColorSchemeSwitcher v1.1] Excepción durante la persistencia del tema:", error);
      const errorMessage = error instanceof Error ? error.message : "Ups! Hubo una excepción al guardar tu preferencia de tema. Es posible que en tu próximo inicio de sesión se cargue la configuración anterior.";
      toast.error(errorMessage);
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

  const colorSchemes: Array<{ id: ColorSchemeId; name: string; bgColorClass: string }> = [
    { id: "blue", name: "Azul", bgColorClass: "bg-blue-600" },
    { id: "green", name: "Verde", bgColorClass: "bg-green-600" },
    { id: "orange", name: "Naranja", bgColorClass: "bg-orange-500" },
    { id: "artisticGreen", name: "Verde Artístico", bgColorClass: "bg-emerald-600" },
    { id: "graphite", name: "Grafito", bgColorClass: "bg-gray-500" },
    { id: "roseGold", name: "Oro Rosado", bgColorClass: "bg-rose-300" },
    { id: "midnight", name: "Medianoche", bgColorClass: "bg-[#0A0F2C]" }, // Azul muy oscuro
    { id: "burgundy", name: "Burdeos", bgColorClass: "bg-[#8D0027]" },
    { id: "zenith", name: "Zenith", bgColorClass: "bg-[#A0D2DB]" },
  ];

  const getCurrentColorSchemeName = () => {
    // La UI del selector se basa en `colorScheme` de `useTheme()`, que es actualizado por `setColorScheme`
    const current = colorSchemes.find(s => s.id === colorScheme);
    return current ? current.name : "Azul"; // Fallback a Azul si no se encuentra
  };


  
  const defaultBackgroundColor = "rgba(200, 200, 200, 0.5)";
  const defaultBorderColor = "rgba(150, 150, 150, 0.3)";
  const defaultTextColor = "#333333";
  const defaultIconColor = "rgba(100, 100, 100, 0.7)";

  return (
    <div className="relative flex items-center gap-2 w-full pl-2">
      <StandardIcon 
        styleType="outline"
        colorScheme="neutral"
        colorShade="textShade"
        size="sm"
        className="opacity-80 flex-shrink-0"
      >
        <Palette className="w-5 h-5" />
      </StandardIcon>
      <div className="relative w-full">
        <motion.button
          ref={buttonRef}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(!isOpen)}
          
          className="flex items-center justify-between w-full rounded-full border px-2 py-0.5 text-xs transition-colors"
          style={{
            backgroundColor: hasTokens && themeSelectorTokens 
              ? themeSelectorTokens.dropdown.backgroundColor
              : defaultBackgroundColor,
            borderColor: hasTokens && themeSelectorTokens 
              ? themeSelectorTokens.dropdown.borderColor
              : defaultBorderColor,
            color: hasTokens && themeSelectorTokens 
              ? themeSelectorTokens.closedLabelText.color
              : defaultTextColor,
            maxWidth: "150px"
          }}
          aria-label="Seleccionar tema de color"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{
                backgroundColor: appColorTokens
                  ? appColorTokens.primary.pure
                  : "#3D7DF6",
              }}
            />
            <StandardText 
              colorScheme="secondary" 
              colorShade="text" 
              preset="body" 
              size ="2xs"
              className="whitespace-nowrap overflow-hidden text-ellipsis opacity-90"
              
            >
              {getCurrentColorSchemeName()}
            </StandardText>
          </div>
          <ChevronDown
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            style={{
              color: hasTokens && themeSelectorTokens 
                ? themeSelectorTokens.icon.color
                : defaultIconColor,
              width: "10px",
              height: "10px",
              flexShrink: 0
            }}
          />
        </motion.button>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border"
            style={{
              backgroundColor: hasTokens && themeSelectorTokens 
                ? themeSelectorTokens.dropdown.backgroundColor 
                : "#ffffff",
              borderColor: hasTokens && themeSelectorTokens 
                ? themeSelectorTokens.dropdown.borderColor
                : defaultBorderColor,
              boxShadow: hasTokens && themeSelectorTokens 
                ? themeSelectorTokens.dropdown.boxShadow 
                : "0 4px 12px rgba(0, 0, 0, 0.1)",
              padding: themeSelectorTokens?.dropdown.padding || "0.5rem",
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
                    backgroundColor: colorScheme === schemeItem.id && hasTokens && themeSelectorTokens
                      ? themeSelectorTokens.item.selected.backgroundColor
                      : "transparent"
                  }}
                  whileHover={{
                    backgroundColor: hasTokens && themeSelectorTokens
                      ? themeSelectorTokens.item.hover.backgroundColor
                      : "rgba(0, 0, 0, 0.05)"
                  }}
                  onClick={() => handleColorSchemeChange(schemeItem.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${schemeItem.bgColorClass}`} />
                    <StandardText colorScheme="secondary" colorShade="text" preset="body" className="text-xs">
                      {schemeItem.name}
                    </StandardText>
                  </div>
                  {colorScheme === schemeItem.id && (
                    <StandardIcon styleType="outline" size="md" colorScheme="primary" colorShade="pure"><Check className="h-3 w-3" /></StandardIcon>
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