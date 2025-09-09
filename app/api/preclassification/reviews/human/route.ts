import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/server";
import { submitHumanReview } from "@/lib/actions/preclassification-actions";
import type { SubmitHumanReviewPayload } from "@/lib/types/preclassification-types";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const payload: Partial<SubmitHumanReviewPayload> = {
      article_batch_item_id: body?.article_batch_item_id,
      dimension_id: body?.dimension_id,
      human_value: body?.human_value,
      human_option_id: body?.human_option_id ?? null,
      human_confidence: typeof body?.human_confidence === 'string' ? Number(body?.human_confidence) : body?.human_confidence,
      human_rationale: body?.human_rationale ?? "",
    };

    if (
      !payload.article_batch_item_id ||
      !payload.dimension_id ||
      !payload.human_value ||
      typeof payload.human_confidence !== 'number' ||
      ![1, 2, 3].includes(payload.human_confidence)
    ) {
      return NextResponse.json({ error: "Parámetros inválidos." }, { status: 400 });
    }

    const result = await submitHumanReview(payload as SubmitHumanReviewPayload);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Error guardando revisión" }, { status: 400 });
    }

    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: `Error interno del servidor: ${message}` }, { status: 500 });
  }
}
