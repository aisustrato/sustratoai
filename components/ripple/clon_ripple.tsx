"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import tinycolor from "tinycolor2";

interface Ripple {
  x: number;
  y: number;
  color: string;
  id: string;
  scale?: number;
}

// Tipo unión para aceptar tanto eventos de mouse nativos como de React
type MouseEventUnion = MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent;

// Función para convertir cualquier formato de color a RGBA
const toValidColor = (color: string = "#4f46e5"): string => {
  if (color === 'transparent') return 'rgba(0, 0, 0, 0)';
  const tc = tinycolor(color);
  if (tc.isValid()) {
    return tc.toRgbString();
  }
  console.warn("Color inválido, usando default:", color);
  return tinycolor("#4f46e5").toRgbString(); // Color por defecto si hay error
};

// ——— Contexto ———
const RippleContext = createContext<
  ((e: MouseEventUnion, color?: string, scale?: number) => void) | null
>(null);

export const useRipple = () => {
  const context = useContext(RippleContext);
  if (!context) {
    throw new Error("useRipple debe ser usado dentro de un RippleProvider");
  }
  return context;
};

// ——— Componente Wave (Estrategia 3: Gota de Tinta Difusa) ———
const Wave: React.FC<{
  x: number;
  y: number;
  color: string;
  scale?: number;
}> = ({ x, y, color, scale = 10 }) => {
  const waveColor = tinycolor(color).setAlpha(0.6).toRgbString();

  return (
    <motion.div
      initial={{
        scale: 0,
        opacity: 1,
        filter: "blur(0px)",
      }}
      animate={{
        scale: scale,
        opacity: 0,
        filter: "blur(8px)", // Aumenta el desenfoque para el efecto de difusión
      }}
      transition={{
        duration: 0.7, // Un poco más lento para un efecto más suave
        ease: "easeOut",
      }}
      style={{
        position: "fixed",
        left: x,
        top: y,
        width: 24, // Un poco más grande para que el blur tenga efecto
        height: 24,
        borderRadius: "9999px",
        backgroundColor: waveColor,
        pointerEvents: "none",
        zIndex: 50,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
};

const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// ——— Provider ———
export const RippleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const triggerRipple = useCallback(
    (e: MouseEventUnion, color = "#4f46e5", scale = 12) => {
      try {
        // Validar y transformar el color a un formato compatible
        const validColor = toValidColor(color);
        
        // Extraer las coordenadas del evento, independientemente de su tipo
        let x = 0;
        let y = 0;
        
        if ('clientX' in e && 'clientY' in e) {
          x = e.clientX;
          y = e.clientY;
        } else if ('touches' in e && e.touches.length > 0) {
          x = e.touches[0].clientX;
          y = e.touches[0].clientY;
        }
        
        const id = generateId();
        setRipples((r) => [...r, { x, y, color: validColor, id, scale }]);
        // limpia el estado después de la animación
        setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 800);
      } catch (error) {
        console.error("Error en el efecto ripple:", error);
        // Continuar sin crear el efecto ripple
      }
    },
    []
  );

  return (
    <RippleContext.Provider value={triggerRipple}>
      {children}
      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {ripples.map((rp) => (
              <Wave key={rp.id} {...rp} />
            ))}
          </AnimatePresence>,
          document.body
        )}
    </RippleContext.Provider>
  );
};
