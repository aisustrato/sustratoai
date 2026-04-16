
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Cargar variables manualmente
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // Quitar comillas si las hay
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("--- Diagnóstico de Conexión Supabase ---");
console.log(`URL detectada: ${supabaseUrl ? supabaseUrl : 'NO ENCONTRADA'}`);
console.log(`Key detectada: ${supabaseKey ? 'SÍ (Oculta)' : 'NO ENCONTRADA'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Faltan variables de entorno. Verifica .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
  console.log("\nIntentando conectar con el Jardín (Supabase)... 🌿");
  
  // Intento 1: Ping simple a Auth (suele ser lo primero que falla)
  const { data: authData, error: authError } = await supabase.auth.getSession();
  
  if (authError) {
    console.error("❌ Error en Auth:", authError.message);
  } else {
    console.log("✅ Auth responde correctamente.");
  }

  // Intento 2: Ping a Base de Datos (PostgREST)
  // Intentamos leer la tabla 'projects' o cualquier tabla pública que tengas, o simplemente una rpc si tienes
  // Si no, probamos un select simple que debería fallar por permisos pero responder
  const { data, error } = await supabase.from('projects').select('count', { count: 'exact', head: true });

  if (error) {
    console.log(`⚠️ Respuesta de BD: ${error.message} (Código: ${error.code})`);
    console.log("Nota: Un error de permisos (401/403) ES BUENA SEÑAL, significa que el servidor responde.");
    if (error.message.includes('FetchError') || error.message.includes('connection')) {
        console.error("❌ Error CRÍTICO de conexión: El servidor no es alcanzable.");
        console.log("\n👉 DIAGNÓSTICO: Tu proyecto parece estar en estado 'Zombie' o dormido, aunque diga activo.");
    } else {
        console.log("✅ El servidor PostgREST está vivo (respondió con error lógico, no de red).");
    }
  } else {
    console.log("✅ Conexión a BD exitosa y operativa.");
  }
}

checkConnection();
