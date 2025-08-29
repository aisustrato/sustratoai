"use client";

import React from "react";
import { StandardCard, StandardCardHeader, StandardCardTitle, StandardCardSubtitle, StandardCardContent } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardTooltip } from "@/components/ui/StandardTooltip";
import type { Database } from "@/lib/database.types";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

// Tipos locales (evitamos importar tipos del servidor directamente)
export type ClassificationReviewView = {
  reviewer_type: "ai" | "human";
  reviewer_id: string | null;
  iteration: number | null;
  value: string | null;
  confidence: number | null; // 1,2,3 o null
  rationale: string | null;
};

export type DimensionView = {
  id: string;
  name: string;
  type: string;
  options: Array<string | { value: string | number; label: string }>;
};

export type PhaseSummaryView = {
  phase: { id: string; name: string | null; phase_number: number | null };
  batch: { id: string; batch_number: number | null; status: Database["public"]["Enums"]["batch_preclass_status"] | null; assigned_member_name?: string | null };
  item_id: string;
  dimensions: DimensionView[];
  classifications: Record<string, ClassificationReviewView[]>; // por dimension_id
};

export default function ArticlePreclassificationSummary({ summaries }: { summaries: PhaseSummaryView[] }) {
  if (!summaries || summaries.length === 0) return null;

  const phaseAccentFor = (n?: number | null): ColorSchemeVariant => {
    const schemes = [
      "accent",
      "primary",
      "success",
      "warning",
      "secondary",
      "danger",
      "neutral",
    ] as const;
    if (!n || n <= 0) return schemes[0];
    return schemes[(n - 1) % schemes.length];
  };

  const confidenceToBadge = (score?: number | null): { scheme: ColorSchemeVariant; label: string } => {
    if (score === 3) return { scheme: "success", label: "Alta" };
    if (score === 2) return { scheme: "warning", label: "Media" };
    if (score === 1) return { scheme: "danger", label: "Baja" };
    return { scheme: "neutral", label: "—" };
  };

  return (
    <div className="space-y-3">
      {summaries
        .sort((a, b) => (a.phase.phase_number ?? 0) - (b.phase.phase_number ?? 0))
        .map((s) => {
          const accent = phaseAccentFor(s.phase.phase_number);
          return (
            <StandardCard key={s.item_id} colorScheme="neutral" styleType="subtle" accentPlacement="left" accentColorScheme={accent} shadow="md">
              <StandardCardHeader>
                <StandardCardTitle>
                  <div className="flex items-center justify-between gap-2">
                    <StandardText size="md" weight="semibold">
                      {s.phase.name || `Fase ${s.phase.phase_number ?? "?"}`}
                    </StandardText>
                    <StandardTooltip
                      content={s.batch.assigned_member_name ? `Asignado a: ${s.batch.assigned_member_name}` : "Sin asignación"}
                      trigger={
                        <StandardBadge colorScheme="neutral" styleType="subtle" size="sm">
                          Lote #{s.batch.batch_number ?? "?"}
                        </StandardBadge>
                      }
                      colorScheme="neutral"
                      styleType="solid"
                      side="top"
                      align="center"
                    />
                  </div>
                </StandardCardTitle>
                {s.batch.status && (
                  <StandardCardSubtitle>
                    <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
                      Estado lote: {String(s.batch.status)}
                    </StandardText>
                  </StandardCardSubtitle>
                )}
              </StandardCardHeader>

              <StandardCardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {s.dimensions.map((dim) => {
                    const reviews = s.classifications[dim.id] || [];
                    const latest = reviews[0];
                    const conf = confidenceToBadge(latest?.confidence ?? null);

                    return (
                      <div key={dim.id} className="rounded-md border border-black/5 dark:border-white/10 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <StandardText size="sm" weight="medium" className="opacity-80">
                            {dim.name}
                          </StandardText>
                          <StandardBadge colorScheme={conf.scheme} styleType="subtle" size="sm">
                            Confianza: {conf.label}
                          </StandardBadge>
                        </div>
                        <div className="mt-1">
                          <StandardText size="lg" colorShade="pure" weight="semibold" colorScheme="primary">
                            {latest?.value ?? "Sin clasificación"}
                          </StandardText>
                        </div>
                        {latest?.rationale && (
                          <div className="mt-1">
                            <StandardText size="sm" colorScheme="neutral" colorShade="subtle" className="line-clamp-3">
                              {latest.rationale}
                            </StandardText>
                          </div>
                        )}
                        {latest && (
                          <div className="mt-2">
                            <StandardText size="xs" colorScheme="neutral" colorShade="subtle">
                              Por: {latest.reviewer_type === "ai" ? "IA" : "Humano"}
                              {typeof latest.iteration === "number" ? ` • Iteración ${latest.iteration}` : ""}
                            </StandardText>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </StandardCardContent>
            </StandardCard>
          );
        })}
    </div>
  );
}
