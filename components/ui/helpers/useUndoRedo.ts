// 📍 components/ui/helpers/useUndoRedo.ts
// Hook de undo/redo con historial limitado.
//
// Uso:
//   const { pushToHistory, undo, redo, canUndo, canRedo } = useUndoRedo(maxEntries);
//
// pushToHistory(value) — guarda el estado actual antes de cambiarlo (typing, formateo)
// undo(currentState) — guarda currentState en redoStack y retorna el estado anterior
// redo(currentState) — guarda currentState en undoStack y retorna el estado siguiente

import { useRef, useCallback, useState } from "react";

export interface HistoryEntry {
  value: string;
  cursor: number;
  scrollTop: number;
}

interface UseUndoRedoResult {
  pushToHistory: (value: string, cursor?: number, scrollTop?: number) => void;
  undo: (currentState: HistoryEntry) => HistoryEntry | null;
  redo: (currentState: HistoryEntry) => HistoryEntry | null;
  canUndo: boolean;
  canRedo: boolean;
}

export function useUndoRedo(maxEntries = 50): UseUndoRedoResult {
  const undoStack = useRef<HistoryEntry[]>([]);
  const redoStack = useRef<HistoryEntry[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateFlags = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const pushToHistory = useCallback(
    (value: string, cursor = 0, scrollTop = 0) => {
      undoStack.current.push({ value, cursor, scrollTop });
      if (undoStack.current.length > maxEntries) {
        undoStack.current.shift();
      }
      redoStack.current = [];
      updateFlags();
    },
    [maxEntries, updateFlags],
  );

  const undo = useCallback(
    (currentState: HistoryEntry): HistoryEntry | null => {
      if (undoStack.current.length === 0) return null;
      // Guardar estado actual en redoStack antes de retroceder
      redoStack.current.push(currentState);
      if (redoStack.current.length > maxEntries) {
        redoStack.current.shift();
      }
      const entry = undoStack.current.pop()!;
      updateFlags();
      return entry;
    },
    [maxEntries, updateFlags],
  );

  const redo = useCallback(
    (currentState: HistoryEntry): HistoryEntry | null => {
      if (redoStack.current.length === 0) return null;
      // Guardar estado actual en undoStack antes de avanzar
      undoStack.current.push(currentState);
      if (undoStack.current.length > maxEntries) {
        undoStack.current.shift();
      }
      const entry = redoStack.current.pop()!;
      updateFlags();
      return entry;
    },
    [maxEntries, updateFlags],
  );

  return { pushToHistory, undo, redo, canUndo, canRedo };
}
