'use client';

import { useState, useEffect, useRef } from 'react';

interface Size {
  width: number | undefined;
  height: number | undefined;
}

/**
 * Hook personalizado que observa las dimensiones de un elemento con un retardo (debounce).
 * Solo actualiza el tamaño después de que el usuario ha dejado de redimensionar durante un período de tiempo específico.
 *
 * @param {React.RefObject<T>} ref - La referencia al elemento del DOM a observar.
 * @param {number} [delay=250] - El tiempo en milisegundos para el debounce.
 * @returns {Size} - El tamaño debounced del elemento ({ width, height }).
 */
export function useDebouncedResizeObserver<T extends HTMLElement>(
  ref: React.RefObject<T>,
  options: { delay?: number; threshold?: number } = {}
): Size {
  const { delay = 250, threshold = 2 } = options;
  const [size, setSize] = useState<Size>({ width: undefined, height: undefined });
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastReportedSizeRef = useRef<Size>({ width: undefined, height: undefined });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      timeoutIdRef.current = setTimeout(() => {
        const { width, height } = entries[0].contentRect;
        const lastWidth = lastReportedSizeRef.current.width ?? 0;
        const lastHeight = lastReportedSizeRef.current.height ?? 0;

        if (Math.abs(width - lastWidth) > threshold || Math.abs(height - lastHeight) > threshold) {
          setSize({ width, height });
          lastReportedSizeRef.current = { width, height };
        }
      }, delay);
    });

    // Medición inicial sin debounce, estableciendo la base para el umbral
    const { width, height } = element.getBoundingClientRect();
    setSize({ width, height });
    lastReportedSizeRef.current = { width, height };

    resizeObserver.observe(element);

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [ref, delay, threshold]);

  return size;
}
