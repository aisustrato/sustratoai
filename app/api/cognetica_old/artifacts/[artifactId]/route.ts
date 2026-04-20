// 📍 app/api/cognetica_old/artifacts/[artifactId]/route.ts
// 🎯 PROPÓSITO: Obtener artefacto completo con metadata de Micelio

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { artifactId } = await params;

    const { data: artifact, error } = await supabase
      .from('cog_artifacts')
      .select('id, title, type, source_metadata')
      .eq('id', artifactId)
      .single();

    if (error || !artifact) {
      return NextResponse.json(
        { success: false, error: 'Artefacto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(artifact);
  } catch (error) {
    console.error('❌ [GET /api/cognetica_old/artifacts] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener artefacto' },
      { status: 500 }
    );
  }
}
