// 📍 app/robots.ts
// Generación dinámica de robots.txt

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/papers", "/papers/*", "/api/papers", "/api/papers/*"],
        disallow: [
          "/api/",
          "/app/",
          "/articulos/",
          "/cognetica_old/",
          "/datos-maestros/",
          "/herramientas/",
          "/personal/",
          "/sandbox/",
          "/showroom/",
        ],
      },
      // AI crawlers explícitamente permitidos para la DMZ
      {
        userAgent: "GPTBot",
        allow: ["/papers", "/papers/*", "/api/papers", "/api/papers/*"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/papers", "/papers/*", "/api/papers", "/api/papers/*"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/papers", "/papers/*", "/api/papers", "/api/papers/*"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/papers", "/papers/*", "/api/papers", "/api/papers/*"],
      },
      {
        userAgent: "CCBot",
        allow: ["/papers", "/papers/*"],
      },
    ],
    sitemap: "https://sustrato.ai/sitemap.xml",
  };
}
