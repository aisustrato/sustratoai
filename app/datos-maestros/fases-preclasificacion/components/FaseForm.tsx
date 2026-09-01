//. 📍 app/datos-maestros/fases-preclasificacion/components/FaseForm.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

// Componentes UI
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardSelect, type SelectOption } from "@/components/ui/StandardSelect";

//#endregion [head]

//#region [def] - 📦 SCHEMA, TYPES & PROPS 📦
type FaseFormTranslator = ReturnType<typeof useTranslations<"datosMaestros.faseForm">>;

const makeFormSchema = (t: FaseFormTranslator) =>
    z.object({
        name: z
            .string()
            .min(3, t("validation.nameMin"))
            .max(100, t("validation.nameMax")),
        description: z
            .string()
            .max(500, t("validation.descriptionMax"))
            .optional(),
        phase_number: z.coerce
            .number()
            .int(t("validation.phaseNumberInt"))
            .positive(t("validation.phaseNumberPositive")),
        status: z.enum(['active', 'inactive', 'completed', 'annulled']).default('inactive'),
    });

type FaseFormValues = z.infer<ReturnType<typeof makeFormSchema>> & { id?: string };

type FaseFormProps = {
    modo: "crear" | "editar" | "ver";
    valoresIniciales?: Partial<FaseFormValues>;
    proyectoId: string;
    onSubmit?: (formData: FormData) => Promise<{ error?: { message: string } } | void>;
    loading?: boolean;
};
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function FaseForm({
    modo,
    valoresIniciales = {},
    proyectoId,
    onSubmit,
    loading = false,
}: FaseFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const t = useTranslations("datosMaestros.faseForm");
    const formSchema = useMemo(() => makeFormSchema(t), [t]);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<FaseFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            phase_number: 1,
            status: "inactive",
            ...valoresIniciales,
        },
    });

    const handleFormSubmit = async (data: FaseFormValues) => {
        try {
            if (onSubmit) {
                const formData = new FormData();
                formData.append('name', data.name);
                formData.append('description', data.description || '');
                formData.append('phase_number', data.phase_number.toString());
                formData.append('status', data.status);
                
                if (valoresIniciales?.id) {
                    formData.append('id', valoresIniciales.id);
                }
                if (proyectoId) {
                    formData.append('project_id', proyectoId);
                }

                const result = await onSubmit(formData);
                
                if (result?.error) {
                    throw new Error(result.error.message);
                }
                
                toast({
                    title: modo === "crear" ? t("toastCreatedTitle") : t("toastSavedTitle"),
                    description:
                        modo === "crear"
                            ? t("toastCreatedDescription")
                            : t("toastSavedDescription"),
                });

                router.push("/datos-maestros/fases-preclasificacion");
            }
        } catch (error) {
            console.error("Error al guardar la fase:", error);
            toast({
                title: t("toastErrorTitle"),
                description:
                    error instanceof Error
                        ? error.message
                        : t("toastErrorGeneric"),
                variant: "destructive",
            });
        }
    };

    return (
        <StandardCard  accentPlacement="top"> 
            <div className="p-6">
             

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nombre */}
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <StandardFormField
                                        label={t("nameLabel")}
                                        htmlFor="name"
                                        error={errors.name?.message}
                                        isRequired
                                    >
                                        <div className="text-sm text-muted-foreground mb-2">
                                            {t("nameHint")}
                                        </div>
                                        <StandardInput
                                            id="name"
                                            {...field}
                                            placeholder={t("namePlaceholder")}
                                            disabled={modo === "ver" || loading}
                                        />
                                    </StandardFormField>
                                </div>
                            )}
                        />

                        {/* Número de fase */}
                        <Controller
                            name="phase_number"
                            control={control}
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <StandardFormField
                                        label={t("numberLabel")}
                                        htmlFor="phase_number"
                                        error={errors.phase_number?.message}
                                        isRequired
                                    >
                                        <div className="text-sm text-muted-foreground mb-2">
                                            {t("numberHint")}
                                        </div>
                                        <StandardInput
                                            id="phase_number"
                                            type="number"
                                            min="1"
                                            {...field}
                                            disabled={modo === "ver" || loading}
                                        />
                                    </StandardFormField>
                                </div>
                            )}
                        />

                        {/* Estado */}
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => {
                                const statusOptions: SelectOption[] = [
                                    { value: 'active', label: t("statusActive") },
                                    { value: 'inactive', label: t("statusInactive") },
                                    { value: 'completed', label: t("statusCompleted") },
                                    { value: 'annulled', label: t("statusAnnulled") }
                                ];

                                return (
                                    <div className="space-y-2">
                                        <StandardFormField
                                            label={t("statusLabel")}
                                            htmlFor="status"
                                            error={errors.status?.message}
                                        >
                                            <div className="text-sm text-muted-foreground mb-2">
                                                {t("statusHint")}
                                            </div>
                                            <StandardSelect
                                                id="status"
                                                options={statusOptions}
                                                value={field.value}
                                                onChange={(value) => field.onChange(value)}
                                                disabled={modo === "ver" || loading}
                                                placeholder={t("statusPlaceholder")}
                                            />
                                        </StandardFormField>
                                    </div>
                                );
                            }}
                        />
                    </div>

                    {/* Descripción */}
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-2">
                                <StandardFormField
                                    label={t("descriptionLabel")}
                                    htmlFor="description"
                                    error={errors.description?.message}
                                >
                                    <div className="text-sm text-muted-foreground mb-2">
                                        {t("descriptionHint")}
                                    </div>
                                    <StandardTextarea
                                        id="description"
                                        {...field}
                                        rows={4}
                                        placeholder={t("descriptionPlaceholder")}
                                        disabled={modo === "ver" || loading}
                                    />
                                </StandardFormField>
                            </div>
                        )}
                    />

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
                        <StandardButton
                            type="button"
                            styleType="outline"
                            colorScheme="neutral"
                            onClick={() => router.back()}
                            disabled={loading}
                            size="md"
                        >
                            {t("cancelButton")}
                        </StandardButton>

                        {modo !== "ver" && (
                            <StandardButton
                                type="submit"
                                styleType="solid"
                                colorScheme="primary"
                                disabled={loading}
                                size="md"
                                className="w-full sm:w-auto"
                                leftIcon={loading ? Loader2 : Save}
                                loading={loading}
                                loadingText={t("submittingButton")}
                            >
                                {modo === "crear" ? t("submitCreate") : t("submitSave")}
                            </StandardButton>
                        )}
                    </div>
                </form>
            </div>
        </StandardCard>
    );
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Export is part of the component declaration and type export
//#endregion [foo]
