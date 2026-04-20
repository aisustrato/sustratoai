// 📍 scripts/clean-distilled-essays.ts
// 🎯 PROPÓSITO: Script para limpiar ensayos destilados envueltos en JSON
// 🔧 USO: npx tsx scripts/clean-distilled-essays.ts

import { cleanDistilledEssaysJSON } from '../lib/actions/cognetica-old-migration-clean-essays';

async function main() {
    console.log('🧹 Iniciando limpieza de ensayos destilados...\n');
    
    const result = await cleanDistilledEssaysJSON();
    
    if (result.success) {
        console.log('\n✅ LIMPIEZA EXITOSA\n');
        console.log(`📊 Resumen:`);
        console.log(`   ✅ Limpiados: ${result.cleaned}`);
        console.log(`   ⏭️  Omitidos: ${result.skipped}`);
        console.log(`   ❌ Errores: ${result.errors}`);
        
        if (result.details.length > 0) {
            console.log(`\n📋 Detalles:`);
            result.details.forEach(detail => {
                const icon = detail.status === 'cleaned' ? '✅' : detail.status === 'error' ? '❌' : '⏭️';
                console.log(`   ${icon} ${detail.artifact_id}: ${detail.message || detail.status}`);
            });
        }
    } else {
        console.error('\n❌ LIMPIEZA FALLÓ\n');
        console.error('Errores:', result.details.filter(d => d.status === 'error'));
    }
}

main().catch(console.error);
