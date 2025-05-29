// app/showroom/formbeta/page.tsx
"use client";

import React from "react";
import { useForm, SubmitHandler, Controller, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formBetaSchema, type FormBetaValues } from "./schema"; // Asegúrate que schema.ts esté en la misma ruta o ajusta la importación
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { CustomButton } from "@/components/ui/custom-button";
import { ProCard } from "@/components/ui/pro-card";
import { Text } from "@/components/ui/text";
import { toast } from "sonner";
import { 
  Mail, User, UserCog, CalendarDays, Fingerprint, KeyRound, Edit3, Eye
} from "lucide-react";
import type { InputVariant } from "@/lib/theme/components/input-tokens";
import { TextArea } from "@/components/ui/textarea";


type FormMode = "view" | "create" | "edit";

const initialFormData: FormBetaValues = {
  email: "ada.lovelace@example.com",
  username: "ada_the_first",
  firstName: "Augusta Ada",
  lastName: "King-Noel",
  birthDate: "1815-12-10",
  rut: "12.345.678-K",
  accessCode: "CODE01",
  description: "Esta es una descripción de prueba."
};

// Helper para validación en vivo del formato de fecha
const checkLiveDateFormat = (value: string): string | undefined => {
  if (!value) return undefined; // Si está vacío, no hay error de formato en vivo (Zod se encargará si es requerido)
  if (!/^[0-9-]*$/.test(value)) return "Solo números y guiones";
  const parts = value.split('-');
  if (parts[0] && parts[0].length > 4) return "Año excede 4 dígitos";
  if (parts[1] && parts[1].length > 2) return "Mes excede 2 dígitos";
  if (parts[2] && parts[2].length > 2) return "Día excede 2 dígitos";
  // Si tiene la longitud completa pero el formato no es exacto YYYY-MM-DD
  if (value.length === 10 && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Formato debe ser YYYY-MM-DD";
  return undefined;
};

export default function FormBetaShowroomPage() {
  const [currentMode, setCurrentMode] = React.useState<FormMode>("create");
  const [formDataForView, setFormDataForView] = React.useState<FormBetaValues>({ ...initialFormData });
  const [submissionStatus, setSubmissionStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [currentVariant, setCurrentVariant] = React.useState<InputVariant>("default");
  
  const isReadOnlyViewMode = currentMode === "view";
  const isFormEditingMode = currentMode === "edit";

  const {
    handleSubmit,
    formState: { errors, isSubmitting, isValidating, touchedFields, dirtyFields },
    reset,
    watch,
    control,
    setValue,
    setError, // Para errores del servidor
  } = useForm<FormBetaValues>({
    resolver: zodResolver(formBetaSchema),
    mode: "onBlur", // Validar en onBlur
    reValidateMode: "onBlur", // Revalidar también en onBlur
    defaultValues: currentMode === "create" ? {} : { ...formDataForView },
  });

  React.useEffect(() => {
    if (currentMode === "create") {
      reset({}); // Limpiar formulario para modo crear
    } else {
      reset({ ...formDataForView }); // Cargar datos para modo ver/editar
    }
    setSubmissionStatus("idle"); // Resetear estado de envío
  }, [currentMode, formDataForView, reset]);

  const onValidSubmit: SubmitHandler<FormBetaValues> = async (data) => {
    console.log("FormBeta_OnSubmit (Válido) Intentando enviar:", data);
    setSubmissionStatus("idle");
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay de red

    if (data.username === "test_error_server") {
      setError("username", { type: "server", message: "Este nombre de usuario ya existe (error del servidor)." });
      setError("email", { type: "server", message: "El correo podría estar duplicado (error del servidor)." });
      toast.error("Error del servidor", {
          description: "No se pudieron guardar los datos. Intenta de nuevo.",
          duration: 5000,
      });
      setSubmissionStatus("error");
      return;
    }
    
    toast.success("¡Formulario enviado con éxito!", {
      description: "Tus datos han sido guardados (simulado).",
      duration: 3000,
    });
    setFormDataForView({ ...data }); // Guardar datos para modo vista
    setSubmissionStatus("success");
    setCurrentMode("view"); // Cambiar a modo vista después de éxito
  };

  const onInvalidSubmit = (formErrors: FieldErrors<FormBetaValues>) => {
    console.log("FormBeta_OnSubmit (Inválido):", formErrors);
    toast.error("El formulario tiene errores.", {
      description: "Por favor, revisa los campos marcados e inténtalo de nuevo.",
      duration: 5000,
    });
    setSubmissionStatus("error");
  };

  const handleModeChange = (mode: FormMode) => {
    setCurrentMode(mode);
  };

  const getSuccessState = (
    fieldName: keyof FormBetaValues,
    fieldErrorFromState?: string, // Error de react-hook-form (Zod)
    liveFormatError?: string     // Error de validación en vivo (ej. checkLiveDateFormat)
  ) => {
    if (isReadOnlyViewMode) return false;

    if (fieldErrorFromState || liveFormatError) {
      return false;
    }

    if (!touchedFields[fieldName] && !dirtyFields[fieldName]) {
      return false;
    }
    
    const fieldValue = watch(fieldName);
        
    switch (fieldName) {
      case "email":
        // Éxito si tiene formato de email básico y no hay error de Zod
        return typeof fieldValue === 'string' && fieldValue.includes('@') && fieldValue.includes('.') && !errors[fieldName];
      case "username":
      case "firstName":
      case "lastName":
      case "rut":
        return !!fieldValue && !errors[fieldName];

      case "birthDate":
        if (typeof fieldValue === 'string' && fieldValue.length > 0) {
          return /^\d{4}-\d{2}-\d{2}$/.test(fieldValue) && !errors[fieldName] && !liveFormatError;
        }
        return false;
      
      case "accessCode":
        if (typeof fieldValue === 'string') {
          return fieldValue.length === 6 && !errors[fieldName];
        }
        return false;
      
      case "description":
         if (typeof fieldValue === 'string') {
            return fieldValue.length > 0 && fieldValue.length <= 500 && !errors[fieldName];
        }
        return false;

      default:
        return !!fieldValue && !errors[fieldName];
    }
  };
  
  const isFieldRequired = (fieldName: keyof FormBetaValues): boolean => {
    if (isReadOnlyViewMode) return false;
    // @ts-ignore
    const fieldSchema = formBetaSchema.shape[fieldName];
    // @ts-ignore
    return !fieldSchema.isOptional();
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <ProCard className="max-w-3xl mx-auto">
        <ProCard.Header className="space-y-4">
          <Text variant="heading" size="2xl" color="primary">
            Showroom: Formulario Beta (Adaptado FormField para mensajes)
          </Text>
          <Text>
            Probando Inputs y TextAreas con ARIA, validaciones, formatos y modos,
            con mensajes de error/hint gestionados por `FormField`.
          </Text>
          <div className="flex flex-wrap gap-2 border-b pb-4">
            <CustomButton
              onClick={() => handleModeChange("create")}
              variant={currentMode === "create" ? "solid" : "outline"}
              color="primary" leftIcon={<Edit3 />}
            > Crear </CustomButton>
            <CustomButton
              onClick={() => handleModeChange("edit")}
              variant={currentMode === "edit" ? "solid" : "outline"}
              color="secondary" leftIcon={<Edit3 />}
              disabled={Object.keys(formDataForView).every(k => !formDataForView[k as keyof FormBetaValues]) && !initialFormData.email}
            > Modificar </CustomButton>
            <CustomButton
              onClick={() => handleModeChange("view")}
              variant={currentMode === "view" ? "solid" : "outline"}
              color="default" leftIcon={<Eye />}
              disabled={Object.keys(formDataForView).every(k => !formDataForView[k as keyof FormBetaValues]) && !initialFormData.email}
            > Ver (ReadOnly) </CustomButton>
          </div>
          <div className="pt-2">
            <Text size="sm" color="neutral" className="mb-1">Variante de Inputs:</Text>
            <CustomButton size="xs" onClick={() => setCurrentVariant(currentVariant === "default" ? "primary" : "default")}>
              Cambiar a {currentVariant === "default" ? "Primary" : "Default"}
            </CustomButton>
          </div>
        </ProCard.Header>

        <ProCard.Content>
          <form onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} className="space-y-7">
            
            <FormField 
              label="Correo Electrónico" 
              htmlFor="email-input"
              isRequired={isFieldRequired("email")}
              error={!isReadOnlyViewMode ? errors.email?.message : undefined}
              hint={isReadOnlyViewMode ? undefined : "Escribe tu dirección de correo completa."}
            >
              <Controller
                name="email"
                control={control}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <Input
                    id="email-input"
                    type="email" leadingIcon={Mail} placeholder="tu@correo.com"
                    autoComplete="email"
                    error={!isReadOnlyViewMode ? fieldState.error?.message : undefined}
                    success={getSuccessState("email", fieldState.error?.message)}
                    readOnly={isReadOnlyViewMode}
                    isEditing={isFormEditingMode && !isReadOnlyViewMode}
                    variant={currentVariant}
                    {...field} value={field.value || ""}
                    isRequired={isFieldRequired("email")}
                  />
                )}
              />
            </FormField>

            <FormField 
              label="Nombre de Usuario" 
              htmlFor="username-input" 
              isRequired={isFieldRequired("username")}
              error={!isReadOnlyViewMode ? errors.username?.message : undefined}
              hint={isReadOnlyViewMode ? undefined : "De 3 a 20 caracteres, solo letras, números y guion bajo."}
            >
              <Controller
                name="username"
                control={control}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <Input
                    id="username-input" 
                    leadingIcon={UserCog} placeholder="Ej: ada_coder (o test_error_server)"
                    autoComplete="username"
                    error={!isReadOnlyViewMode ? fieldState.error?.message : undefined}
                    success={getSuccessState("username", fieldState.error?.message)}
                    readOnly={isReadOnlyViewMode}
                    isEditing={isFormEditingMode && !isReadOnlyViewMode}
                    variant={currentVariant}
                    {...field} value={field.value || ""}
                    isRequired={isFieldRequired("username")}
                  />
                )}
              />
            </FormField>
            
            <FormField 
              label="Primer Nombre" 
              htmlFor="firstName-input" 
              isRequired={isFieldRequired("firstName")}
              error={!isReadOnlyViewMode ? errors.firstName?.message : undefined}
            >
              <Controller
                name="firstName"
                control={control}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <Input
                    id="firstName-input" leadingIcon={User} placeholder="Ej: Augusta Ada"
                    autoComplete="given-name"
                    error={!isReadOnlyViewMode ? fieldState.error?.message : undefined}
                    success={getSuccessState("firstName", fieldState.error?.message)}
                    readOnly={isReadOnlyViewMode}
                    isEditing={isFormEditingMode && !isReadOnlyViewMode}
                    variant={currentVariant}
                    {...field} value={field.value || ""}
                    isRequired={isFieldRequired("firstName")}
                  />
                )}
              />
            </FormField>

            <FormField 
              label="Apellido" 
              htmlFor="lastName-input" 
              isRequired={isFieldRequired("lastName")}
              error={!isReadOnlyViewMode ? errors.lastName?.message : undefined}
            >
              <Controller
                name="lastName"
                control={control}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <Input
                    id="lastName-input" leadingIcon={User} placeholder="Ej: King-Noel"
                    autoComplete="family-name"
                    error={!isReadOnlyViewMode ? fieldState.error?.message : undefined}
                    success={getSuccessState("lastName", fieldState.error?.message)}
                    readOnly={isReadOnlyViewMode}
                    isEditing={isFormEditingMode && !isReadOnlyViewMode}
                    variant={currentVariant}
                    {...field} value={field.value || ""}
                    isRequired={isFieldRequired("lastName")}
                  />
                )}
              />
            </FormField>

            <FormField 
              label="Fecha de Nacimiento (YYYY-MM-DD)" 
              htmlFor="birthDate-input" 
              isRequired={isFieldRequired("birthDate")}
              error={!isReadOnlyViewMode ? (errors.birthDate?.message || checkLiveDateFormat(watch("birthDate") || "")) : undefined}
              hint={isReadOnlyViewMode ? undefined : "Formato YYYY-MM-DD. Ejemplo: 1990-12-31"}
            >
              <Controller
                name="birthDate"
                control={control}
                defaultValue=""
                render={({ field, fieldState }) => {
                  const liveFormatError = checkLiveDateFormat(field.value || "");
                  const displayError = !isReadOnlyViewMode ? (fieldState.error?.message || liveFormatError) : undefined;
                  const isSuccess = getSuccessState("birthDate", fieldState.error?.message, liveFormatError);
                  return (
                    <Input
                      id="birthDate-input" type="text" leadingIcon={CalendarDays} placeholder="YYYY-MM-DD"
                      autoComplete="bday"
                      error={displayError}
                      success={isSuccess}
                      readOnly={isReadOnlyViewMode}
                      isEditing={isFormEditingMode && !isReadOnlyViewMode}
                      variant={currentVariant}
                      {...field} value={field.value || ""}
                      isRequired={isFieldRequired("birthDate")}
                    />);
                }}/>
            </FormField>
            
            <FormField 
              label="Descripción (Opcional)" 
              htmlFor="description-input" 
              isRequired={isFieldRequired("description")}
              error={!isReadOnlyViewMode ? errors.description?.message : undefined}
              hint={isReadOnlyViewMode ? undefined : "Máximo 500 caracteres para la descripción."}
            >
              <Controller
                name="description"
                control={control}
                defaultValue=""
                render={({ field, fieldState }) => (
                  <TextArea
                    id="description-input"
                    placeholder="Escribe una breve descripción aquí..."
                    rows={4}
                    error={!isReadOnlyViewMode ? fieldState.error?.message : undefined}
                    success={getSuccessState("description", fieldState.error?.message)}
                    readOnly={isReadOnlyViewMode}
                    isEditing={isFormEditingMode && !isReadOnlyViewMode}
                    variant={"default"} 
                    {...field} value={field.value || ""}
                    isRequired={isFieldRequired("description")}
                    maxLength={500}
                    showCharacterCount
                  />
                )}
              />
            </FormField>

            <FormField 
              label="RUT Chileno (Opcional)" 
              htmlFor="rut-input" 
              isRequired={isFieldRequired("rut")}
              error={!isReadOnlyViewMode ? errors.rut?.message : undefined}
            >
               <Controller
                name="rut"
                control={control}
                defaultValue=""
                render={({ field, fieldState }) => {
                  const displayError = !isReadOnlyViewMode ? fieldState.error?.message : undefined;
                  const isSuccess = getSuccessState("rut", fieldState.error?.message);
                  return (
                      <Input
                      id="rut-input" leadingIcon={Fingerprint} placeholder="Ej: 12.345.678-K"
                      error={displayError}
                      success={isSuccess}
                      readOnly={isReadOnlyViewMode}
                      isEditing={isFormEditingMode && !isReadOnlyViewMode}
                      variant={currentVariant}
                      {...field} value={field.value || ""}
                      isRequired={isFieldRequired("rut")}
                    />
                  );
                }}
              />
            </FormField>

            <FormField 
              label="Código de Acceso (6 caracteres)" 
              htmlFor="accessCode-input" 
              isRequired={isFieldRequired("accessCode")}
              error={!isReadOnlyViewMode ? errors.accessCode?.message : undefined}
              hint={isReadOnlyViewMode ? undefined : "Debe contener exactamente 6 caracteres alfanuméricos."}
            >
              <Controller
                name="accessCode"
                control={control}
                defaultValue=""
                render={({ field, fieldState }) => (
                    <Input
                    id="accessCode-input" leadingIcon={KeyRound} placeholder="XXXXXX"
                    maxLength={6} showCharacterCount
                    autoComplete="one-time-code"
                    error={!isReadOnlyViewMode ? fieldState.error?.message : undefined}
                    success={getSuccessState("accessCode", fieldState.error?.message)}
                    readOnly={isReadOnlyViewMode}
                    isEditing={isFormEditingMode && !isReadOnlyViewMode}
                    variant={currentVariant}
                    {...field} value={field.value || ""}
                    isRequired={isFieldRequired("accessCode")}
                  />
                )}
              />
            </FormField>
            
            {!isReadOnlyViewMode && (
              <div className="pt-6">
                <CustomButton type="submit" color="primary" fullWidth loading={isSubmitting || isValidating} disabled={isSubmitting || isValidating}>
                  {isSubmitting ? "Enviando..." : (currentMode === "create" ? "Crear Registro" : "Guardar Cambios")}
                </CustomButton>
              </div>
            )}

            {isReadOnlyViewMode && (Object.keys(formDataForView).length > 0 && !!formDataForView.email) && (
                 <div className="pt-6 flex flex-wrap gap-2">
                    <CustomButton onClick={() => handleModeChange("edit")} color="secondary" leftIcon={<Edit3/>}>
                        Modificar estos datos
                    </CustomButton>
                     <CustomButton onClick={() => handleModeChange("create")} color="primary" variant="outline" leftIcon={<Edit3/>}>
                        Crear Nuevo
                    </CustomButton>
                </div>
            )}
          </form>
        </ProCard.Content>
        <ProCard.Footer>
          <Text variant="caption" color="neutral" colorVariant="textShade">
            {currentMode === "view" ? "Mostrando datos guardados." : (submissionStatus === "success" ? "¡Datos guardados con éxito!" : "Prueba las validaciones y los diferentes modos.")}
          </Text>
        </ProCard.Footer>
      </ProCard>
    </div>
  );
}