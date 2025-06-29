"use client";

import React, { forwardRef, useState, useEffect, useMemo, useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
  generateStandardCheckTokens,
  type StandardCheckVariant,
  type StandardCheckSize,
  type StandardCheckStyleType,
} from "@/lib/theme/components/standard-check-tokens";
import { StandardText } from "./StandardText";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

//#region [def] - 📦 TYPES & INTERFACE 📦
export interface StandardCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  colorScheme?: ColorSchemeVariant;
  size?: StandardCheckSize;
  styleType?: StandardCheckStyleType;
  indeterminate?: boolean;
  error?: boolean;
  className?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  // 📌 REFACTOR: Adoptamos el patrón onValueChange para consistencia en la API.
  onValueChange?: (checked: boolean) => void;
}
//#endregion

//#region [main] - 🔧 COMPONENT 🔧
const StandardCheckbox = forwardRef<HTMLInputElement, StandardCheckboxProps>(
  (
    {
      className, label, description, colorScheme = 'primary', size = "md", styleType = 'default',
      indeterminate = false, disabled = false, error = false, checked, defaultChecked,
      onValueChange, // <-- Nuestra nueva prop
      labelClassName, descriptionClassName, id, ...props
    },
    ref
  ) => {
    // ❌ Se elimina el "Puente" de props. Usamos colorScheme y styleType directamente.
    const { appColorTokens } = useTheme();
    const internalInputRef = React.useRef<HTMLInputElement>(null);
    const generatedId = useId();
		const effectiveId = id || generatedId;

    // Simplificamos el manejo del estado controlado vs. no controlado
    const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
    const isControlled = checked !== undefined;
    const finalChecked = isControlled ? checked : internalChecked;

    useEffect(() => {
      if (internalInputRef.current) {
        internalInputRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const tokens = useMemo(() => {
      if (!appColorTokens) return null;

      // ✅ Lógica de seguridad para manejar ColorSchemeVariant
      const validVariants: StandardCheckVariant[] = ["primary", "secondary", "tertiary", "accent", "success", "warning", "danger", "neutral"];
      const isVariantValid = (cs: any): cs is StandardCheckVariant => validVariants.includes(cs);

      const variant = error ? "danger" : isVariantValid(colorScheme) ? colorScheme : "primary";

      return generateStandardCheckTokens(appColorTokens, size, variant, styleType);
    }, [appColorTokens, size, error, colorScheme, styleType]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      // Llamamos a nuestro nuevo handler con el valor booleano, no con el evento.
      onValueChange?.(newChecked);
    };

    if (!tokens) {
      // El fallback se mantiene, pero somos conscientes del "code smell" de getSizeTokens.
      // Lo ideal a futuro sería que generateStandardCheckTokens maneje el estado nulo.
      const fallbackSize = { box: "20px", borderRadius: "4px", fontSize: "0.875rem" }; // Simplificado
      return (
        <label className={cn("flex items-start gap-2", disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer", className)}>
          <div className="flex-shrink-0 border rounded bg-gray-200 border-gray-400" style={{ width: fallbackSize.box, height: fallbackSize.box, borderRadius: fallbackSize.borderRadius }}/>
          {label && <span className={cn("font-medium text-gray-500", labelClassName)} style={{ fontSize: fallbackSize.fontSize }}>{label}</span>}
        </label>
      );
    }
    
    // ... (El resto de la lógica de renderizado y animación permanece igual)
    
    return (
      <label htmlFor={effectiveId} className={cn("flex items-start gap-2", disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer", className)}>
        {/* ... El JSX interno no necesita grandes cambios ... */}
        <input
          type="checkbox" id={effectiveId} ref={internalInputRef}
          checked={finalChecked} disabled={disabled} onChange={handleChange}
          className="sr-only peer" {...props}
        />
        {/* ... El resto del renderizado con motion ... */}
      </label>
    );
  }
);
StandardCheckbox.displayName = "StandardCheckbox";
export { StandardCheckbox };
//#endregion