import React, { useRef, useCallback, useEffect } from "react";
import { useTheme } from "@/app/theme-provider";

interface ScrollSyncConfig {
	editorRef: React.RefObject<HTMLTextAreaElement>;
	previewRef: React.RefObject<HTMLDivElement>;
	content: string;
	enabled?: boolean;
}

export function useScrollSync({ editorRef, previewRef, content, enabled = true }: ScrollSyncConfig) {
	const lastHighlightedRef = useRef<HTMLElement | null>(null);
	const isScrollingSyncRef = useRef(false);
	const { appColorTokens } = useTheme();

	// Obtener línea actual del cursor
	const getCurrentLine = useCallback(() => {
		if (!editorRef.current) return -1;
		
		const textarea = editorRef.current;
		const cursorPosition = textarea.selectionStart;
		const textBeforeCursor = textarea.value.substring(0, cursorPosition);
		const lineIndex = textBeforeCursor.split('\n').length - 1;
		
		console.log(`📍 CURSOR: position ${cursorPosition} = line ${lineIndex}`);
		return lineIndex;
	}, [editorRef]);

	// Obtener primera línea visible en el editor
	const getFirstVisibleLine = useCallback(() => {
		if (!editorRef.current) return -1;
		
		const textarea = editorRef.current;
		const scrollTop = textarea.scrollTop;
		const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
		const firstVisibleLine = Math.floor(scrollTop / lineHeight);
		
		console.log(`🔍 SCROLL: scrollTop ${scrollTop}, lineHeight ${lineHeight} = firstVisible ${firstVisibleLine}`);
		return firstVisibleLine;
	}, [editorRef]);

	// Limpiar highlight anterior
	const clearHighlight = useCallback(() => {
		if (lastHighlightedRef.current) {
			const element = lastHighlightedRef.current;
			element.style.removeProperty('background-color');
			element.style.removeProperty('border-left');
			element.style.removeProperty('padding-left');
			element.style.removeProperty('margin-left');
			element.style.removeProperty('transition');
			element.style.removeProperty('border-radius');
			lastHighlightedRef.current = null;
		}
	}, []);

	// Sincronizar scroll del preview con la primera línea visible del editor
	const syncPreviewScroll = useCallback(() => {
		if (!enabled || !previewRef.current || !editorRef.current || isScrollingSyncRef.current) return;

		const editor = editorRef.current;
		const preview = previewRef.current;
		
		// Detectar si estamos al final del editor
		const isAtBottom = editor.scrollTop + editor.clientHeight >= editor.scrollHeight - 5;
		
		if (isAtBottom) {
			// Si el editor está al final, llevar el preview al final también
			isScrollingSyncRef.current = true;
			preview.scrollTop = preview.scrollHeight - preview.clientHeight;
			console.log(`🔄 SCROLL SYNC: Editor al final → Preview al final`);
			
			setTimeout(() => {
				isScrollingSyncRef.current = false;
			}, 300);
			return;
		}

		const firstVisibleLine = getFirstVisibleLine();
		if (firstVisibleLine < 0) return;

		// Buscar el elemento correspondiente a la primera línea visible
		const targetElement = preview.querySelector(`[data-line="${firstVisibleLine}"]`) as HTMLElement;
		
		if (targetElement) {
			isScrollingSyncRef.current = true;
			
			// Scroll del preview para mostrar la misma línea
			targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
			
			console.log(`🔄 SCROLL SYNC: Editor línea ${firstVisibleLine} → Preview elemento`);
			
			// Reset flag después del scroll
			setTimeout(() => {
				isScrollingSyncRef.current = false;
			}, 300);
		}
	}, [enabled, previewRef, editorRef, getFirstVisibleLine]);

	// MAPEO EXACTO: Índice y contenido por carriles separados
	const updateHighlight = useCallback(() => {
		if (!enabled || !previewRef.current) return;

		clearHighlight();
		
		const lineIndex = getCurrentLine();
		if (lineIndex < 0) return;

		// LA MAGIA: Buscar directamente por data-line (índice separado del contenido)
		const targetElement = previewRef.current.querySelector(`[data-line="${lineIndex}"]`) as HTMLElement;
		
		if (targetElement) {
			// HIGHLIGHT con colores dinámicos del tema
			const accentColor = appColorTokens.accent;
			const bgHighlight = `${accentColor.pure}15`; // 15 en hex = ~8% opacity
			const borderHighlight = `${accentColor.pure}99`; // 99 en hex = ~60% opacity
			
			targetElement.style.setProperty('background-color', bgHighlight, 'important');
			targetElement.style.setProperty('border-left', `4px solid ${borderHighlight}`, 'important');
			targetElement.style.setProperty('padding-left', '12px', 'important');
			targetElement.style.setProperty('margin-left', '-16px', 'important');
			targetElement.style.setProperty('transition', 'all 0.3s ease', 'important');
			targetElement.style.setProperty('border-radius', '4px', 'important');
			
			lastHighlightedRef.current = targetElement;
			
			console.log(`✅ MATRIX MATCH: Línea ${lineIndex} → ${targetElement.tagName}: "${targetElement.textContent?.trim()?.substring(0, 50)}..."`);
			
			// Scroll suave al elemento (solo para highlight, no para sync)
			if (!isScrollingSyncRef.current) {
				targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		} else {
			console.log(`❌ No element found for line ${lineIndex} (esto NO debería pasar con matriz)`);
		}
	}, [enabled, previewRef, clearHighlight, getCurrentLine, appColorTokens.accent]);

	// Event listeners con throttling
	useEffect(() => {
		if (!enabled || !editorRef.current) return;

		const editor = editorRef.current;
		
		let highlightTimeoutId: NodeJS.Timeout;
		let scrollTimeoutId: NodeJS.Timeout;
		
		const throttledHighlight = () => {
			clearTimeout(highlightTimeoutId);
			highlightTimeoutId = setTimeout(updateHighlight, 100);
		};
		
		const throttledScrollSync = () => {
			clearTimeout(scrollTimeoutId);
			scrollTimeoutId = setTimeout(syncPreviewScroll, 50); // Más rápido para scroll
		};

		// Eventos para highlight (cursor/selección)
		editor.addEventListener('click', throttledHighlight);
		editor.addEventListener('keyup', throttledHighlight);
		document.addEventListener('selectionchange', throttledHighlight);
		
		// Evento para scroll sync
		editor.addEventListener('scroll', throttledScrollSync);

		// Cleanup
		return () => {
			clearTimeout(highlightTimeoutId);
			clearTimeout(scrollTimeoutId);
			editor.removeEventListener('click', throttledHighlight);
			editor.removeEventListener('keyup', throttledHighlight);
			document.removeEventListener('selectionchange', throttledHighlight);
			editor.removeEventListener('scroll', throttledScrollSync);
			clearHighlight();
		};
	}, [enabled, editorRef, updateHighlight, clearHighlight, syncPreviewScroll]);

	// Cleanup al cambiar contenido
	useEffect(() => {
		clearHighlight();
	}, [content, clearHighlight]);

	return { updateHighlight, clearHighlight };
}
