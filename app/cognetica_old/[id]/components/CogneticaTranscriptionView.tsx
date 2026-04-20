// 📍 app/cognetica_old/[id]/components/CogneticaTranscriptionView.tsx
// 🎯 PROPÓSITO: Vista mejorada de transcripción con karaoke, bookmarks y exportación MD
// 🔧 MIGRADO: Componentes del Transcriptor Soberano (showroom)

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardButton } from '@/components/ui/StandardButton';
import { Play, User, FileText, Download, Bookmark } from 'lucide-react';
import { getSegmentBookmarks, addSegmentBookmark, removeSegmentBookmark } from '@/lib/actions/cognetica-old-bookmark-actions';

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string | number;
  textOriginal?: string;
  textNormalized?: string;
  textHumanEdited?: string;
}

interface CogneticaTranscriptionViewProps {
  segments: TranscriptionSegment[];
  currentTime: number;
  onSegmentClick?: (startTime: number) => void;
  artifactTitle?: string;
  artifactId?: string; // Para persistir bookmarks
}

export function CogneticaTranscriptionView({ 
  segments, 
  currentTime, 
  onSegmentClick,
  artifactTitle = 'Transcripción',
  artifactId
}: CogneticaTranscriptionViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCardRef = useRef<HTMLDivElement>(null);
  const [showPulse, setShowPulse] = useState(false);
  const [bookmarkedSegments, setBookmarkedSegments] = useState<Set<number>>(new Set());
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 💾 Cargar bookmarks desde Supabase al montar
  useEffect(() => {
    if (!artifactId) return;
    
    const loadBookmarks = async () => {
      setIsLoadingBookmarks(true);
      const result = await getSegmentBookmarks(artifactId);
      
      if (result.success && result.data) {
        setBookmarkedSegments(new Set(result.data));
        console.log(`🔖 [Bookmarks] Cargados ${result.data.length} marcadores desde Supabase`);
      } else if (result.error) {
        console.error('🔖 [Bookmarks] Error cargando bookmarks:', result.error);
      }
      
      setIsLoadingBookmarks(false);
    };
    
    loadBookmarks();
  }, [artifactId]);

  // 🎯 Determinar segmento activo
  const activeSegmentIndex = useMemo(() => {
    return segments.findIndex(seg => currentTime >= seg.start && currentTime <= seg.end);
  }, [segments, currentTime]);

  // ✨ Efecto pulse temporal al cambiar de segmento
  useEffect(() => {
    if (activeSegmentIndex >= 0) {
      setShowPulse(true);
      
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
      }
      
      pulseTimerRef.current = setTimeout(() => {
        setShowPulse(false);
      }, 1000);
    }
    
    return () => {
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
      }
    };
  }, [activeSegmentIndex]);

  // 📜 Scroll automático al segmento activo
  useEffect(() => {
    if (activeCardRef.current && containerRef.current && activeSegmentIndex >= 0) {
      activeCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [activeSegmentIndex]);

  // 🔖 Toggle bookmark en segmento con persistencia en Supabase
  const toggleBookmark = async (index: number) => {
    if (!artifactId || isLoadingBookmarks) return;
    
    const segment = segments[index];
    const isCurrentlyBookmarked = bookmarkedSegments.has(index);
    
    // Actualizar UI optimísticamente
    setBookmarkedSegments(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyBookmarked) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
    
    // Persistir en Supabase
    if (isCurrentlyBookmarked) {
      const result = await removeSegmentBookmark(artifactId, index);
      if (!result.success) {
        console.error('🔖 [Bookmarks] Error eliminando bookmark:', result.error);
        // Revertir cambio optimista
        setBookmarkedSegments(prev => {
          const newSet = new Set(prev);
          newSet.add(index);
          return newSet;
        });
      }
    } else {
      const result = await addSegmentBookmark(
        artifactId,
        index,
        segment.start,
        segment.end,
        segment.text
      );
      if (!result.success) {
        console.error('🔖 [Bookmarks] Error agregando bookmark:', result.error);
        // Revertir cambio optimista
        setBookmarkedSegments(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }
    }
  };

  // 📥 Exportar transcripción a MD agrupada por speaker
  const exportToMarkdown = () => {
    let content = `# ${artifactTitle}\n\n`;
    content += `**Transcripción generada con WhisperX**\n\n`;
    content += `---\n\n`;
    
    let currentSpeaker: string = '';
    let currentText: string = '';
    
    segments.forEach((seg, idx) => {
      const speaker = String(seg.speaker || 'SPEAKER_00');
      
      // Si cambia el speaker, escribir el bloque anterior
      if (speaker !== currentSpeaker && currentText) {
        content += `## ${currentSpeaker}\n\n${currentText.trim()}\n\n`;
        currentText = '';
      }
      
      currentSpeaker = speaker;
      currentText += seg.text + ' ';
      
      // Si es el último segmento, escribir
      if (idx === segments.length - 1) {
        content += `## ${currentSpeaker}\n\n${currentText.trim()}\n\n`;
      }
    });
    
    // Agregar bookmarks si existen
    if (bookmarkedSegments.size > 0) {
      content += `---\n\n## 🔖 Segmentos Marcados\n\n`;
      Array.from(bookmarkedSegments).sort((a, b) => a - b).forEach(idx => {
        const seg = segments[idx];
        content += `- **${formatTime(seg.start)}**: ${seg.text}\n`;
      });
    }
    
    // Descargar archivo
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifactTitle.replace(/\s+/g, '_')}_transcripcion.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 🎨 Formatear tiempo MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 🎭 Obtener color del speaker
  const getSpeakerColor = (speaker?: string | number): 'neutral' | 'secondary' | 'tertiary' => {
    if (!speaker) return 'neutral';
    
    // Convertir a string si es número
    const speakerStr = String(speaker);
    
    // Extraer número del speaker (ej: SPEAKER_00 -> 0, o directamente 0)
    const match = speakerStr.match(/\d+$/);
    const speakerNum = match ? parseInt(match[0], 10) : 0;
    
    if (speakerNum === 0) return 'neutral';
    if (speakerNum === 1) return 'secondary';
    return 'tertiary';
  };

  return (
    <div className="space-y-4">
      {/* Header con botones de acción */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Transcripción</h3>
          {bookmarkedSegments.size > 0 && (
            <span className="px-2 py-0.5 bg-accent-500/20 text-accent-700 dark:text-accent-300 text-xs rounded-full">
              {bookmarkedSegments.size} marcados
            </span>
          )}
        </div>
        
        <StandardButton
          onClick={exportToMarkdown}
          colorScheme="primary"
          styleType="subtle"
          size="sm"
          leftIcon={Download}
        >
          Exportar MD
        </StandardButton>
      </div>

      {/* Indicador de progreso */}
      {activeSegmentIndex >= 0 && (
        <div className="bg-accent-500/10 border border-accent-500/20 p-2 rounded-lg text-center">
          <p className="text-xs font-medium text-accent-700 dark:text-accent-300">
            🎤 Segmento {activeSegmentIndex + 1} de {segments.length}
          </p>
        </div>
      )}

      {/* Contenedor scrolleable de cards */}
      <div 
        ref={containerRef}
        className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scroll-smooth"
      >
        {segments.map((segment, index) => {
          const isActive = index === activeSegmentIndex;
          const isBookmarked = bookmarkedSegments.has(index);
          const speakerColor = getSpeakerColor(segment.speaker);
          
          return (
            <div
              key={`${segment.start}-${index}`}
              ref={isActive ? activeCardRef : null}
            >
              <StandardCard
                colorScheme={isBookmarked ? 'accent' : (isActive ? 'accent' : speakerColor)}
                styleType={isBookmarked ? 'filled' : (isActive ? 'filled' : 'subtle')}
                className={`transition-all duration-300 ${
                  isActive 
                    ? `ring-2 ring-accent-500 shadow-lg shadow-accent-500/50 scale-[1.02] ${showPulse ? 'animate-pulse' : ''}` 
                    : isBookmarked
                    ? 'ring-1 ring-accent-400 shadow-md hover:scale-[1.01]'
                    : 'hover:scale-[1.01] hover:shadow-md'
                }`}
              >
                <StandardCard.Header>
                  <div className="flex items-center justify-between">
                    {/* Timestamp clickeable */}
                    <button
                      onClick={() => onSegmentClick?.(segment.start)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <Play className="w-4 h-4" />
                      <span className="text-sm font-mono font-bold">
                        {formatTime(segment.start)} - {formatTime(segment.end)}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Speaker badge */}
                      {segment.speaker && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          speakerColor === 'neutral' 
                            ? 'bg-neutral-500/20 text-neutral-700 dark:text-neutral-300'
                            : speakerColor === 'secondary'
                            ? 'bg-secondary-500/20 text-secondary-700 dark:text-secondary-300'
                            : 'bg-tertiary-500/20 text-tertiary-700 dark:text-tertiary-300'
                        }`}>
                          <User className="w-3 h-3" />
                          <span>{String(segment.speaker)}</span>
                        </div>
                      )}

                      {/* Botón de bookmark */}
                      <button
                        onClick={() => toggleBookmark(index)}
                        className={`p-1 rounded hover:bg-accent-500/20 transition-colors ${
                          isBookmarked ? 'text-accent-600 dark:text-accent-400' : 'text-muted-foreground'
                        }`}
                        title={isBookmarked ? 'Quitar marcador' : 'Marcar segmento importante'}
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </StandardCard.Header>

                <StandardCard.Content>
                  <p className={`text-sm leading-relaxed ${
                    isActive ? 'font-medium' : ''
                  }`}>
                    {segment.text}
                  </p>
                </StandardCard.Content>
              </StandardCard>
            </div>
          );
        })}
      </div>

      {/* Footer con estadísticas */}
      <div className="text-center text-xs text-muted-foreground pt-2 border-t">
        <p>
          📊 Total: {segments.length} segmentos
          {segments.filter(s => s.speaker).length > 0 && (
            <> • 🎭 {new Set(segments.map(s => s.speaker).filter(Boolean)).size} hablantes</>
          )}
          {bookmarkedSegments.size > 0 && (
            <> • 🔖 {bookmarkedSegments.size} marcados</>
          )}
        </p>
      </div>
    </div>
  );
}
