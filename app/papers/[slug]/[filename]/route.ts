// 📍 app/papers/[slug]/[filename]/route.ts
// Sirve el PDF de un paper desde el propio dominio (sustrato.ai/papers/<slug>/paper-es.pdf
// o paper-en.pdf), en vez de apuntar citation_pdf_url directo a Zenodo — mismo
// patrón de proxy a Storage que ya usa app/api/papers/images/[filename]/route.ts.
// Storage.download() (no la URL pública directa) para poder fijar
// Content-Type/Content-Disposition explícitos y evitar cualquier redirect.

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/auth/session";
import { getPaperBySlugEitherLang } from "@/lib/papers/queries";

const CACHE_MAX_AGE = 86400; // 24 horas
const CACHE_STALE_WHILE_REVALIDATE = 604800; // 7 días

const PDF_FILENAMES = new Set(["paper-es.pdf", "paper-en.pdf"]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; filename: string }> },
) {
  const { slug, filename } = await params;

  if (!PDF_FILENAMES.has(filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const match = await getPaperBySlugEitherLang(slug);
  if (!match) {
    return new NextResponse("Paper not found", { status: 404 });
  }

  // Convención fija de storage (no la URL pública, que apunta de vuelta a esta
  // misma ruta): pdfs/<paper_id>/paper-es.pdf | paper-en.pdf.
  const storagePath = `pdfs/${match.paper.id}/${filename}`;

  const supabase = await createServerSupabaseClient();
  const { data: fileData, error } = await supabase.storage
    .from("paper-images")
    .download(storagePath);

  if (error || !fileData) {
    console.error(`[PapersPdfRoute] Download error for ${storagePath}:`, error);
    return new NextResponse("PDF not found in storage", { status: 404 });
  }

  const arrayBuffer = await fileData.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
