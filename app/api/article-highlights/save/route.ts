import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { articleId, projectId, versionType, highlightedContent, highlightsMetadata } = body as {
      articleId: string;
      projectId: string;
      versionType: 'original' | 'translated';
      highlightedContent: string;
      highlightsMetadata: Array<{
        id: string;
        text: string;
        startOffset: number;
        endOffset: number;
        timestamp: string;
      }>;
    };

    if (!articleId || !projectId || !versionType || !highlightedContent || !Array.isArray(highlightsMetadata)) {
      return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
    }

    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuario no autenticado' }, { status: 401 });
    }

    const row: Database['public']['Tables']['article_abstract_highlights']['Insert'] = {
      article_id: articleId,
      user_id: user.id,
      project_id: projectId,
      version_type: versionType,
      highlighted_content: highlightedContent,
      highlights_metadata: highlightsMetadata as unknown as Database['public']['Tables']['article_abstract_highlights']['Row']['highlights_metadata'],
    };

    const { data, error } = await supabase
      .from('article_abstract_highlights')
      .upsert(row, { onConflict: 'article_id,user_id,version_type' })
      .select()
      .single();

    if (error) {
      console.error('Error BD save highlights:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error inesperado API save highlights:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
