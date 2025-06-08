"use client";

import React from "react";
import { useRipple } from "@/components/ripple/RippleProvider";
import { useTheme } from "@/app/theme-provider";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText"; // Changed import for Text
import { BadgeCustom } from "@/components/ui/badge-custom";
import { StandardButton } from "@/components/ui/StandardButton"; // Changed import
import { PenLine, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FullDimension } from "@/lib/actions/dimension-actions";
import type { BadgeVariant } from "@/lib/theme/components/badge-tokens";

interface DimensionCardProps {
  dimension: FullDimension;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  canManage: boolean;
  isBeingDeleted?: boolean;
}

export const DimensionCard: React.FC<DimensionCardProps> = ({
  dimension,
  onEdit,
  onDelete,
  onViewDetails,
  canManage,
  isBeingDeleted = false,
}) => {
  const { appColorTokens, mode } = useTheme();
  const triggerRipple = useRipple();

  const tipoLabel =
    dimension.type === "finite" ? "Selección Múltiple" : "Respuesta Abierta";

  let cardColorVariant: BadgeVariant = "neutral";
  if (dimension.type === "finite") cardColorVariant = "success";
  else if (dimension.type === "open") cardColorVariant = "info";

  // Color para el ripple (accent background)
  const accentBg = appColorTokens?.accent?.bg || appColorTokens?.primary?.bg || "#4f46e5";

  // Handler para el click en la card
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    triggerRipple(e, accentBg, 10);
    onViewDetails();
  };

  return (
    <StandardCard
      className={cn(
        "flex flex-col h-full group relative",
        isBeingDeleted && "opacity-50 pointer-events-none"
      )}
      accentPlacement="left"
      colorScheme={cardColorVariant as StandardCardColorScheme}
      accentColorScheme={cardColorVariant as StandardCardColorScheme} // Derived from colorScheme
      shadow="md"
      styleType="subtle"
      hasOutline={false} // border="left" implies no full outline
      onCardClick={handleCardClick} // Moved onClick here
    >
      {isBeingDeleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/50 z-10">
          <span>Cargando...</span>
        </div>
      )}
      {/* El div se mantiene por estructura, pero sin el onClick */}
      <div
        className="cursor-pointer flex-grow flex flex-col p-4" // onClick removed
        tabIndex={0}
        role="button"
        aria-label={`Ver detalles de ${dimension.name}`}
      >
        <StandardCard.Header className="p-0 mb-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between">
              <StandardText
                variant="heading"
                size="md"
                weight="semibold"
                className="flex-grow mr-2"
                truncate
              >
                {dimension.name}
              </StandardText>
              <BadgeCustom variant={cardColorVariant} className="flex-shrink-0">
                {tipoLabel}
              </BadgeCustom>
            </div>
            {canManage && (
              <div className="flex justify-end gap-1 mt-1">
                <StandardButton
                  size="sm"
                  styleType="ghost" // Mapped variant to styleType
                  iconOnly
                  onClick={onEdit}
                  disabled={isBeingDeleted}
                  tooltip="Editar dimensión"
                  colorScheme="neutral" // Added default colorScheme
                >
                  <PenLine className="h-5 w-5" />
                </StandardButton>
                <StandardButton
                  size="sm"
                  styleType="ghost" // Mapped variant to styleType
                  iconOnly
                  colorScheme="danger" // Mapped color to colorScheme
                  onClick={onDelete}
                  disabled={isBeingDeleted}
                  tooltip="Eliminar dimensión"
                >
                  <Trash2 className="h-5 w-5" />
                </StandardButton>
              </div>
            )}
          </div>
        </StandardCard.Header>
        {/* ... resto del contenido de la card ... */}
      </div>
    </StandardCard>
  );
};
