// app/datos-maestros/roles/components/RolForm.tsx
"use client";

import React from "react";
import {
	useForm,
	Controller,
	FieldErrors,
	SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { CustomCheck } from "@/components/ui/custom-check";
import { FormField } from "@/components/ui/form-field";
import { CustomButton } from "@/components/ui/custom-button";
import { Text } from "@/components/ui/text";
import {
	Shield,
	ListChecks, // FileText no se usaba
	UploadCloud,
	DatabaseZap,
	Edit,
} from "lucide-react";

const rolFormSchema = z.object({
	role_name: z
		.string()
		.min(3, "El nombre del rol debe tener al menos 3 caracteres.")
		.max(100, "El nombre del rol no puede exceder los 100 caracteres."),
	role_description: z
		.string()
		.max(500, "La descripción no puede exceder los 500 caracteres.")
		.nullable()
		.optional(),
	can_manage_master_data: z.boolean(),
	can_create_batches: z.boolean(),
	can_upload_files: z.boolean(),
	can_bulk_edit_master_data: z.boolean(),
});

export type RolFormValues = z.infer<typeof rolFormSchema>;

interface RolFormProps {
	modo: "crear" | "editar" | "ver";
	valoresIniciales?: Partial<RolFormValues>;
	onSubmit?: (data: RolFormValues) => void;
	disabled?: boolean; 
	loading?: boolean;
  isEditingForm?: boolean; // NUEVA PROP para el estilo de edición
}

export const RolForm: React.FC<RolFormProps> = ({
	modo,
	valoresIniciales,
	onSubmit,
	disabled = false,
	loading = false,
  isEditingForm = false, // Valor por defecto para la nueva prop
}) => {
	const defaultFormValues: RolFormValues = React.useMemo(() => {
		return {
			role_name: valoresIniciales?.role_name || "",
			role_description:
				valoresIniciales?.role_description === undefined
					? null
					: valoresIniciales.role_description,
			can_manage_master_data: valoresIniciales?.can_manage_master_data ?? false,
			can_create_batches: valoresIniciales?.can_create_batches ?? false,
			can_upload_files: valoresIniciales?.can_upload_files ?? false,
			can_bulk_edit_master_data:
				valoresIniciales?.can_bulk_edit_master_data ?? false,
		};
	}, [valoresIniciales]);

	const form = useForm<RolFormValues>({ 
		resolver: zodResolver(rolFormSchema),
		defaultValues: defaultFormValues,
		mode: "onBlur",
		reValidateMode: "onBlur",
	});

	React.useEffect(() => {
		form.reset(defaultFormValues);
	}, [defaultFormValues, form]);

	const isReadOnlyEffective = modo === "ver" || disabled;

	const handleFormSubmit: SubmitHandler<RolFormValues> = (data) => {
		if (onSubmit && !isReadOnlyEffective) {
			onSubmit(data);
		}
	};

	const onInvalidSubmit = (errors: FieldErrors<RolFormValues>) => {
		console.log("RolForm (Inválido):", errors);
	};

	const getFieldSuccessState = (fieldName: keyof RolFormValues) => {
		if (isReadOnlyEffective) return false;
		if (form.formState.errors[fieldName]) return false;
		if (
			!form.formState.touchedFields[fieldName] &&
			!form.formState.dirtyFields[fieldName]
		)
			return false;

		const fieldValue = form.watch(fieldName);
		if (typeof fieldValue === "boolean") {
			return !form.formState.errors[fieldName]; 
		}
		return !!fieldValue && !form.formState.errors[fieldName];
	};

	type PermissionFieldName = keyof Pick<
		RolFormValues,
		| "can_manage_master_data"
		| "can_create_batches"
		| "can_upload_files"
		| "can_bulk_edit_master_data"
	>;

	const permissionFields: {
		name: PermissionFieldName;
		label: string;
		hint: string;
		icon: React.ElementType;
	}[] = [
		{ name: "can_manage_master_data", label: "Gestionar Datos Maestros", hint: "Permite crear, editar y eliminar miembros, roles, y otros datos clave del proyecto.", icon: DatabaseZap },
		{ name: "can_create_batches", label: "Crear Lotes de Trabajo", hint: "Permite iniciar y configurar nuevos lotes de análisis o procesamiento.", icon: ListChecks },
		{ name: "can_upload_files", label: "Subir Archivos", hint: "Permite cargar archivos (documentos, imágenes, datos) al proyecto.", icon: UploadCloud },
		{ name: "can_bulk_edit_master_data", label: "Edición Masiva de Datos Maestros", hint: "Permite realizar cambios en múltiples registros de datos maestros a la vez.", icon: Edit },
	];

	return (
		<form
			onSubmit={form.handleSubmit(handleFormSubmit, onInvalidSubmit)}
			className="space-y-6">
			<FormField
				label="Nombre del Rol"
				htmlFor="rf-role_name"
				isRequired={true}
				error={form.formState.errors.role_name?.message}
				hint={isReadOnlyEffective ? undefined : "Nombre único y descriptivo para el rol."}>
				<Controller
					name="role_name"
					control={form.control}
					render={({ field, fieldState }) => (
						<Input
							id="rf-role_name"
							placeholder="Ej: Investigador Principal, Transcriptor"
							leadingIcon={Shield}
							error={!isReadOnlyEffective ? fieldState.error?.message : undefined}
							success={!isReadOnlyEffective && getFieldSuccessState("role_name")}
							readOnly={isReadOnlyEffective}
              isEditing={isEditingForm && !isReadOnlyEffective} // <-- AÑADIDO
							{...field}
						/>
					)}
				/>
			</FormField>

			<FormField
				label="Descripción del Rol"
				htmlFor="rf-role_description"
				error={form.formState.errors.role_description?.message}
				hint={isReadOnlyEffective ? undefined : "Detalla las responsabilidades y el propósito de este rol (opcional)."}>
				<Controller
					name="role_description" 
					control={form.control}
					render={({ field, fieldState }) => (
						<TextArea
							id="rf-role_description"
							placeholder="Describe brevemente qué puede hacer un usuario con este rol..."
							rows={3}
							maxLength={500}
							showCharacterCount={!isReadOnlyEffective}
							error={!isReadOnlyEffective ? fieldState.error?.message : undefined}
							success={!isReadOnlyEffective && getFieldSuccessState("role_description")}
							readOnly={isReadOnlyEffective}
              isEditing={isEditingForm && !isReadOnlyEffective} // <-- AÑADIDO
							{...field}
							value={field.value ?? ""} 
						/>
					)}
				/>
			</FormField>

			<div>
				<Text variant="label" weight="medium" className="mb-3 block">
					Permisos Específicos del Rol
				</Text>
				<div className="space-y-4 rounded-md border p-4 shadow-sm bg-card">
					{permissionFields.map((perm) => (
						<FormField
							key={perm.name}
							htmlFor={`rf-${perm.name}`}
							label="" 
							error={form.formState.errors[perm.name]?.message}
							className="!space-y-0">
							<Controller
								name={perm.name} 
								control={form.control}
								render={({ field, fieldState }) => ( // fieldState añadido para el error
									<CustomCheck
										id={`rf-${perm.name}`}
										checked={field.value} 
										onChange={(e) => field.onChange(e.target.checked)}
                    onBlur={field.onBlur}
                    ref={field.ref}       
										disabled={isReadOnlyEffective}
                    label={
                        <span className="flex items-center gap-2">
                            <perm.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            {perm.label}
                        </span>
                    }
                    description={isReadOnlyEffective ? undefined : perm.hint}
                    error={!isReadOnlyEffective && !!fieldState.error} // Pasar error al CustomCheck
                    className="w-full"
									/>
								)}
							/>
						</FormField>
					))}
				</div>
			</div>

			{modo !== "ver" && (
				<div className="flex justify-end pt-4">
					<CustomButton
						type="submit"
						color="primary"
						loading={loading || form.formState.isSubmitting}
						disabled={
							isReadOnlyEffective ||
							loading ||
							form.formState.isSubmitting ||
							(modo === "editar" && !form.formState.isDirty)
						}>
						{modo === "crear"
							? loading || form.formState.isSubmitting ? "Creando Rol..." : "Crear Rol"
							: loading || form.formState.isSubmitting ? "Guardando Cambios..." : "Guardar Cambios"}
					</CustomButton>
				</div>
			)}
		</form>
	);
};