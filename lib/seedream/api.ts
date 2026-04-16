"use server";

/**
 * 🎨 Seedream 4.0 API Client
 * ByteDance image generation - 4K resolution
 * 
 * Pricing: $0.03 USD per image
 * Docs: https://docs.byteplus.com/en/docs/ModelArk/1541523
 */

import { createServerClient } from "@/lib/supabase";

// Tipos
export interface SeedreamGenerationParams {
    prompt: string;
    imageSize?: "square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9";
    imageResolution?: "1k" | "2k" | "4k";
    seed?: number;
    numImages?: number;
}

export interface SeedreamResponse {
    success: boolean;
    imageUrl?: string;
    storagePath?: string;
    error?: string;
}

/**
 * Genera una imagen usando Seedream 4.0 API
 */
export async function generateWithSeedream(params: SeedreamGenerationParams): Promise<SeedreamResponse> {
    const apiKey = process.env.BYTEPLUS_API_KEY;
    
    if (!apiKey) {
        console.error("🎨 [Seedream] ❌ BYTEPLUS_API_KEY no configurada");
        return { success: false, error: "API Key no configurada" };
    }

    console.log(`🎨 [Seedream] Generando imagen...`);
    console.log(`🎨 [Seedream] Prompt: ${params.prompt.slice(0, 100)}...`);

    try {
        const response = await fetch("https://api.byteplus.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "seedream-4.0",
                prompt: params.prompt,
                image_size: params.imageSize || "portrait_4_3",
                image_resolution: params.imageResolution || "4k",
                num_images: params.numImages || 1,
                seed: params.seed,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`🎨 [Seedream] ❌ Error API: ${response.status}`, errorText);
            return { success: false, error: `API Error: ${response.status}` };
        }

        const data = await response.json();
        
        if (!data.data?.[0]?.url) {
            console.error(`🎨 [Seedream] ❌ Sin URL en respuesta`);
            return { success: false, error: "Sin imagen en respuesta" };
        }

        const imageUrl = data.data[0].url;
        console.log(`🎨 [Seedream] ✅ Imagen generada: ${imageUrl.slice(0, 60)}...`);

        return { success: true, imageUrl };

    } catch (error) {
        console.error(`🎨 [Seedream] ❌ Error:`, error);
        return { success: false, error: String(error) };
    }
}

/**
 * Genera imagen y la guarda directamente en Supabase Storage
 */
export async function generateAndStoreImage(
    prompt: string,
    artifactId: string,
    variantIndex: number = 0
): Promise<SeedreamResponse> {
    // 1. Generar imagen
    const result = await generateWithSeedream({
        prompt,
        imageSize: "portrait_4_3",
        imageResolution: "4k",
    });

    if (!result.success || !result.imageUrl) {
        return result;
    }

    // 2. Descargar imagen desde CDN de BytePlus
    console.log(`🎨 [Seedream] Descargando imagen para almacenar...`);
    
    try {
        const imageResponse = await fetch(result.imageUrl);
        
        if (!imageResponse.ok) {
            return { success: false, error: "Error descargando imagen" };
        }

        const imageBlob = await imageResponse.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // 3. Subir a Supabase Storage
        const supabase = await createServerClient();
        const filename = `avatars/${artifactId}_v${variantIndex}_${Date.now()}.png`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("cognetica-files")
            .upload(filename, uint8Array, {
                contentType: "image/png",
                upsert: true,
            });

        if (uploadError) {
            console.error(`🎨 [Seedream] ❌ Error subiendo a Storage:`, uploadError);
            return { success: false, error: uploadError.message };
        }

        console.log(`🎨 [Seedream] ✅ Imagen guardada: ${filename}`);

        return {
            success: true,
            imageUrl: result.imageUrl,
            storagePath: uploadData.path,
        };

    } catch (error) {
        console.error(`🎨 [Seedream] ❌ Error almacenando:`, error);
        return { success: false, error: String(error) };
    }
}

/**
 * Genera múltiples variantes de imagen para un artefacto
 */
export async function generateArtifactAvatars(
    prompts: string[],
    artifactId: string,
    projectId: string
): Promise<{ success: boolean; generated: number; errors: string[] }> {
    const supabase = await createServerClient();
    const results: SeedreamResponse[] = [];
    const errors: string[] = [];

    console.log(`🎨 [Seedream] Generando ${prompts.length} variantes para artefacto ${artifactId}`);

    for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        console.log(`🎨 [Seedream] Variante ${i + 1}/${prompts.length}...`);

        const result = await generateAndStoreImage(prompt, artifactId, i);
        results.push(result);

        if (result.success && result.storagePath) {
            // Guardar en tabla cog_generated_images
            const { error: dbError } = await supabase
                .from("cog_generated_images")
                .insert({
                    prompt_id: artifactId, // Usamos artifact_id temporalmente
                    provider: "seedream",
                    model_name: "seedream-4.0",
                    storage_path: result.storagePath,
                    storage_url: result.imageUrl,
                    status: "completed",
                    generation_params: {
                        prompt,
                        variant_index: i,
                        resolution: "4k",
                        artifact_id: artifactId,
                        project_id: projectId,
                    },
                });

            if (dbError) {
                console.error(`🎨 [Seedream] ⚠️ Error guardando en DB:`, dbError);
                errors.push(`DB Error variante ${i}: ${dbError.message}`);
            }
        } else {
            errors.push(`Variante ${i}: ${result.error}`);
        }

        // Pequeña pausa entre requests para no saturar
        if (i < prompts.length - 1) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    const generated = results.filter(r => r.success).length;
    console.log(`🎨 [Seedream] ✅ Completado: ${generated}/${prompts.length} imágenes`);

    return {
        success: generated > 0,
        generated,
        errors,
    };
}
