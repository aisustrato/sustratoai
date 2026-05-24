// 📍 components/mdj-viewer/FraseNotableTooltip.tsx
// 'use client' — Tooltip para frases notables con botón Borrar
// Hover → tooltip accent + fragmento + Borrar
// Borrar → callback externo (Promise) → optimista → reintento si falla

"use client";

import { useState } from "react";
import { AnotacionMarca } from "./AnotacionMarca";
import { StandardTooltip } from "@/components/ui/StandardTooltip";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { Trash2 } from "lucide-react";
import type { Anotacion } from "@/lib/mdj/types";

interface FraseNotableTooltipProps {
  anotacion: Anotacion;
  activa?: boolean;
  onBorrar?: (anotacionId: string) => Promise<{ ok: boolean }>;
}

export function FraseNotableTooltip({
  anotacion,
  activa,
  onBorrar,
}: FraseNotableTooltipProps) {
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [reintentando, setReintentando] = useState(false);

  const handleBorrar = async () => {
    if (!onBorrar) return;
    try {
      const resultado = await onBorrar(anotacion.id);
      if (!resultado.ok) {
        setDialogAbierto(true);
      }
    } catch {
      setDialogAbierto(true);
    }
  };

  const handleReintentar = async () => {
    setReintentando(true);
    try {
      const resultado = await onBorrar!(anotacion.id);
      if (resultado.ok) {
        setDialogAbierto(false);
      }
    } catch {
      // Mantener diálogo abierto
    } finally {
      setReintentando(false);
    }
  };

  const tooltipContent = (
    <div className="space-y-2 min-w-[160px]">
      <div className="text-sm text-neutral-700 dark:text-neutral-300 italic leading-relaxed">
        &ldquo;{anotacion.fragmento}&rdquo;
      </div>
      <div className="flex justify-end pt-1 border-t border-neutral-200 dark:border-neutral-700">
        <StandardButton
          size="xs"
          styleType="ghost"
          colorScheme="danger"
          leftIcon={Trash2}
          onClick={handleBorrar}
        >
          Borrar
        </StandardButton>
      </div>
    </div>
  );

  return (
    <>
      <StandardTooltip
        trigger={
          <AnotacionMarca
            colorScheme="accent"
            activa={activa}
          >
            {anotacion.fragmento}
          </AnotacionMarca>
        }
        content={tooltipContent}
        colorScheme="accent"
        side="bottom"
        align="center"
        sideOffset={8}
        delayDuration={300}
      />

      <StandardDialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <StandardDialog.Content size="md">
          <StandardDialog.Header>
            <StandardDialog.Title>Error al guardar</StandardDialog.Title>
            <StandardDialog.Description>
              No se pudo eliminar la frase notable. ¿Desea reintentar?
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Footer>
            <StandardDialog.Close asChild>
              <StandardButton
                size="sm"
                styleType="outline"
                colorScheme="neutral"
                disabled={reintentando}
              >
                Cancelar
              </StandardButton>
            </StandardDialog.Close>
            <StandardButton
              size="sm"
              styleType="solid"
              colorScheme="primary"
              onClick={handleReintentar}
              disabled={reintentando}
            >
              {reintentando ? "Reintentando..." : "Reintentar"}
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>
    </>
  );
}
