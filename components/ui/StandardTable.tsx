// StandardTable.tsx
"use client";

import React, {
	useMemo,
	useState,
	useRef,
	Children,
	isValidElement,
	cloneElement,
	useLayoutEffect,
} from "react";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
	getFilteredRowModel,
	getSortedRowModel,
	getExpandedRowModel,
	type Cell,
	type Header,
	type Row,
	type SortingState,
	type Table,
	type CellContext,
} from "@tanstack/react-table";

// Definir nuestras propias interfaces de metadatos sin extender las existentes
declare module "@tanstack/table-core" {
	// Sobrescribir completamente la interfaz ColumnMeta
	interface ColumnMeta<TData = unknown, TValue = unknown> {
		align?: "left" | "center" | "right";
		isSticky?: "left" | "right";
		size?: number;
		isTruncatable?: boolean;
		tooltipType?: "standard" | "longText";
		cellVariant?: (
			context: CellContext<TData, TValue>
		) => "highlight" | "success" | "warning" | "danger" | undefined;
		// 📋 Mini botón ghost para copiar contenido de celda
		enableCopyButton?: boolean;
	}

	// Sobrescribir completamente la interfaz TableMeta
	interface TableMeta<TData = unknown> {
		getRowStatus?: (
			row: TData
		) => Exclude<
			ColorSchemeVariant,
			"neutral" | "white" | "default" | "info"
		> | null;
		filterPlaceholder?: string;
		renderSubComponent?: (row: Row<TData>) => React.ReactNode;
		truncateRowsTo?: number | null;
		// 🔍 Keyword highlighting properties
		enableKeywordHighlighting?: boolean;
		keywordHighlight?: string | null;
	}
}
import { useTheme } from "@/app/theme-provider";
import { cn } from "@/lib/utils";
import { generateTableTokens } from "@/lib/theme/components/standard-table-tokens";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardIcon } from "@/components/ui/StandardIcon";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDropdownMenu } from "@/components/ui/StandardDropdownMenu";
import { StandardText } from "@/components/ui/StandardText";
import { StandardTooltip } from "@/components/ui/StandardTooltip";
import {
	ChevronDown,
	ChevronUp,
	ChevronsUpDown,
	ChevronRight,
	Columns,
	Rows,
	Copy,
	Check,
	Download,
} from "lucide-react";
import { motion } from "framer-motion";
// import tinycolor from "tinycolor2"; // ⚠️ Ya no se usa para el gradiente del header

// Extensión de tipos de TanStack Table

export interface StandardTableProps<TData extends object> {
	data: TData[];
	columns: ColumnDef<TData, unknown>[];
	isStickyHeader?: boolean;
	stickyOffset?: number;
	maxTableHeight?: string;
	getRowStatus?: (
		row: TData
	) => Exclude<
		ColorSchemeVariant,
		"neutral" | "white" | "default" | "info"
	> | null;
	children?: React.ReactNode;
	className?: string;
	filterPlaceholder?: string;
	renderSubComponent?: (row: Row<TData>) => React.ReactNode;
	enableTruncation?: boolean;
	truncateRowsTo?: number | null;
	onTruncateRowsChange?: (lines: number | null) => void;
	// 🔍 Keyword Highlighting (Prototipo)
	enableKeywordHighlighting?: boolean;
	keywordHighlightPlaceholder?: string;
	onKeywordChange?: (keyword: string | null) => void;
	// 📄 CSV Export
	enableCsvExport?: boolean;
	csvFileName?: string;
	// 🎛️ Toolbar visibility controls
	showColumnSelector?: boolean;
	showTruncationDropdown?: boolean;
	// 🧰 Mostrar/ocultar toda la toolbar
	showToolbar?: boolean;
	// 🎨 Color del header (se alinea con acordeón)
	colorScheme?: ColorSchemeVariant;
}

interface SubComponentProps<TData extends object> {
	table?: Table<TData>;
	[key: string]: unknown;
}

const StandardTableToolbar = <TData extends object>({
	table,
	enableTruncation,
	onTruncateChange,
	truncateValue,
	// 🔍 Keyword Highlighting Props
	enableKeywordHighlighting,
	keywordHighlightPlaceholder,
	onKeywordChange,
	keywordHighlight,
	// 📄 CSV Export Props
	enableCsvExport,
	csvFileName,
	// 🎛️ Toolbar visibility controls
	showColumnSelector = true,
	showTruncationDropdown = true,
}: {
	table: Table<TData>;
	enableTruncation?: boolean;
	onTruncateChange?: (lines: number | null) => void;
	truncateValue?: number | null;
	// 🔍 Keyword Highlighting Props
	enableKeywordHighlighting?: boolean;
	keywordHighlightPlaceholder?: string;
	onKeywordChange?: (keyword: string | null) => void;
	keywordHighlight?: string | null;
	// 📄 CSV Export Props
	enableCsvExport?: boolean;
	csvFileName?: string;
	// 🎛️ Toolbar visibility controls
	showColumnSelector?: boolean;
	showTruncationDropdown?: boolean;
}) => {
	// 🔍 Estado para keyword temporal (debe estar antes del early return)
	const [tempKeyword, setTempKeyword] = useState("");

	// 📄 Función para exportar datos a CSV
	const handleExportCsv = () => {
		if (!enableCsvExport) return;

		// Obtener columnas visibles (excluyendo acciones y expansores)
		const visibleColumns = table
			.getVisibleLeafColumns()
			.filter((column) => !["expander", "actions"].includes(column.id));

		// Crear headers del CSV
		const headers = visibleColumns.map((column) => {
			const headerValue = column.columnDef.header;
			if (typeof headerValue === "string") return headerValue;
			if (typeof headerValue === "function") {
				// Para headers de función, usar el id de la columna como fallback
				return column.id;
			}
			return column.id;
		});

		// Obtener filas visibles
		const rows = table.getFilteredRowModel().rows.map((row) => {
			return visibleColumns.map((column) => {
				const cellValue = row.getValue(column.id);
				// Convertir a string y limpiar para CSV
				let value = String(cellValue ?? "");
				// Escapar comillas dobles
				value = value.replace(/"/g, '""');
				// Envolver en comillas si contiene comas, saltos de línea o comillas
				if (
					value.includes(",") ||
					value.includes("\n") ||
					value.includes('"')
				) {
					value = `"${value}"`;
				}
				return value;
			});
		});

		// Crear contenido CSV
		const csvContent = [headers, ...rows]
			.map((row) => row.join(","))
			.join("\n");

		// Crear y descargar archivo
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute("download", csvFileName || "tabla-datos.csv");
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	if (
		!table ||
		onTruncateChange === undefined ||
		enableTruncation === undefined
	)
		return null;

	// 🔍 Funciones para manejar keyword highlighting
	const handleApplyKeyword = () => {
		if (tempKeyword.trim()) {
			onKeywordChange?.(tempKeyword.trim());
		}
	};

	const handleClearKeyword = () => {
		setTempKeyword("");
		onKeywordChange?.(null);
	};

	const { globalFilter } = table.getState();
	const filterPlaceholder =
		(table.options.meta && table.options.meta.filterPlaceholder) || "Buscar...";
	const allColumns = table.getAllLeafColumns();
	const truncateOptions = [
		{ label: "Ver todo", value: null },
		{ label: "1 línea", value: 1 },
		{ label: "2 líneas", value: 2 },
		{ label: "3 líneas", value: 3 },
		{ label: "5 líneas", value: 5 },
	];

	return (
		<div className="p-4 border-b border-[var(--table-header-borderColor)] bg-[var(--table-row-default-backgroundColor)]">
			<div className="flex items-center justify-start gap-4">
				{/* 🔎 Filtro global */}
				<StandardInput
					placeholder={filterPlaceholder}
					value={globalFilter ?? ""}
					onChange={(e) => table.setGlobalFilter(e.target.value)}
					className="w-full max-w-xs"
				/>

				{/* 🔍 Keyword Highlighting */}
				<div
					className={`flex items-center gap-2 mr-4 ${enableKeywordHighlighting ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
					<StandardInput
						placeholder={
							keywordHighlightPlaceholder || "Resaltar palabra clave..."
						}
						value={tempKeyword}
						onChange={(e) => setTempKeyword(e.target.value)}
						className="w-80"
						colorScheme="accent"
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleApplyKeyword();
							}
						}}
					/>
					<StandardButton
						styleType="solid"
						colorScheme="accent"
						size="sm"
						onClick={handleApplyKeyword}
						disabled={!tempKeyword.trim()}>
						Aplicar
					</StandardButton>
					<StandardButton
						styleType="outline"
						colorScheme="neutral"
						size="sm"
						onClick={handleClearKeyword}
						disabled={!keywordHighlight}>
						Limpiar
					</StandardButton>
				</div>

				{/* 📄 Exportar CSV */}
				{enableCsvExport && (
					<StandardButton
						styleType="outline"
						colorScheme="accent"
						size="sm"
						leftIcon={Download}
						onClick={handleExportCsv}
						tooltip="Descargar datos en CSV">
						Exportar CSV
					</StandardButton>
				)}

				{/* 📊 Selector de columnas */}
				{showColumnSelector && (
					<StandardDropdownMenu>
						<StandardDropdownMenu.Trigger asChild>
							<StandardButton
								styleType="outline"
								leftIcon={Columns}
								size="sm"
								tooltip="ocultar/mostrar columnas">
								Columnas
							</StandardButton>
						</StandardDropdownMenu.Trigger>
						<StandardDropdownMenu.Content align="end">
							<StandardDropdownMenu.Label>
								Mostrar/Ocultar Columnas
							</StandardDropdownMenu.Label>
							<StandardDropdownMenu.Separator />
							{allColumns.map((column) => {
								const canToggle =
									column.getCanHide() &&
									!["expander", "actions"].includes(column.id);
								return (
									<StandardDropdownMenu.CheckboxItem
										key={column.id}
										className="capitalize"
										checked={column.getIsVisible()}
										onCheckedChange={(value: boolean) =>
											column.toggleVisibility(!!value)
										}
										disabled={!canToggle}>
										{typeof column.columnDef.header === "string" ?
											column.columnDef.header
										:	column.id}
									</StandardDropdownMenu.CheckboxItem>
								);
							})}
						</StandardDropdownMenu.Content>
					</StandardDropdownMenu>
				)}

				{/* 🧵 Truncación de filas */}
				{enableTruncation && showTruncationDropdown && (
					<StandardDropdownMenu>
						<StandardDropdownMenu.Trigger asChild>
							<StandardButton
								styleType="outline"
								leftIcon={Rows}
								size="sm"
								tooltip="línea(s) de texto visibles en las filas">
								{truncateValue ? `${truncateValue} línea(s)` : "Ver todo"}
							</StandardButton>
						</StandardDropdownMenu.Trigger>
						<StandardDropdownMenu.Content align="start">
							<StandardDropdownMenu.Label>
								Máximo de líneas por fila
							</StandardDropdownMenu.Label>
							<StandardDropdownMenu.Separator />
							{truncateOptions.map((opt) => (
								<StandardDropdownMenu.Item
									key={opt.label}
									onSelect={() => onTruncateChange?.(opt.value)}>
									{opt.label}
								</StandardDropdownMenu.Item>
							))}
						</StandardDropdownMenu.Content>
					</StandardDropdownMenu>
				)}
			</div>
		</div>
	);
};

const StandardTableHeaderCell = <TData extends object, TValue>({
	header,
	colorScheme,
}: {
	header: Header<TData, TValue>;
	colorScheme: ColorSchemeVariant;
}) => {
	const canSort = header.column.getCanSort();
	const meta = header.column.columnDef.meta;
	const align = meta?.align || "left";
	const isSticky = meta?.isSticky;
	return (
		<th
			className={cn(
				"px-4 py-3 font-medium border-b border-r border-[var(--table-header-borderColor)] group",
				{ "cursor-pointer select-none": canSort },
				{ "sticky z-10": isSticky },
				isSticky === "left" ? "left-0" : "",
				isSticky === "right" ? "right-0" : ""
			)}
			style={{
				width: header.getSize(),
				minWidth: header.getSize(),
				maxWidth: header.getSize(),
				// ✅ Fondo sólido para columnas sticky derechas
				backgroundColor:
					isSticky === "right" ?
						"var(--table-header-backgroundColor)"
					:	"transparent",
			}}
			onClick={header.column.getToggleSortingHandler()}>
			<div
				className={cn("flex items-center gap-2", {
					"justify-start": align === "left",
					"justify-center": align === "center",
					"justify-end": align === "right",
				})}>
				{flexRender(header.column.columnDef.header, header.getContext())}
				{canSort && (
					<span className="opacity-60 group-hover:opacity-100 transition-opacity">
						<StandardIcon colorScheme={colorScheme} colorShade="contrastText">
							{header.column.getIsSorted() === "asc" ?
								<ChevronUp className="h-4 w-4" />
							: header.column.getIsSorted() === "desc" ?
								<ChevronDown className="h-4 w-4" />
							:	<ChevronsUpDown className="h-4 w-4" />}
						</StandardIcon>
					</span>
				)}
			</div>
		</th>
	);
};

const StandardTableHeader = <TData extends object>({
	table,
	colorScheme,
}: {
	table: Table<TData>;
	colorScheme: ColorSchemeVariant;
}) => {
	return (
		<thead
			className="sticky top-0 z-20"
			style={{ backgroundImage: "var(--table-header-backgroundColor)" }}>
			{table.getHeaderGroups().map((headerGroup) => (
				<tr
					key={headerGroup.id}
					className="text-[var(--table-header-foregroundColor)]">
					{headerGroup.headers.map((header) => (
						<StandardTableHeaderCell
							key={header.id}
							header={header}
							colorScheme={colorScheme}
						/>
					))}
				</tr>
			))}
		</thead>
	);
};

const ExpandIcon = ({ isExpanded }: { isExpanded: boolean }) => {
	return (
		<div className="flex items-center justify-center h-full w-full">
			<div
				className={cn(
					"flex items-center justify-center h-6 w-6 rounded-full border transition-colors",
					isExpanded ?
						"bg-[var(--table-expander-expandedCircleBackground)]"
					:	"bg-[var(--table-expander-circleBackground)]",
					"border-[var(--table-expander-circleBorderColor)]"
				)}>
				<motion.div
					animate={{ rotate: isExpanded ? 90 : 0 }}
					transition={{ duration: 0.2 }}>
					<StandardIcon>
						<ChevronRight
							size={16}
							className={cn(
								"transition-colors",
								isExpanded ?
									"text-[var(--table-expander-expandedIconColor)]"
								:	"text-[var(--table-expander-iconColor)]"
							)}
						/>
					</StandardIcon>
				</motion.div>
			</div>
		</div>
	);
};
ExpandIcon.displayName = "StandardTable.ExpandIcon";

// 🔍 Función para resaltar keywords en el texto usando tokens del sistema
const highlightKeyword = (
	text: string,
	keyword: string,
	highlightTokens: {
		backgroundColor: string;
		textColor: string;
		borderRadius: string;
		padding: string;
	}
): React.ReactNode => {
	if (!keyword.trim()) return text;

	const regex = new RegExp(
		`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
		"gi"
	);
	const parts = text.split(regex);

	return parts.map((part, index) => {
		if (regex.test(part)) {
			return (
				<mark
					key={index}
					style={{
						backgroundColor: highlightTokens.backgroundColor,
						color: highlightTokens.textColor,
						borderRadius: highlightTokens.borderRadius,
						padding: highlightTokens.padding,
					}}>
					{part}
				</mark>
			);
		}
		return part;
	});
};

const StandardTableCell = <TData extends object, TValue>({
	cell,
}: {
	cell: Cell<TData, TValue>;
}) => {
	const { appColorTokens, mode } = useTheme();
	const meta = cell.column.columnDef.meta;
	const align = meta?.align || "left";
	const isSticky = meta?.isSticky;
	const isTruncatable = meta?.isTruncatable || false;
	const cellVariant =
		meta?.cellVariant ? meta.cellVariant(cell.getContext()) : undefined;
	const tooltipType = meta?.tooltipType || "standard";
	const enableCopyButton = meta?.enableCopyButton || false;

	// 📋 Estado para feedback visual del botón de copiar
	const [copyFeedback, setCopyFeedback] = useState<
		"idle" | "copying" | "copied"
	>("idle");

	// 📋 Función para copiar contenido al clipboard con feedback visual
	const handleCopyToClipboard = async () => {
		const cellValue = cell.getValue();
		const textToCopy = String(cellValue ?? "");

		if (textToCopy.trim()) {
			setCopyFeedback("copying");
			try {
				await navigator.clipboard.writeText(textToCopy);
				setCopyFeedback("copied");
				// Resetear después de 1.5 segundos
				setTimeout(() => setCopyFeedback("idle"), 1500);
			} catch (err) {
				console.warn("Error al copiar al clipboard:", err);
				// Fallback para navegadores que no soportan clipboard API
				const textArea = document.createElement("textarea");
				textArea.value = textToCopy;
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand("copy");
				document.body.removeChild(textArea);
				setCopyFeedback("copied");
				// Resetear después de 1.5 segundos
				setTimeout(() => setCopyFeedback("idle"), 1500);
			}
		}
	};

	const cellClasses = cn(
		"px-4 py-3 align-top border-b border-r transition-colors",
		{
			"text-left": align === "left",
			"text-center": align === "center",
			"text-right": align === "right",
		},
		{
			"sticky z-10": isSticky,
			"left-0": isSticky === "left",
			"right-0": isSticky === "right",
		},
		{
			"bg-[var(--table-cell-highlight-backgroundColor)] text-[var(--table-cell-highlight-textColor)]":
				cellVariant === "highlight",
			"bg-[var(--table-cell-success-backgroundColor)] text-[var(--table-cell-success-textColor)]":
				cellVariant === "success",
			"bg-[var(--table-cell-warning-backgroundColor)] text-[var(--table-cell-warning-textColor)]":
				cellVariant === "warning",
			"bg-[var(--table-cell-danger-backgroundColor)] text-[var(--table-cell-danger-textColor)]":
				cellVariant === "danger",
		},
		!cellVariant && {
			"bg-[var(--table-row-default-backgroundColor)] text-[var(--table-row-default-textColor)]": true,
			"group-hover:bg-[var(--table-row-default-hoverBackgroundColor)]": true,
			"group-data-[status=success]:bg-[var(--table-row-status-success-backgroundColor)] group-data-[status=success]:text-[var(--table-row-status-success-textColor)] group-hover:group-data-[status=success]:bg-[var(--table-row-status-success-hoverBackgroundColor)]": true,
			"group-data-[status=warning]:bg-[var(--table-row-status-warning-backgroundColor)] group-data-[status=warning]:text-[var(--table-row-status-warning-textColor)] group-hover:group-data-[status=warning]:bg-[var(--table-row-status-warning-hoverBackgroundColor)]": true,
			"group-data-[status=danger]:bg-[var(--table-row-status-danger-backgroundColor)] group-data-[status=danger]:text-[var(--table-row-status-danger-foregroundColor)] group-hover:group-data-[status=danger]:bg-[var(--table-row-status-danger-hoverBackgroundColor)]": true,
		}
	);

	const textRef = useRef<HTMLDivElement>(null);
	const [isOverflowing, setIsOverflowing] = useState(false);

	const truncateLines = cell.getContext().table.options.meta?.truncateRowsTo;
	const shouldTruncate = truncateLines && isTruncatable;

	// 🔍 Obtener keyword highlighting desde el contexto de la tabla
	const keywordHighlight =
		cell.getContext().table.options.meta?.keywordHighlight;
	const enableKeywordHighlighting =
		cell.getContext().table.options.meta?.enableKeywordHighlighting;

	// 🔍 Aplicar highlighting si está habilitado y hay keyword
	let cellContent;
	if (enableKeywordHighlighting && keywordHighlight && appColorTokens && mode) {
		const cellValue = cell.getValue();
		if (typeof cellValue === "string" && cellValue) {
			// Generar tokens para el highlighting usando el color accent
			const tokens = generateTableTokens(appColorTokens, mode);
			cellContent = highlightKeyword(
				cellValue,
				keywordHighlight,
				tokens.keywordHighlight
			);
		} else {
			cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());
		}
	} else {
		cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());
	}

	useLayoutEffect(() => {
		if (shouldTruncate && textRef.current) {
			const hasOverflow =
				textRef.current.scrollHeight > textRef.current.clientHeight;
			if (hasOverflow !== isOverflowing) {
				setIsOverflowing(hasOverflow);
			}
		} else if (isOverflowing) {
			setIsOverflowing(false);
		}
	}, [shouldTruncate, cellContent, truncateLines, isOverflowing]);

	if (cell.column.id === "expander") {
		return (
			<td
				className={cn(cellClasses, {
					"cursor-pointer": cell.row.getCanExpand(),
				})}
				onClick={cell.row.getToggleExpandedHandler()}
				role="button"
				tabIndex={cell.row.getCanExpand() ? 0 : -1}
				aria-expanded={cell.row.getIsExpanded()}
				style={{
					width: cell.column.getSize(),
					minWidth: cell.column.getSize(),
					maxWidth: cell.column.getSize(),
					// ✅ Fondo sólido para columnas sticky derechas
					backgroundColor:
						isSticky === "right" ?
							"var(--table-row-default-backgroundColor)"
						:	undefined,
				}}>
				{cell.row.getCanExpand() ?
					<ExpandIcon isExpanded={cell.row.getIsExpanded()} />
				:	null}
			</td>
		);
	}

	if (shouldTruncate) {
		const truncatableContent = (
			<div
				ref={textRef}
				className={cn({
					"line-clamp-1": truncateLines === 1,
					"line-clamp-2": truncateLines === 2,
					"line-clamp-3": truncateLines === 3,
					"line-clamp-5": truncateLines === 5,
				})}>
				{cellContent}
			</div>
		);

		if (isOverflowing) {
			cellContent = (
				<StandardTooltip
					trigger={truncatableContent}
					isLongText={tooltipType === "longText"}
					side="bottom"
					align="start">
					<StandardText size="sm">{String(cell.getValue() ?? "")}</StandardText>
				</StandardTooltip>
			);
		} else {
			cellContent = truncatableContent;
		}
	}

	return (
		<td
			className={cn(cellClasses, "group relative", {
				"cursor-pointer": enableCopyButton,
			})}
			style={{
				width: cell.column.getSize(),
				minWidth: cell.column.getSize(),
				maxWidth: cell.column.getSize(),
				// ✅ Fondo sólido para columnas sticky derechas
				backgroundColor:
					isSticky === "right" ?
						"var(--table-row-default-backgroundColor)"
					:	undefined,
			}}>
			{cellContent}

			{/* 📋 Mini botón ghost para copiar con feedback visual */}
			{enableCopyButton && (
				<button
					onClick={handleCopyToClipboard}
					className={cn(
						"absolute top-1 right-1 p-1 rounded transition-all duration-200",
						{
							"opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800":
								copyFeedback === "idle",
							"opacity-100 bg-blue-100 dark:bg-blue-900":
								copyFeedback === "copying",
							"opacity-100 bg-green-100 dark:bg-green-900":
								copyFeedback === "copied",
						}
					)}
					title={
						copyFeedback === "copied" ? "¡Copiado!"
						: copyFeedback === "copying" ?
							"Copiando..."
						:	"Copiar contenido"
					}
					aria-label="Copiar contenido de la celda"
					disabled={copyFeedback === "copying"}>
					<StandardIcon
						size="xs"
						colorScheme={
							copyFeedback === "copied" ? "success"
							: copyFeedback === "copying" ?
								"accent"
							:	"neutral"
						}
						colorShade={copyFeedback === "idle" ? "textShade" : "pure"}
						styleType="outline">
						{copyFeedback === "copied" ?
							<Check />
						:	<Copy />}
					</StandardIcon>
				</button>
			)}
		</td>
	);
};

const StandardTableRow = <TData extends object>({
	row,
	getRowStatus,
	renderSubComponent,
}: {
	row: Row<TData>;
	getRowStatus?: (
		original: TData
	) => Exclude<
		ColorSchemeVariant,
		"neutral" | "white" | "default" | "info"
	> | null;
	renderSubComponent?: (row: Row<TData>) => React.ReactNode;
}) => {
	// ✅ SI LA FILA ES UN FANTASMA, NO LA RENDERIZAMOS.
	if (
		"__isGhost" in row.original &&
		(row.original as { __isGhost?: boolean }).__isGhost
	) {
		return null;
	}

	const status = getRowStatus ? getRowStatus(row.original) : null;
	return (
		<React.Fragment>
			<tr className="group" data-status={status || "default"}>
				{row.getVisibleCells().map((cell) => (
					<StandardTableCell key={cell.id} cell={cell} />
				))}
			</tr>
			{row.getIsExpanded() && (
				<tr data-status={status || "default"}>
					<td
						colSpan={row.getVisibleCells().length}
						className={cn(
							"p-0 border-r border-b border-[var(--table-row-default-borderColor)]",
							"bg-[var(--table-row-subRowBackgroundColor)]"
						)}>
						{renderSubComponent ?
							renderSubComponent(row)
						:	<div className="p-4">
								<StandardText size="sm" color="neutral">
									Sin sub-componente definido.
								</StandardText>
							</div>
						}
					</td>
				</tr>
			)}
		</React.Fragment>
	);
};
StandardTableRow.displayName = "StandardTable.Row";

const StandardTableBody = <TData extends object>({
	table,
}: SubComponentProps<TData>) => {
	if (!table) return null;
	const getRowStatus = table.options.meta?.getRowStatus;
	const renderSubComponent = table.options.meta?.renderSubComponent;
	return (
		<tbody>
			{table.getRowModel().rows.map((row) => (
				<StandardTableRow
					key={row.id}
					row={row}
					getRowStatus={getRowStatus}
					renderSubComponent={renderSubComponent}
				/>
			))}
		</tbody>
	);
};
StandardTableBody.displayName = "StandardTable.Body";

import type { CSSProperties } from "react";

const StandardTableTable = <TData extends object>({
	table,
	style,
	colorScheme = "primary",
}: SubComponentProps<TData> & {
	style?: CSSProperties;
	colorScheme?: ColorSchemeVariant;
}) => {
	if (!table) return null;
	return (
		<div
			className="w-full h-full overflow-auto relative"
			style={{ ...style, isolation: "isolate" }}>
			<table className="w-full border-collapse">
				<StandardTableHeader table={table} colorScheme={colorScheme} />
				<StandardTableBody table={table} />
			</table>
		</div>
	);
};
StandardTableTable.displayName = "StandardTable.Table";

function StandardTableRoot<TData extends object>({
	data,
	columns,
	getRowStatus,
	children,
	className,
	filterPlaceholder,
	renderSubComponent,
	maxTableHeight,
	stickyOffset = 0,
	isStickyHeader = false,
	enableTruncation = false,
	truncateRowsTo,
	onTruncateRowsChange,
	// 🔍 Keyword Highlighting Props
	enableKeywordHighlighting = false,
	keywordHighlightPlaceholder = "Resaltar palabra clave...",
	onKeywordChange,
	// 📄 CSV Export Props
	enableCsvExport = false,
	csvFileName = "tabla_datos",
	// 🎛️ Toolbar visibility controls
	showColumnSelector = true,
	showTruncationDropdown = true,
	// 🧰 Toolbar master switch
	showToolbar = true,
	// 🎨 Header color scheme
	colorScheme = "primary",
}: StandardTableProps<TData>) {
	const { appColorTokens, mode } = useTheme();
	const [globalFilter, setGlobalFilter] = useState("");
	const [sorting, setSorting] = useState<SortingState>([]);
	const [expanded, setExpanded] = useState({});
	const [columnSizing, setColumnSizing] = useState({});
	const [columnVisibility, setColumnVisibility] = useState({});

	const [internalTruncate, setInternalTruncate] = useState<number | null>(2);
	const isTruncationControlled =
		truncateRowsTo !== undefined && onTruncateRowsChange !== undefined;

	// 🔍 Estado para Keyword Highlighting
	const [keywordHighlight, setKeywordHighlight] = useState<string | null>(null);

	// 🔍 Handler para Keyword Change
	const handleKeywordChange = (keyword: string | null) => {
		setKeywordHighlight(keyword);
		if (onKeywordChange) {
			onKeywordChange(keyword);
		}
	};

	const currentTruncateValue =
		isTruncationControlled ? truncateRowsTo : internalTruncate;
	const handleTruncateChange =
		isTruncationControlled ? onTruncateRowsChange : setInternalTruncate;

	const [isAnchored, setIsAnchored] = useState(false);
	const sizeRef = useRef<{ height: number; width: number; left: number }>({
		height: 0,
		width: 0,
		left: 0,
	});
	const sentinelRef = useRef<HTMLDivElement>(null);
	const tableContainerRef = useRef<HTMLDivElement>(null);

	// 🔧 Función para recalcular dimensiones del sticky header
	const recalculateStickyDimensions = () => {
		if (tableContainerRef.current) {
			const rect = tableContainerRef.current.getBoundingClientRect();
			if (rect.height > 0 && rect.width > 0) {
				sizeRef.current = {
					width: rect.width,
					height: rect.height,
					left: rect.left,
				};
			}
		}
	};

	// 🔍 Sticky header con recalculo dinámico
	useLayoutEffect(() => {
		if (!isStickyHeader) return;

		const intersectionObserver = new IntersectionObserver(
			([entry]) => setIsAnchored(!entry.isIntersecting),
			{ rootMargin: `-${stickyOffset}px 0px 0px 0px`, threshold: 0 }
		);

		const currentSentinel = sentinelRef.current;
		if (currentSentinel) {
			intersectionObserver.observe(currentSentinel);
		}

		// Calcular dimensiones iniciales
		recalculateStickyDimensions();

		// 🔧 ResizeObserver para recalcular cuando la tabla cambia de tamaño
		const resizeObserver = new ResizeObserver(() => {
			recalculateStickyDimensions();
		});

		if (tableContainerRef.current) {
			resizeObserver.observe(tableContainerRef.current);
		}

		return () => {
			if (currentSentinel) intersectionObserver.unobserve(currentSentinel);
			resizeObserver.disconnect();
		};
	}, [isStickyHeader, stickyOffset]);

	// 🔧 Efecto adicional para recalcular cuando cambian las dimensiones de contenido
	useLayoutEffect(() => {
		if (!isStickyHeader) return;
		// Recalcular dimensiones cuando cambia el truncado o datos
		recalculateStickyDimensions();
	}, [currentTruncateValue, data.length, expanded, isStickyHeader]);

	const table = useReactTable({
		data,
		columns,
		state: { globalFilter, sorting, expanded, columnSizing, columnVisibility },
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: setSorting,
		onExpandedChange: setExpanded,
		onColumnSizingChange: setColumnSizing,
		onColumnVisibilityChange: setColumnVisibility,
		getSortedRowModel: getSortedRowModel(),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getSubRows: (row) => (row as TData & { subRows?: TData[] }).subRows,
		columnResizeMode: "onChange",
		meta: {
			getRowStatus,
			filterPlaceholder,
			renderSubComponent,
			truncateRowsTo: enableTruncation ? currentTruncateValue : null,
			// 🔍 Keyword highlighting meta
			enableKeywordHighlighting,
			keywordHighlight,
		},
	});

	const cssVariables = useMemo<React.CSSProperties>(() => {
		if (!appColorTokens || !mode) return {};
		const tokens = generateTableTokens(appColorTokens, mode, colorScheme);
		const vars: React.CSSProperties & {
			[key: `--${string}`]: string | number;
		} = {};

		if (tokens.cell.variants.highlight) {
			vars["--table-cell-highlight-backgroundColor"] =
				tokens.cell.variants.highlight.backgroundColor;
			vars["--table-cell-highlight-textColor"] =
				tokens.cell.variants.highlight.foregroundColor;
		}

		if (tokens.cell.variants.success) {
			vars["--table-cell-success-backgroundColor"] =
				tokens.cell.variants.success.backgroundColor;
			vars["--table-cell-success-textColor"] =
				tokens.cell.variants.success.foregroundColor;
		}

		if (tokens.cell.variants.warning) {
			vars["--table-cell-warning-backgroundColor"] =
				tokens.cell.variants.warning.backgroundColor;
			vars["--table-cell-warning-textColor"] =
				tokens.cell.variants.warning.foregroundColor;
		}

		if (tokens.cell.variants.danger) {
			vars["--table-cell-danger-backgroundColor"] =
				tokens.cell.variants.danger.backgroundColor;
			vars["--table-cell-danger-textColor"] =
				tokens.cell.variants.danger.foregroundColor;
		}

		vars["--table-row-subRowBackgroundColor"] = tokens.subRowBackgroundColor;
		Object.entries(tokens.header).forEach(([key, value]) => {
			vars[`--table-header-${key}`] = value;
		});
		Object.entries(tokens.row.default).forEach(([key, value]) => {
			vars[`--table-row-default-${key}`] = value;
		});
		Object.entries(tokens.row.status).forEach(([status, statusTokens]) => {
			Object.entries(statusTokens).forEach(([key, value]) => {
				vars[`--table-row-status-${status}-${key}`] = value;
			});
		});
		Object.entries(tokens.expander).forEach(([key, value]) => {
			vars[`--table-expander-${key}`] = value;
		});
		return vars;
	}, [appColorTokens, mode, colorScheme]);

	const childrenWithProps = Children.map(children, (child) => {
		if (
			isValidElement(child) &&
			(child.type as { displayName?: string }).displayName ===
				"StandardTable.Table"
		) {
			return cloneElement(
				child as React.ReactElement<SubComponentProps<TData>>,
				{ table, colorScheme }
			);
		}
		return null;
	});

	const renderContent = () => (
		<div className="flex flex-col h-full" style={{ isolation: "isolate" }}>
			{showToolbar && (
				<StandardTableToolbar
					table={table}
					enableTruncation={enableTruncation}
					onTruncateChange={handleTruncateChange}
					truncateValue={currentTruncateValue}
					// 🔍 Keyword Highlighting Props
					enableKeywordHighlighting={enableKeywordHighlighting}
					keywordHighlightPlaceholder={keywordHighlightPlaceholder}
					onKeywordChange={handleKeywordChange}
					keywordHighlight={keywordHighlight}
					// 📄 CSV Export Props
					enableCsvExport={enableCsvExport}
					csvFileName={csvFileName}
					// 🎛️ Toolbar visibility controls
					showColumnSelector={showColumnSelector}
					showTruncationDropdown={showTruncationDropdown}
				/>
			)}
			<div
				className="flex-grow overflow-auto relative"
				style={{ isolation: "isolate" }}>
				{childrenWithProps}
			</div>
		</div>
	);

	if (isStickyHeader) {
		const tableContainerStyle: React.CSSProperties =
			isAnchored ?
				{
					position: "fixed",
					top: `${stickyOffset}px`,
					left: `${sizeRef.current.left}px`,
					width: `${sizeRef.current.width}px`,
					height: `calc(100vh - ${stickyOffset}px)`,
				}
			:	{
					position: "relative",
				};
		return (
			<div className={cn("relative", className)} style={cssVariables}>
				<div
					ref={sentinelRef}
					style={{ height: "1px", position: "absolute", top: 0 }}
				/>
				<div
					style={{
						height: isAnchored ? `${sizeRef.current.height}px` : "auto",
					}}
				/>
				<div
					ref={tableContainerRef}
					style={tableContainerStyle}
					className="rounded-lg border border-[var(--table-header-borderColor)] overflow-hidden">
					{renderContent()}
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex flex-col rounded-lg border border-[var(--table-header-borderColor)]",
				className
			)}
			style={{ ...cssVariables, maxHeight: maxTableHeight }}>
			{renderContent()}
		</div>
	);
}

export const StandardTable = Object.assign(StandardTableRoot, {
	Table: StandardTableTable,
});
