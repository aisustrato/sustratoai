// 📍 app/api/cognetica/verify-hash/route.ts
// API Route para verificar integridad de hash SHA-256

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const hash = searchParams.get('hash');

        if (!hash) {
            return NextResponse.json(
                { error: 'Parámetro "hash" requerido' },
                { status: 400 }
            );
        }

        // Verificar autenticación
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Buscar export con ese hash
        const { data: exports, error: queryError } = await supabase
            .from('cog_artifact_exports')
            .select(`
                artifact_id,
                content_hash,
                exported_at,
                cog_artifacts!inner(
                    id,
                    title,
                    type,
                    project_id
                )
            `)
            .eq('content_hash', hash);

        if (queryError) {
            console.error('❌ [Verify Hash] Error consultando:', queryError);
            return NextResponse.json(
                { error: 'Error consultando base de datos' },
                { status: 500 }
            );
        }

        if (!exports || exports.length === 0) {
            return NextResponse.json(
                { 
                    valid: false, 
                    message: 'Hash no encontrado en el sistema',
                    hash 
                },
                { status: 404 }
            );
        }

        // Verificar que el usuario tiene acceso al artefacto
        const exportData = exports[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const artifact = (exportData.cog_artifacts as any);

        const { data: membership } = await supabase
            .from('project_members')
            .select('id')
            .eq('project_id', artifact.project_id)
            .eq('user_id', user.id)
            .single();

        if (!membership) {
            return NextResponse.json(
                { error: 'No tienes permisos para verificar este hash' },
                { status: 403 }
            );
        }

        // Hash válido y usuario autorizado
        return NextResponse.json({
            valid: true,
            message: 'Hash verificado exitosamente',
            hash,
            artifact: {
                id: artifact.id,
                title: artifact.title,
                type: artifact.type,
                exported_at: exportData.exported_at
            }
        });

    } catch (error) {
        console.error('❌ [Verify Hash] Error:', error);
        return NextResponse.json(
            { error: 'Error verificando hash', details: String(error) },
            { status: 500 }
        );
    }
}
