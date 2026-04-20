"use client";

import { useState } from "react";
import { StandardButton } from "@/components/ui/StandardButton";
import { Brain, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { extractCognitiveElements } from "@/lib/actions/cognetica-old-extraction-actions";
import { useRouter } from "next/navigation";

interface RunCognitiveAnalysisButtonProps {
    artifactId: string;
    hasTranscription: boolean;
    hasSeeds: boolean;
}

export function RunCognitiveAnalysisButton({ 
    artifactId, 
    hasTranscription,
    hasSeeds
}: RunCognitiveAnalysisButtonProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const router = useRouter();

    // Mostrar solo si hay transcripción pero no hay semillas
    const shouldShowButton = hasTranscription && !hasSeeds;

    if (!shouldShowButton) return null;

    const handleAnalysis = async () => {
        setIsAnalyzing(true);
        toast.info("Iniciando análisis cognitivo con IA...", { 
            id: "analysis-toast",
            duration: 10000 
        });

        try {
            const result = await extractCognitiveElements(artifactId);
            
            if (result.success) {
                toast.success(
                    `¡Análisis completado! ${result.data?.seeds_count || 0} semillas extraídas`, 
                    { id: "analysis-toast" }
                );
                router.refresh(); // Recargar para mostrar las semillas
            } else {
                toast.error(`Error: ${result.error}`, { id: "analysis-toast" });
            }
        } catch (error) {
            toast.error(`Error inesperado: ${error}`, { id: "analysis-toast" });
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-start gap-3">
            <Brain className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-3">
                <div>
                    <p className="font-medium text-violet-800">
                        Análisis Cognitivo Pendiente
                    </p>
                    <p className="text-sm text-violet-700">
                        La transcripción está lista. Extrae semillas fractales, disciplinas y pensadores.
                    </p>
                </div>
                <StandardButton
                    colorScheme="secondary"
                    styleType="solid"
                    size="sm"
                    leftIcon={isAnalyzing ? undefined : Sparkles}
                    onClick={handleAnalysis}
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? (
                        <>
                            <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                            Analizando con Gemini...
                        </>
                    ) : (
                        'Ejecutar Análisis Cognitivo'
                    )}
                </StandardButton>
            </div>
        </div>
    );
}
