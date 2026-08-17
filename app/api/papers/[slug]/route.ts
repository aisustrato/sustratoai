// 📍 app/api/papers/[slug]/route.ts
// GET /api/papers/[slug] - Paper individual (JSON)

import { NextResponse } from "next/server";
import { getPaperBySlug } from "@/lib/papers/queries";
import type { PaperPublicData } from "@/lib/papers/types";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const paper = await getPaperBySlug(slug);

    if (!paper) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Excluir campos internos (id, created_at, is_published)
    const publicData: PaperPublicData = {
      slug: paper.slug,
      title: paper.title,
      title_en: paper.title_en,
      subtitle: paper.subtitle,
      subtitle_en: paper.subtitle_en,
      abstract_es: paper.abstract_es,
      abstract_en: paper.abstract_en,
      authors: paper.authors,
      keywords: paper.keywords,
      keywords_en: paper.keywords_en,
      content_md: paper.content_md,
      content_md_en: paper.content_md_en,
      doi: paper.doi,
      zenodo_url: paper.zenodo_url,
      pdf_url: paper.pdf_url,
      language: paper.language,
      published_at: paper.published_at,
      version: paper.version,
      citation_apa: paper.citation_apa,
      license: paper.license,
      updated_at: paper.updated_at,
    };

    return NextResponse.json(publicData, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error(`[GET /api/papers/[slug]] Error:`, error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
