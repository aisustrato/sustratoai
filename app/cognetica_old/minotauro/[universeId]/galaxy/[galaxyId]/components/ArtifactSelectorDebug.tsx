'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Artifact {
  id: string;
  title: string;
  type: 'audio' | 'video' | 'document' | 'image' | 'other';
  description: string | null;
  created_at: string;
  duration_seconds: number | null;
}

interface ArtifactSelectorProps {
  projectId: string;
  onSelect: (artifactIds: string[]) => void;
  onCancel: () => void;
  preSelectedIds?: string[];
  alreadyCuratedIds?: string[];
}

export function ArtifactSelector({ 
  projectId, 
  onSelect, 
  onCancel,
  preSelectedIds = [],
  alreadyCuratedIds = []
}: ArtifactSelectorProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(preSelectedIds));
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const curatedSet = new Set(alreadyCuratedIds);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    loadArtifacts();
  }, [projectId]);

  const loadArtifacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cognetica_old/artifacts?projectId=${projectId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar');
      }

      const data = await response.json();
      setArtifacts(data.artifacts || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los artefactos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (artifactId: string) => {
    if (curatedSet.has(artifactId)) return;
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(artifactId)) {
        newSet.delete(artifactId);
      } else {
        newSet.add(artifactId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    onSelect(Array.from(selectedIds));
  };

  const availableCount = artifacts.filter(a => !curatedSet.has(a.id)).length;

  return (
    <div className="p-4 border rounded-lg bg-card space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold">Seleccionar Artefactos</h3>
          <p className="text-xs text-muted-foreground">
            {selectedIds.size} seleccionados · {availableCount} disponibles · {curatedSet.size} ya curados
          </p>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-1.5">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">⏳ Cargando...</p>
          </div>
        ) : artifacts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">📦 No hay artefactos</p>
          </div>
        ) : (
          artifacts.map(artifact => {
            const isSelected = selectedIds.has(artifact.id);
            const isCurated = curatedSet.has(artifact.id);

            return (
              <div
                key={artifact.id}
                onClick={() => !isCurated && toggleSelection(artifact.id)}
                className={`
                  p-3 rounded-lg border transition-all
                  ${isCurated
                    ? 'border-border bg-muted/40 opacity-60 cursor-not-allowed'
                    : isSelected
                      ? 'border-primary bg-primary/10 cursor-pointer'
                      : 'border-border hover:border-primary/50 cursor-pointer'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-4 h-4 rounded border-2 flex items-center justify-center shrink-0
                    ${isCurated ? 'border-muted-foreground bg-muted' : isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}
                  `}>
                    {isCurated
                      ? <span className="text-[9px] text-muted-foreground">✓</span>
                      : isSelected
                        ? <span className="text-[9px] text-primary-foreground">✓</span>
                        : null
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{artifact.title}</h4>
                    <p className="text-xs text-muted-foreground">{artifact.type}</p>
                  </div>

                  {isCurated && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0">
                      Ya curada
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t">
        <button 
          onClick={onCancel}
          className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md"
        >
          Cancelar
        </button>
        <button 
          onClick={handleConfirm}
          disabled={selectedIds.size === 0}
          className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md disabled:opacity-50"
        >
          Conectar ({selectedIds.size})
        </button>
      </div>
    </div>
  );
}
