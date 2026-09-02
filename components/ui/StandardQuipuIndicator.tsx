"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { StandardTooltip } from "./StandardTooltip";
import { cn } from "@/lib/utils";

export type QuipuStatus = 
  | 'pending' 
  | 'review_pending' 
  | 'validated' 
  | 'reconciliation_pending' 
  | 'reconciled' 
  | 'disputed';

export interface StandardQuipuIndicatorProps {
  status: QuipuStatus;
  iteration?: number;
  reviewerType?: 'ai' | 'human';
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

type QuipuTranslator = ReturnType<typeof useTranslations<"designSystem.quipuIndicator">>;

const makeQuipuMap = (
  t: QuipuTranslator,
): Record<QuipuStatus, { emoji: string; label: string; desc: string; color: string }> => ({
  pending: {
    emoji: "🥚",
    label: t("pendingLabel"),
    desc: t("pendingDesc"),
    color: "text-gray-400"
  },
  review_pending: {
    emoji: "⏳",
    label: t("reviewPendingLabel"),
    desc: t("reviewPendingDesc"),
    color: "text-blue-400"
  },
  validated: {
    emoji: "✅",
    label: t("validatedLabel"),
    desc: t("validatedDesc"),
    color: "text-green-500"
  },
  reconciliation_pending: {
    emoji: "🟣",
    label: t("reconciliationPendingLabel"),
    desc: t("reconciliationPendingDesc"),
    color: "text-purple-500"
  },
  reconciled: {
    emoji: "🎯",
    label: t("reconciledLabel"),
    desc: t("reconciledDesc"),
    color: "text-blue-600"
  },
  disputed: {
    emoji: "⚡",
    label: t("disputedLabel"),
    desc: t("disputedDesc"),
    color: "text-red-500"
  }
});

// Override específico para Iteración 2 (Humano rechaza IA, esperando a IA)
const makeIter2Override = (t: QuipuTranslator) => ({
  emoji: "🔄",
  label: t("iter2OverrideLabel"),
  desc: t("iter2OverrideDesc"),
  color: "text-yellow-500"
});

export function StandardQuipuIndicator({
  status,
  iteration = 1,
  className,
  showTooltip = true,
  size = 'md'
}: StandardQuipuIndicatorProps) {
  const t = useTranslations("designSystem.quipuIndicator");
  const quipuMap = useMemo(() => makeQuipuMap(t), [t]);
  const iter2Override = useMemo(() => makeIter2Override(t), [t]);

  let config = quipuMap[status] || quipuMap.pending;

  // Lógica especial del lenguaje Quipu
  if (status === 'reconciliation_pending') {
    if (iteration === 2) {
      config = iter2Override;
    } else if (iteration >= 3) {
      // Mantiene el mapa original (🟣)
    }
  }

  // Tamaño
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl"
  };

  const content = (
    <span 
      className={cn(
        "font-emoji cursor-help select-none transition-transform hover:scale-110 inline-block",
        config.color,
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label={config.label}
    >
      {config.emoji}
    </span>
  );

  if (!showTooltip) return content;

  return (
    <StandardTooltip
      content={
        <div className="text-center">
          <div className="font-bold text-base mb-1">{config.emoji} {config.label}</div>
          <div className="text-xs opacity-80 max-w-[200px]">{config.desc}</div>
          {iteration > 0 && (
            <div className="text-[10px] mt-2 uppercase tracking-wider opacity-50 border-t border-white/20 pt-1">
              {t("iterationLabel", { iteration })}
            </div>
          )}
        </div>
      }
      trigger={content}
    />
  );
}
