// app/articulos/detalle/ArticlePreclassificationSection.tsx
import { StandardCard, StandardCardHeader, StandardCardTitle, StandardCardSubtitle, StandardCardContent } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { getPreclassificationByArticleId } from "@/lib/actions/preclassification-actions";
import { getBatchesForPhaseDisplay } from "@/lib/actions/batch-actions";
import ArticlePreclassificationSummary, { type PhaseSummaryView } from "./ArticlePreclassificationSummary";

export default async function ArticlePreclassificationSection({ articleId }: { articleId: string }) {
  if (!articleId) return null;

  const res = await getPreclassificationByArticleId(articleId);
  if (!res.success) {
    return (
      <StandardCard colorScheme="danger" styleType="subtle" shadow="sm">
        <StandardCardHeader>
          <StandardCardTitle>
            <StandardText size="md" weight="semibold">Preclasificación</StandardText>
          </StandardCardTitle>
          <StandardCardSubtitle>
            <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
              Error al cargar datos: {res.error}
            </StandardText>
          </StandardCardSubtitle>
        </StandardCardHeader>
      </StandardCard>
    );
  }

  const summaries = (res.data || []) as PhaseSummaryView[];

  // Construir mapa batchId -> assigned_member_name obteniendo datos por cada fase
  const uniquePhaseIds = Array.from(new Set((summaries || []).map((s) => s.phase?.id).filter((id): id is string => Boolean(id))));

  type PhaseBatch = { id: string; assigned_member_name?: string | null };
  const batchAssignedMap = new Map<string, string | null>();

  if (uniquePhaseIds.length > 0) {
    const phaseBatchResults = await Promise.all(uniquePhaseIds.map((pid) => getBatchesForPhaseDisplay(pid)));
    for (const r of phaseBatchResults) {
      if (r && r.success && Array.isArray(r.data)) {
        for (const b of r.data as PhaseBatch[]) {
          if (b?.id) batchAssignedMap.set(b.id, b.assigned_member_name ?? null);
        }
      }
    }
  }

  const enrichedSummaries: PhaseSummaryView[] = summaries.map((s) => ({
    ...s,
    batch: {
      ...s.batch,
      assigned_member_name: batchAssignedMap.get(s.batch.id) ?? null,
    },
  }));
  if (!summaries || summaries.length === 0) {
    return (
      <StandardCard colorScheme="neutral" styleType="subtle" shadow="sm">
        <StandardCardHeader>
          <StandardCardTitle>
            <StandardText size="md" weight="semibold">Preclasificación</StandardText>
          </StandardCardTitle>
          <StandardCardSubtitle>
            <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
              No hay datos de preclasificación aún para este artículo.
            </StandardText>
          </StandardCardSubtitle>
        </StandardCardHeader>
      </StandardCard>
    );
  }

  return (
    <StandardCard colorScheme="neutral" styleType="subtle" shadow="lg">
      <StandardCardHeader>
        <StandardCardTitle>
          <StandardText size="md" weight="semibold">Preclasificación</StandardText>
        </StandardCardTitle>
        <StandardCardSubtitle>
          <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
            Clasificaciones por dimensiones y revisores, agrupadas por fase.
          </StandardText>
        </StandardCardSubtitle>
      </StandardCardHeader>
      <StandardCardContent>
        {/* Cliente: tarjetas por fase y dimensiones */}
        <ArticlePreclassificationSummary summaries={enrichedSummaries} />
      </StandardCardContent>
    </StandardCard>
  );
}
