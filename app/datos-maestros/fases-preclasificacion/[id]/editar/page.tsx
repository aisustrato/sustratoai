//. 📍 app/datos-maestros/fases-preclasificacion/[id]/editar/page.tsx
"use client";

import { useState, useEffect } from "react";

// Definición local de la interfaz Phase basada en la estructura de la base de datos
type PhaseStatus = 'inactive' | 'active' | 'completed' | 'annulled';

interface Phase {
    id: string;
    project_id: string;
    name: string;
    description: string | null;
    phase_number: number;
    status: PhaseStatus;
    created_at: string;
}
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import FaseForm from "../../components/FaseForm";
import { getPhasesForProject, updatePhaseDetails, updatePhaseStatus } from "@/lib/actions/preclassification_phases_actions";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { StandardText } from "@/components/ui/StandardText";
import { Layers, AlertCircle, ArrowLeft, RotateCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { StandardButton } from "@/components/ui/StandardButton";

export default function EditarFasePage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const faseId = Array.isArray(id) ? id[0] : id || '';
    const { proyectoActual } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fase, setFase] = useState<Phase | null>(null);

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
                
                // Asegurarse de que la fase tenga todos los campos requeridos y los tipos correctos
                const faseCompleta: Phase = {
                    ...faseEncontrada,
                    // Asegurar que el status sea uno de los permitidos
                    status: (['inactive', 'active', 'completed', 'annulled'].includes(faseEncontrada.status) 
                        ? faseEncontrada.status as PhaseStatus 
                        : 'inactive')
                };
                
                setFase(faseCompleta);
            } catch (err) {
                console.error('Error cargando la fase:', err);
                setError(err instanceof Error ? err.message : 'Error desconocido al cargar la fase');
            } finally {
                setLoading(false);
            }
        };

        cargarFase();
    }, [id, proyectoActual?.id]);

    const handleSubmit = async (formData: FormData) => {
        if (!proyectoActual?.id) {
            const errorMsg = 'No se ha seleccionado un proyecto';
            toast.error('Error', { description: errorMsg });
            return { error: { message: errorMsg } };
        }
        
        if (!fase?.id) {
            const errorMsg = 'No se ha encontrado la fase a editar';
            toast.error('Error', { description: errorMsg });
            return { error: { message: errorMsg } };
        }
        
        try {
            setSaving(true);
            
            // Asegurarse de que el ID esté en el FormData
            if (!formData.get('id')) {
                formData.append('id', fase.id);
            }
            
            // Actualizar detalles de la fase
            const { error: updateError } = await updatePhaseDetails(formData);
            
            if (updateError) {
                const errorMsg = updateError.message || 'Error al actualizar los detalles de la fase';
                toast.error('Error al guardar', {
                    description: errorMsg,
                    icon: <AlertCircle className="h-5 w-5 text-destructive" />
                });
                return { error: { message: errorMsg } };
            }
            
            // Actualizar estado si es diferente
            const newStatus = formData.get('status') as string;
            if (newStatus && newStatus !== fase.status) {
                // Validar que el nuevo estado sea uno de los permitidos
                const validStatus: PhaseStatus = 
                    (['inactive', 'active', 'completed', 'annulled'].includes(newStatus) 
                        ? newStatus as PhaseStatus 
                        : 'inactive');
                
                const { error: statusError } = await updatePhaseStatus(fase.id, validStatus);
                
                // Actualizar el estado local si la actualización fue exitosa
                if (!statusError) {
                    setFase(prev => prev ? { ...prev, status: validStatus } : null);
                }
                
                if (statusError) {
                    const errorMsg = statusError.message || 'Error al actualizar el estado de la fase';
                    toast.error('Error al actualizar', {
                        description: errorMsg,
                        icon: <AlertCircle className="h-5 w-5 text-destructive" />
                    });
                    return { error: { message: errorMsg } };
                }
            }
            
            toast.success('Cambios guardados', {
                description: 'La fase se ha actualizado correctamente',
                icon: <CheckCircle2 className="h-5 w-5 text-success" />
            });
            
            return { data: { id: fase.id } };
        } catch (err) {
            console.error('Error al guardar los cambios:', err);
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido al guardar los cambios';
            toast.error('Error inesperado', {
                description: errorMsg,
                icon: <AlertCircle className="h-5 w-5 text-destructive" />
            });
            return { error: { message: errorMsg } };
        } finally {
            setSaving(false);
        }
    };

    // Manejador de éxito movido al handleSubmit

    if (loading) {
        return (
            <StandardPageBackground>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <SustratoLoadingLogo size={64} />
                </div>
            </StandardPageBackground>
        );
    }

    if (error) {
        return (
            <StandardPageBackground>
                <StandardCard className="max-w-2xl mx-auto my-8">
                    <div className="flex flex-col items-center gap-4 text-center p-6">
                        <StandardIcon
                            size="xl"
                            colorScheme="danger"
                            className="mb-4"
                        >
                            <AlertCircle />
                        </StandardIcon>
                        <StandardText variant="h4" className="text-center mb-2">
                            Error al cargar la fase
                        </StandardText>
                        <StandardText className="text-muted-foreground mb-6">
                            {error}
                        </StandardText>
                        <StandardButton
                            onClick={() => window.location.reload()}
                            leftIcon={RotateCw}
                            colorScheme="primary"
                            styleType="solid"
                            aria-label="Reintentar carga"
                        >
                            Reintentar
                        </StandardButton>
                    </div>
                </StandardCard>
            </StandardPageBackground>
        );
    }

    if (!fase) {
        return (
            <StandardPageBackground variant="gradient">
                <StandardCard className="max-w-2xl mx-auto my-8">
                    <div className="flex flex-col items-center gap-4 text-center p-6">
                        <StandardIcon
                            size="xl"
                            colorScheme="warning"
                            className="mb-4"
                        >
                            <AlertCircle />
                        </StandardIcon>
                        <StandardText variant="h4" className="text-center mb-2">
                            Fase no encontrada
                        </StandardText>
                        <StandardText className="text-muted-foreground mb-6">
                            La fase que intentas editar no existe o no tienes permiso para verla.
                        </StandardText>
                        <StandardButton
                            onClick={() => router.back()}
                            leftIcon={ArrowLeft}
                            colorScheme="primary"
                            styleType="outline"
                            aria-label="Volver atrás"
                        >
                            Volver atrás
                        </StandardButton>
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
                        title={`Editar Fase: ${fase.name}`}
                        subtitle="Modifica los detalles de la fase de preclasificación"
                        description="Actualiza la información de esta fase del proceso de preclasificación de documentos."
                        mainIcon={Layers}
                        showBackButton={{ href: `/datos-maestros/fases-preclasificacion/${faseId}/ver` }}
                        breadcrumbs={[
                            { label: "Datos Maestros", href: "/datos-maestros" },
                            { label: "Fases de Preclasificación", href: "/datos-maestros/fases-preclasificacion" },
                            { label: fase.name, href: `/datos-maestros/fases-preclasificacion/${faseId}/ver` },
                            { label: "Editar" }
                        ]}
                    />

                    <FaseForm
                        modo="editar"
                        proyectoId={proyectoActual?.id || ''}
                        onSubmit={handleSubmit}
                        loading={saving}
                        valoresIniciales={{
                            id: fase.id,
                            name: fase.name,
                            description: fase.description || '',
                            phase_number: fase.phase_number,
                            status: fase.status
                        }}
                    />
                </div>
            </div>
        </StandardPageBackground>
    );
}
