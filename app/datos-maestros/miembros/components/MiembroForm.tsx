//. 📍 app/datos-maestros/miembros/components/MiembroForm.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useMemo, useEffect } from "react";
import { useForm, Controller, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import {
	StandardSelect,
	type SelectOption,
} from "@/components/ui/StandardSelect"; // Assuming SelectOption type is compatible or similar
import { StandardFormField } from "@/components/ui/StandardFormField"; // Asegúrate de que StandardFormField pueda recibir y mostrar 'hint' y 'successMessage'
import { StandardCheckbox } from "@/components/ui/StandardCheckbox";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import {
	Mail,
	User,
	Briefcase,
	Building,
	Phone,
	Languages,
	MessageSquare,
} from "lucide-react";
//#endregion ![head]

//#region [def] - 📦 SCHEMA, TYPES & PROPS 📦
const formSchema = z.object({
	emailUsuario: z
		.string()
		.email("Email inválido")
		.min(1, "El email es requerido"),
	rolId: z.string().min(1, "Debe seleccionar un rol"),
	esUsuarioNuevo: z.boolean().optional(),

	firstName: z
		.string()
		.max(50, "El nombre no puede exceder los 50 caracteres.")
		.optional()
		.refine((val) => !val || val.length === 0 || val.length >= 3, {
			message: "Si ingresas un nombre, debe tener al menos 3 caracteres.",
		}),

	lastName: z
		.string()
		.max(50, "El apellido no puede exceder los 50 caracteres.")
		.optional()
		.refine((val) => !val || val.length === 0 || val.length >= 3, {
			message: "Si ingresas un apellido, debe tener al menos 3 caracteres.",
		}),

	displayName: z
		.string()
		.max(100, "El nombre para mostrar no puede exceder los 100 caracteres.")
		.optional()
		.refine((val) => !val || val.length === 0 || val.length >= 3, {
			message:
				"Si ingresas un nombre para mostrar, debe tener al menos 3 caracteres.",
		}),

	institution: z
		.string()
		.max(100, "La institución no puede exceder los 100 caracteres.")
		.optional()
		.refine((val) => !val || val.length === 0 || val.length >= 3, {
			message: "Si ingresas una institución, debe tener al menos 3 caracteres.",
		}),

	phone: z
		.string()
		.max(25, "El teléfono no puede exceder los 25 caracteres.")
		.optional()
		.refine(
			(val) => {
				if (!val || val.trim() === "") return true;
				const soloNumeros = val.replace(/[^0-9]/g, "");
				return /^[0-9+\-\s()]*$/.test(val) && soloNumeros.length >= 7;
			},
			{
				message: "Formato de teléfono inválido o muy corto (mín. 7 dígitos).",
			}
		),

	notes: z
		.string()
		.max(500, "Las notas no pueden exceder los 500 caracteres.")
		.optional(),

	language: z.string().optional(),

	pronouns: z
		.string()
		.max(30, "Los pronombres no pueden exceder los 30 caracteres.")
		.optional()
		.refine((val) => !val || val.length === 0 || val.length >= 2, {
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
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export const MiembroForm = ({
	modo,
	valoresIniciales,
	rolesDisponibles,
	onSubmit,
	disabled = false,
	loading = false,
}: MiembroFormProps) => {
	//#region [sub] - 🧰 HOOKS, STATE, LOGIC & HANDLERS 🧰
	const initialFormValues = useMemo(() => {
		if (modo === "crear") {
			return valoresIniciales && Object.keys(valoresIniciales).length > 0
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

	useEffect(() => {
		form.reset(initialFormValues);
	}, [initialFormValues, form]);

	const isReadOnlyEffective = modo === "ver" || disabled;

	const isFieldRequired = (fieldName: keyof MiembroFormValues): boolean => {
		if (isReadOnlyEffective) return false;
		// Los campos requeridos son emailUsuario y rolId
		return fieldName === 'emailUsuario' || fieldName === 'rolId';
	};

	const getSuccessState = (fieldName: keyof MiembroFormValues) => {
		if (isReadOnlyEffective) return false;

		if (form.formState.errors[fieldName]) {
			return false;
		}

		if (
			!form.formState.touchedFields[fieldName] &&
			!form.formState.dirtyFields[fieldName]
		) {
			return false;
		}

		const fieldValue = form.watch(fieldName);

		switch (fieldName) {
			case "firstName":
			case "lastName":
			case "displayName":
			case "institution":
				return typeof fieldValue === "string" && fieldValue.length >= 3;
			case "pronouns":
				return typeof fieldValue === "string" && fieldValue.length >= 2;
			case "phone":
				if (typeof fieldValue === "string" && fieldValue.trim() !== "") {
					const soloNumeros = fieldValue.replace(/[^0-9]/g, "");
					return /^[0-9+\-\s()]*$/.test(fieldValue) && soloNumeros.length >= 7;
				}
				return false;

			case "emailUsuario":
				// Lógica para el email: éxito si parece email y no hay error de Zod
				return (
					!!fieldValue &&
					typeof fieldValue === "string" &&
					fieldValue.includes("@") &&
					fieldValue.includes(".") &&
					!form.formState.errors[fieldName]
				);
			case "rolId":
			case "language":
				return !!fieldValue && !form.formState.errors[fieldName];

			case "notes":
				if (typeof fieldValue === "string") {
					return (
						fieldValue.length > 0 &&
						fieldValue.length <= 500 &&
						!form.formState.errors[fieldName]
					);
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
	//#endregion ![sub]

	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		<StandardCard
			disableShadowHover={true}
			styleType="subtle"
			hasOutline={false}
			accentPlacement="none">
			<StandardCard.Content>
				<form
					onSubmit={form.handleSubmit(handleFormSubmit, onInvalidSubmit)}
					className="space-y-6">
					{/* //#region [render_sub] - 🧑‍💼 Información del Miembro (Principal) 🧑‍💼 */}
					<StandardText
						size="md"
						colorScheme="tertiary"
						className="pb-2 border-b">
						Información del Miembro
					</StandardText>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
						<StandardFormField
							label="Email del Usuario"
							htmlFor="mf-emailUsuario"
							isRequired={isFieldRequired("emailUsuario")}
							error={form.formState.errors.emailUsuario?.message}
							hint={
								isReadOnlyEffective
									? undefined
									: modo === "editar"
									? "El email no se puede modificar una vez creado."
									: "Email principal para el inicio de sesión y contacto."
							}>
							<Controller
								name="emailUsuario"
								control={form.control}
								render={({ field, fieldState }) => (
									<StandardInput
										id="mf-emailUsuario"
										type="email"
										placeholder="correo@ejemplo.com"
										leadingIcon={Mail}
										error={
											!isReadOnlyEffective
												? fieldState.error?.message
												: undefined
										}
										success={getSuccessState("emailUsuario")}
										readOnly={isReadOnlyEffective || modo === "editar"}
										isEditing={
											modo === "editar" &&
											!(isReadOnlyEffective || modo === "editar")
										}
										isRequired={isFieldRequired("emailUsuario")}
										{...field}
										value={field.value || ""}
										// hint prop eliminada de Input
									/>
								)}
							/>
						</StandardFormField>

						<StandardFormField
							label="Rol en el Proyecto"
							htmlFor="mf-rolId"
							isRequired={isFieldRequired("rolId")}
							error={form.formState.errors.rolId?.message}
							hint={
								isReadOnlyEffective
									? undefined
									: "El rol define los permisos del miembro en este proyecto."
							}>
							<Controller
								name="rolId"
								control={form.control}
								render={({ field, fieldState }) => (
									<StandardSelect
										id="mf-rolId"
										placeholder="Selecciona un rol"
										options={rolesDisponibles}
										leadingIcon={Briefcase}
										error={
											!isReadOnlyEffective
												? fieldState.error?.message
												: undefined
										}
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
						</StandardFormField>
					</div>

					{modo === "crear" && (
						<Controller
							name="esUsuarioNuevo"
							control={form.control}
							render={({ field }) => (
								<StandardCheckbox
									checked={!!field.value}
									onChange={(e) => field.onChange(e.target.checked)}
									label="Es un usuario nuevo (todavía no tiene cuenta en Sustrato)"
									description="Se le crea la cuenta con una contraseña provisoria que vas a poder copiar al terminar, para pasársela directamente. La puede cambiar después por su cuenta."
								/>
							)}
						/>
					)}
					{/* //#endregion [render_sub] */}

					{/* //#region [render_sub] - 📝 Información Adicional de Perfil (Opcional) 📝 */}
					<StandardText
						preset="heading"
						size="md"
						colorScheme="tertiary"
						className="pt-4 pb-2 border-b">
						Información Adicional de Perfil (Opcional)
					</StandardText>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
						<StandardFormField
							label="Nombre(s)"
							htmlFor="mf-firstName"
							isRequired={isFieldRequired("firstName")}
							error={form.formState.errors.firstName?.message}>
							<Controller
								name="firstName"
								control={form.control}
								render={({ field, fieldState }) => (
									<StandardInput
										id="mf-firstName"
										placeholder="Nombre(s) de pila"
										leadingIcon={User}
										error={
											!isReadOnlyEffective
												? fieldState.error?.message
												: undefined
										}
										success={getSuccessState("firstName")}
										readOnly={isReadOnlyEffective}
										isEditing={modo === "editar" && !isReadOnlyEffective}
										isRequired={isFieldRequired("firstName")}
										{...field}
										value={field.value || ""}
									/>
								)}
							/>
						</StandardFormField>

						<StandardFormField
							label="Apellido(s)"
							htmlFor="mf-lastName"
							isRequired={isFieldRequired("lastName")}
							error={form.formState.errors.lastName?.message}>
							<Controller
								name="lastName"
								control={form.control}
								render={({ field, fieldState }) => (
									<StandardInput
										id="mf-lastName"
										placeholder="Apellido(s)"
										leadingIcon={User}
										error={
											!isReadOnlyEffective
												? fieldState.error?.message
												: undefined
										}
										success={getSuccessState("lastName")}
										readOnly={isReadOnlyEffective}
										isEditing={modo === "editar" && !isReadOnlyEffective}
										isRequired={isFieldRequired("lastName")}
										{...field}
										value={field.value || ""}
									/>
								)}
							/>
						</StandardFormField>

						<StandardFormField
							label="Nombre para Mostrar"
							htmlFor="mf-displayName"
							isRequired={isFieldRequired("displayName")}
							error={form.formState.errors.displayName?.message}
							hint={
								isReadOnlyEffective
									? undefined
									: "Ej: 'Dra. Ada L.' o 'Ada Lovelace'"
							}>
							<Controller
								name="displayName"
								control={form.control}
								render={({ field, fieldState }) => (
									<StandardInput
										id="mf-displayName"
										placeholder="Cómo se mostrará públicamente"
										leadingIcon={User}
										error={
											!isReadOnlyEffective
												? fieldState.error?.message
												: undefined
										}
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
						</StandardFormField>

						<StandardFormField
							label="Institución"
							htmlFor="mf-institution"
							isRequired={isFieldRequired("institution")}
							error={form.formState.errors.institution?.message}>
							<Controller
								name="institution"
								control={form.control}
								render={({ field, fieldState }) => (
									<StandardInput
										id="mf-institution"
										placeholder="Institución o afiliación principal"
										leadingIcon={Building}
										error={
											!isReadOnlyEffective
												? fieldState.error?.message
												: undefined
										}
										success={getSuccessState("institution")}
										readOnly={isReadOnlyEffective}
										isEditing={modo === "editar" && !isReadOnlyEffective}
										isRequired={isFieldRequired("institution")}
										{...field}
										value={field.value || ""}
									/>
								)}
							/>
						</StandardFormField>

						<StandardFormField
							label="Teléfono"
							htmlFor="mf-phone"
							isRequired={isFieldRequired("phone")}
							error={form.formState.errors.phone?.message}>
							<Controller
								name="phone"
								control={form.control}
								render={({ field, fieldState }) => {
									const handlePhoneChange = (
										e: React.ChangeEvent<HTMLInputElement>
									) => {
										const rawValue = e.target.value;
										const cleanedValue = rawValue.replace(/[^0-9+\-\s()]/g, "");
										field.onChange(cleanedValue);
									};

									return (
										<StandardInput
											id="mf-phone"
											type="tel"
											placeholder="Ej: +56 (2) 1234-5678"
											leadingIcon={Phone}
											error={
												!isReadOnlyEffective
													? fieldState.error?.message
													: undefined
											}
											success={getSuccessState("phone")}
											readOnly={isReadOnlyEffective}
											isEditing={modo === "editar" && !isReadOnlyEffective}
											isRequired={isFieldRequired("phone")}
											{...field}
											value={field.value || ""}
											onChange={
												isReadOnlyEffective ? undefined : handlePhoneChange
											}
										/>
									);
								}}
							/>
						</StandardFormField>

						<StandardFormField
							label="Lenguaje Preferido"
							htmlFor="mf-language"
							isRequired={isFieldRequired("language")}
							error={form.formState.errors.language?.message}>
							<Controller
								name="language"
								control={form.control}
								render={({ field, fieldState }) => (
									<StandardSelect
										id="mf-language"
										placeholder="Selecciona un idioma"
										options={[
											{ value: "es", label: "Español" },
											{ value: "en", label: "Inglés" },
											{ value: "pt", label: "Portugués" },
										]}
										leadingIcon={Languages}
										error={
											!isReadOnlyEffective
												? fieldState.error?.message
												: undefined
										}
										success={getSuccessState("language")}
										disabled={isReadOnlyEffective}
										isRequired={isFieldRequired("language")}
										isEditing={modo === "editar" && !isReadOnlyEffective}
										clearable={!isReadOnlyEffective}
										{...field}
									/>
								)}
							/>
						</StandardFormField>

						<StandardFormField
							label="Pronombres"
							htmlFor="mf-pronouns"
							isRequired={isFieldRequired("pronouns")}
							error={form.formState.errors.pronouns?.message}
							className="md:col-span-2"
							hint={
								isReadOnlyEffective
									? undefined
									: "Para asegurar una comunicación respetuosa."
							}>
							<Controller
								name="pronouns"
								control={form.control}
								render={({ field, fieldState }) => (
									<StandardInput
										id="mf-pronouns"
										placeholder="Ej: él/ella, elle, they/them"
										leadingIcon={MessageSquare}
										error={
											!isReadOnlyEffective
												? fieldState.error?.message
												: undefined
										}
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
						</StandardFormField>
					</div>

					<StandardFormField
						label="Notas Adicionales"
						htmlFor="mf-notes"
						isRequired={isFieldRequired("notes")}
						error={form.formState.errors.notes?.message}
						className="col-span-full"
						hint={isReadOnlyEffective ? undefined : "Máximo 500 caracteres."}>
						<Controller
							name="notes"
							control={form.control}
							render={({ field, fieldState }) => (
								<StandardTextarea
									id="mf-notes"
									placeholder="Información adicional relevante sobre el miembro..."
									rows={4}
									error={
										!isReadOnlyEffective ? fieldState.error?.message : undefined
									}
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
					</StandardFormField>
					{/* //#endregion [render_sub] */}

					{/* //#region [render_sub] - 💾 Botones de Acción 💾 */}
					{modo !== "ver" && (
						<div className="flex justify-end gap-3 pt-4">
							<StandardButton
								type="submit"
								colorScheme="primary"
								styleType="solid"
								loading={loading || form.formState.isSubmitting}
								disabled={
									loading ||
									form.formState.isSubmitting ||
									(modo === "editar" && !form.formState.isDirty)
								}>
								{modo === "crear"
									? loading || form.formState.isSubmitting
										? "Agregando..."
										: "Agregar Miembro"
									: loading || form.formState.isSubmitting
									? "Guardando..."
									: "Guardar Cambios"}
							</StandardButton>
						</div>
					)}
					{/* //#endregion [render_sub] */}
				</form>
			</StandardCard.Content>
		</StandardCard>
	);
	//#endregion ![render]
};
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Export is part of the component declaration and type export
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Considerar la internacionalización de etiquetas y mensajes de error.
// Evaluar si la lógica de `getSuccessState` puede ser simplificada o integrada con `FormField` directamente.
// Podría haber un estado de "éxito" más visual después de una acción de submit exitosa antes de un posible redirect.
//#endregion ![todo]
