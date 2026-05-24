// 📍 components/mdj-viewer/ReferenciaTooltip.tsx
// 'use client' — Tooltip para referencias con Editar / Borrar
// Hover → tooltip tertiary + info entidad + botones
// Editar → dialog con campos
// Borrar → callback externo (Promise) → optimista → reintento si falla

"use client";

import { useState } from "react";
import { AnotacionMarca } from "./AnotacionMarca";
import { StandardTooltip } from "@/components/ui/StandardTooltip";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import { Pencil, Trash2, CheckCircle, AlertCircle, XCircle, Link as LinkIcon, Check } from "lucide-react";
import type { Anotacion, SemaforoReferencia } from "@/lib/mdj/types";

const SEMAFORO_INFO: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  verde: { label: "Revisado por pares", icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
  amarillo: { label: "Fuente secundaria", icon: AlertCircle, color: "text-yellow-600 dark:text-yellow-400" },
  rojo: { label: "Sin verificar", icon: XCircle, color: "text-red-600 dark:text-red-400" },
};

interface ReferenciaTooltipProps {
  anotacion: Anotacion;
  activa?: boolean;
  onEditar?: (anotacion: Anotacion) => Promise<{ ok: boolean }>;
  onBorrar?: (anotacionId: string) => Promise<{ ok: boolean }>;
}

export function ReferenciaTooltip({
  anotacion,
  activa,
  onEditar,
  onBorrar,
}: ReferenciaTooltipProps) {
  const [dialogEditar, setDialogEditar] = useState(false);
  const [dialogBorrar, setDialogBorrar] = useState(false);
  const [entidadId, setEntidadId] = useState(anotacion.entidad_id || "");
  const [notaTexto, setNotaTexto] = useState(anotacion.nota_texto || "");
  const [semaforo, setSemaforo] = useState<SemaforoReferencia>(anotacion.semaforo || "rojo");
  const [validado, setValidado] = useState(anotacion.validado || false);
  const [reintentando, setReintentando] = useState(false);

  const handleGuardar = async () => {
    if (!onEditar || !entidadId.trim()) return;
    const resultado = await onEditar({
      ...anotacion,
      entidad_id: entidadId.trim(),
      nota_texto: notaTexto.trim() || undefined,
      semaforo,
      validado,
    });
    if (resultado.ok) {
      setDialogEditar(false);
    }
  };

  const handleBorrar = async () => {
    if (!onBorrar) return;
    try {
      const resultado = await onBorrar(anotacion.id);
      if (!resultado.ok) {
        setDialogBorrar(true);
      }
    } catch {
      setDialogBorrar(true);
    }
  };

  const handleReintentar = async () => {
    setReintentando(true);
    try {
      const resultado = await onBorrar!(anotacion.id);
      if (resultado.ok) {
        setDialogBorrar(false);
      }
    } catch {
      // Mantener diálogo abierto
    } finally {
      setReintentando(false);
    }
  };

  const semaforoInfo = SEMAFORO_INFO[anotacion.semaforo || "rojo"];
  const SemaforoIcon = semaforoInfo.icon;

  const tooltipContent = (
    <div className="space-y-2 min-w-[200px]">
      {/* Link */}
      {anotacion.entidad_id && (
        <div className="flex items-start gap-1.5">
          <LinkIcon size={12} className="mt-0.5 text-neutral-400 shrink-0" />
          <div className="text-xs text-neutral-600 dark:text-neutral-400 break-all">
            {anotacion.entidad_id}
          </div>
        </div>
      )}
      {/* Semáforo y validado */}
      <div className="flex items-center gap-3">
        <span className={`flex items-center gap-1 text-xs font-medium ${semaforoInfo.color}`}>
          <SemaforoIcon size={12} />
          {semaforoInfo.label}
        </span>
        {anotacion.validado && (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <Check size={12} />
            Validado
          </span>
        )}
      </div>
      {/* Fragmento */}
      <div className="text-sm text-neutral-700 dark:text-neutral-300 italic leading-relaxed">
        &ldquo;{anotacion.fragmento}&rdquo;
      </div>
      {/* Botones */}
      <div className="flex gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-700">
        <StandardButton
          size="xs"
          styleType="ghost"
          colorScheme="neutral"
          leftIcon={Pencil}
          onClick={() => {
            setEntidadId(anotacion.entidad_id || "");
            setNotaTexto(anotacion.nota_texto || "");
            setSemaforo(anotacion.semaforo || "rojo");
            setValidado(anotacion.validado || false);
            setDialogEditar(true);
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
            colorScheme="tertiary"
            activa={activa}
          >
            {anotacion.fragmento}
          </AnotacionMarca>
        }
        content={tooltipContent}
        colorScheme="tertiary"
        side="bottom"
        align="center"
        sideOffset={8}
        delayDuration={300}
      />

      {/* Dialog Editar */}
      <StandardDialog open={dialogEditar} onOpenChange={setDialogEditar}>
        <StandardDialog.Content size="md">
          <StandardDialog.Header>
            <StandardDialog.Title>Editar referencia</StandardDialog.Title>
            <StandardDialog.Description>
              Modifica la entidad vinculada a esta referencia.
            </StandardDialog.Description>
          </StandardDialog.Header>
          <StandardDialog.Body>
            <div className="space-y-4">
              <div>
                <StandardText weight="semibold" size="sm" className="mb-1.5">
                  Link de la referencia
                </StandardText>
                <StandardInput
                  value={entidadId}
                  onChange={(e) => setEntidadId(e.target.value)}
                  placeholder="https://zenodo.org/records/123456"
                />
              </div>
              {/* Semáforo */}
              <div>
                <StandardText weight="semibold" size="sm" className="mb-2 block">
                  Confiabilidad de la fuente
                </StandardText>
                <div className="flex gap-2">
                  {Object.entries(SEMAFORO_INFO).map(([valor, info]) => {
                    const Icono = info.icon;
                    const activo = semaforo === valor;
                    return (
                      <button
                        key={valor}
                        type="button"
                        onClick={() => setSemaforo(valor as SemaforoReferencia)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md border transition-all ${
                          activo
                            ? "border-current bg-current/10"
                            : "border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600"
                        } ${info.color}`}
                      >
                        <Icono size={12} />
                        <span className="hidden sm:inline">{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Validado */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={validado}
                  onChange={(e) => setValidado(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-tertiary focus:ring-tertiary"
                />
                <StandardText size="sm">El link fue verificado y existe</StandardText>
              </label>
              {/* Descripción */}
              <div>
                <StandardText weight="semibold" size="sm" className="mb-1.5">
                  Descripción (opcional)
                </StandardText>
                <StandardTextarea
                  value={notaTexto}
                  onChange={(e) => setNotaTexto(e.target.value)}
                  placeholder="Descripción de la referencia..."
                  rows={3}
                />
              </div>
            </div>
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

      {/* Dialog Error al borrar */}
      <StandardDialog open={dialogBorrar} onOpenChange={setDialogBorrar}>
        <StandardDialog.Content size="md">
          <StandardDialog.Header>
            <StandardDialog.Title>Error al eliminar</StandardDialog.Title>
            <StandardDialog.Description>
              No se pudo eliminar la referencia. ¿Desea reintentar?
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
