"use server";

import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Constante de permiso
const PERMISO_GESTIONAR_COGNETICA = "can_manage_master_data";

/**
 * Verifica que el usuario tenga permiso para gestionar datos del proyecto
 */
async function verificarPermisoGestionCognetica(
    supabase: Awaited<ReturnType<typeof createServerClient>>,
    userId: string,
    projectId: string
): Promise<boolean> {
    const { data: tienePermiso, error: rpcError } = await supabase.rpc(
        "has_permission_in_project",
        {
            p_user_id: userId,
            p_project_id: projectId,
            p_permission_column: PERMISO_GESTIONAR_COGNETICA,
        }
    );
    if (rpcError) {
        console.error(`[AUTH_CHECK_ERROR] RPC has_permission_in_project (delete): ${rpcError.message}`);
        return false;
    }
    return tienePermiso === true;
}

/**
 * Verifica si un artefacto puede ser eliminado
 * Solo se puede eliminar si:
 * 1. NO tiene calibración QUIPU
 * 2. NO ha sido descargado (no tiene hash de descarga)
 */
export async function canDeleteArtifact(artifactId: string) {
    const supabase = await createServerClient();
    
    try {
        // Obtener artefacto con metadata
        const { data: artifact, error } = await supabase
            .from('cog_artifacts')
            .select('id, project_id, source_metadata')
            .eq('id', artifactId)
            .single();
        
        if (error || !artifact) {
            return { 
                canDelete: false, 
                reason: "Artefacto no encontrado" 
            };
        }
        
        const metadata = artifact.source_metadata as Record<string, any> || {};
        
        // Verificar si tiene calibración QUIPU
        const hasQuipuCalibration = metadata.quipu_calibration !== undefined && 
                                   metadata.quipu_calibration !== null;
        
        if (hasQuipuCalibration) {
            return { 
                canDelete: false, 
                reason: "El artefacto tiene calibración QUIPU y no puede ser eliminado" 
            };
        }
        
        // Verificar si tiene hash de descarga
        const hasDownloadHash = metadata.download_hash !== undefined && 
                               metadata.download_hash !== null &&
                               metadata.download_hash !== '';
        
        if (hasDownloadHash) {
            return { 
                canDelete: false, 
                reason: "El artefacto ha sido descargado y no puede ser eliminado" 
            };
        }
        
        return { 
            canDelete: true, 
            reason: null 
        };
        
    } catch (error) {
        console.error('Error verificando si artefacto puede ser eliminado:', error);
        return { 
            canDelete: false, 
            reason: "Error verificando permisos de eliminación" 
        };
    }
}

/**
 * Elimina un artefacto y todos sus datos relacionados
 * Solo si cumple las condiciones de eliminación
 */
export async function deleteArtifact(artifactId: string) {
    const supabase = await createServerClient();
    
    try {
        // 1. Verificar autenticación
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Usuario no autenticado" };
        }
        
        // 2. Obtener artefacto y verificar permisos
        const { data: artifact, error: fetchError } = await supabase
            .from('cog_artifacts')
            .select('id, project_id, storage_path, source_metadata')
            .eq('id', artifactId)
            .single();
        
        if (fetchError || !artifact) {
            return { success: false, error: "Artefacto no encontrado" };
        }
        
        // 3. Verificar permiso de gestión
        const tienePermiso = await verificarPermisoGestionCognetica(
            supabase,
            user.id,
            artifact.project_id
        );
        
        if (!tienePermiso) {
            return { success: false, error: "No tienes permiso para eliminar artefactos" };
        }
        
        // 4. Verificar si puede ser eliminado
        const { canDelete, reason } = await canDeleteArtifact(artifactId);
        
        if (!canDelete) {
            return { success: false, error: reason || "No se puede eliminar este artefacto" };
        }
        
        console.log(`🗑️ [Delete] Iniciando eliminación de artefacto: ${artifactId}`);
        
        // 5. Eliminar archivo de Storage si existe
        if (artifact.storage_path) {
            console.log(`🗑️ [Delete] Eliminando archivo de storage: ${artifact.storage_path}`);
            const { error: storageError } = await supabase
                .storage
                .from('cognetica-files')
                .remove([artifact.storage_path]);
            
            if (storageError) {
                console.error('⚠️ [Delete] Error eliminando archivo de storage:', storageError);
                // No bloqueamos la eliminación si falla el storage
            }
        }
        
        // 6. Eliminar datos relacionados (las FK con ON DELETE CASCADE lo harán automáticamente)
        // Pero podemos hacerlo explícitamente para mayor control
        
        // Eliminar transcripciones
        await supabase
            .from('cog_transcriptions')
            .delete()
            .eq('artifact_id', artifactId);
        
        // Eliminar semillas fractales
        await supabase
            .from('cog_fractal_seeds')
            .delete()
            .eq('artifact_id', artifactId);
        
        // Eliminar asociaciones con disciplinas
        await supabase
            .from('cog_artifact_disciplines')
            .delete()
            .eq('artifact_id', artifactId);
        
        // Eliminar asociaciones con referencias
        await supabase
            .from('cog_artifact_references')
            .delete()
            .eq('artifact_id', artifactId);
        
        // Eliminar asociaciones con teorías
        await supabase
            .from('cog_artifact_theories')
            .delete()
            .eq('artifact_id', artifactId);
        
        // Eliminar asociaciones con corrientes de pensamiento
        await supabase
            .from('cog_artifact_streams')
            .delete()
            .eq('artifact_id', artifactId);
        
        // Eliminar sesiones de chat
        await supabase
            .from('cog_chat_sessions')
            .delete()
            .eq('artifact_id', artifactId);
        
        // 7. Eliminar el artefacto
        const { error: deleteError } = await supabase
            .from('cog_artifacts')
            .delete()
            .eq('id', artifactId);
        
        if (deleteError) {
            console.error('❌ [Delete] Error eliminando artefacto:', deleteError);
            return { success: false, error: "Error eliminando artefacto: " + deleteError.message };
        }
        
        console.log(`✅ [Delete] Artefacto eliminado exitosamente: ${artifactId}`);
        
        // 8. Revalidar rutas
        revalidatePath('/cognetica');
        revalidatePath(`/cognetica/${artifactId}`);
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ [Delete] Error fatal:', error);
        return { success: false, error: String(error) };
    }
}
