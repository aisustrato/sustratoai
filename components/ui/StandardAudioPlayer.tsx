"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Play, Pause, Rewind, FastForward, Download, FileDown, FileAudio, Quote, MoreVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDropdownMenu } from "@/components/ui/StandardDropdownMenu";
import { obtenerUrlFirmadaStorage } from "@/lib/actions/cognetica_forense_actions";

interface Segment {
    /** Id del segmento (cgt_audio_segmentos.id) — necesario para citas. */
    id?: string;
    text: string;
    start: number;
    end: number;
    speaker?: number;
}

/** Estado de cita de un segmento, para marcarlo en el visor. */
export interface SegmentoCitaEstado {
    /** Hay al menos una cita ligada a este segmento. */
    esCita: boolean;
    /** Alguna de las citas fue creada por un humano. */
    tieneHumana: boolean;
    /** Id de la cita humana (para "Quitar cita"), si existe. */
    mencionHumanaId: string | null;
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
    /** Estado de cita por id de segmento (marca persistente, independiente del play). */
    citaPorSegmentoId?: Record<string, SegmentoCitaEstado>;
    /** Crear una cita humana desde un segmento (lo marca el operador). */
    onAgregarCita?: (segmentoId: string) => void;
    /** Quitar una cita humana (toggle), por id de mención. */
    onQuitarCita?: (mencionId: string) => void;
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
    citaPorSegmentoId,
    onAgregarCita,
    onQuitarCita,
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

    // 🧩 Agrupar segmentos consecutivos del mismo hablante en un solo turno.
    // Conservamos el índice plano de cada subsegmento (`idx`) para no romper el
    // karaoke: el segmento activo, el seek por click y el auto-scroll siguen
    // operando a nivel de subsegmento; sólo se fusiona la tarjeta del hablante.
    const grupos = useMemo(() => {
        const out: Array<{
            speaker?: number;
            start: number;
            end: number;
            items: Array<{ seg: Segment; idx: number }>;
        }> = [];
        segments.forEach((seg, idx) => {
            const ultimo = out[out.length - 1];
            if (ultimo && ultimo.speaker === seg.speaker) {
                ultimo.end = seg.end;
                ultimo.items.push({ seg, idx });
            } else {
                out.push({
                    speaker: seg.speaker,
                    start: seg.start,
                    end: seg.end,
                    items: [{ seg, idx }],
                });
            }
        });
        return out;
    }, [segments]);

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
                    grupos.map((grupo, gIdx) => {
                        const scheme = getSpeakerScheme(grupo.speaker);
                        // La CAJA se marca según el rango completo del turno, de
                        // forma continua: así no parpadea en los micro-silencios
                        // entre frases del mismo hablante.
                        const grupoActivo =
                            currentTime >= grupo.start && currentTime <= grupo.end;

                        // Frase resaltada DENTRO de la caja activa: la que está
                        // sonando, o —en el micro-silencio entre frases— la última
                        // ya iniciada, para sostener el resalte sin huecos.
                        let innerActiveIdx: number | null = null;
                        if (grupoActivo) {
                            const sonando = grupo.items.find(
                                ({ seg }) => currentTime >= seg.start && currentTime <= seg.end,
                            );
                            if (sonando) {
                                innerActiveIdx = sonando.idx;
                            } else {
                                const iniciada = [...grupo.items]
                                    .reverse()
                                    .find(({ seg }) => seg.start <= currentTime);
                                innerActiveIdx = (iniciada ?? grupo.items[0]).idx;
                            }
                        }

                        return (
                            <div
                                key={gIdx}
                                ref={grupoActivo ? activeSegmentRef : null}
                            >
                                <StandardCard
                                    colorScheme={scheme}
                                    styleType={grupoActivo ? "filled" : "subtle"}
                                    selected={grupoActivo}
                                    pulseBorder={grupoActivo}
                                    accentPlacement="left"
                                    accentColorScheme={scheme}
                                    className={cn(
                                        "transition-all duration-200",
                                        grupoActivo ? "scale-[1.02] shadow-xl ring-2 ring-primary-400/30" : "hover:shadow-md"
                                    )}
                                >
                                    <StandardCard.Content>
                                        <div className="flex items-center gap-2 mb-2">
                                            <StandardBadge
                                                colorScheme={scheme}
                                                styleType={grupoActivo ? "solid" : "subtle"}
                                                size="sm">
                                                {grupo.speaker !== undefined ? `Hablante ${grupo.speaker + 1}` : "Desconocido"}
                                            </StandardBadge>
                                            <StandardText size="xs" colorScheme="neutral" colorShade="subtle" className="font-mono">
                                                {formatTime(grupo.start)} – {formatTime(grupo.end)}
                                            </StandardText>
                                            {grupoActivo && (
                                                <span className="ml-auto text-[10px] font-bold animate-pulse">
                                                    ▶ Reproduciendo
                                                </span>
                                            )}
                                        </div>
                                        {/* Cada subsegmento sigue siendo clickeable (seek) y se
                                            resalta individualmente mientras se reproduce. */}
                                        <div className="space-y-1">
                                            {grupo.items.map(({ seg, idx }) => {
                                                const segActivo = innerActiveIdx === idx;
                                                const citaEstado = seg.id ? citaPorSegmentoId?.[seg.id] : undefined;
                                                const esCita = citaEstado?.esCita ?? false;
                                                const esCitaHumana = citaEstado?.tieneHumana ?? false;
                                                const mostrarMenu = Boolean(seg.id && (onAgregarCita || onQuitarCita));
                                                return (
                                                    <div key={idx} className="group/seg flex items-start gap-1.5">
                                                        {esCita && (
                                                            <StandardBadge
                                                                colorScheme="accent"
                                                                styleType={esCitaHumana ? "solid" : "subtle"}
                                                                size="sm"
                                                                className="mt-0.5 shrink-0">
                                                                <Quote className="w-3 h-3" />
                                                                {!esCitaHumana && <span className="ml-1">IA</span>}
                                                            </StandardBadge>
                                                        )}
                                                        <StandardText
                                                            size="base"
                                                            onClick={() => handleSegmentClick(seg.start)}
                                                            className={cn(
                                                                "flex-1 leading-relaxed cursor-pointer transition-all duration-200 rounded",
                                                                segActivo ? "font-semibold text-lg" : "font-normal hover:opacity-80",
                                                                // 🟨 Cita: resaltado persistente (independiente del play),
                                                                // tipo "marcador". Humano más fuerte que IA.
                                                                esCita && "px-1.5 py-0.5 font-semibold",
                                                                esCita && (esCitaHumana
                                                                    ? "bg-amber-200/80 dark:bg-amber-600/40"
                                                                    : "bg-amber-100/80 dark:bg-amber-700/25")
                                                            )}
                                                        >
                                                            {seg.text}
                                                        </StandardText>
                                                        {mostrarMenu && (
                                                            <StandardDropdownMenu>
                                                                <StandardDropdownMenu.Trigger asChild>
                                                                    <StandardButton
                                                                        styleType="ghost"
                                                                        size="sm"
                                                                        iconOnly
                                                                        colorScheme="neutral"
                                                                        leftIcon={MoreVertical}
                                                                        tooltip="Acciones de cita"
                                                                        className={cn(
                                                                            "shrink-0 transition-opacity",
                                                                            esCita ? "opacity-100" : "opacity-0 group-hover/seg:opacity-100"
                                                                        )}
                                                                    />
                                                                </StandardDropdownMenu.Trigger>
                                                                <StandardDropdownMenu.Content align="end">
                                                                    {esCitaHumana && citaEstado?.mencionHumanaId ? (
                                                                        <StandardDropdownMenu.Item
                                                                            onClick={() => onQuitarCita?.(citaEstado.mencionHumanaId as string)}>
                                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                                            Quitar cita
                                                                        </StandardDropdownMenu.Item>
                                                                    ) : (
                                                                        <StandardDropdownMenu.Item
                                                                            onClick={() => seg.id && onAgregarCita?.(seg.id)}>
                                                                            <Quote className="w-4 h-4 mr-2" />
                                                                            Agregar como cita
                                                                        </StandardDropdownMenu.Item>
                                                                    )}
                                                                </StandardDropdownMenu.Content>
                                                            </StandardDropdownMenu>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
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
