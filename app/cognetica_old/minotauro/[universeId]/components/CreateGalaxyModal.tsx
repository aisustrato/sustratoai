// 📍 app/cognetica_old/minotauro/[universeId]/components/CreateGalaxyModal.tsx
// 🎯 PROPÓSITO: Modal para crear/editar galaxias (secciones)

'use client';

import { useState, useEffect } from 'react';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardInput } from '@/components/ui/StandardInput';
import { StandardTextarea } from '@/components/ui/StandardTextarea';
import { StandardDialog } from '@/components/ui/StandardDialog';
import { StandardText } from '@/components/ui/StandardText';
import { createGalaxy, updateGalaxy } from '@/lib/actions/minotauro-actions';
import { useToast } from '@/hooks/use-toast';
import type { MinotauroGalaxy } from '@/lib/types/minotauro-types';

interface CreateGalaxyModalProps {
  universeId: string;
  galaxy?: MinotauroGalaxy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateGalaxyModal({
  universeId,
  galaxy,
  open,
  onOpenChange,
  onSuccess,
}: CreateGalaxyModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  const isEditing = !!galaxy;

  useEffect(() => {
    if (galaxy) {
      setFormData({
        title: galaxy.title,
        description: galaxy.description || '',
      });
    } else {
      setFormData({ title: '', description: '' });
    }
  }, [galaxy, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'El título es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    let result;
    if (isEditing) {
      result = await updateGalaxy(galaxy.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
      });
    } else {
      result = await createGalaxy({
        universe_id: universeId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
      });
    }

    setLoading(false);

    if (result.success) {
      toast({
        title: isEditing ? '✏️ Galaxia actualizada' : '🌌 Galaxia creada',
        description: `"${formData.title}" está ${isEditing ? 'actualizada' : 'lista'}`,
      });
      
      setFormData({ title: '', description: '' });
      onOpenChange(false);
      onSuccess();
    } else {
      toast({
        title: `Error al ${isEditing ? 'actualizar' : 'crear'} galaxia`,
        description: result.error || 'Intenta nuevamente',
        variant: 'destructive',
      });
    }
  };

  return (
    <StandardDialog open={open} onOpenChange={onOpenChange}>
      <StandardDialog.Content colorScheme="primary" size="md">
        <StandardDialog.Header>
          <StandardDialog.Title>
            {isEditing ? '✏️ Editar Sección' : '🌌 Nueva Sección (Galaxia)'}
          </StandardDialog.Title>
          <StandardDialog.Description>
            {isEditing 
              ? 'Modifica la información de esta sección'
              : 'Crea una nueva sección para estructurar tu escrito'
            }
          </StandardDialog.Description>
        </StandardDialog.Header>

        <StandardDialog.Body>
          <form onSubmit={handleSubmit} className="space-y-4" id="galaxy-form">
            {/* Título */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Título <span className="text-destructive">*</span>
              </label>
              <StandardInput
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Introducción, Marco Teórico, Metodología..."
                disabled={loading}
                required
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Descripción <span className="text-muted-foreground">(opcional)</span>
              </label>
              <StandardTextarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="¿Qué desarrollarás en esta sección?"
                rows={3}
                disabled={loading}
              />
              <StandardText size="xs" className="text-muted-foreground">
                Una breve descripción del contenido de esta galaxia
              </StandardText>
            </div>
          </form>
        </StandardDialog.Body>

        <StandardDialog.Footer>
          <StandardDialog.Close asChild>
            <StandardButton
              colorScheme="neutral"
              disabled={loading}
            >
              Cancelar
            </StandardButton>
          </StandardDialog.Close>
          <StandardButton
            type="submit"
            form="galaxy-form"
            colorScheme="primary"
            disabled={loading}
          >
            {loading 
              ? (isEditing ? 'Actualizando...' : 'Creando...') 
              : (isEditing ? '✏️ Actualizar' : '🌌 Crear Galaxia')
            }
          </StandardButton>
        </StandardDialog.Footer>
      </StandardDialog.Content>
    </StandardDialog>
  );
}
