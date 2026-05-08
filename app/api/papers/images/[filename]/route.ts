// 📍 app/api/papers/images/[filename]/route.ts
// API Route para servir imágenes de papers desde Supabase Storage
// Busca en paper_images por storage_path o original_filename y sirve desde el bucket "paper-images"

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/auth/session";

const CACHE_MAX_AGE = 86400; // 24 horas
const CACHE_STALE_WHILE_REVALIDATE = 604800; // 7 días

export async function GET(
	request: NextRequest,
	{ params }: { params: { filename: string } },
) {
	try {
		const { filename } = await params;
		console.log(`[PaperImageAPI] Requesting image: ${filename}`);

		const supabase = await createServerSupabaseClient();

		const { data: imageRecord, error: lookupError } = await supabase
			.from("paper_images")
			.select("storage_path, mime_type, original_filename")
			.or(
				`storage_path.ilike.%${filename}%,original_filename.eq.${filename}`,
			)
			.limit(1)
			.maybeSingle();

		if (lookupError) {
			console.error("[PaperImageAPI] Lookup error:", lookupError);
		}

		if (!imageRecord?.storage_path) {
			console.log(`[PaperImageAPI] Image not found: ${filename}`);
			return new NextResponse("Image not found", { status: 404 });
		}

		const { data: fileData, error: downloadError } = await supabase.storage
			.from("paper-images")
			.download(imageRecord.storage_path);

		if (downloadError || !fileData) {
			console.error(
				`[PaperImageAPI] Download error for ${imageRecord.storage_path}:`,
				downloadError,
			);
			return new NextResponse("Image not found in storage", { status: 404 });
		}

		const arrayBuffer = await fileData.arrayBuffer();
		const contentType = imageRecord.mime_type || "image/png";

		return new NextResponse(arrayBuffer, {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Cache-Control": `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
				"Content-Disposition": `inline; filename="${filename}"`,
			},
		});
	} catch (error) {
		console.error("[PaperImageAPI] Error:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
