//. 📍 app/datos-maestros/roles/components/RolForm.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useMemo, useEffect } from "react";
import {
	useForm,
	Controller,
	FieldErrors,
	SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardCheckbox } from "@/components/ui/StandardCheckbox";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { StandardText } from "@/components/ui/StandardText";
import {
	Shield,
	ListChecks, // FileText no se usaba
	UploadCloud,
	DatabaseZap,
	Edit,
} from "lucide-react";
//#endregion ![head]

//#region [def] - 📦 SCHEMA, TYPES, PROPS & CONSTANTS 📦
type RolFormTranslator = ReturnType<typeof useTranslations<"datosMaestros.rolForm">>;

const makeRolFormSchema = (t: RolFormTranslator) =>
	z.object({
		role_name: z
			.string()
			.min(3, t("validation.nameMin"))
			.max(100, t("validation.nameMax")),
		role_description: z
			.string()
			.max(500, t("validation.descriptionMax"))
			.nullable()
			.optional(),
		can_manage_master_data: z.boolean(),
		can_create_batches: z.boolean(),
		can_upload_files: z.boolean(),
		can_bulk_edit_master_data: z.boolean(),
	});

export type RolFormValues = z.infer<ReturnType<typeof makeRolFormSchema>>;

interface RolFormProps {
	modo: "crear" | "editar" | "ver";
	valoresIniciales?: Partial<RolFormValues>;
	onSubmit?: (data: RolFormValues) => void;
	disabled?: boolean;
	loading?: boolean;
	isEditingForm?: boolean; // NUEVA PROP para el estilo de edición
}

type PermissionFieldName = keyof Pick<
	RolFormValues,
	| "can_manage_master_data"
	| "can_create_batches"
	| "can_upload_files"
	| "can_bulk_edit_master_data"
>;

const makePermissionFields = (
	t: RolFormTranslator,
): { name: PermissionFieldName; label: string; hint: string; icon: React.ElementType }[] => [
	{
		name: "can_manage_master_data",
		label: t("permManageMasterData"),
		hint: t("permManageMasterDataHint"),
		icon: DatabaseZap,
	},
	{
		name: "can_create_batches",
		label: t("permCreateBatches"),
		hint: t("permCreateBatchesHint"),
		icon: ListChecks,
	},
	{
		name: "can_upload_files",
		label: t("permUploadFiles"),
		hint: t("permUploadFilesHint"),
		icon: UploadCloud,
	},
	{
		name: "can_bulk_edit_master_data",
		label: t("permBulkEdit"),
		hint: t("permBulkEditHint"),
		icon: Edit,
	},
];
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export const RolForm = ({
	modo,
	valoresIniciales,
	onSubmit,
	disabled = false,
	loading = false,
	isEditingForm = false, // Valor por defecto para la nueva prop
}: RolFormProps) => {
	//#region [sub] - 🧰 HOOKS, STATE, LOGIC & HANDLERS 🧰
	const t = useTranslations("datosMaestros.rolForm");
	const rolFormSchema = useMemo(() => makeRolFormSchema(t), [t]);
	const permissionFields = useMemo(() => makePermissionFields(t), [t]);

	const defaultFormValues: RolFormValues = useMemo(() => {
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

	useEffect(() => {
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

	// Se eliminó el tipo PermissionFieldName ya que no se utilizaba
	// The permissionFields constant definition has been removed from here.
	//#endregion ![sub]

	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		<form
			onSubmit={form.handleSubmit(handleFormSubmit, onInvalidSubmit)}
			className="space-y-6">
			<StandardFormField
				label={t("nameLabel")}
				htmlFor="rf-role_name"
				isRequired={true}
				error={form.formState.errors.role_name?.message}
				hint={isReadOnlyEffective ? undefined : t("nameHint")}>
				<Controller
					name="role_name"
					control={form.control}
					render={({ field, fieldState }) => (
						<StandardInput
							id="rf-role_name"
							placeholder={t("namePlaceholder")}
							leadingIcon={Shield}
							error={
								!isReadOnlyEffective ? fieldState.error?.message : undefined
							}
							success={
								!isReadOnlyEffective && getFieldSuccessState("role_name")
							}
							readOnly={isReadOnlyEffective}
							isEditing={isEditingForm && !isReadOnlyEffective} // <-- AÑADIDO
							{...field}
						/>
					)}
				/>
			</StandardFormField>

			<StandardFormField
				label={t("descriptionLabel")}
				htmlFor="rf-role_description"
				error={form.formState.errors.role_description?.message}
				hint={isReadOnlyEffective ? undefined : t("descriptionHint")}>
				<Controller
					name="role_description"
					control={form.control}
					render={({ field, fieldState }) => (
						<StandardTextarea
							id="rf-role_description"
							placeholder={t("descriptionPlaceholder")}
							rows={3}
							maxLength={500}
							showCharacterCount={!isReadOnlyEffective}
							error={
								!isReadOnlyEffective ? fieldState.error?.message : undefined
							}
							success={
								!isReadOnlyEffective && getFieldSuccessState("role_description")
							}
							readOnly={isReadOnlyEffective}
							isEditing={isEditingForm && !isReadOnlyEffective} // <-- AÑADIDO
							{...field}
							value={field.value ?? ""}
						/>
					)}
				/>
			</StandardFormField>

			{/* //#region [render_sub] - PERMISOS ESPECÍFICOS 🛡️ */}
			<div>
				<StandardText preset="body" weight="medium" className="mb-3 block">
					{t("permissionsTitle")}
				</StandardText>
				<div className="space-y-4 rounded-md border p-4 shadow-sm bg-card">
					{permissionFields.map((perm) => (
						<StandardFormField
							key={perm.name}
							htmlFor={`rf-${perm.name}`}
							label=""
							error={form.formState.errors[perm.name]?.message}
							className="!space-y-0">
							<Controller
								name={perm.name}
								control={form.control}
								render={({ field, fieldState }) => (
									<StandardCheckbox
										id={`rf-${perm.name}`}
										checked={field.value}
										onChange={field.onChange}
										onBlur={field.onBlur}
										disabled={isReadOnlyEffective}
										label={
											<span className="flex items-center gap-2">
												<StandardIcon>
													<perm.icon className="h-4 w-4" />
												</StandardIcon>
												{perm.label}
											</span>
										}
										description={isReadOnlyEffective ? undefined : perm.hint}
										error={!isReadOnlyEffective && !!fieldState.error}
										className="w-full"
									/>
								)}
							/>
						</StandardFormField>
					))}
				</div>
			</div>
			{/* //#endregion [render_sub] */}

			{/* //#region [render_sub] - ACTION BUTTONS 💾 */}
			{modo !== "ver" && (
				<div className="flex justify-end pt-4">
					<StandardButton
						type="submit"
						colorScheme="primary"
						loading={loading || form.formState.isSubmitting}
						disabled={
							isReadOnlyEffective ||
							loading ||
							form.formState.isSubmitting ||
							(modo === "editar" && !form.formState.isDirty)
						}
						loadingText={
							modo === "crear" ? t("submitCreating") : t("submitSaving")
						}>
						{modo === "crear" ? t("submitCreate") : t("submitSave")}
					</StandardButton>
				</div>
			)}
			{/* //#endregion [render_sub] */}
		</form>
	);
	//#endregion ![render]
};
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Export is part of the component declaration and type export
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Considerar si los hints de los permisos podrían ser tooltips para un UI más limpio.
// Evaluar si el estado de "éxito" en los campos es realmente necesario o si solo el error es suficiente.
//#endregion ![todo]
