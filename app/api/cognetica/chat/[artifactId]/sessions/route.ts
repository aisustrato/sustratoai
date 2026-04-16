// 📍 app/api/cognetica/chat/[artifactId]/sessions/route.ts
// API Route para verificar si un artefacto tiene sesiones de chat QUIPU (calibración)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: { artifactId: string } }
) {
    try {
        const { artifactId } = params;

        // Verificar autenticación
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Verificar que el artefacto existe y el usuario tiene acceso
        const { data: artifact, error: artifactError } = await supabase
            .from('cog_artifacts')
            .select('id, project_id')
            .eq('id', artifactId)
            .single();

        if (artifactError || !artifact) {
            return NextResponse.json(
                { error: 'Artefacto no encontrado' },
                { status: 404 }
            );
        }

        // Verificar membresía del proyecto
        const { data: membership } = await supabase
            .from('project_members')
            .select('id')
            .eq('project_id', artifact.project_id)
            .eq('user_id', user.id)
            .single();

        if (!membership) {
            return NextResponse.json(
                { error: 'No tienes permisos para acceder a este artefacto' },
                { status: 403 }
            );
        }

        // Obtener sesiones de chat del artefacto
        const { data: sessions, error: sessionsError } = await supabase
            .from('cog_chat_sessions')
            .select('id, created_at')
            .eq('artifact_id', artifactId)
            .order('created_at', { ascending: false });

        if (sessionsError) {
            console.error('❌ [Chat Sessions API] Error consultando sesiones:', sessionsError);
            return NextResponse.json(
                { error: 'Error consultando sesiones de chat' },
                { status: 500 }
            );
        }

        console.log(`✅ [Chat Sessions API] Artefacto ${artifactId}: ${sessions?.length || 0} sesiones`);

        return NextResponse.json({
            artifactId,
            sessions: sessions || [],
            hasCalibration: (sessions?.length || 0) > 0
        });

    } catch (error) {
        console.error('❌ [Chat Sessions API] Error:', error);
        return NextResponse.json(
            { error: 'Error verificando sesiones de chat', details: String(error) },
            { status: 500 }
        );
    }
}
