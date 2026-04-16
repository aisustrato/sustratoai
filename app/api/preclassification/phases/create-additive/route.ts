import { NextRequest, NextResponse } from 'next/server';
import { createAdditivePhase } from '@/lib/actions/preclassification-actions';
import { getCurrentUser } from '@/lib/server';

export async function POST(req: NextRequest) {
  try {
    console.log('📥 [API] Request recibido en /api/preclassification/phases/create-additive');
    
    // Autenticar usuario
    const user = await getCurrentUser();
    console.log('👤 [API] Usuario autenticado:', user?.id || 'NO AUTENTICADO');
    
    if (!user) {
      console.error('❌ [API] Usuario no autenticado');
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Extraer parámetros del body
    const body = await req.json();
    console.log('📦 [API] Body recibido:', body);
    
    const { projectId, sourcePhaseId, name, description } = body;

    // Validar parámetros requeridos
    if (!projectId || !sourcePhaseId || !name) {
      console.error('❌ [API] Faltan parámetros:', { projectId, sourcePhaseId, name });
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos: projectId, sourcePhaseId, name' },
        { status: 400 }
      );
    }

    console.log('🔗 [API] Llamando createAdditivePhase con:', { projectId, sourcePhaseId, name, description });

    // Llamar a la función del backend
    const result = await createAdditivePhase({
      projectId,
      sourcePhaseId,
      name,
      description
    });

    console.log('📊 [API] Resultado de createAdditivePhase:', { success: result.success });

    if (!result.success) {
      console.error('❌ [API] createAdditivePhase falló:', result);
      return NextResponse.json(result, { status: 400 });
    }

    console.log('✅ [API] Fase aditiva creada exitosamente:', result.data?.phase.id);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ [API] Error al crear fase aditiva:', msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
