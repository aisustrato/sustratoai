// --- START OF FILE Copia de page.txt (CON MEJORAS Y CORRECCIONES) ---

"use client";

import React, { useState, useEffect, useRef } from "react";
import { ProTable } from "@/components/ui/pro-table"; // Asegúrate que la ruta sea correcta
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
// import { AnimatePresence, motion } from "framer-motion"; // No se usa directamente aquí, ProTable lo maneja
import { CheckCircle2, XCircle } from "lucide-react";

// Datos para el nuevo showroom
interface TestData {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  status: "completed" | "pending" | "cancelled";
  tags: string[];
  progress: number;
  subRows?: TestData[];
}

const getLongText = (numParagraphs: number) => {
  const base =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam at justo vel libero venenatis fringilla. Donec euismod, nisl eget aliquam ultricies, nunc nisl ultricies nunc, quis ultricies nisl nisl eget aliquam. ";
  return Array(numParagraphs).fill(base).join(" ").trim();
};

const testData: TestData[] = [
  {
    id: "1",
    title: "Tarea con 1 línea máxima en celda",
    description: getLongText(5), // Hacerlo más largo para probar tooltip
    priority: "high",
    status: "pending",
    tags: ["frontend", "urgente"],
    progress: 25,
    subRows: [
      {
        id: "1-1",
        title: "Subtarea 1",
        description: "Subtarea con descripción corta",
        priority: "medium",
        status: "completed",
        tags: ["research"],
        progress: 100,
      },
    ],
  },
  {
    id: "2",
    title: "Tarea con 3 líneas máximas en celda",
    description: getLongText(10), // Hacerlo más largo
    priority: "medium",
    status: "completed",
    tags: ["backend", "database"],
    progress: 100,
  },
  {
    id: "3",
    title: "Tarea con 5 líneas máximas en celda",
    description: getLongText(15), // Hacerlo más largo
    priority: "low",
    status: "pending",
    tags: ["design", "ui"],
    progress: 60,
    subRows: [
      {
        id: "3-1",
        title: "Subtarea A",
        description:
          "Primera subtarea con descripción mediana que ocupa al menos dos líneas para ver cómo queda. Esta es una prueba para el tooltip de contenido largo.",
        priority: "medium",
        status: "pending",
        tags: ["wireframes"],
        progress: 40,
      },
      {
        id: "3-2",
        title: "Subtarea B",
        description: "Segunda subtarea con descripción corta",
        priority: "low",
        status: "cancelled",
        tags: ["mockups"],
        progress: 20,
      },
    ],
  },
  {
    id: "4",
    title: "Tarea con celda de éxito",
    description:
      "Esta tarea tiene una celda con estilo 'success' en Prioridad.",
    priority: "low", // Cambiado para que coincida con cellVariant 'success'
    status: "completed",
    tags: ["deployment", "testing"],
    progress: 95,
  },
  {
    id: "5",
    title: "Tarea con celda de advertencia",
    description:
      "Esta tarea tiene una celda con estilo 'warning' en Prioridad.",
    priority: "medium", // Coincide con cellVariant 'warning'
    status: "pending",
    tags: ["optimization"],
    progress: 50,
  },
  {
    id: "6",
    title: "Tarea con celda de peligro",
    description: "Esta tarea tiene una celda con estilo 'danger' en Prioridad.",
    priority: "high", // Coincide con cellVariant 'danger'
    status: "cancelled",
    tags: ["security", "fixes"],
    progress: 10,
  },
];

// Componentes personalizados para selección de columnas
const CustomCheck = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) => {
  return (
    <div
      onClick={onChange}
      className="cursor-pointer flex items-center justify-center w-5 h-5" // Asegurar centrado
      role="checkbox"
      aria-checked={checked}
      tabIndex={0} // Hacerlo enfocable
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange();
        }
      }} // Permitir activación con teclado
    >
      {checked ? (
        <CheckCircle2 className="h-5 w-5 text-primary" />
      ) : (
        <XCircle className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );
};

const TableShowcaseSimple: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let scrollTimer: NodeJS.Timeout;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => setIsScrolling(false), 150); // Reducir delay
    };

    const div = scrollRef.current;
    if (div) {
      div.addEventListener("scroll", handleScroll, { passive: true }); // Mejorar rendimiento
      return () => {
        div.removeEventListener("scroll", handleScroll);
        clearTimeout(scrollTimer);
      };
    }
  }, []);

  const columns: ColumnDef<TestData, any>[] = [
    // MEJORA: Añadir columna expander
    {
      id: "expander",
      header: () => null, // Opcional: puedes poner un header si lo necesitas
      size: 45, // Ancho adecuado para el ícono circular
      minSize: 40,
      maxSize: 50,
      cell: ({ row }) => {
        // ProTable se encargará de renderizar el ExpandIconComponent aquí
        // basado en row.getCanExpand() y row.getIsExpanded()
        // Así que esta celda puede estar "vacía" en la definición,
        // ProTable lo llenará.
        return null;
      },
    },
    {
      accessorKey: "title",
      header: "Título",
      cell: (info) => info.getValue(),
      meta: {
        lineClamp: 1,
        enableTooltip: false,
      },
    },
    {
      accessorKey: "description",
      header: "Descripción",
      // La lógica de line-clamp dinámico por celda es interesante.
      // ProTable aplicará `meta.lineClamp` (que es 2) globalmente a esta columna.
      // Si necesitas anularlo por celda, el estilo en línea es una forma.
      // Alternativamente, podrías hacer que ProTable acepte lineClamp en `cellContext.cell.column.columnDef.meta`
      // que pueda ser una función y leerlo desde ahí.
      cell: (info) => {
        const row = info.row.original;
        // El lineClamp base de ProTable (meta.lineClamp=2) se aplicará.
        // Si quieres un line-clamp específico para estas filas, podrías
        // aplicar estilos en línea o clases específicas aquí.
        // Por ahora, ProTable usará el meta.lineClamp de la columna.
        // Si el lineClamp de la celda es más importante, mantenemos tu lógica:
        let lineClampForCell = info.column.columnDef.meta?.lineClamp || 2; // Valor por defecto de la columna
        if (row.id === "1") lineClampForCell = 1;
        else if (row.id === "2") lineClampForCell = 3;
        else if (row.id === "3") lineClampForCell = 5;

        const style: React.CSSProperties =
          lineClampForCell > 0
            ? {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: lineClampForCell,
                overflow: "hidden",
                // textOverflow: "ellipsis", // Opcional
              }
            : {};

        return <div style={style}>{info.getValue() as string}</div>;
      },
      meta: {
        enableTooltip: true,
        isLongContent: true, // Indica que el contenido puede ser muy largo para el tooltip grande
        lineClamp: 2, // Fallback lineClamp para la columna si no se especifica en la celda
      },
    },
    {
      accessorKey: "priority",
      header: "Prioridad",
      cell: (info) => {
        const priority = info.getValue() as TestData["priority"];
        const variants: Record<
          TestData["priority"],
          { color: string; label: string }
        > = {
          high: { color: "destructive", label: "Alta" },
          medium: { color: "default", label: "Media" }, // Cambiado a 'default' para Badge, cellVariant controlará el fondo
          low: { color: "secondary", label: "Baja" }, // Cambiado a 'secondary' para Badge
        };
        return (
          <Badge
            variant={variants[priority].color as any} // Usar los colores de Badge para el texto/borde del badge
            className="capitalize"
          >
            {variants[priority].label}
          </Badge>
        );
      },
      meta: {
        // El cellVariant determinará el fondo de la celda según la lógica de ProTable
        cellVariant: (info) => {
          const priority = info.getValue() as TestData["priority"];
          if (priority === "high") return "danger";
          if (priority === "medium") return "warning";
          if (priority === "low") return "success";
          return undefined;
        },
        enableTooltip: false,
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: (info) => {
        const status = info.getValue() as TestData["status"];
        return (
          <div className="font-medium">
            {status === "completed"
              ? "Completado"
              : status === "pending"
              ? "Pendiente"
              : "Cancelado"}
          </div>
        );
      },
      meta: {
        enableTooltip: false,
      },
    },
    {
      accessorKey: "tags",
      header: "Etiquetas",
      cell: (info) => {
        const tags = info.getValue() as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        );
      },
      meta: {
        enableTooltip: false,
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex items-center justify-center space-x-2">
          <Button variant="outline" size="sm">
            Ver
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            {" "}
            {/* Añadido hover */}
            Eliminar
          </Button>
        </div>
      ),
      meta: {
        type: "actions",
        isFixed: true,
      },
    },
  ];

  const getRowStatus = (row: TestData) => {
    // Para esta demo, no usamos getRowStatus para colorear filas enteras,
    // el color se maneja por celda con cellVariant.
    return null;
  };

  return (
    <PageWrapper
      title="ProTable Simplificado"
      className="container mx-auto px-4 py-8"
    >
      // o si ProTable debe scrollear internamente. // Si el scroll es de la
      PÁGINA, ProTable no necesita el ref.
      <Text variant="heading" as="h1" className="mb-4">
        Versión Simplificada de ProTable
      </Text>
      <Text variant="default" className="mb-6">
        Esta versión se enfoca en demostrar:
      </Text>
      <ul className="list-disc list-inside mb-6 space-y-1">
        <li>Columna de expansión automática con ícono estilizado.</li>
        <li>
          Textos largos con diferentes alturas máximas (controlado por celda).
        </li>
        <li>
          Celdas con fondos de color específicos (vía `meta.cellVariant`).
        </li>
        <li>Efecto "hundido" para subfilas.</li>
        <li>Controles personalizados para selección de columnas.</li>
        <li>
          Ocultamiento del popup de selección de columnas al hacer scroll en la
          página.
        </li>
      </ul>
      {/* El div con ref para scroll se quita si ProTable maneja su propio scroll
          o si el scroll es de la página completa y hideMenuOnScroll se basa en eso.
          Si es para el scroll de la página, PageWrapper debería tener el ref.
          Para este ejemplo, asumimos que hideMenuOnScroll se refiere al scroll de la ventana.
      */}
      <div ref={scrollRef}>
        {" "}
        {/* Mantener si es para detectar scroll DEL CONTENEDOR de la tabla */}
        <ProTable<TestData>
          data={[...testData, ...testData]}
          columns={columns}
          enableTooltips={true}
          enableSorting={true}
          showColumnSelector={true}
          placeholder="Buscar en la tabla..."
          getRowStatus={getRowStatus}
          lineClamp={2} // lineClamp general para columnas que no lo especifiquen
          // maxVisibleLines={3} // No está en la interfaz de ProTable actual
          stickyHeader={true}
          className="mt-4 border rounded-lg shadow-lg" // Quitar overflow-hidden si ProTable maneja su scroll
          renderCustomCheck={(props) => <CustomCheck {...props} />}
          hideMenuOnScroll={isScrolling} // hideMenuOnScroll se activa si scrollRef (o window) hace scroll
        />
      </div>
    </PageWrapper>
  );
};

export default TableShowcaseSimple;

// --- END OF FILE ---
