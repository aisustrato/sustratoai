// 📍 app/sitemap.ts
// Generación dinámica de sitemap.xml

import type { MetadataRoute } from "next";
import { getAllPublishedPapersForSitemap } from "@/lib/papers/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const papers = await getAllPublishedPapersForSitemap();
  const base = "https://sustrato.ai";

  return [
    {
      url: `${base}/papers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...papers.map((p) => ({
      url: `${base}/papers/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
