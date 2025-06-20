"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

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
  // Si es 'transparent', devolver rgba transparente
  if (color === 'transparent') return 'rgba(0, 0, 0, 0)';
  
  // Si ya es rgba o rgb, devolverlo tal cual
  if (color.startsWith('rgba(') || color.startsWith('rgb(')) return color;
  
  try {
    // Si el formato es #RRGGBBAA
    if (color.length === 9 && color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const a = parseInt(color.slice(7, 9), 16) / 255;
      return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
    }
    
    // Si el formato es #RRGGBB
    if (color.length === 7 && color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, 1)`;
    }
    
    // Si el formato es #RGB
    if (color.length === 4 && color.startsWith('#')) {
      const r = parseInt(color.slice(1, 2), 16) * 17;
      const g = parseInt(color.slice(2, 3), 16) * 17;
      const b = parseInt(color.slice(3, 4), 16) * 17;
      return `rgba(${r}, ${g}, ${b}, 1)`;
    }
  } catch {
    console.warn("Error al convertir color:", color);
    return "#4f46e5"; // Color por defecto si hay error
  }
  
  return color; // Devolver el valor original si no coincide con ningún formato
};

// ——— Contexto ———
// Actualizamos la firma para aceptar ambos tipos de eventos
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

// ——— Componente Wave (tres ondas) ———
const Wave: React.FC<{
  x: number;
  y: number;
  color: string;
  scale?: number;
}> = ({ x, y, color, scale = 12 }) => (
  <>
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: scale, opacity: 0.0 }}
        transition={{ duration: 0.7, delay: i * 0.05, ease: "easeOut" }}
        style={{
          position: "fixed",
          left: x,
          top: y,
          width: 16,
          height: 16,
          borderRadius: "9999px",
          background: color, // Ya está validado
          pointerEvents: "none",
          zIndex: 50,
          transform: "translate(-50%, -50%)",
        }}
      />
    ))}
  </>
);

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
      } catch {
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
