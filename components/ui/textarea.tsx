// components/ui/textarea.tsx
// Versión 1.0.1 (Refactorización de mensajes)
// Componente TextArea para Sustrato.ai, con tematización dinámica y ARIA.
// Los mensajes de texto (error, hint, success) son ahora responsabilidad de FormField.

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
// import { motion, AnimatePresence } from "framer-motion"; // Eliminado, ya que los mensajes de texto se mueven a FormField
import { useTheme } from "@/app/theme-provider";
import {
  generateTextareaTokens,
  type TextareaSize,
  type TextareaVariant,
  type TextareaTokens
} from "@/lib/theme/components/textarea-tokens";
import { Text } from "@/components/ui/text";

export interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size" | "cols"> {
  error?: string; // Se mantiene para estilos visuales (borde) y aria-invalid
  success?: boolean; // Se mantiene para estilos visuales (borde)
  // successMessage?: string; // Eliminado: FormField maneja el texto
  // hint?: string; // Eliminado: FormField maneja el texto
  isEditing?: boolean;
  showCharacterCount?: boolean;
  variant?: TextareaVariant;
  size?: TextareaSize;
  isRequired?: boolean;
  formFieldHintId?: string;  // ID de hint de FormField (para aria-describedby)
  formFieldErrorId?: string; // ID de error de FormField (para aria-describedby)
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      error,
      success,
      // successMessage, // Eliminado
      // hint, // Eliminado
      isEditing,
      showCharacterCount,
      variant = "default",
      size = "md",
      disabled,
      id,
      name,
      value,
      onChange,
      maxLength,
      readOnly,
      onFocus,
      onBlur,
      style,
      isRequired,
      formFieldHintId,
      formFieldErrorId,
      rows = 3, 
      ...props
    },
    ref
  ) => {
    const { appColorTokens, mode } = useTheme();
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    const charCount = React.useMemo(() => {
      if (value === null || value === undefined) return 0;
      return String(value).length;
    }, [value]);

    const textareaTokens: TextareaTokens | null = React.useMemo(() => {
      if (!appColorTokens || !mode) return null;
      return generateTextareaTokens(appColorTokens, mode);
    }, [appColorTokens, mode]);
    
    React.useEffect(() => {
      const element = textareaRef.current;
      if (element && textareaTokens && appColorTokens) {
        const cvt = textareaTokens.variants[variant];
        
        let effectiveBackgroundColor = cvt.background;

        if (disabled) {
          effectiveBackgroundColor = cvt.disabledBackground;
        } else if (readOnly) {
          effectiveBackgroundColor = cvt.readOnlyBackground;
        } else if (error) {
          effectiveBackgroundColor = cvt.errorBackground; 
        } else if (success) {
          effectiveBackgroundColor = cvt.successBackground;
        } else if (isEditing) {
          effectiveBackgroundColor = cvt.editingBackground;
        }
        
        element.style.setProperty('--textarea-bg', cvt.background);
        element.style.setProperty('--textarea-border', cvt.border);
        element.style.setProperty('--textarea-text', cvt.text);
        element.style.setProperty('--textarea-placeholder', cvt.placeholder);
        
        element.style.setProperty('--textarea-focus-border', cvt.focusBorder);
        element.style.setProperty('--textarea-focus-ring', cvt.focusRing);
        
        element.style.setProperty('--textarea-error-bg', cvt.errorBackground);
        element.style.setProperty('--textarea-error-border', cvt.errorBorder);
        element.style.setProperty('--textarea-error-ring', cvt.errorRing);
        
        element.style.setProperty('--textarea-success-bg', cvt.successBackground);
        element.style.setProperty('--textarea-success-border', cvt.successBorder);
        element.style.setProperty('--textarea-success-ring', cvt.successRing);
        
        element.style.setProperty('--textarea-disabled-bg', cvt.disabledBackground);
        element.style.setProperty('--textarea-disabled-border', cvt.disabledBorder);
        element.style.setProperty('--textarea-disabled-text', cvt.disabledText);
        
        element.style.setProperty('--textarea-readonly-bg', cvt.readOnlyBackground);
        element.style.setProperty('--textarea-readonly-border', cvt.readOnlyBorder);
        element.style.setProperty('--textarea-readonly-text', cvt.readOnlyText);
        
        element.style.setProperty('--textarea-editing-bg', cvt.editingBackground);

        element.style.setProperty('--textarea-autofill-bg', effectiveBackgroundColor);
      }
    }, [textareaTokens, variant, appColorTokens, disabled, error, success, isEditing, readOnly, id, name]);

    const sizeTokens = textareaTokens ? textareaTokens.sizes[size] : { 
      height: "h-auto", minHeight: "min-h-[80px]", fontSize: "text-sm", paddingX: "px-3", paddingY: "py-2" 
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
    };

    const baseClasses = [
      "peer", "w-full", "rounded-md", "transition-all", "border",
      sizeTokens.height,
      sizeTokens.minHeight,
      sizeTokens.fontSize,
      sizeTokens.paddingX,
      sizeTokens.paddingY,
      "placeholder:text-[var(--textarea-placeholder)]",
      "text-[var(--textarea-text)]",
      "resize-y" 
    ];
    
    const stateClasses: string[] = [];
    if (disabled) { 
      stateClasses.push( 
        "border-[var(--textarea-disabled-border)]", 
        "bg-[var(--textarea-disabled-bg)]", 
        "text-[var(--textarea-disabled-text)]", 
        "cursor-not-allowed", 
        "opacity-70" 
      ); 
    } else if (readOnly) { 
      stateClasses.push( 
        "border-[var(--textarea-readonly-border)]", 
        "bg-[var(--textarea-readonly-bg)]", 
        "text-[var(--textarea-readonly-text)]",
        "cursor-default", 
        "read-only:focus:outline-none", 
        "read-only:focus:ring-0", 
        "read-only:focus:border-[var(--textarea-readonly-border)]"
      ); 
    } else if (error) { 
      stateClasses.push(
        "border-[var(--textarea-error-border)]", 
        "bg-[var(--textarea-error-bg)]"
      ); 
    } else if (success) { 
      stateClasses.push(
        "border-[var(--textarea-success-border)]", 
        "bg-[var(--textarea-success-bg)]"
      ); 
    } else if (isEditing) { 
      stateClasses.push(
        "border-[var(--textarea-border)]", 
        "bg-[var(--textarea-editing-bg)]"
      ); 
    } else { 
      stateClasses.push(
        "border-[var(--textarea-border)]", 
        "bg-[var(--textarea-bg)]"
      ); 
    }
    
    const focusClasses: string[] = [];
    if (!disabled && !readOnly) { 
      focusClasses.push("focus:outline-none"); 
      if (error) { 
        focusClasses.push(
          "focus:border-[var(--textarea-error-border)]", 
          "focus:shadow-[0_0_0_3px_var(--textarea-error-ring)]"
        ); 
      } else if (success) { 
        focusClasses.push(
          "focus:border-[var(--textarea-success-border)]", 
          "focus:shadow-[0_0_0_3px_var(--textarea-success-ring)]"
        ); 
      } else { 
        focusClasses.push(
          "focus:border-[var(--textarea-focus-border)]", 
          "focus:shadow-[0_0_0_3px_var(--textarea-focus-ring)]"
        ); 
      } 
    }
    
    const textareaClasses = cn(...baseClasses, ...stateClasses, ...focusClasses, className);
    
    // Construcción de aria-describedby con IDs de FormField
    const describedByArray = [];
    if (formFieldErrorId) describedByArray.push(formFieldErrorId);
    if (formFieldHintId) describedByArray.push(formFieldHintId);
    const ariaDescribedBy = describedByArray.length > 0 ? describedByArray.join(" ") : undefined;

    const showCharCountEffective = showCharacterCount && maxLength && maxLength > 0 && !disabled && !readOnly;

    return (
      <div className="w-full">
        <textarea
          id={id}
          name={name}
          className={textareaClasses}
          ref={textareaRef}
          value={value ?? ""}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          maxLength={maxLength}
          readOnly={readOnly}
          style={style}
          rows={rows}
          aria-invalid={!!error} // Sigue funcionando como antes
          aria-required={isRequired}
          aria-describedby={ariaDescribedBy} // Actualizado para usar IDs de FormField
          {...props}
        />
        
        {/* Sección de mensajes de texto eliminada. FormField es ahora responsable. */}
        {/* El contador de caracteres se mantiene si showCharacterCount es true. */}
        {showCharCountEffective && (
          <div className="mt-1.5 flex justify-end"> {/* Solo muestra el div si hay contador */}
            <Text
              size="xs"
              color={error && appColorTokens ? "danger" : "neutral"}
              colorVariant={error && appColorTokens ? "pure" : "textShade"}
              className="opacity-70"
            >
              {charCount}/{maxLength}
            </Text>
          </div>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
export { TextArea };