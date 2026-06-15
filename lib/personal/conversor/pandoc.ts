// 📍 lib/personal/conversor/pandoc.ts
//
// Wrapper fino sobre el binario `pandoc` para las conversiones del
// conversor personal (app/personal/utilidades/conversor). Asume que
// pandoc está en el PATH del sistema; si no, falla con error explícito.

import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REFERENCE_DOCX = join(
	process.cwd(),
	"lib/personal/conversor/templates/academico-neutro.docx",
);

interface PandocResult {
	buffer: Buffer;
	stderr: string;
}

/**
 * Ejecuta pandoc leyendo de un archivo y escribiendo a otro. Captura
 * stderr para diagnóstico — pandoc loguea warnings ahí que conviene
 * propagar al cliente cuando falla algo (refs faltantes, math sin
 * cierre, etc.).
 */
function runPandoc(args: string[]): Promise<{ stderr: string }> {
	return new Promise((resolve, reject) => {
		const proc = spawn("pandoc", args, { stdio: ["ignore", "ignore", "pipe"] });
		let stderr = "";
		proc.stderr.on("data", (chunk) => {
			stderr += chunk.toString();
		});
		proc.on("error", (err) => {
			reject(
				new Error(
					`[conversor:pandoc] No se pudo ejecutar pandoc — ¿está instalado en el PATH? (${err.message})`,
				),
			);
		});
		proc.on("close", (code) => {
			if (code === 0) resolve({ stderr });
			else
				reject(
					new Error(
						`[conversor:pandoc] pandoc salió con código ${code}. stderr: ${stderr || "(vacío)"}`,
					),
				);
		});
	});
}

/**
 * Convierte un Markdown (con LaTeX math y YAML frontmatter opcional) a
 * DOCX usando el reference.docx del proyecto. El frontmatter `title`,
 * `author`, `date`, `abstract` se vuelca como portada automática.
 */
export async function mdToDocx(markdown: string): Promise<PandocResult> {
	const dir = await mkdtemp(join(tmpdir(), "conversor-md-docx-"));
	const inPath = join(dir, "in.md");
	const outPath = join(dir, "out.docx");
	try {
		await writeFile(inPath, markdown, "utf8");
		const { stderr } = await runPandoc([
			"-f",
			"markdown",
			"-t",
			"docx",
			`--reference-doc=${REFERENCE_DOCX}`,
			"--standalone",
			"-o",
			outPath,
			inPath,
		]);
		const buffer = await readFile(outPath);
		return { buffer, stderr };
	} finally {
		void rm(dir, { recursive: true, force: true });
	}
}

/**
 * Convierte un DOCX (Buffer) a Markdown. Pandoc emite GitHub-flavored
 * markdown por default con math en `$...$`, listas correctas y
 * encabezados ATX. Imágenes embebidas quedan como referencias
 * (no se extraen aquí — caso de uso fuera de scope inicial).
 */
export async function docxToMd(docx: Buffer): Promise<PandocResult> {
	const dir = await mkdtemp(join(tmpdir(), "conversor-docx-md-"));
	const inPath = join(dir, "in.docx");
	const outPath = join(dir, "out.md");
	try {
		await writeFile(inPath, docx);
		const { stderr } = await runPandoc([
			"-f",
			"docx",
			"-t",
			"markdown",
			"--wrap=preserve",
			"-o",
			outPath,
			inPath,
		]);
		const buffer = await readFile(outPath);
		return { buffer, stderr };
	} finally {
		void rm(dir, { recursive: true, force: true });
	}
}
