"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, ExternalLink, Clock } from "lucide-react";
import { StandardText } from "@/components/ui/StandardText";
import { StandardBadge } from "@/components/ui/StandardBadge";
import {
    getArtifactsByElement,
    type CognitiveElementType,
    type ElementArtifact,
} from "@/lib/actions/cognetica-filters-actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface CognitiveElementDrawerProps {
    projectId: string;
    element: {
        type: CognitiveElementType;
        value: string;
        label: string;
    } | null;
    onClose: () => void;
}

const TYPE_EMOJI: Record<string, string> = {
    audio: "🎙️",
    video: "🎬",
    markdown: "📝",
    pdf_report: "📊",
    pdf_slides: "📽️",
    image: "🖼️",
    document: "📄",
    other: "📄",
};

const ELEMENT_META: Record<CognitiveElementType, { emoji: string; label: string; colorClass: string }> = {
    seed:       { emoji: "🌱", label: "Semilla fractal", colorClass: "text-accent-600 bg-accent-50 border-accent-200" },
    discipline: { emoji: "🔬", label: "Disciplina",      colorClass: "text-primary-600 bg-primary-50 border-primary-200" },
    theory:     { emoji: "💡", label: "Teoría",          colorClass: "text-secondary-600 bg-secondary-50 border-secondary-200" },
    thinker:    { emoji: "👤", label: "Pensador",        colorClass: "text-tertiary-600 bg-tertiary-50 border-tertiary-200" },
};

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    try {
        return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
    } catch {
        return "—";
    }
}

export function CognitiveElementDrawer({ projectId, element, onClose }: CognitiveElementDrawerProps) {
    const router = useRouter();
    const [artifacts, setArtifacts] = useState<ElementArtifact[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!element) return;
        setLoading(true);
        setError(null);
        const result = await getArtifactsByElement(projectId, element.type, element.value);
        if (result.success && result.data) {
            setArtifacts(result.data);
        } else {
            setError(result.error || "Error cargando artefactos");
        }
        setLoading(false);
    }, [projectId, element]);

    useEffect(() => {
        load();
    }, [load]);

    // Cerrar con Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const isOpen = !!element;
    const meta = element ? ELEMENT_META[element.type] : null;

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                onClick={onClose}
            />

            {/* Panel lateral */}
            <div
                className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-background shadow-2xl border-l border-border flex flex-col transition-transform duration-300 ease-in-out ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 p-5 border-b border-border">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{meta?.emoji}</span>
                            <StandardText size="xs" colorScheme="neutral" className="uppercase tracking-wider font-medium">
                                {meta?.label}
                            </StandardText>
                        </div>
                        <h2 className="text-base font-bold text-foreground leading-snug line-clamp-2">
                            {element?.label}
                        </h2>
                        {!loading && (
                            <StandardText size="xs" colorScheme="neutral" className="mt-1">
                                {artifacts.length === 0
                                    ? "Sin artefactos"
                                    : `${artifacts.length} artefacto${artifacts.length !== 1 ? "s" : ""} comparten este elemento`}
                            </StandardText>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 p-1.5 rounded-md text-neutral-400 hover:text-foreground hover:bg-neutral-100 transition-colors"
                        aria-label="Cerrar panel"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-y-auto">
                    {loading && (
                        <div className="flex flex-col gap-3 p-5">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-20 rounded-lg bg-neutral-100 animate-pulse" />
                            ))}
                        </div>
                    )}

                    {!loading && error && (
                        <div className="p-5">
                            <StandardText colorScheme="danger" size="sm">{error}</StandardText>
                        </div>
                    )}

                    {!loading && !error && artifacts.length === 0 && (
                        <div className="p-8 text-center">
                            <span className="text-4xl block mb-3">🔍</span>
                            <StandardText colorScheme="neutral" size="sm">
                                Este elemento no aparece en ningún artefacto aún.
                            </StandardText>
                        </div>
                    )}

                    {!loading && !error && artifacts.length > 0 && (
                        <div className="divide-y divide-border">
                            {artifacts.map((artifact, idx) => (
                                <div
                                    key={artifact.id}
                                    className={`p-4 transition-colors ${
                                        idx % 2 === 0 ? "bg-transparent" : "bg-tertiary/5"
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Emoji tipo */}
                                        <span className="text-2xl leading-none flex-shrink-0 mt-0.5">
                                            {TYPE_EMOJI[artifact.type] || "📄"}
                                        </span>

                                        <div className="flex-1 min-w-0">
                                            {/* Título clicable */}
                                            <button
                                                className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left line-clamp-2 w-full"
                                                onClick={() => {
                                                    router.push(`/cognetica/${artifact.id}`);
                                                    onClose();
                                                }}
                                            >
                                                {artifact.title}
                                            </button>

                                            {/* Meta: fecha + indicadores */}
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="flex items-center gap-1 text-xs text-neutral-400">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(artifact.created_at)}
                                                </span>
                                                <StandardBadge
                                                    colorScheme={
                                                        artifact.status === "completed" ? "success" :
                                                        artifact.status === "error" ? "danger" :
                                                        (artifact.status === "analyzing" || artifact.status === "transcribing") ? "warning" : "neutral"
                                                    }
                                                    size="xs"
                                                >
                                                    {artifact.status === "completed" ? "Procesado" :
                                                     artifact.status === "error" ? "Error" :
                                                     artifact.status === "analyzing" ? "Analizando" :
                                                     artifact.status === "transcribing" ? "Transcribiendo" : "Pendiente"}
                                                </StandardBadge>
                                                {artifact.has_chronicle && (
                                                    <span title="Metabolizado por Micelio" className="text-sm">🍄</span>
                                                )}
                                                {artifact.has_chat && (
                                                    <span title="Tiene Chat Quipu" className="text-sm">🪢</span>
                                                )}
                                            </div>

                                            {/* Destilada micelio si existe */}
                                            {artifact.micelio_destilada && (
                                                <p className="mt-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md p-2 leading-relaxed line-clamp-3">
                                                    {artifact.micelio_destilada}
                                                </p>
                                            )}
                                        </div>

                                        {/* Botón ir al artefacto */}
                                        <button
                                            onClick={() => {
                                                router.push(`/cognetica/${artifact.id}`);
                                                onClose();
                                            }}
                                            className="flex-shrink-0 p-1.5 rounded-md text-neutral-300 hover:text-primary hover:bg-neutral-100 transition-colors"
                                            title="Ir al artefacto"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!loading && artifacts.length > 1 && (
                    <div className="p-4 border-t border-border bg-neutral-50/50">
                        <StandardText size="xs" colorScheme="neutral" className="text-center">
                            {meta?.emoji} <strong>{element?.label}</strong> aparece en {artifacts.length} artefactos
                        </StandardText>
                    </div>
                )}
            </div>
        </>
    );
}
