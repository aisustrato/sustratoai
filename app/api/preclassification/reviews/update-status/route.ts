import { NextResponse } from "next/server";
import { updateDimensionStatus } from "@/lib/actions/preclassification-actions";
import { createSupabaseServerClient } from "@/lib/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const articleBatchItemId = body?.articleBatchItemId as string | undefined;
    const dimensionId = body?.dimensionId as string | undefined;
    const status = body?.status as 'validated' | 'reconciled' | 'disputed' | 'review_pending' | 'reconciliation_pending' | undefined;

    if (!articleBatchItemId || !dimensionId || !status) {
      return NextResponse.json({ 
        error: "Parámetros inválidos: 'articleBatchItemId', 'dimensionId' y 'status' son requeridos." 
      }, { status: 400 });
    }

    // Validar que el status sea uno de los permitidos
    const validStatuses = ['validated', 'reconciled', 'disputed', 'review_pending', 'reconciliation_pending'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Status inválido. Debe ser uno de: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    const result = await updateDimensionStatus(articleBatchItemId, dimensionId, status);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Error actualizando status" }, { status: 400 });
    }

    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error('❌ [API update-status] Error:', error);
    return NextResponse.json({ error: `Error interno del servidor: ${message}` }, { status: 500 });
  }
}
