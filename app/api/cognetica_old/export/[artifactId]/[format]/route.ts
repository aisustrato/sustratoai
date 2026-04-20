// 📍 app/api/cognetica_old/export/[artifactId]/[format]/route.ts
// API Route para descarga de artefactos en múltiples formatos (MD, YAML, JSON)

import { NextRequest, NextResponse } from 'next/server';
import { 
    exportArtifactToMarkdownWithHash, 
    exportArtifactToYAML, 
    exportArtifactToJSON,
    persistArtifactExport 
} from '@/lib/actions/cognetica-old-export-actions';
import { createServerClient } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: { artifactId: string; format: string } }
) {
    try {
        const { artifactId, format } = params;

        // Validar formato
        if (!['md', 'yaml', 'json'].includes(format)) {
            return NextResponse.json(
                { error: 'Formato no válido. Use: md, yaml, json' },
                { status: 400 }
            );
        }

        // Verificar autenticación y permisos
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Verificar que el usuario tiene acceso al artefacto
        const { data: artifact, error: artifactError } = await supabase
            .from('cog_artifacts')
            .select('id, title, project_id, projects!inner(id)')
            .eq('id', artifactId)
            .single();

        if (artifactError || !artifact) {
            return NextResponse.json(
                { error: 'Artefacto no encontrado' },
                { status: 404 }
            );
        }

        // Verificar membresía del proyecto
        const { data: membership } = await supabase
            .from('project_members')
            .select('id')
            .eq('project_id', artifact.project_id)
            .eq('user_id', user.id)
            .single();

        if (!membership) {
            return NextResponse.json(
                { error: 'No tienes permisos para acceder a este artefacto' },
                { status: 403 }
            );
        }

        // Persistir export (calcula hash y guarda en DB)
        await persistArtifactExport(artifactId);

        // Generar contenido según formato
        let content: string;
        let mimeType: string;
        let filename: string;
        const safeTitle = (artifact.title || 'artefacto').replace(/[^a-z0-9]/gi, '_').toLowerCase();

        switch (format) {
            case 'md':
                content = await exportArtifactToMarkdownWithHash(artifactId);
                mimeType = 'text/markdown';
                filename = `${safeTitle}.md`;
                break;

            case 'yaml':
                content = await exportArtifactToYAML(artifactId);
                mimeType = 'application/x-yaml';
                filename = `${safeTitle}.yaml`;
                break;

            case 'json':
                const { json } = await exportArtifactToJSON(artifactId);
                content = json;
                mimeType = 'application/json';
                filename = `${safeTitle}.json`;
                break;

            default:
                return NextResponse.json(
                    { error: 'Formato no implementado' },
                    { status: 500 }
                );
        }

        // Retornar archivo para descarga
        return new NextResponse(content, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });

    } catch (error) {
        console.error('❌ [Export API] Error:', error);
        return NextResponse.json(
            { error: 'Error generando exportación', details: String(error) },
            { status: 500 }
        );
    }
}
