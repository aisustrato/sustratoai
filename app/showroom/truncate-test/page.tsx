"use client";

import React, { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardTable } from "@/components/ui/StandardTable";
import { StandardText } from "@/components/ui/StandardText";

const testData = [
    {
        id: 1,
        description: "Este es un texto corto. No debería truncarse.",
    },
    {
        id: 2,
        description: "Este es un texto un poco más largo, pero que probablemente todavía quepa en dos líneas dentro de una celda de 400px de ancho.",
    },
    {
        id: 3,
        description: "Ahora estamos entrando en territorio de texto realmente largo. Este párrafo está diseñado específicamente para ser tan extenso que excederá con toda seguridad el límite de dos líneas establecido por defecto. Debería aparecer truncado visualmente.",
    },
    {
        id: 4,
        description: "Aquí tenemos otro ejemplo de un párrafo deliberadamente largo para confirmar que el comportamiento no es una casualidad. La lógica ahora depende de la bandera 'isTruncatable', por lo que este texto también debe aparecer truncado.",
    },
];

type TestData = typeof testData[0];

export default function TruncateShowroomPage() {

    const columns = useMemo<ColumnDef<TestData>[]>(() => [
        {
            accessorKey: 'id',
            header: 'ID',
            size: 50,
        },
        {
            accessorKey: 'description',
            header: 'Descripción Truncada',
            size: 400,
            cell: (info) => <StandardText size="sm">{info.getValue<string>()}</StandardText>,
            // --- ✅ EL CONTRATO EXPLÍCITO EN ACCIÓN ---
            meta: {
                isTruncatable: true,
            },
        },
    ], []);

    return (
        <StandardPageBackground variant="default">
            <div className="p-6">
                <div className="mb-6">
                    <StandardText asElement="h1" weight="bold" size="3xl">
                        Showroom de Prueba: Truncamiento y Tooltip
                    </StandardText>
                    <StandardText color="neutral" colorShade="textShade" className="mt-2">
                        Esta página prueba la funcionalidad de truncamiento de `StandardTable` en un entorno estático y controlado.
                    </StandardText>
                </div>
                
                <StandardTable
                    data={testData}
                    columns={columns}
                    enableTruncation={true}
                >
                    <StandardTable.Table />
                </StandardTable>
            </div>
        </StandardPageBackground>
    );
}