// 📍 components/ui/helpers/BarraFormatoMD.tsx
// Toolbar de formato Markdown para modo edición.
// Usa botones simples con Tailwind para control directo de colores de iconos.
//
// Uso:
//   <BarraFormatoMD textareaRef={textareaRef} onApply={setMdInterno} />
//
// Cada botón lee selectionStart/selectionEnd del textarea,
// aplica el formato correspondiente y actualiza el MD.

"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  List,
  Quote,
  Code2,
  Sigma,
  Undo2,
  Redo2,
} from "lucide-react";
import { StandardTooltip } from "@/components/ui/StandardTooltip";
import {
  formatearNegrita,
  formatearCursiva,
  formatearTachado,
  formatearCodigo,
  formatearLink,
  formatearHeading,
  formatearLista,
  formatearCita,
  insertarBloqueCodigo,
  insertarBloqueLatex,
} from "@/lib/mdj/formateador";

interface BarraFormatoMDProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onApply: (nuevoMd: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

type FormatoAccion =
  | "negrita"
  | "cursiva"
  | "tachado"
  | "codigo"
  | "link"
  | "h1"
  | "h2"
  | "h3"
  | "lista"
  | "cita"
  | "bloque-codigo"
  | "bloque-latex";

interface BotonFormatoProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
}

function BotonFormato({ icon: Icon, tooltip, onClick, disabled }: BotonFormatoProps) {
  const trigger = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        disabled
          ? "text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
          : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
      )}
      tabIndex={-1}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <StandardTooltip trigger={trigger} content={tooltip} />
  );
}

export function BarraFormatoMD({ textareaRef, onApply, onUndo, onRedo, canUndo, canRedo }: BarraFormatoMDProps) {
  const aplicarFormato = useCallback(
    (accion: FormatoAccion) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const inicio = textarea.selectionStart;
      const fin = textarea.selectionEnd;
      const md = textarea.value;

      let resultado: { nuevoMd: string; cursorInicio: number; cursorFin: number };

      switch (accion) {
        case "negrita":
          resultado = formatearNegrita(md, inicio, fin);
          break;
        case "cursiva":
          resultado = formatearCursiva(md, inicio, fin);
          break;
        case "tachado":
          resultado = formatearTachado(md, inicio, fin);
          break;
        case "codigo":
          resultado = formatearCodigo(md, inicio, fin);
          break;
        case "link":
          resultado = formatearLink(md, inicio, fin);
          break;
        case "h1":
          resultado = formatearHeading(md, inicio, 1);
          break;
        case "h2":
          resultado = formatearHeading(md, inicio, 2);
          break;
        case "h3":
          resultado = formatearHeading(md, inicio, 3);
          break;
        case "lista":
          resultado = formatearLista(md, inicio, fin);
          break;
        case "cita":
          resultado = formatearCita(md, inicio, fin);
          break;
        case "bloque-codigo":
          resultado = insertarBloqueCodigo(md, inicio, fin);
          break;
        case "bloque-latex":
          resultado = insertarBloqueLatex(md, inicio, fin);
          break;
        default:
          return;
      }

      // Guardar posición de scroll antes de actualizar
      const scrollTop = textarea.scrollTop;

      onApply(resultado.nuevoMd);

      // Restaurar cursor y scroll
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(resultado.cursorInicio, resultado.cursorFin);
        textarea.scrollTop = scrollTop;
      });
    },
    [textareaRef, onApply],
  );

  return (
    <div className="flex items-center gap-0.5 px-1 py-1 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 rounded-t-md">
      {/* Undo/Redo */}
      {onUndo && (
        <BotonFormato icon={Undo2} tooltip="Deshacer (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} />
      )}
      {onRedo && (
        <BotonFormato icon={Redo2} tooltip="Rehacer (Ctrl+Shift+Z)" onClick={onRedo} disabled={!canRedo} />
      )}
      {onUndo && <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600 mx-1" />}

      {/* Headings */}
      <BotonFormato icon={Heading1} tooltip="Título principal (H1)" onClick={() => aplicarFormato("h1")} />
      <BotonFormato icon={Heading2} tooltip="Subtítulo (H2)" onClick={() => aplicarFormato("h2")} />
      <BotonFormato icon={Heading3} tooltip="Sub-sección (H3)" onClick={() => aplicarFormato("h3")} />

      {/* Separador */}
      <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600 mx-1" />

      {/* Inline */}
      <BotonFormato icon={Bold} tooltip="Negrita (**texto**)" onClick={() => aplicarFormato("negrita")} />
      <BotonFormato icon={Italic} tooltip="Cursiva (*texto*)" onClick={() => aplicarFormato("cursiva")} />
      <BotonFormato icon={Strikethrough} tooltip="Tachado (~~texto~~)" onClick={() => aplicarFormato("tachado")} />
      <BotonFormato icon={Code} tooltip="Código inline (`código`)" onClick={() => aplicarFormato("codigo")} />
      <BotonFormato icon={Link} tooltip="Link ([texto](url))" onClick={() => aplicarFormato("link")} />

      {/* Separador */}
      <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600 mx-1" />

      {/* Bloques */}
      <BotonFormato icon={List} tooltip="Lista (- item)" onClick={() => aplicarFormato("lista")} />
      <BotonFormato icon={Quote} tooltip="Cita (> texto)" onClick={() => aplicarFormato("cita")} />
      <BotonFormato icon={Code2} tooltip="Bloque de código" onClick={() => aplicarFormato("bloque-codigo")} />
      <BotonFormato icon={Sigma} tooltip="Bloque LaTeX ($$)" onClick={() => aplicarFormato("bloque-latex")} />
    </div>
  );
}
