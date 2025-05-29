// components/ui/custom-check.tsx
"use client";

import React, { forwardRef, useState, useEffect, useRef } from "react"; // Añadido useRef
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
  generateCheckTokens,
  type CheckVariant,
  type CheckSize,
  type CheckVisualVariant,
} from "@/lib/theme/components/check-tokens";
import type { CheckTokens as CheckTokensType } from "@/lib/theme/components/check-tokens";

export interface CustomCheckProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: React.ReactNode; // <--- CAMBIADO a React.ReactNode
  description?: React.ReactNode; // <--- CAMBIADO a React.ReactNode (opcional)
  variant?: CheckVariant;
  size?: CheckSize;
  visualVariant?: CheckVisualVariant;
  indeterminate?: boolean;
  error?: boolean;
  className?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  // Si quieres pasar un ID específico para el contenedor del label/descripción para aria-describedby
  labelDescriptionId?: string; 
}

const CustomCheck = forwardRef<HTMLInputElement, CustomCheckProps>(
  (
    {
      className,
      label,
      description,
      variant = "primary",
      size = "md",
      visualVariant = "default",
      indeterminate = false,
      disabled = false,
      error = false,
      checked,
      defaultChecked,
      onChange,
      labelClassName,
      descriptionClassName,
      id, // Recibimos el id de las props
      labelDescriptionId,
      ...props
    },
    ref
  ) => {
    const { appColorTokens, mode } = useTheme(); // 'mode' no se usa, podría quitarse si no es para tokens
    const [isChecked, setIsChecked] = useState<boolean>(
      () => {
        if (checked !== undefined) return checked;
        if (defaultChecked !== undefined) return defaultChecked;
        return false;
      }
    );
    const [isIndeterminate, setIsIndeterminate] =
      useState<boolean>(indeterminate);

    // Generar tokens con manejo de errores
    const tokens: CheckTokensType | null = React.useMemo(() => {
      if (!appColorTokens) return null;
      try {
        return generateCheckTokens(
          appColorTokens,
          size,
          error ? "danger" : variant, // Usar 'danger' como variant si hay error
          visualVariant
        );
      } catch (e) {
        console.error("Error generating check tokens:", e);
        return null;
      }
    }, [appColorTokens, size, error, variant, visualVariant]);

    // Sincronizar con prop 'checked' controlada
    useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked);
      }
    }, [checked]);

    // Sincronizar con prop 'indeterminate' controlada
    useEffect(() => {
      setIsIndeterminate(indeterminate);
    }, [indeterminate]);

    // Manejar cambios del input nativo
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (checked === undefined) { // Solo actualizar estado interno si no es controlado
        setIsChecked(e.target.checked);
      }
      if (isIndeterminate) { // Si era indeterminado, al hacer clic se vuelve determinado
        setIsIndeterminate(false);
      }
      onChange?.(e); // Propagar el evento onChange
    };

    const internalInputRef = useRef<HTMLInputElement>(null);

    // Combinar refs: el ref pasado desde fuera y el ref interno
    React.useImperativeHandle(ref, () => internalInputRef.current as HTMLInputElement);

    // Actualizar el estado indeterminado del input nativo
    useEffect(() => {
      if (internalInputRef.current) {
        internalInputRef.current.indeterminate = isIndeterminate;
      }
    }, [isIndeterminate, internalInputRef]);

    // Fallback si los tokens no están listos (mejorado)
    if (!tokens) {
      const fallbackSize = getSizeTokens(size); // Usar la función helper para consistencia
      return (
        <label
          className={cn(
            "flex items-start gap-2",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            className
          )}
        >
          <div
            className="flex-shrink-0 border rounded bg-gray-200 border-gray-400"
            style={{
              width: fallbackSize.box,
              height: fallbackSize.box,
              borderRadius: fallbackSize.borderRadius,
            }}
          />
          {(label || description) && (
            <div className="flex flex-col flex-grow" id={labelDescriptionId}>
              {label && (
                <span
                  className={cn("font-medium text-gray-500", labelClassName)}
                  style={{ fontSize: fallbackSize.fontSize }}
                >
                  {label}
                </span>
              )}
              {description && (
                <span
                  className={cn("text-xs text-gray-400", descriptionClassName)}
                >
                  {description}
                </span>
              )}
            </div>
          )}
        </label>
      );
    }

    // Estilos base del checkbox visual
    const checkboxVisualStyle: React.CSSProperties = {
      width: tokens.size.box,
      height: tokens.size.box,
      backgroundColor:
        isChecked || isIndeterminate
          ? tokens.checked.background
          : tokens.background,
      borderColor:
        isChecked || isIndeterminate ? tokens.checked.border : tokens.border,
      borderWidth: tokens.size.borderThickness || "1.5px", // Usar token o default
      borderStyle: "solid",
      borderRadius: tokens.size.borderRadius,
      transition: "all 0.2s ease-in-out",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative", // Para posicionar el check/indeterminate mark
      flexShrink: 0, // Evitar que se encoja
    };

    // Variantes para la animación del check
    const checkVariants = {
      visible: { pathLength: 1, opacity: 1 },
      hidden: { pathLength: 0, opacity: 0 },
    };

    // Variantes para la animación del indeterminado
    const indeterminateVariants = {
      visible: { scaleX: 1, opacity: 1 },
      hidden: { scaleX: 0, opacity: 0 },
    };
    
    const effectiveId = id || React.useId(); // Generar un ID si no se provee

    return (
      <label
        htmlFor={effectiveId} // Asociar label con el input
        className={cn(
          "flex items-start gap-2", // items-start para alinear el check con la primera línea de texto
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          className
        )}
      >
        {/* Checkbox visual y input nativo oculto */}
        <div className="relative flex-shrink-0">
          <input
            type="checkbox"
            id={effectiveId} // ID para el input nativo
            ref={internalInputRef}
            checked={isChecked} // Controlado por el estado interno o prop
            disabled={disabled}
            onChange={handleChange}
            className="sr-only peer" // sr-only para ocultarlo, peer para focus-visible
            aria-describedby={description ? labelDescriptionId : undefined} // Si hay descripción, usar el ID
            {...props} // Resto de las props del input
          />

          <motion.div
            style={checkboxVisualStyle}
            className={cn(
              "peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2", // Estilo de foco visible
              disabled ? tokens.disabled.background : "", // Estilo de fondo deshabilitado
              disabled ? `border-[${tokens.disabled.border}]` : "", // Estilo de borde deshabilitado
            )}
            // Aplicar estilos de focus directamente si no se usa peer-focus-visible
            // O manejarlo con CSS variables si los tokens de focus están definidos
            // animate={{
            //   outline: isFocused ? `2px solid ${tokens.focus.outline}` : 'none',
            //   outlineOffset: isFocused ? '2px' : '0px',
            // }}
          >
            {/* Check mark */}
            <motion.svg
              viewBox="0 0 24 24"
              className="w-[70%] h-[70%]" // Ajustar tamaño del SVG relativo al contenedor
              initial={false}
              animate={isChecked && !isIndeterminate ? "visible" : "hidden"}
              aria-hidden="true"
            >
              <motion.path
                d="M4 12l5 5L20 7"
                fill="transparent"
                strokeWidth={tokens.size.checkThickness || 3}
                stroke={tokens.checked.check}
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={checkVariants}
                transition={{ duration: 0.15, ease: "circOut" }}
              />
            </motion.svg>

            {/* Indeterminate mark */}
            {isIndeterminate && (
              <motion.div
                className="absolute" // Posicionamiento absoluto dentro del div visual
                initial={false}
                animate={isIndeterminate ? "visible" : "hidden"}
                aria-hidden="true"
              >
                <motion.div
                  style={{
                    width: `calc(${tokens.size.box} * 0.6)`, // 60% del ancho del box
                    height: tokens.size.checkThickness || 3,
                    backgroundColor: tokens.checked.check,
                    borderRadius: "1px",
                  }}
                  variants={indeterminateVariants}
                  transition={{ duration: 0.1, ease: "circOut" }}
                />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Contenedor para Label y descripción */}
        {(label || description) && (
          <div className="flex flex-col flex-grow pt-px" id={labelDescriptionId}> 
            {/* pt-px para un ligero ajuste vertical si el texto parece muy alto */}
            {label && (
              <span
                className={cn(
                  "font-medium leading-tight", // Ajustar leading
                  disabled ? "text-muted-foreground opacity-70" : tokens.text ? `text-[${tokens.text}]` : "text-foreground",
                  labelClassName
                )}
                style={{ fontSize: tokens.size.fontSize }}
              >
                {label}
              </span>
            )}
            {description && (
              <span
                className={cn(
                  "text-xs leading-tight mt-0.5", // Ajustar leading y añadir un pequeño margen
                  disabled ? "text-muted-foreground opacity-60" : tokens.text ? `text-[${tokens.text}] opacity-80` : "text-muted-foreground",
                  descriptionClassName
                )}
              >
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

CustomCheck.displayName = "CustomCheck";
export { CustomCheck };

// Función helper (o import si es compartida)
// Asegúrate que esta función esté actualizada o que los tokens se generen correctamente
// en generateCheckTokens.
function getSizeTokens(size: CheckSize) {
  // Esta es una versión simplificada, tu generateCheckTokens es más completa.
  // El objetivo aquí es solo tener un fallback para el renderizado de fallback.
  const defaultSizes = { // Equivalente a 'md'
    box: "20px",
    checkThickness: 3,
    borderRadius: "4px",
    fontSize: "0.875rem", // text-sm
  };
  switch (size) {
    case "xs": return { box: "14px", checkThickness: 2, borderRadius: "3px", fontSize: "0.75rem" }; // text-xs
    case "sm": return { box: "16px", checkThickness: 2.5, borderRadius: "4px", fontSize: "0.875rem" }; // text-sm
    case "lg": return { box: "24px", checkThickness: 3.5, borderRadius: "5px", fontSize: "1rem" }; // text-base
    case "xl": return { box: "28px", checkThickness: 4, borderRadius: "6px", fontSize: "1.125rem" }; // text-lg
    default: // md
      return defaultSizes;
  }
}