// Script temporal para depurar artefacto ae5a7dc4-577e-4b05-8af1-7af7bf3346fb
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugArtifact() {
  const artifactId = 'ae5a7dc4-577e-4b05-8af1-7af7bf3346fb';
  
  // 1. Obtener artefacto
  const { data: artifact, error: artifactError } = await supabase
    .from('cog_artifacts')
    .select('id, type, status, mime_type, source_metadata')
    .eq('id', artifactId)
    .single();
  
  console.log('\n=== ARTEFACTO ===');
  console.log('ID:', artifact?.id);
  console.log('Type:', artifact?.type);
  console.log('Status:', artifact?.status);
  console.log('MIME Type:', artifact?.mime_type);
  console.log('Source Metadata:', JSON.stringify(artifact?.source_metadata, null, 2));
  
  // 2. Obtener transcripción
  const { data: transcription, error: transError } = await supabase
    .from('cog_transcriptions')
    .select('id, full_text')
    .eq('artifact_id', artifactId)
    .single();
  
  console.log('\n=== TRANSCRIPCIÓN ===');
  console.log('Existe:', !!transcription);
  console.log('Tiene full_text:', !!transcription?.full_text);
  console.log('Longitud:', transcription?.full_text?.length || 0);
  
  // 3. Obtener semillas
  const { data: seeds, error: seedsError } = await supabase
    .from('cog_fractal_seeds')
    .select('id, content')
    .eq('artifact_id', artifactId);
  
  console.log('\n=== SEMILLAS ===');
  console.log('Cantidad:', seeds?.length || 0);
  
  if (artifactError) console.error('Error artifact:', artifactError);
  if (transError) console.error('Error transcription:', transError);
  if (seedsError) console.error('Error seeds:', seedsError);
}

debugArtifact().catch(console.error);
