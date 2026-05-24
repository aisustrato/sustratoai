// 📍 components/mdj-viewer/NotaTooltip.tsx
// 'use client' — Tooltip interactivo para anotaciones de tipo "nota"
// Hover → muestra texto de la nota + botones Editar / Borrar
// Editar → abre StandardDialog con textarea
// Borrar → elimina la anotación

"use client";

import { useState } from "react";
import { AnotacionMarca } from "./AnotacionMarca";
import { StandardTooltip } from "@/components/ui/StandardTooltip";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { Pencil, Trash2 } from "lucide-react";
import type { Anotacion } from "@/lib/mdj/types";

interface NotaTooltipProps {
  anotacion: Anotacion;
  activa?: boolean;
  onEditar?: (anotacion: Anotacion) => void;
  onBorrar?: (anotacionId: string) => void;
}

export function NotaTooltip({
  anotacion,
  activa,
  onEditar,
  onBorrar,
}: NotaTooltipProps) {
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [notaTexto, setNotaTexto] = useState(anotacion.nota_texto || "");

  const handleGuardar = () => {
    if (notaTexto.trim()) {
      onEditar?.({ ...anotacion, nota_texto: notaTexto.trim() });
    }
    setDialogAbierto(false);
  };

  const handleBorrar = () => {
    onBorrar?.(anotacion.id);
  };

  const tooltipContent = (
    <div className="space-y-3 min-w-[200px] max-w-xs">
      <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
        {anotacion.nota_texto || <span className="italic text-neutral-400">Sin texto</span>}
      </div>
      <div className="flex gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-700">
        <StandardButton
          size="xs"
          styleType="ghost"
          colorScheme="neutral"
          leftIcon={Pencil}
          onClick={() => {
            setNotaTexto(anotacion.nota_texto || "");
            setDialogAbierto(true);
          }}
        >
          Editar
        </StandardButton>
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
            colorScheme="secondary"
            activa={activa}
          >
            {anotacion.fragmento}
          </AnotacionMarca>
        }
        content={tooltipContent}
        colorScheme="secondary"
        side="bottom"
        align="center"
        sideOffset={8}
        delayDuration={300}
      />

      <StandardDialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <StandardDialog.Content size="md">
          <StandardDialog.Header>
            <StandardDialog.Title>Editar nota</StandardDialog.Title>
            <StandardDialog.Description>
              Modifica el texto de esta anotación.
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Body>
            <StandardTextarea
              value={notaTexto}
              onChange={(e) => setNotaTexto(e.target.value)}
              placeholder="Escribe la nota aquí..."
              rows={4}
              autoFocus
            />
          </StandardDialog.Body>
          <StandardDialog.Footer>
            <StandardDialog.Close asChild>
              <StandardButton
                size="sm"
                styleType="outline"
                colorScheme="neutral"
              >
                Cancelar
              </StandardButton>
            </StandardDialog.Close>
            <StandardButton
              size="sm"
              styleType="solid"
              colorScheme="primary"
              onClick={handleGuardar}
            >
              Guardar
            </StandardButton>
          </StandardDialog.Footer>
        </StandardDialog.Content>
      </StandardDialog>
    </>
  );
}
