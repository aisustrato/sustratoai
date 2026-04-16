// 📍 app/showroom/transcriptor-audio/components/TranscriptionCards.tsx
// 🎯 PROPÓSITO: Cards de segmentos con sincronización karaoke y soporte para múltiples versiones
// ⚡ CARACTERÍSTICAS: Scroll automático, highlight activo, diarización, 3 versiones de texto

'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { StandardCard } from '@/components/ui/StandardCard';
import { Play, User } from 'lucide-react';

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  // 🔮 Preparación para múltiples versiones
  textOriginal?: string;      // Versión original de WhisperX
  textNormalized?: string;     // Versión normalizada por IA (futuro)
  textHumanEdited?: string;    // Versión editada por humano (futuro)
}

interface TranscriptionCardsProps {
  segments: TranscriptionSegment[];
  currentTime: number;
  onSegmentClick?: (startTime: number) => void;
}

export function TranscriptionCards({ segments, currentTime, onSegmentClick }: TranscriptionCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCardRef = useRef<HTMLDivElement>(null);
  const [showPulse, setShowPulse] = useState(false);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 🎯 Determinar qué segmento está activo según el tiempo actual
  const activeSegmentIndex = useMemo(() => {
    return segments.findIndex(seg => currentTime >= seg.start && currentTime <= seg.end);
  }, [segments, currentTime]);

  // ✨ Efecto de resaltado temporal: pulse por 1 segundo al cambiar de segmento
  useEffect(() => {
    if (activeSegmentIndex >= 0) {
      // Activar pulse
      setShowPulse(true);
      
      // Limpiar timer anterior si existe
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
      }
      
      // Desactivar pulse después de 1 segundo
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

  // 📜 Scroll automático al segmento activo (efecto karaoke)
  useEffect(() => {
    if (activeCardRef.current && containerRef.current && activeSegmentIndex >= 0) {
      // 🎯 Scroll centrado con holgura visual
      activeCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',  // Centrado para mejor visibilidad
        inline: 'nearest'
      });
      console.log('📜 [Karaoke] Scroll a segmento:', activeSegmentIndex);
    }
  }, [activeSegmentIndex]);

  // 🎨 Formatear tiempo MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 🎭 Obtener color del speaker (estrategia NK: neutral/secondary/tertiary)
  const getSpeakerColor = (speaker?: string): 'neutral' | 'secondary' | 'tertiary' => {
    if (!speaker) return 'neutral';
    
    // Extraer número del speaker (ej: SPEAKER_00 -> 0, SPEAKER_01 -> 1)
    const match = speaker.match(/\d+$/);
    const speakerNum = match ? parseInt(match[0], 10) : 0;
    
    // Asignar colores según índice
    if (speakerNum === 0) return 'neutral';      // Speaker A: neutral (base)
    if (speakerNum === 1) return 'secondary';    // Speaker B: secondary (distintivo)
    return 'tertiary';                           // Speaker C+: tertiary (otros)
  };

  return (
    <div className="space-y-3">
      {/* Indicador de progreso */}
      {activeSegmentIndex >= 0 && (
        <div className="sticky top-0 z-10 bg-black/50 backdrop-blur-sm p-2 rounded-lg text-center">
          <p className="text-xs font-medium">
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
          const speakerColor = getSpeakerColor(segment.speaker);
          
          return (
            <div
              key={`${segment.start}-${index}`}
              ref={isActive ? activeCardRef : null}
            >
              <StandardCard
                colorScheme={isActive ? 'accent' : speakerColor}
                styleType={isActive ? 'filled' : 'subtle'}
                className={`transition-all duration-300 ${
                  isActive 
                    ? `ring-2 ring-accent-500 shadow-lg shadow-accent-500/50 scale-[1.02] ${showPulse ? 'animate-pulse' : ''}` 
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

                    {/* Speaker badge con colores diferenciados */}
                    {segment.speaker && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        speakerColor === 'neutral' 
                          ? 'bg-neutral-500/20 text-neutral-700 dark:text-neutral-300'
                          : speakerColor === 'secondary'
                          ? 'bg-secondary-500/20 text-secondary-700 dark:text-secondary-300'
                          : 'bg-tertiary-500/20 text-tertiary-700 dark:text-tertiary-300'
                      }`}>
                        <User className="w-3 h-3" />
                        <span>{segment.speaker}</span>
                      </div>
                    )}
                  </div>
                </StandardCard.Header>

                <StandardCard.Content>
                  {/* Texto de transcripción */}
                  <p className={`text-sm leading-relaxed ${
                    isActive ? 'font-medium' : ''
                  }`}>
                    {segment.text}
                  </p>

                  {/* 🔮 Preparación para versiones futuras */}
                  {segment.textNormalized && (
                    <details className="mt-2 text-xs opacity-70">
                      <summary className="cursor-pointer hover:opacity-100">
                        📝 Versión normalizada (IA)
                      </summary>
                      <p className="mt-1 p-2 bg-black/20 rounded">
                        {segment.textNormalized}
                      </p>
                    </details>
                  )}

                  {segment.textHumanEdited && (
                    <details className="mt-2 text-xs opacity-70">
                      <summary className="cursor-pointer hover:opacity-100">
                        ✏️ Versión editada (Humano)
                      </summary>
                      <p className="mt-1 p-2 bg-black/20 rounded">
                        {segment.textHumanEdited}
                      </p>
                    </details>
                  )}
                </StandardCard.Content>
              </StandardCard>
            </div>
          );
        })}
      </div>

      {/* Footer con estadísticas */}
      <div className="text-center text-xs opacity-70 pt-2 border-t border-neutral-700">
        <p>
          📊 Total: {segments.length} segmentos • 
          {segments.filter(s => s.speaker).length > 0 && (
            <> 🎭 {new Set(segments.map(s => s.speaker).filter(Boolean)).size} hablantes</>
          )}
        </p>
      </div>
    </div>
  );
}
