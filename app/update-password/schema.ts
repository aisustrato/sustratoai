//. 📍 app/update-password/schema.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import { z } from "zod";
//#endregion ![head]

//#region [main] - 🔧 SCHEMA DEFINITION 🔧
export const updatePasswordSchema = z.object({
	password: z.string()
		.min(1, "La contraseña es requerida.")
		.min(8, "La contraseña debe tener al menos 8 caracteres.")
		.regex(/[A-Z]/, "Debe contener al menos una letra mayúscula.")
		.regex(/[0-9]/, "Debe contener al menos un número.")
		.regex(/[!@#$%^&*(),.?":{}|<>]/, "Debe contener al menos un símbolo especial."),
	
	confirmPassword: z.string()
		.min(1, "La confirmación de contraseña es requerida.")
}).refine((data) => data.password === data.confirmPassword, {
	message: "Las contraseñas no coinciden.",
	path: ["confirmPassword"], // El error se mostrará en el campo confirmPassword
});

export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;
//#endregion ![main]
