// 📍 app/api/cognetica/artifacts/route.ts
// 🎯 PROPÓSITO: API para obtener lista de artefactos de un proyecto

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar membresía del proyecto
    const { data: membership } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'No tienes acceso a este proyecto' },
        { status: 403 }
      );
    }

    // Obtener artefactos del proyecto
    console.log('🔍 [Artifacts API] Buscando artefactos para proyecto:', projectId);
    
    const { data: artifacts, error: artifactsError } = await supabase
      .from('cog_artifacts')
      .select('id, title, type, description, created_at, duration_seconds')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    console.log('📦 [Artifacts API] Resultado:', {
      count: artifacts?.length || 0,
      error: artifactsError,
      artifacts: artifacts?.map(a => ({ id: a.id, title: a.title }))
    });

    if (artifactsError) {
      console.error('❌ [Artifacts API] Error obteniendo artefactos:', artifactsError);
      return NextResponse.json(
        { error: 'Error al obtener artefactos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      artifacts: artifacts || [],
      count: artifacts?.length || 0,
    });

  } catch (error) {
    console.error('Error en API artifacts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
