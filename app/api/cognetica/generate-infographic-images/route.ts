// 📍 app/api/cognetica/generate-infographic-images/route.ts
// 🎯 PROPÓSITO: Generar imágenes a partir de prompts de infografías usando SeaDream 4.5

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/server";
import { runSeedreamGeneration } from "@/lib/actions/replicate-actions";

export async function POST(req: NextRequest) {
	try {
		const supabase = await createSupabaseServerClient();

		// Verificar autenticación
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			return NextResponse.json({ error: "No autenticado" }, { status: 401 });
		}

		const { artifactId, prompts } = await req.json();

		if (!artifactId || !prompts || !Array.isArray(prompts)) {
			return NextResponse.json(
				{ error: "artifactId y prompts (array) son requeridos" },
				{ status: 400 },
			);
		}

		console.log(
			`🎨 [GenerateInfographicImages] Iniciando generación para artefacto ${artifactId}`,
		);
		console.log(
			`🎨 [GenerateInfographicImages] Total prompts: ${prompts.length}`,
		);

		// Verificar que el artefacto existe y obtener su project_id
		const { data: artifact, error: artifactError } = await supabase
			.from("cog_artifacts")
			.select("id, project_id")
			.eq("id", artifactId)
			.single();

		if (artifactError || !artifact) {
			console.error("❌ Error obteniendo artefacto:", artifactError);
			return NextResponse.json(
				{ error: "Artefacto no encontrado" },
				{ status: 404 },
			);
		}

		// Verificar membresía del proyecto (patrón estándar de la aplicación)
		const { data: membership } = await supabase
			.from("project_members")
			.select("id")
			.eq("project_id", artifact.project_id)
			.eq("user_id", user.id)
			.single();

		if (!membership) {
			console.error("❌ Usuario no es miembro del proyecto:", {
				userId: user.id,
				projectId: artifact.project_id,
			});
			return NextResponse.json(
				{ error: "No tienes permisos para acceder a este artefacto" },
				{ status: 403 },
			);
		}

		console.log(
			`✅ [GenerateInfographicImages] Usuario autorizado para proyecto ${artifact.project_id}`,
		);

		// Obtener o crear un seed para asociar las imágenes
		let seedId: string;
		const { data: existingSeed } = await supabase
			.from("cog_fractal_seeds")
			.select("id")
			.eq("artifact_id", artifactId)
			.limit(1)
			.single();

		if (existingSeed) {
			seedId = existingSeed.id;
			console.log(`✅ Usando seed existente: ${seedId}`);
		} else {
			// Crear un seed temporal para las infografías
			const { data: newSeed, error: seedError } = await supabase
				.from("cog_fractal_seeds")
				.insert({
					artifact_id: artifactId,
					project_id: artifact.project_id,
					content: "Seed para imágenes de infografías",
					context: "Generación automática de imágenes conceptuales",
					properties: { type: "infographic_images" },
				})
				.select("id")
				.single();

			if (seedError || !newSeed) {
				console.error("❌ Error creando seed:", seedError);
				return NextResponse.json(
					{ error: "Error preparando generación de imágenes" },
					{ status: 500 },
				);
			}
			seedId = newSeed.id;
			console.log(`✅ Seed creado: ${seedId}`);
		}

		const results = [];
		const errors = [];

		// Generar imágenes para cada prompt
		for (let i = 0; i < prompts.length; i++) {
			const promptData = prompts[i];
			const { style, prompt } = promptData;

			console.log(
				`🎨 [GenerateInfographicImages] Generando imagen ${i + 1}/${prompts.length}`,
			);
			console.log(`   Style: ${style}`);
			console.log(`   Prompt: ${prompt.substring(0, 100)}...`);

			try {
				// Generar imagen con SeaDream 4.5
				const imageResult = await runSeedreamGeneration(prompt, "16:9", "2k");

				if (!imageResult.success || !imageResult.data) {
					console.error(
						`❌ Error generando imagen ${i + 1}:`,
						imageResult.error,
					);
					errors.push({
						index: i,
						style,
						error: imageResult.error || "Error generando imagen",
					});
					continue;
				}

				const replicateUrl = imageResult.data;
				console.log(`✅ Imagen ${i + 1} generada en Replicate:`, replicateUrl);

				// Descargar imagen de Replicate
				console.log(`📥 Descargando imagen ${i + 1} de Replicate...`);
				const imageResponse = await fetch(replicateUrl);
				if (!imageResponse.ok) {
					console.error(
						`❌ Error descargando imagen ${i + 1}:`,
						imageResponse.statusText,
					);
					errors.push({
						index: i,
						style,
						error: "Error descargando imagen de Replicate",
					});
					continue;
				}

				const imageBuffer = await imageResponse.arrayBuffer();
				const imageBlob = new Blob([imageBuffer], { type: "image/png" });
				console.log(`✅ Imagen ${i + 1} descargada (${imageBlob.size} bytes)`);

				// Generar nombre único para la imagen
				const timestamp = Date.now();
				const imageName = `${timestamp}-${i}.png`;
				const storagePath = `infographics/${artifactId}/${imageName}`;

				// Subir a Supabase Storage (bucket cognetica-files)
				console.log(
					`📤 Subiendo imagen ${i + 1} a Supabase Storage (cognetica-files)...`,
				);
				const { data: uploadData, error: uploadError } = await supabase.storage
					.from("cognetica-files")
					.upload(storagePath, imageBlob, {
						contentType: "image/png",
						upsert: false,
					});

				if (uploadError || !uploadData) {
					console.error(
						`❌ Error subiendo imagen ${i + 1} a Storage:`,
						uploadError,
					);
					errors.push({
						index: i,
						style,
						error: "Error subiendo imagen a Supabase Storage",
					});
					continue;
				}

				// Obtener URL pública
				const { data: publicUrlData } = supabase.storage
					.from("cognetica-files")
					.getPublicUrl(storagePath);

				const imageUrl = publicUrlData.publicUrl;
				console.log(`✅ Imagen ${i + 1} subida a Storage:`, imageUrl);

				// Guardar en cog_image_prompts
				const { data: promptRecord, error: promptError } = await supabase
					.from("cog_image_prompts")
					.insert({
						artifact_id: artifactId,
						seed_id: seedId,
						prompt_text: prompt,
						style_modifiers: [style],
						generated_by: "seedream-4.5",
						model_version: "sdxl-lightning-4step",
						status: "generated",
					})
					.select("id")
					.single();

				if (promptError || !promptRecord) {
					console.error(`❌ Error guardando prompt ${i + 1}:`, promptError);
					errors.push({
						index: i,
						style,
						error: "Error guardando prompt en BD",
					});
					continue;
				}

				// Guardar en cog_generated_images
				const { data: imageRecord, error: imageError } = await supabase
					.from("cog_generated_images")
					.insert({
						prompt_id: promptRecord.id,
						storage_url: imageUrl,
						storage_path: storagePath,
						provider: "replicate",
						model_name: "sdxl-lightning-4step",
						generation_params: {
							aspect_ratio: "16:9",
							resolution: "2k",
							num_inference_steps: 4,
							guidance_scale: 3.5,
						},
						width: 2048,
						height: 1152,
						mime_type: "image/png",
						status: "generated",
					})
					.select("id, storage_url")
					.single();

				if (imageError || !imageRecord) {
					console.error(`❌ Error guardando imagen ${i + 1}:`, imageError);
					errors.push({
						index: i,
						style,
						error: "Error guardando imagen en BD",
					});
					continue;
				}

				results.push({
					index: i,
					style,
					promptId: promptRecord.id,
					imageId: imageRecord.id,
					imageUrl: imageRecord.storage_url,
				});

				console.log(`✅ Imagen ${i + 1} guardada exitosamente`);
			} catch (error: any) {
				console.error(`❌ Error procesando prompt ${i + 1}:`, error);
				errors.push({
					index: i,
					style,
					error: error.message || "Error desconocido",
				});
			}
		}

		console.log(`🎨 [GenerateInfographicImages] Proceso completado`);
		console.log(`   Exitosas: ${results.length}/${prompts.length}`);
		console.log(`   Errores: ${errors.length}/${prompts.length}`);

		return NextResponse.json({
			success: true,
			data: {
				artifactId,
				totalPrompts: prompts.length,
				successCount: results.length,
				errorCount: errors.length,
				results,
				errors,
			},
		});
	} catch (error: any) {
		console.error("❌ [GenerateInfographicImages] Error:", error);
		return NextResponse.json(
			{ error: error.message || "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
