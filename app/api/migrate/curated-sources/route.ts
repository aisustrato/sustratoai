// Endpoint temporal para ejecutar migración de curated_sources
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
	try {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
		const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

		const supabase = createClient(supabaseUrl, supabaseServiceKey);

		// Ejecutar migración paso por paso
		const steps = [
			// 1. Eliminar constraint antigua
			`ALTER TABLE minotauro_curated_sources DROP CONSTRAINT IF EXISTS minotauro_curated_sources_paragraph_id_fkey;`,

			// 2. Renombrar columna
			`ALTER TABLE minotauro_curated_sources RENAME COLUMN paragraph_id TO galaxy_id;`,

			// 3. Agregar nueva FK
			`ALTER TABLE minotauro_curated_sources ADD CONSTRAINT minotauro_curated_sources_galaxy_id_fkey FOREIGN KEY (galaxy_id) REFERENCES minotauro_galaxies(id) ON DELETE CASCADE;`,

			// 4. Actualizar índice
			`DROP INDEX IF EXISTS idx_minotauro_sources_paragraph;`,
			`CREATE INDEX idx_minotauro_sources_galaxy ON minotauro_curated_sources(galaxy_id);`,

			// 5. Actualizar políticas RLS
			`DROP POLICY IF EXISTS "Users can view sources of their paragraphs" ON minotauro_curated_sources;`,
			`DROP POLICY IF EXISTS "Users can manage sources of their paragraphs" ON minotauro_curated_sources;`,

			`CREATE POLICY "Users can view sources of their galaxies" ON minotauro_curated_sources FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM minotauro_galaxies g
          JOIN minotauro_universes u ON g.universe_id = u.id
          JOIN project_members pm ON u.project_id = pm.project_id
          WHERE g.id = galaxy_id AND pm.user_id = auth.uid()
        )
      );`,

			`CREATE POLICY "Users can manage sources of their galaxies" ON minotauro_curated_sources FOR ALL USING (
        EXISTS (
          SELECT 1 FROM minotauro_galaxies g
          JOIN minotauro_universes u ON g.universe_id = u.id
          JOIN project_members pm ON u.project_id = pm.project_id
          WHERE g.id = galaxy_id AND pm.user_id = auth.uid()
        )
      );`,
		];

		const results = [];
		for (const sql of steps) {
			console.log("Ejecutando:", sql.substring(0, 100) + "...");
			const { error } = await supabase.rpc("exec_sql", { sql });
			if (error) {
				console.error("Error:", error);
				results.push({ sql: sql.substring(0, 100), error: error.message });
			} else {
				results.push({ sql: sql.substring(0, 100), success: true });
			}
		}

		return NextResponse.json({
			success: true,
			message: "Migración completada",
			results,
		});
	} catch (error: any) {
		console.error("Error en migración:", error);
		return NextResponse.json(
			{
				success: false,
				error: error.message,
			},
			{ status: 500 },
		);
	}
}
