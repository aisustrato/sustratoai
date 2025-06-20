"use client";

import React, { useMemo, useState, useRef, useEffect, Children, isValidElement, cloneElement, useLayoutEffect } from "react";
import {
    type ColumnDef, flexRender, getCoreRowModel, useReactTable,
    getFilteredRowModel, getSortedRowModel, getExpandedRowModel,
    type Cell, type Header, type Row, type SortingState, type Table,
    type CellContext, type RowData
} from "@tanstack/react-table";
import { useTheme } from "@/app/theme-provider";
import { cn } from "@/lib/utils";
import { generateTableTokens, type CellVariant } from "@/lib/theme/components/standard-table-tokens";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";
import { StandardInput } from "./StandardInput";
import { StandardText } from "./StandardText";
import { StandardIcon } from "./StandardIcon";
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import tinycolor from 'tinycolor2';

// --- DECLARACIÓN DE MÓDULO PARA META ---
declare module "@tanstack/react-table" {
    interface ColumnMeta<TData extends RowData, TValue> {
        cellVariant?: CellVariant | ((context: CellContext<TData, TValue>) => CellVariant | undefined);
        align?: 'left' | 'center' | 'right';
        isSticky?: 'left' | 'right';
        size?: number;
    }

    interface TableMeta<TData extends RowData> {
        getRowStatus?: (row: TData) => Exclude<ColorSchemeVariant, 'neutral' | 'white' | 'default' | 'info'> | null;
        filterPlaceholder?: string;
        renderSubComponent?: (row: Row<TData>) => React.ReactNode;
    }
}

// --- PROPS Y TIPOS ---
export interface StandardTableProps<TData extends object> {
    data: TData[];
    columns: ColumnDef<TData, unknown>[];
    getRowStatus?: (row: TData) => Exclude<ColorSchemeVariant, 'neutral' | 'white' | 'default' | 'info'> | null;
    children?: React.ReactNode;
    className?: string;
    filterPlaceholder?: string;
    renderSubComponent?: (row: Row<TData>) => React.ReactNode;
    maxTableHeight?: string;
    stickyOffset?: number;
}
interface SubComponentProps<TData extends object> {
    table?: Table<TData>;
    [key: string]: unknown;
}

// --- SUBCOMPONENTES INTERNOS (Funcionalidad completa restaurada) ---

const StandardTableHeaderCell = <TData extends object, TValue>({ header }: { header: Header<TData, TValue> }) => {
    const { appColorTokens } = useTheme();
    const canSort = header.column.getCanSort();
    const meta = header.column.columnDef.meta;
    const align = meta?.align || 'left';
    const isSticky = meta?.isSticky;
    
    const headerGradientStyle = useMemo(() => {
        if (!appColorTokens) return {};
        const primary = appColorTokens.primary;
        const lighter = tinycolor(primary.pure).lighten(12).toHexString();
        const base = primary.pure;
        const darker = tinycolor(primary.pure).darken(15).toHexString();
        return { backgroundImage: `linear-gradient(to bottom, ${lighter}, ${base} 50%, ${darker})` };
    }, [appColorTokens]);
    
    return (
        <th
            className={cn("px-4 py-3 font-medium border-b border-r border-[var(--table-header-borderColor)]", { "cursor-pointer select-none": canSort }, { "sticky z-10": isSticky }, isSticky === 'left' ? "left-0" : "", isSticky === 'right' ? "right-0" : "")}
            style={{ width: header.getSize(), minWidth: header.getSize(), maxWidth: header.getSize(), ...headerGradientStyle }}
        >
            <div className={cn("flex items-center gap-2", { 'justify-start': align === 'left', 'justify-center': align === 'center', 'justify-end': align === 'right', })}>
                {flexRender(header.column.columnDef.header, header.getContext())}
                {canSort && (<button onClick={header.column.getToggleSortingHandler()} className="opacity-50 hover:opacity-100 transition-opacity" aria-label="Ordenar columna"><StandardIcon>{header.column.getIsSorted() === 'asc' ? <ChevronUp className="h-4 w-4" /> : header.column.getIsSorted() === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}</StandardIcon></button>)}
            </div>
        </th>
    );
};

const StandardTableHeader = <TData extends object>({ table }: SubComponentProps<TData>) => {
    if (!table) return null;
    const { globalFilter } = table.getState();
    const filterPlaceholder = table.options.meta?.filterPlaceholder || "Buscar...";
    const toolbarRowHeight = 72;
    const headerRowTop = 0;

    return (
        <thead style={{ top: `${headerRowTop}px` }} className={cn("sticky z-20")}>
            <tr style={{ height: `${toolbarRowHeight}px` }} className="sticky z-20 bg-[var(--table-row-default-backgroundColor)]">
                <th colSpan={table.getVisibleLeafColumns().length} className="p-4 border-b border-x border-[var(--table-header-borderColor)]" >
                    <div className="flex items-center"><StandardInput placeholder={filterPlaceholder} value={globalFilter ?? ""} onChange={(e) => table.setGlobalFilter(e.target.value)} className="w-full max-w-sm" /></div>
                </th>
            </tr>
            {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} style={{ top: `${headerRowTop + toolbarRowHeight}px`}} className="sticky z-20 text-[var(--table-header-foregroundColor)]">
                    {headerGroup.headers.map((header) => (<StandardTableHeaderCell key={header.id} header={header} />))}
                </tr>
            ))}
        </thead>
    );
};

const ExpandIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    <div className="flex items-center justify-center h-full w-full">
        <div className={cn("flex items-center justify-center h-6 w-6 rounded-full border transition-colors", isExpanded ? "bg-[var(--table-expander-expandedCircleBackground)]" : "bg-[var(--table-expander-circleBackground)]", "border-[var(--table-expander-circleBorderColor)]")}>
            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}><StandardIcon><ChevronRight size={16} className={cn("transition-colors", isExpanded ? "text-[var(--table-expander-expandedIconColor)]" : "text-[var(--table-expander-iconColor)]")} /></StandardIcon></motion.div>
        </div>
    </div>
);

const StandardTableCell = <TData extends object, TValue>({ cell }: { cell: Cell<TData, TValue> }) => {
    const meta = cell.column.columnDef.meta;
    const variantValue = typeof meta?.cellVariant === 'function' ? meta.cellVariant(cell.getContext()) : meta?.cellVariant;
    const align = meta?.align || 'left';
    const isSticky = meta?.isSticky;

    const cellClasses = cn("px-4 py-3 align-top border-b border-r border-[var(--table-row-default-borderColor)] transition-colors", { 'text-left': align === 'left', 'text-center': align === 'center', 'text-right': align === 'right' }, { "sticky z-10": isSticky, "left-0": isSticky === 'left', "right-0": isSticky === 'right' }, { "bg-[var(--table-cell-variant-highlight-backgroundColor)] text-[var(--table-cell-variant-highlight-foregroundColor)] group-hover:bg-[var(--table-cell-variant-highlight-hoverBackgroundColor)]": variantValue === 'highlight', "bg-[var(--table-row-default-backgroundColor)] text-[var(--table-row-default-foregroundColor)] group-hover:bg-[var(--table-row-default-hoverBackgroundColor)]": variantValue !== 'highlight', "group-data-[status=primary]:bg-[var(--table-row-status-primary-backgroundColor)] group-data-[status=primary]:text-[var(--table-row-status-primary-foregroundColor)] group-hover:group-data-[status=primary]:bg-[var(--table-row-status-primary-hoverBackgroundColor)]": variantValue !== 'highlight', "group-data-[status=secondary]:bg-[var(--table-row-status-secondary-backgroundColor)] group-data-[status=secondary]:text-[var(--table-row-status-secondary-foregroundColor)] group-hover:group-data-[status=secondary]:bg-[var(--table-row-status-secondary-hoverBackgroundColor)]": variantValue !== 'highlight', "group-data-[status=tertiary]:bg-[var(--table-row-status-tertiary-backgroundColor)] group-data-[status=tertiary]:text-[var(--table-row-status-tertiary-foregroundColor)] group-hover:group-data-[status=tertiary]:bg-[var(--table-row-status-tertiary-hoverBackgroundColor)]": variantValue !== 'highlight', "group-data-[status=accent]:bg-[var(--table-row-status-accent-backgroundColor)] group-data-[status=accent]:text-[var(--table-row-status-accent-foregroundColor)] group-hover:group-data-[status=accent]:bg-[var(--table-row-status-accent-hoverBackgroundColor)]": variantValue !== 'highlight', "group-data-[status=success]:bg-[var(--table-row-status-success-backgroundColor)] group-data-[status=success]:text-[var(--table-row-status-success-foregroundColor)] group-hover:group-data-[status=success]:bg-[var(--table-row-status-success-hoverBackgroundColor)]": variantValue !== 'highlight', "group-data-[status=warning]:bg-[var(--table-row-status-warning-backgroundColor)] group-data-[status=warning]:text-[var(--table-row-status-warning-foregroundColor)] group-hover:group-data-[status=warning]:bg-[var(--table-row-status-warning-hoverBackgroundColor)]": variantValue !== 'highlight', "group-data-[status=danger]:bg-[var(--table-row-status-danger-backgroundColor)] group-data-[status=danger]:text-[var(--table-row-status-danger-foregroundColor)] group-hover:group-data-[status=danger]:bg-[var(--table-row-status-danger-hoverBackgroundColor)]": variantValue !== 'highlight', });
    
    const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());

    if (cell.column.id === 'expander') {
        return (<td className={cn("px-2 w-12 text-center align-middle", cellClasses, { "cursor-pointer": cell.row.getCanExpand() })} onClick={cell.row.getToggleExpandedHandler()} role="button" tabIndex={cell.row.getCanExpand() ? 0 : -1} aria-expanded={cell.row.getIsExpanded()} style={{ width: cell.column.getSize(), minWidth: cell.column.getSize(), maxWidth: cell.column.getSize() }}>{cell.row.getCanExpand() ? <ExpandIcon isExpanded={cell.row.getIsExpanded()} /> : null}</td>);
    }

    const stickyBgClass = isSticky ? 'bg-[var(--table-row-default-backgroundColor)]' : '';
    return (<td data-variant={variantValue || 'default'} className={cn(cellClasses, stickyBgClass)} style={{ width: cell.column.getSize(), minWidth: cell.column.getSize(), maxWidth: cell.column.getSize() }}>{isValidElement(cellContent) ? (cellContent) : (<StandardText size="sm">{String(cellContent ?? '')}</StandardText>)}</td>);
};

const StandardTableRow = <TData extends object>({ row, getRowStatus, renderSubComponent }: { row: Row<TData>, getRowStatus?: (original: TData) => Exclude<ColorSchemeVariant, 'neutral' | 'white' | 'default' | 'info'> | null, renderSubComponent?: (row: Row<TData>) => React.ReactNode }) => {
    const status = getRowStatus ? getRowStatus(row.original) : 'default';
    return (<React.Fragment><tr className="group" data-status={status || 'default'}>{row.getVisibleCells().map(cell => (<StandardTableCell key={cell.id} cell={cell} />))}</tr>{row.getIsExpanded() && (<tr data-status={status || 'default'}><td colSpan={row.getVisibleCells().length} className={cn("p-0 border-r border-b border-[var(--table-row-default-borderColor)]", "bg-[var(--table-row-subRowBackgroundColor)]")}>{renderSubComponent ? renderSubComponent(row) : (<div className="p-4"><StandardText size="sm" color="neutral">Sin sub-componente definido.</StandardText></div>)}</td></tr>)}</React.Fragment>);
};

const StandardTableBody = <TData extends object>({ table }: SubComponentProps<TData>) => {
    if (!table) return null;
    const getRowStatus = table.options.meta?.getRowStatus;
    const renderSubComponent = table.options.meta?.renderSubComponent;
    return (<tbody>{table.getRowModel().rows.map(row => (<StandardTableRow key={row.id} row={row} getRowStatus={getRowStatus} renderSubComponent={renderSubComponent} />))}</tbody>);
};

const StandardTableTable = <TData extends object>({ table, ...props }: SubComponentProps<TData>) => {
    if (!table) return null;
    return (<table className="w-full text-sm border-collapse" {...props}><StandardTableHeader table={table} /><StandardTableBody table={table} /></table>);
};
StandardTableTable.displayName = "StandardTable.Table";

// --- COMPONENTE RAÍZ (v13.0 - Anclaje con Medición Continua y Bloqueo) ---
function StandardTableRoot<TData extends object>({
    data, columns, getRowStatus, children, className, filterPlaceholder,
    renderSubComponent, maxTableHeight, stickyOffset = 0,
}: StandardTableProps<TData>) {

    const { appColorTokens, mode } = useTheme();
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState<SortingState>([]);
    const [expanded, setExpanded] = useState({});
    const [columnSizing, setColumnSizing] = useState({});
    
    // --- Lógica de Anclaje Definitivo ---
    const [isAnchored, setIsAnchored] = useState(false);
    const sizeRef = useRef<{ height: number; width: number; left: number }>({ height: 0, width: 0, left: 0 });
    const sentinelRef = useRef<HTMLDivElement>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const intersectionObserver = new IntersectionObserver(
            ([entry]) => setIsAnchored(!entry.isIntersecting),
            { rootMargin: `-${stickyOffset}px 0px 0px 0px`, threshold: 0 }
        );
        const currentSentinel = sentinelRef.current;
        if (currentSentinel) intersectionObserver.observe(currentSentinel);
        
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                // Solo medimos si la tabla NO está anclada, para evitar el bucle de feedback
                if (!isAnchored) {
                    const { width, height } = entry.contentRect;
                    const { left } = entry.target.getBoundingClientRect();
                    sizeRef.current = { width, height, left };
                    // LOG para ver la medición en estado natural
                    console.log(`AUDIT: Medición NATURAL. W: ${width.toFixed(0)}, H: ${height.toFixed(0)}`);
                }
            }
        });

        const currentTableContainer = tableContainerRef.current;
        if (currentTableContainer) resizeObserver.observe(currentTableContainer);

        return () => {
            if (currentSentinel) intersectionObserver.unobserve(currentSentinel);
            if (currentTableContainer) resizeObserver.unobserve(currentTableContainer);
        };
    }, [stickyOffset, isAnchored]); // La dependencia en 'isAnchored' es clave para controlar cuándo se mide

    const table = useReactTable({
        data, columns, state: { globalFilter, sorting, expanded, columnSizing },
        onGlobalFilterChange: setGlobalFilter, onSortingChange: setSorting,
        onExpandedChange: setExpanded, onColumnSizingChange: setColumnSizing,
        getSortedRowModel: getSortedRowModel(), getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(), getExpandedRowModel: getExpandedRowModel(),
        getSubRows: (row) => (row as TData & { subRows?: TData[] }).subRows,
        columnResizeMode: 'onChange',
        meta: { getRowStatus, filterPlaceholder, renderSubComponent },
    });

    const cssVariables = useMemo<React.CSSProperties>(() => {
        if (!appColorTokens || !mode) return {};
        const tokens = generateTableTokens(appColorTokens, mode);
        const vars: React.CSSProperties & { [key: `--${string}`]: string | number; } = {};
        vars['--table-row-subRowBackgroundColor'] = tokens.subRowBackgroundColor;
        Object.entries(tokens.header).forEach(([key, value]) => { vars[`--table-header-${key}`] = value; });
        Object.entries(tokens.row.default).forEach(([key, value]) => { vars[`--table-row-default-${key}`] = value; });
        Object.entries(tokens.row.status).forEach(([status, statusTokens]) => { Object.entries(statusTokens).forEach(([key, value]) => { vars[`--table-row-status-${status}-${key}`] = value; }); });
        Object.entries(tokens.expander).forEach(([key, value]) => { vars[`--table-expander-${key}`] = value; });
        Object.entries(tokens.cell.variants).forEach(([variant, variantTokens]) => { Object.entries(variantTokens).forEach(([key, value]) => { if (value) { vars[`--table-cell-variant-${variant}-${key}`] = value; } }); });
        return vars;
    }, [appColorTokens, mode]);
    
    const tableContainerStyle: React.CSSProperties = isAnchored ? {
        position: 'fixed',
        top: `${stickyOffset}px`,
        left: `${sizeRef.current.left}px`,
        width: `${sizeRef.current.width}px`,
        height: maxTableHeight || `calc(100vh - ${stickyOffset}px)`,
    } : {
        position: 'relative',
    };
    
    if (isAnchored) {
        console.log(`AUDIT: Estilos ANCLADOS aplicados:`, {
            ...tableContainerStyle,
            // LOG del tamaño que se está usando para el fantasma
            placeholderHeight: sizeRef.current.height 
        });
    }

    return (
        <div className={cn("relative", className)} style={cssVariables}>
            <div ref={sentinelRef} style={{ height: '1px', position: 'absolute', top: 0 }} />
            
            <div style={{ height: isAnchored ? `${sizeRef.current.height}px` : 'auto' }} />

            <div ref={tableContainerRef} style={tableContainerStyle} className="flex flex-col">
                 <div className="overflow-y-auto rounded-lg border border-[var(--table-header-borderColor)] h-full w-full">
                    {Children.map(children, child => {
                        if (isValidElement(child) && (child.type as { displayName?: string }).displayName === "StandardTable.Table") {
                            return cloneElement(child as React.ReactElement<SubComponentProps<TData>>, { table });
                        }
                        return null;
                    })}
                </div>
            </div>
        </div>
    );
}

export const StandardTable = Object.assign(StandardTableRoot, {
    Table: StandardTableTable,
});