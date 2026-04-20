import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createGalaxy } from '@/lib/actions/minotauro-actions';

interface GalaxyForm {
  title: string;
  description: string;
}

interface UseGalaxyCreationReturn {
  newGalaxyForm: GalaxyForm;
  showNewGalaxyForm: boolean;
  setNewGalaxyForm: React.Dispatch<React.SetStateAction<GalaxyForm>>;
  setShowNewGalaxyForm: React.Dispatch<React.SetStateAction<boolean>>;
  handleCreateGalaxy: () => Promise<void>;
}

export function useGalaxyCreation(
  universeId: string,
  onSuccess: () => Promise<void>
): UseGalaxyCreationReturn {
  const { toast } = useToast();
  
  const [newGalaxyForm, setNewGalaxyForm] = useState<GalaxyForm>({
    title: '',
    description: '',
  });
  const [showNewGalaxyForm, setShowNewGalaxyForm] = useState(false);

  const handleCreateGalaxy = useCallback(async () => {
    if (!newGalaxyForm.title.trim()) {
      toast({
        title: 'Error',
        description: 'El título es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    const result = await createGalaxy({
      universe_id: universeId,
      title: newGalaxyForm.title.trim(),
      description: newGalaxyForm.description.trim() || undefined,
    });

    if (result.success) {
      toast({
        title: '🌌 Sección creada',
        description: `"${newGalaxyForm.title}" está lista`,
      });
      setNewGalaxyForm({ title: '', description: '' });
      setShowNewGalaxyForm(false);
      await onSuccess();
    } else {
      toast({
        title: 'Error al crear sección',
        description: result.error || 'Intenta nuevamente',
        variant: 'destructive',
      });
    }
  }, [newGalaxyForm, universeId, onSuccess, toast]);

  return {
    newGalaxyForm,
    showNewGalaxyForm,
    setNewGalaxyForm,
    setShowNewGalaxyForm,
    handleCreateGalaxy,
  };
}
