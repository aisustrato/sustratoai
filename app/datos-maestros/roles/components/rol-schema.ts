//. 📍 app/datos-maestros/roles/components/rol-schema.ts

//#region [head] - 🏷️ IMPORTS 🏷️
import { z } from "zod";
//#endregion ![head]

//#region [def] - 📦 SCHEMA, TYPES, PROPS & CONSTANTS 📦
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
//#endregion ![def]

//#region [main] - 🔧 COMPONENT/LOGIC 🔧
//> 📝 No main component or direct executable logic in this schema file.
//#endregion ![main]

//#region [sub] - 🧰 HELPER FUNCTIONS 🧰
//> 📝 No helper functions defined in this schema file.
//#endregion ![sub]

//#region [render] - 🎨 RENDER SECTION 🎨
//> 📝 No UI rendering in this schema file.
//#endregion ![render]

//#region [todo] - 👀 PENDIENTES 👀
//> 📝 No specific TODOs for this schema file at the moment.
//#endregion ![todo]

//#region [foo] - 🔚 EXPORTS 🔚
//> 📝 Exports (rolFormSchema, RolFormValues) are defined within the [def] region.
//#endregion ![foo]