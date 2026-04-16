// 📍 app/cognetica/minotauro/[universeId]/galaxy/[galaxyId]/components/GardenSelector.tsx
// 🎯 PROPÓSITO: Selector de Jardines de Resonancia para Minotauro con control de versión

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardBadge } from '@/components/ui/StandardBadge';
import { StandardText } from '@/components/ui/StandardText';
import { Check, X, Sprout } from 'lucide-react';
import type { GardenPayloadVersion } from '@/lib/actions/cognetica-gardens-minotauro';

interface Garden {
    id: string;
    name: string;
    description: string | null;
    emoji: string;
    created_at: string;
    elements_count?: number;
    artifacts_count?: number;
}

interface GardenSelectorProps {
    projectId: string;
    onSelect: (gardenIds: string[], version: GardenPayloadVersion) => void;
    onCancel: () => void;
    preSelectedIds?: string[];
    alreadyCuratedIds?: string[];
}

export function GardenSelector({
    projectId,
    onSelect,
    onCancel,
    preSelectedIds = [],
    alreadyCuratedIds = []
}: GardenSelectorProps) {
    const [gardens, setGardens] = useState<Garden[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(preSelectedIds));
    const [version, setVersion] = useState<GardenPayloadVersion>('ligera');
    const [loading, setLoading] = useState(true);
    const [estimating, setEstimating] = useState(false);
    const [tokenEstimate, setTokenEstimate] = useState<number | null>(null);
    const { toast } = useToast();
    const curatedSet = new Set(alreadyCuratedIds);

    useEffect(() => {
        if (!projectId) {
            setLoading(false);
            return;
        }
        loadGardens();
    }, [projectId]);

    // Estimar tokens cuando cambia selección o versión
    useEffect(() => {
        if (selectedIds.size > 0) {
            estimateTokens();
        } else {
            setTokenEstimate(null);
        }
    }, [selectedIds, version]);

    const loadGardens = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/cognetica/gardens?projectId=${projectId}`);

            if (!response.ok) {
                throw new Error('Error al cargar jardines');
            }

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

    const estimateTokens = async () => {
        if (selectedIds.size === 0) return;

        try {
            setEstimating(true);
            const response = await fetch('/api/cognetica/gardens/estimate-tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gardenIds: Array.from(selectedIds),
                    version
                })
            });

            if (!response.ok) {
                throw new Error('Error estimando tokens');
            }

            const result = await response.json();

            if (result.success && result.stats) {
                setTokenEstimate(result.stats.total_tokens);
            }
        } catch (error) {
            console.error('Error estimando tokens:', error);
        } finally {
            setEstimating(false);
        }
    };

    const toggleSelection = (gardenId: string) => {
        if (curatedSet.has(gardenId)) return;
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(gardenId)) {
                newSet.delete(gardenId);
            } else {
                newSet.add(gardenId);
            }
            return newSet;
        });
    };

    const handleConfirm = () => {
        onSelect(Array.from(selectedIds), version);
    };

    const versionInfo = useMemo(() => {
        switch (version) {
            case 'ligera':
                return {
                    label: '🌱 Ligera',
                    description: 'Título + elementos clave (5 semillas, 3 pensadores, disciplinas)',
                    estimatedTokens: '~200-400 tokens/jardín',
                    colorScheme: 'success' as const
                };
            case 'estandar':
                return {
                    label: '📊 Estándar',
                    description: 'Ligera + descripción + todos los elementos organizados',
                    estimatedTokens: '~500-800 tokens/jardín',
                    colorScheme: 'primary' as const
                };
            case 'completa':
                return {
                    label: '🔬 Completa',
                    description: 'Estándar + lista de artefactos resonantes (hasta 20)',
                    estimatedTokens: '~1000-2000 tokens/jardín',
                    colorScheme: 'accent' as const
                };
        }
    }, [version]);

    if (loading) {
        return (
            <StandardCard>
                <StandardCard.Content>
                    <div className="flex items-center justify-center py-8">
                        <StandardText colorScheme="neutral">Cargando jardines...</StandardText>
                    </div>
                </StandardCard.Content>
            </StandardCard>
        );
    }

    return (
        <div className="space-y-4">
            {/* Selector de versión */}
            <StandardCard colorScheme="accent">
                <StandardCard.Content>
                    <div className="space-y-3">
                        <StandardText weight="semibold" size="sm">
                            🎛️ Versión de envío
                        </StandardText>
                        
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setVersion('ligera')}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                    version === 'ligera'
                                        ? 'border-success-500 bg-success-50'
                                        : 'border-neutral-200 hover:border-success-300'
                                }`}
                            >
                                <div className="text-center">
                                    <div className="text-lg mb-1">🌱</div>
                                    <StandardText size="xs" weight="semibold">Ligera</StandardText>
                                    <StandardText size="xs" colorScheme="neutral" className="mt-1">
                                        200-400 tok
                                    </StandardText>
                                </div>
                            </button>

                            <button
                                onClick={() => setVersion('estandar')}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                    version === 'estandar'
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-neutral-200 hover:border-primary-300'
                                }`}
                            >
                                <div className="text-center">
                                    <div className="text-lg mb-1">📊</div>
                                    <StandardText size="xs" weight="semibold">Estándar</StandardText>
                                    <StandardText size="xs" colorScheme="neutral" className="mt-1">
                                        500-800 tok
                                    </StandardText>
                                </div>
                            </button>

                            <button
                                onClick={() => setVersion('completa')}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                    version === 'completa'
                                        ? 'border-accent-500 bg-accent-50'
                                        : 'border-neutral-200 hover:border-accent-300'
                                }`}
                            >
                                <div className="text-center">
                                    <div className="text-lg mb-1">🔬</div>
                                    <StandardText size="xs" weight="semibold">Completa</StandardText>
                                    <StandardText size="xs" colorScheme="neutral" className="mt-1">
                                        1k-2k tok
                                    </StandardText>
                                </div>
                            </button>
                        </div>

                        <div className="p-3 bg-neutral-50 rounded-lg">
                            <StandardText size="xs" colorScheme="neutral">
                                <strong>{versionInfo.label}:</strong> {versionInfo.description}
                            </StandardText>
                        </div>

                        {/* Estimación de tokens */}
                        {selectedIds.size > 0 && (
                            <div className="p-3 bg-accent-50 border border-accent-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <StandardText size="sm" weight="semibold">
                                        📊 Estimación de tokens
                                    </StandardText>
                                    {estimating ? (
                                        <StandardText size="sm" colorScheme="neutral">
                                            Calculando...
                                        </StandardText>
                                    ) : tokenEstimate !== null ? (
                                        <StandardBadge colorScheme={versionInfo.colorScheme}>
                                            ~{tokenEstimate.toLocaleString()} tokens
                                        </StandardBadge>
                                    ) : null}
                                </div>
                                <StandardText size="xs" colorScheme="neutral" className="mt-1">
                                    {selectedIds.size} jardín(es) seleccionado(s) en versión {version}
                                </StandardText>
                            </div>
                        )}
                    </div>
                </StandardCard.Content>
            </StandardCard>

            {/* Lista de jardines */}
            <StandardCard>
                <StandardCard.Content>
                    <div className="space-y-2">
                        <StandardText weight="semibold" size="sm">
                            <Sprout className="inline h-4 w-4 mr-1" />
                            Jardines disponibles ({gardens.length})
                        </StandardText>

                        {gardens.length === 0 ? (
                            <div className="text-center py-8">
                                <StandardText colorScheme="neutral" size="sm">
                                    No hay jardines en este proyecto aún
                                </StandardText>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {gardens.map(garden => {
                                    const isSelected = selectedIds.has(garden.id);
                                    const isCurated = curatedSet.has(garden.id);

                                    return (
                                        <button
                                            key={garden.id}
                                            onClick={() => toggleSelection(garden.id)}
                                            disabled={isCurated}
                                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                                isCurated
                                                    ? 'border-neutral-200 bg-neutral-50 opacity-50 cursor-not-allowed'
                                                    : isSelected
                                                    ? 'border-accent-500 bg-accent-50'
                                                    : 'border-neutral-200 hover:border-accent-300'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-lg">{garden.emoji}</span>
                                                        <StandardText weight="semibold" size="sm" className="truncate">
                                                            {garden.name}
                                                        </StandardText>
                                                    </div>
                                                    {garden.description && (
                                                        <StandardText size="xs" colorScheme="neutral" className="line-clamp-2">
                                                            {garden.description}
                                                        </StandardText>
                                                    )}
                                                    <div className="flex gap-2 mt-2">
                                                        {garden.elements_count !== undefined && (
                                                            <StandardBadge colorScheme="neutral" size="sm">
                                                                {garden.elements_count} elementos
                                                            </StandardBadge>
                                                        )}
                                                        {garden.artifacts_count !== undefined && (
                                                            <StandardBadge colorScheme="neutral" size="sm">
                                                                {garden.artifacts_count} artefactos
                                                            </StandardBadge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {isCurated ? (
                                                        <StandardBadge colorScheme="neutral" size="sm">
                                                            Ya agregado
                                                        </StandardBadge>
                                                    ) : isSelected ? (
                                                        <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center">
                                                            <Check className="h-4 w-4 text-white" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full border-2 border-neutral-300" />
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </StandardCard.Content>
            </StandardCard>

            {/* Botones de acción */}
            <div className="flex gap-2 justify-end">
                <StandardButton
                    onClick={onCancel}
                    colorScheme="neutral"
                    styleType="outline"
                >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                </StandardButton>
                <StandardButton
                    onClick={handleConfirm}
                    colorScheme="accent"
                    disabled={selectedIds.size === 0}
                >
                    <Check className="h-4 w-4 mr-1" />
                    Agregar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                </StandardButton>
            </div>
        </div>
    );
}
