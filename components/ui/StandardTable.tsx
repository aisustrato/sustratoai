// StandardTable.tsx
"use client";

import React, { useMemo, useState, useRef, useEffect, Children, isValidElement, cloneElement, useLayoutEffect } from "react";
import {
    type ColumnDef, flexRender, getCoreRowModel, useReactTable,
    getFilteredRowModel, getSortedRowModel, getExpandedRowModel,
    type Cell, type Header, type Row, type SortingState, type Table,
    type CellContext, type RowData, type VisibilityState
} from "@tanstack/react-table";
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
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronRight, Columns, Rows } from "lucide-react";
import { motion } from "framer-motion";
import tinycolor from 'tinycolor2';


declare module "@tanstack/react-table" {
    interface ColumnMeta<TData extends RowData, TValue> {
        align?: 'left' | 'center' | 'right';
        isSticky?: 'left' | 'right';
        size?: number;
        isTruncatable?: boolean;
        tooltipType?: 'standard' | 'longText';
        cellVariant?: (context: CellContext<TData, TValue>) => 'highlight' | undefined;
    }
    interface TableMeta<TData extends RowData> {
        getRowStatus?: (row: TData) => Exclude<ColorSchemeVariant, 'neutral' | 'white' | 'default' | 'info'> | null;
        filterPlaceholder?: string;
        renderSubComponent?: (row: Row<TData>) => React.ReactNode;
        truncateRowsTo?: number | null;
    }
}

export interface StandardTableProps<TData extends object> {
    data: TData[];
    columns: ColumnDef<TData, unknown>[];
    isStickyHeader?: boolean;
    stickyOffset?: number;
    maxTableHeight?: string;
    getRowStatus?: (row: TData) => Exclude<ColorSchemeVariant, 'neutral' | 'white' | 'default' | 'info'> | null;
    children?: React.ReactNode;
    className?: string;
    filterPlaceholder?: string;
    renderSubComponent?: (row: Row<TData>) => React.ReactNode;
    enableTruncation?: boolean;
    truncateRowsTo?: number | null;
    onTruncateRowsChange?: (lines: number | null) => void;
}


interface SubComponentProps<TData extends object> {
    table?: Table<TData>;
    [key: string]: unknown;
}

const StandardTableToolbar = <TData extends object>({ table, enableTruncation, onTruncateChange, truncateValue }: { table: Table<TData>, enableTruncation?: boolean, onTruncateChange?: (lines: number | null) => void, truncateValue?: number | null }) => {
    if (!table || onTruncateChange === undefined || enableTruncation === undefined) return null;

    const { globalFilter } = table.getState();
    const filterPlaceholder = (table.options.meta && table.options.meta.filterPlaceholder) || "Buscar...";
    const allColumns = table.getAllLeafColumns();
    const truncateOptions = [
        { label: 'Ver todo', value: null }, { label: '1 línea', value: 1 },
        { label: '2 líneas', value: 2 }, { label: '3 líneas', value: 3 },
        { label: '5 líneas', value: 5 },
    ];

    return (
        <div className="p-4 border-b border-[var(--table-header-borderColor)] bg-[var(--table-row-default-backgroundColor)]">
            <div className="flex items-center justify-start gap-4">
                <StandardInput placeholder={filterPlaceholder} value={globalFilter ?? ""} onChange={(e) => table.setGlobalFilter(e.target.value)} className="w-full max-w-xs" />
                <StandardDropdownMenu>
                    <StandardDropdownMenu.Trigger asChild>
                        <StandardButton 
                            styleType="outline" 
                            leftIcon={Columns} 
                            size="sm"
                            tooltip="ocultar/mostrar columnas"
                        >
                            Columnas
                        </StandardButton>
                    </StandardDropdownMenu.Trigger>
                    <StandardDropdownMenu.Content align="end">
                        <StandardDropdownMenu.Label>Mostrar/Ocultar Columnas</StandardDropdownMenu.Label>
                        <StandardDropdownMenu.Separator />
                        {allColumns.map(column => {
                            const canToggle = column.getCanHide() && !['expander', 'actions'].includes(column.id);
                            return (
                                <StandardDropdownMenu.CheckboxItem 
                                    key={column.id} 
                                    className="capitalize" 
                                    checked={column.getIsVisible()} 
                                    onCheckedChange={(value: boolean) => column.toggleVisibility(!!value)} 
                                    disabled={!canToggle}
                                >
                                    {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                                </StandardDropdownMenu.CheckboxItem>
                            );
                        })}
                    </StandardDropdownMenu.Content>
                </StandardDropdownMenu>
                {enableTruncation && (
                    <StandardDropdownMenu>
                        <StandardDropdownMenu.Trigger asChild>
                            <StandardButton 
                                styleType="outline" 
                                leftIcon={Rows} 
                                size="sm"
                                tooltip="línea(s) de texto visibles en las filas"
                            >
                                {truncateValue ? `${truncateValue} línea(s)` : 'Ver todo'}
                            </StandardButton>
                        </StandardDropdownMenu.Trigger>
                        <StandardDropdownMenu.Content align="start">
                            <StandardDropdownMenu.Label>Máximo de líneas por fila</StandardDropdownMenu.Label>
                            <StandardDropdownMenu.Separator />
                            {truncateOptions.map(opt => (
                                <StandardDropdownMenu.Item 
                                    key={opt.label} 
                                    onSelect={() => onTruncateChange(opt.value)}
                                >
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
            className={cn("px-4 py-3 font-medium border-b border-r border-[var(--table-header-borderColor)] group", { "cursor-pointer select-none": canSort }, { "sticky z-10": isSticky }, isSticky === 'left' ? "left-0" : "", isSticky === 'right' ? "right-0" : "")}
            style={{ width: header.getSize(), minWidth: header.getSize(), maxWidth: header.getSize(), ...headerGradientStyle }}
            onClick={header.column.getToggleSortingHandler()}
        >
            <div className={cn("flex items-center gap-2", { 'justify-start': align === 'left', 'justify-center': align === 'center', 'justify-end': align === 'right', })}>
                {flexRender(header.column.columnDef.header, header.getContext())}
                {canSort && (<span className="opacity-60 group-hover:opacity-100 transition-opacity"><StandardIcon colorScheme="primary" colorShade="contrastText">{header.column.getIsSorted() === 'asc' ? <ChevronUp className="h-4 w-4" /> : header.column.getIsSorted() === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}</StandardIcon></span>)}
            </div>
        </th>
    );
};

const StandardTableHeader = <TData extends object>({ table }: { table: Table<TData> }) => {
    return (
        <thead className="sticky top-0 z-20 bg-[var(--table-row-default-backgroundColor)]">
            {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="text-[var(--table-header-foregroundColor)]">
                    {headerGroup.headers.map((header) => (<StandardTableHeaderCell key={header.id} header={header} />))}
                </tr>
            ))}
        </thead>
    );
};


const ExpandIcon = <TData extends object>({ isExpanded }: { isExpanded: boolean }) => {
    return (
    <div className="flex items-center justify-center h-full w-full">
        <div className={cn("flex items-center justify-center h-6 w-6 rounded-full border transition-colors", isExpanded ? "bg-[var(--table-expander-expandedCircleBackground)]" : "bg-[var(--table-expander-circleBackground)]", "border-[var(--table-expander-circleBorderColor)]")}>
            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}><StandardIcon><ChevronRight size={16} className={cn("transition-colors", isExpanded ? "text-[var(--table-expander-expandedIconColor)]" : "text-[var(--table-expander-iconColor)]")} /></StandardIcon></motion.div>
        </div>
    </div>
    )
};

const StandardTableCell = <TData extends object, TValue>({ cell }: { cell: Cell<TData, TValue> }) => {
    const meta = cell.column.columnDef.meta;
    const align = meta?.align || 'left';
    const isSticky = meta?.isSticky;
    const isTruncatable = meta?.isTruncatable || false;
    const cellVariant = meta?.cellVariant ? meta.cellVariant(cell.getContext()) : undefined;
    const tooltipType = meta?.tooltipType || 'standard';

    const cellClasses = cn(
        "px-4 py-3 align-top border-b border-r transition-colors", { 'text-left': align === 'left', 'text-center': align === 'center', 'text-right': align === 'right' }, { "sticky z-10": isSticky, "left-0": isSticky === 'left', "right-0": isSticky === 'right' }, { "bg-[var(--table-cell-highlight-backgroundColor)] text-[var(--table-cell-highlight-textColor)]": cellVariant === 'highlight', },
        cellVariant !== 'highlight' && { "bg-[var(--table-row-default-backgroundColor)] text-[var(--table-row-default-textColor)]": true, "group-hover:bg-[var(--table-row-default-hoverBackgroundColor)]": true, "group-data-[status=success]:bg-[var(--table-row-status-success-backgroundColor)] group-data-[status=success]:text-[var(--table-row-status-success-textColor)] group-hover:group-data-[status=success]:bg-[var(--table-row-status-success-hoverBackgroundColor)]": true, "group-data-[status=warning]:bg-[var(--table-row-status-warning-backgroundColor)] group-data-[status=warning]:text-[var(--table-row-status-warning-textColor)] group-hover:group-data-[status=warning]:bg-[var(--table-row-status-warning-hoverBackgroundColor)]": true, "group-data-[status=danger]:bg-[var(--table-row-status-danger-backgroundColor)] group-data-[status=danger]:text-[var(--table-row-status-danger-foregroundColor)] group-hover:group-data-[status=danger]:bg-[var(--table-row-status-danger-hoverBackgroundColor)]": true, }
    );
    
    const textRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    
    const truncateLines = cell.getContext().table.options.meta?.truncateRowsTo;
    const shouldTruncate = truncateLines && isTruncatable;
    let cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());

    useLayoutEffect(() => {
        if (shouldTruncate && textRef.current) {
            const hasOverflow = textRef.current.scrollHeight > textRef.current.clientHeight;
            if (hasOverflow !== isOverflowing) {
                setIsOverflowing(hasOverflow);
            }
        } else if (isOverflowing) {
            setIsOverflowing(false);
        }
    }, [shouldTruncate, cellContent, truncateLines, isOverflowing]);


    if (cell.column.id === 'expander') {
        return (<td className={cn(cellClasses, { "cursor-pointer": cell.row.getCanExpand() })} onClick={cell.row.getToggleExpandedHandler()} role="button" tabIndex={cell.row.getCanExpand() ? 0 : -1} aria-expanded={cell.row.getIsExpanded()} style={{ width: cell.column.getSize(), minWidth: cell.column.getSize(), maxWidth: cell.column.getSize() }}>{cell.row.getCanExpand() ? <ExpandIcon isExpanded={cell.row.getIsExpanded()} /> : null}</td>);
    }

    if (shouldTruncate) {
        const truncatableContent = (
             <div ref={textRef} className={cn({
                'line-clamp-1': truncateLines === 1,
                'line-clamp-2': truncateLines === 2,
                'line-clamp-3': truncateLines === 3,
                'line-clamp-5': truncateLines === 5,
            })}>
                {cellContent}
            </div>
        );
        
        if (isOverflowing) {
            cellContent = (
                <StandardTooltip
                    trigger={truncatableContent}
                    isLongText={tooltipType === 'longText'}
                    side="bottom"
                    align="start"
                >
                    <StandardText size="sm">{String(cell.getValue() ?? '')}</StandardText>
                </StandardTooltip>
            );
        } else {
            cellContent = truncatableContent;
        }
    }
    
    return (<td className={cellClasses} style={{ width: cell.column.getSize(), minWidth: cell.column.getSize(), maxWidth: cell.column.getSize() }}>{cellContent}</td>);
};

const StandardTableRow = <TData extends object>({ row, getRowStatus, renderSubComponent }: { 
    row: Row<TData>, 
    getRowStatus?: (original: TData) => Exclude<ColorSchemeVariant, 'neutral' | 'white' | 'default' | 'info'> | null,
    renderSubComponent?: (row: Row<TData>) => React.ReactNode 
}) => {
    // ✅ SI LA FILA ES UN FANTASMA, NO LA RENDERIZAMOS.
    if ((row.original as any)?.__isGhost) {
        return null;
    }

    const status = getRowStatus ? getRowStatus(row.original) : null;
    return (
        <React.Fragment>
            <tr className="group" data-status={status || 'default'}>
                {row.getVisibleCells().map(cell => (<StandardTableCell key={cell.id} cell={cell} />))}
            </tr>
            {row.getIsExpanded() && (
                <tr data-status={status || 'default'}>
                    <td colSpan={row.getVisibleCells().length} className={cn("p-0 border-r border-b border-[var(--table-row-default-borderColor)]", "bg-[var(--table-row-subRowBackgroundColor)]")}>
                        {renderSubComponent ? renderSubComponent(row) : (<div className="p-4"><StandardText size="sm" color="neutral">Sin sub-componente definido.</StandardText></div>)}
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};

const StandardTableBody = <TData extends object>({ table }: SubComponentProps<TData>) => {
    if (!table) return null;
    const getRowStatus = table.options.meta?.getRowStatus;
    const renderSubComponent = table.options.meta?.renderSubComponent;
    return (<tbody>{table.getRowModel().rows.map(row => (<StandardTableRow key={row.id} row={row} getRowStatus={getRowStatus} renderSubComponent={renderSubComponent} />))}</tbody>);
};

const StandardTableTable = <TData extends object>({ table, ...props }: SubComponentProps<TData>) => {
    if (!table) return null;
    return (
        <table className="w-full text-sm border-collapse" {...props}>
            <StandardTableHeader table={table} />
            <StandardTableBody table={table} />
        </table>
    );
};
StandardTableTable.displayName = "StandardTable.Table";


function StandardTableRoot<TData extends object>({
    data, columns, getRowStatus, children, className, filterPlaceholder,
    renderSubComponent, maxTableHeight, stickyOffset = 0, isStickyHeader = false,
    enableTruncation = false,
    truncateRowsTo, onTruncateRowsChange
}: StandardTableProps<TData>) {
    
    const { appColorTokens, mode } = useTheme();
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState<SortingState>([]);
    const [expanded, setExpanded] = useState({});
    const [columnSizing, setColumnSizing] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});
    
    const [internalTruncate, setInternalTruncate] = useState<number | null>(2);
    const isTruncationControlled = truncateRowsTo !== undefined && onTruncateRowsChange !== undefined;
    const currentTruncateValue = isTruncationControlled ? truncateRowsTo : internalTruncate;
    const handleTruncateChange = isTruncationControlled ? onTruncateRowsChange : setInternalTruncate;

    const [isAnchored, setIsAnchored] = useState(false);
    const sizeRef = useRef<{ height: number; width: number; left: number }>({ height: 0, width: 0, left: 0 });
    const sentinelRef = useRef<HTMLDivElement>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);

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
        if (tableContainerRef.current) {
            const rect = tableContainerRef.current.getBoundingClientRect();
            if (rect.height > 0 && rect.width > 0) {
                sizeRef.current = { width: rect.width, height: rect.height, left: rect.left };
            }
        }
        return () => {
            if (currentSentinel) intersectionObserver.unobserve(currentSentinel);
        };
    }, [isStickyHeader, stickyOffset]);

    const table = useReactTable({
        data, columns,
        state: { globalFilter, sorting, expanded, columnSizing, columnVisibility },
        onGlobalFilterChange: setGlobalFilter, onSortingChange: setSorting,
        onExpandedChange: setExpanded, onColumnSizingChange: setColumnSizing,
        onColumnVisibilityChange: setColumnVisibility,
        getSortedRowModel: getSortedRowModel(), getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(), getExpandedRowModel: getExpandedRowModel(),
        getSubRows: (row) => (row as TData & { subRows?: TData[] }).subRows,
        columnResizeMode: 'onChange',
        meta: { 
            getRowStatus, 
            filterPlaceholder, 
            renderSubComponent, 
            truncateRowsTo: enableTruncation ? currentTruncateValue : null,
        },
    });

    const cssVariables = useMemo<React.CSSProperties>(() => {
        if (!appColorTokens || !mode) return {};
        const tokens = generateTableTokens(appColorTokens, mode);
        const vars: React.CSSProperties & { [key: `--${string}`]: string | number; } = {};
        
        if (tokens.cell.variants.highlight) {
            vars['--table-cell-highlight-backgroundColor'] = tokens.cell.variants.highlight.backgroundColor;
            vars['--table-cell-highlight-textColor'] = tokens.cell.variants.highlight.foregroundColor;
        }

        vars['--table-row-subRowBackgroundColor'] = tokens.subRowBackgroundColor;
        Object.entries(tokens.header).forEach(([key, value]) => { vars[`--table-header-${key}`] = value; });
        Object.entries(tokens.row.default).forEach(([key, value]) => { vars[`--table-row-default-${key}`] = value; });
        Object.entries(tokens.row.status).forEach(([status, statusTokens]) => { Object.entries(statusTokens).forEach(([key, value]) => { vars[`--table-row-status-${status}-${key}`] = value; }); });
        Object.entries(tokens.expander).forEach(([key, value]) => { vars[`--table-expander-${key}`] = value; });
        return vars;
    }, [appColorTokens, mode]);
    
    const childrenWithProps = Children.map(children, child => {
        if (isValidElement(child) && (child.type as { displayName?: string }).displayName === "StandardTable.Table") {
            return cloneElement(child as React.ReactElement<SubComponentProps<TData>>, { table });
        }
        return null;
    });
    
    const renderContent = () => (
        <div className="flex flex-col h-full">
            <StandardTableToolbar 
                table={table}
                enableTruncation={enableTruncation}
                onTruncateChange={handleTruncateChange}
                truncateValue={currentTruncateValue}
            />
            <div className="flex-grow overflow-auto">
                {childrenWithProps}
            </div>
        </div>
    );
    
    if (isStickyHeader) {
        const tableContainerStyle: React.CSSProperties = isAnchored ? {
            position: 'fixed',
            top: `${stickyOffset}px`,
            left: `${sizeRef.current.left}px`,
            width: `${sizeRef.current.width}px`,
            height: `calc(100vh - ${stickyOffset}px)`,
        } : {
            position: 'relative',
        };
        return (
            <div className={cn("relative", className)} style={cssVariables}>
                <div ref={sentinelRef} style={{ height: '1px', position: 'absolute', top: 0 }} />
                <div style={{ height: isAnchored ? `${sizeRef.current.height}px` : 'auto' }} />
                <div ref={tableContainerRef} style={tableContainerStyle} className="rounded-lg border border-[var(--table-header-borderColor)] overflow-hidden">
                    {renderContent()}
                </div>
            </div>
        );
    }
    
    return (
        <div className={cn("flex flex-col rounded-lg border border-[var(--table-header-borderColor)]", className)} style={{...cssVariables, maxHeight: maxTableHeight}}>
            {renderContent()}
        </div>
    );
}

export const StandardTable = Object.assign(StandardTableRoot, {
    Table: StandardTableTable,
});