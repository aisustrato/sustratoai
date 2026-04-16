// 📍 app/api/cognetica/gardens/estimate-tokens/route.ts
// 🎯 PROPÓSITO: API para estimar tokens de jardines según versión

import { NextRequest, NextResponse } from 'next/server';
import { generateMultipleGardenPayloads, type GardenPayloadVersion } from '@/lib/actions/cognetica-gardens-minotauro';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { gardenIds, version } = body as { 
            gardenIds: string[]; 
            version: GardenPayloadVersion 
        };

        if (!gardenIds || !Array.isArray(gardenIds) || gardenIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'gardenIds requerido' },
                { status: 400 }
            );
        }

        if (!version || !['ligera', 'estandar', 'completa'].includes(version)) {
            return NextResponse.json(
                { success: false, error: 'version inválida' },
                { status: 400 }
            );
        }

        const result = await generateMultipleGardenPayloads(gardenIds, version);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            stats: result.stats
        });

    } catch (error) {
        console.error('❌ Error en /api/cognetica/gardens/estimate-tokens:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
