import { StandardButton } from '@/components/ui/StandardButton';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { StandardProgressBar } from '@/components/ui/StandardProgressBar';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import type { PaperStandard, StandardConfig } from '../utils/paperStandards';

interface UniverseHeaderProps {
  title: string;
  subtitle: string;
  paperStandard: PaperStandard;
  totalSections: number;
  totalWords: number;
  totalPages: number;
  standard: StandardConfig;
  onStandardChange: (standard: PaperStandard) => void;
  onNewSection: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export function UniverseHeader({
  title,
  subtitle,
  paperStandard,
  totalSections,
  totalWords,
  totalPages,
  standard,
  onStandardChange,
  onNewSection,
  onDelete,
  onBack,
}: UniverseHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <StandardButton
              size="sm"
              colorScheme="neutral"
              styleType="ghost"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </StandardButton>
          </div>
          <StandardPageTitle
            title={title}
            subtitle={subtitle}
          />
        </div>
        <div className="flex gap-2">
          <StandardButton
            colorScheme="primary"
            size="sm"
            onClick={onNewSection}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Sección
          </StandardButton>
          <StandardButton
            colorScheme="danger"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </StandardButton>
        </div>
      </div>

      {/* Métricas Globales */}
      <StandardCard colorScheme="primary" className="p-4">
        <div className="grid grid-cols-4 gap-4 items-center">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Estándar de Paper
            </label>
            <select
              value={paperStandard}
              onChange={(e) => onStandardChange(e.target.value as PaperStandard)}
              className="w-full px-3 py-2 rounded-md border bg-background"
            >
              <option value="zenodo">Zenodo (10 págs)</option>
              <option value="nature">Nature (12 págs)</option>
              <option value="apa">APA (10 págs)</option>
              <option value="libre">Libre</option>
            </select>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Secciones</p>
            <p className="text-2xl font-bold">{totalSections}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Palabras</p>
            <p className="text-2xl font-bold">{totalWords}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Páginas</p>
            <p className="text-2xl font-bold">
              {totalPages.toFixed(1)} / {standard.totalPages}
            </p>
            <StandardProgressBar
              value={totalPages}
              max={standard.totalPages}
              colorScheme="primary"
              size="sm"
              showValue={false}
              animated={true}
              className="mt-2"
            />
          </div>
        </div>
      </StandardCard>
    </div>
  );
}
