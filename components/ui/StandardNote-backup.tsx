//. 📍 components/ui/StandardNote.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/theme-provider";
import {
	generateStandardNoteTokens,
	type StandardNoteSize,
	type StandardNoteVariant,
	type StandardNoteTokens,
} from "@/lib/theme/components/standard-note-tokens";
import { StandardButton } from "./StandardButton";
import { StandardTextarea } from "./StandardTextarea";
import { SustratoLoadingLogo } from "./sustrato-loading-logo";
import { StandardText } from "./StandardText";
import styles from "./StandardNote.module.css";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { 
	Bold, 
	Italic, 
	List, 
	ListOrdered, 
	Quote, 
	Code, 
	Link, 
	Image, 
	Eye, 
	FileText 
} from "lucide-react";

// Importación dinámica de react-md-editor para evitar problemas de SSR
const MDEditor = React.lazy(() => import("@uiw/react-md-editor"));

// Variable para controlar si el editor está cargado
let isEditorLoaded = false;

// Load MDEditor dynamically
const loadMDEditor = async () => {
	if (typeof window !== 'undefined' && !isEditorLoaded) {
		await import('@uiw/react-md-editor');
		isEditorLoaded = true;
	}
};
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACE 📦
export interface StandardNoteProps {
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	colorScheme?: ColorSchemeVariant;
	size?: StandardNoteSize;
	disabled?: boolean;
	readOnly?: boolean;
	className?: string;
	id?: string;
	name?: string;
	showToolbar?: boolean;
	showModeToggle?: boolean;
	initialMode?: "wysiwyg" | "raw";
	toolbarItems?: ToolbarItem[];
}

export type ToolbarItem = 
	| "bold" 
	| "italic" 
	| "underline" 
	| "strikethrough"
	| "separator"
	| "heading"
	| "list"
	| "orderedList"
	| "quote"
	| "code"
	| "codeBlock"
	| "link"
	| "image"
	| "undo"
	| "redo";

const defaultToolbarItems: ToolbarItem[] = [
	"bold", "italic", "underline", "strikethrough",
	"separator",
	"heading", "list", "orderedList", "quote",
	"separator", 
	"code", "codeBlock", "link", "image",
	"separator",
	"undo", "redo"
];
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
const StandardNote = React.forwardRef<HTMLDivElement, StandardNoteProps>(
	(
		{
			value = "",
			onChange,
			placeholder = "Escribe tu nota aquí...",
			colorScheme,
			size = "md",
			disabled = false,
			readOnly = false,
			className,
			id,
			name,
			showToolbar = true,
			showModeToggle = true,
			initialMode = "wysiwyg",
			toolbarItems = defaultToolbarItems,
			...props
		},
		ref
	) => {
		//#region [sub_bridge] - 🌉 THE BRIDGE 🌉
		const validVariants: StandardNoteVariant[] = [
			"default", "primary", "secondary", "tertiary", "accent", "neutral"
		];
		const effectiveColorScheme: StandardNoteVariant =
			colorScheme && validVariants.includes(colorScheme as StandardNoteVariant)
				? (colorScheme as StandardNoteVariant)
				: "default";
		//#endregion ![sub_bridge]

		//#region [sub_init] - 🪝 HOOKS, STATE, REFS, MEMOS 🪝
		const { appColorTokens, mode } = useTheme();
		const containerRef = React.useRef<HTMLDivElement>(null);
		const [currentMode, setCurrentMode] = React.useState<"wysiwyg" | "raw">(initialMode);
		const [internalValue, setInternalValue] = React.useState(value);
		const [isClient, setIsClient] = React.useState(false);
		const [isLoading, setIsLoading] = React.useState(true);
		const [isFirstLoad, setIsFirstLoad] = React.useState(false);

		React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

		// Handle client-side rendering for MDXEditor
		React.useEffect(() => {
			setIsClient(true);
			
			// Detectar si es la primera vez que se carga el editor
			const hasLoadedBefore = localStorage.getItem('mdx-editor-loaded');
			if (!hasLoadedBefore) {
				setIsFirstLoad(true);
			}
			
			// Pre-load MDXEditor
			loadMDXEditor().then(() => {
				setIsLoading(false);
				if (!hasLoadedBefore) {
					localStorage.setItem('mdx-editor-loaded', 'true');
				}
			}).catch(() => {
				setIsLoading(false);
			});
		}, []);

		// Sync external value changes
		React.useEffect(() => {
			setInternalValue(value);
		}, [value]);

		const noteTokens: StandardNoteTokens | null = React.useMemo(() => {
			if (!appColorTokens || !mode) return null;
			return generateStandardNoteTokens(appColorTokens, mode);
		}, [appColorTokens, mode]);
		//#endregion ![sub_init]

		//#region [sub_effects] - 💡 EFFECTS 💡
		React.useEffect(() => {
			const element = containerRef.current;
			if (element && noteTokens && appColorTokens) {
				const cvt = noteTokens.variants[effectiveColorScheme];

				// Set CSS custom properties for styling
				element.style.setProperty("--note-bg", cvt.background);
				element.style.setProperty("--note-border", cvt.border);
				element.style.setProperty("--note-border-radius", cvt.borderRadius);
				element.style.setProperty("--note-shadow", cvt.shadow);
				
				// Toolbar
				element.style.setProperty("--note-toolbar-bg", cvt.toolbarBackground);
				element.style.setProperty("--note-toolbar-border", cvt.toolbarBorder);
				element.style.setProperty("--note-toolbar-btn-bg", cvt.toolbarButtonBackground);
				element.style.setProperty("--note-toolbar-btn-bg-hover", cvt.toolbarButtonBackgroundHover);
				element.style.setProperty("--note-toolbar-btn-bg-active", cvt.toolbarButtonBackgroundActive);
				element.style.setProperty("--note-toolbar-btn-text", cvt.toolbarButtonText);
				element.style.setProperty("--note-toolbar-btn-text-hover", cvt.toolbarButtonTextHover);
				element.style.setProperty("--note-toolbar-btn-text-active", cvt.toolbarButtonTextActive);
				element.style.setProperty("--note-toolbar-btn-border", cvt.toolbarButtonBorder);
				element.style.setProperty("--note-toolbar-btn-border-hover", cvt.toolbarButtonBorderHover);
				element.style.setProperty("--note-toolbar-btn-border-active", cvt.toolbarButtonBorderActive);
				element.style.setProperty("--note-toolbar-separator", cvt.toolbarSeparator);
				
				// Editor
				element.style.setProperty("--note-editor-bg", cvt.editorBackground);
				element.style.setProperty("--note-editor-text", cvt.editorText);
				element.style.setProperty("--note-editor-placeholder", cvt.editorPlaceholder);
				element.style.setProperty("--note-editor-border", cvt.editorBorder);
				element.style.setProperty("--note-editor-focus-border", cvt.editorFocusBorder);
				element.style.setProperty("--note-editor-focus-ring", cvt.editorFocusRing);
				
				// Mode toggle
				element.style.setProperty("--note-mode-toggle-bg", cvt.modeToggleBackground);
				element.style.setProperty("--note-mode-toggle-bg-hover", cvt.modeToggleBackgroundHover);
				element.style.setProperty("--note-mode-toggle-bg-active", cvt.modeToggleBackgroundActive);
				element.style.setProperty("--note-mode-toggle-text", cvt.modeToggleText);
				element.style.setProperty("--note-mode-toggle-text-hover", cvt.modeToggleTextHover);
				element.style.setProperty("--note-mode-toggle-text-active", cvt.modeToggleTextActive);
				element.style.setProperty("--note-mode-toggle-border", cvt.modeToggleBorder);
				element.style.setProperty("--note-mode-toggle-border-hover", cvt.modeToggleBorderHover);
				element.style.setProperty("--note-mode-toggle-border-active", cvt.modeToggleBorderActive);
				
				// Raw mode
				element.style.setProperty("--note-raw-bg", cvt.rawBackground);
				element.style.setProperty("--note-raw-text", cvt.rawText);
				element.style.setProperty("--note-raw-border", cvt.rawBorder);
				element.style.setProperty("--note-raw-placeholder", cvt.rawPlaceholder);
				
				// States
				element.style.setProperty("--note-disabled-bg", cvt.disabledBackground);
				element.style.setProperty("--note-disabled-border", cvt.disabledBorder);
				element.style.setProperty("--note-disabled-text", cvt.disabledText);
				element.style.setProperty("--note-readonly-bg", cvt.readOnlyBackground);
				element.style.setProperty("--note-readonly-border", cvt.readOnlyBorder);
				element.style.setProperty("--note-readonly-text", cvt.readOnlyText);
			}
		}, [noteTokens, effectiveColorScheme, appColorTokens, disabled, readOnly, id, name]);
		//#endregion ![sub_effects]

		//#region [sub_handlers] - 🎯 EVENT HANDLERS 🎯
		const handleValueChange = React.useCallback((newValue: string) => {
			setInternalValue(newValue);
			onChange?.(newValue);
		}, [onChange]);

		const handleModeToggle = React.useCallback(() => {
			setCurrentMode(prev => prev === "wysiwyg" ? "raw" : "wysiwyg");
		}, []);

		const handleRawTextChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const newValue = e.target.value;
			handleValueChange(newValue);
		}, [handleValueChange]);
		//#endregion ![sub_handlers]

		//#region [sub_render_helpers] - 🎨 RENDER HELPERS 🎨
		const sizeTokens = noteTokens?.sizes[size] || {
			containerHeight: "h-80",
			containerMinHeight: "min-h-[20rem]",
			toolbarHeight: "h-12",
			toolbarPadding: "px-3 py-2",
			editorPadding: "p-4",
			fontSize: "text-base",
			toolbarButtonSize: "h-9 w-9",
			toolbarButtonPadding: "p-1.5",
			toolbarButtonFontSize: "text-sm",
		};

		const renderToolbarButton = (item: ToolbarItem, index: number) => {
			if (item === "separator") {
				return (
					<div
						key={`separator-${index}`}
						className="w-px h-6 bg-[var(--note-toolbar-separator)] mx-1"
					/>
				);
			}

			const iconMap = {
				bold: Bold,
				italic: Italic,
				underline: Underline,
				strikethrough: Strikethrough,
				list: List,
				orderedList: ListOrdered,
				quote: Quote,
				code: Code,
				link: Link,
				image: Image,
			};

			const tooltipMap = {
				bold: "Negrita (Ctrl+B)",
				italic: "Cursiva (Ctrl+I)",
				underline: "Subrayado (Ctrl+U)",
				strikethrough: "Tachado",
				list: "Lista con viñetas",
				orderedList: "Lista numerada",
				quote: "Cita",
				code: "Código en línea",
				link: "Insertar enlace",
				image: "Insertar imagen",
				heading: "Encabezado",
				codeBlock: "Bloque de código",
				undo: "Deshacer (Ctrl+Z)",
				redo: "Rehacer (Ctrl+Y)"
			};

			const Icon = iconMap[item as keyof typeof iconMap];
			if (!Icon) return null;

			return (
				<StandardButton
					key={item}
					styleType="ghost"
					size="sm"
					className={cn(
						sizeTokens.toolbarButtonSize,
						sizeTokens.toolbarButtonPadding,
						sizeTokens.toolbarButtonFontSize,
						"bg-[var(--note-toolbar-btn-bg)] border-[var(--note-toolbar-btn-border)]",
						"text-[var(--note-toolbar-btn-text)]",
						"hover:bg-[var(--note-toolbar-btn-bg-hover)] hover:border-[var(--note-toolbar-btn-border-hover)]",
						"hover:text-[var(--note-toolbar-btn-text-hover)]",
						"active:bg-[var(--note-toolbar-btn-bg-active)] active:border-[var(--note-toolbar-btn-border-active)]",
						"active:text-[var(--note-toolbar-btn-text-active)]",
						"transition-all duration-200"
					)}
					disabled={disabled}
					tooltip={tooltipMap[item as keyof typeof tooltipMap]}
					onClick={() => {
						// TODO: Implementar acciones de formato para modo raw
						console.log(`Acción de formato: ${item}`);
					}}
				>
					<Icon className="h-4 w-4" />
				</StandardButton>
			);
		};

		const renderCustomToolbar = () => {
			if (!showToolbar) return null;

			return (
				<div className={cn(
					"flex items-center gap-1 border-b",
					sizeTokens.toolbarHeight,
					sizeTokens.toolbarPadding,
					"bg-[var(--note-toolbar-bg)] border-[var(--note-toolbar-border)]",
					"rounded-t-[var(--note-border-radius)]"
				)}>
					<div className="flex items-center gap-1 flex-1">
						{toolbarItems.map((item, index) => renderToolbarButton(item, index))}
					</div>
					
					{showModeToggle && (
						<StandardButton
							styleType="ghost"
							size="sm"
							onClick={handleModeToggle}
							tooltip={currentMode === "wysiwyg" ? "Cambiar a modo texto (Markdown)" : "Cambiar a modo visual (WYSIWYG)"}
							className={cn(
								"ml-2",
								sizeTokens.toolbarButtonSize,
								sizeTokens.toolbarButtonPadding,
								sizeTokens.toolbarButtonFontSize,
								"bg-[var(--note-mode-toggle-bg)] border-[var(--note-mode-toggle-border)]",
								"text-[var(--note-mode-toggle-text)]",
								"hover:bg-[var(--note-mode-toggle-bg-hover)] hover:border-[var(--note-mode-toggle-border-hover)]",
								"hover:text-[var(--note-mode-toggle-text-hover)]",
								"active:bg-[var(--note-mode-toggle-bg-active)] active:border-[var(--note-mode-toggle-border-active)]",
								"active:text-[var(--note-mode-toggle-text-active)]",
								"transition-all duration-200"
							)}
							disabled={disabled}
						>
							{currentMode === "wysiwyg" ? (
								<FileText className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
						</StandardButton>
					)}
				</div>
			);
		};

		const renderEditor = () => {
			if (currentMode === "raw") {
				return (
					<StandardTextarea
						value={internalValue}
						onChange={handleRawTextChange}
						placeholder={placeholder || "Escribe tus notas en formato Markdown..."}
						disabled={disabled}
						readOnly={readOnly}
						className={cn(
							styles.rawTextarea,
							"border-0 rounded-none resize-none",
							sizeTokens.editorPadding,
							sizeTokens.fontSize,
							"bg-[var(--note-raw-bg)] text-[var(--note-raw-text)]",
							"placeholder:text-[var(--note-raw-placeholder)]",
							"focus:ring-0 focus:border-0",
							showToolbar ? "rounded-t-none" : "rounded-t-[var(--note-border-radius)]",
							"rounded-b-[var(--note-border-radius)]"
						)}
						rows={12}
					/>
				);
			}

			if (!isClient || isLoading || !MDXEditor) {
				return (
					<div className={cn(
						"flex flex-col items-center justify-center gap-4",
						sizeTokens.editorPadding,
						"bg-[var(--note-editor-bg)] text-[var(--note-editor-text)]",
						showToolbar ? "rounded-t-none" : "rounded-t-[var(--note-border-radius)]",
						"rounded-b-[var(--note-border-radius)]",
						"min-h-[200px]"
					)}>
						<SustratoLoadingLogo 
							size={48}
							variant="spin-pulse"
							speed="normal"
							showText={true}
							text="Cargando editor..."
						/>
						{isFirstLoad && (
							<div className="text-center max-w-sm">
								<StandardText 
									preset="body" 
									size="sm" 
									colorScheme="neutral"
									className="opacity-70"
								>
									¿Primera vez usando el editor? La carga inicial puede tomar unos momentos mientras descargamos los componentes necesarios.
								</StandardText>
							</div>
						)}
					</div>
				);
			}

			return (
				<div 
					className={cn(
						styles.noteContainer,
						sizeTokens.editorPadding,
						sizeTokens.fontSize,
						"bg-[var(--note-editor-bg)] text-[var(--note-editor-text)]",
						showToolbar ? "rounded-t-none" : "rounded-t-[var(--note-border-radius)]",
						"rounded-b-[var(--note-border-radius)]",
						"min-h-[200px]"
					)}>
					<MDXEditor
						markdown={internalValue}
						onChange={handleValueChange}
						placeholder={placeholder || "Escribe tus notas aquí..."}
						readOnly={readOnly || disabled}
						contentEditableClassName="prose prose-sm max-w-none focus:outline-none"
						plugins={[
							// Plugins básicos para permitir edición y formato
							mdxPlugins.headingsPlugin(),
							mdxPlugins.listsPlugin(),
							mdxPlugins.quotePlugin(),
							mdxPlugins.thematicBreakPlugin(),
							mdxPlugins.markdownShortcutPlugin(),
							mdxPlugins.linkPlugin(),
							mdxPlugins.imagePlugin(),
							mdxPlugins.codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
							mdxPlugins.codeMirrorPlugin({ 
								codeBlockLanguages: { 
									txt: 'Plain Text', 
									js: 'JavaScript', 
									ts: 'TypeScript', 
									jsx: 'JSX', 
									tsx: 'TSX', 
									css: 'CSS', 
									html: 'HTML', 
									json: 'JSON', 
									md: 'Markdown' 
								} 
							}),
						]}
						className="mdxeditor"
					/>
				</div>
			);
		};
		//#endregion ![sub_render_helpers]

		//#region [render] - 🎨 RENDER 🎨
		const containerClasses = cn(
			"w-full overflow-hidden transition-all duration-200",
			sizeTokens.containerHeight,
			sizeTokens.containerMinHeight,
			"bg-[var(--note-bg)] border-[var(--note-border)] shadow-[var(--note-shadow)]",
			"rounded-[var(--note-border-radius)]",
			{
				"opacity-60 cursor-not-allowed": disabled,
				"opacity-80": readOnly,
			},
			className
		);

		return (
			<div
				ref={containerRef}
				id={id}
				className={containerClasses}
				{...props}
			>
				{renderCustomToolbar()}
				{renderEditor()}
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
