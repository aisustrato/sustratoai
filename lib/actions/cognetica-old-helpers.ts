"use server";

/**
 * 🧠 Cognética - Funciones Helper Unificadas
 * 
 * Propósito: Proporcionar una capa de abstracción limpia para obtener
 * contenido de artefactos independiente de su tipo (audio, video, documento, slides).
 * 
 * Principio: "El humano y la IA ven lo mismo"
 */

import { createSupabaseServerClient } from "@/lib/server";

/**
 * Tipo de contenido retornado por getArtifactTextContent
 */
export interface ArtifactTextContent {
    text: string;
    source: 'transcription' | 'pages' | 'none';
    category: 'audio_video' | 'document' | 'slides';
    pageCount?: number;
    artifactType: string;
}

/**
 * Obtiene el contenido de texto de un artefacto de forma unificada.
 * 
 * Mapa de tipos reales en BD → fuente de texto:
 * - 'audio' | 'video'   → cog_transcriptions.full_text
 * - 'pdf_slides'        → cog_artifact_pages.markdown_original (página por página)
 * - 'pdf_report'        → cog_transcriptions.full_text
 * - 'markdown'          → cog_transcriptions.full_text
 * - 'chat'              → cog_chat_sessions.messages (JSON → texto plano)
 * - 'document' (legacy) → páginas si existen, sino transcripción
 * 
 * @param artifactId - UUID del artefacto
 * @returns Objeto con texto, fuente, categoría y metadata
 */
export async function getArtifactTextContent(artifactId: string): Promise<ArtifactTextContent | null> {
    const supabase = await createSupabaseServerClient();

    // 1. Obtener tipo de artefacto
    const { data: artifact, error: artifactError } = await supabase
        .from('cog_artifacts')
        .select('type, mime_type')
        .eq('id', artifactId)
        .single();

    if (artifactError || !artifact) {
        console.error(`[getArtifactTextContent] Error obteniendo artefacto ${artifactId}:`, artifactError);
        return null;
    }

    const artifactType = artifact.type as string;
    console.log(`[getArtifactTextContent] Artefacto ${artifactId} → type: '${artifactType}'`);

    // 2. Audio / Video → cog_transcriptions.full_text
    if (artifactType === 'audio' || artifactType === 'video') {
        const { data: trans } = await supabase
            .from('cog_transcriptions')
            .select('full_text')
            .eq('artifact_id', artifactId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        console.log(`[getArtifactTextContent] audio/video → transcripción: ${trans?.full_text?.length ?? 0} chars`);
        return {
            text: trans?.full_text || '',
            source: trans?.full_text ? 'transcription' : 'none',
            category: 'audio_video',
            artifactType
        };
    }

    // 3. PDF Slides → cog_artifact_pages.markdown_original
    if (artifactType === 'pdf_slides') {
        const { data: pages } = await supabase
            .from('cog_artifact_pages')
            .select('markdown_original, page_number')
            .eq('artifact_id', artifactId)
            .eq('status', 'processed')
            .order('page_number', { ascending: true });

        if (pages && pages.length > 0) {
            const text = pages
                .map(p => `--- PÁGINA ${p.page_number} ---\n${p.markdown_original || ''}`)
                .join('\n\n');
            console.log(`[getArtifactTextContent] pdf_slides → ${pages.length} páginas, ${text.length} chars`);
            return {
                text,
                source: 'pages',
                category: 'slides',
                pageCount: pages.length,
                artifactType
            };
        }
        console.warn(`[getArtifactTextContent] pdf_slides sin páginas procesadas para ${artifactId}`);
        return { text: '', source: 'none', category: 'slides', pageCount: 0, artifactType };
    }

    // 4. PDF Report / Markdown → cog_transcriptions.full_text
    if (artifactType === 'pdf_report' || artifactType === 'markdown') {
        const { data: trans } = await supabase
            .from('cog_transcriptions')
            .select('full_text')
            .eq('artifact_id', artifactId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        console.log(`[getArtifactTextContent] ${artifactType} → transcripción: ${trans?.full_text?.length ?? 0} chars`);
        return {
            text: trans?.full_text || '',
            source: trans?.full_text ? 'transcription' : 'none',
            category: 'document',
            artifactType
        };
    }

    // 5. Chat Quipu → cog_chat_sessions.messages (JSON → texto plano)
    if (artifactType === 'chat') {
        const { data: sessions } = await supabase
            .from('cog_chat_sessions')
            .select('messages, started_at')
            .eq('artifact_id', artifactId)
            .order('started_at', { ascending: false })
            .limit(1);

        const session = sessions?.[0];
        if (session?.messages && Array.isArray(session.messages)) {
            const msgs = session.messages as Array<{ role: string; content: string; timestamp?: string }>;
            const text = msgs
                .map(m => `[${m.role === 'user' ? 'Investigador' : 'Nodo Analista'}]: ${m.content}`)
                .join('\n\n');
            console.log(`[getArtifactTextContent] chat → ${msgs.length} mensajes, ${text.length} chars`);
            return {
                text,
                source: 'transcription',
                category: 'document',
                artifactType
            };
        }
        console.warn(`[getArtifactTextContent] chat sin sesiones para ${artifactId}`);
        return { text: '', source: 'none', category: 'document', artifactType };
    }

    // 6. 'document' legacy → páginas si existen, sino transcripción
    if (artifactType === 'document') {
        const { data: pages } = await supabase
            .from('cog_artifact_pages')
            .select('markdown_original, page_number')
            .eq('artifact_id', artifactId)
            .eq('status', 'processed')
            .order('page_number', { ascending: true });

        if (pages && pages.length > 0) {
            const text = pages
                .map(p => `--- PÁGINA ${p.page_number} ---\n${p.markdown_original || ''}`)
                .join('\n\n');
            return { text, source: 'pages', category: 'slides', pageCount: pages.length, artifactType };
        }

        const { data: trans } = await supabase
            .from('cog_transcriptions')
            .select('full_text')
            .eq('artifact_id', artifactId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        return {
            text: trans?.full_text || '',
            source: trans?.full_text ? 'transcription' : 'none',
            category: 'document',
            artifactType
        };
    }

    // 7. Tipos sin contenido textual (image, other)
    console.warn(`[getArtifactTextContent] Tipo '${artifactType}' sin extractor de texto para ${artifactId}`);
    return { text: '', source: 'none', category: 'document', artifactType };
}

/**
 * Verifica si un artefacto es de tipo Slides (presentación multi-página)
 * 
 * @param artifactId - UUID del artefacto
 * @returns true si el artefacto tiene páginas en cog_artifact_pages
 */
export async function isSlideArtifact(artifactId: string): Promise<boolean> {
    const supabase = await createSupabaseServerClient();

    const { data: pages } = await supabase
        .from('cog_artifact_pages')
        .select('id')
        .eq('artifact_id', artifactId)
        .limit(1);

    return !!(pages && pages.length > 0);
}

/**
 * Obtiene el progreso de procesamiento de un artefacto de tipo Slides
 * 
 * @param artifactId - UUID del artefacto
 * @returns Objeto con estadísticas de procesamiento
 */
export async function getSlideProcessingProgress(artifactId: string) {
    const supabase = await createSupabaseServerClient();

    // Usar la función SQL get_artifact_progress
    const { data, error } = await supabase.rpc('get_artifact_progress', {
        artifact_uuid: artifactId
    });

    if (error) {
        console.error(`[getSlideProcessingProgress] Error:`, error);
        return null;
    }

    return data;
}
