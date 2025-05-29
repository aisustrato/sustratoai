// Podría estar en un archivo separado como 'rol-schema.ts' o dentro de RolForm.tsx
import { z } from "zod";

export const rolFormSchema = z.object({
  role_name: z.string()
    .min(3, "El nombre del rol debe tener al menos 3 caracteres.")
    .max(100, "El nombre del rol no puede exceder los 100 caracteres."),
  role_description: z.string()
    .max(500, "La descripción no puede exceder los 500 caracteres.")
    .optional(),
  can_manage_master_data: z.boolean().default(false),
  can_create_batches: z.boolean().default(false),
  can_upload_files: z.boolean().default(false),
  can_bulk_edit_master_data: z.boolean().default(false),
});

export type RolFormValues = z.infer<typeof rolFormSchema>;