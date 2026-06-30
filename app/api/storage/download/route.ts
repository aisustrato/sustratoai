//. 📍 app/api/storage/download/route.ts
/**
 * Endpoint para descargar archivos desde Supabase Storage.
 * Recibe el path del archivo como query param y redirige a una URL
 * firmada de acceso temporal.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const path = searchParams.get("path");
	const bucketParam = searchParams.get("bucket");

	if (!path) {
		return NextResponse.json(
			{ error: "Parámetro 'path' requerido" },
			{ status: 400 },
		);
	}

	const supabase = await createSupabaseServiceRoleClient();

	// Bucket por defecto. Si el path incluye el bucket como primer segmento,
	// lo usamos; si no, usamos el bucket por defecto.
	const DEFAULT_BUCKET = "cognetica-files";
	let bucket = bucketParam || DEFAULT_BUCKET;
	let filePath = path;

	// Si el path empieza con un segmento que coincide con un bucket conocido,
	// extraemos bucket + path. Si no, usamos el bucket por defecto.
	const parts = path.split("/");
	if (!bucketParam && parts.length > 1) {
		// El path probablemente es cognetica/project/artefacto/filename
		// El bucket real es "cognetica-files", no "cognetica"
		// Así que NO extraemos bucket del path; usamos el default
		bucket = DEFAULT_BUCKET;
		filePath = path;
	}

	if (!filePath) {
		return NextResponse.json(
			{ error: "Path inválido" },
			{ status: 400 },
		);
	}

	// Generar URL firmada para descarga (válida por 5 minutos)
	const { data, error } = await supabase.storage
		.from(bucket)
		.createSignedUrl(filePath, 300); // 300 segundos = 5 minutos

	if (error || !data?.signedUrl) {
		console.error("[storage/download] Error generando URL firmada:", error);
		return NextResponse.json(
			{ error: "No se pudo generar enlace de descarga" },
			{ status: 500 },
		);
	}

	// Redirigir a la URL firmada
	return NextResponse.redirect(data.signedUrl);
}
