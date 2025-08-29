// 📍 app/api/article-notes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createArticleNote } from '@/lib/actions/article-notes-actions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId,
      articleId,
      title,
      noteContent,
      visibility,
    } = body || {};

    if (!projectId || !articleId || typeof noteContent !== 'string' || !visibility) {
      return NextResponse.json(
        { success: false, error: 'Parámetros requeridos: projectId, articleId, noteContent, visibility' },
        { status: 400 }
      );
    }

    const res = await createArticleNote({
      projectId,
      articleId,
      title,
      noteContent,
      visibility,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: res.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
