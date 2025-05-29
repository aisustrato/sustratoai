// --- START OF FILE ProTable.tsx (CORREGIDO Y CON AJUSTES FLEXBOX) ---

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getExpandedRowModel,
  type RowData,
  getSortedRowModel,
  type SortingState,
  type Row,
  type Column,
  type Cell,
  type CellContext,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronRight,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useTheme } from "@/app/theme-provider";
import type {
  CellVariant,
  TableTokens,
} from "@/lib/theme/components/table-tokens";
import { generateTableTokens } from "@/lib/theme/components/table-tokens";
import { motion } from "framer-motion";

declare global {
  interface Window {
    mouseX?: number;
    mouseY?: number;
  }
}

type ProTableCellContext<TData extends RowData, TValue> = CellContext<
  TData,
  TValue
>;

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    type?: string;
    enableTooltip?: boolean;
    enableSorting?: boolean;
    className?: string;
    contentClassName?: string;
    isLongContent?: boolean;
    lineClamp?: number;
    cellVariant?:
      | CellVariant
      | ((
          context: ProTableCellContext<TData, TValue>
        ) => CellVariant | undefined);
    isFixed?: boolean;
    enableTextFade?: boolean;
    textColorVariant?:
      | CellVariant
      | ((
          context: ProTableCellContext<TData, TValue>
        ) => CellVariant | undefined);
    isTextBold?:
      | boolean
      | ((context: ProTableCellContext<TData, TValue>) => boolean | undefined);
  }
}

export interface TooltipTableProps<TData extends RowData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  initialVisibility?: Record<string, boolean>;
  className?: string;
  enableTooltips?: boolean;
  enableSorting?: boolean;
  showColumnSelector?: boolean;
  placeholder?: string;
  getRowStatus?: (
    row: TData
  ) =>
    | "success"
    | "warning"
    | "error"
    | "info"
    | "neutral"
    | "danger"
    | "primary"
    | "secondary"
    | "tertiary"
    | "accent"
    | null;
  lineClamp?: number;
  tooltipDelay?: number;
  stickyHeader?: boolean;
  stickyHeaderOffset?: number;
  renderCustomCheck?: (props: {
    checked: boolean;
    onChange: () => void;
  }) => React.ReactNode;
  hideMenuOnScroll?: boolean;
  getRowTextColorVariant?: (row: TData) => CellVariant | undefined;
  isRowTextBold?: (row: TData) => boolean | undefined;
}

// --- Tooltip Component (Restaurado) ---
interface TooltipComponentProps {
  content: React.ReactNode;
  isLongContent: boolean;
  onClose: () => void;
  tooltipTokens: TableTokens["tooltip"];
}

const Tooltip: React.FC<TooltipComponentProps> = ({
  content,
  isLongContent,
  onClose,
  tooltipTokens, // Esta prop es necesaria
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const currentTooltipTokens = isLongContent
    ? tooltipTokens.longContent
    : tooltipTokens.default;

  useEffect(() => {
    if (!tooltipRef.current) return;
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let newTop, newLeft;
    if (isLongContent) {
      newTop = Math.max(
        50,
        Math.min(
          viewportHeight - tooltipRect.height - 20,
          viewportHeight / 2 - tooltipRect.height / 2
        )
      );
      newLeft = Math.max(
        20,
        Math.min(
          viewportWidth - tooltipRect.width - 20,
          viewportWidth / 2 - tooltipRect.width / 2
        )
      );
    } else {
      const cursorX = window.mouseX || viewportWidth / 2;
      const cursorY = window.mouseY || viewportHeight / 2;
      newTop = cursorY + 10;
      newLeft = cursorX + 10;
      if (newTop + tooltipRect.height > viewportHeight)
        newTop = Math.max(10, cursorY - tooltipRect.height - 10);
      if (newLeft + tooltipRect.width > viewportWidth)
        newLeft = Math.max(10, cursorX - tooltipRect.width - 10);
    }
    setPosition({ top: newTop, left: newLeft });
    setMounted(true);
  }, [isLongContent]); // onClose no es dependencia aquí, es estable

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      )
        onClose(); // onClose se usa aquí
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]); // onClose sí es dependencia aquí

  return createPortal(
    <div
      ref={tooltipRef}
      className={cn(`custom-tooltip`, isLongContent && "custom-tooltip-large")}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxHeight: isLongContent ? "70vh" : "auto",
        maxWidth: isLongContent ? "60vw" : "24rem",
        overflowY: isLongContent ? "auto" : "visible",
        backgroundColor: currentTooltipTokens.backgroundColor,
        color: currentTooltipTokens.foregroundColor,
        border: `2px solid ${currentTooltipTokens.borderColor}`,
        borderRadius: "0.375rem",
        padding: "0.75rem",
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
        zIndex: 9999,
        width: "max-content",
        whiteSpace: "pre-line",
        pointerEvents: isLongContent ? "auto" : "none",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.15s ease-out",
      }}
    >
      {content}
    </div>,
    document.body
  );
};
// --- Fin Tooltip Component ---

// --- ExpandIconComponent (Restaurado) ---
const ExpandIconComponent = ({
  isExpanded,
  expanderTokens,
}: {
  isExpanded: boolean;
  expanderTokens: TableTokens["expander"]; // Esta prop es necesaria
}) => {
  const circleBg = isExpanded
    ? expanderTokens.expandedCircleBackground
    : expanderTokens.circleBackground;
  const iconColor = isExpanded
    ? expanderTokens.expandedIconColor
    : expanderTokens.iconColor;

  return (
    <div className="flex items-center justify-center h-full w-full">
      <div
        className="flex items-center justify-center w-6 h-6 rounded-full"
        style={{
          backgroundColor: circleBg,
          border: `1px solid ${expanderTokens.circleBorderColor}`,
        }}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronRight size={16} style={{ color: iconColor }} />
        </motion.div>
      </div>
    </div>
  );
};
// --- Fin ExpandIconComponent ---

// --- getResolvedMetaValue (Restaurado) ---
const getResolvedMetaValue = <TData extends RowData, TValue, TResult>(
  metaProperty:
    | TResult
    | ((context: ProTableCellContext<TData, TValue>) => TResult | undefined)
    | undefined,
  context: ProTableCellContext<TData, TValue> // 'context' es un parámetro aquí
): TResult | undefined => {
  if (metaProperty === undefined) return undefined;
  if (typeof metaProperty === "function") {
    // Asegúrate de que la función se llame con el 'context'
    return (
      metaProperty as (
        context: ProTableCellContext<TData, TValue>
      ) => TResult | undefined
    )(context);
  }
  return metaProperty;
};
// --- Fin getResolvedMetaValue ---

export function ProTable<TData extends object>({
  data,
  columns,
  initialVisibility,
  className,
  enableTooltips = true,
  enableSorting = true,
  showColumnSelector = true,
  placeholder = "Buscar…",
  getRowStatus,
  lineClamp: tableLineClamp = 0,
  tooltipDelay = 300,
  stickyHeader = false,
  stickyHeaderOffset = 0,
  renderCustomCheck,
  hideMenuOnScroll = false,
  getRowTextColorVariant,
  isRowTextBold,
}: TooltipTableProps<TData>) {
  const { appColorTokens } = useTheme();
  const tableTokens: TableTokens | null = React.useMemo(() => {
    return appColorTokens ? generateTableTokens(appColorTokens) : null;
  }, [appColorTokens]);

  if (!tableTokens) {
    return (
      <div
        className={cn(
          "space-y-4 p-4 border rounded-lg bg-gray-100 dark:bg-gray-800",
          className
        )}
      >
        <div className="h-8 w-1/3 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-48 w-full bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  const cellVariantTokens = tableTokens.cell.variants;

  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(initialVisibility ?? {});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = useState({});
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeTooltip, setActiveTooltip] = useState<{
    id: string;
    content: React.ReactNode;
    isLongContent: boolean;
  } | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [columnSelectorPosition, setColumnSelectorPosition] = useState({
    top: 0,
    left: 0,
  });
  const columnSelectorRef = useRef<HTMLButtonElement>(null);
  const columnSelectorMenuRef = useRef<HTMLDivElement>(null);
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false);

  useEffect(() => {
    const trackMousePosition = (e: MouseEvent) => {
      window.mouseX = e.clientX;
      window.mouseY = e.clientY;
    };
    window.addEventListener("mousemove", trackMousePosition);
    return () => window.removeEventListener("mousemove", trackMousePosition);
  }, []);
  const preparedColumns = React.useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        enableResizing: column.enableResizing ?? true,
      })),
    [columns]
  );
  const table = useReactTable({
    data,
    columns: preparedColumns,
    state: { columnVisibility, globalFilter, sorting, columnSizing },
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => (row as any).subRows,
  });
  const tableWidth = React.useMemo(
    () =>
      table
        .getAllColumns()
        .reduce(
          (acc, column) => acc + (column.getIsVisible() ? column.getSize() : 0),
          0
        ),
    [table, columnSizing, columnVisibility]
  );
  useEffect(() => {
    if (tableContainerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) setContainerWidth(entry.contentRect.width);
      });
      resizeObserver.observe(tableContainerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);
  const shouldExpandTable = containerWidth > 0 && tableWidth < containerWidth;

  const getTooltipContent = useCallback(
    (rowId: string, colId: string): React.ReactNode => {
      const row = table.getRow(rowId);
      if (!row) return null;
      const originalData = row.original as any;
      const originalValue = originalData ? originalData[colId] : undefined;

      if (
        typeof originalValue === "string" ||
        typeof originalValue === "number" ||
        typeof originalValue === "boolean"
      ) {
        return String(originalValue);
      }
      if (Array.isArray(originalValue)) {
        return originalValue.join(", ");
      }
      return null;
    },
    [table]
  );
  const shouldEnableFeature = useCallback(
    (
      columnId: string,
      feature: "enableTooltip" | "enableSorting",
      tableLevelEnable: boolean,
      metaOption?: boolean
    ) => {
      if (!tableLevelEnable || columnId === "expander") return false;
      const columnDef = preparedColumns.find(
        (col) => col.id === columnId || (col as any).accessorKey === columnId
      );
      if (columnDef?.meta?.type === "actions") return false;
      return metaOption !== undefined ? metaOption : true;
    },
    [preparedColumns]
  );
  const getLineClampValue = useCallback(
    (columnId: string) => {
      const columnMeta = preparedColumns.find(
        (col) => col.id === columnId || (col as any).accessorKey === columnId
      )?.meta;
      return columnMeta?.lineClamp ?? tableLineClamp;
    },
    [tableLineClamp, preparedColumns]
  );
  const isColumnLongContent = useCallback(
    (columnId: string) =>
      !!preparedColumns.find(
        (col) => col.id === columnId || (col as any).accessorKey === columnId
      )?.meta?.isLongContent,
    [preparedColumns]
  );
  const handleMouseEnterCell = (
    cellId: string,
    rowId: string,
    colId: string
  ) => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => {
      const content = getTooltipContent(rowId, colId);
      const longContentFlag = isColumnLongContent(colId);
      if (content !== null && content !== "") {
        setActiveTooltip({
          id: cellId,
          content,
          isLongContent: longContentFlag,
        });
      }
    }, tooltipDelay);
  };
  const handleMouseLeaveCell = () => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
    if (activeTooltip && !activeTooltip.isLongContent) setActiveTooltip(null);
  };
  const handleRowMouseEnter = (rowId: string) => setHoveredRowId(rowId);
  const handleRowMouseLeave = () => setHoveredRowId(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "f") {
        e.preventDefault();
        const inputElement = document.querySelector<HTMLInputElement>(
          `input[placeholder="${placeholder}"]`
        );
        if (inputElement) inputElement.focus();
      }
      if (e.key === "Escape" && activeTooltip) setActiveTooltip(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [placeholder, activeTooltip]);
  const hasSubRows = useCallback((row: Row<TData>) => {
    const original = row.original as any;
    return original?.subRows && original.subRows.length > 0;
  }, []);
  const getRowStyle = useCallback(
    (rowId: string, rowData?: TData): React.CSSProperties => {
      const isHovered = hoveredRowId === rowId;
      let currentStatus =
        getRowStatus && rowData ? getRowStatus(rowData) : null;
      if (currentStatus === "error") currentStatus = "danger";

      const defaultRowTokens = tableTokens.row.default;
      let finalStyle: React.CSSProperties = {
        backgroundColor: defaultRowTokens.backgroundColor,
        color: defaultRowTokens.foregroundColor,
        borderBottom: `1px solid ${defaultRowTokens.borderColor}`,
        transition:
          "background-color 0.15s ease-out, color 0.15s ease-out, border-color 0.15s ease-out, font-weight 0.15s ease-out",
      };
      let statusColorsDefinition;
      if (currentStatus) {
        if (currentStatus === "neutral") {
          statusColorsDefinition = defaultRowTokens;
        } else if (
          tableTokens.row.status[
            currentStatus as keyof typeof tableTokens.row.status
          ]
        ) {
          statusColorsDefinition =
            tableTokens.row.status[
              currentStatus as keyof typeof tableTokens.row.status
            ];
        } else if (cellVariantTokens[currentStatus as CellVariant]) {
          const variantToken = cellVariantTokens[currentStatus as CellVariant];
          statusColorsDefinition = {
            backgroundColor: variantToken.backgroundColor,
            foregroundColor: variantToken.foregroundColor,
            hoverBackgroundColor: variantToken.hoverBackgroundColor,
            borderColor:
              variantToken.borderColor || defaultRowTokens.borderColor,
          };
        }
      }
      if (statusColorsDefinition) {
        finalStyle.backgroundColor = isHovered
          ? statusColorsDefinition.hoverBackgroundColor
          : statusColorsDefinition.backgroundColor;
        finalStyle.color = statusColorsDefinition.foregroundColor;
        finalStyle.borderBottom = `1px solid ${
          statusColorsDefinition.borderColor || defaultRowTokens.borderColor
        }`;
      } else if (isHovered) {
        finalStyle.backgroundColor = defaultRowTokens.hoverBackgroundColor;
      }
      return finalStyle;
    },
    [hoveredRowId, getRowStatus, tableTokens, cellVariantTokens]
  );
  const getColumnWidth = useCallback(
    (column: Column<TData, any>) => {
      if (
        column.columnDef.meta?.type === "actions" ||
        column.columnDef.meta?.isFixed
      )
        return column.getSize();
      if (!shouldExpandTable) return column.getSize();
      const expansionFactor = containerWidth / tableWidth;
      const originalWidth = column.getSize();
      return Math.floor(originalWidth * expansionFactor);
    },
    [shouldExpandTable, containerWidth, tableWidth]
  );
  const getLineClampClass = useCallback((lcValue: number) => {
    if (lcValue > 0 && lcValue <= 6) return `line-clamp-${lcValue}`;
    return "";
  }, []);
  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);
  const openColumnSelector = () => {
    /* ... */
  };
  useEffect(() => {
    /* ... click outside column selector ... */
  }, [columnSelectorOpen]);
  useEffect(() => {
    if (hideMenuOnScroll && columnSelectorOpen) setColumnSelectorOpen(false);
  }, [hideMenuOnScroll, columnSelectorOpen]);
  const getFixedColumnHoverBg = useCallback(
    (
      rowId: string,
      baseCellBgForNonHover: string,
      rowData?: TData,
      cellMeta?: (typeof columns)[number]["meta"]
    ): string => {
      const rowInstance = table.getRow(rowId);
      const isRowHovered = hoveredRowId === rowId;
      const getCellContext = (
        r: Row<TData>,
        c?: Column<TData, unknown>,
        cellInst?: Cell<TData, unknown>
      ) => ({
        row: r,
        column: c || ({} as Column<TData, unknown>),
        cell: cellInst || ({} as Cell<TData, unknown>),
        getValue: () => (cellInst?.getValue ? cellInst.getValue() : {}) as any,
      });
      if (!isRowHovered) {
        if (cellMeta?.cellVariant && rowInstance) {
          const variantKey =
            typeof cellMeta.cellVariant === "function"
              ? (cellMeta.cellVariant as Function)(
                  getCellContext(rowInstance, undefined, undefined)
                )
              : cellMeta.cellVariant;
          if (variantKey && cellVariantTokens[variantKey as CellVariant])
            return cellVariantTokens[variantKey as CellVariant].backgroundColor;
        }
        return baseCellBgForNonHover;
      }
      if (cellMeta?.cellVariant && rowInstance) {
        const variantKey =
          typeof cellMeta.cellVariant === "function"
            ? (cellMeta.cellVariant as Function)(
                getCellContext(rowInstance, undefined, undefined)
              )
            : cellMeta.cellVariant;
        if (variantKey && cellVariantTokens[variantKey as CellVariant])
          return cellVariantTokens[variantKey as CellVariant]
            .hoverBackgroundColor;
      }
      let currentStatus =
        getRowStatus && rowData ? getRowStatus(rowData) : null;
      if (currentStatus) {
        if (currentStatus === "neutral")
          return tableTokens.row.default.hoverBackgroundColor;
        const statusToken =
          tableTokens.row.status[
            currentStatus as keyof typeof tableTokens.row.status
          ];
        if (statusToken) return statusToken.hoverBackgroundColor;
        const variantToken = cellVariantTokens[currentStatus as CellVariant];
        if (variantToken) return variantToken.hoverBackgroundColor;
      }
      return tableTokens.row.default.hoverBackgroundColor;
    },
    [hoveredRowId, tableTokens, cellVariantTokens, getRowStatus, table]
  );

  if (!tableTokens || !cellVariantTokens || !tableTokens.expander) return null;

  return (
    <div className={cn("space-y-4 flex flex-col", className)}>
      <div className="flex flex-wrap gap-2 items-center flex-shrink-0">
        <Input
          placeholder={placeholder}
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full max-w-sm"
        />
        {showColumnSelector && (
          <>
            <button
              ref={columnSelectorRef}
              onClick={openColumnSelector}
              className="ml-auto px-3 py-1.5 rounded bg-primary/10 hover:bg-primary/20 text-sm font-medium transition-colors"
              style={{
                color: tableTokens.toolbar.columnSelector.foregroundColor,
              }}
            >
              Columnas
            </button>
            {columnSelectorOpen && (
              <div
                ref={columnSelectorMenuRef}
                className="fixed z-50 mt-2 rounded-md shadow-lg p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                style={{
                  top: `${columnSelectorPosition.top}px`,
                  left: `${columnSelectorPosition.left}px`,
                  maxHeight: "300px",
                  overflowY: "auto",
                  backgroundColor:
                    tableTokens.toolbar.columnSelector.backgroundColor,
                  width: "200px",
                }}
              >
                <div className="grid grid-cols-2 gap-2">
                  {table
                    .getAllLeafColumns()
                    .filter((col) => col.id !== "expander")
                    .map((col) => (
                      <label
                        key={col.id}
                        className="flex items-center gap-2 text-sm py-1"
                        style={{
                          color:
                            tableTokens.toolbar.columnSelector.foregroundColor,
                        }}
                      >
                        {renderCustomCheck ? (
                          renderCustomCheck({
                            checked: col.getIsVisible(),
                            onChange: () => col.toggleVisibility(),
                          })
                        ) : (
                          <Checkbox
                            checked={col.getIsVisible()}
                            onCheckedChange={() => col.toggleVisibility()}
                          />
                        )}
                        {col.columnDef.header?.toString() || col.id}
                      </label>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {columns.some((col) => (col.meta?.lineClamp ?? tableLineClamp) > 6) && (
        <style jsx global>{`
          /* ... */
        `}</style>
      )}

      <div
        ref={tableContainerRef}
        className="relative overflow-auto rounded-lg flex-grow"
        style={{
          maxWidth: "100%",
          minHeight: "200px",
          maxHeight: "1200px",
          overflowX: "auto",
          overflowY: "auto",
          backgroundColor: tableTokens.container.backgroundColor,
          border: `1px solid ${tableTokens.container.borderColor}`,
          position: "relative",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(155, 155, 155, 0.5) transparent",
        }}
      >
        <style jsx global>{`
          .table-container::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .table-container::-webkit-scrollbar-track {
            background: transparent;
          }
          .table-container::-webkit-scrollbar-thumb {
            background-color: rgba(155, 155, 155, 0.5);
            border-radius: 20px;
          }
        `}</style>
        <div
          className="table-container"
          style={{
            width: shouldExpandTable
              ? "100%"
              : `${Math.max(tableWidth, 800)}px`,
            minWidth: shouldExpandTable
              ? "100%"
              : `${Math.max(tableWidth, 800)}px`,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            paddingRight: "8px",
          }}
        >
          <table
            className="w-full text-sm"
            role="table"
            style={{
              borderCollapse: "separate",
              borderSpacing: 0,
              width: "100%",
              backgroundColor: tableTokens.container.backgroundColor,
              flexGrow: 1,
              position: "relative",
            }}
          >
            <thead
              className={cn(stickyHeader ? "sticky top-0 z-20" : "")}
              style={{
                backgroundColor: tableTokens.header.backgroundColor,
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                top: stickyHeader ? `${stickyHeaderOffset}px` : undefined,
                position: stickyHeader ? "sticky" : undefined,
                zIndex: stickyHeader ? 20 : undefined,
              }}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    // ... (renderizado de <th> sin cambios significativos aquí)
                    const isSortable = shouldEnableFeature(
                      header.column.id,
                      "enableSorting",
                      enableSorting,
                      header.column.columnDef.meta?.enableSorting
                    );
                    const sortDirection = header.column.getIsSorted();
                    const isFixedColumn = header.column.columnDef.meta?.isFixed;
                    return (
                      <th
                        key={header.id}
                        style={{
                          width: getColumnWidth(header.column),
                          position: isFixedColumn ? "sticky" : "relative",
                          right: isFixedColumn ? 0 : "auto",
                          borderRight: `1px solid ${tableTokens.header.borderColor}`,
                          borderBottom: `1px solid ${tableTokens.header.borderColor}`,
                          padding: "0.75rem 0.5rem",
                          textAlign: "center",
                          color: tableTokens.header.foregroundColor,
                          backgroundColor: tableTokens.header.backgroundColor,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                          whiteSpace: "nowrap",
                          userSelect: "none",
                          zIndex: isFixedColumn ? 3 : 2,
                        }}
                        className={cn(
                          "group",
                          header.column.columnDef.meta?.className,
                          isFixedColumn && "shadow-sm"
                        )}
                        role="columnheader"
                      >
                        <div className="flex items-center justify-center gap-1">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {isSortable && (
                            <button
                              onClick={() => header.column.toggleSorting()}
                              className="ml-1 rounded-sm focus:outline-none focus:ring-2"
                              style={{
                                color: sortDirection
                                  ? tableTokens.header.sortIconHoverColor
                                  : tableTokens.header.sortIconColor,
                              }}
                              aria-label={
                                sortDirection === "asc"
                                  ? "Asc"
                                  : sortDirection === "desc"
                                  ? "Desc"
                                  : "Sort"
                              }
                            >
                              {" "}
                              {sortDirection === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : sortDirection === "desc" ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronsUpDown className="h-4 w-4" />
                              )}{" "}
                            </button>
                          )}
                        </div>
                        {header.column.getCanResize() && !isFixedColumn && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className="absolute right-0 top-0 h-full w-2 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Resize"
                            style={{
                              backgroundColor:
                                tableTokens.header.resizeHandleColor,
                            }}
                          >
                            {" "}
                            <div
                              className="absolute right-0 top-0 h-full w-[3px]"
                              style={{
                                backgroundColor:
                                  tableTokens.header.resizeHandleColor,
                              }}
                            ></div>{" "}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody role="rowgroup">
              {table.getRowModel().rows.map((row) => {
                const isSubRowOriginal = data.some(
                  (item: any) =>
                    item.subRows &&
                    item.subRows.some(
                      (subR: any) => subR.id === (row.original as any).id
                    )
                );
                if (isSubRowOriginal) return null;
                const currentTRRowStyle = getRowStyle(
                  row.id,
                  row.original as TData
                );
                const resolvedRowTextColorVariant = getRowTextColorVariant
                  ? getRowTextColorVariant(row.original as TData)
                  : undefined;
                const resolvedIsRowTextBold = isRowTextBold
                  ? isRowTextBold(row.original as TData)
                  : undefined;

                return (
                  <React.Fragment key={row.id}>
                    <tr
                      className={cn(
                        "transition-colors",
                        row.getCanExpand() ? "cursor-pointer" : ""
                      )}
                      style={currentTRRowStyle}
                      role="row"
                      onMouseEnter={() => handleRowMouseEnter(row.id)}
                      onMouseLeave={handleRowMouseLeave}
                      onClick={
                        row.getCanExpand()
                          ? row.getToggleExpandedHandler()
                          : undefined
                      }
                    >
                      {row.getVisibleCells().map((cell) => {
                        // --- Lógica de estilos de celda (fontWeight, color, backgroundColor) ---
                        // Esta lógica ya incluye la precedencia de celda > fila > default
                        // y los ajustes para columnas fijas, etc. (Sin cambios aquí)
                        const cellContext =
                          cell.getContext() as ProTableCellContext<
                            TData,
                            unknown
                          >;
                        const cellContent = flexRender(
                          cell.column.columnDef.cell,
                          cellContext
                        );
                        const isCellTooltipEnabled = shouldEnableFeature(
                          cell.column.id,
                          "enableTooltip",
                          enableTooltips,
                          cell.column.columnDef.meta?.enableTooltip
                        );
                        const cellLineClampValue = getLineClampValue(
                          cell.column.id
                        );
                        const cellLineClampClass =
                          getLineClampClass(cellLineClampValue);
                        const visibleCellsInRow = cell.row.getVisibleCells();
                        const isLastCell =
                          cell.id ===
                          visibleCellsInRow[visibleCellsInRow.length - 1]?.id;
                        const cellMeta = cell.column.columnDef.meta;
                        const isFixedColumn = cellMeta?.isFixed;
                        const shouldFadeText =
                          cellMeta?.enableTextFade && cellLineClampValue > 0;
                        const resolvedCellTextColorVariant =
                          getResolvedMetaValue<TData, unknown, CellVariant>(
                            cellMeta?.textColorVariant,
                            cellContext
                          );
                        const resolvedCellIsTextBold = getResolvedMetaValue<
                          TData,
                          unknown,
                          boolean
                        >(cellMeta?.isTextBold, cellContext);
                        const resolvedCellVariantForBgAndDefaultColor =
                          getResolvedMetaValue<TData, unknown, CellVariant>(
                            cellMeta?.cellVariant,
                            cellContext
                          );
                        const tdStyle: React.CSSProperties = {
                          width: getColumnWidth(cell.column),
                          verticalAlign:
                            cell.column.id === "expander" ? "middle" : "top",
                          padding:
                            cell.column.id === "expander"
                              ? "0.75rem 0.25rem"
                              : "0.75rem 0.5rem",
                          borderBottom: currentTRRowStyle.borderBottom,
                          borderRight: isLastCell
                            ? undefined
                            : `1px solid ${tableTokens.cell.borderColor}`,
                          transition:
                            "background-color 0.15s ease-out, color 0.15s ease-out, border-color 0.15s ease-out, font-weight 0.15s ease-out",
                          backgroundColor: currentTRRowStyle.backgroundColor,
                        };
                        if (isFixedColumn) {
                          tdStyle.position = "sticky";
                          tdStyle.right = 0;
                          tdStyle.zIndex = 1;
                          tdStyle.boxShadow = "-2px 0 5px rgba(0, 0, 0, 0.1)";
                        }
                        let cellVariantBgToken;
                        if (
                          resolvedCellVariantForBgAndDefaultColor &&
                          cellVariantTokens[
                            resolvedCellVariantForBgAndDefaultColor
                          ]
                        ) {
                          cellVariantBgToken =
                            cellVariantTokens[
                              resolvedCellVariantForBgAndDefaultColor
                            ];
                          const isRowHovered = hoveredRowId === row.id;
                          if (!isFixedColumn) {
                            tdStyle.backgroundColor = isRowHovered
                              ? cellVariantBgToken.hoverBackgroundColor
                              : cellVariantBgToken.backgroundColor;
                          }
                        }
                        if (isFixedColumn) {
                          let baseBgForFixedNonHover =
                            tdStyle.backgroundColor ||
                            tableTokens.row.default.backgroundColor;
                          if (cellVariantBgToken && isFixedColumn) {
                            baseBgForFixedNonHover =
                              cellVariantBgToken.backgroundColor;
                            tdStyle.backgroundColor =
                              hoveredRowId === row.id
                                ? cellVariantBgToken.hoverBackgroundColor
                                : cellVariantBgToken.backgroundColor;
                          } else {
                            tdStyle.backgroundColor = getFixedColumnHoverBg(
                              row.id,
                              baseBgForFixedNonHover,
                              row.original as TData,
                              cellMeta
                            );
                          }
                        }
                        let finalTextColor =
                          currentTRRowStyle.color ||
                          tableTokens.cell.foregroundColor;
                        if (
                          resolvedCellVariantForBgAndDefaultColor &&
                          cellVariantTokens[
                            resolvedCellVariantForBgAndDefaultColor
                          ] &&
                          !resolvedCellTextColorVariant &&
                          !resolvedRowTextColorVariant
                        ) {
                          finalTextColor =
                            cellVariantTokens[
                              resolvedCellVariantForBgAndDefaultColor
                            ].foregroundColor;
                        }
                        if (
                          resolvedRowTextColorVariant &&
                          cellVariantTokens[resolvedRowTextColorVariant] &&
                          !resolvedCellTextColorVariant
                        ) {
                          finalTextColor =
                            cellVariantTokens[resolvedRowTextColorVariant]
                              .foregroundColor;
                        }
                        if (
                          resolvedCellTextColorVariant &&
                          cellVariantTokens[resolvedCellTextColorVariant]
                        ) {
                          finalTextColor =
                            cellVariantTokens[resolvedCellTextColorVariant]
                              .foregroundColor;
                        }
                        tdStyle.color = finalTextColor;
                        if (resolvedCellIsTextBold === true) {
                          tdStyle.fontWeight = "bold";
                        } else if (resolvedCellIsTextBold === false) {
                          tdStyle.fontWeight = "normal";
                        } else if (resolvedIsRowTextBold === true) {
                          tdStyle.fontWeight = "bold";
                        } else if (resolvedIsRowTextBold === false) {
                          tdStyle.fontWeight = "normal";
                        }

                        if (cell.column.id === "expander") {
                          return (
                            <td
                              key={cell.id}
                              className={cn(
                                "align-middle text-center",
                                cellMeta?.className
                              )}
                              style={tdStyle}
                            >
                              {row.getCanExpand() ? (
                                <ExpandIconComponent
                                  isExpanded={row.getIsExpanded()}
                                  expanderTokens={tableTokens.expander}
                                />
                              ) : null}
                            </td>
                          );
                        }
                        return (
                          <td
                            key={cell.id}
                            className={cn(
                              cellMeta?.className,
                              "align-top",
                              isFixedColumn && "shadow-sm"
                            )}
                            role="cell"
                            style={tdStyle}
                            onMouseEnter={
                              isCellTooltipEnabled
                                ? () =>
                                    handleMouseEnterCell(
                                      `tooltip-${row.id}-${cell.column.id}`,
                                      row.id,
                                      cell.column.id
                                    )
                                : undefined
                            }
                            onMouseLeave={
                              isCellTooltipEnabled
                                ? handleMouseLeaveCell
                                : undefined
                            }
                          >
                            <div
                              className={cn(
                                `break-words max-w-xs ${cellLineClampClass}`,
                                shouldFadeText && "relative",
                                cellMeta?.contentClassName
                              )}
                              style={
                                {
                                  "--cell-bg-for-fade": tdStyle.backgroundColor,
                                  ...(cellLineClampValue > 6 && {
                                    WebkitLineClamp: cellLineClampValue,
                                    display: "-webkit-box",
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }),
                                } as React.CSSProperties
                              }
                            >
                              {cellContent}
                              {shouldFadeText && (
                                <div
                                  className="absolute bottom-0 right-0 w-full h-[1.5em] pointer-events-none"
                                  style={{
                                    background: `linear-gradient(to right, transparent 0%, var(--cell-bg-for-fade) 70%, var(--cell-bg-for-fade) 100%)`,
                                  }}
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    {row.getIsExpanded() &&
                      row.subRows &&
                      row.subRows.length > 0 && (
                        // --- SECCIÓN DE SUBFILAS (la misma lógica de estilos de celda se aplica aquí) ---
                        <tr
                          style={{
                            backgroundColor:
                              tableTokens.row.subRowBackgroundColor,
                          }}
                        >
                          <td
                            colSpan={row.getVisibleCells().length}
                            className="p-0"
                          >
                            <div
                              className="pl-4 pt-1"
                              style={{
                                borderLeft: `2px solid ${tableTokens.row.subRowIndentBorderColor}`,
                                boxShadow: `inset 0px 2px 3px -1px rgba(0, 0, 0, 0.07)`,
                              }}
                            >
                              <table
                                className="w-full text-sm"
                                style={{ borderSpacing: 0 }}
                              >
                                <tbody>
                                  {row.subRows.map(
                                    (subRowInstance, subRowIndex) => {
                                      const currentTRSubRowStyle = getRowStyle(
                                        subRowInstance.id,
                                        subRowInstance.original as TData
                                      );
                                      if (
                                        subRowIndex ===
                                        row.subRows.length - 1
                                      ) {
                                        currentTRSubRowStyle.borderBottom =
                                          "none";
                                      }
                                      const resolvedSubRowTextColorVariant =
                                        getRowTextColorVariant
                                          ? getRowTextColorVariant(
                                              subRowInstance.original as TData
                                            )
                                          : undefined;
                                      const resolvedIsSubRowTextBold =
                                        isRowTextBold
                                          ? isRowTextBold(
                                              subRowInstance.original as TData
                                            )
                                          : undefined;
                                      return (
                                        <tr
                                          key={subRowInstance.id}
                                          style={currentTRSubRowStyle}
                                          onMouseEnter={() =>
                                            handleRowMouseEnter(
                                              subRowInstance.id
                                            )
                                          }
                                          onMouseLeave={handleRowMouseLeave}
                                        >
                                          {subRowInstance
                                            .getVisibleCells()
                                            .map((cell) => {
                                              const cellContext =
                                                cell.getContext() as ProTableCellContext<
                                                  TData,
                                                  unknown
                                                >;
                                              const cellContent = flexRender(
                                                cell.column.columnDef.cell,
                                                cellContext
                                              );
                                              const isCellTooltipEnabled =
                                                shouldEnableFeature(
                                                  cell.column.id,
                                                  "enableTooltip",
                                                  enableTooltips,
                                                  cell.column.columnDef.meta
                                                    ?.enableTooltip
                                                );
                                              const cellLineClampValue =
                                                getLineClampValue(
                                                  cell.column.id
                                                );
                                              const cellLineClampClass =
                                                getLineClampClass(
                                                  cellLineClampValue
                                                );
                                              const visibleCellsInSubRow =
                                                cell.row.getVisibleCells();
                                              const isLastSubCell =
                                                cell.id ===
                                                visibleCellsInSubRow[
                                                  visibleCellsInSubRow.length -
                                                    1
                                                ]?.id;
                                              const subCellMeta =
                                                cell.column.columnDef.meta;
                                              const isFixedColumn =
                                                subCellMeta?.isFixed;
                                              const shouldFadeSubCellText =
                                                subCellMeta?.enableTextFade &&
                                                cellLineClampValue > 0;
                                              const resolvedSubCellTextColorVariant =
                                                getResolvedMetaValue<
                                                  TData,
                                                  unknown,
                                                  CellVariant
                                                >(
                                                  subCellMeta?.textColorVariant,
                                                  cellContext
                                                );
                                              const resolvedSubCellIsTextBold =
                                                getResolvedMetaValue<
                                                  TData,
                                                  unknown,
                                                  boolean
                                                >(
                                                  subCellMeta?.isTextBold,
                                                  cellContext
                                                );
                                              const resolvedSubCellVariantForBgAndDefaultColor =
                                                getResolvedMetaValue<
                                                  TData,
                                                  unknown,
                                                  CellVariant
                                                >(
                                                  subCellMeta?.cellVariant,
                                                  cellContext
                                                );
                                              const tdStyle: React.CSSProperties =
                                                {
                                                  width: getColumnWidth(
                                                    cell.column
                                                  ),
                                                  verticalAlign:
                                                    cell.column.id ===
                                                    "expander"
                                                      ? "middle"
                                                      : "top",
                                                  padding:
                                                    cell.column.id ===
                                                    "expander"
                                                      ? "0.75rem 0.25rem"
                                                      : "0.75rem 0.5rem",
                                                  borderBottom:
                                                    currentTRSubRowStyle.borderBottom,
                                                  borderRight: isLastSubCell
                                                    ? undefined
                                                    : `1px solid ${tableTokens.cell.borderColor}`,
                                                  transition:
                                                    "background-color 0.15s ease-out, color 0.15s ease-out, border-color 0.15s ease-out, font-weight 0.15s ease-out",
                                                  backgroundColor:
                                                    currentTRSubRowStyle.backgroundColor,
                                                };
                                              if (isFixedColumn) {
                                                tdStyle.position = "sticky";
                                                tdStyle.right = 0;
                                                tdStyle.zIndex = 1;
                                                tdStyle.boxShadow =
                                                  "-2px 0 5px rgba(0, 0, 0, 0.1)";
                                              }
                                              let subCellVariantBgToken;
                                              if (
                                                resolvedSubCellVariantForBgAndDefaultColor &&
                                                cellVariantTokens[
                                                  resolvedSubCellVariantForBgAndDefaultColor
                                                ]
                                              ) {
                                                subCellVariantBgToken =
                                                  cellVariantTokens[
                                                    resolvedSubCellVariantForBgAndDefaultColor
                                                  ];
                                                const isSubRowHovered =
                                                  hoveredRowId ===
                                                  subRowInstance.id;
                                                if (!isFixedColumn) {
                                                  tdStyle.backgroundColor =
                                                    isSubRowHovered
                                                      ? subCellVariantBgToken.hoverBackgroundColor
                                                      : subCellVariantBgToken.backgroundColor;
                                                }
                                              }
                                              if (isFixedColumn) {
                                                let baseBgForFixedSubRowNonHover =
                                                  tdStyle.backgroundColor ||
                                                  tableTokens.row.default
                                                    .backgroundColor;
                                                if (
                                                  subCellVariantBgToken &&
                                                  isFixedColumn
                                                ) {
                                                  baseBgForFixedSubRowNonHover =
                                                    subCellVariantBgToken.backgroundColor;
                                                  tdStyle.backgroundColor =
                                                    hoveredRowId ===
                                                    subRowInstance.id
                                                      ? subCellVariantBgToken.hoverBackgroundColor
                                                      : subCellVariantBgToken.backgroundColor;
                                                } else {
                                                  tdStyle.backgroundColor =
                                                    getFixedColumnHoverBg(
                                                      subRowInstance.id,
                                                      baseBgForFixedSubRowNonHover,
                                                      subRowInstance.original as TData,
                                                      subCellMeta
                                                    );
                                                }
                                              }
                                              let finalSubCellTextColor =
                                                currentTRSubRowStyle.color ||
                                                tableTokens.cell
                                                  .foregroundColor;
                                              if (
                                                resolvedSubCellVariantForBgAndDefaultColor &&
                                                cellVariantTokens[
                                                  resolvedSubCellVariantForBgAndDefaultColor
                                                ] &&
                                                !resolvedSubCellTextColorVariant &&
                                                !resolvedSubRowTextColorVariant
                                              ) {
                                                finalSubCellTextColor =
                                                  cellVariantTokens[
                                                    resolvedSubCellVariantForBgAndDefaultColor
                                                  ].foregroundColor;
                                              }
                                              if (
                                                resolvedSubRowTextColorVariant &&
                                                cellVariantTokens[
                                                  resolvedSubRowTextColorVariant
                                                ] &&
                                                !resolvedSubCellTextColorVariant
                                              ) {
                                                finalSubCellTextColor =
                                                  cellVariantTokens[
                                                    resolvedSubRowTextColorVariant
                                                  ].foregroundColor;
                                              }
                                              if (
                                                resolvedSubCellTextColorVariant &&
                                                cellVariantTokens[
                                                  resolvedSubCellTextColorVariant
                                                ]
                                              ) {
                                                finalSubCellTextColor =
                                                  cellVariantTokens[
                                                    resolvedSubCellTextColorVariant
                                                  ].foregroundColor;
                                              }
                                              tdStyle.color =
                                                finalSubCellTextColor;
                                              if (
                                                resolvedSubCellIsTextBold ===
                                                true
                                              ) {
                                                tdStyle.fontWeight = "bold";
                                              } else if (
                                                resolvedSubCellIsTextBold ===
                                                false
                                              ) {
                                                tdStyle.fontWeight = "normal";
                                              } else if (
                                                resolvedIsSubRowTextBold ===
                                                true
                                              ) {
                                                tdStyle.fontWeight = "bold";
                                              } else if (
                                                resolvedIsSubRowTextBold ===
                                                false
                                              ) {
                                                tdStyle.fontWeight = "normal";
                                              }
                                              if (
                                                cell.column.id === "expander"
                                              ) {
                                                return (
                                                  <td
                                                    key={cell.id}
                                                    className={cn(
                                                      "align-middle text-center",
                                                      subCellMeta?.className
                                                    )}
                                                    style={tdStyle}
                                                  >
                                                    {null}
                                                  </td>
                                                );
                                              }
                                              return (
                                                <td
                                                  key={cell.id}
                                                  className={cn(
                                                    subCellMeta?.className,
                                                    "align-top",
                                                    isFixedColumn && "shadow-sm"
                                                  )}
                                                  role="cell"
                                                  style={tdStyle}
                                                  onMouseEnter={
                                                    isCellTooltipEnabled
                                                      ? () =>
                                                          handleMouseEnterCell(
                                                            `tooltip-${subRowInstance.id}-${cell.column.id}`,
                                                            subRowInstance.id,
                                                            cell.column.id
                                                          )
                                                      : undefined
                                                  }
                                                  onMouseLeave={
                                                    isCellTooltipEnabled
                                                      ? handleMouseLeaveCell
                                                      : undefined
                                                  }
                                                >
                                                  <div
                                                    className={cn(
                                                      `break-words max-w-xs ${cellLineClampClass}`,
                                                      shouldFadeSubCellText &&
                                                        "relative",
                                                      subCellMeta?.contentClassName
                                                    )}
                                                    style={
                                                      {
                                                        "--cell-bg-for-fade":
                                                          tdStyle.backgroundColor,
                                                        ...(cellLineClampValue >
                                                          6 && {
                                                          WebkitLineClamp:
                                                            cellLineClampValue,
                                                          display:
                                                            "-webkit-box",
                                                          WebkitBoxOrient:
                                                            "vertical",
                                                          overflow: "hidden",
                                                        }),
                                                      } as React.CSSProperties
                                                    }
                                                  >
                                                    {cellContent}
                                                    {shouldFadeSubCellText && (
                                                      <div
                                                        className="absolute bottom-0 right-0 w-full h-[1.5em] pointer-events-none"
                                                        style={{
                                                          background: `linear-gradient(to right, transparent 0%, var(--cell-bg-for-fade) 70%, var(--cell-bg-for-fade) 100%)`,
                                                        }}
                                                        aria-hidden="true"
                                                      />
                                                    )}
                                                  </div>
                                                </td>
                                              );
                                            })}
                                        </tr>
                                      );
                                    }
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {activeTooltip && tableTokens.tooltip && (
        // @ts-ignore El error de content, isLongContent etc. se debe a la definición incompleta de TooltipComponentProps que pegué.
        // Asumo que la definición completa sí tiene esas props.
        <Tooltip
          content={activeTooltip.content}
          isLongContent={activeTooltip.isLongContent}
          onClose={() => setActiveTooltip(null)}
          tooltipTokens={tableTokens.tooltip}
        />
      )}
    </div>
  );
}
// --- END OF FILE ProTable.tsx (CON AJUSTES FLEXBOX) ---
