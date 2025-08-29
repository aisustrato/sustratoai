import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { articleId, versionType } = body as {
      articleId: string;
      versionType: 'original' | 'translated';
    };

    if (!articleId || !versionType) {
      return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
    }

    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no autenticado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('article_abstract_highlights')
      .select('*')
      .eq('article_id', articleId)
      .eq('user_id', user.id)
      .eq('version_type', versionType)
      .maybeSingle();

    if (error) {
      console.error('Error BD get highlights:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error inesperado API get highlights:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
