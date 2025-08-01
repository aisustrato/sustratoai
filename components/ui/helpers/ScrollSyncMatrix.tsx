import React, { useRef, useCallback, useEffect, useState } from "react";
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
	// 🎯 CONTROL DE FOCO: Solo activar cuando el textarea está enfocado
	const [isTextareaFocused, setIsTextareaFocused] = useState(false);
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

	// 🎯 CONTROL DE FOCO: Gestionar estado de foco del textarea
	useEffect(() => {
		if (!enabled || !editorRef.current) {
			// Si no está habilitado, asegurar que el foco esté en false
			setIsTextareaFocused(false);
			return;
		}

		const editor = editorRef.current;
		
		const handleFocus = () => {
			// 🛡️ VERIFICACIÓN DE SEGURIDAD: Asegurar que el elemento aún existe
			if (!editorRef.current) return;
			console.log(`🎯 FOCUS: StandardNote textarea enfocado (ID: ${editor.id || 'sin-id'})`);
			setIsTextareaFocused(true);
		};
		
		const handleBlur = () => {
			// 🛡️ VERIFICACIÓN DE SEGURIDAD: Asegurar que el elemento aún existe
			if (!editorRef.current) return;
			console.log(`🎯 BLUR: StandardNote textarea desenfocado (ID: ${editor.id || 'sin-id'})`);
			setIsTextareaFocused(false);
			// Limpiar highlight al perder foco
			clearHighlight();
		};

		// 🛡️ VERIFICACIÓN INICIAL: ¿El textarea ya está enfocado?
		const isCurrentlyFocused = document.activeElement === editor;
		if (isCurrentlyFocused) {
			console.log(`🎯 INIT: Textarea ya estaba enfocado al montar`);
			setIsTextareaFocused(true);
		}

		editor.addEventListener('focus', handleFocus);
		editor.addEventListener('blur', handleBlur);

		// Cleanup
		return () => {
			// 🛡️ CLEANUP ROBUSTO: Verificar que el elemento aún existe antes de remover listeners
			if (editor && editor.removeEventListener) {
				editor.removeEventListener('focus', handleFocus);
				editor.removeEventListener('blur', handleBlur);
			}
			// Limpiar estado y highlight al desmontar
			setIsTextareaFocused(false);
			clearHighlight();
			console.log(`🎯 CLEANUP: Listeners de foco removidos`);
		};
	}, [enabled, editorRef, clearHighlight]);

	// Event listeners con throttling - SOLO cuando el textarea está enfocado
	useEffect(() => {
		if (!enabled || !editorRef.current || !isTextareaFocused) {
			// Si no está enfocado, limpiar cualquier highlight existente
			if (!isTextareaFocused) {
				clearHighlight();
			}
			return;
		}

		const editor = editorRef.current;
		
		let highlightTimeoutId: NodeJS.Timeout;
		let scrollTimeoutId: NodeJS.Timeout;
		let isCleanedUp = false; // 🛡️ FLAG para evitar race conditions
		
		const throttledHighlight = () => {
			// 🛡️ TRIPLE VERIFICACIÓN: Solo si sigue enfocado, habilitado y no limpiado
			if (!isTextareaFocused || !enabled || isCleanedUp || !editorRef.current) return;
			clearTimeout(highlightTimeoutId);
			highlightTimeoutId = setTimeout(() => {
				if (!isCleanedUp && isTextareaFocused) {
					updateHighlight();
				}
			}, 100);
		};
		
		const throttledScrollSync = () => {
			// 🛡️ TRIPLE VERIFICACIÓN: Solo si sigue enfocado, habilitado y no limpiado
			if (!isTextareaFocused || !enabled || isCleanedUp || !editorRef.current) return;
			clearTimeout(scrollTimeoutId);
			scrollTimeoutId = setTimeout(() => {
				if (!isCleanedUp && isTextareaFocused) {
					syncPreviewScroll();
				}
			}, 50);
		};

		// 🎯 EVENTOS ESPECÍFICOS DEL TEXTAREA (no globales)
		editor.addEventListener('click', throttledHighlight);
		editor.addEventListener('keyup', throttledHighlight);
		editor.addEventListener('input', throttledHighlight); // Para cambios de texto
		editor.addEventListener('select', throttledHighlight); // Para selecciones
		
		// Evento para scroll sync
		editor.addEventListener('scroll', throttledScrollSync);

		console.log(`🎯 LISTENERS: Activados para StandardNote enfocado (ID: ${editor.id || 'sin-id'})`);

		// Cleanup
		return () => {
			isCleanedUp = true; // 🛡️ Marcar como limpiado para evitar race conditions
			
			// 🛡️ CLEANUP AGRESIVO: Limpiar timeouts
			clearTimeout(highlightTimeoutId);
			clearTimeout(scrollTimeoutId);
			
			// 🛡️ CLEANUP ROBUSTO: Verificar que el elemento aún existe
			if (editor && editor.removeEventListener) {
				editor.removeEventListener('click', throttledHighlight);
				editor.removeEventListener('keyup', throttledHighlight);
				editor.removeEventListener('input', throttledHighlight);
				editor.removeEventListener('select', throttledHighlight);
				editor.removeEventListener('scroll', throttledScrollSync);
			}
			
			// 🛡️ CLEANUP FINAL: Limpiar highlight
			clearHighlight();
			console.log(`🎯 LISTENERS: Removidos para StandardNote (ID: ${editor.id || 'sin-id'})`);
		};
	}, [enabled, editorRef, isTextareaFocused, updateHighlight, clearHighlight, syncPreviewScroll]);

	// Cleanup al cambiar contenido
	useEffect(() => {
		clearHighlight();
	}, [content, clearHighlight]);

	return { updateHighlight, clearHighlight };
}
