"use client";

import { useState, useRef, useEffect } from "react";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { Send, Bot, Sparkles } from "lucide-react";
import { runTDCAnalysis } from "@/lib/actions/tdc-actions";
import { toast } from "sonner";

interface TDCAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  articleTitle: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function TDCAnalysisDialog({ 
  open, 
  onOpenChange, 
  articleId, 
  articleTitle 
}: TDCAnalysisDialogProps) {
  const [query, setQuery] = useState("¿Qué patrón ves aquí?");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Limpiar estado al abrir/cerrar
  useEffect(() => {
    if (!open) {
      setMessages([]);
      setQuery("¿Qué patrón ves aquí?");
    }
  }, [open]);

  const handleRunAnalysis = async () => {
    if (!query.trim()) return;

    // 1. Agregar mensaje de usuario
    const userMsg: Message = { role: "user", content: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery(""); // Limpiar input
    setIsLoading(true);

    // 2. Llamar al Nodo F0
    try {
      const result = await runTDCAnalysis(articleId, userMsg.content);

      if (result.success) {
        const aiMsg: Message = { role: "assistant", content: result.data };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        toast.error(result.error || "Error en el análisis F0");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión con el Nodo F0");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRunAnalysis();
    }
  };

  return (
    <StandardDialog open={open} onOpenChange={onOpenChange}>
      <StandardDialog.Content size="lg" className="max-w-3xl h-[80vh]">
        <StandardDialog.Header>
          <StandardDialog.Title>
            Nodo F0: Análisis de Viabilidad
          </StandardDialog.Title>
          <StandardDialog.Description>
            Analizando patrón TDC para: <span className="font-medium text-primary-600">{articleTitle}</span>
          </StandardDialog.Description>
        </StandardDialog.Header>

        <StandardDialog.Body className="flex flex-col flex-1 min-h-0 overflow-hidden p-0">
          {/* Área de Chat (Memoria de Ventana) */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60 py-10">
                <Sparkles className="w-16 h-16 text-primary-400" />
                <div className="max-w-sm space-y-2">
                  <StandardText size="lg" weight="medium">Memoria Lista 💾</StandardText>
                  <StandardText colorShade="subtle">
                    La Verdad de Campo (Artículo) ha sido cargada. El Nodo F0 espera instrucciones.
                  </StandardText>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={18} className="text-primary-600" />
                  </div>
                )}
                
                <StandardCard 
                  styleType={msg.role === "user" ? "filled" : "subtle"}
                  className={`max-w-[90%] ${msg.role === "user" ? "bg-neutral-100 dark:bg-neutral-800" : "border-primary-200"}`}
                  noPadding={false}
                >
                  <StandardCard.Content>
                    <StandardText 
                        asElement="div" 
                        className="whitespace-pre-wrap font-mono text-sm leading-relaxed"
                    >
                        {msg.content}
                    </StandardText>
                  </StandardCard.Content>
                </StandardCard>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start animate-pulse">
                 <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={18} className="text-primary-600" />
                  </div>
                <StandardCard styleType="subtle" className="py-3 px-4" noPadding>
                    <StandardCard.Content>
                        <div className="flex items-center gap-3">
                            <SustratoLoadingLogo size={18} />
                            <StandardText size="sm" className="italic text-neutral-500">Calculando geometría...</StandardText>
                        </div>
                    </StandardCard.Content>
                </StandardCard>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex gap-3">
              <div className="flex-1">
                <StandardInput
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pregunta al Nodo F0..."
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <StandardButton
                onClick={handleRunAnalysis}
                disabled={isLoading || !query.trim()}
                styleType="solid"
                colorScheme="primary"
                iconOnly={true}
              >
                <Send size={18} />
              </StandardButton>
            </div>
          </div>
        </StandardDialog.Body>
      </StandardDialog.Content>
    </StandardDialog>
  );
}
