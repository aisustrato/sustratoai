// Script para migrar minotauro_curated_sources de paragraph_id a galaxy_id
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Ejecutando migración de curated_sources...');
  
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260216_fix_curated_sources_galaxy.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Ejecutar la migración
  const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
  
  if (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  }
  
  console.log('✅ Migración ejecutada exitosamente');
}

runMigration();
