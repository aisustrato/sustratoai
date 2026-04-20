import { SustratoLoadingLogo } from '@/components/ui/sustrato-loading-logo';
import type { ArchetypeTone } from '@/lib/types/minotauro-types';

interface LoadingOverlayProps {
  archetype: ArchetypeTone;
}

export function LoadingOverlay({ archetype }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <SustratoLoadingLogo size={64} />
        <div>
          <p className="text-lg font-semibold">Procesando con {archetype}</p>
          <p className="text-sm text-muted-foreground">Esto puede tomar unos momentos...</p>
        </div>
      </div>
    </div>
  );
}
