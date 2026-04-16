"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ExternalLink, Clock, Plus, X, Trash2, Sprout, RefreshCw } from "lucide-react";
import { StandardPageTitle } from '@/components/ui/StandardPageTitle';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardText } from '@/components/ui/StandardText';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardBadge } from '@/components/ui/StandardBadge';
import { StandardTooltip } from '@/components/ui/StandardTooltip';
import { StandardPagination } from "@/components/ui/StandardPagination";
import { StandardCheckbox } from "@/components/ui/StandardCheckbox";
import { StandardInput } from "@/components/ui/StandardInput";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { useAuth } from "@/app/auth-provider";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
    getGardenById,
    getArtifactsForGarden,
    addElementToGarden,
    removeElementFromGarden,
    deleteGarden,
    getArtifactTokens,
    type ResonanceGarden,
    type GardenArtifact,
    type GardenElement,
    type GardenElementType,
    type GardenTokenBreakdown,
} from "@/lib/actions/cognetica-gardens-actions";
import {
    getCognitiveElementsForProject,
    type CognitiveElements,
} from "@/lib/actions/cognetica-filters-actions";

const TYPE_META: Record<GardenElementType, { emoji: string; label: string; colorScheme: "accent" | "primary" | "secondary" | "tertiary" }> = {
    seed:       { emoji: "🌱", label: "Semilla",    colorScheme: "accent" },
    discipline: { emoji: "🔬", label: "Disciplina", colorScheme: "primary" },
    theory:     { emoji: "💡", label: "Teoría",     colorScheme: "secondary" },
    thinker:    { emoji: "👤", label: "Pensador",   colorScheme: "tertiary" },
};

const TYPE_EMOJI: Record<string, string> = {
    audio: "🎙️", video: "🎬", markdown: "📝",
    pdf_report: "📊", pdf_slides: "📽️", image: "🖼️",
};

function formatDate(d: string | null): string {
    if (!d) return "—";
    try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: es }); }
    catch { return "—"; }
}

function RelevanceBar({ score }: { score: number }) {
    const pct = Math.round(score * 100);
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-accent-400 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs text-neutral-400 w-8 text-right">{pct}%</span>
        </div>
    );
}

export default function GardenDetailPage() {
    const router = useRouter();
    const params = useParams();
    const gardenId = Array.isArray(params.gardenId) ? params.gardenId[0] : params.gardenId;
    const auth = useAuth();
    const [garden, setGarden] = useState<ResonanceGarden | null>(null);
    const [loadingGarden, setLoadingGarden] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [artifacts, setArtifacts] = useState<GardenArtifact[]>([]);
    const [loadingArtifacts, setLoadingArtifacts] = useState(false);
    const [refreshingArtifacts, setRefreshingArtifacts] = useState(false);
    const [previousArtifactCount, setPreviousArtifactCount] = useState(0);
    const [artifactTokens, setArtifactTokens] = useState<Record<string, {
        transcripcion: number;
        ensayo_destilado: number;
        elementos_cognitivos: number;
        datos_cronologicos: number;
        metabolizacion_micelio: number;
        chat_calibrador: number;
        total: number;
        detalles: {
            transcripcion_fuente: string;
            transcripcion_preview: string;
            ensayo_destilado_preview: string;
            elementos_preview: string[];
            cronologicos_preview: string;
            micelio_partes: { nombre: string; preview: string }[];
            chat_preview: string;
        };
    }>>({});
    const [calculatingTokens, setCalculatingTokens] = useState(false);
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [activeTab, setActiveTab] = useState<GardenElementType>('seed');
    const [searchQuery, setSearchQuery] = useState('');
    const [availableElements, setAvailableElements] = useState<CognitiveElements | null>(null);
    const [loadingElements, setLoadingElements] = useState(false);
    const [loadingAvailable, setLoadingAvailable] = useState(false);
    const [addingElement, setAddingElement] = useState<string | null>(null);
    const [removingElement, setRemovingElement] = useState<string | null>(null);
    
    // Estados para filtro de tipos de archivo
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    
    // Estados para paginación de artefactos
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filtrar artefactos por tipo si hay filtros activos
    const filteredArtifacts = selectedTypes.length > 0
        ? artifacts.filter(a => selectedTypes.includes(a.type))
        : artifacts;
    
    // Lógica de paginación
    const totalPages = Math.ceil(filteredArtifacts.length / itemsPerPage);
    const paginatedArtifacts = filteredArtifacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleTypeToggle = (type: string) => {
        setSelectedTypes(prev => 
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
        setCurrentPage(1);
    };

    const projectId = auth.proyectoActual?.id;

    const loadGarden = useCallback(async () => {
        setLoadingGarden(true);
        const result = await getGardenById(gardenId);
        console.log('🔍 [loadGarden] Result:', { success: result.success, data: result.data });
        if (result.success && result.data) {
            console.log('🌱 [loadGarden] Garden loaded:', { 
                id: result.data.id, 
                name: result.data.name, 
                elementsCount: result.data.elements?.length || 0,
                elements: result.data.elements
            });
            setGarden(result.data);
        } else {
            setError(result.error || "Jardín no encontrado");
        }
        setLoadingGarden(false);
    }, [gardenId]);

    const loadArtifacts = useCallback(async (isRefresh = false) => {
        if (!projectId) return;
        
        if (isRefresh) {
            setRefreshingArtifacts(true);
        } else {
            setLoadingArtifacts(true);
        }
        
        const result = await getArtifactsForGarden(gardenId, projectId);
        if (result.success && result.data) {
            setArtifacts(result.data);
        }
        
        if (isRefresh) {
            setRefreshingArtifacts(false);
        } else {
            setLoadingArtifacts(false);
        }
    }, [gardenId, projectId]);

    const calculateTokensProgressively = useCallback(async () => {
        if (artifacts.length === 0) return;
        
        setCalculatingTokens(true);
        const tokensMap: Record<string, any> = {};

        for (let i = 0; i < artifacts.length; i++) {
            const artifact = artifacts[i];
            const result = await getArtifactTokens(artifact.id);
            
            if (result.success && result.data) {
                tokensMap[artifact.id] = result.data;
                // Actualizar estado progresivamente
                setArtifactTokens({ ...tokensMap });
            }
        }
        
        setCalculatingTokens(false);
    }, [artifacts]);

    useEffect(() => { loadGarden(); }, [loadGarden]);
    useEffect(() => { 
        if (garden) {
            loadArtifacts();
            setPreviousArtifactCount(0);
        }
    }, [garden, loadArtifacts]);

    // Calcular tokens progresivamente después de cargar artefactos
    useEffect(() => {
        if (artifacts.length > 0 && !loadingArtifacts && !refreshingArtifacts) {
            calculateTokensProgressively();
        }
    }, [artifacts.length, loadingArtifacts, refreshingArtifacts, calculateTokensProgressively]);

    const loadAvailable = useCallback(async () => {
        if (!projectId || availableElements) return;
        setLoadingAvailable(true);
        const result = await getCognitiveElementsForProject(projectId);
        if (result.success && result.data) setAvailableElements(result.data);
        setLoadingAvailable(false);
    }, [projectId, availableElements]);

    useEffect(() => {
        if (showAddPanel) loadAvailable();
    }, [showAddPanel, loadAvailable]);

    const isAlreadyInGarden = (type: GardenElementType, value: string): boolean => {
        return (garden?.elements || []).some(el =>
            el.element_type === type &&
            (type === 'seed' ? el.element_content === value : el.element_id === value)
        );
    };

    const handleAddElement = async (el: {
        element_type: GardenElementType;
        element_id?: string;
        element_content?: string;
        element_label: string;
    }) => {
        const key = el.element_type === 'seed' ? (el.element_content || '') : (el.element_id || '');
        
        if (!key) {
            toast.error('Error: elemento sin identificador');
            return;
        }
        
        setAddingElement(key);
        console.log('🌱 [handleAddElement] Agregando elemento:', { gardenId, element: el });
        
        const result = await addElementToGarden(gardenId, el);
        
        console.log('🌱 [handleAddElement] Resultado:', result);
        
        if (result.success && result.data) {
            setGarden(prev => prev ? {
                ...prev,
                elements: [...(prev.elements || []), result.data!],
            } : prev);
            toast.success(`✅ ${TYPE_META[el.element_type].emoji} ${el.element_label} agregado`);
            loadArtifacts();
        } else {
            toast.error(`Error al agregar elemento: ${result.error || 'Desconocido'}`);
        }
        
        setAddingElement(null);
    };

    const handleRemoveElement = async (elementId: string) => {
        setRemovingElement(elementId);
        const result = await removeElementFromGarden(elementId);
        if (result.success) {
            setGarden(prev => prev ? {
                ...prev,
                elements: (prev.elements || []).filter((e: GardenElement) => e.id !== elementId),
            } : prev);
            loadArtifacts();
        }
        setRemovingElement(null);
    };

    const handleRefreshArtifacts = async () => {
        const previousCount = artifacts.length;
        setPreviousArtifactCount(previousCount);
        await loadArtifacts(true);
        
        // Mostrar feedback después de actualizar
        setTimeout(() => {
            const newCount = artifacts.length;
            const diff = newCount - previousCount;
            
            if (diff > 0) {
                toast.success(`✨ Se encontraron ${diff} artefacto${diff !== 1 ? 's' : ''} nuevo${diff !== 1 ? 's' : ''}`, {
                    description: `Total: ${newCount} artefactos resonantes`,
                    duration: 4000,
                });
            } else if (diff < 0) {
                toast.info('🔄 Lista actualizada', {
                    description: `Total: ${newCount} artefactos`,
                    duration: 3000,
                });
            } else {
                toast.info('✓ Lista actualizada', {
                    description: 'No hay cambios en los artefactos',
                    duration: 3000,
                });
            }
        }, 100);
    };

    const handleDeleteGarden = async () => {
        if (!garden) return;
        if (!confirm(`¿Eliminar el jardín "${garden.name}"? Esta acción no se puede deshacer.`)) return;
        const result = await deleteGarden(gardenId);
        if (result.success) router.push('/cognetica/jardines');
    };

    const filteredOptions = (() => {
        if (!availableElements) return [];
        const q = searchQuery.toLowerCase();
        switch (activeTab) {
            case 'seed':
                return availableElements.seeds
                    .filter(s => s.content.toLowerCase().includes(q))
                    .map(s => ({ element_type: 'seed' as GardenElementType, element_content: s.content, element_label: s.content, count: s.count }));
            case 'discipline':
                return availableElements.disciplines
                    .filter(d => d.name.toLowerCase().includes(q))
                    .map(d => ({ element_type: 'discipline' as GardenElementType, element_id: d.id, element_label: d.name, count: d.count }));
            case 'theory':
                return availableElements.theories
                    .filter(t => t.name.toLowerCase().includes(q))
                    .map(t => ({ element_type: 'theory' as GardenElementType, element_id: t.id, element_label: t.name, count: t.count }));
            case 'thinker':
                return availableElements.thinkers
                    .filter(t => t.name.toLowerCase().includes(q))
                    .map(t => ({ element_type: 'thinker' as GardenElementType, element_id: t.id, element_label: t.name, count: t.count }));
            default: return [];
        }
    })();

    if (loadingGarden) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
                <div className="h-12 bg-neutral-100 rounded-xl animate-pulse" />
                <div className="h-32 bg-neutral-100 rounded-xl animate-pulse" />
            </div>
        );
    }

    if (error || !garden) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <StandardText colorScheme="danger">{error || "Jardín no encontrado"}</StandardText>
                <StandardButton onClick={() => router.push('/cognetica/jardines')} className="mt-4">← Volver</StandardButton>
            </div>
        );
    }

    const elements = garden.elements || [];

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            {/* PageTitle con estándar de la aplicación */}
            <StandardPageTitle
                title={garden.name}
                subtitle={garden.description || "Jardín de resonancia cognitiva"}
                mainIcon={() => <span className="text-4xl leading-none">{garden.emoji}</span>}
                breadcrumbs={[
                    { label: "Cognetica", href: "/cognetica" },
                    { label: "Jardines", href: "/cognetica/jardines" },
                    { label: garden.name }
                ]}
                actions={
                    <div className="flex items-center gap-2">
                        <StandardButton 
                            size="sm" 
                            styleType="outline" 
                            colorScheme="danger" 
                            leftIcon={Trash2} 
                            onClick={handleDeleteGarden}
                        >
                            Eliminar
                        </StandardButton>
                    </div>
                }
                description={`Creado ${formatDate(garden.created_at)}`}
            />

            {/* Elementos del jardín */}
            <StandardCard colorScheme="neutral">
                <StandardCard.Content className="space-y-3">
                    <div className="flex items-center justify-between">
                        <StandardText size="sm" className="font-medium">
                            Elementos del jardín
                            {elements.length > 0 && (
                                <span className="ml-2 text-neutral-400 font-normal">({elements.length})</span>
                            )}
                        </StandardText>
                        <StandardButton
                            size="xs"
                            colorScheme="accent"
                            styleType={showAddPanel ? "subtle" : "outline"}
                            leftIcon={Plus}
                            onClick={() => setShowAddPanel(v => !v)}
                        >
                            Agregar elemento
                        </StandardButton>
                    </div>

                    {elements.length === 0 && !showAddPanel && (
                        <StandardText size="sm" colorScheme="neutral" className="text-center py-3">
                            Sin elementos. Agrega semillas, disciplinas, teorías o pensadores.
                        </StandardText>
                    )}

                    {elements.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {elements.map((el: GardenElement) => {
                                const meta = TYPE_META[el.element_type];
                                return (
                                    <span key={el.id} className="inline-flex items-center gap-1">
                                        <StandardBadge colorScheme={meta.colorScheme} styleType="subtle" size="sm">
                                            {meta.emoji} {el.element_label}
                                        </StandardBadge>
                                        <button
                                            onClick={() => handleRemoveElement(el.id)}
                                            disabled={removingElement === el.id}
                                            className="text-neutral-300 hover:text-danger transition-colors disabled:opacity-50"
                                            title="Quitar del jardín"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* Panel de agregar elementos */}
                    {showAddPanel && (
                        <div className="border-t border-border pt-4 space-y-3">
                            {/* Tabs */}
                            <div className="flex gap-1 border-b border-border">
                                {(Object.keys(TYPE_META) as GardenElementType[]).map(type => {
                                    const meta = TYPE_META[type];
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => { setActiveTab(type); setSearchQuery(""); }}
                                            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                                                activeTab === type
                                                    ? 'border-accent-500 text-accent-600'
                                                    : 'border-transparent text-neutral-500 hover:text-foreground'
                                            }`}
                                        >
                                            {meta.emoji} {meta.label}s
                                        </button>
                                    );
                                })}
                            </div>
                            <StandardInput
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Buscar ${TYPE_META[activeTab].label.toLowerCase()}s...`}
                                colorScheme="neutral"
                                size="sm"
                            />
                            {loadingAvailable ? (
                                <div className="space-y-1">
                                    {[1, 2, 3].map(i => <div key={i} className="h-7 bg-neutral-100 rounded animate-pulse" />)}
                                </div>
                            ) : (
                                <div className="max-h-48 overflow-y-auto space-y-1">
                                    {filteredOptions.map((opt, idx) => {
                                        const key = opt.element_type === 'seed' 
                                            ? ('element_content' in opt ? opt.element_content : '')
                                            : ('element_id' in opt ? opt.element_id : '');
                                        const inGarden = isAlreadyInGarden(opt.element_type, key);
                                        const isAdding = addingElement === key;
                                        return (
                                            <button
                                                key={idx}
                                                disabled={inGarden || isAdding}
                                                onClick={() => handleAddElement({
                                                    element_type: opt.element_type,
                                                    element_id: 'element_id' in opt ? opt.element_id : undefined,
                                                    element_content: 'element_content' in opt ? opt.element_content : undefined,
                                                    element_label: opt.element_label,
                                                })}
                                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs text-left transition-colors ${
                                                    inGarden
                                                        ? 'text-neutral-400 cursor-default'
                                                        : 'hover:bg-neutral-50 text-foreground'
                                                }`}
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    <span>{TYPE_META[opt.element_type].emoji}</span>
                                                    <span className="line-clamp-1">{opt.element_label}</span>
                                                </span>
                                                <span className="flex items-center gap-1.5 flex-shrink-0">
                                                    <span className="text-neutral-400">{opt.count} art.</span>
                                                    {inGarden ? (
                                                        <span className="text-accent-500 font-bold">✓</span>
                                                    ) : isAdding ? (
                                                        <span className="text-neutral-400">...</span>
                                                    ) : (
                                                        <Plus className="h-3 w-3 text-neutral-300" />
                                                    )}
                                                </span>
                                            </button>
                                        );
                                    })}
                                    {filteredOptions.length === 0 && (
                                        <StandardText size="xs" colorScheme="neutral" className="text-center py-2">
                                            Sin resultados
                                        </StandardText>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </StandardCard.Content>
            </StandardCard>

            {/* Artefactos del jardín */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <Sprout className="h-4 w-4 text-accent-500" />
                        Artefactos resonantes
                        {!loadingArtifacts && (
                            <span className="text-sm font-normal text-neutral-400">
                                ({filteredArtifacts.length}{selectedTypes.length > 0 ? ` de ${artifacts.length}` : ''})
                            </span>
                        )}
                    </h2>
                    <div className="flex items-center gap-2">
                        {elements.length > 0 && !loadingArtifacts && (
                            <StandardButton
                                size="xs"
                                styleType="outline"
                                colorScheme="primary"
                                leftIcon={RefreshCw}
                                onClick={handleRefreshArtifacts}
                                disabled={refreshingArtifacts}
                                className={refreshingArtifacts ? 'animate-spin' : ''}
                            >
                                {refreshingArtifacts ? 'Actualizando...' : 'Actualizar'}
                            </StandardButton>
                        )}
                        {elements.length > 0 && !refreshingArtifacts && (
                            <StandardText size="xs" colorScheme="neutral">
                                Ordenados por relevancia
                            </StandardText>
                        )}
                    </div>
                </div>

                {/* Filtros de tipos de archivo */}
                {!loadingArtifacts && artifacts.length > 0 && (
                    <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
                        <div className="flex flex-wrap items-center gap-2">
                            <StandardText size="xs" weight="medium" colorScheme="neutral" className="mr-1">
                                Tipos:
                            </StandardText>
                            <StandardCheckbox
                                label="🎙️ Audio"
                                checked={selectedTypes.includes('audio')}
                                onChange={() => handleTypeToggle('audio')}
                                size="sm"
                            />
                            <StandardCheckbox
                                label="🎬 Video"
                                checked={selectedTypes.includes('video')}
                                onChange={() => handleTypeToggle('video')}
                                size="sm"
                            />
                            <StandardCheckbox
                                label="📊 PDF"
                                checked={selectedTypes.includes('pdf_report')}
                                onChange={() => handleTypeToggle('pdf_report')}
                                size="sm"
                            />
                            <StandardCheckbox
                                label="📽️ Slides"
                                checked={selectedTypes.includes('pdf_slides')}
                                onChange={() => handleTypeToggle('pdf_slides')}
                                size="sm"
                            />
                            <StandardCheckbox
                                label="📝 MD"
                                checked={selectedTypes.includes('markdown')}
                                onChange={() => handleTypeToggle('markdown')}
                                size="sm"
                            />
                            <StandardCheckbox
                                label="🖼️ Img"
                                checked={selectedTypes.includes('image')}
                                onChange={() => handleTypeToggle('image')}
                                size="sm"
                            />
                        </div>
                    </div>
                )}

                {loadingArtifacts && (
                    <div className="flex items-center justify-center py-12">
                        <SustratoLoadingLogo 
                            size={48}
                            variant="spin-pulse"
                            speed="normal"
                            showText={true}
                            text="Cargando artefactos..."
                            breathingEffect={true}
                            colorTransition={true}
                        />
                    </div>
                )}

                {!loadingArtifacts && elements.length === 0 && (
                    <StandardCard colorScheme="neutral">
                        <StandardCard.Content>
                            <div className="text-center py-6">
                                <span className="text-4xl block mb-2">🌱</span>
                                <StandardText colorScheme="neutral" size="sm">
                                    Agrega elementos al jardín para ver los artefactos resonantes.
                                </StandardText>
                            </div>
                        </StandardCard.Content>
                    </StandardCard>
                )}

                {!loadingArtifacts && elements.length > 0 && artifacts.length === 0 && (
                    <StandardCard colorScheme="neutral">
                        <StandardCard.Content>
                            <div className="text-center py-6">
                                <span className="text-4xl block mb-2">🔍</span>
                                <StandardText colorScheme="neutral" size="sm">
                                    Ningún artefacto contiene estos elementos aún.
                                </StandardText>
                            </div>
                        </StandardCard.Content>
                    </StandardCard>
                )}

                {!loadingArtifacts && artifacts.length > 0 && (
                    <StandardCard colorScheme="neutral">
                        <StandardCard.Content className="p-0">
                            <div className="divide-y divide-border">
                                {paginatedArtifacts.map((artifact, idx) => (
                                    <div
                                        key={artifact.id}
                                        className={`p-4 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-tertiary/5'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl leading-none flex-shrink-0 mt-0.5">
                                                {TYPE_EMOJI[artifact.type] || "📄"}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <button
                                                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left line-clamp-1 w-full"
                                                    onClick={() => router.push(`/cognetica/${artifact.id}`)}
                                                >
                                                    {artifact.title}
                                                </button>

                                                {/* Relevancia */}
                                                <div className="mt-1.5">
                                                    <RelevanceBar score={artifact.relevance_score} />
                                                </div>

                                                {/* Elementos que coinciden */}
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {artifact.matched_elements.map((label, i) => {
                                                        const el = elements.find((e: GardenElement) => e.element_label === label);
                                                        const meta = el ? TYPE_META[el.element_type] : TYPE_META.seed;
                                                        return (
                                                            <span key={i} className="text-xs bg-accent-50 text-accent-700 border border-accent-200 rounded px-1.5 py-0.5">
                                                                {meta.emoji} {label}
                                                            </span>
                                                        );
                                                    })}
                                                </div>

                                                {/* Meta */}
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    <span className="flex items-center gap-1 text-xs text-neutral-400">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDate(artifact.created_at)}
                                                    </span>
                                                    <StandardBadge
                                                        colorScheme={
                                                            artifact.status === "completed" ? "success" :
                                                            artifact.status === "error" ? "danger" : "warning"
                                                        }
                                                        size="xs"
                                                    >
                                                        {artifact.status === "completed" ? "Procesado" :
                                                         artifact.status === "error" ? "Error" : "Pendiente"}
                                                    </StandardBadge>
                                                    {artifact.has_chronicle && <span title="Micelio" className="text-sm">🍄</span>}
                                                    {artifact.has_chat && <span title="Chat Quipu" className="text-sm">🪢</span>}
                                                </div>

                                                {/* Desglose de Tokens */}
                                                {artifactTokens[artifact.id] && (
                                                    <div className="mt-2 p-2 bg-primary-50 border border-primary-200 rounded-md">
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <StandardTooltip
                                                                trigger={
                                                                    <div className="cursor-help">
                                                                        <span className="text-neutral-600">📝 Transcripción:</span>
                                                                        <span className="ml-1 font-semibold text-primary-700">
                                                                            {artifactTokens[artifact.id].transcripcion.toLocaleString('es-ES')}
                                                                        </span>
                                                                    </div>
                                                                }
                                                                content={`*Fuente:* ${artifactTokens[artifact.id].detalles.transcripcion_fuente}\n\n*Preview:*\n${artifactTokens[artifact.id].detalles.transcripcion_preview}`}
                                                                colorScheme="primary"
                                                            />
                                                            {artifactTokens[artifact.id].ensayo_destilado > 0 && (
                                                                <StandardTooltip
                                                                    trigger={
                                                                        <div className="cursor-help">
                                                                            <span className="text-neutral-600">📖 Ensayo:</span>
                                                                            <span className="ml-1 font-semibold text-primary-600">
                                                                                {artifactTokens[artifact.id].ensayo_destilado.toLocaleString('es-ES')}
                                                                            </span>
                                                                        </div>
                                                                    }
                                                                    content={`*Ensayo Destilado* (~10k tokens)\n\n*Preview:*\n${artifactTokens[artifact.id].detalles.ensayo_destilado_preview}`}
                                                                    colorScheme="primary"
                                                                />
                                                            )}
                                                            <StandardTooltip
                                                                trigger={
                                                                    <div className="cursor-help">
                                                                        <span className="text-neutral-600">🧠 Cognitivos:</span>
                                                                        <span className="ml-1 font-semibold text-secondary-700">
                                                                            {artifactTokens[artifact.id].elementos_cognitivos.toLocaleString('es-ES')}
                                                                        </span>
                                                                    </div>
                                                                }
                                                                content={artifactTokens[artifact.id].detalles.elementos_preview.length > 0 ? artifactTokens[artifact.id].detalles.elementos_preview.join('\n') : 'No hay elementos cognitivos'}
                                                                colorScheme="secondary"
                                                            />
                                                            {artifactTokens[artifact.id].datos_cronologicos > 0 && (
                                                                <StandardTooltip
                                                                    trigger={
                                                                        <div className="cursor-help">
                                                                            <span className="text-neutral-600">📅 Cronológicos:</span>
                                                                            <span className="ml-1 font-semibold text-accent-600">
                                                                                {artifactTokens[artifact.id].datos_cronologicos.toLocaleString('es-ES')}
                                                                            </span>
                                                                        </div>
                                                                    }
                                                                    content={artifactTokens[artifact.id].detalles.cronologicos_preview || 'No hay datos cronológicos'}
                                                                    colorScheme="accent"
                                                                />
                                                            )}
                                                            <StandardTooltip
                                                                trigger={
                                                                    <div className="cursor-help">
                                                                        <span className="text-neutral-600">🍄 Micelio:</span>
                                                                        <span className="ml-1 font-semibold text-accent-700">
                                                                            {artifactTokens[artifact.id].metabolizacion_micelio.toLocaleString('es-ES')}
                                                                        </span>
                                                                    </div>
                                                                }
                                                                content={artifactTokens[artifact.id].detalles.micelio_partes.length > 0 ? artifactTokens[artifact.id].detalles.micelio_partes.map(p => `*${p.nombre}:*\n${p.preview}`).join('\n\n') : 'No hay metabolización micelio'}
                                                                colorScheme="accent"
                                                            />
                                                            <StandardTooltip
                                                                trigger={
                                                                    <div className="cursor-help">
                                                                        <span className="text-neutral-600">💬 Chat:</span>
                                                                        <span className="ml-1 font-semibold text-tertiary-700">
                                                                            {artifactTokens[artifact.id].chat_calibrador.toLocaleString('es-ES')}
                                                                        </span>
                                                                    </div>
                                                                }
                                                                content={artifactTokens[artifact.id].detalles.chat_preview || 'No hay chat calibrador'}
                                                                colorScheme="tertiary"
                                                            />
                                                        </div>
                                                        <div className="mt-1.5 pt-1.5 border-t border-primary-300">
                                                            <span className="text-neutral-600 font-medium">Total:</span>
                                                            <span className="ml-1 font-bold text-primary-800">
                                                                {artifactTokens[artifact.id].total.toLocaleString('es-ES')} tokens
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {!artifactTokens[artifact.id] && calculatingTokens && (
                                                    <div className="mt-2 p-2 bg-neutral-50 border border-neutral-200 rounded-md">
                                                        <span className="text-xs text-neutral-500">⏳ Calculando tokens...</span>
                                                    </div>
                                                )}

                                                {/* Destilada micelio */}
                                                {artifact.micelio_destilada && (
                                                    <p className="mt-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md p-2 leading-relaxed line-clamp-2">
                                                        {artifact.micelio_destilada}
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => router.push(`/cognetica/${artifact.id}`)}
                                                className="flex-shrink-0 p-1.5 rounded text-neutral-300 hover:text-primary hover:bg-neutral-100 transition-colors"
                                                title="Ir al artefacto"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </StandardCard.Content>
                    </StandardCard>
                )}
                
                {/* Paginación de artefactos */}
                {!loadingArtifacts && artifacts.length > 0 && totalPages > 1 && (
                    <div className="flex justify-center pt-4 border-t">
                        <StandardPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            itemsPerPage={itemsPerPage}
                            totalItems={artifacts.length}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
