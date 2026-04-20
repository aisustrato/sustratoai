'use client';

interface ArtifactSelectorProps {
  projectId: string;
  onSelect: (artifactIds: string[]) => void;
  onCancel: () => void;
  preSelectedIds?: string[];
}

export function ArtifactSelector({ 
  projectId, 
  onCancel 
}: ArtifactSelectorProps) {
  return (
    <div className="p-6 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-2">Selector de Artefactos</h3>
      <p className="text-sm text-muted-foreground mb-4">Proyecto: {projectId}</p>
      <button 
        onClick={onCancel}
        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md"
      >
        Cancelar
      </button>
    </div>
  );
}
