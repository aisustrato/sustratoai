// 📍 components/ui/helpers/useScrollSyncMDNote.ts
// Hook de scroll sync bidireccional por porcentaje de scroll.
// Soporta tanto <div> (modo lectura) como <textarea> (modo edición).
// Acepta un sourceRef externo opcional para compartir con otros componentes.
//
// Uso:
//   const { sourceRef, previewRef } = useScrollSyncMDNote({ enabled: true });
//   <div ref={sourceRef}>...</div>   // o <textarea ref={sourceRef}>
//   <div ref={previewRef}>...</div>
//
// Con ref externo:
//   const miRef = useRef<HTMLTextAreaElement>(null);
//   const { previewRef } = useScrollSyncMDNote({ enabled: true, sourceRef: miRef });
//   <textarea ref={miRef}>...</textarea>

import { useRef, useCallback, useEffect } from "react";

interface UseScrollSyncMDNoteConfig {
  enabled?: boolean;
  sourceRef?: React.RefObject<HTMLDivElement | HTMLTextAreaElement | null>;
}

interface UseScrollSyncMDNoteResult {
  sourceRef: React.RefObject<HTMLDivElement | HTMLTextAreaElement | null>;
  previewRef: React.RefObject<HTMLDivElement>;
}

export function useScrollSyncMDNote({
  enabled = true,
  sourceRef: externalSourceRef,
}: UseScrollSyncMDNoteConfig = {}): UseScrollSyncMDNoteResult {
  const internalSourceRef = useRef<HTMLDivElement | HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  // Usar ref externo si se proporciona, sino interno
  const sourceRef = externalSourceRef || internalSourceRef;

  // Sincronizar scroll del preview cuando el source scrollea
  const handleSourceScroll = useCallback(() => {
    if (!enabled || !sourceRef.current || !previewRef.current || isSyncingRef.current) return;

    const source = sourceRef.current;
    const preview = previewRef.current;

    // Calcular porcentaje de scroll
    const scrollPercent =
      source.scrollHeight === source.clientHeight
        ? 0
        : source.scrollTop / (source.scrollHeight - source.clientHeight);

    isSyncingRef.current = true;
    preview.scrollTop = scrollPercent * (preview.scrollHeight - preview.clientHeight);

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 50);
  }, [enabled, sourceRef]);

  // Sincronizar scroll del source cuando el preview scrollea
  const handlePreviewScroll = useCallback(() => {
    if (!enabled || !sourceRef.current || !previewRef.current || isSyncingRef.current) return;

    const source = sourceRef.current;
    const preview = previewRef.current;

    // Calcular porcentaje de scroll
    const scrollPercent =
      preview.scrollHeight === preview.clientHeight
        ? 0
        : preview.scrollTop / (preview.scrollHeight - preview.clientHeight);

    isSyncingRef.current = true;
    source.scrollTop = scrollPercent * (source.scrollHeight - source.clientHeight);

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 50);
  }, [enabled, sourceRef]);

  // Attach scroll listeners
  useEffect(() => {
    if (!enabled) return;

    const source = sourceRef.current;
    const preview = previewRef.current;

    if (!source || !preview) return;

    source.addEventListener("scroll", handleSourceScroll, { passive: true });
    preview.addEventListener("scroll", handlePreviewScroll, { passive: true });

    return () => {
      source.removeEventListener("scroll", handleSourceScroll);
      preview.removeEventListener("scroll", handlePreviewScroll);
    };
  }, [enabled, handleSourceScroll, handlePreviewScroll, sourceRef]);

  return { sourceRef, previewRef };
}
