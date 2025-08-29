// 📍 app/api/article-notes/by-batch-item/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getArticleNotesInfoByBatchItem } from '@/lib/actions/article-notes-actions';

const ts = () => new Date().toISOString();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchItemId = searchParams.get('batchItemId');
    const start = performance.now();
    console.log(`[${ts()}] [api/article-notes/by-batch-item] GET inicio`, { batchItemId });

    if (!batchItemId) {
      console.warn(`[${ts()}] [api/article-notes/by-batch-item] Falta batchItemId`);
      return NextResponse.json(
        { success: false, error: 'Parámetro requerido: batchItemId' },
        { status: 400 }
      );
    }

    const res = await getArticleNotesInfoByBatchItem(batchItemId);
    if (!res.success) {
      const ms = Math.round(performance.now() - start);
      console.error(`[${ts()}] [api/article-notes/by-batch-item] Error server action`, { batchItemId, ms, error: res.error });
      return NextResponse.json({ success: false, error: res.error }, { status: 500 });
    }

    const ms = Math.round(performance.now() - start);
    console.log(`[${ts()}] [api/article-notes/by-batch-item] GET fin`, { batchItemId, ms, hasNotes: Boolean(res.data?.hasNotes), noteCount: res.data?.noteCount ?? 0 });
    return NextResponse.json({ success: true, data: res.data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${ts()}] [api/article-notes/by-batch-item] Excepción`, { error: message });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
