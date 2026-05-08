"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Rewind, FastForward, Download, FileDown, FileAudio } from "lucide-react";
import { cn } from "@/lib/utils";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDropdownMenu } from "@/components/ui/StandardDropdownMenu";
import { obtenerUrlFirmadaStorage } from "@/lib/actions/cognetica_forense_actions";

interface Segment {
    text: string;
    start: number;
    end: number;
    speaker?: number;
}

interface StandardAudioPlayerProps {
    storagePath: string | null;
    segments: Segment[];
    className?: string;
    /** Contenido markdown de la transcripción para descarga. */
    transcripcionMD?: string | null;
    /** Callback para descarga Obsidian-friendly de la transcripción. */
    onDescargarObsidiana?: () => void;
    /** SHA-256 de la última descarga Obsidian (8 chars para tooltip). */
    sha256Descarga?: string | null;
    /** Callback para descargar el archivo original (mp3, etc.). */
    onDescargarOriginal?: () => void;
}

// 🎨 Mapeo de hablantes a colorScheme del tema (cíclico)
const SPEAKER_SCHEMES: Array<
    "primary" | "secondary" | "tertiary" | "accent" | "neutral" | "success"
> = ["primary", "secondary", "tertiary", "accent", "neutral", "success"];

function getSpeakerScheme(speaker?: number) {
    return SPEAKER_SCHEMES[(speaker ?? 0) % SPEAKER_SCHEMES.length];
}

export function StandardAudioPlayer({
    storagePath,
    segments,
    className,
    transcripcionMD,
    onDescargarObsidiana,
    sha256Descarga,
    onDescargarOriginal,
}: StandardAudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
    const activeSegmentRef = useRef<HTMLDivElement>(null);
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [loadingSrc, setLoadingSrc] = useState(true);

    // Obtener URL firmada al montar
    useEffect(() => {
        if (!storagePath) {
            setLoadingSrc(false);
            return;
        }
        obtenerUrlFirmadaStorage(storagePath)
            .then((res) => {
                if (res.ok) {
                    setAudioSrc(res.data);
                } else {
                    console.error("[StandardAudioPlayer] Error obteniendo URL:", res.error);
                }
                setLoadingSrc(false);
            })
            .catch((err) => {
                console.error("[StandardAudioPlayer] Error:", err);
                setLoadingSrc(false);
            });
    }, [storagePath]);

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch((err) => {
                console.error("[StandardAudioPlayer] Error reproduciendo:", err);
            });
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const handleTimeUpdate = useCallback(() => {
        if (!audioRef.current) return;
        const time = audioRef.current.currentTime;
        setCurrentTime(time);

        const idx = segments.findIndex((seg) => time >= seg.start && time <= seg.end);
        setActiveSegmentIndex(idx !== -1 ? idx : null);
    }, [segments]);

    const handleSegmentClick = useCallback((start: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = start;
        audioRef.current.play().catch((err) => {
            console.error("[StandardAudioPlayer] Error reproduciendo:", err);
        });
        setIsPlaying(true);
    }, []);

    // Auto-scroll al segmento activo
    useEffect(() => {
        if (activeSegmentIndex === null || !activeSegmentRef.current || !scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
        const element = activeSegmentRef.current;
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        const isVisible = elementRect.top >= containerRect.top && elementRect.bottom <= containerRect.bottom;
        if (!isVisible) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [activeSegmentIndex]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const hasSegments = segments.length > 0;

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            {/* 🎵 Reproductor */}
            <StandardCard colorScheme="neutral" styleType="subtle" noPadding>
                <StandardCard.Content className="py-4 px-4">
                    <audio
                        ref={audioRef}
                        src={audioSrc || undefined}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                        onEnded={() => setIsPlaying(false)}
                        onError={(e) => console.error("[StandardAudioPlayer] Audio error:", e)}
                        className="hidden"
                    />

                    {loadingSrc ? (
                        <div className="flex items-center justify-center py-2 text-sm text-slate-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2" />
                            Cargando audio...
                        </div>
                    ) : !audioSrc ? (
                        <div className="text-center py-2 text-sm text-red-500">
                            No se pudo cargar el audio
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <StandardButton
                                colorScheme="neutral"
                                styleType="outline"
                                size="sm"
                                iconOnly
                                onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10; }}
                                leftIcon={Rewind}
                                tooltip="-10s"
                            />

                            <StandardButton
                                colorScheme="primary"
                                styleType="solid"
                                size="md"
                                iconOnly
                                onClick={togglePlay}
                                leftIcon={isPlaying ? Pause : Play}
                                tooltip={isPlaying ? "Pausar" : "Reproducir"}
                            />

                            <StandardButton
                                colorScheme="neutral"
                                styleType="outline"
                                size="sm"
                                iconOnly
                                onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10; }}
                                leftIcon={FastForward}
                                tooltip="+10s"
                            />

                            <div className="flex-1 mx-2">
                                <input
                                    type="range"
                                    min={0}
                                    max={duration || 1}
                                    value={currentTime}
                                    onChange={(e) => {
                                        const time = Number(e.target.value);
                                        if (audioRef.current) audioRef.current.currentTime = time;
                                        setCurrentTime(time);
                                    }}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1 font-mono">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 🡇 Descarga de transcripción */}
                    {(transcripcionMD || onDescargarObsidiana) && (
                        <div className="flex items-center justify-end mt-3 pt-3 border-t border-neutral-200">
                            <StandardDropdownMenu>
                                <StandardDropdownMenu.Trigger asChild>
                                    <StandardButton
                                        styleType="ghost"
                                        size="sm"
                                        colorScheme="neutral"
                                        leftIcon={Download}
                                        tooltip="Descargar transcripción">
                                        Descargar
                                    </StandardButton>
                                </StandardDropdownMenu.Trigger>
                                <StandardDropdownMenu.Content align="end">
                                    {/* Archivo original (mp3) */}
                                    {onDescargarOriginal && (
                                        <StandardDropdownMenu.Item onClick={onDescargarOriginal}>
                                            <FileAudio className="w-4 h-4 mr-2" />
                                            Original (mp3)
                                        </StandardDropdownMenu.Item>
                                    )}
                                    {/* Transcripción cruda */}
                                    <StandardDropdownMenu.Item
                                        onClick={() => {
                                            if (!transcripcionMD) return;
                                            const blob = new Blob([transcripcionMD], { type: "text/markdown" });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement("a");
                                            a.href = url;
                                            a.download = "transcripcion_original.md";
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                        }}
                                        disabled={!transcripcionMD}>
                                        <FileDown className="w-4 h-4 mr-2" />
                                        Original (md)
                                    </StandardDropdownMenu.Item>
                                    {/* Obsidian: con frontmatter */}
                                    <StandardDropdownMenu.Item
                                        onClick={onDescargarObsidiana}
                                        disabled={!onDescargarObsidiana}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Obsidian
                                        {sha256Descarga && (
                                            <span className="ml-2 text-[10px] font-mono opacity-50">
                                                {sha256Descarga.slice(0, 8)}
                                            </span>
                                        )}
                                    </StandardDropdownMenu.Item>
                                </StandardDropdownMenu.Content>
                            </StandardDropdownMenu>
                        </div>
                    )}
                </StandardCard.Content>
            </StandardCard>

            {/* 📝 Transcripción con karaoke */}
            {/* Padding extra (p-4) para que las tarjetas con scale no se corten */}
            <div
                ref={scrollContainerRef}
                className="overflow-y-auto space-y-3 min-h-[300px] max-h-[500px] p-4 -m-4"
            >
                {!hasSegments ? (
                    <StandardCard colorScheme="neutral" styleType="transparent">
                        <StandardCard.Content className="py-12">
                            <div className="flex flex-col items-center text-slate-400">
                                <div className="text-4xl mb-3">🎙️</div>
                                <StandardText size="sm" colorScheme="neutral">No hay transcripción segmentada disponible.</StandardText>
                                <StandardText size="xs" colorScheme="neutral" colorShade="subtle">El audio se reproduce igual — haz click en Metabolizar para transcribir.</StandardText>
                            </div>
                        </StandardCard.Content>
                    </StandardCard>
                ) : (
                    segments.map((seg, idx) => {
                        const isActive = activeSegmentIndex === idx;
                        const scheme = getSpeakerScheme(seg.speaker);

                        return (
                            <div
                                key={idx}
                                ref={isActive ? activeSegmentRef : null}
                                onClick={() => handleSegmentClick(seg.start)}
                            >
                                <StandardCard
                                    colorScheme={scheme}
                                    styleType={isActive ? "filled" : "subtle"}
                                    selected={isActive}
                                    pulseBorder={isActive}
                                    accentPlacement="left"
                                    accentColorScheme={scheme}
                                    className={cn(
                                        "cursor-pointer transition-all duration-200",
                                        isActive ? "scale-[1.02] shadow-xl ring-2 ring-primary-400/30" : "hover:shadow-md"
                                    )}
                                >
                                    <StandardCard.Content>
                                        <div className="flex items-center gap-2 mb-2">
                                            <StandardBadge
                                                colorScheme={scheme}
                                                styleType={isActive ? "solid" : "subtle"}
                                                size="sm">
                                                {seg.speaker !== undefined ? `Hablante ${seg.speaker + 1}` : "Desconocido"}
                                            </StandardBadge>
                                            <StandardText size="xs" colorScheme="neutral" colorShade="subtle" className="font-mono">
                                                {formatTime(seg.start)} – {formatTime(seg.end)}
                                            </StandardText>
                                            {isActive && (
                                                <span className="ml-auto text-[10px] font-bold animate-pulse">
                                                    ▶ Reproduciendo
                                                </span>
                                            )}
                                        </div>
                                        <StandardText
                                            size="base"
                                            className={cn(
                                                "leading-relaxed",
                                                isActive ? "font-semibold text-lg" : "font-normal"
                                            )}
                                        >
                                            {seg.text}
                                        </StandardText>
                                    </StandardCard.Content>
                                </StandardCard>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
