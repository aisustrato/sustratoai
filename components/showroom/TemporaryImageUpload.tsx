'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardInput } from '@/components/ui/StandardInput';
import { Loader2, Upload, Trash2 } from 'lucide-react';

// Inicializar cliente Supabase para Storage (requiere variables públicas)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TemporaryImageUploadProps {
  onUploadComplete: (url: string, path: string) => void;
  onClear?: () => void;
  bucketName?: string;
}

export function TemporaryImageUpload({ 
  onUploadComplete, 
  onClear,
  bucketName = 'public' 
}: TemporaryImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      // Preview local inmediato
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);

      const fileExt = file.name.split('.').pop();
      const fileName = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Subir a Supabase
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      
      onUploadComplete(data.publicUrl, filePath);

    } catch (error) {
      console.error("Error uploading:", error);
      alert('Error al subir la imagen. Verifica que el bucket "public" exista y sea público.');
      setLocalPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setLocalPreview(null);
    if (onClear) onClear();
    // Nota: El borrado del servidor se maneja externamente o al finalizar el proceso
  };

  return (
    <div className="space-y-4">
      {!localPreview ? (
        <div className="flex items-center gap-4">
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow transition-colors text-sm font-medium">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Subiendo...' : 'Subir Imagen'}
            </div>
            <input 
              type="file" 
              onChange={handleUpload} 
              disabled={uploading} 
              accept="image/*"
              className="hidden" 
            />
          </label>
          <span className="text-sm text-muted-foreground">Sube una imagen para analizar</span>
        </div>
      ) : (
        <div className="relative inline-block group">
          <img 
            src={localPreview} 
            alt="Preview" 
            className="h-32 w-auto rounded-md border border-border shadow-sm"
          />
          <button
            onClick={handleClear}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            title="Cambiar imagen"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
