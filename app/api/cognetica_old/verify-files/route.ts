// 📍 app/api/cognetica_old/verify-files/route.ts
// Verificación física "paranoica" de consistencia entre MD, JSON y YAML

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import yaml from "js-yaml";

interface FileVerification {
	filename: string;
	hash: string | null;
	semillas_count: number | null;
	pensadores_count: number | null;
	disciplinas_count: number | null;
	transcripcion_length: number | null;
	error: string | null;
}

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();

		const mdFile = formData.get("md") as File | null;
		const jsonFile = formData.get("json") as File | null;
		const yamlFile = formData.get("yaml") as File | null;

		if (!mdFile || !jsonFile || !yamlFile) {
			return NextResponse.json(
				{ error: "Se requieren los 3 archivos: md, json, yaml" },
				{ status: 400 },
			);
		}

		// Leer contenido de archivos
		const mdContent = await mdFile.text();
		const jsonContent = await jsonFile.text();
		const yamlContent = await yamlFile.text();

		const results: FileVerification[] = [];
		const hashes: string[] = [];

		// 1. Verificar JSON
		try {
			const jsonData = JSON.parse(jsonContent);
			const hash = jsonData._metadata_exportacion?.hash_contenido || null;
			const contenido = jsonData.contenido || jsonData;

			results.push({
				filename: jsonFile.name,
				hash,
				semillas_count: contenido.semillas_fractales?.length || 0,
				pensadores_count: contenido.referencias?.length || 0,
				disciplinas_count: contenido.disciplinas?.length || 0,
				transcripcion_length:
					contenido.transcripcion?.texto_completo?.length || 0,
				error: null,
			});

			if (hash) hashes.push(hash);
		} catch (error) {
			results.push({
				filename: jsonFile.name,
				hash: null,
				semillas_count: null,
				pensadores_count: null,
				disciplinas_count: null,
				transcripcion_length: null,
				error: `Error parseando JSON: ${String(error)}`,
			});
		}

		// 2. Verificar YAML
		try {
			const yamlData = yaml.load(yamlContent) as Record<string, unknown>;
			const hash =
				((yamlData._metadata_exportacion as Record<string, unknown>)
					?.hash_contenido as string) || null;

			results.push({
				filename: yamlFile.name,
				hash,
				semillas_count: (yamlData.semillas_fractales as unknown[])?.length || 0,
				pensadores_count: (yamlData.referencias as unknown[])?.length || 0,
				disciplinas_count: (yamlData.disciplinas as unknown[])?.length || 0,
				transcripcion_length:
					(
						(yamlData.transcripcion as Record<string, unknown>)
							?.texto_completo as string
					)?.length || 0,
				error: null,
			});

			if (hash) hashes.push(hash);
		} catch (error) {
			results.push({
				filename: yamlFile.name,
				hash: null,
				semillas_count: null,
				pensadores_count: null,
				disciplinas_count: null,
				transcripcion_length: null,
				error: `Error parseando YAML: ${String(error)}`,
			});
		}

		// 3. Verificar MD (extraer hash del frontmatter)
		try {
			const frontmatterMatch = mdContent.match(/^---\n([\s\S]*?)\n---/);
			let hash: string | null = null;

			if (frontmatterMatch) {
				const frontmatter = yaml.load(frontmatterMatch[1]) as Record<
					string,
					unknown
				>;
				hash = (frontmatter.hash_contenido as string) || null;
			}

			// Contar elementos en el MD (extrayendo de las tablas)
			let semillasCount = 0;
			let pensadoresCount = 0;
			let disciplinasCount = 0;

			// Contar semillas (buscar tabla después del header)
			const semillasSection = mdContent.match(
				/# 🌱 Semillas Fractales[\s\S]*?(?=\n# |$)/,
			);
			if (semillasSection) {
				const tableRows = semillasSection[0].match(/^\|\s*\d+\s*\|/gm);
				semillasCount = tableRows ? tableRows.length : 0;
			}

			// Contar pensadores (buscar tabla después del header "# 👤 Referencias Identificadas")
			const pensadoresSection = mdContent.match(
				/# 👤 Referencias Identificadas[\s\S]*?(?=\n# |$)/,
			);
			if (pensadoresSection) {
				// Buscar filas de tabla que NO sean el header ni el separador
				const tableRows = pensadoresSection[0].match(
					/^\|(?!\s*-+\s*\|)(?!\s*Nombre\s*\|)[^\n]+\|/gm,
				);
				pensadoresCount = tableRows ? tableRows.length : 0;
			}

			// Contar disciplinas (buscar tabla después del header "# 🔬 Disciplinas")
			const disciplinasSection = mdContent.match(
				/# 🔬 Disciplinas[\s\S]*?(?=\n# |$)/,
			);
			if (disciplinasSection) {
				// Buscar filas que empiezan con | número | (excluyendo header y separador)
				const allRows = disciplinasSection[0].match(/^\|[^\n]+\|/gm);
				// Filtrar: excluir header "| # | Disciplina |" y separador "|---|---|"
				const dataRows = allRows?.filter(
					(row) =>
						!row.match(/^\|\s*#\s*\|/) && // No el header
						!row.match(/^\|\s*-+\s*\|/), // No el separador
				);
				disciplinasCount = dataRows ? dataRows.length : 0;
			}

			results.push({
				filename: mdFile.name,
				hash,
				semillas_count: semillasCount,
				pensadores_count: pensadoresCount,
				disciplinas_count: disciplinasCount,
				transcripcion_length: mdContent.length,
				error: null,
			});

			if (hash) hashes.push(hash);
		} catch (error) {
			results.push({
				filename: mdFile.name,
				hash: null,
				semillas_count: null,
				pensadores_count: null,
				disciplinas_count: null,
				transcripcion_length: null,
				error: `Error parseando MD: ${String(error)}`,
			});
		}

		// 4. Verificar consistencia de hashes
		const hashesUnicos = [...new Set(hashes)];
		const hashesConsistentes = hashesUnicos.length === 1 && hashes.length === 3;

		// 5. Verificar consistencia de conteos (JSON vs YAML)
		const jsonResult = results.find((r) => r.filename.endsWith(".json"));
		const yamlResult = results.find(
			(r) => r.filename.endsWith(".yaml") || r.filename.endsWith(".yml"),
		);

		let conteosConsistentes = false;
		if (
			jsonResult &&
			yamlResult &&
			jsonResult.semillas_count !== null &&
			yamlResult.semillas_count !== null
		) {
			conteosConsistentes =
				jsonResult.semillas_count === yamlResult.semillas_count &&
				jsonResult.pensadores_count === yamlResult.pensadores_count &&
				jsonResult.disciplinas_count === yamlResult.disciplinas_count;
		}

		// 6. Resultado final
		const todosValidos = results.every((r) => r.error === null);
		const verificacionCompleta =
			hashesConsistentes && conteosConsistentes && todosValidos;

		return NextResponse.json({
			verificacion_exitosa: verificacionCompleta,
			hashes_consistentes: hashesConsistentes,
			conteos_consistentes: conteosConsistentes,
			hash_unico: hashesUnicos.length === 1 ? hashesUnicos[0] : null,
			archivos: results,
			resumen: {
				total_archivos: 3,
				archivos_validos: results.filter((r) => r.error === null).length,
				archivos_con_error: results.filter((r) => r.error !== null).length,
			},
			mensaje:
				verificacionCompleta ?
					"✅ Verificación exhaustiva exitosa: Los 3 archivos son consistentes"
				:	"⚠️ Inconsistencias detectadas entre los archivos",
		});
	} catch (error) {
		console.error("❌ [Verify Files] Error:", error);
		return NextResponse.json(
			{ error: "Error verificando archivos", details: String(error) },
			{ status: 500 },
		);
	}
}
