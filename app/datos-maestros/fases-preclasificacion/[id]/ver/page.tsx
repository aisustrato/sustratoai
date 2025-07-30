//. 📍 app/datos-maestros/fases-preclasificacion/[id]/ver/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import FaseForm from "../../components/FaseForm";
import { getPhasesForProject } from "@/lib/actions/preclassification_phases_actions";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { StandardText } from "@/components/ui/StandardText";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { Edit, ArrowLeft, AlertCircle, RotateCw, CheckCircle2, Network } from "lucide-react";
import { toast } from "sonner";

export default function VerFasePage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const { proyectoActual } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fase, setFase] = useState<{
        id: string;
        name: string;
        description: string | null;
        created_at: string;
        phase_number: number;
        project_id: string;
        status: 'completed' | 'active' | 'inactive' | 'annulled';
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
                
                setFase(faseEncontrada);
                
                // Mostrar toast de éxito solo si no hay error
                toast.success('Fase cargada', {
                    description: 'Los datos de la fase se han cargado correctamente',
                    icon: <CheckCircle2 className="h-5 w-5 text-success" />
                });
            } catch (err) {
                console.error('Error cargando la fase:', err);
                const errorMsg = err instanceof Error ? err.message : 'Error desconocido al cargar la fase';
                
                // Mostrar toast de error
                toast.error('Error al cargar', {
                    description: errorMsg,
                    icon: <AlertCircle className="h-5 w-5 text-destructive" />
                });
                
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        cargarFase();
    }, [id, proyectoActual?.id]);

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
                <div className="max-w-2xl mx-auto my-8">
                    <StandardCard className="p-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <StandardIcon size="xl" colorScheme="danger">
                                <AlertCircle />
                            </StandardIcon>
                            <StandardText variant="h4" className="text-center mb-2">
                                Error al cargar la fase
                            </StandardText>
                            <StandardText className="text-center mb-6">
                                {error}
                            </StandardText>
                            <StandardButton
                                onClick={() => window.location.reload()}
                                colorScheme="primary"
                                styleType="solid"
                                leftIcon={RotateCw}
                                aria-label="Reintentar carga"
                            >
                                Reintentar
                            </StandardButton>
                        </div>
                    </StandardCard>
                </div>
            </StandardPageBackground>
        );
    }

    if (!fase) {
        return (
            <StandardPageBackground>
                <div className="max-w-2xl mx-auto my-8">
                    <StandardCard className="p-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <StandardIcon size="xl" colorScheme="warning">
                                <AlertCircle />
                            </StandardIcon>
                            <StandardText variant="h4" className="text-center mb-2">
                                Fase no encontrada
                            </StandardText>
                            <StandardText className="text-center mb-6">
                                La fase solicitada no existe o no tienes permisos para verla.
                            </StandardText>
                            <StandardButton
                                onClick={() => router.back()}
                                colorScheme="primary"
                                styleType="outline"
                                leftIcon={ArrowLeft}
                                aria-label="Volver atrás"
                            >
                                Volver atrás
                            </StandardButton>
                        </div>
                    </StandardCard>
                </div>
            </StandardPageBackground>
        );
    }

    const puedeEditar = proyectoActual?.permissions?.can_manage_master_data || false;

    return (
        <StandardPageBackground variant="gradient">
            <div className="container mx-auto py-6">
                <div className="space-y-6">
                    <StandardPageTitle
                        title={`Fase: ${fase.name}`}
                        subtitle="Detalles de la fase de preclasificación"
                        description="Revisa la información detallada de esta fase del proceso de preclasificación."
                        mainIcon={Network}
                        showBackButton={{ href: "/datos-maestros/fases-preclasificacion" }}
                        breadcrumbs={[
                            { label: "Datos Maestros", href: "/datos-maestros" },
                            { label: "Fases de Preclasificación", href: "/datos-maestros/fases-preclasificacion" },
                            { label: fase.name }
                        ]}
                        actions={
                            puedeEditar ? (
                                <StandardButton
                                    styleType="solid"
                                    colorScheme="primary"
                                    leftIcon={Edit}
                                    onClick={() => router.push(`/datos-maestros/fases-preclasificacion/${id}/editar`)}
                                    aria-label="Editar fase"
                                >
                                    Editar Fase
                                </StandardButton>
                            ) : undefined
                        }
                    />

                    <FaseForm 
                        modo="ver"
                        proyectoId={proyectoActual?.id || ''}
                        valoresIniciales={{
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
