import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/server';
import { generateDistilledEssay, getDistilledEssay } from '@/lib/actions/cognetica-old-distillation-actions';

// ========================================================================
// POST: Generar Ensayo Destilado
// ========================================================================

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        
        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Obtener artifactId del body
        const body = await req.json();
        const { artifactId } = body;

        if (!artifactId) {
            return NextResponse.json(
                { error: 'artifactId es requerido' },
                { status: 400 }
            );
        }

        console.log(`📡 [API] Generando ensayo destilado para artifact: ${artifactId}`);

        // Generar ensayo destilado
        const result = await generateDistilledEssay(artifactId);

        console.log(`📡 [API] Resultado de generación:`, {
            success: result.success,
            hasData: !!result.data,
            hasEssay: !!result.data?.essay,
            essayLength: result.data?.essay?.length,
            hasMetadata: !!result.data?.metadata,
            error: result.error
        });

        if (!result.success) {
            console.error(`❌ [API] Error en generación:`, result.error);
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        if (!result.data?.essay) {
            console.error(`❌ [API] ERROR: Resultado exitoso pero sin ensayo!`);
            return NextResponse.json(
                { error: 'Ensayo generado está vacío' },
                { status: 500 }
            );
        }

        console.log(`✅ [API] Retornando ensayo al cliente: ${result.data.essay.length} caracteres`);

        return NextResponse.json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('Error en API de ensayo destilado:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        );
    }
}

// ========================================================================
// GET: Obtener Ensayo Destilado Existente
// ========================================================================

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        
        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Obtener artifactId de los query params
        const { searchParams } = new URL(req.url);
        const artifactId = searchParams.get('artifactId');

        if (!artifactId) {
            return NextResponse.json(
                { error: 'artifactId es requerido' },
                { status: 400 }
            );
        }

        console.log(`📡 [API] Obteniendo ensayo destilado para artifact: ${artifactId}`);

        // Obtener ensayo destilado
        const result = await getDistilledEssay(artifactId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('Error en API de ensayo destilado:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        );
    }
}
