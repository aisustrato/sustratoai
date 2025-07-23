//. 📍 components/ui/StandardNote_betaFriendly.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
	generateStandardNoteBetaTokens,
	type StandardNoteBetaSize,
	type StandardNoteBetaVariant,
	type StandardNoteBetaTokens,
} from "../../lib/theme/components/standard-note-beta-tokens";
import { StandardButton } from "./StandardButton";
import { StandardText } from "./StandardText";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { 
	Bold, 
	Italic, 
	List, 
	ListOrdered, 
	Heading1,
	Heading2,
	Heading3,
	Highlighter,
	Link,
	Copy,
	Download,
	Columns2,
	Edit3,
	EyeOff
} from "lucide-react";
import { useScrollSync } from "./helpers/ScrollSyncMatrix";
import { MatrixLineRenderer } from "./helpers/MatrixLineRenderer";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACE 📦
export interface StandardNoteProps {
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	colorScheme?: ColorSchemeVariant;
	size?: StandardNoteBetaSize;
	disabled?: boolean;
	readOnly?: boolean;
	className?: string;
	id?: string;
	name?: string;
	showToolbar?: boolean;
	showPreview?: boolean;
	initialMode?: "edit" | "preview";
	minHeight?: string;
	livePreview?: boolean; // Nueva prop para vista previa en vivo
	previewDebounceMs?: number; // Tiempo de debounce para el preview
	minimalToolbar?: boolean; // Si es true, solo muestra iconos (sin texto)
	viewMode?: ViewMode; // Modo de visualización: divided, editor, preview
	onViewModeChange?: (mode: ViewMode) => void; // Callback para cambio de modo
}

type ViewMode = "divided" | "editor" | "preview"; // Modos de visualización
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
const StandardNote = React.forwardRef<HTMLDivElement, StandardNoteProps>(
	({ 
		value = "", 
		onChange, 
		placeholder = "Escribe tu nota aquí...",
		colorScheme = "neutral", 
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		size, // Disponible para uso futuro - parte de la interfaz pública
		disabled = false, 
		readOnly = false, 
		// className no se utiliza actualmente
		id, 
		name, 
		showToolbar = true,
		showPreview = true,
		livePreview = false,
		previewDebounceMs = 500,
		minimalToolbar = false,
		viewMode = "divided",
		onViewModeChange,
		...props 
	}, ref) => {
		//#region [sub_bridge] - 🌉 THE BRIDGE 🌉
		const validVariants: StandardNoteBetaVariant[] = ["default", "primary", "secondary", "tertiary", "accent", "neutral"];
		const effectiveColorScheme: StandardNoteBetaVariant =
			colorScheme && validVariants.includes(colorScheme as StandardNoteBetaVariant)
				? (colorScheme as StandardNoteBetaVariant)
				: "default";
		//#endregion ![sub_bridge]

		//#region [sub_init] - 🪝 HOOKS, STATE, REFS, MEMOS 🪝
		const { appColorTokens, mode } = useTheme();
		const textareaRef = React.useRef<HTMLTextAreaElement>(null);
		const previewRef = React.useRef<HTMLDivElement>(null);

		const [internalValue, setInternalValue] = React.useState(value);
		const [debouncedValue, setDebouncedValue] = React.useState(value);
		// Estado interno para viewMode - funciona como fallback si no se proporciona desde el padre
		const [internalViewMode, setInternalViewMode] = React.useState<ViewMode>(viewMode);
		
		// Usar viewMode del padre si está disponible, sino usar el estado interno
		const effectiveViewMode = viewMode || internalViewMode;

		React.useImperativeHandle(ref, () => textareaRef.current?.parentElement as HTMLDivElement);

		// Sincronizar valor interno con prop externa
		React.useEffect(() => {
			setInternalValue(value);
			setDebouncedValue(value);
		}, [value]);

		// Debounce para el preview en vivo
		React.useEffect(() => {
			if (!showPreview && !livePreview) return;

			const debounceTime = previewDebounceMs || 500;
			const timeoutId = setTimeout(() => {
				setDebouncedValue(internalValue);
			}, debounceTime);

			return () => clearTimeout(timeoutId);
		}, [internalValue, previewDebounceMs, showPreview, livePreview]);

		// Scroll sincronizado inteligente
		const scrollSync = useScrollSync({
			editorRef: textareaRef,
			previewRef: previewRef,
			content: debouncedValue,
			enabled: livePreview && showPreview
		});

		const noteTokens: StandardNoteBetaTokens | null = React.useMemo(() => {
			if (!appColorTokens || !mode) return null;
			return generateStandardNoteBetaTokens(appColorTokens, mode);
		}, [appColorTokens, mode]);
		//#endregion ![sub_init]

		//#region [sub_effects] - 💡 EFFECTS 💡
		React.useEffect(() => {
			const element = textareaRef.current;
			if (element && noteTokens && appColorTokens) {
				const cvt = noteTokens.variants[effectiveColorScheme];

				element.style.setProperty("--note-bg", cvt.background);
				element.style.setProperty("--note-border", cvt.border);
				element.style.setProperty("--note-text", cvt.text);
				element.style.setProperty("--note-placeholder", cvt.placeholder);
				element.style.setProperty("--note-focus-border", cvt.focusBorder);
				element.style.setProperty("--note-focus-ring", cvt.focusRing);
				element.style.setProperty("--note-disabled-bg", cvt.disabledBackground);
				element.style.setProperty("--note-disabled-border", cvt.disabledBorder);
				element.style.setProperty("--note-disabled-text", cvt.disabledText);
				element.style.setProperty("--note-readonly-bg", cvt.readOnlyBackground);
				element.style.setProperty("--note-readonly-border", cvt.readOnlyBorder);
				element.style.setProperty("--note-readonly-text", cvt.readOnlyText);
			}
		}, [noteTokens, effectiveColorScheme, appColorTokens, disabled, readOnly]);
		//#endregion ![sub_effects]

		//#region [sub_handlers] - 🎯 HANDLERS 🎯
		const handleChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const newValue = e.target.value;
			setInternalValue(newValue);
			onChange?.(newValue);
		}, [onChange]);



		// Función para validar si aplicar un formato generaría markup inválido
		const isValidMarkup = React.useCallback((text: string, before: string, after: string): boolean => {
			// Simular el resultado después de aplicar el formato
			const simulatedResult = before + text + after;
			
			// CASO INVÁLIDO 1: Secuencias de 4+ asteriscos consecutivos (****texto****)
			if (/\*{4,}/.test(simulatedResult)) {
				return false;
			}
			
			// CASO INVÁLIDO 2: Anidamiento cruzado/duplicado como **<mark>**texto**</mark>**
			// Detectar si hay marcadores duplicados en el mismo nivel
			if (before === '**' && after === '**') {
				// Buscar si ya hay ** dentro de <mark>...**...**</mark>
				if (/<mark>[^<]*\*\*[^>]*\*\*[^<]*<\/mark>/.test(simulatedResult)) {
					return false;
				}
			}
			
			if (before === '<mark>' && after === '</mark>') {
				// Buscar si ya hay <mark>...</mark> dentro de **...<mark>...</mark>...**
				if (/\*\*[^*]*<mark>[^<]*<\/mark>[^*]*\*\*/.test(simulatedResult)) {
					return false;
				}
			}
			
			// CASOS VÁLIDOS que NO deben bloquearse:
			// - ***texto*** (italic + bold)
			// - <mark>**texto**</mark> (mark con bold dentro)
			// - **<mark>texto</mark>** (bold con mark dentro)
			
			return true;
		}, []);

		// Función para insertar texto con toggle inteligente
		const insertText = React.useCallback((before: string, after: string = "", placeholder: string = "") => {
			const textarea = textareaRef.current;
			if (!textarea || disabled || readOnly) return;

			let start = textarea.selectionStart;
			let end = textarea.selectionEnd;
			const selectedText = internalValue.substring(start, end);
			
			// Verificar si el texto seleccionado ya está envuelto por los marcadores
			let isWrapped = false;
			let textToProcess = selectedText;
			
			if (selectedText) {
				// TOGGLE INTELIGENTE: Manejar combinaciones como ***texto***
				if (before === '**' && after === '**') {
					// Para negrita: verificar si está envuelto por ** (puede tener * adicionales)
					if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length > 4) {
						isWrapped = true;
					} else if (selectedText.startsWith('***') && selectedText.endsWith('***') && selectedText.length > 6) {
						// Caso especial: ***texto*** -> quitar solo ** -> *texto*
						isWrapped = true;
						textToProcess = selectedText;
					}
				} else if (before === '*' && after === '*') {
					// Para itálica: verificar si está envuelto por * (puede tener ** adicionales)
					if (selectedText.startsWith('***') && selectedText.endsWith('***') && selectedText.length > 6) {
						// Caso especial: ***texto*** -> quitar solo * -> **texto**
						isWrapped = true;
						textToProcess = selectedText;
					} else if (selectedText.startsWith('*') && selectedText.endsWith('*') && selectedText.length > 2 && !selectedText.startsWith('**')) {
						isWrapped = true;
					}
				} else {
					// Para otros formatos (mark, links): comportamiento estándar
					isWrapped = selectedText.startsWith(before) && selectedText.endsWith(after) && 
								 selectedText.length > (before.length + after.length);
				}
			} else {
				// Si no hay texto seleccionado, verificar alrededor del cursor
				const beforeLength = before.length;
				const afterLength = after.length;
				const expandedStart = Math.max(0, start - beforeLength);
				const expandedEnd = Math.min(internalValue.length, end + afterLength);
				const expandedText = internalValue.substring(expandedStart, expandedEnd);
				
				isWrapped = expandedText.startsWith(before) && expandedText.endsWith(after) && 
							 expandedText.length >= (beforeLength + afterLength);
				
				if (isWrapped) {
					// Ajustar la selección para incluir los marcadores
					textToProcess = expandedText;
					// Actualizar posiciones para el texto expandido
					start = expandedStart;
					end = expandedEnd;
				}
			}
			
			// Si no está envuelto, validar que aplicar el formato no genere markup inválido
			if (!isWrapped) {
				const textToWrap = selectedText || placeholder;
				const contextStart = Math.max(0, start - 20);
				const contextEnd = Math.min(internalValue.length, end + 20);
				const beforeContext = internalValue.substring(contextStart, start);
				const afterContext = internalValue.substring(end, contextEnd);
				const simulatedContext = beforeContext + before + textToWrap + after + afterContext;
				
				if (!isValidMarkup(simulatedContext, before, after)) {
					// No aplicar el formato si generaría markup inválido
					return;
				}
			}
			
			let newValue: string;
			let newCursorStart: number;
			let newCursorEnd: number;
			
			if (isWrapped) {
				// LÓGICA INTELIGENTE DE REMOCIÓN
				let unwrappedText: string;
				
				if (before === '**' && after === '**' && textToProcess.startsWith('***') && textToProcess.endsWith('***')) {
					// Caso: ***texto*** + Bold -> *texto* (quitar solo **)
					unwrappedText = '*' + textToProcess.substring(3, textToProcess.length - 3) + '*';
				} else if (before === '*' && after === '*' && textToProcess.startsWith('***') && textToProcess.endsWith('***')) {
					// Caso: ***texto*** + Italic -> **texto** (quitar solo *)
					unwrappedText = '**' + textToProcess.substring(3, textToProcess.length - 3) + '**';
				} else {
					// Caso estándar: quitar marcadores normalmente
					unwrappedText = textToProcess.substring(before.length, textToProcess.length - after.length);
				}
				
				newValue = internalValue.substring(0, start) + unwrappedText + internalValue.substring(end);
				
				// Posicionar cursor para seleccionar el texto resultante
				newCursorStart = start;
				newCursorEnd = start + unwrappedText.length;
			} else {
				// Agregar los marcadores
				const textToWrap = selectedText || placeholder;
				const newText = before + textToWrap + after;
				newValue = internalValue.substring(0, start) + newText + internalValue.substring(end);
				
				// MEJORA: Seleccionar toda la cadena incluyendo los marcadores
				newCursorStart = start;
				newCursorEnd = start + newText.length;
			}
			
			setInternalValue(newValue);
			onChange?.(newValue);

			// Restaurar posición del cursor
			setTimeout(() => {
				textarea.setSelectionRange(newCursorStart, newCursorEnd);
				textarea.focus();
			}, 0);
		}, [internalValue, onChange, disabled, readOnly, isValidMarkup]);

		// Función para aplicar formato de línea (títulos, listas)
		const applyLineFormat = React.useCallback((prefix: string, isOrdered: boolean = false) => {
			const textarea = textareaRef.current;
			if (!textarea || disabled || readOnly) return;

			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;
			const lines = internalValue.split('\n');
			
			// Encontrar las líneas afectadas por la selección
			let startLineIndex = 0;
			let endLineIndex = 0;
			let charCount = 0;

			// Encontrar línea de inicio
			for (let i = 0; i < lines.length; i++) {
				if (charCount + lines[i].length >= start) {
					startLineIndex = i;
					break;
				}
				charCount += lines[i].length + 1; // +1 por el \n
			}

			// Encontrar línea de fin
			charCount = 0;
			for (let i = 0; i < lines.length; i++) {
				if (charCount + lines[i].length >= end) {
					endLineIndex = i;
					break;
				}
				charCount += lines[i].length + 1;
			}

			// Determinar si todas las líneas seleccionadas ya tienen el formato
			const affectedLines = lines.slice(startLineIndex, endLineIndex + 1).filter(line => line.trim() !== '');
			let shouldRemoveFormat = false;

			if (isOrdered) {
				const orderedRegex = /^\d+\.\s/;
				shouldRemoveFormat = affectedLines.every(line => orderedRegex.test(line));
			} else if (prefix === '- ' || prefix === '* ') {
				const bulletRegex = /^[-*]\s/;
				shouldRemoveFormat = affectedLines.every(line => bulletRegex.test(line));
			} else {
				// Para títulos, verificar si todas las líneas tienen el mismo prefijo
				shouldRemoveFormat = affectedLines.every(line => line.startsWith(prefix));
			}

			// Aplicar formato a todas las líneas afectadas
			for (let i = startLineIndex; i <= endLineIndex; i++) {
				const currentLine = lines[i];
				
				// Saltar líneas vacías para evitar crear líneas con solo formato
				if (currentLine.trim() === '') {
					continue;
				}
				
				let newLine: string;

				if (isOrdered) {
					const orderedRegex = /^\d+\.\s/;
					const bulletRegex = /^[-*]\s/;
					
					if (shouldRemoveFormat) {
						// Remover numeración
						newLine = currentLine.replace(orderedRegex, '');
					} else {
						// Agregar numeración (número secuencial)
						const lineNumber = i - startLineIndex + 1;
						
						// Remover cualquier formato de lista existente primero
						let cleanLine = currentLine;
						if (orderedRegex.test(cleanLine)) {
							cleanLine = cleanLine.replace(orderedRegex, '');
						} else if (bulletRegex.test(cleanLine)) {
							cleanLine = cleanLine.replace(bulletRegex, '');
						}
						
						newLine = `${lineNumber}. ` + cleanLine;
					}
				} else if (prefix === '- ' || prefix === '* ') {
					const bulletRegex = /^[-*]\s/;
					const orderedRegex = /^\d+\.\s/;
					
					if (shouldRemoveFormat) {
						// Remover bullet
						newLine = currentLine.replace(bulletRegex, '');
					} else {
						// Remover cualquier formato de lista existente primero
						let cleanLine = currentLine;
						if (bulletRegex.test(cleanLine)) {
							cleanLine = cleanLine.replace(bulletRegex, '');
						} else if (orderedRegex.test(cleanLine)) {
							cleanLine = cleanLine.replace(orderedRegex, '');
						}
						
						newLine = prefix + cleanLine;
					}
				} else {
					// Lógica para títulos
					const headingRegex = /^#{1,3}\s/;
					if (shouldRemoveFormat) {
						// Remover título - solo el prefijo específico
						newLine = currentLine.replace(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '');
					} else {
						if (currentLine.startsWith(prefix)) {
							// Ya tiene el prefijo exacto, no hacer nada
							newLine = currentLine;
						} else if (headingRegex.test(currentLine)) {
							// Reemplazar título existente
							newLine = currentLine.replace(headingRegex, prefix);
						} else {
							// Agregar título
							newLine = prefix + currentLine;
						}
					}
				}

				lines[i] = newLine;
			}

			const newValue = lines.join('\n');
			setInternalValue(newValue);
			onChange?.(newValue);

			// Calcular nueva posición de selección ajustada
			const lengthDifference = newValue.length - internalValue.length;
			const newEnd = Math.max(start, end + lengthDifference);
			
			// Restaurar foco y selección ajustada
			setTimeout(() => {
				textarea.focus();
				// Ajustar selección para compensar cambios de longitud
				textarea.setSelectionRange(start, newEnd);
			}, 0);
		}, [internalValue, onChange, disabled, readOnly]);

		// Handlers específicos para cada formato
		const handleBold = React.useCallback(() => insertText('**', '**', 'texto en negrita'), [insertText]);
		const handleItalic = React.useCallback(() => insertText('*', '*', 'texto en itálica'), [insertText]);
		const handleHighlight = React.useCallback(() => insertText('<mark>', '</mark>', 'texto resaltado'), [insertText]);
		const handleLink = React.useCallback(() => insertText('[', '](https://)', 'texto del enlace'), [insertText]);
		const handleH1 = React.useCallback(() => applyLineFormat('# '), [applyLineFormat]);
		const handleH2 = React.useCallback(() => applyLineFormat('## '), [applyLineFormat]);
		const handleH3 = React.useCallback(() => applyLineFormat('### '), [applyLineFormat]);
		const handleBulletList = React.useCallback(() => applyLineFormat('- '), [applyLineFormat]);
		const handleOrderedList = React.useCallback(() => applyLineFormat('', true), [applyLineFormat]);
		
		// Handlers para copiar y descargar
		const handleCopyToClipboard = React.useCallback(async () => {
			try {
				await navigator.clipboard.writeText(internalValue || '');
				console.log('✅ Contenido copiado al portapapeles');
			} catch (err) {
				console.error('❌ Error al copiar al portapapeles:', err);
				// Fallback para navegadores que no soportan clipboard API
				const textArea = document.createElement('textarea');
				textArea.value = internalValue || '';
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand('copy');
				document.body.removeChild(textArea);
			}
		}, [internalValue]);
		
		const handleDownloadMarkdown = React.useCallback(() => {
			const content = internalValue || '';
			const blob = new Blob([content], { type: 'text/markdown' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `nota-${new Date().toISOString().split('T')[0]}.md`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			console.log('✅ Archivo markdown descargado');
		}, [internalValue]);
		
		// Handlers para cambio de modo de visualización
		const handleViewModeChange = React.useCallback((newMode: ViewMode) => {
			// Actualizar estado interno siempre
			setInternalViewMode(newMode);
			// Notificar al padre si el callback está disponible
			onViewModeChange?.(newMode);
		}, [onViewModeChange]);
		
		const handleDividedMode = React.useCallback(() => handleViewModeChange('divided'), [handleViewModeChange]);
		const handleEditorMode = React.useCallback(() => handleViewModeChange('editor'), [handleViewModeChange]);
		const handlePreviewMode = React.useCallback(() => handleViewModeChange('preview'), [handleViewModeChange]);
		//#endregion ![sub_handlers]

		//#region [sub_render_helpers] - 🎨 RENDER HELPERS 🎨





		const stateClasses: string[] = [];
		if (disabled) {
			stateClasses.push(
				"border-[var(--note-disabled-border)]",
				"bg-[var(--note-disabled-bg)]",
				"text-[var(--note-disabled-text)]",
				"cursor-not-allowed"
			);
		} else if (readOnly) {
			stateClasses.push(
				"border-[var(--note-readonly-border)]",
				"bg-[var(--note-readonly-bg)]",
				"text-[var(--note-readonly-text)]",
				"cursor-default"
			);
		} else {
			stateClasses.push(
				"border-[var(--note-border)]",
				"bg-[var(--note-bg)]",
				"text-[var(--note-text)]",
				"hover:border-[var(--note-hover-border)]",
				"focus:border-[var(--note-focus-border)]",
				"focus:ring-2",
				"focus:ring-[var(--note-focus-ring)]",
				"outline-none"
			);
		}


		//#endregion ![sub_render_helpers]

		//#region [render] - 🎨 RENDER 🎨
		return (
			<div className="w-full space-y-2" {...props}>
				{/* Toolbar */}
				{showToolbar && !disabled && !readOnly && (
					<div className="flex flex-wrap items-center gap-2 p-3 border-b border-[var(--note-border)] bg-[var(--note-bg)]">
						{/* Grupo: Formato de Texto */}
						<div className="flex items-center gap-1">
							{!minimalToolbar && (
								<StandardText size="xs" colorScheme="neutral" className="opacity-70 font-medium mr-2">
									Formato:
								</StandardText>
							)}
							<StandardButton
								size="sm"
								styleType="ghost"
								colorScheme="neutral"
								leftIcon={Bold}
								onClick={handleBold}
								tooltip="Aplicar formato de negrita al texto seleccionado"
							>
								{!minimalToolbar && "Negrita"}
							</StandardButton>
							<StandardButton
								size="sm"
								styleType="ghost"
								colorScheme="neutral"
								leftIcon={Italic}
								onClick={handleItalic}
								tooltip="Aplicar formato de cursiva al texto seleccionado"
							>
								{!minimalToolbar && "Cursiva"}
							</StandardButton>
							<StandardButton
								size="sm"
								styleType="ghost"
								colorScheme="neutral"
								leftIcon={Highlighter}
								onClick={handleHighlight}
								tooltip="Resaltar texto importante"
							>
								{!minimalToolbar && "Resaltado"}
							</StandardButton>
						</div>
						
						{!minimalToolbar && <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600" />}
						
						{/* Grupo: Estructura del Documento */}
						<div className="flex items-center gap-1">
							{!minimalToolbar && (
								<StandardText size="xs" colorScheme="neutral" className="opacity-70 font-medium mr-2">
									Estructura:
								</StandardText>
							)}
							<StandardButton
								size="sm"
								styleType="ghost"
								colorScheme="neutral"
								leftIcon={Heading1}
								onClick={handleH1}
								tooltip="Crear título principal de sección"
							>
								{!minimalToolbar && "Título"}
							</StandardButton>
							<StandardButton
								size="sm"
								styleType="ghost"
								colorScheme="neutral"
								leftIcon={Heading2}
								onClick={handleH2}
								tooltip="Crear subtítulo de sección"
							>
								{!minimalToolbar && "Subtítulo"}
							</StandardButton>
							<StandardButton
								size="sm"
								styleType="ghost"
								colorScheme="neutral"
								leftIcon={Heading3}
								onClick={handleH3}
								tooltip="Crear sección menor"
							>
								{!minimalToolbar && "Sección"}
							</StandardButton>
						</div>
						
						{!minimalToolbar && <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600" />}
						
						{/* Grupo: Organización */}
						<div className="flex items-center gap-1">
							{!minimalToolbar && (
								<StandardText size="xs" colorScheme="neutral" className="opacity-70 font-medium mr-2">
									Organización:
								</StandardText>
							)}
							<StandardButton
								size="sm"
								styleType="ghost"
								colorScheme="neutral"
								leftIcon={List}
								onClick={handleBulletList}
								tooltip="Crear lista con viñetas"
							>
								{!minimalToolbar && "Lista"}
							</StandardButton>
							<StandardButton
								size="sm"
								styleType="ghost"
								colorScheme="neutral"
								leftIcon={ListOrdered}
								onClick={handleOrderedList}
								tooltip="Crear lista numerada"
							>
								{!minimalToolbar && "Numerada"}
							</StandardButton>
							<StandardButton
								size="sm"
								styleType="ghost"
								colorScheme="neutral"
								leftIcon={Link}
								onClick={handleLink}
								tooltip="Insertar enlace a referencia o recurso"
							>
								{!minimalToolbar && "Enlace"}
							</StandardButton>
						</div>

						{!minimalToolbar && <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600" />}
						
						{/* Grupo: Acciones */}
						<div className="flex items-center gap-1">
							{!minimalToolbar && (
								<StandardText size="xs" colorScheme="neutral" className="opacity-70 font-medium mr-2">
									Acciones:
								</StandardText>
							)}
							<StandardButton
								size="sm"
								styleType="ghost"
								colorScheme="neutral"
								leftIcon={Copy}
								onClick={handleCopyToClipboard}
								tooltip="Copiar contenido al portapapeles"
							>
								{!minimalToolbar && "Copiar"}
							</StandardButton>
							<StandardButton
								size="sm"
								styleType="ghost"
								colorScheme="neutral"
								leftIcon={Download}
								onClick={handleDownloadMarkdown}
								tooltip="Descargar como archivo .md"
							>
								{!minimalToolbar && "Descargar"}
							</StandardButton>
						</div>

						{!minimalToolbar && <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600" />}
						
						{/* Grupo: Modos de Visualización */}
						<div className="flex items-center gap-1">
							{!minimalToolbar && (
								<StandardText size="xs" colorScheme="neutral" className="opacity-70 font-medium mr-2">
									Vista:
								</StandardText>
							)}
							
							{/* Botón Dividido */}
							{effectiveViewMode !== 'divided' && (
								<StandardButton
									size="sm"
									styleType="ghost"
									colorScheme="primary"
									leftIcon={Columns2}
									onClick={handleDividedMode}
									tooltip="Vista dividida: editor y preview lado a lado"
								>
									{!minimalToolbar && "Dividido"}
								</StandardButton>
							)}
							
							{/* Botón Solo Editor */}
							{effectiveViewMode !== 'editor' && (
								<StandardButton
									size="sm"
									styleType="ghost"
									colorScheme="primary"
									leftIcon={Edit3}
									onClick={handleEditorMode}
									tooltip="Solo editor: enfoque completo en la escritura"
								>
									{!minimalToolbar && "Editor"}
								</StandardButton>
							)}
							
							{/* Botón Solo Preview */}
							{effectiveViewMode !== 'preview' && (
								<StandardButton
									size="sm"
									styleType="ghost"
									colorScheme="primary"
									leftIcon={EyeOff}
									onClick={handlePreviewMode}
									tooltip="Solo preview: revisión del documento final"
								>
									{!minimalToolbar && "Preview"}
								</StandardButton>
							)}
							
							{/* Indicador del modo activo */}
							<StandardButton
								size="sm"
								styleType="solid"
								colorScheme="primary"
								leftIcon={effectiveViewMode === 'divided' ? Columns2 : effectiveViewMode === 'editor' ? Edit3 : EyeOff}
								disabled={true}
								tooltip={`Modo activo: ${effectiveViewMode === 'divided' ? 'Vista dividida' : effectiveViewMode === 'editor' ? 'Solo editor' : 'Solo preview'}`}
							>
								{!minimalToolbar && (effectiveViewMode === 'divided' ? 'Dividido' : effectiveViewMode === 'editor' ? 'Editor' : 'Preview')}
							</StandardButton>
						</div>
					</div>
				)}

				{/* Editor/Preview - Renderizado basado en effectiveViewMode */}
				{effectiveViewMode === 'divided' ? (
					/* Vista dividida - Editor y Preview lado a lado */
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						{/* Panel de Edición */}
						<div className="flex flex-col h-[400px] max-h-[400px]">
							{/* Header del Editor - Fuera del área scrolleable */}
							<div className="flex items-center gap-2 mb-2 px-1">
								<StandardText size="xs" colorScheme="neutral" className="opacity-60 font-medium">
									Editor
								</StandardText>
								{scrollSync && (
									<div className="flex items-center gap-1">
										<div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
										<StandardText size="xs" colorScheme="primary" className="opacity-70">
											Sincronizado
										</StandardText>
									</div>
								)}
							</div>
							{/* Área scrolleable del Editor */}
							<textarea
								ref={textareaRef}
								id={id}
								name={name}
								className={cn(
									"w-full flex-1 rounded-md border p-3 font-mono text-sm resize-none",
									"bg-white border-[var(--note-border)] text-[var(--note-text)]",
									"placeholder:text-[var(--note-placeholder)]",
									"focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
									disabled && "opacity-50 cursor-not-allowed",
									readOnly && "cursor-default"
								)}
								value={internalValue || ""}
								onChange={handleChange}
								placeholder={placeholder}
								disabled={disabled}
								readOnly={readOnly}
							/>
						</div>

						{/* Panel de Vista Previa */}
						<div className="flex flex-col h-[400px] max-h-[400px]">
							{/* Header del Preview - Fuera del área scrolleable */}
							<div className="flex items-center gap-2 mb-2 px-1">
								<StandardText size="xs" colorScheme="neutral" className="opacity-60 font-medium">
									Vista Previa
								</StandardText>
								{internalValue !== debouncedValue && (
									<div className="flex items-center gap-1">
										<div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
										<StandardText size="xs" colorScheme="accent" className="opacity-70">
											Actualizando
										</StandardText>
									</div>
								)}
							</div>
							{/* Área scrolleable del Preview */}
							<div 
								ref={previewRef}
								className={cn(
									"w-full flex-1 rounded-md border p-3 overflow-y-scroll",
									"bg-white border-[var(--note-border)] text-[var(--note-text)]",
									"transition-opacity duration-200",
									internalValue !== debouncedValue ? "opacity-75" : "opacity-100"
								)}
							>
								<MatrixLineRenderer 
									content={debouncedValue || ""}
									className="w-full"
								/>
							</div>
						</div>
					</div>
				) : effectiveViewMode === 'editor' ? (
					/* Solo Editor - Enfoque completo en la escritura */
					<div className="flex flex-col h-[400px] max-h-[400px]">
						{/* Header del Editor */}
						<div className="flex items-center gap-2 mb-2 px-1">
							<StandardText size="xs" colorScheme="neutral" className="opacity-60 font-medium">
								Editor
							</StandardText>
						</div>
						{/* Área scrolleable del Editor */}
						<textarea
							ref={textareaRef}
							id={id}
							name={name}
							className={cn(
								"w-full flex-1 rounded-md border p-3 font-mono text-sm resize-none",
								"bg-white border-[var(--note-border)] text-[var(--note-text)]",
								"placeholder:text-[var(--note-placeholder)] focus:ring-2 focus:ring-blue-500 focus:border-transparent",
								"transition-colors duration-200",
								disabled && "opacity-50 cursor-not-allowed",
								readOnly && "bg-gray-50 cursor-default"
							)}
							value={internalValue || ""}
							onChange={handleChange}
							placeholder={placeholder}
							disabled={disabled}
							readOnly={readOnly}
						/>
					</div>
				) : (
					/* Solo Preview - Revisión del documento final */
					<div className="flex flex-col h-[400px] max-h-[400px]">
						{/* Header del Preview */}
						<div className="flex items-center gap-2 mb-2 px-1">
							<StandardText size="xs" colorScheme="neutral" className="opacity-60 font-medium">
								Vista Previa
							</StandardText>
							<div className="flex items-center gap-1">
								<div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
								<StandardText size="xs" colorScheme="secondary" className="opacity-70">
									Solo lectura
								</StandardText>
							</div>
						</div>
						{/* Área scrolleable del Preview */}
						<div 
							ref={previewRef}
							className={cn(
								"w-full flex-1 rounded-md border p-3 overflow-y-scroll",
								"bg-[var(--note-bg)] border-[var(--note-border)] text-[var(--note-text)]"
							)}
						>
							<MatrixLineRenderer 
								content={internalValue || ""}
								className="w-full"
							/>
						</div>
					</div>
				)}
			</div>
		);
		//#endregion ![render]
	}
);
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
StandardNote.displayName = "StandardNote";
export { StandardNote };
//#endregion ![foo]
