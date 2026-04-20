/**
 * POST /api/cognetica/upload
 *
 * Handler de ingesta multipart para Cognética Forense v2 (Oleada 1).
 * Delega la lógica de negocio al Server Action `ingestaArtefacto`
 * (ver `/lib/actions/cognetica_forense_actions.ts`, contrato de referencia).
 *
 * Stub de Oleada 1 — retorna 501 hasta que la implementación esté lista.
 */

import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: "NOT_IMPLEMENTED",
      message:
        "Ingesta de Cognética Forense v2 pendiente de implementar (Oleada 1).",
    },
    { status: 501 }
  );
}
