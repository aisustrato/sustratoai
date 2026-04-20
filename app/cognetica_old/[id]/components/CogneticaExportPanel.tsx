"use client";

import { useState, useEffect } from "react";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { Download, FileText, Loader2, FileJson, FileCode, AlertTriangle } from "lucide-react";

interface CogneticaExportPanelProps {
    artifactId: string;
    artifactTitle: string;
}

type ExportFormat = 'md' | 'yaml' | 'json';

export function CogneticaExportPanel({ artifactId, artifactTitle }: CogneticaExportPanelProps) {
    const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
    const [hasCalibration, setHasCalibration] = useState<boolean | null>(null);
    const [showCalibrationWarning, setShowCalibrationWarning] = useState(false);
    const [pendingFormat, setPendingFormat] = useState<ExportFormat | null>(null);

    // Verificar si hay sesiones de chat QUIPU (calibración)
    useEffect(() => {
        const checkCalibration = async () => {
            try {
                const response = await fetch(`/api/cognetica_old/chat/${artifactId}/sessions`);
                if (response.ok) {
                    const data = await response.json();
                    const hasSessions = data.sessions && data.sessions.length > 0;
                    setHasCalibration(hasSessions);
                    console.log(`🔍 [Export] Calibración QUIPU: ${hasSessions ? 'SÍ' : 'NO'}`);
                }
            } catch (error) {
                console.error('❌ [Export] Error verificando calibración:', error);
                setHasCalibration(false);
            }
        };

        checkCalibration();
    }, [artifactId]);

    const handleExportClick = (format: ExportFormat) => {
        // Si no hay calibración, mostrar advertencia
        if (hasCalibration === false) {
            setPendingFormat(format);
            setShowCalibrationWarning(true);
            return;
        }

        // Si hay calibración, proceder directamente
        performExport(format);
    };

    const performExport = async (format: ExportFormat) => {
        setExportingFormat(format);
        setShowCalibrationWarning(false);
        setPendingFormat(null);

        try {
            console.log(`📦 [Export] Iniciando exportación a ${format.toUpperCase()}...`);
            
            // Llamar a la API route
            const response = await fetch(`/api/cognetica_old/export/${artifactId}/${format}`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error en la exportación');
            }
            
            // Obtener el blob y el nombre del archivo desde los headers
            const blob = await response.blob();
            const contentDisposition = response.headers.get('content-disposition');
            const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
            const filename = filenameMatch?.[1] || `artefacto.${format}`;
            
            // Descargar archivo
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log(`✅ [Export] ${format.toUpperCase()} descargado exitosamente`);
        } catch (error) {
            console.error('❌ [Export] Error:', error);
            alert(`Error al exportar a ${format.toUpperCase()}. Revisa la consola para más detalles.`);
        } finally {
            setExportingFormat(null);
        }
    };

    return (
        <div className="bg-card p-6 rounded-xl border shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                📦 Exportar Artefacto Completo
            </h3>
            
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Descarga toda la información del artefacto con <strong>hash SHA-256</strong> para verificación de integridad.
                    Elige el formato según tu necesidad:
                </p>
                
                {/* Botón Markdown */}
                <div className="space-y-2">
                    <StandardButton
                        colorScheme="primary"
                        leftIcon={exportingFormat === 'md' ? Loader2 : FileText}
                        onClick={() => handleExportClick('md')}
                        disabled={exportingFormat !== null}
                        className="w-full"
                    >
                        {exportingFormat === 'md' ? "Generando..." : "Markdown (.md)"}
                    </StandardButton>
                    <div className="text-xs text-muted-foreground pl-2">
                        <p>👤 Para humanos (Obsidian, Notion, etc.)</p>
                        <p>📝 Incluye frontmatter YAML con hash</p>
                    </div>
                </div>

                {/* Botón YAML */}
                <div className="space-y-2">
                    <StandardButton
                        colorScheme="tertiary"
                        leftIcon={exportingFormat === 'yaml' ? Loader2 : FileCode}
                        onClick={() => handleExportClick('yaml')}
                        disabled={exportingFormat !== null}
                        className="w-full"
                    >
                        {exportingFormat === 'yaml' ? "Generando..." : "YAML (.yaml)"}
                    </StandardButton>
                    <div className="text-xs text-muted-foreground pl-2">
                        <p>🤖 Para máquinas (pipelines, configs)</p>
                        <p>🔧 Estructura limpia y determinística</p>
                    </div>
                </div>

                {/* Botón JSON */}
                <div className="space-y-2">
                    <StandardButton
                        colorScheme="accent"
                        leftIcon={exportingFormat === 'json' ? Loader2 : FileJson}
                        onClick={() => handleExportClick('json')}
                        disabled={exportingFormat !== null}
                        className="w-full"
                    >
                        {exportingFormat === 'json' ? "Generando..." : "JSON (.json)"}
                    </StandardButton>
                    <div className="text-xs text-muted-foreground pl-2">
                        <p>🔐 Canónico (fuente de verdad del hash)</p>
                        <p>📊 Para APIs y procesamiento programático</p>
                    </div>
                </div>

                {/* Footer con info del hash */}
                <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold">🔒 Sistema de Integridad:</p>
                    <p>• Cada export incluye hash SHA-256 único</p>
                    <p>• Verificable en <code className="text-xs bg-muted px-1 rounded">/api/cognetica_old/verify-hash?hash=...</code></p>
                    <p>• Licencia: CC-BY 4.0</p>
                </div>
            </div>

            {/* Dialog de advertencia si no hay calibración */}
            <StandardDialog open={showCalibrationWarning} onOpenChange={setShowCalibrationWarning}>
                <StandardDialog.Content colorScheme="warning" size="md">
                    <StandardDialog.Header>
                        <StandardDialog.Title className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Artefacto sin Calibración QUIPU
                        </StandardDialog.Title>
                    </StandardDialog.Header>
                    
                    <StandardDialog.Body>
                        <div className="space-y-3 text-sm">
                            <p>
                                Este artefacto <strong>no tiene calibración QUIPU</strong> aún. 
                                La calibración es el proceso de diálogo con la IA para extraer semillas fractales 
                                y profundizar en el contenido.
                            </p>
                            <p className="text-muted-foreground">
                                Puedes descargar el documento sin calibración, pero el hash generado 
                                reflejará solo la transcripción base. Si luego realizas calibración, 
                                el hash cambiará para reflejar el nuevo contenido.
                            </p>
                            <p className="font-semibold">
                                ¿Deseas notarizar y descargar el documento sin calibración?
                            </p>
                        </div>
                    </StandardDialog.Body>
                    
                    <StandardDialog.Footer>
                        <StandardButton
                            colorScheme="neutral"
                            onClick={() => {
                                setShowCalibrationWarning(false);
                                setPendingFormat(null);
                            }}
                        >
                            Cancelar
                        </StandardButton>
                        <StandardButton
                            colorScheme="warning"
                            onClick={() => {
                                if (pendingFormat) {
                                    performExport(pendingFormat);
                                }
                            }}
                        >
                            Sí, Descargar sin Calibración
                        </StandardButton>
                    </StandardDialog.Footer>
                </StandardDialog.Content>
            </StandardDialog>
        </div>
    );
}
