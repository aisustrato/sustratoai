"use client";

import { useState } from "react";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateAdditivePhaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  sourcePhaseId: string;
  sourcePhaseName: string;
  totalArticles: number;
}

export function CreateAdditivePhaseDialog({
  open,
  onOpenChange,
  projectId,
  sourcePhaseId,
  sourcePhaseName,
  totalArticles
}: CreateAdditivePhaseDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("El nombre de la fase es requerido");
      return;
    }

    setIsCreating(true);

    try {
      const payload = {
        projectId,
        sourcePhaseId,
        name: name.trim(),
        description: description.trim() || undefined
      };
      
      console.log('🔗 [UI] Creando fase aditiva:', payload);

      const response = await fetch('/api/preclassification/phases/create-additive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('📡 [UI] Response status:', response.status);

      const result = await response.json();
      console.log('📡 [UI] Response data:', result);

      if (!result.success) {
        console.error('❌ [UI] Error del servidor:', result.error);
        toast.error(result.error || 'Error al crear fase aditiva');
        return;
      }

      console.log('✅ [UI] Fase aditiva creada:', result.data);

      toast.success(`Fase "${name}" creada con ${result.data.articlesCount} artículos`);
      
      // Cerrar dialog
      onOpenChange(false);
      
      // Resetear form
      setName("");
      setDescription("");

      // Redirigir a configuración de dimensiones de la nueva fase
      toast.info("Ahora puedes configurar las dimensiones de la nueva fase");
      
      // Recargar página para ver nueva fase
      router.refresh();

    } catch (error) {
      console.error('❌ [UI] Error al crear fase aditiva:', error);
      toast.error('Error inesperado al crear fase');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <StandardDialog open={open} onOpenChange={onOpenChange}>
      <StandardDialog.Content>
        <StandardDialog.Header>
          <StandardDialog.Title>Crear Fase Aditiva</StandardDialog.Title>
          <StandardDialog.Description>
            Crea una nueva fase que reutiliza el mismo universo de artículos para agregar dimensiones adicionales
          </StandardDialog.Description>
        </StandardDialog.Header>

        <StandardDialog.Body>
          <div className="space-y-6">
            {/* Resumen del universo origen */}
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-500" />
                <StandardText size="sm" weight="semibold">
                  Universo Origen
                </StandardText>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <StandardText size="sm" colorShade="subtle">
                    Fase origen:
                  </StandardText>
                  <StandardBadge size="sm" colorScheme="tertiary">
                    {sourcePhaseName}
                  </StandardBadge>
                </div>
                
                <div className="flex items-center justify-between">
                  <StandardText size="sm" colorShade="subtle">
                    Artículos a copiar:
                  </StandardText>
                  <StandardBadge size="sm" colorScheme="primary">
                    {totalArticles} artículos
                  </StandardBadge>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <StandardText size="xs" colorShade="subtle">
                  ℹ️ La nueva fase tendrá los mismos {totalArticles} artículos que la fase &quot;{sourcePhaseName}&quot;. 
                  Las clasificaciones existentes se mantienen intactas.
                </StandardText>
              </div>
            </div>

            {/* Formulario */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nombre de la nueva fase <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                  placeholder="Ej: Fase 2 - Consideraciones Éticas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                  placeholder="Describe el propósito de esta fase y las dimensiones que agregarás..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Advertencia */}
            <div className="rounded-lg border border-accent-200 dark:border-accent-800 p-3 bg-accent-50 dark:bg-accent-900/20">
              <StandardText size="xs" colorShade="subtle">
                💡 <strong>Siguiente paso:</strong> Después de crear la fase, podrás agregar nuevas dimensiones 
                específicas para esta fase. Los artículos ya tendrán sus clasificaciones de la fase anterior.
              </StandardText>
            </div>
          </div>
        </StandardDialog.Body>

        <StandardDialog.Footer>
          <StandardDialog.Close asChild>
            <StandardButton styleType="outline">
              Cancelar
            </StandardButton>
          </StandardDialog.Close>
          <StandardButton 
            colorScheme="primary" 
            onClick={handleCreate}
            loading={isCreating}
          >
            Crear Fase
          </StandardButton>
        </StandardDialog.Footer>
      </StandardDialog.Content>
    </StandardDialog>
  );
}
