// 📍 components/ui/helpers/MenuContextualNodo.tsx
// Menú contextual que aparece al hacer click derecho sobre un nodo en el preview.
//
// Uso:
//   <MenuContextualNodo
//     visible={menuVisible}
//     x={menuX}
//     y={menuY}
//     nodoId={menuNodoId}
//     nodoTipo={menuNodoTipo}
//     onEditar={handleEditar}
//     onInsertarDespues={handleInsertar}
//     onEliminar={handleEliminar}
//     onClose={handleClose}
//   />

"use client";

import { useEffect, useRef } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

interface MenuContextualNodoProps {
  visible: boolean;
  x: number;
  y: number;
  nodoId: string;
  nodoTipo: string;
  onEditar: () => void;
  onInsertarDespues: () => void;
  onEliminar: () => void;
  onClose: () => void;
}

export function MenuContextualNodo({
  visible,
  x,
  y,
  nodoId,
  nodoTipo,
  onEditar,
  onInsertarDespues,
  onEliminar,
  onClose,
}: MenuContextualNodoProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!visible) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [visible, onClose]);

  // Cerrar con Escape
  useEffect(() => {
    if (!visible) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [visible, onClose]);

  if (!visible) return null;

  const tipoLabel = nodoTipo.toUpperCase();

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[14rem] rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150"
      style={{ left: x, top: y }}
    >
      {/* Header con info del nodo */}
      <div className="flex items-center justify-between px-2.5 py-1.5 mb-1 border-b border-neutral-100 dark:border-neutral-800">
        <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 truncate max-w-[10rem]">
          {nodoId}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
          {tipoLabel}
        </span>
      </div>

      {/* Acciones */}
      <button
        type="button"
        onClick={onEditar}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <Pencil className="h-4 w-4 text-neutral-500" />
        <span>Editar sección</span>
      </button>

      <button
        type="button"
        onClick={onInsertarDespues}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <Plus className="h-4 w-4 text-neutral-500" />
        <span>Insertar después</span>
      </button>

      <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

      <button
        type="button"
        onClick={onEliminar}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        <span>Eliminar sección</span>
      </button>

      {/* Cerrar */}
      <button
        type="button"
        onClick={onClose}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-md text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors mt-1"
      >
        <X className="h-4 w-4" />
        <span>Cancelar</span>
      </button>
    </div>
  );
}
