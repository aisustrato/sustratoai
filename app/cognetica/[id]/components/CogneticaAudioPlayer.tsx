// 📍 app/cognetica/[id]/components/CogneticaAudioPlayer.tsx
// 🎯 PROPÓSITO: Reproductor de audio integrado con transcripción karaoke mejorada
// 🔧 MIGRADO: Del Transcriptor Soberano con mejoras visuales

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardButton } from '@/components/ui/StandardButton';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { CogneticaTranscriptionView, TranscriptionSegment } from './CogneticaTranscriptionView';

interface CogneticaAudioPlayerProps {
  src: string;
  segments: TranscriptionSegment[];
  artifactTitle?: string;
  artifactId?: string;
}

export function CogneticaAudioPlayer({ src, segments, artifactTitle, artifactId }: CogneticaAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const lastUpdateRef = useRef<number>(0);
  const UPDATE_THROTTLE = 100; // ms - Actualizar UI cada 100ms en lugar de 60 veces/segundo

  // Manejar play/pause con manejo de promesas
  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('🎧 [Audio] Error en play/pause:', error);
    }
  }, [isPlaying]);

  // Saltar adelante/atrás
  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  };

  // Ir a un tiempo específico (desde click en segmento)
  const seekTo = useCallback(async (time: number) => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    
    // Validar que el audio esté listo para reproducir
    if (audio.readyState < 2) {
      console.warn('🎧 [Audio] Audio no está listo, esperando...');
      // Esperar a que cargue
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (audio.readyState >= 2) {
            audio.removeEventListener('canplay', checkReady);
            resolve();
          }
        };
        audio.addEventListener('canplay', checkReady);
        // Timeout de seguridad
        setTimeout(() => {
          audio.removeEventListener('canplay', checkReady);
          resolve();
        }, 3000);
      });
    }
    
    try {
      audio.currentTime = time;
      console.log(`🎧 [Audio] Saltando a ${time.toFixed(2)}s`);
      
      if (!isPlaying) {
        await audio.play();
        setIsPlaying(true);
        console.log('🎧 [Audio] Reproducción iniciada desde segmento');
      }
    } catch (error) {
      console.error('🎧 [Audio] Error al saltar a segmento:', error);
    }
  }, [isPlaying]);

  // Cambiar volumen
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  // Formatear tiempo MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Reproductor de Audio */}
      <StandardCard colorScheme="primary" styleType="subtle">
        <StandardCard.Header>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            🎧 Reproductor de Audio
          </h3>
        </StandardCard.Header>
        
        <StandardCard.Content>
          {/* Elemento de audio (oculto) */}
          <audio
            ref={audioRef}
            src={src}
            onLoadedData={(e) => {
              const audio = e.currentTarget;
              setDuration(audio.duration);
              audio.volume = volume / 100;
              audio.muted = false;
              console.log('🎧 [Audio] Cargado:', { duration: audio.duration, volume: audio.volume });
            }}
            onTimeUpdate={(e) => {
              // 🔧 THROTTLING: Actualizar UI solo cada 100ms para evitar micro re-renders
              const now = Date.now();
              if (now - lastUpdateRef.current >= UPDATE_THROTTLE) {
                setCurrentTime(e.currentTarget.currentTime);
                lastUpdateRef.current = now;
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Barra de progreso */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const time = parseFloat(e.target.value);
                  setCurrentTime(time);
                  if (audioRef.current) {
                    audioRef.current.currentTime = time;
                  }
                }}
                className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StandardButton
                  onClick={() => skip(-5)}
                  colorScheme="neutral"
                  styleType="subtle"
                  size="sm"
                  title="Retroceder 5s"
                >
                  <SkipBack className="w-4 h-4" />
                </StandardButton>

                <StandardButton
                  onClick={togglePlayPause}
                  colorScheme="primary"
                  styleType="solid"
                  size="md"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </StandardButton>

                <StandardButton
                  onClick={() => skip(5)}
                  colorScheme="neutral"
                  styleType="subtle"
                  size="sm"
                  title="Adelantar 5s"
                >
                  <SkipForward className="w-4 h-4" />
                </StandardButton>
              </div>

              {/* Control de volumen */}
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <span className="text-xs text-muted-foreground w-8">{volume}%</span>
              </div>
            </div>
          </div>
        </StandardCard.Content>
      </StandardCard>

      {/* Vista de Transcripción con Karaoke */}
      <StandardCard colorScheme="neutral" styleType="subtle">
        <StandardCard.Content>
          <CogneticaTranscriptionView
            segments={segments}
            currentTime={currentTime}
            onSegmentClick={seekTo}
            artifactTitle={artifactTitle}
            artifactId={artifactId}
          />
        </StandardCard.Content>
      </StandardCard>
    </div>
  );
}
