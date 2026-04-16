'use client';

import { useState } from 'react';
import { StandardCard } from '@/components/ui/StandardCard';
import { StandardButton } from '@/components/ui/StandardButton';
import { StandardBadge } from '@/components/ui/StandardBadge';
import { StandardInput } from '@/components/ui/StandardInput';
import { StandardTextarea } from '@/components/ui/StandardTextarea';
import { ChevronDown, ChevronUp, Save, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { mockSections, mockAnalyses, type MockSection, type ArchetypeAnalysis, type ArchetypeComment, type MockVersion, type CuratedSource } from './mockData';
import { useToast } from '@/hooks/use-toast';

export default function PanelSeccionShowroom() {
  const [sections, setSections] = useState(mockSections);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['1']));
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [analyses, setAnalyses] = useState<Record<string, ArchetypeAnalysis | null>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Estado para calibración: { sectionId: { commentId: { response, note } } }
  const [calibrations, setCalibrations] = useState<Record<string, Record<string, { 
    response?: 'approve' | 'modify' | 'reject';
    note?: string;
  }>>>({});
  
  const { toast } = useToast();

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleContentChange = (sectionId: string, content: string) => {
    setEditingContent(prev => ({
      ...prev,
      [sectionId]: content
    }));
  };

  const handleSave = (sectionId: string) => {
    const content = editingContent[sectionId] || sections.find((s: MockSection) => s.id === sectionId)?.content || '';
    const words = content.split(/\s+/).filter((w: string) => w.length > 0).length;
    const chars = content.length;

    setSections((prev: MockSection[]) => prev.map((section: MockSection) => {
      if (section.id === sectionId) {
        return {
          ...section,
          content,
          version: section.version + 1,
          wordCount: words,
          charCount: chars,
          lastEdited: 'hace unos segundos',
          versions: [
            {
              version: section.version + 1,
              archetype: null,
              timestamp: 'hace unos segundos',
              content
            },
            ...section.versions
          ]
        };
      }
      return section;
    }));

    toast({
      title: '💾 Guardado',
      description: `Versión ${sections.find(s => s.id === sectionId)!.version + 1} creada`,
    });
  };

  const handleArchetype = async (sectionId: string, archetype: 'bufon' | 'auditor' | 'editor' | 'colega') => {
    setProcessing(sectionId);
    
    toast({
      title: '🤖 Procesando...',
      description: `${archetype} está analizando el texto`,
    });

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 2000));

    setAnalyses((prev: Record<string, ArchetypeAnalysis | null>) => ({
      ...prev,
      [sectionId]: mockAnalyses[archetype]
    }));

    setProcessing(null);

    toast({
      title: '✨ Sugerencia generada',
      description: `${archetype} ha completado el análisis`,
    });
  };

  // Manejar respuesta de calibración para un comentario
  const handleCalibrationResponse = (sectionId: string, commentId: string, response: 'approve' | 'modify' | 'reject') => {
    setCalibrations(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [commentId]: {
          response,
          note: prev[sectionId]?.[commentId]?.note || ''
        }
      }
    }));
  };

  // Manejar nota de calibración para un comentario
  const handleCalibrationNote = (sectionId: string, commentId: string, note: string) => {
    setCalibrations(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [commentId]: {
          ...prev[sectionId]?.[commentId],
          note
        }
      }
    }));
  };

  // Verificar si la calibración está completa y válida
  const isCalibrationValid = (sectionId: string, analysis: ArchetypeAnalysis): { valid: boolean; message?: string } => {
    const sectionCalibrations = calibrations[sectionId] || {};
    
    // Verificar que todos los comentarios tengan respuesta
    for (const comment of analysis.comments) {
      const calibration = sectionCalibrations[comment.id];
      
      if (!calibration?.response) {
        return { valid: false, message: `Falta responder al comentario: "${comment.point}"` };
      }
      
      // Si es modificar o rechazar, debe tener nota
      if ((calibration.response === 'modify' || calibration.response === 'reject') && !calibration.note?.trim()) {
        const action = calibration.response === 'modify' ? 'modificación' : 'rechazo';
        return { valid: false, message: `Debes justificar el ${action} de: "${comment.point}"` };
      }
    }
    
    return { valid: true };
  };

  // Ejecutar nueva versión basada en calibración
  const handleExecuteVersion = async (sectionId: string) => {
    const analysis = analyses[sectionId];
    if (!analysis) return;

    const validation = isCalibrationValid(sectionId, analysis);
    if (!validation.valid) {
      toast({
        title: '⚠️ Calibración incompleta',
        description: validation.message,
        variant: 'destructive'
      });
      return;
    }

    setProcessing(sectionId);
    
    toast({
      title: '🚀 Ejecutando nueva versión...',
      description: 'Generando contenido basado en tu calibración',
    });

    // Simular delay de generación
    await new Promise(resolve => setTimeout(resolve, 2500));

    const section = sections.find((s: MockSection) => s.id === sectionId);
    if (!section) return;

    const sectionCalibrations = calibrations[sectionId] || {};
    
    // Generar nuevo contenido basado en calibración
    const approvedComments = analysis.comments.filter(c => 
      sectionCalibrations[c.id]?.response === 'approve'
    );
    const modifiedComments = analysis.comments.filter(c => 
      sectionCalibrations[c.id]?.response === 'modify'
    );

    const currentContent = editingContent[sectionId] || section.content;
    let newContent = currentContent;
    
    // Agregar sección de cambios aplicados
    newContent += `\n\n---\n\n## 🤖 Versión ${section.version + 1} - ${getArchetypeName(analysis.archetype)} (Calibrado)\n\n`;
    
    if (approvedComments.length > 0) {
      newContent += `### ✅ Cambios Aprobados:\n\n`;
      approvedComments.forEach(c => {
        newContent += `- **${c.point}**: Aplicado según sugerencia\n`;
      });
    }
    
    if (modifiedComments.length > 0) {
      newContent += `\n### ✏️ Cambios Modificados:\n\n`;
      modifiedComments.forEach(c => {
        const note = sectionCalibrations[c.id]?.note || '';
        newContent += `- **${c.point}**: ${note}\n`;
      });
    }

    // Actualizar sección con nueva versión
    setSections((prev: MockSection[]) => prev.map((s: MockSection) => {
      if (s.id === sectionId) {
        const newVersion = s.version + 1;
        return {
          ...s,
          content: newContent,
          version: newVersion,
          wordCount: newContent.split(/\s+/).filter((w: string) => w.length > 0).length,
          charCount: newContent.length,
          lastEdited: 'hace unos segundos',
          versions: [
            {
              version: newVersion,
              archetype: analysis.archetype,
              timestamp: 'hace unos segundos',
              content: newContent
            },
            ...s.versions
          ]
        };
      }
      return s;
    }));

    // Limpiar estado
    setEditingContent(prev => {
      const newState = { ...prev };
      delete newState[sectionId];
      return newState;
    });
    
    setAnalyses((prev: Record<string, ArchetypeAnalysis | null>) => ({
      ...prev,
      [sectionId]: null
    }));
    
    setCalibrations(prev => {
      const newState = { ...prev };
      delete newState[sectionId];
      return newState;
    });

    setProcessing(null);

    toast({
      title: '✅ Nueva versión generada',
      description: `Versión ${section.version + 1} creada con ${approvedComments.length} cambios aprobados y ${modifiedComments.length} modificados`,
    });
  };

  const getArchetypeEmoji = (archetype: string) => {
    const emojis = {
      bufon: '🃏',
      auditor: '📊',
      editor: '✍️',
      colega: '☕'
    };
    return emojis[archetype as keyof typeof emojis] || '🤖';
  };

  const getArchetypeName = (archetype: string) => {
    const names = {
      bufon: 'Bufón',
      auditor: 'Auditor',
      editor: 'Editor',
      colega: 'Colega'
    };
    return names[archetype as keyof typeof names] || 'IA';
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Panel de Sección con Arquetipos</h1>
          <p className="text-muted-foreground">
            Mock aislado para probar la interfaz de gestión de secciones con editor MD, arquetipos de IA y control de versiones.
          </p>
          <StandardBadge colorScheme="warning" size="sm">
            Pruebas Iniciales - Datos Mock
          </StandardBadge>
        </div>

        <div className="space-y-4">
          {sections.map(section => {
            const isExpanded = expandedSections.has(section.id);
            const currentContent = editingContent[section.id] || section.content;
            const analysis = analyses[section.id];
            const isProcessing = processing === section.id;

            return (
              <StandardCard key={section.id} colorScheme="neutral" noPadding>
                {/* Header - Siempre visible */}
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">📄</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{section.title}</h3>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      </div>
                    </div>
                    <StandardButton
                      size="sm"
                      colorScheme="neutral"
                      styleType="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection(section.id);
                      }}
                    >
                      {isExpanded ? (
                        <><ChevronUp className="w-4 h-4 mr-2" /> Colapsar</>
                      ) : (
                        <><ChevronDown className="w-4 h-4 mr-2" /> Expandir</>
                      )}
                    </StandardButton>
                  </div>
                  
                  <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                    <span>📊 {section.wordCount} palabras</span>
                    <span>• v{section.version}</span>
                    <span>• Última edición: {section.lastEdited}</span>
                  </div>
                </div>

                {/* Contenido expandido */}
                {isExpanded && (
                  <div className="border-t p-4 space-y-4">
                    {/* Campos de título y descripción */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Título</label>
                        <StandardInput
                          value={section.title}
                          onChange={() => {}}
                          placeholder="Título de la sección"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Descripción</label>
                        <StandardTextarea
                          value={section.description}
                          onChange={() => {}}
                          placeholder="Descripción breve"
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Editor MD con vista dual */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Editor */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Editor Markdown
                        </label>
                        <textarea
                          value={currentContent}
                          onChange={(e) => handleContentChange(section.id, e.target.value)}
                          className="w-full h-96 p-3 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Escribe tu contenido en Markdown..."
                        />
                      </div>

                      {/* Vista previa */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Vista Previa
                        </label>
                        <div className="h-96 p-3 border rounded-lg overflow-y-auto bg-muted/30">
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {currentContent}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fuentes Curadas - Artefactos de Cognetica */}
                    <StandardCard colorScheme="tertiary" className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">📚 Fuentes Curadas (Artefactos Cognetica)</h4>
                          <StandardBadge colorScheme="tertiary" size="xs">
                            {section.curatedSources.length} fuentes
                          </StandardBadge>
                        </div>
                        
                        {section.curatedSources.length > 0 ? (
                          <div className="space-y-2">
                            {section.curatedSources.map((source: CuratedSource) => (
                              <div key={source.id} className="bg-background/50 p-2 rounded border text-xs">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="font-medium flex items-center gap-2">
                                      {source.type === 'paper' && '📄'}
                                      {source.type === 'analysis' && '📊'}
                                      {source.type === 'dataset' && '💾'}
                                      {source.type === 'report' && '📋'}
                                      <span>{source.title}</span>
                                    </div>
                                    <div className="text-muted-foreground mt-1">
                                      {source.summary}
                                    </div>
                                    <div className="text-muted-foreground mt-1">
                                      ID Cognetica: <code className="text-xs bg-muted px-1 rounded">{source.cogneticaId}</code> • {source.addedAt}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-2">
                            No hay fuentes curadas vinculadas a esta sección
                          </div>
                        )}
                      </div>
                    </StandardCard>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2">
                      <StandardButton
                        colorScheme="success"
                        size="sm"
                        onClick={() => handleSave(section.id)}
                        disabled={isProcessing}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                      </StandardButton>

                      <div className="flex gap-2 ml-auto">
                        <StandardButton
                          colorScheme="tertiary"
                          size="sm"
                          onClick={() => handleArchetype(section.id, 'bufon')}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Sparkles className="w-4 h-4 animate-spin" /> : '🃏'} Bufón
                        </StandardButton>
                        <StandardButton
                          colorScheme="primary"
                          size="sm"
                          onClick={() => handleArchetype(section.id, 'auditor')}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Sparkles className="w-4 h-4 animate-spin" /> : '📊'} Auditor
                        </StandardButton>
                        <StandardButton
                          colorScheme="secondary"
                          size="sm"
                          onClick={() => handleArchetype(section.id, 'editor')}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Sparkles className="w-4 h-4 animate-spin" /> : '✍️'} Editor
                        </StandardButton>
                        <StandardButton
                          colorScheme="neutral"
                          size="sm"
                          onClick={() => handleArchetype(section.id, 'colega')}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Sparkles className="w-4 h-4 animate-spin" /> : '☕'} Colega
                        </StandardButton>
                      </div>
                    </div>

                    {/* Panel de análisis inline */}
                    {analysis && (
                      <StandardCard colorScheme="primary" className="mt-4 p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {getArchetypeEmoji(analysis.archetype)} Análisis del {getArchetypeName(analysis.archetype)}
                              </span>
                              <StandardBadge colorScheme="warning" size="xs">
                                {analysis.status === 'pending_calibration' ? 'Pendiente calibración' : 'Calibrado'}
                              </StandardBadge>
                            </div>
                            <StandardButton
                              size="xs"
                              colorScheme="neutral"
                              styleType="ghost"
                              onClick={() => setAnalyses((prev: Record<string, ArchetypeAnalysis | null>) => ({ ...prev, [section.id]: null }))}
                            >
                              ✕
                            </StandardButton>
                          </div>

                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>📊 {analysis.tokens.totalTokenCount} tokens</span>
                            <span>📥 {analysis.tokens.promptTokenCount} in</span>
                            <span>📤 {analysis.tokens.candidatesTokenCount} out</span>
                            <span>• {analysis.comments.length} comentarios</span>
                          </div>

                          <div className="space-y-4">
                            {analysis.comments.map((comment: ArchetypeComment, idx: number) => {
                              const calibration = calibrations[section.id]?.[comment.id];
                              const currentResponse = calibration?.response;
                              const currentNote = calibration?.note || '';
                              
                              return (
                                <div key={comment.id} className="bg-background/50 p-4 rounded-lg border">
                                  <div className="font-medium text-sm mb-2">
                                    📌 {idx + 1}. {comment.point}
                                  </div>
                                  <div className="text-sm text-muted-foreground mb-3">
                                    {comment.observation}
                                  </div>
                                  
                                  {/* Radio buttons para calibración */}
                                  <div className="flex gap-3 mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`${section.id}-${comment.id}`}
                                        checked={currentResponse === 'approve'}
                                        onChange={() => handleCalibrationResponse(section.id, comment.id, 'approve')}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-sm">✅ Aprobar</span>
                                    </label>
                                    
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`${section.id}-${comment.id}`}
                                        checked={currentResponse === 'modify'}
                                        onChange={() => handleCalibrationResponse(section.id, comment.id, 'modify')}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-sm">✏️ Modificar</span>
                                    </label>
                                    
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`${section.id}-${comment.id}`}
                                        checked={currentResponse === 'reject'}
                                        onChange={() => handleCalibrationResponse(section.id, comment.id, 'reject')}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-sm">❌ Rechazar</span>
                                    </label>
                                  </div>
                                  
                                  {/* Textarea para nota (obligatoria si modificar/rechazar, opcional si aprobar) */}
                                  {currentResponse && (
                                    <div className="mt-2">
                                      <label className="text-xs text-muted-foreground mb-1 block">
                                        {currentResponse === 'approve' && '💬 Comentario (opcional):'}
                                        {currentResponse === 'modify' && '✏️ Especifica la modificación (obligatorio):'}
                                        {currentResponse === 'reject' && '⚠️ Justifica el rechazo (obligatorio):'}
                                      </label>
                                      <StandardTextarea
                                        value={currentNote}
                                        onChange={(e) => handleCalibrationNote(section.id, comment.id, e.target.value)}
                                        placeholder={
                                          currentResponse === 'approve' 
                                            ? 'Ej: ¡Qué gran idea!' 
                                            : currentResponse === 'modify'
                                            ? 'Ej: Reforzar con ejemplo de ChatGPT en medicina'
                                            : 'Ej: No aplica a mi audiencia técnica'
                                        }
                                        rows={2}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Progreso de calibración */}
                          <div className="text-xs text-muted-foreground">
                            {(() => {
                              const totalComments = analysis.comments.length;
                              const calibratedComments = analysis.comments.filter(c => 
                                calibrations[section.id]?.[c.id]?.response
                              ).length;
                              return `📊 Progreso: ${calibratedComments}/${totalComments} comentarios calibrados`;
                            })()}
                          </div>

                          <div className="flex gap-2">
                            <StandardButton
                              size="sm"
                              colorScheme="success"
                              onClick={() => handleExecuteVersion(section.id)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Sparkles className="w-4 h-4 animate-spin" /> : '🚀'} Ejecutar Nueva Versión
                            </StandardButton>
                            <StandardButton
                              size="sm"
                              colorScheme="neutral"
                              onClick={() => {
                                const text = analysis.comments.map(c => `${c.point}: ${c.observation}`).join('\n\n');
                                navigator.clipboard.writeText(text);
                                toast({ title: '📋 Copiado', description: 'Comentarios copiados al portapapeles' });
                              }}
                            >
                              📋 Copiar
                            </StandardButton>
                          </div>
                        </div>
                      </StandardCard>
                    )}

                    {/* Historial de versiones */}
                    <StandardCard colorScheme="neutral" className="mt-4 p-3">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">📜 Historial de Versiones</h4>
                        <div className="space-y-1 text-sm">
                          {section.versions.map((v: MockVersion) => (
                            <div key={v.version} className="flex items-center gap-2 text-muted-foreground">
                              <span className="font-mono">v{v.version}</span>
                              {v.version === section.version && (
                                <StandardBadge colorScheme="success" size="xs">actual</StandardBadge>
                              )}
                              {v.archetype && (
                                <span>{getArchetypeEmoji(v.archetype)} {getArchetypeName(v.archetype)}</span>
                              )}
                              <span className="ml-auto">{v.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </StandardCard>
                  </div>
                )}
              </StandardCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
