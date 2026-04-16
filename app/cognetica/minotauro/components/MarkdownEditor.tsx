// 📍 app/cognetica/minotauro/components/MarkdownEditor.tsx
// 🎯 PROPÓSITO: Editor MD-friendly con visualización dual (raw/renderizado)

'use client';

import { useState } from 'react';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardTextarea } from '@/components/ui/StandardTextarea';
import { Eye, Code, Split } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

type ViewMode = 'edit' | 'preview' | 'split';

export function MarkdownEditor({ value, onChange, placeholder, rows = 15 }: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  return (
    <div className="space-y-2">
      {/* Toolbar de modos de vista */}
      <div className="flex items-center gap-2 pb-2 border-b">
        <span className="text-sm font-medium text-muted-foreground">Vista:</span>
        <div className="flex gap-1">
          <StandardButton
            size="sm"
            colorScheme={viewMode === 'edit' ? 'primary' : 'neutral'}
            onClick={() => setViewMode('edit')}
          >
            <Code className="w-4 h-4 mr-1" />
            Editar
          </StandardButton>
          <StandardButton
            size="sm"
            colorScheme={viewMode === 'preview' ? 'primary' : 'neutral'}
            onClick={() => setViewMode('preview')}
          >
            <Eye className="w-4 h-4 mr-1" />
            Vista Previa
          </StandardButton>
          <StandardButton
            size="sm"
            colorScheme={viewMode === 'split' ? 'primary' : 'neutral'}
            onClick={() => setViewMode('split')}
          >
            <Split className="w-4 h-4 mr-1" />
            Dual
          </StandardButton>
        </div>
      </div>

      {/* Contenedor de vistas */}
      <div className={`grid gap-4 ${viewMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* Vista de edición (raw) */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className="space-y-2">
            {viewMode === 'split' && (
              <div className="flex items-center gap-2 pb-2">
                <Code className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Markdown</span>
              </div>
            )}
            <StandardTextarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || "Escribe en Markdown...\n\n## Ejemplo\nTexto con **negritas** y *cursivas*.\n\n- Lista item 1\n- Lista item 2"}
              rows={rows}
              className="font-mono text-sm"
            />
          </div>
        )}

        {/* Vista previa (renderizado) */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="space-y-2">
            {viewMode === 'split' && (
              <div className="flex items-center gap-2 pb-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Vista Previa</span>
              </div>
            )}
            <div 
              className="prose prose-sm max-w-none p-4 rounded-lg border bg-muted/30 overflow-auto"
              style={{ minHeight: `${rows * 1.5}rem` }}
            >
              {value ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {value}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground italic">
                  La vista previa aparecerá aquí...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ayuda rápida de Markdown */}
      {viewMode === 'edit' && (
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
          <p className="font-medium mb-1">💡 Sintaxis Markdown:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span><code className="bg-background px-1 rounded">**negrita**</code> → <strong>negrita</strong></span>
            <span><code className="bg-background px-1 rounded">*cursiva*</code> → <em>cursiva</em></span>
            <span><code className="bg-background px-1 rounded">## Título</code> → Encabezado</span>
            <span><code className="bg-background px-1 rounded">- item</code> → Lista</span>
            <span><code className="bg-background px-1 rounded">[texto](url)</code> → Enlace</span>
            <span><code className="bg-background px-1 rounded">`código`</code> → <code>código</code></span>
          </div>
        </div>
      )}
    </div>
  );
}
