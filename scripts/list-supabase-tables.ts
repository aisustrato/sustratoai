// 📍 scripts/list-supabase-tables.ts
// Script para listar todas las tablas de la base de datos Supabase

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vgnteswwvallupuanfiz.supabase.co";
const supabaseServiceKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnbnRlc3d3dmFsbHVwdWFuZml6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI0Mjk4OSwiZXhwIjoyMDc5ODE4OTg5fQ.ircXGN1PplrPwabA6ouygJ0vSJOOhLZg4Xxn8hKOZ_Q";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listTables() {
	try {
		// Consultar information_schema para obtener todas las tablas
		const { data, error } = await supabase.rpc("get_tables");

		if (error) {
			console.error("Error al listar tablas:", error);

			// Alternativa: consultar information_schema directamente
			const { data: tables, error: tablesError } = await supabase
				.from("information_schema.tables")
				.select("table_name, table_schema")
				.eq("table_schema", "public")
				.order("table_name");

			if (tablesError) {
				console.error("Error en consulta alternativa:", tablesError);
				return;
			}

			console.log("📊 Tablas en schema public:");
			console.log("═".repeat(50));
			tables?.forEach((table: any, index: number) => {
				console.log(`${index + 1}. ${table.table_name}`);
			});
			return;
		}

		console.log("📊 Tablas de la base de datos:");
		console.log("═".repeat(50));
		data?.forEach((table: any, index: number) => {
			console.log(`${index + 1}. ${table.table_name}`);
		});
	} catch (error) {
		console.error("Error inesperado:", error);
	}
}

listTables();
