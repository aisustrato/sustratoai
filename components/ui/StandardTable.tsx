"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
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
}

// --- PROPS Y TIPOS ---
export interface StandardTableProps<TData extends object> {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    getRowStatus?: (row: TData) => Exclude<ColorSchemeVariant, 'neutral' | 'white' | 'default' | 'info'> | null;
    children?: React.ReactNode;
    className?: string;
    filterPlaceholder?: string;
    renderSubComponent?: (row: Row<TData>) => React.ReactNode;
    maxTableHeight?: string;
    stickyOffset?: number;
}
interface SubComponentProps {
    table?: Table<any>;
    [key:string]: any;
}

// --- SUBCOMPONENTES INTERNOS (SIN CAMBIOS) ---

const StandardTableHeaderCell = ({ header }: { header: Header<any, any> }) => {
    const { appColorTokens } = useTheme();
    const canSort = header.column.getCanSort();
    const meta = header.column.columnDef.meta;
    const align = meta?.align || 'left';
    const isSticky = meta?.isSticky;
    
    // Crear un degradado tubular vertical (claro arriba, puro al medio, oscuro abajo)
    const headerGradientStyle = React.useMemo(() => {
        if (!appColorTokens) return {};
        
        const primary = appColorTokens.primary;
        const lighter = tinycolor(primary.pure).lighten(12).toHexString();  // Más claro arriba
        const base = primary.pure;                                        // Color puro al medio
        const darker = tinycolor(primary.pure).darken(15).toHexString();   // Más oscuro abajo
        
        return {
            backgroundImage: `linear-gradient(to bottom, ${lighter}, ${base} 50%, ${darker})`,
        };
    }, [appColorTokens]);
    
    return (
        <th
            className={cn(
                "px-4 py-3 font-medium border-b border-r border-[var(--table-header-borderColor)]",
                { "cursor-pointer select-none": canSort },
                { "sticky z-10": isSticky },
                isSticky === 'left' ? "left-0" : "",
                isSticky === 'right' ? "right-0" : ""
            )}
            style={{ 
                width: header.getSize(), 
                minWidth: header.getSize(), 
                maxWidth: header.getSize(),
                ...headerGradientStyle  // Aplicar el degradado directamente como estilo en línea
            }}
        >
            <div className={cn(
                "flex items-center gap-2",
                { 'justify-start': align === 'left', 'justify-center': align === 'center', 'justify-end': align === 'right', }
            )}>
                {flexRender(header.column.columnDef.header, header.getContext())}
                {canSort && (
                    <button onClick={header.column.getToggleSortingHandler()} className="opacity-50 hover:opacity-100 transition-opacity" aria-label="Ordenar columna">
                        <StandardIcon>
                            {header.column.getIsSorted() === 'asc' ? <ChevronUp className="h-4 w-4" /> : header.column.getIsSorted() === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
                        </StandardIcon>
                    </button>
                )}
            </div>
        </th>
    );
};

const StandardTableHeader = ({ table, stickyOffset = 0 }: SubComponentProps & { stickyOffset?: number }) => {
    if (!table) return null;
    const { globalFilter } = table.getState();
    const filterPlaceholder = (table.options.meta as any)?.filterPlaceholder || "Buscar...";
    
    const toolbarRowHeight = 72;
    const headerRowTop = stickyOffset;

    return (
        <thead style={{ top: `${stickyOffset}px` }} className={cn("sticky z-20")}>
            <tr style={{ height: `${toolbarRowHeight}px` }} className="sticky z-20 bg-[var(--table-row-default-backgroundColor)]">
                <th colSpan={table.getVisibleLeafColumns().length} className="p-4 border-b border-x border-[var(--table-header-borderColor)]" >
                    <div className="flex items-center">
                        <StandardInput
                            placeholder={filterPlaceholder}
                            value={globalFilter ?? ""}
                            onChange={(e) => table.setGlobalFilter(e.target.value)}
                            className="w-full max-w-sm"
                        />
                    </div>
                </th>
            </tr>
            {table.getHeaderGroups().map((headerGroup) => (
                <tr
                    key={headerGroup.id}
                    style={{ top: `${headerRowTop + toolbarRowHeight}px`}}
                    className="sticky z-20 text-[var(--table-header-foregroundColor)]"
                >
                    {headerGroup.headers.map((header) => (
                        <StandardTableHeaderCell key={header.id} header={header} />
                    ))}
                </tr>
            ))}
        </thead>
    );
};

const ExpandIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    <div className="flex items-center justify-center h-full w-full">
        <div className={cn(
            "flex items-center justify-center h-6 w-6 rounded-full border transition-colors",
            isExpanded ? "bg-[var(--table-expander-expandedCircleBackground)]" : "bg-[var(--table-expander-circleBackground)]",
            "border-[var(--table-expander-circleBorderColor)]"
        )}>
            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <StandardIcon>
                    <ChevronRight size={16} className={cn(
                        "transition-colors",
                        isExpanded ? "text-[var(--table-expander-expandedIconColor)]" : "text-[var(--table-expander-iconColor)]"
                    )} />
                </StandardIcon>
            </motion.div>
        </div>
    </div>
);

const StandardTableCell = ({ cell }: { cell: Cell<any, any> }) => {
    const meta = cell.column.columnDef.meta;
    const variantValue = typeof meta?.cellVariant === 'function' ? meta.cellVariant(cell.getContext()) : meta?.cellVariant;
    const align = meta?.align || 'left';
    const isSticky = meta?.isSticky;

    const cellClasses = cn(
        "px-4 py-3 align-top border-b border-r border-[var(--table-row-default-borderColor)] transition-colors",
        { 'text-left': align === 'left', 'text-center': align === 'center', 'text-right': align === 'right' },
        { "sticky z-10": isSticky, "left-0": isSticky === 'left', "right-0": isSticky === 'right' },
        {
            "bg-[var(--table-cell-variant-highlight-backgroundColor)] text-[var(--table-cell-variant-highlight-foregroundColor)] group-hover:bg-[var(--table-cell-variant-highlight-hoverBackgroundColor)]": variantValue === 'highlight',
            "bg-[var(--table-row-default-backgroundColor)] text-[var(--table-row-default-foregroundColor)] group-hover:bg-[var(--table-row-default-hoverBackgroundColor)]": variantValue !== 'highlight',
            "group-data-[status=primary]:bg-[var(--table-row-status-primary-backgroundColor)] group-data-[status=primary]:text-[var(--table-row-status-primary-foregroundColor)] group-hover:group-data-[status=primary]:bg-[var(--table-row-status-primary-hoverBackgroundColor)]": variantValue !== 'highlight',
            "group-data-[status=secondary]:bg-[var(--table-row-status-secondary-backgroundColor)] group-data-[status=secondary]:text-[var(--table-row-status-secondary-foregroundColor)] group-hover:group-data-[status=secondary]:bg-[var(--table-row-status-secondary-hoverBackgroundColor)]": variantValue !== 'highlight',
            "group-data-[status=tertiary]:bg-[var(--table-row-status-tertiary-backgroundColor)] group-data-[status=tertiary]:text-[var(--table-row-status-tertiary-foregroundColor)] group-hover:group-data-[status=tertiary]:bg-[var(--table-row-status-tertiary-hoverBackgroundColor)]": variantValue !== 'highlight',
            "group-data-[status=accent]:bg-[var(--table-row-status-accent-backgroundColor)] group-data-[status=accent]:text-[var(--table-row-status-accent-foregroundColor)] group-hover:group-data-[status=accent]:bg-[var(--table-row-status-accent-hoverBackgroundColor)]": variantValue !== 'highlight',
            "group-data-[status=success]:bg-[var(--table-row-status-success-backgroundColor)] group-data-[status=success]:text-[var(--table-row-status-success-foregroundColor)] group-hover:group-data-[status=success]:bg-[var(--table-row-status-success-hoverBackgroundColor)]": variantValue !== 'highlight',
            "group-data-[status=warning]:bg-[var(--table-row-status-warning-backgroundColor)] group-data-[status=warning]:text-[var(--table-row-status-warning-foregroundColor)] group-hover:group-data-[status=warning]:bg-[var(--table-row-status-warning-hoverBackgroundColor)]": variantValue !== 'highlight',
            "group-data-[status=danger]:bg-[var(--table-row-status-danger-backgroundColor)] group-data-[status=danger]:text-[var(--table-row-status-danger-foregroundColor)] group-hover:group-data-[status=danger]:bg-[var(--table-row-status-danger-hoverBackgroundColor)]": variantValue !== 'highlight',
        }
    );

    if (cell.column.id === 'expander') {
        return (
            <td
                className={cn("px-2 w-12 text-center align-middle", cellClasses, { "cursor-pointer": cell.row.getCanExpand() })}
                onClick={cell.row.getToggleExpandedHandler()}
                role="button"
                tabIndex={cell.row.getCanExpand() ? 0 : -1}
                aria-expanded={cell.row.getIsExpanded()}
                style={{ width: cell.column.getSize(), minWidth: cell.column.getSize(), maxWidth: cell.column.getSize() }}
            >
                {cell.row.getCanExpand() ? <ExpandIcon isExpanded={cell.row.getIsExpanded()} /> : null}
            </td>
        );
    }

    const stickyBgClass = isSticky ? 'bg-[var(--table-row-default-backgroundColor)]' : '';

    return (
        <td
            data-variant={variantValue || 'default'}
            className={cn(cellClasses, stickyBgClass)}
            style={{ width: cell.column.getSize(), minWidth: cell.column.getSize(), maxWidth: cell.column.getSize() }}
        >
            <StandardText size="sm">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </StandardText>
        </td>
    );
};

const StandardTableRow = ({ row, getRowStatus, renderSubComponent }: { row: Row<any>, getRowStatus?: (original: any) => any, renderSubComponent?: (row: Row<any>) => React.ReactNode }) => {
    const status = getRowStatus ? getRowStatus(row.original) : 'default';
    return (
        <React.Fragment>
            <tr className="group" data-status={status || 'default'}>
                {row.getVisibleCells().map(cell => (<StandardTableCell key={cell.id} cell={cell} />))}
            </tr>
            {row.getIsExpanded() && (
                <tr data-status={status || 'default'}>
                    <td colSpan={row.getVisibleCells().length} className={cn(
                        "p-0 border-r border-b border-[var(--table-row-default-borderColor)]",
                        "bg-[var(--table-row-subRowBackgroundColor)]"
                    )}>
                        {renderSubComponent ? renderSubComponent(row) : (
                            <div className="p-4">
                                <StandardText size="sm" color="neutral">Sin sub-componente definido.</StandardText>
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};

const StandardTableBody = ({ table }: SubComponentProps) => {
    if (!table) return null;
    const getRowStatus = (table.options.meta as any)?.getRowStatus;
    const renderSubComponent = (table.options.meta as any)?.renderSubComponent;
    return (
        <tbody>
            {table.getRowModel().rows.map(row => (
                <StandardTableRow key={row.id} row={row} getRowStatus={getRowStatus} renderSubComponent={renderSubComponent} />
            ))}
        </tbody>
    );
};

const StandardTableTable = ({ table, stickyOffset = 0, ...props }: SubComponentProps & { stickyOffset?: number }) => {
    if (!table) return null;
    return (
        <table className="w-full text-sm border-collapse" {...props}>
            <StandardTableHeader table={table} stickyOffset={stickyOffset} />
            <StandardTableBody table={table} />
        </table>
    );
};
StandardTableTable.displayName = "StandardTable.Table";

// --- COMPONENTE RAÍZ (CON LÓGICA DE "VIAJE Y ANCLAJE") ---
function StandardTableRoot<TData extends object>({
    data, columns, getRowStatus, children, className, filterPlaceholder,
    renderSubComponent, maxTableHeight, stickyOffset = 0,
}: StandardTableProps<TData>) {

    const { appColorTokens, mode } = useTheme();
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState<SortingState>([]);
    const [expanded, setExpanded] = React.useState({});
    const [columnSizing, setColumnSizing] = useState({});

    // ✅ --- Lógica de "Viaje y Anclaje" ESTABLE ---
    const [isAnchored, setIsAnchored] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsAnchored(!entry.isIntersecting);
            },
            {
                rootMargin: `-${stickyOffset}px 0px 0px 0px`,
                threshold: 0,
            }
        );

        const currentSentinel = sentinelRef.current;
        if (currentSentinel) {
            observer.observe(currentSentinel);
        }

        return () => {
            if (currentSentinel) {
                observer.unobserve(currentSentinel);
            }
        };
    }, [stickyOffset]);

    const table = useReactTable({
        data, columns, state: { globalFilter, sorting, expanded, columnSizing },
        onGlobalFilterChange: setGlobalFilter, onSortingChange: setSorting,
        onExpandedChange: setExpanded, onColumnSizingChange: setColumnSizing,
        getSortedRowModel: getSortedRowModel(), getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(), getExpandedRowModel: getExpandedRowModel(),
        getSubRows: (row) => (row as any).subRows,
        columnResizeMode: 'onChange',
        meta: { getRowStatus, filterPlaceholder, renderSubComponent },
    });

    const cssVariables = useMemo<React.CSSProperties>(() => {
        if (!appColorTokens || !mode) return {};
        const tokens = generateTableTokens(appColorTokens, mode);
        const vars: React.CSSProperties & { [key: string]: any } = {};
        vars['--table-row-subRowBackgroundColor'] = tokens.subRowBackgroundColor;
        Object.entries(tokens.header).forEach(([key, value]) => { vars[`--table-header-${key}`] = value; });
        Object.entries(tokens.row.default).forEach(([key, value]) => { vars[`--table-row-default-${key}`] = value; });
        Object.entries(tokens.row.status).forEach(([status, statusTokens]) => { Object.entries(statusTokens).forEach(([key, value]) => { vars[`--table-row-status-${status}-${key}`] = value; }); });
        Object.entries(tokens.expander).forEach(([key, value]) => { vars[`--table-expander-${key}`] = value; });
        Object.entries(tokens.cell.variants).forEach(([variant, variantTokens]) => { Object.entries(variantTokens).forEach(([key, value]) => { if (value) { vars[`--table-cell-variant-${variant}-${key}`] = value; } }); });
        return vars;
    }, [appColorTokens, mode]);

    const scrollContainerStyle: React.CSSProperties = isAnchored
        ? {
            maxHeight: maxTableHeight || `calc(100vh - ${stickyOffset}px)`,
        }
        : {};

    return (
        <div
            // ✅ CORRECCIÓN: Se añade 'relative' para que el vigía absoluto se posicione correctamente.
            className={cn("flex flex-col rounded-lg border border-[var(--table-header-borderColor)] relative", className)}
            style={cssVariables}
        >
            {/* ✅ CORRECCIÓN: El vigía ahora es absoluto para no afectar al layout y romper el bucle. */}
            <div ref={sentinelRef} style={{ position: 'absolute', top: 0, width: '1px', height: '1px' }} />

            <div
                className={cn({ "overflow-y-auto": isAnchored })}
                style={scrollContainerStyle}
            >
                {React.Children.map(children, (child) => {
                    if (React.isValidElement(child) && (child.type as any).displayName === "StandardTable.Table") {
                        return React.cloneElement(child as React.ReactElement<any>, { table, stickyOffset });
                    }
                    return null;
                })}
            </div>
        </div>
    );
}


export const StandardTable = Object.assign(StandardTableRoot, {
    Table: StandardTableTable,
});