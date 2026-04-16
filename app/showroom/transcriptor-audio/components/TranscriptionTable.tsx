// 📍 app/showroom/transcriptor-audio/components/TranscriptionTable.tsx
// 🎯 PROPÓSITO: Tabla de segmentos de transcripción con sincronización tipo karaoke
// ⚡ CARACTERÍSTICAS: Resalta fila activa según tiempo de audio, muestra speakers, timestamps

'use client';

import { useMemo } from 'react';
import { StandardTable } from '@/components/ui/StandardTable';
import { ColumnDef, Row } from '@tanstack/react-table';

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

interface TranscriptionTableProps {
  segments: TranscriptionSegment[];
  currentTime: number;
  onSegmentClick?: (startTime: number) => void;
}

export function TranscriptionTable({ segments, currentTime, onSegmentClick }: TranscriptionTableProps) {
  // 🎯 Determinar qué segmento está activo según el tiempo actual
  const activeSegmentIndex = useMemo(() => {
    return segments.findIndex(seg => currentTime >= seg.start && currentTime <= seg.end);
  }, [segments, currentTime]);

  // 📊 Definir columnas de la tabla
  const columns = useMemo<ColumnDef<TranscriptionSegment>[]>(() => [
    {
      accessorKey: 'start',
      header: 'Inicio',
      cell: ({ row }) => {
        const seconds = row.original.start;
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return (
          <button
            onClick={() => onSegmentClick?.(row.original.start)}
            className="hover:underline cursor-pointer"
          >
            {`${minutes}:${secs.toString().padStart(2, '0')}`}
          </button>
        );
      },
      meta: {
        cellVariant: (ctx) => ctx.row.index === activeSegmentIndex ? 'highlight' : undefined,
      },
    },
    {
      accessorKey: 'end',
      header: 'Fin',
      cell: ({ row }) => {
        const seconds = row.original.end;
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
      },
      meta: {
        cellVariant: (ctx) => ctx.row.index === activeSegmentIndex ? 'highlight' : undefined,
      },
    },
    {
      accessorKey: 'speaker',
      header: 'Hablante',
      cell: ({ row }) => row.original.speaker || 'N/A',
      meta: {
        cellVariant: (ctx) => ctx.row.index === activeSegmentIndex ? 'highlight' : undefined,
      },
    },
    {
      accessorKey: 'text',
      header: 'Transcripción',
      cell: ({ row }) => row.original.text,
      meta: {
        isTruncatable: true,
        tooltipType: 'longText' as const,
        cellVariant: (ctx) => ctx.row.index === activeSegmentIndex ? 'highlight' : undefined,
      },
    },
  ], [activeSegmentIndex, onSegmentClick]);

  return (
    <div className="w-full">
      <StandardTable
        data={segments}
        columns={columns}
        enableTruncation={true}
        enableKeywordHighlighting={true}
        keywordHighlightPlaceholder="Buscar en transcripción..."
      />
      
      {/* Indicador de segmento activo */}
      {activeSegmentIndex >= 0 && (
        <div className="mt-2 text-xs text-center opacity-70">
          🎤 Reproduciendo segmento {activeSegmentIndex + 1} de {segments.length}
        </div>
      )}
    </div>
  );
}
