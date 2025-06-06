// app/datos-maestros/dimensiones/components/DimensionForm.tsx
"use client";

import React, { useEffect } from "react";
import { useForm, Controller, useFieldArray, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";
import { SelectCustom, type SelectOption } from "@/components/ui/select-custom";
import { FormField } from "@/components/ui/form-field";
import { CustomButton } from "@/components/ui/custom-button";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { Text } from "@/components/ui/text";
import { AlertCircle, HelpCircle, Lightbulb, ListChecks, PlusCircle, Trash2, CheckCircle } from "lucide-react";
import { BadgeCustom } from "@/components/ui/badge-custom";

// Esquemas Zod para los sub-elementos
const optionSchema = z.object({
  id: z.string().optional(),
  value: z.string().min(1, "El valor de la opción es requerido.").max(200, "Máximo 200 caracteres."),
  ordering: z.number().int(),
});

const questionSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(5, "La pregunta debe tener al menos 5 caracteres.").max(500, "Máximo 500 caracteres."),
  ordering: z.number().int(),
});

const exampleSchema = z.object({
  id: z.string().optional(),
  example: z.string().min(5, "El ejemplo debe tener al menos 5 caracteres.").max(500, "Máximo 500 caracteres."),
});

// Esquema Zod principal para el formulario de Dimensión
const dimensionFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(100, "Máximo 100 caracteres."),
  type: z.enum(["finite", "open"], { required_error: "Debe seleccionar un tipo de dimensión." }),
  description: z.string().max(500, "La descripción no puede exceder los 500 caracteres.").optional().nullable(),
  options: z.array(optionSchema).optional(),
  questions: z.array(questionSchema).optional(),
  examples: z.array(exampleSchema).optional(),
}).refine(data => {
  if (data.type === 'finite' && (!data.options || data.options.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Las dimensiones de tipo 'Selección Múltiple' deben tener al menos una opción.",
  path: ["options"], // Asociar el error al array de opciones
});

export type DimensionFormValues = z.infer<typeof dimensionFormSchema>;

interface DimensionFormProps {
  modo: "crear" | "editar" | "ver";
  valoresIniciales?: Partial<DimensionFormValues>;
  onSubmit?: (data: DimensionFormValues) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const DimensionForm: React.FC<DimensionFormProps> = ({
  modo,
  valoresIniciales,
  onSubmit,
  loading = false,
  disabled = false,
}) => {
  const form = useForm<DimensionFormValues>({
    resolver: zodResolver(dimensionFormSchema),
    defaultValues: {
      name: "",
      type: undefined,
      description: "",
      options: [],
      questions: [],
      examples: [],
      ...valoresIniciales,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const { control, handleSubmit, watch, formState: { errors, touchedFields, dirtyFields, isValid, isSubmitted }, getFieldState } = form;

  const dimensionType = watch("type");
  const optionsArray = watch("options");
  const questionsArray = watch("questions");
  const examplesArray = watch("examples");
  
  const isReadOnlyEffective = modo === "ver" || disabled;

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({ control, name: "options" });
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({ control, name: "questions" });
  const { fields: exampleFields, append: appendExample, remove: removeExample } = useFieldArray({ control, name: "examples" });
  
  useEffect(() => {
    if (valoresIniciales) {
      form.reset({
        name: "", type: undefined, description: "", options: [], questions: [], examples: [],
        ...valoresIniciales
      });
    }
  }, [valoresIniciales, form]);

  const handleFormSubmitInternal = (data: DimensionFormValues) => {
    if (onSubmit) {
      const dataToSubmit = { ...data, options: data.type === 'open' ? [] : data.options || [] };
      onSubmit(dataToSubmit);
    }
  };

  const onInvalidSubmit = (formErrors: FieldErrors<DimensionFormValues>) => {
    console.error("DimensionForm (Inválido):", formErrors);
  };
  
  const typeOptions: SelectOption[] = [
    { value: "finite", label: "Selección Múltiple (Opciones Predefinidas)" },
    { value: "open", label: "Respuesta Abierta (Texto Libre)" },
  ];

  const addNewOption = () => appendOption({ value: "", ordering: optionFields.length }, { shouldFocus: true });
  const addNewQuestion = () => appendQuestion({ question: "", ordering: questionFields.length }, { shouldFocus: true });
  const addNewExample = () => appendExample({ example: "" }, { shouldFocus: true });

  const getFieldSuccessState = (fieldName: keyof DimensionFormValues, index?: number, subFieldName?: string) => {
    if (isReadOnlyEffective) return false;
    
    const fieldPath = typeof index === 'number' && subFieldName ? `${fieldName}.${index}.${subFieldName}` as const : fieldName;
    // @ts-ignore
    const fieldState = getFieldState(fieldPath);
    // @ts-ignore
    const error = errors[fieldName]?.[index]?.[subFieldName] || errors[fieldName];
    // @ts-ignore
    return fieldState.isTouched && !error && !!watch(fieldPath);
  };
  
  return (
    <StandardCard styleType="subtle" hasOutline={false} accentPlacement="none">
      <StandardCard.Content>
        <form
          onSubmit={handleSubmit(handleFormSubmitInternal, onInvalidSubmit)}
          className="space-y-8"
        >
          {/* SECCIÓN: DATOS BÁSICOS DE LA DIMENSIÓN */}
          <StandardCard
            colorScheme="neutral"
            accentPlacement="top"
            accentColorScheme="neutral" // Derived from colorScheme
            className="p-0"
            styleType="subtle"
            hasOutline={false} // border="top" implies no full outline
          >
            <StandardCard.Header className="pb-3">
              <Text variant="subheading" weight="medium" color="primary">
                Definición de la Dimensión
              </Text>
            </StandardCard.Header>
            <StandardCard.Content className="space-y-5">
              <FormField
                label="Nombre de la Dimensión"
                htmlFor="dim-name"
                isRequired
                error={errors.name?.message}
              >
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="dim-name"
                      placeholder="Ej: Relevancia para el Estudio"
                      readOnly={isReadOnlyEffective}
                      isEditing={modo === "editar" && !isReadOnlyEffective}
                      error={errors.name?.message} // Input muestra su propio borde/icono de error
                      success={getFieldSuccessState("name")}
                      {...field}
                    />
                  )}
                />
              </FormField>

              <FormField
                label="Tipo de Dimensión"
                htmlFor="dim-type"
                isRequired
                error={errors.type?.message}
              >
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <SelectCustom
                      id="dim-type"
                      options={typeOptions}
                      placeholder="Selecciona un tipo..."
                      disabled={isReadOnlyEffective || (modo === "editar" && !!valoresIniciales?.type) }
                      error={errors.type?.message} // SelectCustom muestra su propio borde/icono de error
                      success={getFieldSuccessState("type")}
                      {...field}
                    />
                  )}
                />
                 {modo === "editar" && !!valoresIniciales?.type && (
                    <Text variant="caption" color="muted" className="mt-1">
                        El tipo de dimensión no se puede cambiar una vez creado.
                    </Text>
                )}
              </FormField>

              <FormField
                label="Descripción (Opcional)"
                htmlFor="dim-description"
                error={errors.description?.message}
                hint="Explica brevemente el propósito o criterio de esta dimensión (máx. 500 caracteres)."
              >
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      id="dim-description"
                      placeholder="Ej: Evalúa qué tan central es el artículo para los objetivos principales de la investigación..."
                      rows={3}
                      readOnly={isReadOnlyEffective}
                      isEditing={modo === "editar" && !isReadOnlyEffective}
                      error={errors.description?.message} // TextArea muestra su propio borde/icono de error
                      success={getFieldSuccessState("description")}
                      maxLength={500}
                      showCharacterCount
                      {...field}
                      value={field.value || ""}
                    />
                  )}
                />
              </FormField>
            </StandardCard.Content>
          </StandardCard>

          {/* SECCIÓN: OPCIONES (Solo si tipo === 'finite') */}
          {dimensionType === "finite" && (
            <StandardCard
              colorScheme="neutral"
              accentPlacement="top"
              accentColorScheme="neutral" // Derived
              className="p-0"
              styleType="subtle"
              hasOutline={false} // border="top"
            >
              <StandardCard.Header className="pb-3 flex justify-between items-start"> {/* items-start para alinear mejor si los textos tienen alturas diferentes */}
                <div className="flex-grow"> {/* Div para que el título y contador estén juntos y a la izquierda */}
                    <Text as="div" variant="subheading" weight="medium" color="primary"> {/* Usar 'as="div"' para evitar anidación p > p */}
                        Opciones de Clasificación
                    </Text>
                    {optionsArray && optionsArray.length > 0 && (
                        <Text variant="caption" color="muted" className="mt-0.5 block"> {/* block para que ocupe su línea */}
                            {optionsArray.length} {optionsArray.length === 1 ? "opción definida" : "opciones definidas"}
                        </Text>
                    )}
                </div>
                {!isReadOnlyEffective && (
                  <CustomButton type="button" variant="outline" size="sm" onClick={addNewOption} leftIcon={<PlusCircle className="h-4 w-4" />}>
                    {optionFields.length === 0 ? "Añadir Opción" : "Añadir Otra Opción"}
                  </CustomButton>
                )}
              </StandardCard.Header>
              <StandardCard.Content className="space-y-3">
                {errors.options && !Array.isArray(errors.options) && errors.options.message && optionFields.length === 0 && (
                     <Text color="danger" className="text-sm flex items-center gap-2 -mt-2 mb-2">
                        <AlertCircle className="h-4 w-4"/> {errors.options.message}
                    </Text>
                )}
                {optionFields.length === 0 && !isReadOnlyEffective && !errors.options?.message && (
                  <Text color="muted" className="text-sm italic">
                    Añade al menos una opción para este tipo de dimensión.
                  </Text>
                )}
                {optionFields.map((item, index) => ( // 'item' en lugar de 'field' para evitar confusión con field de Controller
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="flex-grow">
                        <Controller
                        name={`options.${index}.value`}
                        control={control}
                        render={({ field }) => ( // 'field' aquí se refiere al campo del Controller
                            <Input
                            placeholder={`Valor Opción ${index + 1}`}
                            readOnly={isReadOnlyEffective}
                            error={errors.options?.[index]?.value?.message}
                            success={getFieldSuccessState("options", index, "value")}
                            {...field} 
                            />
                        )}
                        />
                        {/* Mostrar el mensaje de error del campo específico directamente */}
                        {errors.options?.[index]?.value?.message && (
                            <Text variant="caption" color="danger" className="mt-1 ml-1 block">
                                {errors.options?.[index]?.value?.message}
                            </Text>
                        )}
                    </div>
                    {!isReadOnlyEffective && ( <CustomButton type="button" variant="ghost" color="danger" size="sm" onClick={() => removeOption(index)}> <Trash2 className="h-4 w-4" /> </CustomButton> )}
                    {getFieldSuccessState("options", index, "value") && !isReadOnlyEffective && ( <CheckCircle className="h-5 w-5 text-success" /> )}
                  </div>
                ))}
              </StandardCard.Content>
            </StandardCard>
          )}
          
          {/* SECCIÓN: PREGUNTAS GUÍA */}
          <StandardCard
            colorScheme="neutral"
            accentPlacement="top"
            accentColorScheme="neutral" // Derived
            className="p-0"
            styleType="subtle"
            hasOutline={false} // border="top"
          >
            <StandardCard.Header className="pb-3 flex justify-between items-start">
              <div className="flex-grow">
                <Text as="div" variant="subheading" weight="medium" color="primary" className="flex items-center gap-2">
                  Preguntas Guía <BadgeCustom variant="neutral"  subtle>Opcional</BadgeCustom>
                </Text>
                 {questionsArray && questionsArray.length > 0 && (
                    <Text variant="caption" color="muted" className="mt-0.5 block">
                        {questionsArray.length} {questionsArray.length === 1 ? "pregunta definida" : "preguntas definidas"}
                    </Text>
                )}
              </div>
              {!isReadOnlyEffective && (
                  <CustomButton type="button" variant="outline" size="sm" onClick={addNewQuestion} leftIcon={<HelpCircle className="h-4 w-4" />}>
                    {questionFields.length === 0 ? "Añadir Pregunta" : "Añadir Otra Pregunta"}
                  </CustomButton>
                )}
            </StandardCard.Header>
            <StandardCard.Content className="space-y-3">
            {questionFields.length === 0 && isReadOnlyEffective && (
                <Text color="muted" className="text-sm italic">No se definieron preguntas guía.</Text>
            )}
            {questionFields.map((item, index) => (
                 <div key={item.id} className="flex items-start gap-2">
                    <div className="flex-grow">
                        <Controller
                        name={`questions.${index}.question`}
                        control={control}
                        render={({ field }) => (
                            <TextArea
                            placeholder={`Pregunta guía ${index + 1}`}
                            readOnly={isReadOnlyEffective}
                            className="min-h-[40px]"
                            rows={1}
                            error={errors.questions?.[index]?.question?.message}
                            success={getFieldSuccessState("questions", index, "question")}
                            {...field}
                            />
                        )}
                        />
                        {errors.questions?.[index]?.question?.message && (
                            <Text variant="caption" color="danger" className="mt-1 ml-1 block">
                                {errors.questions?.[index]?.question?.message}
                            </Text>
                        )}
                    </div>
                    {!isReadOnlyEffective && ( <CustomButton type="button" variant="ghost" color="danger"  onClick={() => removeQuestion(index)}  className="mt-1"> <Trash2 className="h-4 w-4" /> </CustomButton> )}
                    {getFieldSuccessState("questions", index, "question") && !isReadOnlyEffective && ( <CheckCircle className="h-5 w-5 text-success mt-1" /> )}
                  </div>
            ))}
            </StandardCard.Content>
          </StandardCard>

          {/* SECCIÓN: EJEMPLOS ILUSTRATIVOS */}
          <StandardCard
            colorScheme="neutral"
            className="p-0"
            styleType="subtle"
            hasOutline={false} // No border prop
            accentPlacement="none" // No border prop
          >
            <StandardCard.Header className="pb-3 flex justify-between items-start">
              <div className="flex-grow">
                <Text as="div" variant="subheading" weight="medium" color="primary" className="flex items-center gap-2">
                  Ejemplos Ilustrativos <BadgeCustom variant="neutral" subtle>Opcional</BadgeCustom>
                </Text>
                {examplesArray && examplesArray.length > 0 && (
                    <Text variant="caption" color="muted" className="mt-0.5 block">
                        {examplesArray.length} {examplesArray.length === 1 ? "ejemplo definido" : "ejemplos definidos"}
                    </Text>
                )}
              </div>
              {!isReadOnlyEffective && (
                  <CustomButton type="button" variant="outline" size="sm" onClick={addNewExample} leftIcon={<Lightbulb className="h-4 w-4" />}>
                     {exampleFields.length === 0 ? "Añadir Ejemplo" : "Añadir Otro Ejemplo"}
                  </CustomButton>
                )}
            </StandardCard.Header>
            <StandardCard.Content className="space-y-3">
            {exampleFields.length === 0 && isReadOnlyEffective && (
                <Text color="muted" className="text-sm italic">No se definieron ejemplos.</Text>
            )}
            {exampleFields.map((item, index) => (
                 <div key={item.id} className="flex items-start gap-2">
                    <div className="flex-grow">
                        <Controller
                        name={`examples.${index}.example`}
                        control={control}
                        render={({ field }) => (
                            <TextArea
                            placeholder={`Ejemplo ${index + 1}`}
                            readOnly={isReadOnlyEffective}
                            className="min-h-[40px]"
                            rows={1}
                            error={errors.examples?.[index]?.example?.message}
                            success={getFieldSuccessState("examples", index, "example")}
                            {...field}
                            />
                        )}
                        />
                        {errors.examples?.[index]?.example?.message && (
                            <Text variant="caption" color="danger" className="mt-1 ml-1 block">
                                {errors.examples?.[index]?.example?.message}
                            </Text>
                        )}
                    </div>
                    {!isReadOnlyEffective && ( <CustomButton type="button" variant="ghost" color="danger" size="sm" onClick={() => removeExample(index)}  className="mt-1"> <Trash2 className="h-4 w-4" /> </CustomButton> )}
                     {getFieldSuccessState("examples", index, "example") && !isReadOnlyEffective && ( <CheckCircle className="h-5 w-5 text-success mt-1" /> )}
                  </div>
            ))}
            </StandardCard.Content>
          </StandardCard>

          {/* BOTÓN DE SUBMIT */}
          {modo !== "ver" && (
            <div className="flex justify-end pt-6">
              <CustomButton
                type="submit"
                color="primary"
                size="lg"
                loading={loading}
                disabled={loading || (modo === "editar" && !dirtyFields) || (!isValid && isSubmitted) }
              >
                {modo === "crear" ? "Crear Dimensión" : "Guardar Cambios"}
              </CustomButton>
            </div>
          )}
        </form>
      </StandardCard.Content>
    </StandardCard>
  );
};