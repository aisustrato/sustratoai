//. 📍 app/datos-maestros/proyecto/components/ProjectEditForm.tsx
"use client";

// 📚 DOCUMENTACIÓN 📚
/**
 * @description Formulario para editar o visualizar los detalles del proyecto.
 * Se basa en la prop `isReadOnly` para determinar el modo.
 * @param {ProjectEditFormProps} props - Las props del componente.
 * @returns {JSX.Element} Componente con el formulario.
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { toast } from "sonner";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { StandardButton } from "@/components/ui/StandardButton";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { Save } from "lucide-react";
import { updateProjectDetails, type UpdateProjectDetailsPayload } from "@/lib/actions/project-actions";
import type { Database } from "@/lib/database.types";
//#endregion

/**
 * @description Props para el componente ProjectEditForm.
 */
interface ProjectEditFormProps {
  initialProjectData: Database['public']['Tables']['projects']['Row'];
  isReadOnly?: boolean;
}

/**
 * @description Formulario para editar o visualizar los detalles del proyecto.
 * Se basa en la prop `isReadOnly` para determinar el modo.
 * @param {ProjectEditFormProps} props - Las props del componente.
 * @returns {JSX.Element} Componente con el formulario.
 */
export function ProjectEditForm({ initialProjectData, isReadOnly = false }: ProjectEditFormProps) {
  const { proyectoActual, authLoading } = useAuth();
  const router = useRouter();

  const getInitialState = () => ({
    name: initialProjectData.name ?? "",
    code: initialProjectData.code ?? "",
    description: initialProjectData.description ?? "",
    institution_name: initialProjectData.institution_name ?? "",
    proposal: initialProjectData.proposal ?? "",
    proposal_bibliography: initialProjectData.proposal_bibliography ?? "",
    proposal_interviews: initialProjectData.proposal_interviews ?? "",
  });

  const [formData, setFormData] = useState(getInitialState);
  const [initialData, setInitialData] = useState(getInitialState);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !initialProjectData || !hasChanges) return;

    setIsSaving(true);

    const changedData: Partial<Omit<UpdateProjectDetailsPayload, "projectId">> = {};
    (Object.keys(formData) as Array<keyof typeof formData>).forEach((key) => {
      if (formData[key] !== initialData[key]) {
        (changedData as any)[key] = formData[key];
      }
    });

    const payload: UpdateProjectDetailsPayload = {
      projectId: initialProjectData.id,
      ...changedData,
    };

    try {
      const result = await updateProjectDetails(payload);

      if (result && result.success) {
        toast.success("Proyecto Actualizado", {
          description: "Los datos del proyecto se han guardado correctamente.",
        });
        
        const newProjectData = {
          name: result.data.project.name ?? "",
          code: result.data.project.code ?? "",
          description: result.data.project.description ?? "",
          institution_name: result.data.project.institution_name ?? "",
          proposal: result.data.project.proposal ?? "",
          proposal_bibliography: result.data.project.proposal_bibliography ?? "",
          proposal_interviews: result.data.project.proposal_interviews ?? "",
        };
        setFormData(newProjectData);
        setInitialData(newProjectData);

        router.refresh();
      } else {
        toast.error("Error al actualizar", {
          description: result.error || "No se pudo guardar el proyecto.",
        });
      }
    } catch (error) {
      toast.error("Error inesperado", {
        description: "Ocurrió un error en el servidor. Inténtalo de nuevo más tarde.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <SustratoLoadingLogo />
      </div>
    );
  }

  return (
    <StandardCard
      shadow="md"
      accentPlacement="top"
      colorScheme="primary"
      styleType="subtle"
    >
      <StandardCard.Header>
        <StandardCard.Title>Información General</StandardCard.Title>
        <StandardCard.Subtitle>
          {isReadOnly 
            ? "Visualización de los datos principales del proyecto."
            : "Modifica los datos principales del proyecto."
          }
        </StandardCard.Subtitle>
      </StandardCard.Header>
      <StandardCard.Content>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StandardFormField
              label="Nombre del Proyecto"
              hint="El nombre principal que identifica al proyecto."
              htmlFor="name"
            >
              <StandardInput
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Investigación sobre IA en Educación"
                disabled={isReadOnly}
              />
            </StandardFormField>

            <StandardFormField
              label="Código del Proyecto"
              hint="Un identificador único o código interno."
              htmlFor="code"
            >
              <StandardInput
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="Ej: PROJ-IA-EDU-001"
                disabled={isReadOnly}
              />
            </StandardFormField>
          </div>

          <StandardFormField
            label="Nombre de la Institución"
            hint="La institución principal que respalda el proyecto."
            htmlFor="institution_name"
          >
            <StandardInput
              name="institution_name"
              value={formData.institution_name}
              onChange={handleInputChange}
              placeholder="Ej: Universidad de la Innovación"
              disabled={isReadOnly}
            />
          </StandardFormField>

          <StandardFormField
            label="Descripción General"
            hint="Un resumen conciso del propósito y alcance del proyecto."
            htmlFor="description"
          >
            <StandardTextarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe brevemente el proyecto..."
              rows={4}
              disabled={isReadOnly}
            />
          </StandardFormField>

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Detalles de la Propuesta
            </h3>

            <StandardFormField
              label="Propuesta General"
              hint="La propuesta central o el marco teórico de la investigación."
              htmlFor="proposal"
            >
              <StandardTextarea
                name="proposal"
                value={formData.proposal}
                onChange={handleInputChange}
                placeholder="Detalla la propuesta general..."
                rows={6}
                disabled={isReadOnly}
              />
            </StandardFormField>

            {proyectoActual?.module_bibliography && (
              <StandardFormField
                label="Propuesta Bibliográfica"
                hint="El enfoque y las fuentes principales para la revisión de literatura."
                htmlFor="proposal_bibliography"
              >
                <StandardTextarea
                  name="proposal_bibliography"
                  value={formData.proposal_bibliography}
                  onChange={handleInputChange}
                  placeholder="Detalla la propuesta bibliográfica..."
                  rows={6}
                  disabled={isReadOnly}
                />
              </StandardFormField>
            )}

            {proyectoActual?.module_interviews && (
              <StandardFormField
                label="Propuesta de Entrevistas"
                hint="La metodología y los objetivos para las entrevistas a realizar."
                htmlFor="proposal_interviews"
              >
                <StandardTextarea
                  name="proposal_interviews"
                  value={formData.proposal_interviews}
                  onChange={handleInputChange}
                  placeholder="Detalla la propuesta de entrevistas..."
                  rows={6}
                  disabled={isReadOnly}
                />
              </StandardFormField>
            )}
          </div>

          {!isReadOnly && (
            <div className="flex justify-end pt-4">
              <StandardButton
                type="submit"
                colorScheme="primary"
                disabled={!hasChanges || isSaving}
                loading={isSaving}
                leftIcon={Save}
              >
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </StandardButton>
            </div>
          )}
        </form>
      </StandardCard.Content>
    </StandardCard>
  );
}
