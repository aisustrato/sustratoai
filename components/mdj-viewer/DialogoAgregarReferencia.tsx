// 📍 components/mdj-viewer/DialogoAgregarReferencia.tsx
// 'use client' — Diálogo para agregar una referencia con link, semáforo y validación.
//
// Uso:
//   <DialogoAgregarReferencia
//     abierto={dialogoAbierto}
//     onOpenChange={setDialogoAbierto}
//     fragmento="texto seleccionado"
//     onGuardar={(link, descripcion, semaforo, validado) => {...}}
//     onCancelar={() => {...}}
//   />

"use client";

import { useState, useCallback, useEffect } from "react";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import type { SemaforoReferencia } from "@/lib/mdj/types";
import { Link, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface DialogoAgregarReferenciaProps {
  abierto: boolean;
  onOpenChange: (open: boolean) => void;
  fragmento: string;
  onGuardar: (link: string, descripcion: string, semaforo: SemaforoReferencia, validado: boolean) => void;
  onCancelar: () => void;
}

const SEMAFORO_OPCIONES: { valor: SemaforoReferencia; label: string; icon: typeof CheckCircle; color: string }[] = [
  { valor: "verde", label: "Revisado por pares", icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
  { valor: "amarillo", label: "Fuente secundaria", icon: AlertCircle, color: "text-yellow-600 dark:text-yellow-400" },
  { valor: "rojo", label: "Sin verificar", icon: XCircle, color: "text-red-600 dark:text-red-400" },
];

export function DialogoAgregarReferencia({
  abierto,
  onOpenChange,
  fragmento,
  onGuardar,
  onCancelar,
}: DialogoAgregarReferenciaProps) {
  const [link, setLink] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [semaforo, setSemaforo] = useState<SemaforoReferencia>("rojo");
  const [validado, setValidado] = useState(false);

  // Resetear campos al abrir
  useEffect(() => {
    if (abierto) {
      setLink("");
      setDescripcion("");
      setSemaforo("rojo");
      setValidado(false);
    }
  }, [abierto]);

  const handleGuardar = useCallback(() => {
    if (!link.trim()) return;
    onGuardar(link.trim(), descripcion.trim(), semaforo, validado);
  }, [link, descripcion, semaforo, validado, onGuardar]);

  const handleCancelar = useCallback(() => {
    onCancelar();
  }, [onCancelar]);

  return (
    <StandardDialog open={abierto} onOpenChange={onOpenChange}>
      <StandardDialog.Content size="md" colorScheme="tertiary">
        <StandardDialog.Header>
          <StandardDialog.Title>Agregar referencia</StandardDialog.Title>
          <StandardDialog.Description>
            Vincula el fragmento seleccionado con una fuente externa.
          </StandardDialog.Description>
        </StandardDialog.Header>
        <StandardDialog.Body>
          {/* Fragmento seleccionado */}
          <div className="mb-4 p-2 bg-tertiary/10 border border-tertiary/20 rounded text-xs text-tertiary-foreground">
            <span className="font-semibold">Fragmento:</span>{" "}
            &ldquo;{fragmento.slice(0, 120)}
            {fragmento.length > 120 ? "…" : ""}&rdquo;
          </div>

          {/* Link de la referencia */}
          <div className="mb-4">
            <StandardText size="sm" weight="semibold" className="mb-1.5 block">
              Link de la referencia <span className="text-red-500">*</span>
            </StandardText>
            <div className="relative">
              <Link
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://zenodo.org/records/123456"
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-tertiary focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Semáforo de confiabilidad */}
          <div className="mb-4">
            <StandardText size="sm" weight="semibold" className="mb-2 block">
              Confiabilidad de la fuente
            </StandardText>
            <div className="flex gap-2">
              {SEMAFORO_OPCIONES.map((op) => {
                const Icono = op.icon;
                const activo = semaforo === op.valor;
                return (
                  <button
                    key={op.valor}
                    type="button"
                    onClick={() => setSemaforo(op.valor)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border transition-all ${
                      activo
                        ? "border-current bg-current/10"
                        : "border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600"
                    } ${op.color}`}
                  >
                    <Icono size={14} />
                    <span className="hidden sm:inline">{op.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checkbox validado */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={validado}
                onChange={(e) => setValidado(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-tertiary focus:ring-tertiary"
              />
              <StandardText size="sm">
                El link fue verificado y existe
              </StandardText>
            </label>
          </div>

          {/* Descripción opcional */}
          <div>
            <StandardText size="sm" weight="semibold" className="mb-1.5 block">
              Descripción (opcional)
            </StandardText>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Nota adicional sobre esta referencia..."
              className="w-full min-h-[80px] p-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-tertiary focus:border-transparent resize-y"
            />
          </div>
        </StandardDialog.Body>
        <StandardDialog.Footer>
          <StandardButton
            size="sm"
            styleType="outline"
            colorScheme="neutral"
            onClick={handleCancelar}
          >
            Cancelar
          </StandardButton>
          <StandardButton
            size="sm"
            styleType="solid"
            colorScheme="tertiary"
            onClick={handleGuardar}
            disabled={!link.trim()}
          >
            Guardar referencia
          </StandardButton>
        </StandardDialog.Footer>
      </StandardDialog.Content>
    </StandardDialog>
  );
}
