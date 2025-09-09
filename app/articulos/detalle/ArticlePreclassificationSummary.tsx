"use client";

import React from "react";
import { StandardCard, StandardCardHeader, StandardCardTitle, StandardCardSubtitle, StandardCardContent } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardTooltip } from "@/components/ui/StandardTooltip";
import type { Database } from "@/lib/database.types";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { DimensionDisplay } from "@/app/articulos/preclasificacion/[batchId]/components/DimensionDisplay";
import type { ClassificationReview } from "@/lib/types/preclassification-types";

// Tipos locales (evitamos importar tipos del servidor directamente)

export type DimensionView = {
  id: string;
  name: string;
  type: string;
  options: Array<string | { value: string | number; label: string }>;
  icon?: string | null;
  optionEmoticons?: Record<string, string | null>;
};

export type PhaseSummaryView = {
  phase: { id: string; name: string | null; phase_number: number | null };
  batch: { id: string; batch_number: number | null; status: Database["public"]["Enums"]["batch_preclass_status"] | null; assigned_member_name?: string | null };
  item_id: string;
  dimensions: DimensionView[];
  classifications: Record<string, ClassificationReview[]>; // por dimension_id
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
                    return (
                      <div key={dim.id} className="rounded-md border border-black/5 dark:border-white/10 p-3">
                        <DimensionDisplay
                          variant="card"
                          dimensionName={dim.name}
                          review={latest}
                          dimensionIcon={dim.icon}
                          optionEmoticons={dim.optionEmoticons}
                        />
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

