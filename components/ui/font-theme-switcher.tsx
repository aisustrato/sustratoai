"use client";

import { useFontTheme } from "@/app/font-provider";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useTheme } from "@/app/theme-provider";
import { useColorTokens } from "@/hooks/use-color-tokens";
import { fontThemeConfig } from "@/lib/fonts";
import { AppColorTokens } from "@/lib/theme/ColorToken";
import { generateFontSelectorTokens } from "@/lib/theme/components/font-selector-tokens";
import { Text } from "@/components/ui/text";

export function FontThemeSwitcher() {
  const { fontTheme, setFontTheme } = useFontTheme();
  const { mode, appColorTokens } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { component } = useColorTokens();
  
  // Obtener tokens para el selector de fuentes
  const fontTokens = generateFontSelectorTokens(appColorTokens, mode);

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

  // Obtener el nombre del par de fuentes actual
  const getCurrentFontPairName = () => {
    const fontStyles = [
      { id: "sustrato", name: "Estilo Sustrato" },
      { id: "classic", name: "Estilo Clásico" },
      { id: "technical", name: "Estilo Técnico" },
      { id: "creative", name: "Estilo Creativo" },
      { id: "accessible", name: "Estilo Accesible" },
      { id: "modern", name: "Estilo Moderno" },
      { id: "minimalist", name: "Estilo Minimalista" },
    ];
    
    const currentFont = fontStyles.find(font => font.id === fontTheme);
    return currentFont ? currentFont.name : "Default";
  };

  // Definición de los estilos de fuente con ejemplos de párrafos
  const fontStyles = [
    {
      id: "sustrato",
      name: "Estilo Sustrato",
      headingStyle: {
        fontFamily: "var(--font-ubuntu), 'Ubuntu', sans-serif",
        fontWeight: "700",
      },
      bodyStyle: {
        fontFamily: "var(--font-ubuntu), 'Ubuntu', sans-serif",
        fontWeight: "400",
      },
    },
    {
      id: "classic",
      name: "Estilo Clásico",
      headingStyle: {
        fontFamily: fontThemeConfig.classic.heading,
        fontWeight: fontThemeConfig.classic.headingWeight,
      },
      bodyStyle: {
        fontFamily: fontThemeConfig.classic.body,
        fontWeight: fontThemeConfig.classic.bodyWeight,
      },
    },
    {
      id: "technical",
      name: "Estilo Técnico",
      headingStyle: {
        fontFamily: fontThemeConfig.technical.heading,
        fontWeight: fontThemeConfig.technical.headingWeight,
        letterSpacing: fontThemeConfig.technical.letterSpacingHeadings,
      },
      bodyStyle: {
        fontFamily: fontThemeConfig.technical.body,
        fontWeight: fontThemeConfig.technical.bodyWeight,
        letterSpacing: fontThemeConfig.technical.letterSpacingBody,
      },
    },
    {
      id: "creative",
      name: "Estilo Creativo",
      headingStyle: {
        fontFamily: fontThemeConfig.creative.heading,
        fontWeight: fontThemeConfig.creative.headingWeight,
        letterSpacing: fontThemeConfig.creative.letterSpacingHeadings,
      },
      bodyStyle: {
        fontFamily: fontThemeConfig.creative.body,
        fontWeight: fontThemeConfig.creative.bodyWeight,
        letterSpacing: fontThemeConfig.creative.letterSpacingBody,
      },
    },
    {
      id: "accessible",
      name: "Estilo Accesible",
      headingStyle: {
        fontFamily: fontThemeConfig.accessible.heading,
        fontWeight: fontThemeConfig.accessible.headingWeight,
        letterSpacing: fontThemeConfig.accessible.letterSpacingHeadings,
      },
      bodyStyle: {
        fontFamily: fontThemeConfig.accessible.body,
        fontWeight: fontThemeConfig.accessible.bodyWeight,
        letterSpacing: fontThemeConfig.accessible.letterSpacingBody,
      },
    },
    {
      id: "modern",
      name: "Estilo Moderno",
      headingStyle: {
        fontFamily: fontThemeConfig.modern.heading,
        fontWeight: fontThemeConfig.modern.headingWeight,
      },
      bodyStyle: {
        fontFamily: fontThemeConfig.modern.body,
        fontWeight: fontThemeConfig.modern.bodyWeight,
      },
    },
    {
      id: "minimalist",
      name: "Estilo Minimalista",
      headingStyle: {
        fontFamily: fontThemeConfig.minimalist.heading,
        fontWeight: fontThemeConfig.minimalist.headingWeight,
        letterSpacing: fontThemeConfig.minimalist.letterSpacingHeadings,
      },
      bodyStyle: {
        fontFamily: fontThemeConfig.minimalist.body,
        fontWeight: fontThemeConfig.minimalist.bodyWeight,
        letterSpacing: fontThemeConfig.minimalist.letterSpacingBody,
      },
    },
  ];

  // Texto de ejemplo para los párrafos (reducido a la mitad)
  const sampleBodyText = "Este es un ejemplo de texto con esta fuente.";

  // Obtener el estilo actual de la fuente
  const getCurrentFontStyle = () => {
    const currentFont = fontStyles.find(font => font.id === fontTheme);
    return currentFont ? currentFont.bodyStyle : fontStyles[0].bodyStyle;
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Label al lado izquierdo */}
      <Text 
        variant="caption" 
        color="neutral" 
        colorVariant="textShade" 
        className="text-xs opacity-50 whitespace-nowrap"
      >
        Fuente:
      </Text>
      
      {/* Selector con fondo diluido */}
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between rounded-full border px-2 py-1 text-xs transition-colors"
        style={{
          backgroundColor: `${appColorTokens.tertiary.bg}80`, // Fondo diluido al 50%
          borderColor: `${fontTokens.closed.borderColor}30`, // Borde más sutil
          minWidth: "100px",
          color: fontTokens.closedLabelText.color,
        }}
        aria-label="Seleccionar fuente"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span style={{ 
          ...getCurrentFontStyle(),
          fontSize: "0.75rem",
          opacity: 0.7, // Más sutil
          color: appColorTokens.neutral.text,
        }}>
          {getCurrentFontPairName()}
        </span>
        <ChevronDown
          style={{
            color: `${fontTokens.icon.color}70`, // Icono más sutil
            width: "12px", // Más pequeño
            height: "12px", // Más pequeño
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            className="absolute left-0 top-full z-50 mt-1 w-60 rounded-lg border"
            style={{
              backgroundColor: fontTokens.dropdown.backgroundColor, // Fondo sólido sin transparencia
              borderColor: `${fontTokens.dropdown.borderColor}40`, // Borde más sutil
              boxShadow: fontTokens.dropdown.boxShadow,
              padding: "0.5rem",
              maxHeight: "300px",
              overflowY: "auto" as any,
            }}
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="grid gap-1">
              {fontStyles.map((font, index) => (
                <motion.div
                  key={font.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  className="cursor-pointer rounded-md p-2 transition-colors hover:bg-opacity-50"
                  style={{
                    backgroundColor: fontTheme === font.id 
                      ? `${fontTokens.item.selected.backgroundColor}50` // Más sutil
                      : "transparent",
                  }}
                  onClick={() => {
                    setFontTheme(font.id as any);
                    setIsOpen(false);
                  }}
                >
                  {/* Nombre de la fuente usando la propia fuente */}
                  <p
                    style={{
                      ...font.headingStyle,
                      color: fontTokens.itemParagraph.color,
                      fontSize: "0.85rem",
                      marginBottom: "0.25rem",
                      fontWeight: fontTheme === font.id ? "600" : "400", // Menos contrastado
                      opacity: fontTheme === font.id ? 0.9 : 0.7, // Más sutil
                    }}
                  >
                    {font.name}
                    {fontTheme === font.id && " ✓"} 
                  </p>
                  
                  {/* Párrafo de ejemplo con la fuente de cuerpo */}
                  <p
                    style={{
                      ...font.bodyStyle,
                      color: `${fontTokens.itemParagraph.color}AA`, // Más sutil
                      fontSize: "0.75rem",
                      lineHeight: "1.2",
                    }}
                  >
                    {sampleBodyText}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
