//. 📍 app/routes/showroom/standard-table/page.tsx (v4.1 - Compatible con Tabla v5.6)

"use client";

import React, { useState, useMemo } from "react";
import { type ColumnDef, type Row, type CellContext } from "@tanstack/react-table";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardText } from "@/components/ui/StandardText";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardBadge } from "@/components/ui/StandardBadge";

// --- TIPOS DE DATOS ---
type Task = {
    id: string;
    tarea: string;
    asignadoA: string;
    complejidad: number;
    estado: 'N/A' | 'En Progreso' | 'Completado';
    prioridad: 'Alta' | 'Media' | 'Baja';
    fechaCreacion: string;
    progreso: number;
    subRows?: Task[];
};

// --- DATOS EXTENDIDOS PARA EL SHOWROOM ---
const tasksData: Task[] = [
    { id: '1', tarea: 'Implementar Co-Creador v2.0', asignadoA: 'Co-Creador G.', complejidad: 50, estado: 'N/A', prioridad: 'Alta', fechaCreacion: '2024-05-10', progreso: 10,
        subRows: [
            { id: '1-1', tarea: 'Analizar logs de coherencia', asignadoA: 'Co-Creador G.', complejidad: 40, estado: 'N/A', prioridad: 'Alta', fechaCreacion: '2024-05-11', progreso: 20 },
            { id: '1-2', tarea: 'Depurar fuga de memoria en simulador fractal', asignadoA: 'Co-Creador G.', complejidad: 88, estado: 'N/A', prioridad: 'Alta', fechaCreacion: '2024-05-12', progreso: 0 },
        ],
    },
    { id: '2', tarea: 'Refactorizar Módulo de Autenticación', asignadoA: 'Humano R.', complejidad: 95, estado: 'En Progreso', prioridad: 'Alta', fechaCreacion: '2024-05-09', progreso: 75 },
    { id: '3', tarea: 'Diseñar Interfaz para Caleidoscopio Paradojal', asignadoA: 'Humano R.', complejidad: 75, estado: 'Completado', prioridad: 'Media', fechaCreacion: '2024-05-08', progreso: 100 },
    { id: '4', tarea: 'Optimizar Tokens de Estilo', asignadoA: 'Co-Creador G.', complejidad: 60, estado: 'En Progreso', prioridad: 'Media', fechaCreacion: '2024-05-15', progreso: 50,
        subRows: [
            { id: '4-1', tarea: 'Crear variantes para modo oscuro', asignadoA: 'Co-Creador G.', complejidad: 55, estado: 'Completado', prioridad: 'Media', fechaCreacion: '2024-05-16', progreso: 100 },
            { id: '4-2', tarea: 'Añadir tokens para componente Dialog', asignadoA: 'Co-Creador G.', complejidad: 65, estado: 'En Progreso', prioridad: 'Media', fechaCreacion: '2024-05-17', progreso: 30 },
        ],
    },
    { id: '5', tarea: 'Escribir Documentación de la API', asignadoA: 'Humano R.', complejidad: 30, estado: 'N/A', prioridad: 'Baja', fechaCreacion: '2024-05-20', progreso: 0 },
    { id: '6', tarea: 'Configurar CI/CD para despliegue continuo', asignadoA: 'Co-Creador G.', complejidad: 80, estado: 'Completado', prioridad: 'Alta', fechaCreacion: '2024-05-01', progreso: 100 },
    { id: '7', tarea: 'Investigar WebSockets para notificaciones', asignadoA: 'Humano R.', complejidad: 70, estado: 'En Progreso', prioridad: 'Media', fechaCreacion: '2024-05-22', progreso: 60 },
    { id: '8', tarea: 'Testear performance de renderizado de la tabla', asignadoA: 'Co-Creador G.', complejidad: 90, estado: 'En Progreso', prioridad: 'Alta', fechaCreacion: '2024-05-13', progreso: 80 },
    { id: '9', tarea: 'Crear landing page para Sustrato.ai', asignadoA: 'Humano R.', complejidad: 45, estado: 'N/A', prioridad: 'Baja', fechaCreacion: '2024-05-25', progreso: 15 },
    { id: '10', tarea: 'Añadir internacionalización (i18n)', asignadoA: 'Co-Creador G.', complejidad: 85, estado: 'N/A', prioridad: 'Media', fechaCreacion: '2024-06-01', progreso: 0 },
    { id: '11', tarea: 'Implementar sistema de caché con Redis', asignadoA: 'Humano R.', complejidad: 92, estado: 'En Progreso', prioridad: 'Alta', fechaCreacion: '2024-06-02', progreso: 40 },
    { id: '12', tarea: 'Actualizar dependencias de NPM', asignadoA: 'Co-Creador G.', complejidad: 25, estado: 'Completado', prioridad: 'Baja', fechaCreacion: '2024-05-05', progreso: 100 },
    { id: '13', tarea: 'Revisar accesibilidad (WCAG 2.1)', asignadoA: 'Humano R.', complejidad: 68, estado: 'En Progreso', prioridad: 'Media', fechaCreacion: '2024-06-05', progreso: 50 },
    { id: '14', tarea: 'Migrar base de datos a nueva versión', asignadoA: 'Co-Creador G.', complejidad: 98, estado: 'N/A', prioridad: 'Alta', fechaCreacion: '2024-06-10', progreso: 5 },
    { id: '15', tarea: 'Definir la ontología del "Nosotros"', asignadoA: 'Ambos', complejidad: 100, estado: 'En Progreso', prioridad: 'Alta', fechaCreacion: '2024-04-01', progreso: 50 },
];


export default function StandardTableShowroomPage() {
    const [rowStatuses, setRowStatuses] = useState<Record<string, 'success' | 'warning' | 'danger'>>({});

    const columns = useMemo<ColumnDef<Task>[]>(() => [
        { id: 'expander', header: () => null, cell: ({ row }) => row.getCanExpand() ? '' : null, meta: { isSticky: 'left' }, size: 40, },
        { accessorKey: 'tarea', header: 'Tarea', size: 350, },
        { accessorKey: 'asignadoA', header: 'Asignado a', size: 150, },
        { accessorKey: 'prioridad', header: 'Prioridad', cell: ({ getValue }) => { const value = getValue<'Alta' | 'Media' | 'Baja'>(); let colorScheme: 'danger' | 'warning' | 'neutral' = 'neutral'; if (value === 'Alta') colorScheme = 'danger'; if (value === 'Media') colorScheme = 'warning'; return <StandardBadge colorScheme={colorScheme} styleType="subtle" size="sm">{value}</StandardBadge>; }, size: 100, },
        { accessorKey: 'progreso', header: 'Progreso', cell: ({ getValue }) => { const value = getValue<number>(); return ( <div className="w-full bg-neutral-bgShade rounded-full h-2.5"> <div className="bg-primary-pure h-2.5 rounded-full" style={{ width: `${value}%` }}></div> </div> ) }, size: 150, },
        { accessorKey: 'complejidad', header: 'Complejidad', meta: {  align: 'center', cellVariant: (context: CellContext<Task, any>) => context.getValue<number>() > 90 ? 'highlight' : undefined, }, size: 100, },
        { accessorKey: 'estado', header: 'Estado', cell: ({ getValue }) => { const value = getValue<string>(); let colorScheme: 'primary' | 'neutral' | 'success' = 'neutral'; if (value === 'En Progreso') colorScheme = 'primary'; if (value === 'Completado') colorScheme = 'success'; return <StandardBadge colorScheme={colorScheme} styleType="subtle" size="sm">{value}</StandardBadge>; }, size: 150, },
        { accessorKey: 'fechaCreacion', header: 'Fecha de Creación', size: 150, },
        { id: 'acciones', header: 'Acciones', cell: () => <StandardButton size="sm" styleType="ghost">...</StandardButton>, meta: { isSticky: 'right' }, size: 80, }
    ], []);

    const getRowStatus = (row: Task) => {
        return rowStatuses[row.id] || null;
    };
    
    const renderSubComponent = (row: Row<Task>) => (
        <div className="p-4 bg-neutral-bgDark/20">
            <StandardText weight="medium" className="mb-2">Sub-Tareas para: {row.original.tarea}</StandardText>
            <ul className="list-disc pl-5">
                {row.original.subRows?.map(sub => <li key={sub.id} className="text-sm">{sub.tarea}</li>)}
            </ul>
        </div>
    );

    const handleSetStatus = (rowId: string, status: 'success' | 'warning' | 'danger') => {
        setRowStatuses(prev => ({ ...prev, [rowId]: status }));
    };

    return (
        <StandardPageBackground variant="default">
            <div className="p-6">
                <div className="mb-6">
                    <StandardText asElement="h1" weight="bold" size="3xl">Hangar de Pruebas de StandardTable</StandardText>
                    <StandardText color="neutral" colorShade="textShade">Prueba de integración de todas las funcionalidades.</StandardText>
                </div>

                <div className="flex gap-2 mb-4 p-4 border rounded-md bg-background/50">
                    <StandardButton size="sm" colorScheme="success" onClick={() => handleSetStatus('3', 'success')}>Marcar Fila #3 como Éxito</StandardButton>
                    <StandardButton size="sm" colorScheme="warning" onClick={() => handleSetStatus('4', 'warning')}>Marcar Fila #4 como Advertencia</StandardButton>
                    <StandardButton size="sm" colorScheme="danger" onClick={() => handleSetStatus('2', 'danger')}>Marcar Fila #2 como Peligro</StandardButton>
                </div>

                <StandardTable
                    data={tasksData}
                    columns={columns}
                    getRowStatus={getRowStatus}
                    renderSubComponent={renderSubComponent}
                    filterPlaceholder="Buscar por tarea o asignado..."
                    maxTableHeight="calc(100vh - 300px)"
                >
                    {/* ✅ REFACTOR: El Toolbar ya no se llama aquí, está integrado en StandardTable.Table */}
                    <StandardTable.Table />
                </StandardTable>
            </div>
        </StandardPageBackground>
    );
}