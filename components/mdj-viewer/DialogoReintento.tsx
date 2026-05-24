// 📍 components/mdj-viewer/DialogoReintento.tsx
// 'use client' — Diálogo simple para reintentar operaciones fallidas.
// Se muestra cuando un callback externo retorna { ok: false }.

"use client";

import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface DialogoReintentoProps {
  /** Mensaje descriptivo del error */
  mensaje: string;
  /** Callback al hacer clic en reintentar */
  onReintentar: () => void;
  /** Callback al cancelar */
  onCancelar: () => void;
  /** ¿Está reintentando actualmente? */
  reintentando?: boolean;
}

export function DialogoReintento({
  mensaje,
  onReintentar,
  onCancelar,
  reintentando = false,
}: DialogoReintentoProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={20} className="text-warning mt-0.5 flex-shrink-0" />
          <div>
            <StandardText weight="semibold" size="base" className="mb-1">
              Operación fallida
            </StandardText>
            <StandardText size="sm" colorScheme="neutral" colorShade="subtle">
              {mensaje}
            </StandardText>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <StandardButton
            size="sm"
            styleType="outline"
            colorScheme="neutral"
            onClick={onCancelar}
            disabled={reintentando}
          >
            Cancelar
          </StandardButton>
          <StandardButton
            size="sm"
            styleType="solid"
            colorScheme="warning"
            leftIcon={RefreshCw}
            onClick={onReintentar}
            disabled={reintentando}
          >
            {reintentando ? "Reintentando..." : "Reintentar"}
          </StandardButton>
        </div>
      </div>
    </div>
  );
}
