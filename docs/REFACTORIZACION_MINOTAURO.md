# 🏗️ Plan de Refactorización: Módulo Minotauro

## 📊 Análisis de la Situación Actual

### **Problema Identificado**
El archivo `page.tsx` tiene **1,222 líneas** con múltiples responsabilidades:
- Gestión de estado (12+ estados diferentes)
- Lógica de negocio (procesamiento de arquetipos, calibración)
- Renderizado de UI (secciones, análisis, fuentes)
- Manejo de persistencia (guardado, carga)
- Cálculos de métricas
- Gestión de formularios

**Resultado:** Código difícil de mantener, testear y escalar.

---

## 🎯 Objetivos de la Refactorización

1. **Separación de responsabilidades** (Single Responsibility Principle)
2. **Reutilización de código** (DRY)
3. **Testabilidad** (componentes y hooks aislados)
4. **Mantenibilidad** (archivos pequeños, cohesivos)
5. **Escalabilidad** (fácil agregar nuevos arquetipos o features)

---

## 🗂️ Estructura Propuesta

```
app/cognetica/minotauro/[universeId]/
├── page.tsx                          # 🎯 Orquestador principal (150-200 líneas)
│
├── hooks/                            # 🪝 Custom Hooks (lógica reutilizable)
│   ├── useUniverseData.ts           # Carga y gestión del universo
│   ├── useGalaxyEditor.ts           # Edición de contenido por sección
│   ├── useArchetypeProcessor.ts     # Procesamiento con arquetipos
│   ├── useCalibration.ts            # Sistema de calibración
│   ├── useAnalysisHistory.ts        # Persistencia de historial
│   └── useTextMetrics.ts            # Cálculos de palabras/páginas
│
├── components/                       # 🧩 Componentes UI especializados
│   ├── UniverseHeader.tsx           # Header con métricas globales
│   ├── GalaxyCard.tsx               # Card de sección (colapsable)
│   ├── GalaxyEditor.tsx             # Editor de título/descripción/contenido
│   ├── ArchetypePanel.tsx           # Panel de arquetipos disponibles
│   ├── AnalysisPanel.tsx            # Panel de análisis (colapsable)
│   ├── CalibrationForm.tsx          # Formulario de calibración
│   ├── SourcesPanel.tsx             # Panel de fuentes curadas
│   └── NewGalaxyForm.tsx            # Formulario nueva sección
│
├── utils/                            # 🛠️ Utilidades puras
│   ├── paperStandards.ts            # Constantes de estándares
│   ├── textMetrics.ts               # Funciones de cálculo
│   ├── archetypeHelpers.ts          # Helpers de arquetipos
│   └── metadataPreserver.ts         # Preservación de metadata
│
└── types/                            # 📝 Tipos específicos del módulo
    └── editor.types.ts              # Tipos locales del editor
```

---

## 🔄 Migración por Fases

### **Fase 1: Extracción de Hooks (Semana 1)**
**Objetivo:** Separar lógica de estado del componente principal

#### 1.1 `useUniverseData.ts`
```typescript
export function useUniverseData(universeId: string) {
  const [universe, setUniverse] = useState<MinotauroUniverseFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [galaxies, setGalaxies] = useState<GalaxyItem[]>([]);

  const loadUniverse = useCallback(async () => {
    // Lógica de carga
  }, [universeId]);

  return { universe, loading, galaxies, loadUniverse, reloadUniverse };
}
```

#### 1.2 `useGalaxyEditor.ts`
```typescript
export function useGalaxyEditor(galaxies: GalaxyItem[]) {
  const [editingContent, setEditingContent] = useState<Record<string, GalaxyContent>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const handleSave = useCallback(async (galaxyId: string) => {
    // Lógica de guardado con preservación de metadata
  }, [editingContent, galaxies]);

  return { editingContent, expandedSections, handleSave, toggleSection };
}
```

#### 1.3 `useArchetypeProcessor.ts`
```typescript
export function useArchetypeProcessor(projectId: string) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [processingArchetype, setProcessingArchetype] = useState<ArchetypeTone | null>(null);

  const processWithArchetype = useCallback(async (
    galaxy: MinotauroGalaxy, 
    archetype: ArchetypeTone,
    content: string
  ) => {
    // Lógica de procesamiento
  }, [projectId]);

  return { processing, processingArchetype, processWithArchetype };
}
```

#### 1.4 `useCalibration.ts`
```typescript
export function useCalibration() {
  const [calibrations, setCalibrations] = useState<CalibrationState>({});

  const handleCalibrate = useCallback((
    galaxyId: string,
    commentId: string,
    response: HumanResponse,
    note?: string
  ) => {
    // Lógica de calibración
  }, []);

  const isCalibrationValid = useCallback((galaxyId: string, analysis: Analysis) => {
    // Validación de calibración completa
  }, [calibrations]);

  return { calibrations, handleCalibrate, isCalibrationValid };
}
```

#### 1.5 `useAnalysisHistory.ts`
```typescript
export function useAnalysisHistory() {
  const [analyses, setAnalyses] = useState<Record<string, Analysis | null>>({});
  const [collapsedAnalyses, setCollapsedAnalyses] = useState<Record<string, boolean>>({});

  const saveAnalysisToMetadata = useCallback(async (
    galaxyId: string,
    analysisData: Analysis
  ) => {
    // Persistencia en metadata
  }, []);

  const loadAnalysisFromMetadata = useCallback((metadata: any) => {
    // Carga desde metadata
  }, []);

  return { 
    analyses, 
    collapsedAnalyses, 
    saveAnalysisToMetadata, 
    loadAnalysisFromMetadata,
    toggleCollapse 
  };
}
```

---

### **Fase 2: Componentes UI (Semana 2)**

#### 2.1 `UniverseHeader.tsx`
```typescript
interface UniverseHeaderProps {
  universe: MinotauroUniverse;
  paperStandard: PaperStandard;
  totalWords: number;
  totalPages: number;
  totalSections: number;
  onStandardChange: (standard: PaperStandard) => void;
  onNewSection: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export function UniverseHeader({ ... }: UniverseHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Header con título y botones */}
      {/* Card de métricas globales con progress bar */}
    </div>
  );
}
```

#### 2.2 `GalaxyCard.tsx`
```typescript
interface GalaxyCardProps {
  galaxy: MinotauroGalaxy;
  content: GalaxyContent;
  isExpanded: boolean;
  isProcessing: boolean;
  analysis: Analysis | null;
  standard: PaperStandard;
  onToggle: () => void;
  onSave: () => void;
  onDelete: () => void;
  children: React.ReactNode; // Contenido expandido
}

export function GalaxyCard({ ... }: GalaxyCardProps) {
  return (
    <StandardCard>
      {/* Header colapsable con métricas y progress bar */}
      {isExpanded && children}
    </StandardCard>
  );
}
```

#### 2.3 `GalaxyEditor.tsx`
```typescript
interface GalaxyEditorProps {
  galaxyId: string;
  content: GalaxyContent;
  onChange: (field: keyof GalaxyContent, value: string) => void;
}

export function GalaxyEditor({ ... }: GalaxyEditorProps) {
  return (
    <div className="space-y-4">
      {/* Card de título y descripción */}
      {/* Editor Markdown dual */}
    </div>
  );
}
```

#### 2.4 `AnalysisPanel.tsx`
```typescript
interface AnalysisPanelProps {
  analysis: Analysis;
  calibrations: CalibrationState;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCalibrate: (commentId: string, response: HumanResponse, note?: string) => void;
  onExecute: () => void;
  onDismiss: () => void;
}

export function AnalysisPanel({ ... }: AnalysisPanelProps) {
  return (
    <StandardCard colorScheme="primary">
      {/* Header colapsable con resumen */}
      {!isCollapsed && (
        <>
          {/* Tokens y métricas */}
          {/* Lista de comentarios con calibración */}
          {/* Botones de acción */}
        </>
      )}
    </StandardCard>
  );
}
```

---

### **Fase 3: Utilidades y Helpers (Semana 3)**

#### 3.1 `paperStandards.ts`
```typescript
export const PAPER_STANDARDS = {
  zenodo: { wordsPerSection: 400, totalPages: 10, tono: 'Formal-técnico' },
  ieee: { wordsPerSection: 500, totalPages: 8, tono: 'Científico formal' },
  springer: { wordsPerSection: 600, totalPages: 12, tono: 'Académico neutro' },
  acm: { wordsPerSection: 450, totalPages: 10, tono: 'Técnico claro' },
} as const;

export type PaperStandard = keyof typeof PAPER_STANDARDS;
```

#### 3.2 `textMetrics.ts`
```typescript
export interface TextMetrics {
  words: number;
  characters: number;
  estimatedPages: number;
}

export function calculateTextMetrics(text: string): TextMetrics {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const characters = text.length;
  const estimatedPages = words / 250;
  
  return { words, characters, estimatedPages };
}

export function calculateTotalMetrics(
  galaxies: GalaxyItem[],
  editingContent: Record<string, GalaxyContent>
): TextMetrics {
  return galaxies.reduce((acc, g) => {
    const content = editingContent[g.galaxy.id]?.content || '';
    const metrics = calculateTextMetrics(content);
    return {
      words: acc.words + metrics.words,
      characters: acc.characters + metrics.characters,
      estimatedPages: acc.estimatedPages + metrics.estimatedPages,
    };
  }, { words: 0, characters: 0, estimatedPages: 0 });
}
```

#### 3.3 `metadataPreserver.ts`
```typescript
export function preserveMetadata(
  currentMetadata: any,
  updates: Partial<GalaxyMetadata>
): GalaxyMetadata {
  return {
    ...currentMetadata,
    ...updates,
    // Preservar campos críticos si no están en updates
    ultimo_analisis: updates.ultimo_analisis ?? currentMetadata.ultimo_analisis,
    ultimo_arquetipo: updates.ultimo_arquetipo ?? currentMetadata.ultimo_arquetipo,
    timestamp_analisis: updates.timestamp_analisis ?? currentMetadata.timestamp_analisis,
  };
}
```

#### 3.4 `archetypeHelpers.ts`
```typescript
export function getArchetypeEmoji(archetype: ArchetypeTone): string {
  const emojis: Record<ArchetypeTone, string> = {
    deslixador: '🛠️',
    polinizador: '🌸',
    dedalo: '🏛️',
    bufon: '🃏',
    cronos: '⏳',
    colega: '☕',
  };
  return emojis[archetype];
}

export function getArchetypeName(archetype: ArchetypeTone): string {
  const names: Record<ArchetypeTone, string> = {
    deslixador: 'Deslixador',
    polinizador: 'Polinizador',
    dedalo: 'Dédalo',
    bufon: 'Bufón',
    cronos: 'Cronos',
    colega: 'Colega',
  };
  return names[archetype];
}
```

---

### **Fase 4: Integración Final (Semana 4)**

#### 4.1 `page.tsx` Refactorizado (Orquestador)
```typescript
'use client';

import { useUniverseData } from './hooks/useUniverseData';
import { useGalaxyEditor } from './hooks/useGalaxyEditor';
import { useArchetypeProcessor } from './hooks/useArchetypeProcessor';
import { useCalibration } from './hooks/useCalibration';
import { useAnalysisHistory } from './hooks/useAnalysisHistory';
import { UniverseHeader } from './components/UniverseHeader';
import { GalaxyCard } from './components/GalaxyCard';
import { GalaxyEditor } from './components/GalaxyEditor';
import { AnalysisPanel } from './components/AnalysisPanel';
import { NewGalaxyForm } from './components/NewGalaxyForm';

export default function UniverseEditorPage() {
  const params = useParams();
  const { proyectoActual } = useAuth();
  
  // Hooks de lógica
  const { universe, loading, galaxies, loadUniverse } = useUniverseData(params.universeId);
  const { editingContent, expandedSections, handleSave, toggleSection } = useGalaxyEditor(galaxies);
  const { processing, processingArchetype, processWithArchetype } = useArchetypeProcessor(proyectoActual?.id);
  const { calibrations, handleCalibrate, isCalibrationValid } = useCalibration();
  const { analyses, collapsedAnalyses, toggleCollapse } = useAnalysisHistory();
  
  // Estado local simple
  const [paperStandard, setPaperStandard] = useState<PaperStandard>('zenodo');
  const [showNewGalaxyForm, setShowNewGalaxyForm] = useState(false);
  
  // Métricas calculadas
  const totalMetrics = useMemo(() => 
    calculateTotalMetrics(galaxies, editingContent),
    [galaxies, editingContent]
  );

  if (loading) return <LoadingScreen />;
  if (!universe) return <NotFoundScreen />;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <UniverseHeader
          universe={universe.universe}
          paperStandard={paperStandard}
          totalWords={totalMetrics.words}
          totalPages={totalMetrics.estimatedPages}
          totalSections={galaxies.length}
          onStandardChange={setPaperStandard}
          onNewSection={() => setShowNewGalaxyForm(true)}
          onDelete={handleDeleteUniverse}
          onBack={() => router.push('/cognetica/minotauro')}
        />

        {showNewGalaxyForm && (
          <NewGalaxyForm
            onSubmit={handleCreateGalaxy}
            onCancel={() => setShowNewGalaxyForm(false)}
          />
        )}

        <div className="space-y-4">
          {galaxies.map((item, index) => {
            const galaxy = item.galaxy;
            const content = editingContent[galaxy.id];
            const analysis = analyses[galaxy.id];
            const isExpanded = expandedSections.has(galaxy.id);

            return (
              <GalaxyCard
                key={galaxy.id}
                galaxy={galaxy}
                content={content}
                isExpanded={isExpanded}
                isProcessing={processing === galaxy.id}
                analysis={analysis}
                standard={PAPER_STANDARDS[paperStandard]}
                onToggle={() => toggleSection(galaxy.id)}
                onSave={() => handleSave(galaxy.id)}
                onDelete={() => handleDeleteGalaxy(galaxy.id)}
              >
                <GalaxyEditor
                  galaxyId={galaxy.id}
                  content={content}
                  onChange={(field, value) => handleContentChange(galaxy.id, field, value)}
                />

                {analysis && (
                  <AnalysisPanel
                    analysis={analysis}
                    calibrations={calibrations[galaxy.id] || {}}
                    isCollapsed={collapsedAnalyses[galaxy.id]}
                    onToggleCollapse={() => toggleCollapse(galaxy.id)}
                    onCalibrate={(commentId, response, note) => 
                      handleCalibrate(galaxy.id, commentId, response, note)
                    }
                    onExecute={() => handleExecuteVersion(galaxy.id)}
                    onDismiss={() => handleDismissAnalysis(galaxy.id)}
                  />
                )}
              </GalaxyCard>
            );
          })}
        </div>
      </div>

      {processingArchetype && (
        <LoadingOverlay archetype={processingArchetype} />
      )}
    </div>
  );
}
```

**Resultado:** ~200 líneas vs 1,222 líneas originales

---

## 📈 Beneficios Esperados

### **Mantenibilidad**
- ✅ Archivos pequeños (50-150 líneas cada uno)
- ✅ Responsabilidad única por archivo
- ✅ Fácil localizar bugs
- ✅ Cambios aislados sin efectos colaterales

### **Testabilidad**
- ✅ Hooks testeables con `@testing-library/react-hooks`
- ✅ Componentes testeables con `@testing-library/react`
- ✅ Utilidades testeables con Jest
- ✅ Mocks simples y claros

### **Reutilización**
- ✅ Hooks reutilizables en otros módulos
- ✅ Componentes reutilizables (AnalysisPanel, etc.)
- ✅ Utilidades compartibles

### **Escalabilidad**
- ✅ Fácil agregar nuevos arquetipos (solo modificar helpers)
- ✅ Fácil agregar nuevos estándares de paper
- ✅ Fácil agregar nuevas features sin tocar código existente

### **Developer Experience**
- ✅ Navegación rápida entre archivos
- ✅ Intellisense más preciso
- ✅ Menos merge conflicts
- ✅ Onboarding más rápido para nuevos devs

---

## 🧪 Estrategia de Testing

### **Hooks**
```typescript
// useCalibration.test.ts
describe('useCalibration', () => {
  it('should validate complete calibration', () => {
    const { result } = renderHook(() => useCalibration());
    // Test logic
  });
});
```

### **Componentes**
```typescript
// AnalysisPanel.test.tsx
describe('AnalysisPanel', () => {
  it('should render collapsed state correctly', () => {
    render(<AnalysisPanel isCollapsed={true} {...props} />);
    expect(screen.getByText(/comentarios/i)).toBeInTheDocument();
  });
});
```

### **Utilidades**
```typescript
// textMetrics.test.ts
describe('calculateTextMetrics', () => {
  it('should calculate correct word count', () => {
    const result = calculateTextMetrics('Hello world');
    expect(result.words).toBe(2);
  });
});
```

---

## 📋 Checklist de Migración

### **Preparación**
- [ ] Crear branch `refactor/minotauro-modular`
- [ ] Documentar comportamiento actual (tests de regresión)
- [ ] Backup del código actual

### **Fase 1: Hooks**
- [ ] Crear estructura de carpetas
- [ ] Implementar `useUniverseData`
- [ ] Implementar `useGalaxyEditor`
- [ ] Implementar `useArchetypeProcessor`
- [ ] Implementar `useCalibration`
- [ ] Implementar `useAnalysisHistory`
- [ ] Tests unitarios de hooks

### **Fase 2: Componentes**
- [ ] Implementar `UniverseHeader`
- [ ] Implementar `GalaxyCard`
- [ ] Implementar `GalaxyEditor`
- [ ] Implementar `AnalysisPanel`
- [ ] Implementar `CalibrationForm`
- [ ] Implementar `SourcesPanel`
- [ ] Tests de componentes

### **Fase 3: Utilidades**
- [ ] Implementar `paperStandards`
- [ ] Implementar `textMetrics`
- [ ] Implementar `archetypeHelpers`
- [ ] Implementar `metadataPreserver`
- [ ] Tests de utilidades

### **Fase 4: Integración**
- [ ] Refactorizar `page.tsx` como orquestador
- [ ] Tests de integración end-to-end
- [ ] Verificar que toda la funcionalidad se preserva
- [ ] Code review
- [ ] Merge a main

---

## 🎯 Métricas de Éxito

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Líneas por archivo | 1,222 | ~150 | 87% ↓ |
| Archivos | 1 | ~20 | Modularidad ↑ |
| Complejidad ciclomática | Alta | Baja | Mantenibilidad ↑ |
| Cobertura de tests | 0% | 80%+ | Confiabilidad ↑ |
| Tiempo de onboarding | 2-3 días | 4-6 horas | Productividad ↑ |

---

## 💡 Recomendaciones Adicionales

1. **TypeScript estricto:** Habilitar `strict: true` en tsconfig
2. **ESLint rules:** Agregar reglas para complejidad máxima por función
3. **Storybook:** Documentar componentes visualmente
4. **Husky:** Pre-commit hooks para linter y tests
5. **Conventional Commits:** Estandarizar mensajes de commit

---

## 🚀 Próximos Pasos

1. **Revisar y aprobar** este plan de refactorización
2. **Priorizar fases** según urgencia de negocio
3. **Asignar recursos** (tiempo, devs)
4. **Ejecutar fase 1** (la más crítica)
5. **Iterar** con feedback continuo

---

**Nota:** Esta refactorización es **incremental y no bloqueante**. Puedes seguir agregando features mientras migras gradualmente. La clave es mantener la funcionalidad actual 100% operativa en cada fase.
