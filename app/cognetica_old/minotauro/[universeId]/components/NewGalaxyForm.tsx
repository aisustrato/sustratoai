import { StandardButton } from '@/components/ui/StandardButton';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardInput } from '@/components/ui/StandardInput';
import { Plus, X } from 'lucide-react';

interface NewGalaxyFormProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function NewGalaxyForm({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onSubmit,
  onCancel,
}: NewGalaxyFormProps) {
  return (
    <StandardCard colorScheme="primary" className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Nueva Sección</h3>
          <StandardButton
            size="sm"
            styleType="ghost"
            onClick={onCancel}
          >
            <X className="w-4 h-4" />
          </StandardButton>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <StandardInput
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Título de la sección"
          />
          <StandardInput
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Descripción (opcional)"
          />
        </div>
        <StandardButton
          colorScheme="success"
          onClick={onSubmit}
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear Sección
        </StandardButton>
      </div>
    </StandardCard>
  );
}
