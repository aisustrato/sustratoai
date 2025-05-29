// app/showroom/formbeta/schema.ts
import { z } from "zod";

// --- Funciones Helper para Validaciones Específicas ---

/**
 * Valida un RUT chileno.
 * Formato esperado: XX.XXX.XXX-Y o XXXXXXXXY (sin puntos ni guion, Y puede ser K)
 * Fuente del algoritmo: Adaptado de varias implementaciones comunes.
 */
const isValidRut = (rutCompleto: string | undefined | null): boolean => {
  if (!rutCompleto || typeof rutCompleto !== 'string') return false;

  const rutLimpio = rutCompleto.replace(/[\.\-]/g, '').trim().toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(rutLimpio)) return false; // Formato numérico + DV

  const rutCuerpo = rutLimpio.slice(0, -1);
  const dvIngresado = rutLimpio.slice(-1);

  if (rutCuerpo.length < 7 || rutCuerpo.length > 8) return false;

  let suma = 0;
  let multiplo = 2;
  for (let i = rutCuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(rutCuerpo.charAt(i), 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const dvCalculadoRaw = 11 - (suma % 11);
  let dvCalculado: string;

  if (dvCalculadoRaw === 11) {
    dvCalculado = "0";
  } else if (dvCalculadoRaw === 10) {
    dvCalculado = "K";
  } else {
    dvCalculado = dvCalculadoRaw.toString();
  }

  return dvCalculado === dvIngresado;
};

// --- Definición del Schema del Formulario Beta ---

export const formBetaObjectSchema = z.object({
  email: z.string()
    .min(1, "El correo electrónico es requerido.")
    .email("Formato de correo electrónico inválido."),

  username: z.string()
    .min(1, "El nombre de usuario es requerido.")
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres.")
    .max(20, "El nombre de usuario no puede exceder los 20 caracteres.")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo permitidos."),

  firstName: z.string()
    .max(50, "El primer nombre no puede exceder los 50 caracteres.")
    .optional()
    .refine(val => !val || val.length >= 2, {
      message: "Si ingresas un nombre, debe tener al menos 2 caracteres.",
    }),

  lastName: z.string()
    .max(50, "El apellido no puede exceder los 50 caracteres.")
    .optional()
    .refine(val => !val || val.length >= 2, {
      message: "Si ingresas un apellido, debe tener al menos 2 caracteres.",
    }),

  birthDate: z.string() // Se espera un string desde el input
    .optional()
    .refine((dateStr) => {
      if (!dateStr) return true; // Opcional, si no se provee, es válido
      // Validar formato YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
      
      const date = new Date(dateStr + "T00:00:00"); // Añadir T00:00:00 para evitar problemas de zona horaria en el parseo
      if (isNaN(date.getTime())) return false; // Fecha inválida

      // Validar que la fecha sea razonable (ej. no en el futuro y no demasiado antigua)
      const year = date.getFullYear();
      const currentYear = new Date().getFullYear();
      if (year > currentYear || year < 1900) { // Ejemplo de rango
        return false;
      }
      // Podrías añadir validación de edad aquí si es necesario:
      // const age = currentYear - year;
      // const monthDiff = new Date().getMonth() - date.getMonth();
      // if (monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < date.getDate())) {
      //   // No ha cumplido años este año todavía
      //   if (age -1 < 18) return false;
      // } else {
      //   if (age < 18) return false;
      // }
      return true;
    }, {
      message: "Fecha inválida o formato incorrecto (esperado YYYY-MM-DD).",
    }),

  rut: z.string()
    .optional()
    .refine(val => {
        if (!val) return true; // Válido si está vacío (opcional)
        return isValidRut(val);
    }, {
        message: "RUT chileno inválido o con formato incorrecto.",
    }),

  accessCode: z.string()
    .min(1, "El código de acceso es requerido.") // Requerido
    .length(6, "El código de acceso debe tener exactamente 6 caracteres.")
    .regex(/^[a-zA-Z0-9]+$/, "El código solo puede contener letras y números."),

  description: z.string()
    
    .max(500, "La descripción no puede exceder los 500 caracteres.")
    .optional()
});

// Exportar el schema completo
export const formBetaSchema = formBetaObjectSchema;

// Exportar el tipo inferido para los valores del formulario
export type FormBetaValues = z.infer<typeof formBetaSchema>;