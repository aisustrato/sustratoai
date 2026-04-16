/**
 * Script para aplicar migración de metadatos de universo
 * Ejecutar con: npx tsx scripts/apply-universe-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Aplicando migración de metadatos de universo...\n');

  // Leer archivo de migración
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260311_add_universe_metadata_to_phases.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Ejecutar migración
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Error al aplicar migración:', error);
      process.exit(1);
    }

    console.log('✅ Migración aplicada exitosamente\n');

    // Verificar columnas agregadas
    console.log('🔍 Verificando columnas agregadas...\n');
    
    const { data: phases, error: selectError } = await supabase
      .from('preclassification_phases')
      .select('id, name, universe_name, universe_type, total_articles')
      .limit(5);

    if (selectError) {
      console.error('❌ Error al verificar:', selectError);
      process.exit(1);
    }

    console.log('✅ Columnas verificadas. Fases existentes:');
    console.table(phases);

    console.log('\n🎉 Migración completada exitosamente!');
    console.log('📝 Siguiente paso: Regenerar tipos TypeScript con: npm run update-types');

  } catch (err) {
    console.error('❌ Error inesperado:', err);
    process.exit(1);
  }
}

applyMigration();
