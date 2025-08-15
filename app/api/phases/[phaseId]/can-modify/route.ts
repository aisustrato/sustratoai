import { NextResponse } from 'next/server';
import { canModifyDimensionsForPhase } from '@/lib/actions/batch-actions';

export async function GET(
  _req: Request,
  context: { params: { phaseId: string } }
) {
  try {
    const phaseId = context.params?.phaseId;
    if (!phaseId) {
      return NextResponse.json({ success: false, error: 'Falta phaseId' }, { status: 400 });
    }

    const result = await canModifyDimensionsForPhase(phaseId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error ?? 'Error al verificar fase' });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: `Error interno: ${msg}` }, { status: 500 });
  }
}
