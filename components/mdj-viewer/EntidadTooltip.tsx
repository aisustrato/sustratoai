// 📍 components/mdj-viewer/EntidadTooltip.tsx
// 'use client' — Tooltip read-only para menciones de entidad (autor/pensador).
// Hover → ficha de la entidad (nombre + descripción) + link a sus artefactos.
// No tiene editar/borrar: crear/editar/borrar llega en una fase posterior.

"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AnotacionMarca } from "./AnotacionMarca";
import { StandardTooltip } from "@/components/ui/StandardTooltip";
import { StandardText } from "@/components/ui/StandardText";
import { ExternalLink } from "lucide-react";
import type { Anotacion } from "@/lib/mdj/types";

interface EntidadTooltipProps {
  anotacion: Anotacion;
  activa?: boolean;
  /** Contenido del trigger (texto formateado). Si no se pasa, usa anotacion.fragmento */
  children?: ReactNode;
}

export function EntidadTooltip({ anotacion, activa, children }: EntidadTooltipProps) {
  const href = anotacion.entidad_id
    ? `/cognetica/entidades/pensadores/${anotacion.entidad_id}`
    : null;

  const tooltipContent = (
    <div className="space-y-2 min-w-[200px] max-w-xs">
      <StandardText size="sm" weight="semibold" colorScheme="primary">
        {anotacion.fragmento}
      </StandardText>
      {anotacion.nota_texto ? (
        <StandardText size="xs" colorScheme="neutral" colorShade="subtle" className="leading-relaxed">
          {anotacion.nota_texto}
        </StandardText>
      ) : null}
      {href ? (
        <div className="pt-1 border-t border-neutral-200 dark:border-neutral-700">
          <Link href={href} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <ExternalLink size={12} />
            Ver artefactos del autor
          </Link>
        </div>
      ) : null}
    </div>
  );

  return (
    <StandardTooltip
      trigger={
        <AnotacionMarca colorScheme="primary" activa={activa}>
          {children ?? anotacion.fragmento}
        </AnotacionMarca>
      }
      content={tooltipContent}
      colorScheme="primary"
      side="bottom"
      align="center"
      sideOffset={8}
      delayDuration={300}
    />
  );
}
