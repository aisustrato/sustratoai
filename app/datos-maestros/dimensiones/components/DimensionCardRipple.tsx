"use client";

import React from "react";
import { useRipple } from "@/components/ripple/RippleProvider";
import { useTheme } from "@/app/theme-provider";
import { ProCard } from "@/components/ui/pro-card";
import { Text } from "@/components/ui/text";
import { BadgeCustom } from "@/components/ui/badge-custom";
import { CustomButton } from "@/components/ui/custom-button";
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
    <ProCard
      className={cn(
        "flex flex-col h-full group relative",
        isBeingDeleted && "opacity-50 pointer-events-none"
      )}
      border="left"
      color={cardColorVariant as any}
      shadow="md"
    >
      {isBeingDeleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/50 z-10">
          <span>Cargando...</span>
        </div>
      )}
      <div
        onClick={handleCardClick}
        className="cursor-pointer flex-grow flex flex-col p-4"
        tabIndex={0}
        role="button"
        aria-label={`Ver detalles de ${dimension.name}`}
      >
        <ProCard.Header className="p-0 mb-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between">
              <Text
                variant="heading"
                size="md"
                weight="semibold"
                className="flex-grow mr-2"
                truncate
              >
                {dimension.name}
              </Text>
              <BadgeCustom variant={cardColorVariant} className="flex-shrink-0">
                {tipoLabel}
              </BadgeCustom>
            </div>
            {canManage && (
              <div className="flex justify-end gap-1 mt-1">
                <CustomButton
                  size="sm"
                  variant="ghost"
                  iconOnly
                  onClick={onEdit}
                  disabled={isBeingDeleted}
                  tooltip="Editar dimensión"
                >
                  <PenLine className="h-5 w-5" />
                </CustomButton>
                <CustomButton
                  size="sm"
                  variant="ghost"
                  iconOnly
                  color="danger"
                  onClick={onDelete}
                  disabled={isBeingDeleted}
                  tooltip="Eliminar dimensión"
                >
                  <Trash2 className="h-5 w-5" />
                </CustomButton>
              </div>
            )}
          </div>
        </ProCard.Header>
        {/* ... resto del contenido de la card ... */}
      </div>
    </ProCard>
  );
};
