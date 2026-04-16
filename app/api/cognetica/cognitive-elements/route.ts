import { NextResponse } from 'next/server';
import { deleteCognitiveElements } from '@/lib/actions/cognetica-distillation-actions';
import { createSupabaseServerClient } from '@/lib/server';

/**
 * DELETE /api/cognetica/cognitive-elements
 * Borra únicamente los elementos cognitivos de un artefacto (sin tocar el ensayo)
 */
export async function DELETE(req: Request) {
    try {
        // Verificar autenticación
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Obtener artifactId del body
        const { artifactId } = await req.json();

        if (!artifactId) {
            return NextResponse.json(
                { error: 'artifactId es requerido' },
                { status: 400 }
            );
        }

        console.log(`🗑️ [API] Borrando elementos cognitivos para artifact: ${artifactId}`);

        // Llamar a la función de borrado
        const result = await deleteCognitiveElements(artifactId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Error borrando elementos cognitivos' },
                { status: 500 }
            );
        }

        console.log(`✅ [API] Elementos cognitivos borrados:`, result.data);

        return NextResponse.json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('Error en DELETE /api/cognetica/cognitive-elements:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
