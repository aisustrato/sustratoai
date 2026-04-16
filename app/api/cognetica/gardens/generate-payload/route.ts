// 📍 app/api/cognetica/gardens/generate-payload/route.ts
// 🎯 PROPÓSITO: API para generar payload de un jardín según versión

import { NextRequest, NextResponse } from 'next/server';
import { generateGardenPayload, type GardenPayloadVersion } from '@/lib/actions/cognetica-gardens-minotauro';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { gardenId, version } = body as { 
            gardenId: string; 
            version: GardenPayloadVersion 
        };

        if (!gardenId) {
            return NextResponse.json(
                { success: false, error: 'gardenId requerido' },
                { status: 400 }
            );
        }

        if (!version || !['ligera', 'estandar', 'completa'].includes(version)) {
            return NextResponse.json(
                { success: false, error: 'version inválida' },
                { status: 400 }
            );
        }

        const result = await generateGardenPayload(gardenId, version);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('❌ Error en /api/cognetica/gardens/generate-payload:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
