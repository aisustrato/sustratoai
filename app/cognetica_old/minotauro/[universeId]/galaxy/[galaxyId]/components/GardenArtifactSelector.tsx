// 📍 app/cognetica_old/minotauro/[universeId]/galaxy/[galaxyId]/components/GardenArtifactSelector.tsx
// 🎯 PROPÓSITO: Selector de artefactos de jardín con versión de Micelio individual y contador de tokens

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardBadge } from '@/components/ui/StandardBadge';
import { StandardText } from '@/components/ui/StandardText';
import { Check, X, Sprout, FileText, Zap } from 'lucide-react';
import type { GardenPayloadVersion } from '@/lib/actions/cognetica-old-gardens-minotauro';
import { estimateTokens } from '@/lib/utils/token-estimator';

interface GardenArtifact {
  id: string;
  title: string;
  type: string;
  has_chronicle: boolean;
  micelio_destilada: string;
  micelio_cronica: string;
  micelio_extendida: string;
  matched_elements: string[];
  relevance_score: number;
}

interface Garden {
  id: string;
  name: string;
  emoji: string;
  artifacts: GardenArtifact[];
}

interface ArtifactSelection {
  artifactId: string;
  version: GardenPayloadVersion;
  tokens: {
    ligera: number;
    estandar: number;
    completa: number;
  };
}

interface GardenArtifactSelectorProps {
  projectId: string;
  onConfirm: (selections: Map<string, { artifactId: string; version: GardenPayloadVersion; gardenId: string; gardenName: string }>) => void;
  onCancel: () => void;
}

export function GardenArtifactSelector({
  projectId,
  onConfirm,
  onCancel
}: GardenArtifactSelectorProps) {
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [selectedGardenId, setSelectedGardenId] = useState<string | null>(null);
  const [artifactSelections, setArtifactSelections] = useState<Map<string, ArtifactSelection>>(new Map());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadGardens();
  }, [projectId]);

  const loadGardens = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cognetica_old/gardens?projectId=${projectId}`);
      if (!response.ok) throw new Error('Error al cargar jardines');
      
      const data = await response.json();
      setGardens(data.gardens || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los jardines',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGardenArtifacts = async (gardenId: string) => {
    try {
      const response = await fetch('/api/cognetica_old/gardens/generate-payload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gardenId, version: 'completa' })
      });

      if (!response.ok) throw new Error('Error al cargar artefactos');

      const result = await response.json();
      if (!result.success || !result.data) throw new Error('Error en respuesta');

      const gardenData = result.data;
      const garden = gardens.find(g => g.id === gardenId);
      
      if (!garden) return;

      const updatedGarden: Garden = {
        ...garden,
        artifacts: gardenData.artifacts || []
      };

      setGardens(prev => prev.map(g => g.id === gardenId ? updatedGarden : g));

      // Inicializar selecciones con versión ligera por defecto
      const newSelections = new Map<string, ArtifactSelection>();
      (gardenData.artifacts || []).forEach((artifact: GardenArtifact) => {
        if (artifact.has_chronicle) {
          newSelections.set(artifact.id, {
            artifactId: artifact.id,
            version: 'ligera',
            tokens: {
              ligera: estimateTokens(artifact.micelio_destilada || ''),
              estandar: estimateTokens(artifact.micelio_cronica || ''),
              completa: estimateTokens(artifact.micelio_extendida || '')
            }
          });
        }
      });

      setArtifactSelections(newSelections);

    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los artefactos del jardín',
        variant: 'destructive',
      });
    }
  };

  const handleGardenSelect = (gardenId: string) => {
    setSelectedGardenId(gardenId);
    loadGardenArtifacts(gardenId);
  };

  const handleVersionChange = (artifactId: string, version: GardenPayloadVersion) => {
    setArtifactSelections(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(artifactId);
      if (current) {
        newMap.set(artifactId, { ...current, version });
      }
      return newMap;
    });
  };

  const handleArtifactToggle = (artifactId: string) => {
    setArtifactSelections(prev => {
      const newMap = new Map(prev);
      if (newMap.has(artifactId)) {
        newMap.delete(artifactId);
      } else {
        const garden = gardens.find(g => g.id === selectedGardenId);
        const artifact = garden?.artifacts.find(a => a.id === artifactId);
        if (artifact && artifact.has_chronicle) {
          newMap.set(artifactId, {
            artifactId,
            version: 'ligera',
            tokens: {
              ligera: estimateTokens(artifact.micelio_destilada || ''),
              estandar: estimateTokens(artifact.micelio_cronica || ''),
              completa: estimateTokens(artifact.micelio_extendida || '')
            }
          });
        }
      }
      return newMap;
    });
  };

  const totalTokens = useMemo(() => {
    let total = 0;
    artifactSelections.forEach(selection => {
      total += selection.tokens[selection.version];
    });
    return total;
  }, [artifactSelections]);

  const handleConfirm = () => {
    const garden = gardens.find(g => g.id === selectedGardenId);
    if (!garden) return;

    const finalSelections = new Map<string, { artifactId: string; version: GardenPayloadVersion; gardenId: string; gardenName: string }>();
    
    artifactSelections.forEach((selection, artifactId) => {
      finalSelections.set(artifactId, {
        artifactId,
        version: selection.version,
        gardenId: garden.id,
        gardenName: garden.name
      });
    });

    onConfirm(finalSelections);
  };

  const selectedGarden = gardens.find(g => g.id === selectedGardenId);

  if (loading) {
    return (
      <StandardCard>
        <div className="p-6">
          <StandardText>Cargando jardines...</StandardText>
        </div>
      </StandardCard>
    );
  }

  return (
    <StandardCard>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5" />
            <StandardText variant="h3">
              {selectedGarden ? `${selectedGarden.emoji} ${selectedGarden.name}` : 'Seleccionar Jardín'}
            </StandardText>
          </div>
          {selectedGarden && (
            <StandardButton
              size="sm"
              colorScheme="neutral"
              onClick={() => {
                setSelectedGardenId(null);
                setArtifactSelections(new Map());
              }}
            >
              Cambiar Jardín
            </StandardButton>
          )}
        </div>

        {/* Lista de Jardines */}
        {!selectedGarden && (
          <div className="space-y-2">
            {gardens.map(garden => (
              <div
                key={garden.id}
                className="p-4 border rounded-lg cursor-pointer hover:bg-accent/5 transition-colors"
                onClick={() => handleGardenSelect(garden.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{garden.emoji}</span>
                    <StandardText weight="medium">{garden.name}</StandardText>
                  </div>
                  <StandardBadge colorScheme="neutral">
                    {(garden as any).artifacts_count || 0} artefactos
                  </StandardBadge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lista de Artefactos */}
        {selectedGarden && selectedGarden.artifacts && (
          <div className="space-y-4">
            {selectedGarden.artifacts.map(artifact => {
              const isSelected = artifactSelections.has(artifact.id);
              const selection = artifactSelections.get(artifact.id);

              if (!artifact.has_chronicle) {
                return (
                  <div key={artifact.id} className="p-4 border rounded-lg opacity-50">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4" />
                      <StandardText size="sm">{artifact.title}</StandardText>
                      <StandardBadge colorScheme="neutral" size="sm">Sin Micelio</StandardBadge>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={artifact.id}
                  className={`p-4 border rounded-lg transition-all ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header del artefacto */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleArtifactToggle(artifact.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <StandardText weight="medium" size="sm">{artifact.title}</StandardText>
                          <StandardText size="xs" className="text-muted-foreground mt-1">
                            Relevancia: {Math.round(artifact.relevance_score * 100)}% • 
                            {artifact.matched_elements.length} elementos
                          </StandardText>
                        </div>
                      </div>
                    </div>

                    {/* Selector de versión */}
                    {isSelected && selection && (
                      <div className="ml-7 space-y-2">
                        <StandardText size="xs" weight="medium" className="text-muted-foreground">
                          Versión de Micelio:
                        </StandardText>
                        <div className="flex gap-2">
                          {(['ligera', 'estandar', 'completa'] as GardenPayloadVersion[]).map(v => (
                            <button
                              key={v}
                              onClick={() => handleVersionChange(artifact.id, v)}
                              className={`px-3 py-2 rounded-md text-sm transition-all ${
                                selection.version === v
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80'
                              }`}
                            >
                              <div className="flex flex-col items-center gap-1">
                                <span className="capitalize">{v}</span>
                                <span className="text-xs opacity-75">
                                  {selection.tokens[v].toLocaleString()} tokens
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer con contador y botones */}
        {selectedGarden && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <StandardText weight="medium">
                  Total: {totalTokens.toLocaleString()} tokens
                </StandardText>
              </div>
              <StandardText size="sm" className="text-muted-foreground">
                {artifactSelections.size} artefacto(s) seleccionado(s)
              </StandardText>
            </div>

            <div className="flex gap-2 justify-end">
              <StandardButton
                colorScheme="neutral"
                onClick={onCancel}
              >
                <X className="w-4 h-4" />
                Cancelar
              </StandardButton>
              <StandardButton
                colorScheme="success"
                onClick={handleConfirm}
                disabled={artifactSelections.size === 0}
              >
                <Check className="w-4 h-4" />
                Agregar {artifactSelections.size} artefacto(s)
              </StandardButton>
            </div>
          </div>
        )}
      </div>
    </StandardCard>
  );
}
