// 📍 scripts/list-supabase-tables.ts
// Script para listar todas las tablas de la base de datos Supabase.
//
// La service_role key se lee del entorno (`.env.local` o shell). NUNCA
// hardcodear acá — antes había un JWT literal que terminó leakado al
// repo. Después de rotar la key en Supabase Dashboard, este script
// pasó a leer del env.
//
// Uso local:
//   export $(grep -v '^#' .env.local | xargs) && tsx scripts/list-supabase-tables.ts
// O directo con `dotenv-cli`:
//   dotenv -e .env.local tsx scripts/list-supabase-tables.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vgnteswwvallupuanfiz.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) {
	throw new Error(
		"[list-supabase-tables] Falta SUPABASE_SERVICE_ROLE_KEY en el entorno. " +
			"Cargá `.env.local` antes de correr el script.",
	);
}

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
