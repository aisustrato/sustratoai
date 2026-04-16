"use client";

import { useState } from "react";
import { StandardButton } from "@/components/ui/StandardButton";
import { RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { retryTranscription } from "@/lib/actions/cognetica-actions";
import { useRouter } from "next/navigation";

interface RetryTranscriptionButtonProps {
    artifactId: string;
    currentStatus: string | null;
    hasTranscription: boolean;
}

export function RetryTranscriptionButton({ 
    artifactId, 
    currentStatus, 
    hasTranscription 
}: RetryTranscriptionButtonProps) {
    const [isRetrying, setIsRetrying] = useState(false);
    const router = useRouter();

    // Mostrar el botón solo si: status es 'error' O (status no es 'analyzing' Y no hay transcripción)
    const shouldShowButton = 
        currentStatus === 'error' || 
        (currentStatus !== 'analyzing' && currentStatus !== 'completed' && !hasTranscription);

    if (!shouldShowButton) return null;

    const handleRetry = async () => {
        setIsRetrying(true);
        toast.info("Iniciando transcripción...", { id: "retry-toast" });

        try {
            const result = await retryTranscription(artifactId);
            
            if (result.success) {
                toast.success("¡Transcripción completada!", { id: "retry-toast" });
                router.refresh(); // Recargar para mostrar la transcripción
            } else {
                toast.error(`Error: ${result.error}`, { id: "retry-toast" });
            }
        } catch (error) {
            toast.error(`Error inesperado: ${error}`, { id: "retry-toast" });
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-3">
                <div>
                    <p className="font-medium text-amber-800">
                        {currentStatus === 'error' 
                            ? 'La transcripción falló' 
                            : 'Transcripción pendiente'}
                    </p>
                    <p className="text-sm text-amber-700">
                        {currentStatus === 'error'
                            ? 'Hubo un error procesando el audio. Puedes reintentar.'
                            : 'El archivo está subido pero no se ha transcrito.'}
                    </p>
                </div>
                <StandardButton
                    colorScheme="warning"
                    styleType="solid"
                    size="sm"
                    leftIcon={isRetrying ? undefined : RefreshCw}
                    onClick={handleRetry}
                    disabled={isRetrying}
                >
                    {isRetrying ? (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Transcribiendo...
                        </>
                    ) : (
                        'Reintentar Transcripción'
                    )}
                </StandardButton>
            </div>
        </div>
    );
}
