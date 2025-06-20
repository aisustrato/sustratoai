//. 📍 app/datos-maestros/dimensiones/components/DimensionCardRipple.tsx
"use client";

//#region [head] - 🏷️ IMPORTS 🏷️
import React from "react";
import { useRipple } from "@/components/ripple/RippleProvider";
import { useTheme } from "@/app/theme-provider";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { PenLine, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FullDimension } from "@/lib/actions/dimension-actions";

//#endregion ![head]

//#region [def] - 📦 TYPES 📦
interface DimensionCardProps {
  dimension: FullDimension;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  canManage: boolean;
  isBeingDeleted?: boolean;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export const DimensionCard: React.FC<DimensionCardProps> = ({
  dimension,
  onEdit,
  onDelete,
  onViewDetails,
  canManage,
  isBeingDeleted = false,
}) => {
	//#region [sub] - 🧰 HOOKS, STATE, EFFECTS & HELPER FUNCTIONS 🧰
  const { appColorTokens } = useTheme();
  const triggerRipple = useRipple();

  const tipoLabel =
    dimension.type === "finite" ? "Selección Múltiple" : "Respuesta Abierta";

    let cardColorVariant: ColorSchemeVariant = "neutral";
  if (dimension.type === "finite") cardColorVariant = "success";
  else if (dimension.type === "open") cardColorVariant = "accent";

  // Color para el ripple (accent background)
  const accentBg = appColorTokens?.accent?.bg || appColorTokens?.primary?.bg || "#4f46e5";

  // Handler para el click en la card
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    triggerRipple(e, accentBg, 10);
    onViewDetails();
  };
  //#endregion ![sub]

  //#region [render] - 🎨 RENDER SECTION 🎨
  return (
    <StandardCard
      className={cn(
        "flex flex-col h-full group relative",
        isBeingDeleted && "opacity-50 pointer-events-none"
      )}
      accentPlacement="left"
      colorScheme={cardColorVariant as StandardCardColorScheme}
      accentColorScheme={cardColorVariant as StandardCardColorScheme} // Derived from colorScheme
      disableShadowHover={true}
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
                preset="heading"
                size="md"
                weight="semibold"
                className="flex-grow mr-2"
                truncate
              >
                {dimension.name}
              </StandardText>
              <StandardBadge colorScheme={cardColorVariant} className="flex-shrink-0">
                {tipoLabel}
              </StandardBadge>
            </div>
            {canManage && (
              <div className="flex justify-end gap-1 mt-1">
                <StandardButton
                  size="sm"
                  styleType="ghost"
                  iconOnly
                  onClick={onEdit}
                  disabled={isBeingDeleted}
                  tooltip="Editar dimensión"
                >
                  <StandardIcon><PenLine className="h-5 w-5" /></StandardIcon>
                </StandardButton>
                <StandardButton
                  size="sm"
                  styleType="ghost"
                  iconOnly
                  colorScheme="danger"
                  onClick={onDelete}
                  disabled={isBeingDeleted}
                  tooltip="Eliminar dimensión"
                >
                  <StandardIcon><Trash2 className="h-5 w-5" /></StandardIcon>
                </StandardButton>
              </div>
            )}
          </div>
        </StandardCard.Header>
        {/* ... resto del contenido de la card ... */}
      </div>
    </StandardCard>
  );
  //#endregion ![render]
};
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Export is part of the component declaration
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Considerar si este componente sigue siendo necesario o si DimensionCard.tsx lo reemplaza.
// Si se mantiene, sincronizar funcionalidades con DimensionCard.tsx (mostrar opciones, preguntas, ejemplos, etc.).
//#endregion ![todo]
