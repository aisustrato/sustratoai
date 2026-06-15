// 📍 lib/personal/conversor/libreoffice.ts
//
// Wrapper sobre `soffice --headless` para conversión DOCX → PDF.
// LibreOffice se instala vía `brew install --cask libreoffice` y
// coloca soffice en `/Applications/LibreOffice.app/Contents/MacOS/soffice`.
// Intentamos primero el PATH, después la ruta canónica del .app.

import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CANDIDATE_PATHS = [
	"soffice", // PATH del sistema (si el usuario hizo `brew install libreoffice` formula)
	"/Applications/LibreOffice.app/Contents/MacOS/soffice", // ruta del cask
	`${process.env.HOME}/Applications/LibreOffice.app/Contents/MacOS/soffice`, // cask user-local
];

async function findSoffice(): Promise<string> {
	for (const candidate of CANDIDATE_PATHS) {
		if (candidate === "soffice") {
			// Asumimos que si está en el PATH `spawn("soffice")` lo resuelve.
			// Si no, el callsite cae al siguiente candidato.
			try {
				await new Promise<void>((resolve, reject) => {
					const proc = spawn("soffice", ["--version"], { stdio: "ignore" });
					proc.on("error", reject);
					proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error("non-zero exit"))));
				});
				return "soffice";
			} catch {
				continue;
			}
		}
		try {
			await access(candidate);
			return candidate;
		} catch {
			continue;
		}
	}
	throw new Error(
		"[conversor:libreoffice] soffice no encontrado. " +
			"Instalá LibreOffice con `brew install --cask libreoffice` " +
			"o asegurate que /Applications/LibreOffice.app exista.",
	);
}

/**
 * Convierte un DOCX (Buffer) a PDF. LibreOffice headless escribe el
 * PDF al `--outdir` que le pasamos; leemos el archivo resultado y
 * limpiamos el tmpdir.
 */
export async function docxToPdf(docx: Buffer): Promise<{ buffer: Buffer; stderr: string }> {
	const soffice = await findSoffice();
	const dir = await mkdtemp(join(tmpdir(), "conversor-docx-pdf-"));
	const inPath = join(dir, "in.docx");
	const outPath = join(dir, "in.pdf"); // soffice usa basename del input

	try {
		await writeFile(inPath, docx);
		const stderr = await new Promise<string>((resolve, reject) => {
			const proc = spawn(
				soffice,
				[
					"--headless",
					"--convert-to",
					"pdf",
					"--outdir",
					dir,
					inPath,
				],
				{ stdio: ["ignore", "pipe", "pipe"] },
			);
			let stderrBuf = "";
			proc.stderr.on("data", (chunk) => {
				stderrBuf += chunk.toString();
			});
			proc.on("error", (err) => {
				reject(new Error(`[conversor:libreoffice] ${err.message}`));
			});
			proc.on("close", (code) => {
				if (code === 0) resolve(stderrBuf);
				else
					reject(
						new Error(
							`[conversor:libreoffice] soffice salió con código ${code}. stderr: ${stderrBuf || "(vacío)"}`,
						),
					);
			});
		});
		const buffer = await readFile(outPath);
		return { buffer, stderr };
	} finally {
		void rm(dir, { recursive: true, force: true });
	}
}
