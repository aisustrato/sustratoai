// 📍 app/cognetica/minotauro/[universeId]/components/TextVersionViewer.tsx
// 🎯 Visor estilo PDF con navegación entre versiones del texto

import { StandardCard } from '@/components/ui/StandardCard';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardBadge } from '@/components/ui/StandardBadge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { TextVersion } from '@/lib/types/minotauro-append-types';

interface TextVersionViewerProps {
  versiones: TextVersion[];
  versionActual: number;
  onVersionChange: (version: number) => void;
}

export function TextVersionViewer({ versiones, versionActual, onVersionChange }: TextVersionViewerProps) {
  const versionData = versiones.find(v => v.version === versionActual);
  
  if (!versionData) {
    return (
      <StandardCard className="p-6 text-center text-muted-foreground">
        No hay versiones del texto disponibles
      </StandardCard>
    );
  }

  const canGoPrev = versionActual > 1;
  const canGoNext = versionActual < versiones.length;

  return (
    <StandardCard className="mb-4">
      {/* Header con navegación */}
      <div className="border-b p-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">📄 Visor de Texto</span>
            <StandardBadge 
              colorScheme={versionData.origen === 'humano' ? 'neutral' : 'primary'}
              size="sm"
            >
              {versionData.origen === 'humano' ? '📝 Original' : '🤖 Generado por IA'}
            </StandardBadge>
          </div>

          {/* Navegación entre versiones */}
          <div className="flex items-center gap-2">
            <StandardButton
              size="sm"
              colorScheme="neutral"
              styleType="ghost"
              onClick={() => onVersionChange(versionActual - 1)}
              disabled={!canGoPrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </StandardButton>

            {/* Índice de versiones */}
            <div className="flex items-center gap-1">
              {versiones.map((v) => (
                <button
                  key={v.version}
                  onClick={() => onVersionChange(v.version)}
                  className={`
                    px-2 py-1 text-xs rounded transition-colors
                    ${v.version === versionActual 
                      ? 'bg-primary text-primary-foreground font-medium' 
                      : 'bg-muted hover:bg-muted-foreground/20'
                    }
                  `}
                >
                  v{v.version}
                </button>
              ))}
            </div>

            <StandardButton
              size="sm"
              colorScheme="neutral"
              styleType="ghost"
              onClick={() => onVersionChange(versionActual + 1)}
              disabled={!canGoNext}
            >
              <ChevronRight className="w-4 h-4" />
            </StandardButton>
          </div>
        </div>

        {/* Metadata de la versión */}
        <div className="mt-2 text-xs text-muted-foreground">
          Versión {versionData.version} • {new Date(versionData.timestamp).toLocaleString('es-CL', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {/* Contenido estilo PDF */}
      <div className="p-8 bg-white dark:bg-gray-900 min-h-[400px]">
        <div className="max-w-3xl mx-auto">
          <div 
            className="prose prose-sm dark:prose-invert max-w-none"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              lineHeight: '1.8',
              color: 'inherit'
            }}
          >
            {versionData.content.split('\n').map((paragraph, idx) => (
              paragraph.trim() ? (
                <p key={idx} className="mb-4">{paragraph}</p>
              ) : (
                <div key={idx} className="h-4" />
              )
            ))}
          </div>
        </div>
      </div>

      {/* Footer con estadísticas */}
      <div className="border-t p-3 bg-muted/30 text-xs text-muted-foreground">
        {versionData.content.split(/\s+/).filter(Boolean).length} palabras • 
        {versionData.content.length} caracteres
      </div>
    </StandardCard>
  );
}
