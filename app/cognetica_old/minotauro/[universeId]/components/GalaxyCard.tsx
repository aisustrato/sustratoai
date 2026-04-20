import { useState } from 'react';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardInput } from '@/components/ui/StandardInput';
import { StandardTextarea } from '@/components/ui/StandardTextarea';
import { StandardNote } from '@/components/ui/StandardNote';
import { StandardProgressBar } from '@/components/ui/StandardProgressBar';
import { ChevronDown, ChevronUp, Save, Trash2, Edit2, X, Loader2, CheckCircle2, History } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ArchetypeTone } from '@/lib/types/minotauro-types';
import type { StandardConfig } from '../utils/paperStandards';
import type { TextVersion } from '@/lib/types/minotauro-append-types';
import { calculateTextMetrics } from '../utils/textMetrics';
import { TextVersionViewer } from './TextVersionViewer';

interface GalaxyContent {
  title: string;
  description: string;
  content: string;
}

interface GalaxyCardProps {
  galaxyId: string;
  content: GalaxyContent;
  isExpanded: boolean;
  isProcessing: boolean;
  sectionNumber: number;
  standard: StandardConfig;
  editorRef?: (el: HTMLDivElement | null) => void;
  onToggle: () => void;
  onFieldChange: (field: keyof GalaxyContent, value: string) => void;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onProcessArchetype: (archetype: ArchetypeTone) => void;
  children?: React.ReactNode;
  artefactosPanel?: React.ReactNode;
  // Nuevos props para arquitectura append-only
  versiones?: TextVersion[];
  versionActual?: number;
  onVersionChange?: (version: number) => void;
  sentido?: string;
  onSentidoChange?: (sentido: string) => void;
  // Artefactos
  onToggleArtefactos?: () => void;
  artefactosCount?: number;
  artefactosExpandidos?: boolean;
  // Arquetipo en ejecución
  processingArchetype?: string | null;
}

export function GalaxyCard({
  galaxyId,
  content,
  isExpanded,
  isProcessing,
  sectionNumber,
  standard,
  editorRef,
  onToggle,
  onFieldChange,
  onContentChange,
  onSave,
  onDelete,
  onProcessArchetype,
  children,
  versiones,
  versionActual,
  onVersionChange,
  sentido,
  onSentidoChange,
  onToggleArtefactos,
  artefactosCount,
  artefactosExpandidos,
  artefactosPanel,
  processingArchetype,
}: GalaxyCardProps) {
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [historialExpandido, setHistorialExpandido] = useState(false);
  const metrics = calculateTextMetrics(content.content);
  const archetypesDisabled = isProcessing || !!processingArchetype;

  return (
    <StandardCard colorScheme="neutral" noPadding>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2">
        {/* Fila principal: título + acciones */}
        <div className="flex items-center gap-2">
          <span className="text-base">📄</span>
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {isEditingMetadata ? (
              <StandardInput
                value={content.title}
                onChange={(e) => onFieldChange('title', e.target.value)}
                placeholder="Título de la sección"
                className="text-base font-semibold"
                autoFocus
              />
            ) : (
              <h3 className="font-semibold text-base truncate">{content.title}</h3>
            )}
            <StandardButton
              size="xs"
              colorScheme="neutral"
              styleType="ghost"
              leftIcon={isEditingMetadata ? X : Edit2}
              onClick={(e) => {
                e.stopPropagation();
                if (isEditingMetadata) {
                  setIsEditingMetadata(false);
                } else {
                  setIsEditingMetadata(true);
                  if (!isExpanded) onToggle();
                }
              }}
            />
          </div>

          {/* Acciones del header */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Expandir/colapsar — solo chevron */}
            <StandardButton
              size="sm"
              colorScheme="neutral"
              styleType="ghost"
              leftIcon={isExpanded ? ChevronUp : ChevronDown}
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
            />
          </div>
        </div>

        {/* Métricas + descripción — una sola línea discreta */}
        <div className="flex items-center gap-3 mt-1 ml-5 text-xs text-muted-foreground">
          <span>{metrics.words} pal.</span>
          <span>{metrics.estimatedPages.toFixed(1)} pág.</span>
          <span>§{sectionNumber}</span>
          <span className="text-primary/70">Meta: {standard.wordsPerSection} pal.</span>
          {content.description && (
            <span className="truncate max-w-[200px] italic">{content.description}</span>
          )}
        </div>

        {/* Barra de progreso ultra-delgada - Progreso respecto a palabras recomendadas por sección */}
        <div className="mt-1.5 ml-5">
          <StandardProgressBar
            value={metrics.words}
            max={standard.wordsPerSection}
            colorScheme={metrics.words > standard.wordsPerSection ? 'warning' : 'primary'}
            size="sm"
            showValue={false}
            animated={true}
          />
        </div>

        {/* Descripción editable (solo en modo edición) */}
        {isEditingMetadata && (
          <div className="mt-2 space-y-2">
            <StandardTextarea
              value={content.description}
              onChange={(e) => onFieldChange('description', e.target.value)}
              placeholder="Descripción breve"
              rows={2}
            />
            <StandardButton
              size="sm"
              colorScheme="success"
              leftIcon={Save}
              onClick={() => { onSave(); setIsEditingMetadata(false); }}
            >
              Guardar
            </StandardButton>
          </div>
        )}
      </div>

      {/* ── CONTENIDO EXPANDIDO ────────────────────────────────── */}
      {isExpanded && (
        <div className="border-t">

          {/* ── ZONA ARTEFACTOS (colapsable, separada) ── */}
          {onToggleArtefactos && (
            <div className="px-4 py-2 border-b bg-muted/20">
              <button
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                onClick={onToggleArtefactos}
              >
                <span className="font-medium">📄 Artefactos</span>
                {artefactosCount !== undefined && artefactosCount > 0 && (
                  <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-medium">{artefactosCount}</span>
                )}
                {artefactosExpandidos ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
              </button>
            </div>
          )}

          {/* Panel de Artefactos — separado del historial */}
          {artefactosPanel && (
            <div className="px-4 py-3 border-b">
              {artefactosPanel}
            </div>
          )}

          {/* ── TEXTO MD — PROTAGONISTA ABSOLUTO ── */}
          <div className="px-4 py-4" ref={editorRef}>
            {/* Sentido: una línea inline, sin caja */}
            {onSentidoChange && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground shrink-0">🎯 Sentido:</span>
                <input
                  type="text"
                  value={sentido || ''}
                  onChange={(e) => onSentidoChange(e.target.value)}
                  placeholder="Intención para los arquetipos..."
                  className="flex-1 text-xs bg-transparent border-0 border-b border-dashed border-muted-foreground/30 focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50 py-0.5"
                />
              </div>
            )}

            {/* Selector de versiones (si existen) */}
            {versiones && versiones.length > 0 && versionActual && onVersionChange && (
              <div className="mb-4 flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                <span className="text-xs font-medium text-muted-foreground">📄 Versión:</span>
                <div className="flex items-center gap-1">
                  {versiones.map((v) => {
                    const versionData = versiones.find(ver => ver.version === v.version);
                    const isLatest = v.version === versiones[versiones.length - 1].version;
                    return (
                      <button
                        key={v.version}
                        onClick={() => onVersionChange(v.version)}
                        className={`
                          px-3 py-1.5 text-xs rounded transition-colors
                          ${v.version === versionActual 
                            ? 'bg-primary text-primary-foreground font-medium' 
                            : 'bg-muted hover:bg-muted-foreground/20'
                          }
                        `}
                        title={versionData?.origen === 'humano' ? '📝 Original' : '🤖 Generado por IA'}
                      >
                        v{v.version} {versionData?.origen === 'arquetipo' ? '🤖' : '📝'}
                        {isLatest && ' ✏️'}
                      </button>
                    );
                  })}
                </div>
                <div className="ml-auto text-xs text-muted-foreground">
                  {versiones.find(v => v.version === versionActual)?.origen === 'humano' ? '📝 Original' : '🤖 Generado por IA'}
                  {versionActual === versiones[versiones.length - 1].version && ' • Editable'}
                  {versionActual !== versiones[versiones.length - 1].version && ' • Solo lectura'}
                </div>
              </div>
            )}

            {/* Determinar si es la última versión (editable) o versión anterior (solo lectura) */}
            {(() => {
              const isLatestVersion = !versiones || versiones.length === 0 || !versionActual || versionActual === versiones[versiones.length - 1].version;
              const versionData = versiones?.find(v => v.version === versionActual);
              
              if (isLatestVersion) {
                // ÚLTIMA VERSIÓN: Editor StandardNote completo (editable)
                return (
                  <StandardNote
                    value={content.content}
                    onChange={(value) => onContentChange(value)}
                    placeholder="Escribe el contenido de esta sección..."
                    colorScheme="primary"
                    showToolbar={true}
                    showPreview={true}
                    livePreview={true}
                    viewMode="divided"
                    minimalToolbar={false}
                  />
                );
              } else {
                // VERSIÓN ANTERIOR: Solo lectura con preview de markdown
                return (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-warning/10 border-b border-warning/20 px-4 py-2 flex items-center gap-2">
                      <span className="text-xs font-medium text-warning">🔒 Versión anterior - Solo lectura</span>
                    </div>
                    <div className="p-6 bg-background">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {versionData?.content || '*Sin contenido*'}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                );
              }
            })()}
          </div>

          {/* ── ARQUETIPOS — compactos, debajo del texto ── */}
          <div className="px-4 py-3 border-t bg-muted/10">
            <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'deslixador', label: '🛠️ Deslixador', color: 'neutral' },
                  { key: 'polinizador', label: '🌸 Polinizador', color: 'success' },
                  { key: 'dedalo', label: '🏛️ Dédalo', color: 'primary' },
                  { key: 'bufon', label: '🃏 Bufón', color: 'warning' },
                  { key: 'cronos', label: '⏳ Cronos', color: 'tertiary' },
                  { key: 'colega', label: '☕ Colega', color: 'accent' },
                ].map(({ key, label, color }) => {
                  const isThisRunning = processingArchetype === key;
                  return (
                    <StandardButton
                      key={key}
                      colorScheme={color as any}
                      size="sm"
                      styleType="outline"
                      onClick={() => onProcessArchetype(key as ArchetypeTone)}
                      disabled={archetypesDisabled}
                    >
                      {isThisRunning ? (
                        <><Loader2 className="w-3 h-3 mr-1 animate-spin" />{label}</>
                      ) : label}
                    </StandardButton>
                  );
                })}
              </div>
          </div>

          {/* ── HISTORIAL ARQUETIPOS — colapsado por defecto ── */}
          {children && (
            <div className="border-t">
              <button
                className="flex items-center gap-2 w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors text-left"
                onClick={() => setHistorialExpandido(v => !v)}
              >
                <History className="w-3 h-3" />
                <span>Historial de iteraciones</span>
                {historialExpandido ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
              </button>
              {historialExpandido && (
                <div className="px-4 pb-4 space-y-3">
                  {children}
                </div>
              )}
            </div>
          )}

          {/* ── ACCIONES ── */}
          <div className="flex gap-2 px-4 py-2 border-t">
            <StandardButton
              colorScheme="success"
              size="sm"
              onClick={onSave}
              disabled={isProcessing}
              leftIcon={Save}
            >
              Guardar
            </StandardButton>
            <StandardButton
              colorScheme="danger"
              size="sm"
              styleType="outline"
              onClick={onDelete}
              disabled={isProcessing}
              leftIcon={Trash2}
            >
              Eliminar
            </StandardButton>
          </div>
        </div>
      )}
    </StandardCard>
  );
}
