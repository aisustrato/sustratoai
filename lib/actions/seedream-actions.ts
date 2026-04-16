"use server";

/**
 * 🎨 Seedream Actions - Generación de avatares visuales
 * Costo: ~$0.09 por artefacto (3 variantes x $0.03)
 */

import { createServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { generateArtifactAvatars } from "@/lib/seedream/api";

interface ImagePrompt {
    style: string;
    prompt: string;
}

/**
 * Genera las 3 imágenes del artefacto usando los prompts guardados
 */
export async function generateArtifactImages(artifactId: string) {
    console.log(`🎨 [Seedream Action] Iniciando generación para: ${artifactId}`);
    
    const supabase = await createServerClient();
    
    // 1. Obtener el artefacto con sus prompts de imagen
    const { data: artifact, error } = await supabase
        .from('cog_artifacts')
        .select('id, project_id, source_metadata')
        .eq('id', artifactId)
        .single();
    
    if (error || !artifact) {
        console.error(`🎨 [Seedream] ❌ Artefacto no encontrado`);
        return { success: false, error: "Artefacto no encontrado" };
    }
    
    // 2. Extraer los prompts de la metadata
    const metadata = artifact.source_metadata as Record<string, unknown> | null;
    const imagePrompts = (metadata?.image_prompts as ImagePrompt[]) || [];
    
    if (imagePrompts.length === 0) {
        console.error(`🎨 [Seedream] ❌ No hay prompts de imagen`);
        return { 
            success: false, 
            error: "No hay prompts de imagen. Ejecuta primero el análisis cognitivo." 
        };
    }
    
    console.log(`🎨 [Seedream] Encontrados ${imagePrompts.length} prompts`);
    
    // 3. Extraer solo los textos de los prompts
    const promptTexts = imagePrompts.map(p => p.prompt);
    
    // 4. Generar las imágenes con Seedream
    const result = await generateArtifactAvatars(
        promptTexts,
        artifactId,
        artifact.project_id
    );
    
    // 5. Actualizar metadata con estado de generación
    if (result.success) {
        await supabase
            .from('cog_artifacts')
            .update({
                source_metadata: {
                    ...metadata,
                    images_generated: result.generated,
                    images_generation_date: new Date().toISOString()
                }
            })
            .eq('id', artifactId);
    }
    
    revalidatePath(`/cognetica/${artifactId}`);
    revalidatePath('/cognetica');
    
    console.log(`🎨 [Seedream Action] Completado: ${result.generated} imágenes`);
    
    return {
        success: result.success,
        generated: result.generated,
        errors: result.errors,
    };
}

/**
 * Obtener imágenes generadas de un artefacto
 */
export async function getArtifactImages(artifactId: string) {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
        .from('cog_generated_images')
        .select('*')
        .contains('generation_params', { artifact_id: artifactId })
        .order('created_at', { ascending: true });
    
    if (error) {
        return { success: false, error: error.message, data: [] };
    }
    
    // Generar URLs firmadas para las imágenes
    const imagesWithUrls = await Promise.all(
        (data || []).map(async (img) => {
            const { data: signedData } = await supabase.storage
                .from('cognetica-files')
                .createSignedUrl(img.storage_path, 3600);
            
            return {
                ...img,
                signedUrl: signedData?.signedUrl || img.storage_url,
            };
        })
    );
    
    return { success: true, data: imagesWithUrls };
}

/**
 * Verificar si Seedream está configurado
 */
export async function checkSeedreamConfig() {
    const hasApiKey = !!process.env.BYTEPLUS_API_KEY;
    
    return {
        configured: hasApiKey,
        message: hasApiKey 
            ? "Seedream API configurada correctamente"
            : "Falta BYTEPLUS_API_KEY en variables de entorno"
    };
}
