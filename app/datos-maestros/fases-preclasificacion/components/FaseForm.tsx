//. 📍 app/datos-maestros/fases-preclasificacion/components/FaseForm.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Componentes UI
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardSelect, type SelectOption } from "@/components/ui/StandardSelect";

//#endregion [head]

//#region [def] - 📦 SCHEMA, TYPES & PROPS 📦
const formSchema = z.object({
    name: z
        .string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(100, "El nombre no puede exceder los 100 caracteres"),
    description: z
        .string()
        .max(500, "La descripción no puede exceder los 500 caracteres")
        .optional(),
    phase_number: z.coerce
        .number()
        .int("El número de fase debe ser un número entero")
        .positive("El número de fase debe ser mayor a cero"),
    status: z.enum(['active', 'inactive', 'completed', 'annulled']).default('inactive'),
});

type FaseFormValues = z.infer<typeof formSchema> & { id?: string };

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
                    title: modo === "crear" ? "¡Fase creada!" : "¡Cambios guardados!",
                    description: 
                        modo === "crear" 
                            ? "La fase se ha creado correctamente."
                            : "Los cambios en la fase se han guardado correctamente.",
                });
                
                router.push("/datos-maestros/fases-preclasificacion");
            }
        } catch (error) {
            console.error("Error al guardar la fase:", error);
            toast({
                title: "Error",
                description: 
                    error instanceof Error 
                        ? error.message 
                        : "Ocurrió un error al guardar la fase. Por favor, inténtalo de nuevo.",
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
                                        label="Nombre de la fase"
                                        htmlFor="name"
                                        error={errors.name?.message}
                                        isRequired
                                    >
                                        <div className="text-sm text-muted-foreground mb-2">
                                            Un nombre descriptivo para esta fase
                                        </div>
                                        <StandardInput
                                            id="name"
                                            {...field}
                                            placeholder="Ej: Revisión inicial"
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
                                        label="Número de fase"
                                        htmlFor="phase_number"
                                        error={errors.phase_number?.message}
                                        isRequired
                                    >
                                        <div className="text-sm text-muted-foreground mb-2">
                                            Define el orden de esta fase en el flujo de trabajo
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
                                    { value: 'active', label: 'Activo' },
                                    { value: 'inactive', label: 'Inactivo' },
                                    { value: 'completed', label: 'Completado' },
                                    { value: 'annulled', label: 'Anulado' }
                                ];
                                
                                return (
                                    <div className="space-y-2">
                                        <StandardFormField
                                            label="Estado"
                                            htmlFor="status"
                                            error={errors.status?.message}
                                        >
                                            <div className="text-sm text-muted-foreground mb-2">
                                                Estado actual de la fase
                                            </div>
                                            <StandardSelect
                                                id="status"
                                                options={statusOptions}
                                                value={field.value}
                                                onChange={(value) => field.onChange(value)}
                                                disabled={modo === "ver" || loading}
                                                placeholder="Seleccionar estado..."
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
                                    label="Descripción"
                                    htmlFor="description"
                                    error={errors.description?.message}
                                >
                                    <div className="text-sm text-muted-foreground mb-2">
                                        Detalles adicionales sobre esta fase (opcional)
                                    </div>
                                    <StandardTextarea
                                        id="description"
                                        {...field}
                                        rows={4}
                                        placeholder="Describe el propósito y alcance de esta fase..."
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
                            Cancelar
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
                                loadingText="Guardando..."
                            >
                                {modo === "crear" ? "Crear fase" : "Guardar cambios"}
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
