import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface FormStylesProps {
  isEditing?: boolean
  hasValue?: boolean
  isFocused?: boolean
}

export function getFormStyles({ isEditing, hasValue, isFocused }: FormStylesProps) {
  // Definimos estilos base más consistentes
  let baseStyles = ""

  // Estilos según contexto (edición o creación)
  if (isEditing) {
    // En modo edición, usamos un fondo lavanda muy sutil
    baseStyles = "border border-[color:hsl(var(--ui-text-secondary)/0.3)] bg-[color:hsl(var(--accent)/0.05)]"
  } else {
    // En modo creación, usamos un fondo más neutro
    baseStyles = "border border-[color:hsl(var(--ui-text-secondary)/0.3)] bg-background"
  }

  // Estilos según estado (enfocado, con valor)
  let stateStyles = ""

  // Si está enfocado - prioridad más alta
  if (isFocused) {
    // Borde azul más visible y mantenemos el fondo según el contexto
    stateStyles = "ring-2 ring-[color:hsl(var(--ui-icon-primary))] border-[color:hsl(var(--ui-icon-primary))]"

    // Mantenemos el fondo según el contexto (edición o creación)
    if (isEditing) {
      stateStyles += " bg-[color:hsl(var(--accent)/0.05)]"
    }
  }
  // Si tiene valor pero no está enfocado
  else if (hasValue) {
    // Mantenemos el fondo según el contexto (edición o creación)
    if (isEditing) {
      stateStyles = "bg-[color:hsl(var(--accent)/0.05)]"
    } else {
      stateStyles = "bg-[color:hsl(var(--muted)/0.3)]"
    }
  }

  // Estilos de hover - solo si no está enfocado
  const hoverStyles = !isFocused ? "hover:border-[color:hsl(var(--ui-icon-primary))] hover:border-[1.5px]" : ""

  return {
    baseStyles: cn(baseStyles, hoverStyles),
    stateStyles: stateStyles,
  }
}
