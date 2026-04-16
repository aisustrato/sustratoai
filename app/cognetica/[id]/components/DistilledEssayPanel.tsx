"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardMarkdownViewer } from "@/components/ui/StandardMarkdownViewer";
import { StandardProgressBar } from "@/components/ui/StandardProgressBar";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { BookOpen, Sparkles, Download, Expand, Loader2, CheckCircle, Trash2, Eraser, Users, Calendar, Edit3, Save, X, AlertTriangle, History } from "lucide-react";
import { toast } from "sonner";
import { deleteDistilledEssay, deleteCognitiveElements } from "@/lib/actions/cognetica-distillation-actions";
import { deleteLightweightElements } from "@/lib/actions/cognetica-lightweight-extraction-actions";
import { saveManualEssayEdit, getEssayVersionHistory, type EssayVersionHistoryItem } from "@/lib/actions/cognetica-essay-edit-actions";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardNote } from "@/components/ui/StandardNote";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";

interface DistilledEssayPanelProps {
    artifactId: string;
    artifactTitle: string;
}

interface ProcessingStep {
    id: string;
    label: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
}

export function DistilledEssayPanel({ artifactId, artifactTitle }: DistilledEssayPanelProps) {
    const router = useRouter();
    const [essay, setEssay] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [expandAll, setExpandAll] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);
    const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
    const [currentStep, setCurrentStep] = useState<string>('');
    const [progress, setProgress] = useState(0);
    const [extractingLightweight, setExtractingLightweight] = useState(false);
    const [extractingCognitive, setExtractingCognitive] = useState(false);
    const [deletingLightweight, setDeletingLightweight] = useState(false);
    
    // Estados para edición manual
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editedContent, setEditedContent] = useState("");
    const [editReason, setEditReason] = useState("");
    const [changesSummary, setChangesSummary] = useState("");
    const [saving, setSaving] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<EssayVersionHistoryItem[]>([]);
    const [currentVersion, setCurrentVersion] = useState<number>(0);

    // 🔍 LOG: Diagnóstico del tamaño del dialog
    useEffect(() => {
        if (showEditDialog) {
            console.log('🔍 [DistilledEssayPanel] Dialog abierto - iniciando diagnóstico de tamaño');
            console.log('🔍 [DistilledEssayPanel] Viewport:', {
                width: window.innerWidth,
                height: window.innerHeight
            });
            
            // Esperar a que el dialog se renderice
            setTimeout(() => {
                const dialogElement = document.querySelector('.dialog-modal');
                if (dialogElement) {
                    const rect = dialogElement.getBoundingClientRect();
                    const computedStyles = window.getComputedStyle(dialogElement);
                    
                    console.log('🔍 [DistilledEssayPanel] Dialog renderizado:', {
                        width: rect.width,
                        height: rect.height,
                        percentageOfViewportWidth: ((rect.width / window.innerWidth) * 100).toFixed(1) + '%',
                        percentageOfViewportHeight: ((rect.height / window.innerHeight) * 100).toFixed(1) + '%',
                        computedStyles: {
                            maxWidth: computedStyles.maxWidth,
                            maxHeight: computedStyles.maxHeight,
                            width: computedStyles.width,
                            height: computedStyles.height,
                        }
                    });
                    
                    // 🔍 Verificar clases aplicadas
                    console.log('🔍 [DistilledEssayPanel] Clases CSS aplicadas:', dialogElement.className);
                    
                    // 🔍 Buscar si hay otros dialogs o elementos que puedan interferir
                    const allDialogs = document.querySelectorAll('[role="dialog"]');
                    console.log('🔍 [DistilledEssayPanel] Total de dialogs en DOM:', allDialogs.length);
                    
                    // 🔍 Verificar si el tamaño 'full' se aplicó correctamente
                    const hasFullSizeClass = dialogElement.className.includes('w-[95vw]');
                    console.log('🔍 [DistilledEssayPanel] ¿Tiene clase w-[95vw]?:', hasFullSizeClass);
                    
                    if (!hasFullSizeClass) {
                        console.error('❌ [DistilledEssayPanel] ERROR: La clase w-[95vw] NO se aplicó. El tamaño "full" no está funcionando.');
                        console.error('❌ [DistilledEssayPanel] Clases actuales:', dialogElement.className);
                    }
                } else {
                    console.warn('⚠️ [DistilledEssayPanel] No se encontró el elemento .dialog-modal');
                }
            }, 100);
        }
    }, [showEditDialog]);

    useEffect(() => {
        loadEssay();
    }, [artifactId]);

    const loadEssay = async () => {
        if (hasChecked) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/api/cognetica/distilled-essay?artifactId=${artifactId}`);
            const result = await response.json();

            if (result.success && result.data?.essay) {
                setEssay(result.data.essay);
                setMetadata(result.data.metadata);
            }
        } catch (error) {
            console.error('Error cargando ensayo destilado:', error);
        } finally {
            setLoading(false);
            setHasChecked(true);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de borrar el ensayo destilado y los elementos cognitivos? Esta acción no se puede deshacer.')) {
            return;
        }

        setLoading(true);
        try {
            const result = await deleteDistilledEssay(artifactId);
            
            if (result.success) {
                setEssay(null);
                setMetadata(null);
                toast.success('Ensayo y elementos cognitivos borrados exitosamente');
            } else {
                toast.error(result.error || 'Error borrando ensayo');
            }
        } catch (error) {
            console.error('Error borrando ensayo:', error);
            toast.error('Error al borrar el ensayo');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCognitiveElements = async () => {
        if (!confirm('¿Estás seguro de borrar SOLO los elementos cognitivos (semillas, disciplinas, pensadores)? El ensayo NO se borrará. Esta acción no se puede deshacer.')) {
            return;
        }

        setLoading(true);
        try {
            const result = await deleteCognitiveElements(artifactId);
            
            if (result.success && result.data) {
                const { seedsDeleted, disciplinesDeleted, referencesDeleted } = result.data;
                toast.success(
                    `Elementos cognitivos borrados: ${seedsDeleted} semillas, ${disciplinesDeleted} disciplinas, ${referencesDeleted} pensadores`
                );
            } else {
                toast.error(result.error || 'Error borrando elementos cognitivos');
            }
        } catch (error) {
            console.error('Error borrando elementos cognitivos:', error);
            toast.error('Error al borrar elementos cognitivos');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLightweight = async () => {
        if (!confirm('¿Estás seguro de borrar TODOS los pensadores y datos cronológicos de este artefacto? Esta acción no se puede deshacer.')) {
            return;
        }

        setDeletingLightweight(true);
        try {
            const result = await deleteLightweightElements(artifactId);
            
            if (result.success && result.data) {
                toast.success(
                    `Borrados: ${result.data.thinker_relations_deleted} pensadores, ${result.data.chronological_data_deleted} datos cronológicos`
                );
                router.refresh();
            } else {
                toast.error(result.error || 'Error borrando pensadores y datos cronológicos');
            }
        } catch (error) {
            console.error('Error borrando elementos ligeros:', error);
            toast.error('Error al borrar pensadores y datos cronológicos');
        } finally {
            setDeletingLightweight(false);
        }
    };

    const handleExtractLightweight = async () => {
        setExtractingLightweight(true);
        try {
            toast.info('Extrayendo pensadores y datos cronológicos de la transcripción completa...');
            
            const response = await fetch('/api/cognetica/lightweight-extraction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artifactId })
            });

            const result = await response.json();

            if (result.success && result.data) {
                toast.success(
                    `Extracción completada: ${result.data.thinkers_count} pensadores, ${result.data.chronological_data_count} datos cronológicos`,
                    { duration: 5000 }
                );
                
                // Refrescar para mostrar los nuevos datos
                setTimeout(() => {
                    router.refresh();
                }, 1000);
            } else {
                toast.error(result.error || 'Error en extracción ligera');
            }
        } catch (error) {
            console.error('Error extrayendo elementos ligeros:', error);
            toast.error('Error al extraer pensadores y datos cronológicos');
        } finally {
            setExtractingLightweight(false);
        }
    };

    const handleExtractCognitive = async () => {
        if (!essay) {
            toast.error('Primero debes generar el ensayo destilado');
            return;
        }

        setExtractingCognitive(true);
        try {
            toast.info('Extrayendo elementos cognitivos profundos del ensayo destilado...');
            
            // Esta función ya existe pero está comentada en cognetica-actions.ts
            // Por ahora mostramos un mensaje
            toast.warning('Función de extracción profunda pendiente de implementar');
            
        } catch (error) {
            console.error('Error extrayendo elementos cognitivos:', error);
            toast.error('Error al extraer elementos cognitivos');
        } finally {
            setExtractingCognitive(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setProgress(0);
        
        // Inicializar pasos del proceso
        const steps: ProcessingStep[] = [
            { id: 'init', label: 'Inicializando proceso', status: 'processing' },
            { id: 'chunking', label: 'Analizando transcripción', status: 'pending' },
            { id: 'processing', label: 'Procesando con deepseek-reasoner', status: 'pending' },
            { id: 'saving', label: 'Guardando resultado', status: 'pending' }
        ];
        setProcessingSteps(steps);
        setCurrentStep('Iniciando generación de ensayo destilado...');
        
        try {
            // Paso 1: Inicialización
            setProgress(5);
            setProcessingSteps(prev => prev.map(s => 
                s.id === 'init' ? { ...s, status: 'completed' } :
                s.id === 'chunking' ? { ...s, status: 'processing' } : s
            ));
            setCurrentStep('Analizando tamaño de transcripción...');
            setProgress(10);
            
            // Simular progreso mientras el servidor procesa (esto ayuda a mostrar que está activo)
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev < 85) {
                        // Incremento muy lento para no llegar al 100% antes de tiempo
                        return prev + 1;
                    }
                    return prev;
                });
            }, 4000); // Incrementa 1% cada 4 segundos (máximo ~5 minutos para llegar a 85%)
            
            // Actualizar mensaje después de 10 segundos
            const messageTimeout1 = setTimeout(() => {
                setProcessingSteps(prev => prev.map(s => 
                    s.id === 'chunking' ? { ...s, status: 'completed' } :
                    s.id === 'processing' ? { ...s, status: 'processing' } : s
                ));
                setCurrentStep('Procesando chunks con deepseek-reasoner...');
            }, 10000);
            
            // Actualizar mensaje después de 2 minutos
            const messageTimeout2 = setTimeout(() => {
                setCurrentStep('Procesando chunks (esto puede tomar 3-5 minutos)...');
            }, 120000);
            
            // Llamar a la API (esto tomará tiempo real)
            const response = await fetch('/api/cognetica/distilled-essay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artifactId })
            });

            // Limpiar intervalos y timeouts
            clearInterval(progressInterval);
            clearTimeout(messageTimeout1);
            clearTimeout(messageTimeout2);

            console.log('📡 [Cliente] Respuesta recibida:', {
                status: response.status,
                ok: response.ok,
                statusText: response.statusText
            });

            const result = await response.json();
            
            console.log('📊 [Cliente] Resultado parseado:', {
                success: result.success,
                hasData: !!result.data,
                hasEssay: !!result.data?.essay,
                essayLength: result.data?.essay?.length,
                hasMetadata: !!result.data?.metadata,
                chunksProcessed: result.data?.metadata?.chunking_strategy?.total_chunks,
                error: result.error
            });

            if (result.success && result.data?.essay) {
                // Actualizar progreso basado en metadata real
                const totalChunks = result.data.metadata?.chunking_strategy?.total_chunks || 1;
                
                setProcessingSteps(prev => prev.map(s => 
                    s.id === 'chunking' ? { ...s, status: 'completed' } :
                    s.id === 'processing' ? { ...s, status: 'completed' } :
                    s.id === 'saving' ? { ...s, status: 'processing' } : s
                ));
                setCurrentStep(`Procesamiento completado (${totalChunks} chunk${totalChunks > 1 ? 's' : ''} procesado${totalChunks > 1 ? 's' : ''})`);
                setProgress(90);
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                setEssay(result.data.essay);
                setMetadata(result.data.metadata);
                
                setProcessingSteps(prev => prev.map(s => 
                    s.id === 'saving' ? { ...s, status: 'completed' } : s
                ));
                setProgress(100);
                setCurrentStep('¡Ensayo generado exitosamente!');
                
                toast.success('Ensayo destilado generado exitosamente', {
                    description: `${Math.round(result.data.metadata.token_count / 1000)}k tokens generados${totalChunks > 1 ? ` (${totalChunks} chunks procesados)` : ''}`
                });
                
                // Refrescar la página para mostrar los elementos cognitivos generados
                setTimeout(() => {
                    router.refresh();
                }, 1000);
            } else {
                setProcessingSteps(prev => prev.map(s => 
                    s.status === 'processing' ? { ...s, status: 'error' } : s
                ));
                setCurrentStep('Error en la generación');
                toast.error(result.error || 'Error generando ensayo destilado');
            }
        } catch (error) {
            console.error('Error generando ensayo:', error);
            setProcessingSteps(prev => prev.map(s => 
                s.status === 'processing' ? { ...s, status: 'error' } : s
            ));
            setCurrentStep('Error en la generación');
            toast.error('Error al generar el ensayo destilado');
        } finally {
            setTimeout(() => {
                setGenerating(false);
                setProcessingSteps([]);
                setProgress(0);
            }, 2000);
        }
    };

    const handleDownload = () => {
        if (!essay) return;
        
        const blob = new Blob([essay], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ensayo_destilado_${artifactTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // 🔧 Funciones para edición manual
    const handleOpenEditDialog = async () => {
        setEditedContent(essay || "");
        setEditReason("");
        setChangesSummary("");
        setShowEditDialog(true);
        
        // Cargar historial
        try {
            const result = await getEssayVersionHistory(artifactId);
            if (result.success && result.data) {
                setHistory(result.data);
                setCurrentVersion(result.data[0]?.version_number || 0);
            }
        } catch (error) {
            console.error('Error cargando historial:', error);
        }
    };

    const handleSaveManualEdit = async () => {
        if (!editReason.trim()) {
            toast.error('Debes especificar la razón de la edición');
            return;
        }

        if (editedContent === essay) {
            toast.warning('No hay cambios para guardar');
            return;
        }

        setSaving(true);
        try {
            const result = await saveManualEssayEdit({
                artifactId,
                editedContent,
                editReason: editReason.trim(),
                changesSummary: changesSummary.trim() || undefined
            });

            if (result.success && result.data) {
                toast.success(
                    `Edición guardada exitosamente`,
                    {
                        description: `Versión ${result.data.version_number} creada. Versión anterior (v${result.data.previous_version}) preservada.`
                    }
                );
                
                setShowEditDialog(false);
                setEssay(editedContent);
                router.refresh();
            } else {
                toast.error(result.error || 'Error guardando edición');
            }
        } catch (error) {
            console.error('Error guardando edición:', error);
            toast.error('Error al guardar la edición');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <StandardCard>
                <StandardCard.Content>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <StandardText className="ml-2" colorScheme="neutral">
                            Verificando ensayo destilado...
                        </StandardText>
                    </div>
                </StandardCard.Content>
            </StandardCard>
        );
    }

    if (!essay) {
        return (
            <StandardCard>
                <StandardCard.Header>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            <StandardText weight="semibold" size="lg">
                                Ensayo Destilado
                            </StandardText>
                        </div>
                        <div className="flex items-center gap-2">
                            <StandardButton
                                size="sm"
                                styleType="ghost"
                                colorScheme="warning"
                                leftIcon={Eraser}
                                onClick={handleDeleteCognitiveElements}
                                disabled={loading}
                                tooltip="Borrar elementos cognitivos existentes (semillas, disciplinas, pensadores)"
                            >
                                Limpiar Elementos
                            </StandardButton>
                        </div>
                    </div>
                </StandardCard.Header>
                
                <StandardCard.Content>
                    {generating ? (
                        <div className="py-8 space-y-6">
                            {/* Logo de carga animado */}
                            <div className="flex justify-center">
                                <SustratoLoadingLogo
                                    size={80}
                                    variant="spin-pulse"
                                    speed="normal"
                                    showText={false}
                                    breathingEffect={true}
                                    colorTransition={true}
                                />
                            </div>
                            
                            {/* Mensaje de estado actual */}
                            <div className="text-center">
                                <StandardText weight="semibold" size="lg" colorScheme="primary" className="mb-2">
                                    {currentStep}
                                </StandardText>
                                <StandardText size="sm" colorScheme="neutral" colorShade="textShade">
                                    Este proceso puede tomar 3-5 minutos para transcripciones largas.
                                </StandardText>
                                <StandardText size="xs" colorScheme="neutral" colorShade="textShade" className="mt-1">
                                    El servidor está procesando, por favor espera...
                                </StandardText>
                            </div>
                            
                            {/* Barra de progreso */}
                            <div className="max-w-md mx-auto">
                                <StandardProgressBar
                                    value={progress}
                                    max={100}
                                    colorScheme="primary"
                                    styleType="gradient"
                                    size="md"
                                    showValue={true}
                                    animated={true}
                                    celebrateOnComplete={true}
                                />
                            </div>
                            
                            {/* Lista de pasos */}
                            <div className="max-w-md mx-auto space-y-2">
                                {processingSteps.map((step) => (
                                    <div key={step.id} className="flex items-center gap-3 p-2 rounded-lg">
                                        <div className="flex-shrink-0">
                                            {step.status === 'completed' && (
                                                <CheckCircle className="w-5 h-5 text-success" />
                                            )}
                                            {step.status === 'processing' && (
                                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                            )}
                                            {step.status === 'pending' && (
                                                <div className="w-5 h-5 rounded-full border-2 border-neutral-300" />
                                            )}
                                            {step.status === 'error' && (
                                                <div className="w-5 h-5 rounded-full bg-danger" />
                                            )}
                                        </div>
                                        <StandardText
                                            size="sm"
                                            colorScheme={step.status === 'completed' ? 'success' : step.status === 'processing' ? 'primary' : 'neutral'}
                                            colorShade={step.status === 'pending' ? 'textShade' : undefined}
                                            weight={step.status === 'processing' ? 'semibold' : 'normal'}
                                        >
                                            {step.label}
                                        </StandardText>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 space-y-4">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-primary" />
                                </div>
                            </div>
                            <div>
                                <StandardText weight="semibold" size="lg" className="mb-2">
                                    Genera un Ensayo Académico Destilado
                                </StandardText>
                                <StandardText colorScheme="neutral" colorShade="textShade" className="max-w-md mx-auto">
                                    Sintetiza transcripciones largas (~100k tokens) en un ensayo académico coherente de ~10k tokens, 
                                    preservando profundidad conceptual sin diluir el contenido.
                                </StandardText>
                            </div>
                            <StandardButton
                                onClick={handleGenerate}
                                disabled={generating}
                                leftIcon={Sparkles}
                                colorScheme="primary"
                                styleType="solid"
                            >
                                Generar Ensayo Destilado
                            </StandardButton>
                            {metadata && (
                                <StandardText size="xs" colorScheme="neutral" colorShade="textShade">
                                    Última generación: {new Date(metadata.generated_at).toLocaleString('es-ES')}
                                </StandardText>
                            )}
                        </div>
                    )}
                </StandardCard.Content>
            </StandardCard>
        );
    }

    return (
        <>
            <StandardCard>
                <StandardCard.Header>
                    <div className="space-y-3">
                        {/* Línea 1: Título */}
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            <StandardText weight="semibold" size="lg">
                                Ensayo Destilado
                            </StandardText>
                            {metadata?.token_count && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 border border-primary-200">
                                    ~{Math.round(metadata.token_count / 1000)}k tokens
                                </span>
                            )}
                        </div>
                    
                    {/* Línea 2: Botones de Extracción */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <StandardButton
                            size="sm"
                            styleType="solid"
                            colorScheme="tertiary"
                            leftIcon={extractingLightweight ? Loader2 : Users}
                            onClick={handleExtractLightweight}
                            disabled={extractingLightweight || loading || deletingLightweight}
                            tooltip="Extraer pensadores y datos cronológicos de la transcripción completa (DeepSeek Chat)"
                        >
                            {extractingLightweight ? 'Extrayendo...' : 'Pensadores y Datos'}
                        </StandardButton>
                        <StandardButton
                            size="sm"
                            styleType="ghost"
                            colorScheme="warning"
                            leftIcon={deletingLightweight ? Loader2 : Eraser}
                            onClick={handleDeleteLightweight}
                            disabled={deletingLightweight || loading || extractingLightweight}
                            tooltip="Borrar pensadores y datos cronológicos (útil antes de regenerar)"
                        >
                            {deletingLightweight ? 'Borrando...' : 'Limpiar P&D'}
                        </StandardButton>
                        <StandardButton
                            size="sm"
                            styleType="solid"
                            colorScheme="accent"
                            leftIcon={extractingCognitive ? Loader2 : Sparkles}
                            onClick={handleExtractCognitive}
                            disabled={extractingCognitive || loading}
                            tooltip="Extraer elementos cognitivos profundos del ensayo destilado (semillas, disciplinas, teorías)"
                        >
                            {extractingCognitive ? 'Extrayendo...' : 'Elementos Cognitivos'}
                        </StandardButton>
                    </div>
                    
                    {/* Línea 3: Botones de Acción */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <StandardButton
                            size="sm"
                            styleType="ghost"
                            leftIcon={Expand}
                            onClick={() => setExpandAll(!expandAll)}
                        >
                            {expandAll ? 'Colapsar' : 'Expandir'}
                        </StandardButton>
                        <StandardButton
                            size="sm"
                            styleType="outline"
                            leftIcon={Download}
                            onClick={handleDownload}
                        >
                            Descargar
                        </StandardButton>
                        <StandardButton
                            size="sm"
                            styleType="outline"
                            colorScheme="accent"
                            leftIcon={Edit3}
                            onClick={handleOpenEditDialog}
                            disabled={loading}
                            tooltip="Editar ensayo manualmente (texto crudo) - Se guardará historial de versiones"
                        >
                            Editar Manualmente
                        </StandardButton>
                        <StandardButton
                            size="sm"
                            styleType="ghost"
                            colorScheme="warning"
                            leftIcon={Eraser}
                            onClick={handleDeleteCognitiveElements}
                            disabled={loading}
                            tooltip="Borrar solo elementos cognitivos (semillas, disciplinas, pensadores) - El ensayo NO se borra"
                        >
                            Limpiar Elementos
                        </StandardButton>
                        <StandardButton
                            size="sm"
                            styleType="ghost"
                            colorScheme="danger"
                            leftIcon={Trash2}
                            onClick={handleDelete}
                            disabled={loading}
                            tooltip="Borrar ensayo y elementos cognitivos (para regenerar desde cero)"
                        >
                            Borrar Todo
                        </StandardButton>
                        <StandardButton
                            size="sm"
                            styleType="ghost"
                            leftIcon={generating ? Loader2 : Sparkles}
                            onClick={handleGenerate}
                            disabled={generating}
                            tooltip="Regenerar ensayo"
                        >
                            {generating ? 'Regenerando...' : 'Regenerar'}
                        </StandardButton>
                    </div>
                </div>
            </StandardCard.Header>
            
            <StandardCard.Content>
                {metadata && (
                    <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-neutral-600">Modelo:</span>
                                <span className="ml-1 font-semibold text-primary-700">{metadata.model}</span>
                            </div>
                            <div>
                                <span className="text-neutral-600">Generado:</span>
                                <span className="ml-1 font-semibold text-primary-700">
                                    {new Date(metadata.generated_at).toLocaleDateString('es-ES')}
                                </span>
                            </div>
                            {metadata.chunking_strategy && (
                                <div>
                                    <span className="text-neutral-600">Chunks procesados:</span>
                                    <span className="ml-1 font-semibold text-primary-700">
                                        {metadata.chunking_strategy.total_chunks}
                                    </span>
                                </div>
                            )}
                            {metadata.compression_ratio && (
                                <div>
                                    <span className="text-neutral-600">Compresión:</span>
                                    <span className="ml-1 font-semibold text-primary-700">
                                        {Math.round(metadata.compression_ratio * 100)}%
                                    </span>
                                </div>
                            )}
                            {metadata.chunking_strategy && (
                                <div className="col-span-2">
                                    <span className="text-neutral-600">Método:</span>
                                    <span className="ml-1 font-semibold text-primary-700">
                                        Contexto acumulativo ({Math.round(metadata.chunking_strategy.chunk_size_avg / 1000)}k caracteres/chunk)
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <StandardMarkdownViewer 
                    content={essay} 
                    expandAll={expandAll}
                />
            </StandardCard.Content>
        </StandardCard>

        {/* Dialog de edición manual */}
        <StandardDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
        >
            <StandardDialog.Content size="full" colorScheme="accent">
                <StandardDialog.Header>
                    <StandardDialog.Title>
                        {showHistory ? "📜 Historial de Versiones" : "✏️ Editor Manual de Ensayo"}
                    </StandardDialog.Title>
                </StandardDialog.Header>
                
                <StandardDialog.Body>
                    {showHistory ? (
                    // Vista de historial
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <StandardText size="sm" colorScheme="neutral" colorShade="textShade">
                                Historial completo de ediciones (append-only)
                            </StandardText>
                            <StandardButton
                                size="sm"
                                styleType="ghost"
                                onClick={() => setShowHistory(false)}
                            >
                                Volver al Editor
                            </StandardButton>
                        </div>

                        {history.length === 0 ? (
                            <div className="text-center py-8">
                                <StandardText colorScheme="neutral" colorShade="textShade">
                                    No hay historial de ediciones aún
                                </StandardText>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {history.map((item) => (
                                    <div 
                                        key={item.version_number}
                                        className={`p-4 rounded-lg border ${
                                            item.version_number === currentVersion
                                                ? 'border-primary bg-primary-50'
                                                : 'border-neutral-200 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                    item.version_number === currentVersion
                                                        ? 'bg-primary text-white'
                                                        : 'bg-neutral-200 text-neutral-700'
                                                }`}>
                                                    v{item.version_number}
                                                    {item.version_number === currentVersion && ' (Actual)'}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    item.edit_type === 'ai_generated' ? 'bg-blue-100 text-blue-700' :
                                                    item.edit_type === 'manual_edit' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                    {item.edit_type === 'ai_generated' ? '🤖 IA' :
                                                     item.edit_type === 'manual_edit' ? '✏️ Manual' :
                                                     '🔧 Formato'}
                                                </span>
                                            </div>
                                            <StandardText size="xs" colorScheme="neutral" colorShade="textShade">
                                                {new Date(item.created_at).toLocaleString('es-ES')}
                                            </StandardText>
                                        </div>
                                        
                                        {item.edit_reason && (
                                            <StandardText size="sm" className="mb-2">
                                                <strong>Razón:</strong> {item.edit_reason}
                                            </StandardText>
                                        )}
                                        
                                        {item.changes_summary && (
                                            <StandardText size="sm" className="mb-2">
                                                <strong>Cambios:</strong> {item.changes_summary}
                                            </StandardText>
                                        )}
                                        
                                        <div className="flex items-center gap-4 text-xs text-neutral-600">
                                            {item.editor_email && (
                                                <span>👤 {item.editor_email}</span>
                                            )}
                                            {item.character_count && (
                                                <span>📝 {item.character_count.toLocaleString()} caracteres</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // Vista de edición
                    <div className="space-y-4">
                        {/* Advertencia de integridad */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <StandardText size="sm" weight="semibold" className="mb-1 text-amber-800">
                                        🔒 Sistema de Integridad Append-Only
                                    </StandardText>
                                    <StandardText size="xs" className="text-amber-700">
                                        La versión original se preservará automáticamente. 
                                        Tu edición creará una nueva versión. 
                                        Todas las versiones anteriores permanecen inmutables en el historial.
                                    </StandardText>
                                </div>
                            </div>
                        </div>

                        {/* Botón de historial */}
                        <div className="flex justify-end">
                            <StandardButton
                                size="sm"
                                styleType="ghost"
                                colorScheme="neutral"
                                leftIcon={History}
                                onClick={() => setShowHistory(true)}
                            >
                                Ver Historial ({history.length} versiones)
                            </StandardButton>
                        </div>

                        {/* Razón de la edición */}
                        <div>
                            <StandardText size="sm" weight="semibold" className="mb-2">
                                Razón de la edición <span className="text-danger">*</span>
                            </StandardText>
                            <StandardInput
                                value={editReason}
                                onChange={(e) => setEditReason(e.target.value)}
                                placeholder="Ej: Corregir headers Markdown rotos, Arreglar formato de listas, etc."
                                colorScheme="accent"
                                disabled={saving}
                            />
                        </div>

                        {/* Resumen de cambios */}
                        <div>
                            <StandardText size="sm" weight="semibold" className="mb-2">
                                Resumen de cambios (opcional)
                            </StandardText>
                            <StandardTextarea
                                value={changesSummary}
                                onChange={(e) => setChangesSummary(e.target.value)}
                                placeholder="Describe brevemente qué modificaste..."
                                rows={2}
                                colorScheme="accent"
                                disabled={saving}
                            />
                        </div>

                        {/* Editor de texto */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <StandardText size="sm" weight="semibold">
                                    Contenido del Ensayo (Markdown)
                                </StandardText>
                                <div className="flex items-center gap-4 text-xs text-neutral-600">
                                    <span>{editedContent.length.toLocaleString()} caracteres</span>
                                    {editedContent !== essay && (
                                        <span className="text-amber-600 font-semibold">● Modificado</span>
                                    )}
                                </div>
                            </div>
                            
                            <StandardNote
                                value={editedContent}
                                onChange={setEditedContent}
                                placeholder="Edita el contenido del ensayo aquí..."
                                minHeight="400px"
                                colorScheme="accent"
                                disabled={saving}
                            />
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center justify-between pt-4 border-t">
                            <StandardButton
                                styleType="ghost"
                                leftIcon={X}
                                onClick={() => setShowEditDialog(false)}
                                disabled={saving}
                            >
                                Cancelar
                            </StandardButton>
                            
                            <div className="flex items-center gap-2">
                                {editedContent !== essay && (
                                    <StandardText size="xs" colorScheme="amber" className="mr-2">
                                        Hay cambios sin guardar
                                    </StandardText>
                                )}
                                <StandardButton
                                    styleType="solid"
                                    colorScheme="success"
                                    leftIcon={Save}
                                    onClick={handleSaveManualEdit}
                                    disabled={saving || editedContent === essay || !editReason.trim()}
                                    loading={saving}
                                >
                                    {saving ? 'Guardando...' : 'Guardar Nueva Versión'}
                                </StandardButton>
                            </div>
                        </div>
                    </div>
                )}
                </StandardDialog.Body>
            </StandardDialog.Content>
        </StandardDialog>
        </>
    );
}
