import { NextRequest, NextResponse } from 'next/server';
import { createFilteredPhase } from '@/lib/actions/preclassification-actions';
import { getCurrentUser } from '@/lib/server';

export async function POST(req: NextRequest) {
  try {
    // Autenticar usuario
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Extraer parámetros del body
    const body = await req.json();
    const { projectId, sourcePhaseId, name, description, filters } = body;

    // Validar parámetros requeridos
    if (!projectId || !sourcePhaseId || !name || !filters) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos: projectId, sourcePhaseId, name, filters' },
        { status: 400 }
      );
    }

    console.log('🔽 [API] Crear fase embudo:', { projectId, sourcePhaseId, name, filters });

    // Llamar a la función del backend
    const result = await createFilteredPhase({
      projectId,
      sourcePhaseId,
      name,
      description,
      filters
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    console.log('✅ [API] Fase embudo creada:', result.data?.phase.id);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ [API] Error al crear fase embudo:', msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
