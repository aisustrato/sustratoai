// 📍 app/api/article-notes/related/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getNotes } from '@/lib/actions/article-notes-actions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get('articleId') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const visibilityParam = searchParams.get('visibility') as 'public' | 'private' | null;
    const visibility = visibilityParam === 'public' || visibilityParam === 'private' ? visibilityParam : undefined;

    if (!articleId || !projectId) {
      return NextResponse.json({ success: false, error: 'Parámetros requeridos: articleId y projectId' }, { status: 400 });
    }

    const res = await getNotes({ articleId, projectId, visibility });
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: res.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
