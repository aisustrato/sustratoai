"use client";

import React, { useMemo } from "react";
import { useWindowSize } from "@/lib/hooks/useWindowSize";
import { useLayout } from '@/app/contexts/layout-context';
import { StandardSphereGrid, type SphereItemData } from "@/components/ui/StandardSphereGrid";

interface BatchVisualizationProps {
  items: SphereItemData[];
  isLoading: boolean;
  containerWidth?: number; // Prop opcional para anular el cálculo
  containerHeight?: number;
  title?: string;
}

export const BatchVisualization: React.FC<BatchVisualizationProps> = ({
  items,
  isLoading,
  containerWidth: widthProp,
  containerHeight: heightProp,
  title = "Visualización de Lotes"
}) => {
  const { width: windowWidth } = useWindowSize();
  const { sidebarWidth, layoutGap, globalXPadding } = useLayout();

  // Calcula el ancho basado en el layout, pero solo si no se proporciona como prop.
  const calculatedWidth = useMemo(() => {
    if (widthProp) return widthProp;
    if (!windowWidth) return 0;
    return windowWidth - sidebarWidth - layoutGap - (globalXPadding * 2);
  }, [windowWidth, sidebarWidth, layoutGap, globalXPadding, widthProp]);

  const finalHeight = heightProp || 500; // Usa la prop o un valor por defecto.

  return (
    <div style={{ height: `${finalHeight}px` }} className="w-full">
      {calculatedWidth > 0 && (
        <StandardSphereGrid
          items={items}
          containerWidth={calculatedWidth}
          containerHeight={finalHeight}
          groupByKeyGroup
          forceBadge={true}
          title={title}
          isLoading={isLoading}
          loadingMessage="Cargando visualización..."
          emptyStateText="No hay datos para mostrar."
        />
      )}
    </div>
  );
};