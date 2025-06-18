// components/ui/font-theme-switcher.tsx
// Versión: 1.3 (Lógica optimista: cambio visual inmediato, persistencia silenciosa en éxito)
"use client";

import { useFontTheme } from "@/app/font-provider";
import { ChevronDown } from "lucide-react"; // Loader2 ya no es necesario para la persistencia aquí
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useTheme } from "@/app/theme-provider";
import { fontThemeConfig } from "@/lib/fonts";
import { generateFontSelectorTokens } from "@/lib/theme/components/font-selector-tokens";
import { StandardText } from "@/components/ui/StandardText";

import { useAuth } from "@/app/auth-provider";
import { actualizarPreferenciasUI } from "@/app/actions/proyecto-actions";
import { toast } from "sonner";

export function FontThemeSwitcher() {
  const { fontTheme, setFontTheme } = useFontTheme(); // Para el cambio visual inmediato y la UI del selector
  const auth = useAuth();
  const { mode, appColorTokens } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  // Ya no se necesita isPersistingFont para la UI, la persistencia es silenciosa en éxito
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fontTokens = generateFontSelectorTokens(appColorTokens, mode);

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
  
  const fontStyles = [ /* ... sin cambios ... */
    { id: "sustrato", name: "Estilo Sustrato", headingStyle: { fontFamily: "var(--font-ubuntu), 'Ubuntu', sans-serif", fontWeight: "700" }, bodyStyle: { fontFamily: "var(--font-ubuntu), 'Ubuntu', sans-serif", fontWeight: "400" }},
    { id: "classic", name: "Estilo Clásico", headingStyle: { fontFamily: fontThemeConfig.classic.heading, fontWeight: fontThemeConfig.classic.headingWeight }, bodyStyle: { fontFamily: fontThemeConfig.classic.body, fontWeight: fontThemeConfig.classic.bodyWeight }},
    { id: "technical", name: "Estilo Técnico", headingStyle: { fontFamily: fontThemeConfig.technical.heading, fontWeight: fontThemeConfig.technical.headingWeight, letterSpacing: fontThemeConfig.technical.letterSpacingHeadings }, bodyStyle: { fontFamily: fontThemeConfig.technical.body, fontWeight: fontThemeConfig.technical.bodyWeight, letterSpacing: fontThemeConfig.technical.letterSpacingBody }},
    { id: "creative", name: "Estilo Creativo", headingStyle: { fontFamily: fontThemeConfig.creative.heading, fontWeight: fontThemeConfig.creative.headingWeight, letterSpacing: fontThemeConfig.creative.letterSpacingHeadings }, bodyStyle: { fontFamily: fontThemeConfig.creative.body, fontWeight: fontThemeConfig.creative.bodyWeight, letterSpacing: fontThemeConfig.creative.letterSpacingBody }},
    { id: "accessible", name: "Estilo Accesible", headingStyle: { fontFamily: fontThemeConfig.accessible.heading, fontWeight: fontThemeConfig.accessible.headingWeight, letterSpacing: fontThemeConfig.accessible.letterSpacingHeadings }, bodyStyle: { fontFamily: fontThemeConfig.accessible.body, fontWeight: fontThemeConfig.accessible.bodyWeight, letterSpacing: fontThemeConfig.accessible.letterSpacingBody }},
    { id: "modern", name: "Estilo Moderno", headingStyle: { fontFamily: fontThemeConfig.modern.heading, fontWeight: fontThemeConfig.modern.headingWeight }, bodyStyle: { fontFamily: fontThemeConfig.modern.body, fontWeight: fontThemeConfig.modern.bodyWeight }},
    { id: "minimalist", name: "Estilo Minimalista", headingStyle: { fontFamily: fontThemeConfig.minimalist.heading, fontWeight: fontThemeConfig.minimalist.headingWeight, letterSpacing: fontThemeConfig.minimalist.letterSpacingHeadings }, bodyStyle: { fontFamily: fontThemeConfig.minimalist.body, fontWeight: fontThemeConfig.minimalist.bodyWeight, letterSpacing: fontThemeConfig.minimalist.letterSpacingBody }},
  ];

  const getCurrentFontPairName = () => {
    const currentFont = fontStyles.find(font => font.id === fontTheme);
    return currentFont ? currentFont.name : "Default";
  };
  
  const getCurrentFontStyle = () => {
    const currentFont = fontStyles.find(font => font.id === fontTheme);
    return currentFont ? currentFont.bodyStyle : fontStyles[0].bodyStyle;
  };

  const sampleBodyText = "Este es un ejemplo de texto con esta fuente.";

  const handleSelectFont = async (newFontPairId: string) => {
    setIsOpen(false); // Cerrar el menú desplegable

    const currentGlobalFontPair = auth.proyectoActual?.ui_font_pair;
    const visualFontChanged = newFontPairId !== fontTheme;

    // 1. Aplicar el cambio visual inmediato si es diferente al visual actual
    if (visualFontChanged) {
      setFontTheme(newFontPairId as any);
      console.log(`[FontThemeSwitcher v1.3] Cambio visual inmediato a: ${newFontPairId}`);
    }

    // 2. Verificar si necesitamos persistir los cambios
    if (!auth.user?.id || !auth.proyectoActual?.id) {
      console.warn("[FontThemeSwitcher v1.3] Persistencia omitida: Usuario o proyecto no disponible.");
      return;
    }

    // 3. Verificar si el valor ya está persistido
    if (newFontPairId === currentGlobalFontPair) {
      console.log("[FontThemeSwitcher v1.3] Persistencia omitida: La fuente seleccionada ya está persistida.");
      return;
    }
    
    // 4. Persistencia silenciosa en segundo plano
    console.log(`[FontThemeSwitcher v1.3] Iniciando persistencia silenciosa para: ${newFontPairId}`);
    try {
      const result = await actualizarPreferenciasUI(
        auth.user.id, // Seguro que existe por la verificación anterior
        auth.proyectoActual.id, // Seguro que existe por la verificación anterior
        { ui_font_pair: newFontPairId }
      );

      if (result.success) {
        auth.setUiFontPairLocal(newFontPairId);
        console.log(`[FontThemeSwitcher v1.3] Persistencia exitosa y AuthProvider actualizado para: ${newFontPairId}`);
      } else {
        toast.error(result.error || "Ups! Tuvimos un problema al guardar tu preferencia de fuente. Es posible que en tu próximo inicio de sesión se cargue la configuración anterior.");
        console.error("[FontThemeSwitcher v1.3] Error en persistencia desde actualizarPreferenciasUI:", result.error);
      }
    } catch (error) {
      console.error("[FontThemeSwitcher v1.3] Excepción durante la persistencia:", error);
      toast.error("Ups! Hubo una excepción al guardar tu preferencia de fuente. Es posible que en tu próximo inicio de sesión se cargue la configuración anterior.");
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <StandardText preset="caption" colorScheme="neutral" colorShade="textShade" className="text-xs opacity-50 whitespace-nowrap">
        Fuente:
      </StandardText>
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.02 }} // El estado de carga ya no afecta el hover/tap del botón principal
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)} // El botón principal no se deshabilita
        className="flex items-center justify-between rounded-full border px-2 py-1 text-xs transition-colors"
        style={{
          backgroundColor: `${appColorTokens.tertiary.bg}80`,
          borderColor: `${fontTokens.closed.borderColor}30`,
          minWidth: "100px",
          color: fontTokens.closedLabelText.color,
        }}
        aria-label="Seleccionar fuente"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* No hay loader en el botón principal para la persistencia */}
        <span style={{...getCurrentFontStyle(), fontSize: "0.75rem", opacity: 0.7, color: appColorTokens.neutral.text }}>
          {getCurrentFontPairName()}
        </span>
        <ChevronDown style={{ color: `${fontTokens.icon.color}70`, width: "12px", height: "12px", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", marginLeft: '4px' }} />
      </motion.button>

      <AnimatePresence>
        {isOpen && ( // El menú se muestra/oculta normalmente
          <motion.div
            ref={menuRef}
            className="absolute left-0 top-full z-50 mt-1 w-60 rounded-lg border"
            style={{ /* ... Estilos del menú sin cambios ... */
              backgroundColor: fontTokens.dropdown.backgroundColor,
              borderColor: `${fontTokens.dropdown.borderColor}40`,
              boxShadow: fontTokens.dropdown.boxShadow,
              padding: "0.5rem",
              maxHeight: "300px",
              overflowY: "auto" as any,
            }}
            variants={menuVariants} initial="hidden" animate="visible" exit="exit"
          >
            <div className="grid gap-1">
              {fontStyles.map((font, index) => (
                <motion.button
                  key={font.id}
                  variants={itemVariants} initial="hidden" animate="visible" custom={index}
                  className="w-full text-left cursor-pointer rounded-md p-2 transition-colors hover:bg-opacity-50" // No se deshabilita por persistencia
                  style={{
                    backgroundColor: fontTheme === font.id ? `${fontTokens.item.selected.backgroundColor}50` : "transparent",
                  }}
                  onClick={() => handleSelectFont(font.id)}
                >
                  <p style={{ ...font.headingStyle, color: fontTokens.itemParagraph.color, fontSize: "0.85rem", marginBottom: "0.25rem", fontWeight: fontTheme === font.id ? "600" : "400", opacity: fontTheme === font.id ? 0.9 : 0.7, }}>
                    {font.name}
                    {fontTheme === font.id && " ✓"}
                  </p>
                  <p style={{ ...font.bodyStyle, color: `${fontTokens.itemParagraph.color}AA`, fontSize: "0.75rem", lineHeight: "1.2" }}>
                    {sampleBodyText}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
