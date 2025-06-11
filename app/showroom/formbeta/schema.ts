//. 📍 app/showroom/standard-form/schema.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import { z } from "zod";
//#endregion ![head]

//#region [sub] - 🧰 HELPER FUNCTIONS 🧰
const isValidRut = (rutCompleto: string | undefined | null): boolean => {
	if (!rutCompleto || typeof rutCompleto !== 'string') return false;
	const rutLimpio = rutCompleto.replace(/[\.\-]/g, '').trim().toUpperCase();
	if (!/^\d{7,8}[0-9K]$/.test(rutLimpio)) return false;
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
	if (dvCalculadoRaw === 11) { dvCalculado = "0"; } 
    else if (dvCalculadoRaw === 10) { dvCalculado = "K"; } 
    else { dvCalculado = dvCalculadoRaw.toString(); }
	return dvCalculado === dvIngresado;
};
//#endregion ![sub]

//#region [main] -  SCHEMA DEFINITION 🔧
export const standardFormObjectSchema = z.object({
	email: z.string().min(1, "El correo electrónico es requerido.").email("Formato de correo electrónico inválido."),
	username: z.string().min(1, "El nombre de usuario es requerido.").min(3, "Mínimo 3 caracteres.").max(20, "Máximo 20 caracteres.").regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo."),
    userRole: z.string().min(1, "Debes seleccionar un rol para el usuario."),

    //> 💡 CORREGIDO: Se ajusta la regla para poder probar el estado de error.
	description: z.string()
		.min(10, "La descripción debe tener al menos 10 caracteres.")
		.max(500, "Máximo 500 caracteres.")
		.optional()
        .or(z.literal("")),

    acceptTerms: z.boolean().refine(val => val === true, {
        message: "Debes aceptar los términos y condiciones para continuar.",
    }),
    
	firstName: z.string().max(50, "Máximo 50 caracteres.").optional().refine(val => !val || val.length >= 2, { message: "Si se ingresa, debe tener al menos 2 caracteres." }),
	lastName: z.string().max(50, "Máximo 50 caracteres.").optional().refine(val => !val || val.length >= 2, { message: "Si se ingresa, debe tener al menos 2 caracteres." }),
	birthDate: z.string().optional().refine((dateStr) => {
		if (!dateStr) return true;
		if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;			
		const date = new Date(dateStr + "T00:00:00");
		if (isNaN(date.getTime())) return false;
		const year = date.getFullYear();
		const currentYear = new Date().getFullYear();
		return year <= currentYear && year >= 1900;
	}, { message: "Fecha inválida o formato incorrecto (YYYY-MM-DD)." }),
	rut: z.string().optional().refine(val => !val || isValidRut(val), { message: "RUT chileno inválido." }),
	accessCode: z.string().min(1, "El código de acceso es requerido.").length(6, "Debe tener exactamente 6 caracteres.").regex(/^[a-zA-Z0-9]+$/, "Solo letras y números."),
});

export const standardFormSchema = standardFormObjectSchema;
export type StandardFormValues = z.infer<typeof standardFormSchema>;
//#endregion ![main]