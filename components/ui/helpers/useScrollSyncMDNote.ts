// 📍 components/ui/helpers/useScrollSyncMDNote.ts
// Hook de scroll sync bidireccional por índice de línea.
//
// Uso:
//   const { sourceRef, previewRef } = useScrollSyncMDNote({ enabled: true });
//   <div ref={sourceRef}>...</div>
//   <div ref={previewRef}>...</div>

import { useRef, useCallback, useEffect } from "react";

interface UseScrollSyncMDNoteConfig {
  enabled?: boolean;
}

interface UseScrollSyncMDNoteResult {
  sourceRef: React.RefObject<HTMLDivElement>;
  previewRef: React.RefObject<HTMLDivElement>;
}

export function useScrollSyncMDNote({
  enabled = true,
}: UseScrollSyncMDNoteConfig = {}): UseScrollSyncMDNoteResult {
  const sourceRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

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
  }, [enabled]);

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
  }, [enabled]);

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
  }, [enabled, handleSourceScroll, handlePreviewScroll]);

  return { sourceRef, previewRef };
}
