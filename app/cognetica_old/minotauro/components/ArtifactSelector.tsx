// 📍 app/cognetica_old/minotauro/components/ArtifactSelector.tsx
// 🎯 PROPÓSITO: Selector de artefactos de Cognética para conectar como fuentes curadas

'use client';

import { useState, useEffect } from 'react';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardBadge } from '@/components/ui/StandardBadge';
import { StandardInput } from '@/components/ui/StandardInput';
import { Search, FileText, Video, Music, Image, File, Check, X } from 'lucide-react';
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
}

const ARTIFACT_ICONS = {
  audio: Music,
  video: Video,
  document: FileText,
  image: Image,
  other: File,
};

const ARTIFACT_COLORS = {
  audio: 'warning',
  video: 'primary',
  document: 'success',
  image: 'accent',
  other: 'neutral',
} as const;

export function ArtifactSelector({ 
  projectId, 
  onSelect, 
  onCancel,
  preSelectedIds = []
}: ArtifactSelectorProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [filteredArtifacts, setFilteredArtifacts] = useState<Artifact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(preSelectedIds));
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  console.log('🎯 [ArtifactSelector] Componente montado con projectId:', projectId);

  useEffect(() => {
    if (!projectId) {
      console.error('❌ [ArtifactSelector] projectId es undefined o null!');
      toast({
        title: 'Error de configuración',
        description: 'No se pudo identificar el proyecto',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    loadArtifacts();
  }, [projectId]);

  useEffect(() => {
    filterArtifacts();
  }, [searchQuery, artifacts]);

  const loadArtifacts = async () => {
    try {
      setLoading(true);
      console.log('🔍 [ArtifactSelector] Cargando artefactos para proyecto:', projectId);
      
      const response = await fetch(`/api/cognetica_old/artifacts?projectId=${projectId}`);
      
      console.log('📡 [ArtifactSelector] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [ArtifactSelector] Error response:', errorData);
        throw new Error(errorData.error || 'Error al cargar artefactos');
      }

      const data = await response.json();
      console.log('✅ [ArtifactSelector] Datos recibidos:', {
        success: data.success,
        count: data.count,
        artifactsLength: data.artifacts?.length,
        artifacts: data.artifacts
      });
      
      setArtifacts(data.artifacts || []);
    } catch (error) {
      console.error('❌ [ArtifactSelector] Error loading artifacts:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudieron cargar los artefactos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterArtifacts = () => {
    if (!searchQuery.trim()) {
      setFilteredArtifacts(artifacts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = artifacts.filter(artifact => 
      artifact.title.toLowerCase().includes(query) ||
      artifact.description?.toLowerCase().includes(query) ||
      artifact.type.toLowerCase().includes(query)
    );
    
    setFilteredArtifacts(filtered);
  };

  const toggleSelection = (artifactId: string) => {
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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <StandardCard className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Seleccionar Artefactos de Cognética</h3>
          <p className="text-sm text-muted-foreground">
            Conecta artefactos como fuentes curadas para esta sección
          </p>
        </div>
        <StandardBadge colorScheme="primary">
          {selectedIds.size} seleccionados
        </StandardBadge>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <StandardInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por título, descripción o tipo..."
          className="pl-10"
        />
      </div>

      {/* Lista de artefactos */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">⏳ Cargando artefactos...</p>
            <p className="text-xs text-muted-foreground mt-2">Proyecto: {projectId}</p>
          </div>
        ) : filteredArtifacts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchQuery ? '🔍 No se encontraron artefactos con ese criterio' : '📦 No hay artefactos en este proyecto'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Total disponibles: {artifacts.length}
            </p>
            {!searchQuery && artifacts.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Crea artefactos en Cognética primero
              </p>
            )}
          </div>
        ) : (
          filteredArtifacts.map(artifact => {
            const Icon = ARTIFACT_ICONS[artifact.type];
            const isSelected = selectedIds.has(artifact.id);
            const duration = formatDuration(artifact.duration_seconds);

            return (
              <div
                key={artifact.id}
                onClick={() => toggleSelection(artifact.id)}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox visual */}
                  <div className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5
                    ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}
                  `}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>

                  {/* Icono del tipo */}
                  <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{artifact.title}</h4>
                      <StandardBadge 
                        colorScheme={ARTIFACT_COLORS[artifact.type]}
                        size="sm"
                      >
                        {artifact.type}
                      </StandardBadge>
                      {duration && (
                        <span className="text-xs text-muted-foreground">
                          {duration}
                        </span>
                      )}
                    </div>
                    
                    {artifact.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {artifact.description}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(artifact.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <StandardButton
          colorScheme="neutral"
          onClick={onCancel}
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </StandardButton>
        <StandardButton
          colorScheme="primary"
          onClick={handleConfirm}
          disabled={selectedIds.size === 0}
        >
          <Check className="w-4 h-4 mr-2" />
          Conectar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
        </StandardButton>
      </div>
    </StandardCard>
  );
}
