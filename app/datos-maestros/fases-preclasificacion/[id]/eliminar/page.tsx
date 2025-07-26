//. 📍 app/datos-maestros/fases-preclasificacion/[id]/eliminar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import { getPhasesForProject, deletePhase } from "@/lib/actions/preclassification_phases_actions";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { Layers, AlertCircle, Trash2, ArrowLeft, RotateCw, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function EliminarFasePage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const { proyectoActual } = useAuth();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Definición local de la interfaz Phase basada en la estructura de la base de datos
    type PhaseStatus = 'inactive' | 'active' | 'completed' | 'annulled';

    const [fase, setFase] = useState<{
        id: string;
        name: string;
        status: PhaseStatus;
        project_id: string;
        phase_number: number;
        description: string | null;
        created_at: string;
    } | null>(null);

    // Cargar datos de la fase
    useEffect(() => {
        const cargarFase = async () => {
            if (!proyectoActual?.id) {
                setError("No se ha seleccionado un proyecto");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const { data: fases, error: fetchError } = await getPhasesForProject(proyectoActual.id);
                
                if (fetchError) {
                    throw new Error(fetchError.message || 'Error al cargar la fase');
                }
                
                const faseEncontrada = fases?.find(f => f.id === id);
                
                if (!faseEncontrada) {
                    throw new Error('Fase no encontrada');
                }
                
                // Asegurar que el status sea uno de los permitidos
                const faseValidada = {
                    ...faseEncontrada,
                    status: (['inactive', 'active', 'completed', 'annulled'].includes(faseEncontrada.status) 
                        ? faseEncontrada.status as PhaseStatus 
                        : 'inactive')
                };
                setFase(faseValidada);
            } catch (err) {
                console.error('Error cargando la fase:', err);
                setError(err instanceof Error ? err.message : 'Error desconocido al cargar la fase');
            } finally {
                setLoading(false);
            }
        };

        cargarFase();
    }, [id, proyectoActual?.id]);

    const handleEliminar = async () => {
        if (!fase) return;
        
        try {
            setDeleting(true);
            
            const { error } = await deletePhase(fase.id);
            
            if (error) {
                throw new Error(error.message || 'Error al eliminar la fase');
            }
            
            toast({
                title: "¡Fase eliminada!",
                description: `La fase "${fase.name}" ha sido eliminada correctamente.`,
            });
            
            // Redirigir a la lista de fases
            router.push('/datos-maestros/fases-preclasificacion');
        } catch (err) {
            console.error('Error al eliminar la fase:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido al eliminar la fase');
        } finally {
            setDeleting(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    const handleDelete = handleEliminar;

    if (loading) {
        return (
            <StandardPageBackground className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <StandardText>Cargando información de la fase...</StandardText>
                </div>
            </StandardPageBackground>
        );
    }

    if (error) {
        return (
            <StandardPageBackground variant="gradient">
                <StandardCard className="max-w-2xl mx-auto">
                    <div className="p-6 space-y-4 text-center">
                        <StandardIcon>
                            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                        </StandardIcon>
                        <StandardText variant="h4" className="text-destructive">
                            Error al cargar la fase
                        </StandardText>
                        <StandardText className="text-muted-foreground">
                            {error}
                        </StandardText>
                        <div className="pt-4">
                            <StandardButton 
                                onClick={() => window.location.reload()}
                                styleType="solid"
                                colorScheme="primary"
                                leftIcon={RotateCw}
                                aria-label="Reintentar carga"
                            >
                                Reintentar
                            </StandardButton>
                        </div>
                    </div>
                </StandardCard>
            </StandardPageBackground>
        );
    }

    if (!fase) {
        return (
            <StandardPageBackground variant="gradient">
                <StandardCard className="max-w-2xl mx-auto">
                    <div className="p-6 space-y-4 text-center">
                        <StandardIcon>
                            <AlertCircle className="h-12 w-12 text-warning mx-auto" />
                        </StandardIcon>
                        <StandardText variant="h4" className="text-warning">
                            Fase no encontrada
                        </StandardText>
                        <StandardText className="text-muted-foreground">
                            No se encontró la fase solicitada.
                        </StandardText>
                        <div className="pt-4">
                            <StandardButton 
                                onClick={() => router.back()}
                                styleType="outline"
                                colorScheme="neutral"
                                leftIcon={ArrowLeft}
                                aria-label="Volver atrás"
                            >
                                Volver atrás
                            </StandardButton>
                        </div>
                    </div>
                </StandardCard>
            </StandardPageBackground>
        );
    }

    return (
        <StandardPageBackground variant="gradient">
            <div className="container mx-auto py-6">
                <div className="space-y-6">
                    <StandardPageTitle
                        title={`Eliminar Fase: ${fase.name}`}
                        subtitle="Confirmar eliminación de fase de preclasificación"
                        description="Esta acción es irreversible. Por favor, confirma que deseas eliminar esta fase."
                        mainIcon={Layers}
                        showBackButton={{ href: `/datos-maestros/fases-preclasificacion/${id}/ver` }}
                        breadcrumbs={[
                            { label: "Datos Maestros", href: "/datos-maestros" },
                            { label: "Fases de Preclasificación", href: "/datos-maestros/fases-preclasificacion" },
                            { label: fase.name, href: `/datos-maestros/fases-preclasificacion/${id}/ver` },
                            { label: "Eliminar" }
                        ]}
                    />
                    
                    <StandardCard className="max-w-3xl mx-auto">
                        <div className="p-6">
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="bg-destructive/10 p-4 rounded-full">
                                    <AlertCircle className="h-12 w-12 text-destructive" />
                                </div>
                                
                                <div className="space-y-2">
                                    <StandardText variant="h3">¿Eliminar fase de preclasificación?</StandardText>
                                    <StandardText className="text-muted-foreground">
                                        Estás a punto de eliminar la fase &quot;{fase.name}&quot;. Esta acción no se puede deshacer.
                                    </StandardText>
                                </div>
                                
                                <div className="bg-muted/50 p-4 rounded-lg w-full text-left space-y-2">
                                    <StandardText variant="small" className="font-medium">Detalles de la fase:</StandardText>
                                    <StandardText variant="small" className="text-muted-foreground">
                                        Nombre: <span className="font-medium text-foreground">{fase.name}</span>
                                    </StandardText>
                                    <StandardText variant="small" className="text-muted-foreground">
                                        Número: <span className="font-medium text-foreground">{fase.phase_number}</span>
                                    </StandardText>
                                    <StandardText variant="small" className="text-muted-foreground">
                                        Estado: <span className="font-medium text-foreground">
                                            {fase.status === 'active' ? 'Activo' : 
                                             fase.status === 'completed' ? 'Completado' : 
                                             fase.status === 'annulled' ? 'Anulado' : 'Inactivo'}
                                        </span>
                                    </StandardText>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                                    <StandardButton 
                                        onClick={handleCancel}
                                        styleType="outline"
                                        colorScheme="neutral"
                                        className="flex-1"
                                        leftIcon={ArrowLeft}
                                        disabled={deleting}
                                        aria-label="Cancelar eliminación"
                                    >
                                        Cancelar
                                    </StandardButton>
                                    <StandardButton 
                                        onClick={handleDelete}
                                        styleType="solid"
                                        colorScheme="danger"
                                        className="flex-1"
                                        leftIcon={Trash2}
                                        loading={deleting}
                                        disabled={deleting}
                                        aria-label="Confirmar eliminación"
                                    >
                                        {deleting ? 'Eliminando...' : 'Eliminar definitivamente'}
                                    </StandardButton>
                                </div>
                            </div>
                        </div>
                    </StandardCard>
                </div>
            </div>
        </StandardPageBackground>
    );
}
