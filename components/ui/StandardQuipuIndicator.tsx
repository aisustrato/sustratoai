"use client";

import React from "react";
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

const QUIPU_MAP: Record<QuipuStatus, { 
  emoji: string; 
  label: string; 
  desc: string;
  color: string;
}> = {
  pending: { 
    emoji: "🥚", 
    label: "Semilla", 
    desc: "Estado latente (F0). Esperando proceso.",
    color: "text-gray-400"
  },
  review_pending: { 
    emoji: "⏳", 
    label: "En Proceso", 
    desc: "IA ha clasificado. Esperando validación humana.",
    color: "text-blue-400"
  },
  validated: { 
    emoji: "✅", 
    label: "Validado", 
    desc: "Sincronización exitosa en Iteración 1.",
    color: "text-green-500"
  },
  reconciliation_pending: { 
    emoji: "🟣", 
    label: "En Reconciliación", 
    desc: "Discrepancia detectada. El sistema busca coherencia.",
    color: "text-purple-500"
  },
  reconciled: { 
    emoji: "🎯", 
    label: "Reconciliado", 
    desc: "Consenso alcanzado tras iteración profunda.",
    color: "text-blue-600"
  },
  disputed: { 
    emoji: "⚡", 
    label: "Disputado", 
    desc: "Divergencia no resuelta. Requiere arbitraje fractal.",
    color: "text-red-500"
  }
};

// Override específico para Iteración 2 (Humano rechaza IA, esperando a IA)
const ITER2_OVERRIDE = {
  emoji: "🔄",
  label: "Divergencia",
  desc: "Humano ha marcado discrepancia. Esperando respuesta de IA.",
  color: "text-yellow-500"
};

export function StandardQuipuIndicator({
  status,
  iteration = 1,
  className,
  showTooltip = true,
  size = 'md'
}: StandardQuipuIndicatorProps) {
  
  let config = QUIPU_MAP[status] || QUIPU_MAP.pending;

  // Lógica especial del lenguaje Quipu
  if (status === 'reconciliation_pending') {
    if (iteration === 2) {
      config = ITER2_OVERRIDE;
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
              Iteración {iteration}
            </div>
          )}
        </div>
      }
      trigger={content}
    />
  );
}
