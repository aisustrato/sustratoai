"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardText } from "@/components/ui/StandardText";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteArtifact, canDeleteArtifact } from "@/lib/actions/cognetica-delete-actions";
import { toast } from "sonner";

interface DeleteArtifactButtonProps {
    artifactId: string;
    artifactTitle: string;
}

export function DeleteArtifactButton({ artifactId, artifactTitle }: DeleteArtifactButtonProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [canDelete, setCanDelete] = useState(true);
    const [deleteReason, setDeleteReason] = useState<string | null>(null);

    const handleOpenDialog = async () => {
        // Verificar si puede ser eliminado
        const result = await canDeleteArtifact(artifactId);
        setCanDelete(result.canDelete);
        setDeleteReason(result.reason);
        setIsOpen(true);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        toast.loading("Eliminando artefacto...", { id: "delete-artifact" });

        try {
            const result = await deleteArtifact(artifactId);

            if (result.success) {
                toast.success("¡Artefacto eliminado exitosamente!", { id: "delete-artifact" });
                router.push("/cognetica");
                router.refresh();
            } else {
                toast.error(result.error || "Error eliminando artefacto", { id: "delete-artifact" });
            }
        } catch (error) {
            toast.error("Error inesperado al eliminar", { id: "delete-artifact" });
        } finally {
            setIsDeleting(false);
            setIsOpen(false);
        }
    };

    return (
        <>
            <StandardButton
                colorScheme="danger"
                styleType="outline"
                size="sm"
                leftIcon={Trash2}
                onClick={handleOpenDialog}
            >
                Eliminar
            </StandardButton>

            <StandardDialog
                open={isOpen}
                onOpenChange={setIsOpen}
            >
                <StandardDialog.Content size="md" colorScheme={canDelete ? "danger" : "warning"}>
                    <StandardDialog.Header>
                        <StandardDialog.Title>
                            {canDelete ? "Confirmar Eliminación" : "No se puede eliminar"}
                        </StandardDialog.Title>
                    </StandardDialog.Header>
                    
                    <StandardDialog.Body>
                    {canDelete ? (
                        <>
                            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <StandardText weight="semibold" colorScheme="danger">
                                        Esta acción es irreversible
                                    </StandardText>
                                    <StandardText size="sm" colorScheme="neutral">
                                        Se eliminará permanentemente el artefacto y todos sus datos asociados:
                                    </StandardText>
                                    <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4">
                                        <li>• Archivo original</li>
                                        <li>• Transcripción/Markdown</li>
                                        <li>• Semillas fractales</li>
                                        <li>• Asociaciones con disciplinas, pensadores y teorías</li>
                                        <li>• Sesiones de chat con QUIPU</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="p-3 bg-muted rounded-lg">
                                <StandardText size="sm" weight="medium">
                                    Artefacto a eliminar:
                                </StandardText>
                                <StandardText size="sm" colorScheme="neutral" className="mt-1">
                                    {artifactTitle}
                                </StandardText>
                            </div>

                            <StandardDialog.Footer>
                                <StandardButton
                                    styleType="outline"
                                    onClick={() => setIsOpen(false)}
                                    disabled={isDeleting}
                                >
                                    Cancelar
                                </StandardButton>
                                <StandardButton
                                    colorScheme="danger"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    leftIcon={Trash2}
                                >
                                    {isDeleting ? "Eliminando..." : "Eliminar Permanentemente"}
                                </StandardButton>
                            </StandardDialog.Footer>
                        </>
                    ) : (
                        <>
                            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <StandardText weight="semibold" colorScheme="warning">
                                        Artefacto protegido
                                    </StandardText>
                                    <StandardText size="sm" colorScheme="neutral">
                                        {deleteReason}
                                    </StandardText>
                                </div>
                            </div>

                            <div className="p-3 bg-muted rounded-lg">
                                <StandardText size="sm" weight="medium" className="mb-2">
                                    Condiciones para eliminar:
                                </StandardText>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                                    <li>• No debe tener calibración QUIPU</li>
                                    <li>• No debe haber sido descargado (sin hash)</li>
                                </ul>
                            </div>

                            <StandardDialog.Footer>
                                <StandardButton
                                    onClick={() => setIsOpen(false)}
                                >
                                    Entendido
                                </StandardButton>
                            </StandardDialog.Footer>
                        </>
                    )}
                    </StandardDialog.Body>
                </StandardDialog.Content>
            </StandardDialog>
        </>
    );
}
