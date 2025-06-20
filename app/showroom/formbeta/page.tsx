//. 📍 app/showroom/standard-form/page.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler, Controller, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { standardFormSchema, type StandardFormValues } from "./schema";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardCheckbox } from "@/components/ui/StandardCheckbox";
import { StandardSelect, type SelectOption } from "@/components/ui/StandardSelect";
import { toast } from "sonner";
import { Mail, UserCog, Edit3, Eye, Save, Users, Shield, BookUser } from "lucide-react";
//#endregion ![head]

//#region [def] - 📦 TYPES & CONSTANTS 📦
type FormMode = "view" | "create" | "edit";

const initialFormData: StandardFormValues = {
	email: "ada.lovelace@example.com",
	username: "ada_the_first",
    userRole: "admin",
	description: "Esta es una descripción de prueba suficientemente larga.",
    acceptTerms: true,
	firstName: "Augusta Ada",
	lastName: "King-Noel",
	birthDate: "1815-12-10",
	rut: "12.345.678-K",
	accessCode: "CODE01",
};

const roleOptions: SelectOption[] = [
    { value: 'admin', label: 'Administrador', description: 'Acceso total al sistema.', icon: Shield },
    { value: 'editor', label: 'Editor', description: 'Puede crear y modificar contenido.', icon: BookUser },
    { value: 'viewer', label: 'Visitante', description: 'Solo puede ver contenido.', icon: Users, disabled: true },
];
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function StandardFormShowroomPage() {
	//#region [sub] - ✨ STATE & FORM MANAGEMENT ✨
	const [currentMode, setCurrentMode] = useState<FormMode>("create");
	const [formDataForView, setFormDataForView] = useState<StandardFormValues>({ ...initialFormData });

	const isReadOnlyViewMode = currentMode === "view";
	const isFormEditingMode = currentMode === "edit";

	const {
		handleSubmit,
		formState: { errors, isSubmitting, touchedFields, dirtyFields },
		reset,
		watch,
		control,
		setError,
	} = useForm<StandardFormValues>({
		resolver: zodResolver(standardFormSchema),
		mode: "onBlur",
		defaultValues: currentMode === "create" ? { acceptTerms: false, userRole: "" } : { ...formDataForView },
	});

	useEffect(() => {
		if (currentMode === "create") {
			reset({ acceptTerms: false, userRole: "" });
		} else {
			reset({ ...formDataForView });
		}
	}, [currentMode, formDataForView, reset]);
	//#endregion ![sub]

	//#region [sub] - 📞 HANDLERS & HELPERS 📞
	const onValidSubmit: SubmitHandler<StandardFormValues> = async (data) => {
		console.log("StandardForm_OnSubmit (Válido):", data);
		toast.success("Enviando formulario...", { description: "Los datos parecen válidos." });
		await new Promise(resolve => setTimeout(resolve, 1500));

		if (data.username === "test_error_server") {
			setError("username", { type: "server", message: "Este usuario ya existe (error simulado)." });
			toast.error("Error del servidor", { description: "No se pudieron guardar los datos." });
			return;
		}
		
		toast.success("¡Formulario guardado con éxito!", { description: "Tus datos han sido actualizados (simulado)." });
		setFormDataForView({ ...data });
		setCurrentMode("view");
	};

	const onInvalidSubmit = (formErrors: FieldErrors<StandardFormValues>) => {
		console.log("StandardForm_OnSubmit (Inválido):", formErrors);
		toast.error("El formulario tiene errores.", { description: "Por favor, revisa los campos marcados." });
	};

	const getSuccessState = (fieldName: keyof StandardFormValues): boolean => {
		if (isReadOnlyViewMode || errors[fieldName] || (!touchedFields[fieldName] && !dirtyFields[fieldName])) {
			return false;
		}
		const fieldValue = watch(fieldName);

		if (fieldName === 'description' || fieldName === 'userRole') {
            return typeof fieldValue === 'string' && fieldValue.length > 0;
        }

		return !!fieldValue;
	};

	const isFieldRequired = (fieldName: keyof StandardFormValues): boolean => {
		if (isReadOnlyViewMode) return false;
		const fieldSchema = standardFormSchema.shape[fieldName];
		return !fieldSchema.isOptional();
	};
	//#endregion ![sub]

	//#region [render] - 🎨 RENDER 🎨
	return (
		<div className="container mx-auto p-4 md:p-8">
			<StandardCard shadow="lg" className="max-w-3xl mx-auto">
				<StandardCard.Header className="space-y-4">
					<StandardText asElement="h1" size="2xl" weight="bold" colorScheme="primary">
						Showroom: Formulario Integrado &quot;Standard&quot;
					</StandardText>
					<StandardText>
						Prueba de todos nuestros componentes Standard trabajando en conjunto con React Hook Form y Zod.
					</StandardText>
					<div className="flex flex-wrap gap-2 border-b pb-4">
						<StandardButton styleType={currentMode === "create" ? "solid" : "outline"} colorScheme="primary" leftIcon={Edit3} onClick={() => setCurrentMode("create")}>Crear</StandardButton>
						<StandardButton styleType={currentMode === "edit" ? "solid" : "outline"} colorScheme="secondary" leftIcon={Edit3} onClick={() => setCurrentMode("edit")} disabled={!formDataForView.email}>Modificar</StandardButton>
						<StandardButton styleType={currentMode === "view" ? "solid" : "outline"} colorScheme="neutral" leftIcon={Eye} onClick={() => setCurrentMode("view")} disabled={!formDataForView.email}>Ver</StandardButton>
					</div>
				</StandardCard.Header>

				<StandardCard.Content>
					<form onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} className="space-y-7">
						
						<StandardFormField label="Correo Electrónico" htmlFor="email" isRequired={isFieldRequired("email")} error={!isReadOnlyViewMode ? errors.email?.message : undefined}>
							<Controller name="email" control={control} render={({ field, fieldState }) => (
								<StandardInput id="email" type="email" leadingIcon={Mail} placeholder="tu@correo.com"
									readOnly={isReadOnlyViewMode} isEditing={isFormEditingMode}
									success={getSuccessState("email")}
									error={!isReadOnlyViewMode ? fieldState.error?.message : undefined}
									{...field} />
							)}/>
						</StandardFormField>
						
						<StandardFormField label="Nombre de Usuario" htmlFor="username" isRequired={isFieldRequired("username")} error={!isReadOnlyViewMode ? errors.username?.message : undefined} hint="Prueba con 'test_error_server' para simular un error.">
							<Controller name="username" control={control} render={({ field, fieldState }) => (
								<StandardInput id="username" leadingIcon={UserCog} placeholder="Ej: ada_coder"
									readOnly={isReadOnlyViewMode} isEditing={isFormEditingMode}
									success={getSuccessState("username")}
									error={!isReadOnlyViewMode ? fieldState.error?.message : undefined}
									{...field} />
							)}/>
						</StandardFormField>
                        
                        <StandardFormField label="Rol de Usuario" htmlFor="userRole" isRequired={isFieldRequired("userRole")} error={!isReadOnlyViewMode ? errors.userRole?.message : undefined}>
							<Controller name="userRole" control={control} render={({ field, fieldState }) => (
								<StandardSelect id="userRole" placeholder="Selecciona un rol..."
                                    options={roleOptions}
									readOnly={isReadOnlyViewMode} isEditing={isFormEditingMode}
									success={getSuccessState("userRole")}
									error={!isReadOnlyViewMode ? fieldState.error?.message : undefined}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                />
							)}/>
						</StandardFormField>

						<StandardFormField label="Descripción" htmlFor="description" isRequired={isFieldRequired("description")} error={!isReadOnlyViewMode ? errors.description?.message : undefined} hint="Debe tener al menos 10 caracteres.">
							<Controller name="description" control={control} render={({ field, fieldState }) => (
								<StandardTextarea id="description" placeholder="Escribe una breve descripción aquí..." rows={4}
									readOnly={isReadOnlyViewMode} isEditing={isFormEditingMode}
									success={getSuccessState("description")}
									error={!isReadOnlyViewMode ? fieldState.error?.message : undefined}
									showCharacterCount maxLength={500} {...field} />
							)}/>
						</StandardFormField>

                        <StandardFormField label="Términos y Condiciones" htmlFor="acceptTerms" isRequired={isFieldRequired("acceptTerms")} error={!isReadOnlyViewMode ? errors.acceptTerms?.message : undefined}>
							<Controller name="acceptTerms" control={control} render={({ field, fieldState }) => (
								<StandardCheckbox id="acceptTerms" disabled={isReadOnlyViewMode}
                                    checked={field.value} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref}
                                    error={!!fieldState.error}
                                    label={
                                        <StandardText size="sm">
                                            Acepto los <a href="#" className="underline text-primary-pure hover:text-primary-textShade">términos y condiciones</a>.
                                        </StandardText>
                                    }
                                />
							)}/>
						</StandardFormField>

						{!isReadOnlyViewMode && (
							<div className="pt-6">
								<StandardButton type="submit" styleType="solid" colorScheme="primary" fullWidth loading={isSubmitting} disabled={isSubmitting} leftIcon={Save}>
									{isSubmitting ? "Enviando..." : (currentMode === "create" ? "Crear Registro" : "Guardar Cambios")}
								</StandardButton>
							</div>
						)}
					</form>
				</StandardCard.Content>
				<StandardCard.Footer>
					<StandardText size="xs" colorScheme="neutral" colorShade="textShade">
						{currentMode === "view" ? "Mostrando datos guardados." : "Prueba las validaciones y los modos de formulario."}
					</StandardText>
				</StandardCard.Footer>
			</StandardCard>
		</div>
	);
	//#endregion ![render]
}
//#endregion ![main]