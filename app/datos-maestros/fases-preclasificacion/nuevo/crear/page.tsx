//. 📍 app/datos-maestros/fases-preclasificacion/nuevo/crear/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth-provider";
import FaseForm from "../../components/FaseForm";
import { createPhase } from "@/lib/actions/preclassification_phases_actions";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { AlertCircle, CheckCircle2, Network } from "lucide-react";
import { toast } from "sonner";

export default function NuevaFasePage() {
    const router = useRouter();
    const { proyectoActual } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Verificar permisos y cargar datos iniciales
    useEffect(() => {
        if (!proyectoActual) {
            setError("No se ha seleccionado un proyecto");
            setLoading(false);
            return;
        }

        if (!proyectoActual.permissions?.can_manage_master_data) {
            setError("No tienes permisos para crear fases de preclasificación");
        }
        
        setLoading(false);
    }, [proyectoActual]);

    const handleSubmit = async (formData: FormData) => {
        if (!proyectoActual?.id) {
            const errorMsg = 'No se ha seleccionado un proyecto';
            toast.error('Error', { description: errorMsg });
            return { error: { message: errorMsg } };
        }
        
        try {
            setLoading(true);
            
            // Asegurarse de que el project_id esté en el FormData
            if (!formData.get('project_id')) {
                formData.append('project_id', proyectoActual.id);
            }
            
            const { data: newPhase, error } = await createPhase(formData);
            
            if (error) {
                const errorMsg = error.message || 'Error al crear la fase';
                toast.error('Error al guardar', { 
                    description: errorMsg,
                    icon: <AlertCircle className="h-5 w-5 text-destructive" />
                });
                return { error: { message: errorMsg } };
            }
            
            toast.success('Fase creada', {
                description: 'La fase se ha creado correctamente',
                icon: <CheckCircle2 className="h-5 w-5 text-success" />
            });
            
            // Redirigir después de 1 segundo para dar tiempo a ver el mensaje
            setTimeout(() => {
                router.push('/datos-maestros/fases-preclasificacion');
            }, 1000);
            
            return { data: newPhase };
        } catch (err) {
            console.error('Error al crear la fase:', err);
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido al crear la fase';
            toast.error('Error inesperado', {
                description: errorMsg,
                icon: <AlertCircle className="h-5 w-5 text-destructive" />
            });
            return { error: { message: errorMsg } };
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <SustratoLoadingLogo
                    size={50}
                    variant="spin-pulse"
                    showText={true}
                    text="Cargando..."
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8">
                <StandardCard
                    disableShadowHover={true}
                    className="border-destructive bg-destructive/5"
                    colorScheme="danger"
                    styleType="subtle"
                    hasOutline={false}
                    accentPlacement="none"
                >
                    <div className="flex items-center gap-3">
                        <StandardIcon><AlertCircle className="h-6 w-6 text-destructive" /></StandardIcon>
                        <StandardText>Error: {error}</StandardText>
                    </div>
                    <div className="mt-4">
                        <StandardButton
                            onClick={() => window.location.reload()}
                            size="sm"
                            styleType="outline"
                        >
                            Reintentar
                        </StandardButton>
                    </div>
                </StandardCard>
            </div>
        );
    }

    // Obtener el siguiente número de fase disponible
    const nextPhaseNumber = 1; // En una implementación real, podrías obtener esto de la base de datos

    return (
        <StandardPageBackground variant="gradient">
            <div className="container mx-auto py-6">
                <div className="space-y-6">
                    <StandardPageTitle
                        title="Nueva Fase de Preclasificación"
                        subtitle="Crea una nueva fase para el proceso de preclasificación"
                        description="Completa los siguientes campos para crear una nueva fase en el proceso de preclasificación de documentos."
                        mainIcon={Network}
                        showBackButton={{ href: "/datos-maestros/fases-preclasificacion" }}
                        breadcrumbs={[
                            { label: "Datos Maestros", href: "/datos-maestros" },
                            { label: "Fases de Preclasificación", href: "/datos-maestros/fases-preclasificacion" },
                            { label: "Nueva Fase" }
                        ]}
                    />
                    
                    <FaseForm 
                        modo="crear"
                        proyectoId={proyectoActual?.id || ''}
                        onSubmit={handleSubmit}
                        loading={loading}
                        valoresIniciales={{
                            phase_number: nextPhaseNumber,
                            status: 'inactive'
                        }}
                    />
                </div>
            </div>
        </StandardPageBackground>
    );
}
