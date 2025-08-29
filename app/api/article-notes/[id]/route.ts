// 📍 app/api/article-notes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateArticleNote, deleteArticleNote } from '@/lib/actions/article-notes-actions';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const noteId = params.id;
    if (!noteId) {
      return NextResponse.json({ success: false, error: 'Parámetro requerido: id' }, { status: 400 });
    }

    const body = await req.json();
    const { title, noteContent, visibility } = body || {};

    const res = await updateArticleNote({
      noteId,
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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const noteId = params.id;
    if (!noteId) {
      return NextResponse.json({ success: false, error: 'Parámetro requerido: id' }, { status: 400 });
    }

    const res = await deleteArticleNote(noteId);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: res.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
