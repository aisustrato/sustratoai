"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Rewind, FastForward, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface Segment {
    text: string;
    start: number;
    end: number;
    speaker?: number;
}

interface StandardAudioPlayerProps {
    src: string;
    segments: Segment[];
    className?: string;
}

export function StandardAudioPlayer({ src, segments, className }: StandardAudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
    const activeSegmentRef = useRef<HTMLDivElement>(null);

    // Control de reproducción
    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // Actualizar tiempo y segmento activo
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const time = audioRef.current.currentTime;
            setCurrentTime(time);

            // Encontrar segmento actual
            const currentIndex = segments.findIndex(
                (seg) => time >= seg.start && time <= seg.end
            );
            setActiveSegmentIndex(currentIndex !== -1 ? currentIndex : null);
        }
    };

    // Saltar a un segmento al hacer clic
    const handleSegmentClick = (start: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = start;
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    // Auto-scroll al segmento activo
    useEffect(() => {
        if (activeSegmentIndex !== null && activeSegmentRef.current) {
            activeSegmentRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [activeSegmentIndex]);

    // Formatear tiempo MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    return (
        <div className={cn("flex flex-col h-full gap-4", className)}>
            {/* Reproductor Sticky */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur p-4 border-b rounded-t-lg shadow-sm">
                <audio
                    ref={audioRef}
                    src={src}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                />
                
                <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (audioRef.current) audioRef.current.currentTime -= 10;
                            }}
                            className="p-2 hover:bg-accent rounded-full text-muted-foreground transition-colors"
                            title="-10s"
                        >
                            <Rewind className="w-5 h-5" />
                        </button>
                        
                        <button
                            onClick={togglePlay}
                            className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-md hover:scale-105"
                        >
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                        </button>

                        <button
                            onClick={() => {
                                if (audioRef.current) audioRef.current.currentTime += 10;
                            }}
                            className="p-2 hover:bg-accent rounded-full text-muted-foreground transition-colors"
                            title="+10s"
                        >
                            <FastForward className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 mx-4">
                        <input
                            type="range"
                            min={0}
                            max={duration}
                            value={currentTime}
                            onChange={(e) => {
                                const time = Number(e.target.value);
                                if (audioRef.current) audioRef.current.currentTime = time;
                                setCurrentTime(time);
                            }}
                            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transcripción Scrolleable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg border min-h-[400px] max-h-[600px]">
                {segments.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10 italic">
                        No hay transcripción disponible para este audio.
                    </div>
                ) : (
                    segments.map((seg, idx) => {
                        const isActive = activeSegmentIndex === idx;
                        return (
                            <div
                                key={idx}
                                ref={isActive ? activeSegmentRef : null}
                                onClick={() => handleSegmentClick(seg.start)}
                                className={cn(
                                    "p-4 rounded-xl transition-all cursor-pointer border-2",
                                    isActive
                                        ? "bg-primary/15 border-primary/40 shadow-md ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                                        : "border-transparent hover:bg-accent/50 hover:border-border/30 text-muted-foreground"
                                )}
                            >
                                <div className="flex items-baseline justify-between mb-1">
                                    <span className={cn(
                                        "text-xs font-bold uppercase tracking-wider",
                                        isActive ? "text-primary" : "text-slate-500"
                                    )}>
                                        {seg.speaker !== undefined ? `Speaker ${seg.speaker}` : "Desconocido"}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">
                                        {formatTime(seg.start)}
                                    </span>
                                </div>
                                <p className={cn(
                                    "text-base leading-relaxed",
                                    isActive ? "text-foreground font-medium" : ""
                                )}>
                                    {seg.text}
                                </p>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
