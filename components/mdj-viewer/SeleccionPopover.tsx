// 📍 components/mdj-viewer/SeleccionPopover.tsx
// 'use client' — Menú contextual al seleccionar texto.
// Usa StandardDropdownMenu con 5 opciones:
//   ⭐ Frase notable  |  📝 Nota  |  📚 Referencia  |  📋 Copiar  |  🔍 Buscar
//
// Se posiciona cerca de la selección del usuario.

"use client";

import { useState, useCallback, useContext } from "react";
import {
  StandardDropdownMenu,
} from "@/components/ui/StandardDropdownMenu";
import { Star, FileText, BookOpen, Copy, Search, User, Lightbulb, Atom, GraduationCap, Quote } from "lucide-react";
import { EntidadServiciosContext } from "./entidad-servicios-context";

/** Acciones del menú de selección (incluye crear entidades en cognética). */
export type AccionSeleccion =
  | "frase"
  | "nota"
  | "referencia"
  | "copiar"
  | "buscar"
  | "crear-pensador"
  | "crear-disciplina"
  | "crear-concepto"
  | "crear-teoria"
  | "crear-cita";

interface SeleccionPopoverProps {
  /** Callback al elegir una opción */
  onSeleccion: (accion: AccionSeleccion) => void;
  /** Cierra el popover */
  onClose: () => void;
}

export function SeleccionPopover({ onSeleccion, onClose }: SeleccionPopoverProps) {
  const [abierto, setAbierto] = useState(true);
  // Si el host (cognética) provee onCrearEntidad, el menú ofrece CREAR entidades
  // en vez de las anotaciones del showroom (frase/nota/referencia).
  const servicios = useContext(EntidadServiciosContext);
  const puedeCrear = Boolean(servicios?.onCrearEntidad);

  const handleOpenChange = useCallback((open: boolean) => {
    setAbierto(open);
    if (!open) onClose();
  }, [onClose]);

  const handleAccion = useCallback((accion: AccionSeleccion) => {
    try {
      onSeleccion(accion);
    } catch (err) {
      console.error("[SeleccionPopover:handleAccion] onSeleccion threw:", accion, err);
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
        {puedeCrear ? (
          <>
            <StandardDropdownMenu.Item onClick={() => handleAccion("crear-pensador")} className="flex items-center gap-2">
              <User size={14} className="text-primary" />
              <span>Crear autor</span>
            </StandardDropdownMenu.Item>
            <StandardDropdownMenu.Item onClick={() => handleAccion("crear-concepto")} className="flex items-center gap-2">
              <Lightbulb size={14} className="text-tertiary" />
              <span>Crear concepto</span>
            </StandardDropdownMenu.Item>
            <StandardDropdownMenu.Item onClick={() => handleAccion("crear-teoria")} className="flex items-center gap-2">
              <Atom size={14} className="text-accent" />
              <span>Crear teoría</span>
            </StandardDropdownMenu.Item>
            <StandardDropdownMenu.Item onClick={() => handleAccion("crear-disciplina")} className="flex items-center gap-2">
              <GraduationCap size={14} className="text-secondary" />
              <span>Crear disciplina</span>
            </StandardDropdownMenu.Item>
            <StandardDropdownMenu.Item onClick={() => handleAccion("crear-cita")} className="flex items-center gap-2">
              <Quote size={14} className="text-warning" />
              <span>Crear cita</span>
            </StandardDropdownMenu.Item>
          </>
        ) : (
          <>
            <StandardDropdownMenu.Item onClick={() => handleAccion("frase")} className="flex items-center gap-2">
              <Star size={14} className="text-accent" />
              <span>Frase notable</span>
            </StandardDropdownMenu.Item>
            <StandardDropdownMenu.Item onClick={() => handleAccion("nota")} className="flex items-center gap-2">
              <FileText size={14} className="text-secondary" />
              <span>Agregar nota</span>
            </StandardDropdownMenu.Item>
            <StandardDropdownMenu.Item onClick={() => handleAccion("referencia")} className="flex items-center gap-2">
              <BookOpen size={14} className="text-tertiary" />
              <span>Agregar referencia</span>
            </StandardDropdownMenu.Item>
          </>
        )}
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
