"use client";

import { useTheme } from "@/app/theme-provider";
import { Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useMemo } from "react";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { generateFontSelectorTokens } from "@/lib/theme/components/font-selector-tokens";

export function ColorSchemeSwitcher() {
  const { colorScheme, mode, setColorScheme, appColorTokens } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [forceUpdate, setForceUpdate] = useState({});
  
  // Usar useMemo para generar los tokens solo cuando cambian las dependencias
  const navTokens = useMemo(() => {
    return appColorTokens ? generateFontSelectorTokens(appColorTokens, mode) : null;
  }, [appColorTokens, mode]);
  
  // Verificar si tenemos tokens válidos
  const hasTokens = !!navTokens;
  
  // Efecto para forzar actualización cuando cambia el tema
  useEffect(() => {
    setForceUpdate({});
  }, [colorScheme, mode]);
  
  // Función directa para cambiar el esquema de color
  const handleColorSchemeChange = (scheme: "blue" | "green" | "orange") => {
    // Aplicamos el cambio de esquema
    setColorScheme(scheme);
    
    // Cerramos el menú
    setIsOpen(false);
    
    // Forzar re-renderizado
    setTimeout(() => {
      setForceUpdate({});
    }, 0);
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
  
  // Obtener el nombre del esquema de color actual
  const getCurrentColorSchemeName = () => {
    const schemes = [
      { id: "blue", name: "Azul" },
      { id: "green", name: "Verde" },
      { id: "orange", name: "Naranja" },
    ];
    
    const currentScheme = schemes.find(scheme => scheme.id === colorScheme);
    return currentScheme ? currentScheme.name : "Default";
  };
  
  // Obtener el color del círculo según el esquema
  const getColorCircle = () => {
    switch (colorScheme) {
      case "blue":
        return "bg-blue-600";
      case "green":
        return "bg-green-600";
      case "orange":
        return "bg-orange-500";
      default:
        return "bg-blue-600";
    }
  };
  
  // Valores por defecto en caso de que no haya tokens
  const defaultBackgroundColor = "rgba(200, 200, 200, 0.5)";
  const defaultBorderColor = "rgba(150, 150, 150, 0.3)";
  const defaultTextColor = "#333333";
  const defaultIconColor = "rgba(100, 100, 100, 0.7)";
  
  return (
    <div className="relative flex items-center gap-1">
      <Text 
        variant="caption" 
        color="neutral" 
        colorVariant="textShade" 
        className="text-xs opacity-50 whitespace-nowrap"
      >
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
          <div className={`h-2.5 w-2.5 rounded-full ${getColorCircle()}`} />
          <span style={{ 
            fontSize: "0.75rem",
            opacity: 0.7,
          }}>
            {getCurrentColorSchemeName()}
          </span>
        </div>
        <ChevronDown
          style={{
            color: hasTokens && navTokens 
              ? `${navTokens.icon.color}70` 
              : defaultIconColor,
            width: "12px",
            height: "12px",
            transition: "transform 0.2s",
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
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="grid gap-1">
              {/* Opción Azul */}
              <motion.button
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                custom={0}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 transition-colors"
                style={{
                  backgroundColor: colorScheme === "blue" && hasTokens && navTokens
                    ? `${navTokens.item.selected.backgroundColor}50` 
                    : colorScheme === "blue"
                      ? "rgba(200, 200, 255, 0.25)"
                      : "transparent",
                }}
                onClick={() => handleColorSchemeChange("blue")}
              >
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-600" />
                  <Text color="secondary" colorVariant="text" size="xs">
                    Azul
                  </Text>
                </div>
                {colorScheme === "blue" && (
                  <Icon size="xs" color="primary" colorVariant="pure">
                    <Check className="h-3 w-3" />
                  </Icon>
                )}
              </motion.button>
              
              {/* Opción Verde */}
              <motion.button
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                custom={1}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 transition-colors"
                style={{
                  backgroundColor: colorScheme === "green" && hasTokens && navTokens
                    ? `${navTokens.item.selected.backgroundColor}50` 
                    : colorScheme === "green"
                      ? "rgba(200, 255, 200, 0.25)"
                      : "transparent",
                }}
                onClick={() => handleColorSchemeChange("green")}
              >
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-600" />
                  <Text color="secondary" colorVariant="text" size="xs">
                    Verde
                  </Text>
                </div>
                {colorScheme === "green" && (
                  <Icon size="xs" color="primary" colorVariant="pure">
                    <Check className="h-3 w-3" />
                  </Icon>
                )}
              </motion.button>
              
              {/* Opción Naranja */}
              <motion.button
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                custom={2}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 transition-colors"
                style={{
                  backgroundColor: colorScheme === "orange" && hasTokens && navTokens
                    ? `${navTokens.item.selected.backgroundColor}50` 
                    : colorScheme === "orange"
                      ? "rgba(255, 230, 200, 0.25)"
                      : "transparent",
                }}
                onClick={() => handleColorSchemeChange("orange")}
              >
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500" />
                  <Text color="secondary" colorVariant="text" size="xs">
                    Naranja
                  </Text>
                </div>
                {colorScheme === "orange" && (
                  <Icon size="xs" color="primary" colorVariant="pure">
                    <Check className="h-3 w-3" />
                  </Icon>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}