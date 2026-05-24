// 📍 components/mdj-viewer/SeleccionPopover.tsx
// 'use client' — Menú contextual al seleccionar texto.
// Usa StandardDropdownMenu con 5 opciones:
//   ⭐ Frase notable  |  📝 Nota  |  📚 Referencia  |  📋 Copiar  |  🔍 Buscar
//
// Se posiciona cerca de la selección del usuario.

"use client";

import { useState, useCallback } from "react";
import {
  StandardDropdownMenu,
} from "@/components/ui/StandardDropdownMenu";
import { Star, FileText, BookOpen, Copy, Search } from "lucide-react";

interface SeleccionPopoverProps {
  /** Callback al elegir una opción */
  onSeleccion: (accion: "frase" | "nota" | "referencia" | "copiar" | "buscar") => void;
  /** Cierra el popover */
  onClose: () => void;
}

export function SeleccionPopover({ onSeleccion, onClose }: SeleccionPopoverProps) {
  const [abierto, setAbierto] = useState(true);

  const handleOpenChange = useCallback((open: boolean) => {
    setAbierto(open);
    if (!open) onClose();
  }, [onClose]);

  const handleAccion = useCallback((accion: "frase" | "nota" | "referencia" | "copiar" | "buscar") => {
    console.log("[SeleccionPopover:handleAccion] 🖱️ action:", accion);
    console.log("[SeleccionPopover:handleAccion] onSeleccion type:", typeof onSeleccion);
    try {
      onSeleccion(accion);
    } catch (err) {
      console.error("[SeleccionPopover:handleAccion] ❌ onSeleccion threw:", accion, err);
    }
    setAbierto(false);
  }, [onSeleccion]);

  if (!abierto) return null;

  return (
    <StandardDropdownMenu open={abierto} onOpenChange={handleOpenChange}>
      <StandardDropdownMenu.Trigger asChild>
        {/* Trigger invisible posicionado en la selección */}
        <span className="inline-block w-1 h-1" />
      </StandardDropdownMenu.Trigger>
      <StandardDropdownMenu.Content align="center" side="top" sideOffset={8}>
        <StandardDropdownMenu.Item
          onClick={() => handleAccion("frase")}
          className="flex items-center gap-2"
        >
          <Star size={14} className="text-accent" />
          <span>Frase notable</span>
        </StandardDropdownMenu.Item>
        <StandardDropdownMenu.Item
          onClick={() => handleAccion("nota")}
          className="flex items-center gap-2"
        >
          <FileText size={14} className="text-secondary" />
          <span>Agregar nota</span>
        </StandardDropdownMenu.Item>
        <StandardDropdownMenu.Item
          onClick={() => handleAccion("referencia")}
          className="flex items-center gap-2"
        >
          <BookOpen size={14} className="text-tertiary" />
          <span>Agregar referencia</span>
        </StandardDropdownMenu.Item>
        <StandardDropdownMenu.Separator />
        <StandardDropdownMenu.Item
          onClick={() => handleAccion("copiar")}
          className="flex items-center gap-2"
        >
          <Copy size={14} />
          <span>Copiar al portapapeles</span>
        </StandardDropdownMenu.Item>
        <StandardDropdownMenu.Item
          onClick={() => handleAccion("buscar")}
          className="flex items-center gap-2"
        >
          <Search size={14} />
          <span>Buscar ocurrencias</span>
        </StandardDropdownMenu.Item>
      </StandardDropdownMenu.Content>
    </StandardDropdownMenu>
  );
}
