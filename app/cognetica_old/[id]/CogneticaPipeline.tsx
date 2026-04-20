"use client";

import { useState, useEffect } from "react";
import { StandardStepper, StepItem } from "@/components/ui/StandardStepper";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardProgressBar } from "@/components/ui/StandardProgressBar";
import { Upload, Mic, Brain, Image, Sparkles, RefreshCw, AlertCircle, Presentation } from "lucide-react";
import { retryTranscription } from "@/lib/actions/cognetica-old-actions";
import { extractCognitiveElements } from "@/lib/actions/cognetica-old-extraction-actions";
import { generateArtifactImages } from "@/lib/actions/seedream-actions";
import { useRouter } from "next/navigation";

interface CogneticaPipelineProps {
    artifactId: string;
    hasTranscription: boolean;
    hasSeeds: boolean;
    hasImages?: boolean;
    status: string;
    mimeType?: string;
    isPresentation?: boolean;
    hasPagesReady?: boolean;
    hasPagesProcessed?: boolean;
    onComplete?: () => void;
}

// Función para generar steps dinámicos según tipo de archivo
function getPipelineSteps(mimeType?: string, isPresentation?: boolean): StepItem[] {
    // Si es presentación, pipeline diferente
    if (isPresentation) {
        return [
            { id: "upload", label: "Subida", description: "PDF cargado", icon: Upload },
            { id: "split", label: "División", description: "Páginas separadas", icon: Presentation },
            { id: "processing", label: "Procesamiento", description: "Marker API", icon: Brain },
            { id: "metabolization", label: "Metabolización", description: "DeepSeek Cognitivo", icon: Brain },
            { id: "completed", label: "Completo", description: "Todo listo", icon: Sparkles },
        ];
    }
    
    // Determinar el procesador según el tipo de archivo
    let processorLabel = "Transcripción";
    let processorDescription = "WhisperX";
    
    if (mimeType === 'application/pdf') {
        processorLabel = "Procesamiento PDF";
        processorDescription = "Replicate Marker";
    } else if (mimeType === 'text/markdown') {
        processorLabel = "Procesamiento MD";
        processorDescription = "Importación directa";
    } else if (mimeType?.startsWith('video/')) {
        processorLabel = "Transcripción";
        processorDescription = "WhisperX";
    } else if (mimeType?.startsWith('audio/')) {
        processorLabel = "Transcripción";
        processorDescription = "WhisperX";
    }
    
    return [
        { id: "upload", label: "Subida", description: "Archivo cargado", icon: Upload },
        { id: "transcription", label: processorLabel, description: processorDescription, icon: Mic },
        { id: "extraction", label: "Extracción", description: "DeepSeek Chat", icon: Brain },
        { id: "images", label: "Avatares", description: "Seedream 4K", icon: Image },
        { id: "completed", label: "Completo", description: "Todo listo", icon: Sparkles },
    ];
}

function getStepIndex(
    hasTranscription: boolean, 
    hasSeeds: boolean, 
    hasImages: boolean,
    status: string,
    isPresentation?: boolean,
    hasPagesReady?: boolean,
    hasPagesProcessed?: boolean
): number {
    // Para presentaciones:
    // Paso 0: Upload
    // Paso 1: División (split)
    // Paso 2: Procesamiento (Marker)
    // Paso 3: Metabolización (extracción cognitiva)
    // Paso 4: Completo
    
    if (isPresentation) {
        if (hasSeeds) return 4; // Metabolización completada
        if (hasPagesProcessed) return 3; // Listo para metabolización
        if (hasPagesReady) return 2; // Listo para procesamiento
        return 1; // Solo upload
    }
    
    // Para audio/video/PDF:
    // Paso 0: Upload
    // Paso 1: Transcripción WhisperX
    // Paso 2: Extracción DeepSeek
    // Paso 3: Generación Imágenes Seedream
    // Paso 4: Completo

    if (hasImages) return 4; // Todo completado
    if (hasSeeds) return 3; // Listo para imágenes
    if (hasTranscription) return 2; // Listo para extracción
    if (status === "processing") return 1; // Procesando transcripción
    return 1; // Archivo subido, esperando transcripción
}

export function CogneticaPipeline({ 
    artifactId, 
    hasTranscription, 
    hasSeeds, 
    hasImages = false,
    status,
    mimeType,
    isPresentation = false,
    hasPagesReady = false,
    hasPagesProcessed = false,
    onComplete 
}: CogneticaPipelineProps) {
    // Generar steps dinámicos según tipo de archivo
    const pipelineSteps = getPipelineSteps(mimeType, isPresentation);
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(() => {
        if (isPresentation) {
            // Paso 3: Todas las páginas procesadas (listas para traducción)
            if (hasPagesProcessed) return 3;
            // Paso 2: Páginas divididas (listas para procesamiento)
            if (hasPagesReady) return 2;
            // Paso 1: División en progreso
            return 1;
        }
        return getStepIndex(hasTranscription, hasSeeds, hasImages, status);
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    // Actualizar paso según estado actual
    useEffect(() => {
        if (isPresentation) {
            if (hasSeeds) {
                setCurrentStep(4); // Metabolización completada
            } else if (hasPagesProcessed) {
                setCurrentStep(3); // Listo para metabolización
            } else if (hasPagesReady) {
                setCurrentStep(2); // Listo para procesamiento
            } else {
                setCurrentStep(1); // Solo upload
            }
        } else {
            setCurrentStep(getStepIndex(hasTranscription, hasSeeds, hasImages, status, false, false, false));
        }
    }, [hasTranscription, hasSeeds, hasImages, status, isPresentation, hasPagesReady, hasPagesProcessed]);

    // Polling automático: refrescar página cuando el procesamiento en background termine
    useEffect(() => {
        // Solo hacer polling si el artefacto está en estado 'analyzing' o 'processing'
        if (status !== 'analyzing' && status !== 'processing') {
            return;
        }

        console.log(`🔄 [Pipeline] Iniciando polling automático (status: ${status})`);
        
        // Refrescar cada 3 segundos
        const pollInterval = setInterval(() => {
            console.log(`🔄 [Pipeline] Refrescando página para verificar cambios...`);
            router.refresh();
        }, 3000);

        // Limpiar intervalo al desmontar o cuando cambie el status
        return () => {
            console.log(`🔄 [Pipeline] Deteniendo polling automático`);
            clearInterval(pollInterval);
        };
    }, [status, router]);

    // Ejecutar transcripción (Paso 1 → 2)
    const runTranscription = async () => {
        setIsProcessing(true);
        setError(null);
        setProcessingMessage("Enviando audio a WhisperX...");
        setProgress(20);

        try {
            setProgress(40);
            setProcessingMessage("Procesando transcripción...");
            
            const result = await retryTranscription(artifactId);
            
            if (!result.success) {
                throw new Error(result.error || "Error en transcripción");
            }
            
            setProgress(100);
            setProcessingMessage("¡Transcripción completada!");
            setCurrentStep(2);
            
            // ⚠️ DESHABILITADO: Auto-ejecución de extracción cognitiva
            // La extracción debe ser MANUAL hasta implementar con ensayo destilado
            // setTimeout(() => runExtraction(), 1500);
            
            // Finalizar procesamiento y refrescar para mostrar transcripción
            setTimeout(() => {
                setIsProcessing(false);
                router.refresh();
            }, 1000);
            
        } catch (err) {
            setError(String(err));
            setIsProcessing(false);
        }
    };

    // Ejecutar extracción cognitiva (Paso 2 → 3)
    const runExtraction = async () => {
        setIsProcessing(true);
        setError(null);
        setProcessingMessage("Conectando con DeepSeek API...");
        setProgress(20);

        try {
            setProgress(40);
            setProcessingMessage("Analizando contenido cognitivo...");
            
            const result = await extractCognitiveElements(artifactId);
            
            if (!result.success) {
                throw new Error(result.error || "Error en extracción");
            }
            
            setProgress(80);
            setProcessingMessage("Guardando elementos...");
            
            await new Promise(r => setTimeout(r, 500));
            
            setProgress(100);
            setProcessingMessage("¡Análisis cognitivo completado!");
            setCurrentStep(3);
            
            setTimeout(() => {
                setIsProcessing(false);
                router.refresh();
            }, 1000);
            
        } catch (err) {
            setError(String(err));
            setIsProcessing(false);
        }
    };

    // Ejecutar generación de imágenes (Paso 3 → 4)
    const runImageGeneration = async () => {
        setIsProcessing(true);
        setError(null);
        setProcessingMessage("Conectando con Seedream API...");
        setProgress(10);

        try {
            setProgress(30);
            setProcessingMessage("Generando 3 variantes de imagen (4K)...");
            
            const result = await generateArtifactImages(artifactId);
            
            if (!result.success) {
                throw new Error(result.errors?.join(", ") || "Error en generación");
            }
            
            setProgress(90);
            setProcessingMessage(`¡${result.generated} imágenes generadas!`);
            
            await new Promise(r => setTimeout(r, 500));
            
            setProgress(100);
            setProcessingMessage("Pipeline completado 🎉");
            setCurrentStep(4);
            
            setTimeout(() => {
                setIsProcessing(false);
                router.refresh();
                onComplete?.();
            }, 1000);
            
        } catch (err) {
            setError(String(err));
            setIsProcessing(false);
        }
    };

    // Determinar qué botón mostrar
    const renderActionButton = () => {
        if (isProcessing) {
            return (
                <div className="space-y-3">
                    <StandardProgressBar 
                        value={progress} 
                        colorScheme="primary" 
                        size="sm"
                        animated
                    />
                    <p className="text-sm text-center text-muted-foreground animate-pulse">
                        {processingMessage}
                    </p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{error}</span>
                    </div>
                    <StandardButton 
                        styleType="outline" 
                        size="sm" 
                        onClick={() => {
                            setError(null);
                            if (currentStep === 1) {
                                runTranscription();
                            } else if (currentStep === 2) {
                                runExtraction();
                            } else if (currentStep === 3) {
                                runImageGeneration();
                            }
                        }}
                        leftIcon={RefreshCw}
                    >
                        Reintentar
                    </StandardButton>
                </div>
            );
        }

        // Paso 4: Completado
        if (currentStep === 4) {
            return (
                <div className="text-center">
                    <p className="text-sm text-emerald-600 font-medium">
                        ✨ Pipeline completado exitosamente
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Transcripción + Análisis + 3 Imágenes 4K
                    </p>
                </div>
            );
        }

        // Paso 1: División de páginas para presentaciones (ya completado, mostrar reintento)
        if (currentStep >= 1 && isPresentation && currentStep < 3) {
            return (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">
                        {currentStep === 1 && "División en progreso..."}
                        {currentStep === 2 && "Páginas listas para procesamiento"}
                    </p>
                    <StandardButton 
                        colorScheme="neutral"
                        styleType="outline"
                        size="sm"
                        onClick={() => {
                            window.location.href = `/cognetica_old/nuevo`;
                        }}
                        leftIcon={RefreshCw}
                        fullWidth
                    >
                        Subir Nueva Presentación
                    </StandardButton>
                </div>
            );
        }

        // Paso 1: Transcripción (no mostrar para presentaciones)
        if (currentStep === 1 && !hasTranscription && !isPresentation) {
            return (
                <StandardButton 
                    colorScheme="primary"
                    size="sm"
                    onClick={runTranscription}
                    leftIcon={Mic}
                >
                    Iniciar Transcripción
                </StandardButton>
            );
        }

        // Paso 2: Extracción DeepSeek
        if (currentStep === 2 && hasTranscription && !hasSeeds) {
            return (
                <StandardButton 
                    colorScheme="secondary"
                    size="sm"
                    onClick={runExtraction}
                    leftIcon={Brain}
                >
                    Ejecutar Análisis Cognitivo
                </StandardButton>
            );
        }

        // Paso 3: Generar Imágenes Seedream (solo para audio/video)
        if (currentStep === 3 && hasSeeds && !hasImages && !isPresentation) {
            return (
                <StandardButton 
                    colorScheme="primary"
                    size="sm"
                    onClick={runImageGeneration}
                    leftIcon={Image}
                >
                    Generar Avatares 4K ($0.09)
                </StandardButton>
            );
        }

        // Paso 3: Metabolización (Extracción Cognitiva) para presentaciones
        if (currentStep === 3 && isPresentation && hasPagesProcessed && !hasSeeds) {
            return (
                <div className="space-y-2">
                    <StandardButton 
                        colorScheme="secondary"
                        size="sm"
                        onClick={runExtraction}
                        leftIcon={Brain}
                        fullWidth
                    >
                        Metabolizar Presentación (DeepSeek)
                    </StandardButton>
                    <p className="text-xs text-center text-muted-foreground">
                        Extraer semillas fractales, disciplinas, pensadores y prompts de imágenes
                    </p>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="bg-card rounded-xl border shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                🔄 Pipeline de Procesamiento
            </h3>
            
            {/* Stepper Visual */}
            <StandardStepper 
                steps={pipelineSteps}
                currentStepIndex={currentStep}
                variant="primary"
                orientation="horizontal"
                className="mb-6"
            />

            {/* Área de Acción */}
            <div className="flex justify-center">
                {renderActionButton()}
            </div>

            {/* Botones manuales de fallback (colapsados) */}
            {currentStep < 3 && !isProcessing && (
                <details className="mt-6 pt-4 border-t">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        Opciones manuales (debug)
                    </summary>
                    <div className="flex gap-2 mt-3">
                        <StandardButton 
                            styleType="ghost" 
                            size="xs"
                            onClick={runTranscription}
                            disabled={isProcessing}
                        >
                            Forzar Transcripción
                        </StandardButton>
                        <StandardButton 
                            styleType="ghost" 
                            size="xs"
                            onClick={runExtraction}
                            disabled={isProcessing || !hasTranscription}
                        >
                            Forzar Extracción
                        </StandardButton>
                    </div>
                </details>
            )}
        </div>
    );
}
