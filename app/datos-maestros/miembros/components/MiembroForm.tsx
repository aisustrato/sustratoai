// app/datos-maestros/miembros/components/MiembroForm.tsx
"use client";

import React from "react";
import { useForm, Controller, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { SelectCustom, type SelectOption } from "@/components/ui/select-custom";
import { FormField } from "@/components/ui/form-field"; // Asegúrate de que FormField pueda recibir y mostrar 'hint' y 'successMessage'
import { StandardButton } from "@/components/ui/StandardButton"; // Changed import
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { Text } from "@/components/ui/text";
import {
  Mail, User, Briefcase, Building, Phone, Languages, MessageSquare
} from "lucide-react";

const formSchema = z.object({
  emailUsuario: z.string().email("Email inválido").min(1, "El email es requerido"),
  rolId: z.string().min(1, "Debe seleccionar un rol"),

  firstName: z.string()
    .max(50, "El nombre no puede exceder los 50 caracteres.")
    .optional()
    .refine(val => !val || val.length === 0 || val.length >= 3, {
      message: "Si ingresas un nombre, debe tener al menos 3 caracteres.",
    }),

  lastName: z.string()
    .max(50, "El apellido no puede exceder los 50 caracteres.")
    .optional()
    .refine(val => !val || val.length === 0 || val.length >= 3, {
      message: "Si ingresas un apellido, debe tener al menos 3 caracteres.",
    }),

  displayName: z.string()
    .max(100, "El nombre para mostrar no puede exceder los 100 caracteres.")
    .optional()
    .refine(val => !val || val.length === 0 || val.length >= 3, {
      message: "Si ingresas un nombre para mostrar, debe tener al menos 3 caracteres.",
    }),

  institution: z.string()
    .max(100, "La institución no puede exceder los 100 caracteres.")
    .optional()
    .refine(val => !val || val.length === 0 || val.length >= 3, {
      message: "Si ingresas una institución, debe tener al menos 3 caracteres.",
    }),

  phone: z.string()
    .max(25, "El teléfono no puede exceder los 25 caracteres.")
    .optional()
    .refine(val => {
      if (!val || val.trim() === "") return true;
      const soloNumeros = val.replace(/[^0-9]/g, "");
      return /^[0-9+\-\s()]*$/.test(val) && soloNumeros.length >= 7;
    }, {
      message: "Formato de teléfono inválido o muy corto (mín. 7 dígitos).",
    }),

  notes: z.string().max(500, "Las notas no pueden exceder los 500 caracteres.").optional(),
  
  language: z.string().optional(),

  pronouns: z.string()
    .max(30, "Los pronombres no pueden exceder los 30 caracteres.")
    .optional()
    .refine(val => !val || val.length === 0 || val.length >= 2, {
      message: "Si ingresas pronombres, deben tener al menos 2 caracteres.",
    }),
});

export type MiembroFormValues = z.infer<typeof formSchema>;

interface MiembroFormProps {
  modo: "crear" | "editar" | "ver";
  valoresIniciales?: Partial<MiembroFormValues>;
  rolesDisponibles: SelectOption[];
  onSubmit?: (data: MiembroFormValues) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const MiembroForm: React.FC<MiembroFormProps> = ({
  modo,
  valoresIniciales,
  rolesDisponibles,
  onSubmit,
  disabled = false,
  loading = false,
}) => {

  const initialFormValues = React.useMemo(() => {
    if (modo === "crear") {
      return (valoresIniciales && Object.keys(valoresIniciales).length > 0) 
             ? valoresIniciales 
             : {};
    }
    return valoresIniciales || {};
  }, [modo, valoresIniciales]);

  const form = useForm<MiembroFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialFormValues,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  React.useEffect(() => {
    form.reset(initialFormValues);
  }, [initialFormValues, form]); 

  const isReadOnlyEffective = modo === "ver" || disabled;

  const isFieldRequired = (fieldName: keyof MiembroFormValues): boolean => {
    if (isReadOnlyEffective) return false;
    const fieldSchema = formSchema.shape[fieldName];
    // @ts-ignore // ZodObject.isOptional() no está directamente en el tipo, pero existe en la instancia.
    return !fieldSchema.isOptional();
  };

  const getSuccessState = (fieldName: keyof MiembroFormValues) => {
    if (isReadOnlyEffective) return false;

    if (form.formState.errors[fieldName]) {
      return false;
    }

    if (!form.formState.touchedFields[fieldName] && !form.formState.dirtyFields[fieldName]) {
      return false;
    }
    
    const fieldValue = form.watch(fieldName);
        
    switch (fieldName) {
      case "firstName":
      case "lastName":
      case "displayName":
      case "institution":
        return typeof fieldValue === 'string' && fieldValue.length >= 3;
      case "pronouns":
        return typeof fieldValue === 'string' && fieldValue.length >= 2;
      case "phone":
        if (typeof fieldValue === 'string' && fieldValue.trim() !== "") {
          const soloNumeros = fieldValue.replace(/[^0-9]/g, "");
          return /^[0-9+\-\s()]*$/.test(fieldValue) && soloNumeros.length >= 7;
        }
        return false; 
      
      case "emailUsuario":
        // Lógica para el email: éxito si parece email y no hay error de Zod
        return !!fieldValue && typeof fieldValue === 'string' && fieldValue.includes('@') && fieldValue.includes('.') && !form.formState.errors[fieldName];
      case "rolId":
      case "language": 
        return !!fieldValue && !form.formState.errors[fieldName];
      
      case "notes":
        if (typeof fieldValue === 'string') {
            return fieldValue.length > 0 && fieldValue.length <= 500 && !form.formState.errors[fieldName];
        }
        return false;

      default:
        return !!fieldValue && !form.formState.errors[fieldName];
    }
  };

  const handleFormSubmit = (data: MiembroFormValues) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };
  
  const onInvalidSubmit = (errors: FieldErrors<MiembroFormValues>) => {
    console.log("MiembroForm (Inválido):", errors);
  };

  return (
    <StandardCard styleType="subtle" hasOutline={false} accentPlacement="none">
    
      <StandardCard.Content>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit, onInvalidSubmit)}
          className="space-y-6"
        >
          <Text variant="heading" size="md" color="tertiary" className="pb-2 border-b">
            Información del Miembro
          </Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <FormField
              label="Email del Usuario"
              htmlFor="mf-emailUsuario"
              isRequired={isFieldRequired("emailUsuario")}
              error={form.formState.errors.emailUsuario?.message}
              hint={isReadOnlyEffective ? undefined : (modo === "editar" ? "El email no se puede modificar una vez creado." : "Email principal para el inicio de sesión y contacto.")}
            >
              <Controller
                name="emailUsuario"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    id="mf-emailUsuario"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    leadingIcon={Mail}
                    error={!isReadOnlyEffective ? fieldState.error?.message : undefined}
                    success={getSuccessState("emailUsuario")}
                    readOnly={isReadOnlyEffective || modo === "editar"}
                    isEditing={modo === "editar" && !(isReadOnlyEffective || modo === "editar")}
                    isRequired={isFieldRequired("emailUsuario")}
                    {...field}
                    value={field.value || ""}
                    // hint prop eliminada de Input
                  />
                )}
              />
            </FormField>

            <FormField
              label="Rol en el Proyecto"
              htmlFor="mf-rolId"
              isRequired={isFieldRequired("rolId")}
              error={form.formState.errors.rolId?.message}
              hint={isReadOnlyEffective ? undefined : "El rol define los permisos del miembro en este proyecto."}
            >
              <Controller
                name="rolId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <SelectCustom
                    id="mf-rolId"
                    placeholder="Selecciona un rol"
                    options={rolesDisponibles}
                    leadingIcon={Briefcase}
                    error={!isReadOnlyEffective ? fieldState.error?.message : undefined}
                    success={getSuccessState("rolId")}
                    disabled={isReadOnlyEffective}
                    isRequired={isFieldRequired("rolId")}
                    isEditing={modo === "editar" && !isReadOnlyEffective}
                    clearable={!isReadOnlyEffective}
                    {...field}
                    // hint prop eliminada de SelectCustom
                  />
                )}
              />
            </FormField>
          </div>

          <Text variant="heading" size="md" color="tertiary" className="pt-4 pb-2 border-b">
            Información Adicional de Perfil (Opcional)
          </Text>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <FormField 
              label="Nombre(s)" 
              htmlFor="mf-firstName" 
              isRequired={isFieldRequired("firstName")} 
              error={form.formState.errors.firstName?.message}
            >
              <Controller
                name="firstName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    id="mf-firstName"
                    placeholder="Nombre(s) de pila"
                    leadingIcon={User}
                    error={!isReadOnlyEffective ? fieldState.error?.message : undefined}
                    success={getSuccessState("firstName")}
                    readOnly={isReadOnlyEffective}
                    isEditing={modo === "editar" && !isReadOnlyEffective}
                    isRequired={isFieldRequired("firstName")}
                    {...field}
                    value={field.value || ""}
                  />
                )}
              />
            </FormField>

            <FormField 
              label="Apellido(s)" 
              htmlFor="mf-lastName" 
              isRequired={isFieldRequired("lastName")} 
              error={form.formState.errors.lastName?.message}
            >
              <Controller
                name="lastName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    id="mf-lastName"
                    placeholder="Apellido(s)"
                    leadingIcon={User}
                    error={!isReadOnlyEffective ? fieldState.error?.message : undefined}
                    success={getSuccessState("lastName")}
                    readOnly={isReadOnlyEffective}
                    isEditing={modo === "editar" && !isReadOnlyEffective}
                    isRequired={isFieldRequired("lastName")}
                    {...field}
                    value={field.value || ""}
                  />
                )}
              />
            </FormField>

            <FormField 
              label="Nombre para Mostrar" 
              htmlFor="mf-displayName" 
              isRequired={isFieldRequired("displayName")} 
              error={form.formState.errors.displayName?.message}
              hint={isReadOnlyEffective ? undefined : "Ej: 'Dra. Ada L.' o 'Ada Lovelace'"}
            >
              <Controller
                name="displayName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    id="mf-displayName"
                    placeholder="Cómo se mostrará públicamente"
                    leadingIcon={User}
                    error={!isReadOnlyEffective ? fieldState.error?.message : undefined}
                    success={getSuccessState("displayName")}
                    readOnly={isReadOnlyEffective}
                    isEditing={modo === "editar" && !isReadOnlyEffective}
                    isRequired={isFieldRequired("displayName")}
                    {...field}
                    value={field.value || ""}
                    // hint prop eliminada de Input
                  />
                )}
              />
            </FormField>

            <FormField 
              label="Institución" 
              htmlFor="mf-institution" 
              isRequired={isFieldRequired("institution")} 
              error={form.formState.errors.institution?.message}
            >
              <Controller
                name="institution"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    id="mf-institution"
                    placeholder="Institución o afiliación principal"
                    leadingIcon={Building}
                    error={!isReadOnlyEffective ? fieldState.error?.message : undefined}
                    success={getSuccessState("institution")}
                    readOnly={isReadOnlyEffective}
                    isEditing={modo === "editar" && !isReadOnlyEffective}
                    isRequired={isFieldRequired("institution")}
                    {...field}
                    value={field.value || ""}
                  />
                )}
              />
            </FormField>

            <FormField 
              label="Teléfono" 
              htmlFor="mf-phone" 
              isRequired={isFieldRequired("phone")} 
              error={form.formState.errors.phone?.message}
            >
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => {
                  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const rawValue = e.target.value;
                    const cleanedValue = rawValue.replace(/[^0-9+\-\s()]/g, "");
                    field.onChange(cleanedValue);
                  };

                  return (
                    <Input
                      id="mf-phone"
                      type="tel"
                      placeholder="Ej: +56 (2) 1234-5678"
                      leadingIcon={Phone}
                      error={!isReadOnlyEffective ? fieldState.error?.message : undefined}
                      success={getSuccessState("phone")}
                      readOnly={isReadOnlyEffective}
                      isEditing={modo === "editar" && !isReadOnlyEffective}
                      isRequired={isFieldRequired("phone")}
                      {...field}
                      value={field.value || ""}
                      onChange={isReadOnlyEffective ? undefined : handlePhoneChange}
                    />
                  );
                }}
              />
            </FormField>

            <FormField 
              label="Lenguaje Preferido" 
              htmlFor="mf-language" 
              isRequired={isFieldRequired("language")} 
              error={form.formState.errors.language?.message}
            >
              <Controller
                name="language"
                control={form.control}
                render={({ field, fieldState }) => (
                  <SelectCustom
                    id="mf-language"
                    placeholder="Selecciona un idioma"
                    options={[
                      { value: "es", label: "Español" },
                      { value: "en", label: "Inglés" },
                      { value: "pt", label: "Portugués" },
                    ]}
                    leadingIcon={Languages}
                    error={!isReadOnlyEffective ? fieldState.error?.message : undefined}
                    success={getSuccessState("language")}
                    disabled={isReadOnlyEffective}
                    isRequired={isFieldRequired("language")}
                    isEditing={modo === "editar" && !isReadOnlyEffective}
                    clearable={!isReadOnlyEffective}
                    {...field}
                  />
                )}
              />
            </FormField>

            <FormField 
              label="Pronombres" 
              htmlFor="mf-pronouns" 
              isRequired={isFieldRequired("pronouns")} 
              error={form.formState.errors.pronouns?.message} 
              className="md:col-span-2"
              hint={isReadOnlyEffective ? undefined : "Para asegurar una comunicación respetuosa."}
            >
              <Controller
                name="pronouns"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    id="mf-pronouns"
                    placeholder="Ej: él/ella, elle, they/them"
                    leadingIcon={MessageSquare}
                    error={!isReadOnlyEffective ? fieldState.error?.message : undefined}
                    success={getSuccessState("pronouns")}
                    readOnly={isReadOnlyEffective}
                    isEditing={modo === "editar" && !isReadOnlyEffective}
                    isRequired={isFieldRequired("pronouns")}
                    {...field}
                    value={field.value || ""}
                    // hint prop eliminada de Input
                  />
                )}
              />
            </FormField>
          </div>

          <FormField 
            label="Notas Adicionales" 
            htmlFor="mf-notes" 
            isRequired={isFieldRequired("notes")} 
            error={form.formState.errors.notes?.message} 
            className="col-span-full"
            hint={isReadOnlyEffective ? undefined : "Máximo 500 caracteres."}
          >
            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextArea
                  id="mf-notes"
                  placeholder="Información adicional relevante sobre el miembro..."
                  rows={4}
                  error={!isReadOnlyEffective ? fieldState.error?.message : undefined}
                  success={getSuccessState("notes")}
                  readOnly={isReadOnlyEffective}
                  isEditing={modo === "editar" && !isReadOnlyEffective}
                  isRequired={isFieldRequired("notes")}
                  maxLength={500}
                  showCharacterCount
                  {...field}
                  value={field.value || ""}
                  // hint prop eliminada de TextArea
                />
              )}
            />
          </FormField>

          {modo !== "ver" && (
            <div className="flex justify-end gap-3 pt-4">
              <StandardButton
                type="submit"
                colorScheme="primary" // Mapped color
                styleType="solid" // Assumed default variant
                loading={loading || form.formState.isSubmitting}
                disabled={loading || form.formState.isSubmitting || (modo === "editar" && !form.formState.isDirty)}
              >
                {modo === "crear"
                  ? (loading || form.formState.isSubmitting) ? "Agregando..." : "Agregar Miembro"
                  : (loading || form.formState.isSubmitting) ? "Guardando..." : "Guardar Cambios"}
              </StandardButton>
            </div>
          )}
        </form>
      </StandardCard.Content>
    </StandardCard>
  );
};