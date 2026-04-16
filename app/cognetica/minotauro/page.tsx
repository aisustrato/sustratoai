// 📍 app/cognetica/minotauro/page.tsx
// 🎯 PROPÓSITO: Editor híbrido para escritura académica con IA (Módulo Minotauro)
// 🐂 METÁFORA: El Minotauro guía por el laberinto de la escritura

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-provider';
import { PageHeader } from '@/components/common/page-header';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardCard } from '@/components/ui/StandardCard';
import { getUniversesByProject } from '@/lib/actions/minotauro-actions';
import type { MinotauroUniverse } from '@/lib/types/minotauro-types';
import { CreateUniverseModal } from './components/CreateUniverseModal';

export default function MinotauroPage() {
  const router = useRouter();
  const { proyectoActual } = useAuth();
  const [universes, setUniverses] = useState<MinotauroUniverse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadUniverses = async () => {
    if (!proyectoActual?.id) return;
    
    setLoading(true);
    const result = await getUniversesByProject(proyectoActual.id);
    
    if (result.success && result.data) {
      setUniverses(result.data);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadUniverses();
  }, [proyectoActual?.id]);

  if (!proyectoActual) {
    return (
      <div className="container mx-auto p-8">
        <PageHeader
          title="🐂 Minotauro"
          description="Selecciona un proyecto para comenzar"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <PageHeader
        title="🐂 X  Minotauro"
        description="Editor híbrido de escritura académica con IA"
      />

      {/* Botón para crear nuevo universo */}
      <div className="flex justify-end">
        <StandardButton
          colorScheme="primary"
          onClick={() => setModalOpen(true)}
        >
          ✨ Nuevo Escrito
        </StandardButton>
      </div>

      {/* Lista de universos */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando escritos...</p>
        </div>
      ) : universes.length === 0 ? (
        <StandardCard className="p-12 text-center space-y-4">
            <div className="text-6xl">🐂</div>
            <h3 className="text-xl font-semibold">
              Bienvenido al Laberinto de la Escritura
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              El Minotauro te guiará en la co-creación de papers académicos.
              Comienza creando tu primer escrito.
            </p>
            <StandardButton
              colorScheme="primary"
              onClick={() => setModalOpen(true)}
            >
              ✨ Crear Primer Escrito
            </StandardButton>
        </StandardCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {universes.map((universe) => (
            <StandardCard
              key={universe.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer space-y-2"
              onClick={() => router.push(`/cognetica/minotauro/${universe.id}`)}
            >
              <h3 className="text-xl font-semibold">{universe.title}</h3>
              {universe.subtitle && (
                <p className="text-sm text-muted-foreground">{universe.subtitle}</p>
              )}
              {universe.purpose && (
                <p className="text-xs text-muted-foreground mt-2">
                  🎯 {universe.purpose}
                </p>
              )}
            </StandardCard>
          ))}
        </div>
      )}

      {/* Sección de ayuda */}
      <StandardCard className="p-6 bg-muted/50 space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            🎭 Arquetipos de Tono
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>🃏 Bufón (Mistral):</strong> Ironía, rompe la seriedad académica
            </div>
            <div>
              <strong>📊 Auditor (DeepSeek):</strong> Rigor, estructura termodinámica
            </div>
            <div>
              <strong>✍️ Editor (Claude):</strong> Textura, coherencia narrativa
            </div>
            <div>
              <strong>☕ Colega (Gemini):</strong> Conversación de café, conexión inesperada
            </div>
          </div>
      </StandardCard>

      {/* Modal de creación */}
      {proyectoActual && (
        <CreateUniverseModal
          projectId={proyectoActual.id}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSuccess={loadUniverses}
        />
      )}
    </div>
  );
}
