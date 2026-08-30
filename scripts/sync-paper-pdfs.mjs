// 📍 scripts/sync-paper-pdfs.mjs
// Script ad-hoc (no productivo): baja los PDFs ES/EN de un paper desde la API
// pública de Zenodo, verifica su md5 contra el que reporta Zenodo, y los sube
// al bucket "paper-images" de Supabase en pdfs/<paper_id>/paper-{es,en}.pdf.
//
// Uso: node scripts/sync-paper-pdfs.mjs <zenodo_record_id> <paper_slug>
// Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = join(__dirname, "..", ".env.local");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] ??= match[2];
  }
}
loadEnvLocal();

const [, , zenodoRecordId, paperSlug] = process.argv;
if (!zenodoRecordId || !paperSlug) {
  console.error("Uso: node scripts/sync-paper-pdfs.mjs <zenodo_record_id> <paper_slug>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Filenames en Zenodo → nombre fijo de destino en Storage. Ajustar si el
// título/idioma del paper hace que el nombre de archivo cambie.
const FILE_MAP = [
  { pattern: /^reversibilidad.*\.pdf$/i, dest: "paper-es.pdf" },
  { pattern: /^reversibility.*\.pdf$/i, dest: "paper-en.pdf" },
];

async function main() {
  const { data: paper, error: paperError } = await supabase
    .from("papers")
    .select("id, slug")
    .eq("slug", paperSlug)
    .single();

  if (paperError || !paper) {
    console.error("[sync-paper-pdfs] Paper no encontrado:", paperError);
    process.exit(1);
  }

  const recordRes = await fetch(`https://zenodo.org/api/records/${zenodoRecordId}`);
  if (!recordRes.ok) {
    console.error("[sync-paper-pdfs] Error consultando Zenodo:", recordRes.status);
    process.exit(1);
  }
  const record = await recordRes.json();

  for (const file of record.files) {
    const mapping = FILE_MAP.find((m) => m.pattern.test(file.key));
    if (!mapping) continue;

    console.log(`[sync-paper-pdfs] Descargando "${file.key}" (${file.size} bytes)...`);
    const fileRes = await fetch(file.links.self);
    if (!fileRes.ok) {
      console.error(`[sync-paper-pdfs] Error descargando ${file.key}:`, fileRes.status);
      continue;
    }
    const buffer = Buffer.from(await fileRes.arrayBuffer());

    const expectedMd5 = file.checksum.replace(/^md5:/, "");
    const actualMd5 = createHash("md5").update(buffer).digest("hex");
    if (actualMd5 !== expectedMd5) {
      console.error(
        `[sync-paper-pdfs] MD5 no coincide para ${file.key}: esperado ${expectedMd5}, obtenido ${actualMd5}. Abortando este archivo.`,
      );
      continue;
    }
    console.log(`[sync-paper-pdfs] MD5 verificado para "${file.key}": ${actualMd5}`);

    const storagePath = `pdfs/${paper.id}/${mapping.dest}`;
    const { error: uploadError } = await supabase.storage
      .from("paper-images")
      .upload(storagePath, buffer, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      console.error(`[sync-paper-pdfs] Error subiendo ${mapping.dest}:`, uploadError);
      continue;
    }
    console.log(`[sync-paper-pdfs] Subido a paper-images/${storagePath}`);

    const publicUrl = `https://sustrato.ai/papers/${paperSlug}/${mapping.dest}`;
    const column = mapping.dest === "paper-en.pdf" ? "pdf_url_en" : "pdf_url";
    const { error: updateError } = await supabase
      .from("papers")
      .update({ [column]: publicUrl })
      .eq("id", paper.id);

    if (updateError) {
      console.error(`[sync-paper-pdfs] Error actualizando ${column}:`, updateError);
    } else {
      console.log(`[sync-paper-pdfs] papers.${column} = ${publicUrl}`);
    }
  }
}

main();
