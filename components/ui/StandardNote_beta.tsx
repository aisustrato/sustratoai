//. 📍 components/ui/StandardNote_beta.tsx

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
	Eye,
	FileText,
	Link
} from "lucide-react";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACE 📦
export interface StandardNoteBetaProps {
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
}

type EditorMode = "edit" | "preview";
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
const StandardNoteBeta = React.forwardRef<HTMLDivElement, StandardNoteBetaProps>(
	({ 
		value = "", 
		onChange, 
		placeholder = "Escribe tu nota aquí...",
		colorScheme = "neutral", 
		size = "md", 
		disabled = false, 
		readOnly = false, 
		className, 
		id, 
		name, 
		showToolbar = true,
		showPreview = true,
		initialMode = "edit",
		minHeight,
		livePreview = false,
		previewDebounceMs = 500,
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
		const [currentMode, setCurrentMode] = React.useState<EditorMode>(initialMode);
		const [internalValue, setInternalValue] = React.useState(value);
		const [debouncedValue, setDebouncedValue] = React.useState(value);

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

		const handleModeToggle = React.useCallback(() => {
			setCurrentMode(prev => prev === "edit" ? "preview" : "edit");
		}, []);

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
				const contextText = internalValue.substring(contextStart, contextEnd);
				
				// Simular el resultado en contexto
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
		//#endregion ![sub_handlers]

		//#region [sub_render_helpers] - 🎨 RENDER HELPERS 🎨
		// Función simple para renderizar markdown básico
		const renderMarkdown = React.useCallback((text: string): string => {
			let html = text
				// Títulos
				.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2 mt-4">$1</h3>')
				.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 mt-4">$1</h2>')
				.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 mt-4">$1</h1>')
				// Negrita e itálica
				.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
				.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
				// Resaltado
				.replace(/<mark>(.*?)<\/mark>/g, '<span class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</span>')
				// Links
				.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
				// Listas no ordenadas
				.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc list-inside">$1</li>')
				.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc list-inside">$1</li>')
				// Listas ordenadas
				.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal list-inside">$1</li>')
				// Saltos de línea
				.replace(/\n/g, '<br>');

			// Envolver listas consecutivas en ul/ol
			html = html.replace(/(<li class="ml-4 list-disc[^>]*>.*?<\/li>(?:<br>)*)+/g, '<ul class="mb-4">$&</ul>');
			html = html.replace(/(<li class="ml-4 list-decimal[^>]*>.*?<\/li>(?:<br>)*)+/g, '<ol class="mb-4">$&</ol>');
			
			return html;
		}, []);

		const sizeTokens = noteTokens?.sizes[size] || {
			fontSize: "text-sm",
			paddingX: "px-3",
			paddingY: "py-2",
			minHeight: "min-h-[120px]"
		};

		const baseClasses = [
			"w-full", "rounded-md", "transition-all", "border", "resize-none",
			sizeTokens.fontSize, sizeTokens.paddingX, sizeTokens.paddingY,
			minHeight || sizeTokens.minHeight,
			"placeholder:text-[var(--note-placeholder)]",
			"text-[var(--note-text)]"
		];

		const stateClasses: string[] = [];
		if (disabled) {
			stateClasses.push(
				"border-[var(--note-disabled-border)]",
				"bg-[var(--note-disabled-bg)]",
				"text-[var(--note-disabled-text)]",
				"cursor-not-allowed",
				"opacity-70"
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
				"bg-[var(--note-bg)]"
			);
		}

		const focusClasses: string[] = [];
		if (!disabled && !readOnly) {
			focusClasses.push(
				"focus:outline-none",
				"focus:border-[var(--note-focus-border)]",
				"focus:shadow-[0_0_0_3px_var(--note-focus-ring)]"
			);
		}

		const textareaClasses = cn(...baseClasses, ...stateClasses, ...focusClasses, className);
		//#endregion ![sub_render_helpers]

		//#region [render] - 🎨 RENDER 🎨
		return (
			<div className="w-full space-y-2" {...props}>
				{/* Toolbar */}
				{showToolbar && !disabled && !readOnly && (
					<div className="flex items-center gap-1 p-2 border rounded-md bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
						<StandardButton
							size="sm"
							styleType="ghost"
							colorScheme="neutral"
							leftIcon={Bold}
							onClick={handleBold}
							tooltip="Negrita (Ctrl+B)"
						/>
						<StandardButton
							size="sm"
							styleType="ghost"
							colorScheme="neutral"
							leftIcon={Italic}
							onClick={handleItalic}
							tooltip="Itálica (Ctrl+I)"
						/>
						<StandardButton
							size="sm"
							styleType="ghost"
							colorScheme="neutral"
							leftIcon={Highlighter}
							onClick={handleHighlight}
							tooltip="Resaltar texto"
						/>
						<StandardButton
							size="sm"
							styleType="ghost"
							colorScheme="neutral"
							leftIcon={Link}
							onClick={handleLink}
							tooltip="Insertar enlace"
						/>
						
						<div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />
						
						<StandardButton
							size="sm"
							styleType="ghost"
							colorScheme="neutral"
							leftIcon={Heading1}
							onClick={handleH1}
							tooltip="Título 1"
						/>
						<StandardButton
							size="sm"
							styleType="ghost"
							colorScheme="neutral"
							leftIcon={Heading2}
							onClick={handleH2}
							tooltip="Título 2"
						/>
						<StandardButton
							size="sm"
							styleType="ghost"
							colorScheme="neutral"
							leftIcon={Heading3}
							onClick={handleH3}
							tooltip="Título 3"
						/>
						
						<div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />
						
						<StandardButton
							size="sm"
							styleType="ghost"
							colorScheme="neutral"
							leftIcon={List}
							onClick={handleBulletList}
							tooltip="Lista con viñetas"
						/>
						<StandardButton
							size="sm"
							styleType="ghost"
							colorScheme="neutral"
							leftIcon={ListOrdered}
							onClick={handleOrderedList}
							tooltip="Lista numerada"
						/>

						{showPreview && (
							<>
								<div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />
								<StandardButton
									size="sm"
									styleType="ghost"
									colorScheme={currentMode === "preview" ? "primary" : "neutral"}
									leftIcon={currentMode === "preview" ? FileText : Eye}
									onClick={handleModeToggle}
									tooltip={currentMode === "preview" ? "Editar" : "Vista previa"}
								/>
							</>
						)}
					</div>
				)}

				{/* Editor/Preview */}
				{livePreview ? (
					/* Vista previa en vivo - Pantalla dividida */
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						{/* Panel de Edición */}
						<div className="relative">
							<div className="absolute top-2 left-3 z-10">
								<StandardText size="xs" colorScheme="neutral" className="opacity-60 font-medium">
									Markdown
								</StandardText>
							</div>
							<textarea
								ref={textareaRef}
								id={id}
								name={name}
								className={cn(textareaClasses, "pt-8")}
								value={internalValue || ""}
								onChange={handleChange}
								placeholder={placeholder}
								disabled={disabled}
								readOnly={readOnly}
							/>
						</div>

						{/* Panel de Vista Previa */}
						<div className="relative">
							<div className="absolute top-2 left-3 z-10">
								<StandardText size="xs" colorScheme="neutral" className="opacity-60 font-medium">
									Vista Previa
									{internalValue !== debouncedValue && (
										<span className="ml-2 inline-flex items-center">
											<div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
										</span>
									)}
								</StandardText>
							</div>
							<div
								ref={previewRef}
								className={cn(
									"w-full rounded-md border p-3 pt-8 prose prose-sm max-w-none overflow-y-auto",
									"bg-[var(--note-bg)] border-[var(--note-border)] text-[var(--note-text)]",
									minHeight || sizeTokens.minHeight,
									"transition-opacity duration-200",
									internalValue !== debouncedValue ? "opacity-75" : "opacity-100"
								)}
								dangerouslySetInnerHTML={{
									__html: debouncedValue ? renderMarkdown(debouncedValue) : `<span class="text-[var(--note-placeholder)]">${placeholder}</span>`
								}}
							/>
						</div>
					</div>
				) : (
					/* Modo tradicional - Toggle entre edición y preview */
					<div className="relative">
						{currentMode === "edit" ? (
							<textarea
								ref={textareaRef}
								id={id}
								name={name}
								className={textareaClasses}
								value={internalValue || ""}
								onChange={handleChange}
								placeholder={placeholder}
								disabled={disabled}
								readOnly={readOnly}
							/>
						) : (
							<div
								ref={previewRef}
								className={cn(
									"w-full rounded-md border p-3 prose prose-sm max-w-none",
									"bg-[var(--note-bg)] border-[var(--note-border)] text-[var(--note-text)]",
									minHeight || sizeTokens.minHeight
								)}
								dangerouslySetInnerHTML={{
									__html: internalValue ? renderMarkdown(internalValue) : `<span class="text-[var(--note-placeholder)]">${placeholder}</span>`
								}}
							/>
						)}
					</div>
				)}
			</div>
		);
		//#endregion ![render]
	}
);
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
StandardNoteBeta.displayName = "StandardNoteBeta";
export { StandardNoteBeta };
//#endregion ![foo]
