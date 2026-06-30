// 📍 app/api/papers/route.ts
// GET /api/papers - Lista de papers publicados (JSON)

import { NextResponse } from "next/server";
import { getPublishedPapers } from "@/lib/papers/queries";

export async function GET() {
  try {
    const papers = await getPublishedPapers();

    const response = {
      count: papers.length,
      papers: papers.map((paper) => ({
        slug: paper.slug,
        title: paper.title,
        subtitle: paper.subtitle,
        abstract_es: paper.abstract_es,
        authors: paper.authors,
        published_at: paper.published_at,
        doi: paper.doi,
        keywords: paper.keywords,
        url: `https://sustrato.ai/papers/${paper.slug}`,
        api_url: `https://sustrato.ai/api/papers/${paper.slug}`,
      })),
    };

    return NextResponse.json(response, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[GET /api/papers] Error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
