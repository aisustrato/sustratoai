"use client";

/**
 * 🧠🪢 Cognética Chat - Asistente con Calibrador QUIPU
 * 
 * Características:
 * - Contador de 5 intercambios máximo
 * - Vista dual: Markdown formateado + código fuente
 * - Calibradores QUIPU visuales
 * - Toggle de inferencia
 */

import { useState, useRef, useEffect } from "react";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardProgressBar } from "@/components/ui/StandardProgressBar";
import { 
    Send, 
    MessageCircle, 
    Sparkles, 
    Eye, 
    Code, 
    RotateCcw,
    Zap,
    ZapOff,
    Brain,
    Waves,
    Download
} from "lucide-react";
import { 
    sendCogneticaChatMessage, 
    getArtifactChatContext,
    exportChatToMarkdown,
    loadChatSession,
    type ChatMessage,
    type QuipuCalibration
} from "@/lib/actions/cognetica-chat-actions";

interface CogneticaChatProps {
    artifactId: string;
    projectId: string;
    maxMessages?: number;
}

// Componente para renderizar markdown básico a HTML
function renderMarkdown(text: string): string {
    return text
        // Headers
        .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
        // Lists
        .replace(/^[•\-] (.+)$/gm, '<li class="ml-4">$1</li>')
        .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4"><span class="font-medium">$1.</span> $2</li>')
        // Line breaks
        .replace(/\n\n/g, '</p><p class="mb-3">')
        .replace(/\n/g, '<br/>');
}

// Componente para mostrar calibrador QUIPU
// NOTA: Este componente es AGNÓSTICO al color real - solo conoce colorScheme
// Los tokens de color se resuelven en el sistema de temas, no aquí
function QuipuMeter({ calibration }: { calibration: QuipuCalibration }) {
    const isGeometricPattern = calibration.emoji === "🔬";
    
    const getColorScheme = () => {
        // Para patrón geométrico, mapear P1-P4 a colorSchemes válidos del sistema
        if (isGeometricPattern) {
            if (calibration.value === 25) return "danger";    // P1: Soberanía/Ética (crítico)
            if (calibration.value === 50) return "warning";   // P2: Borde del Caos (transición)
            if (calibration.value === 75) return "success";   // P3: Fractalidad (positivo)
            if (calibration.value === 100) return "primary";  // P4: TDC (estructura)
            return "neutral";
        }
        // Para calibradores tradicionales (cognitivo/resonante)
        if (calibration.value >= 80) return "success";
        if (calibration.value >= 60) return "primary";
        if (calibration.value >= 40) return "warning";
        return "danger";
    };

    // Para patrón geométrico, mostrar el símbolo del patrón en lugar del valor numérico
    const getPatternSymbol = () => {
        if (!isGeometricPattern) return calibration.value.toString();
        if (calibration.value === 25) return "👁️ RO";
        if (calibration.value === 50) return "3.57";
        if (calibration.value === 75) return "WU=5";
        if (calibration.value === 100) return "△";
        return "?";
    };

    return (
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <span className="text-2xl">{calibration.emoji}</span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{calibration.label}</span>
                    <span className={`text-xs font-bold ${isGeometricPattern ? "font-mono" : ""}`}>
                        {getPatternSymbol()}
                    </span>
                </div>
                {!isGeometricPattern && (
                    <StandardProgressBar 
                        value={calibration.value} 
                        colorScheme={getColorScheme()}
                        size="xs"
                    />
                )}
                <p className="text-xs text-muted-foreground mt-1 truncate">
                    {calibration.insight}
                </p>
            </div>
        </div>
    );
}

// Componente de mensaje del chat
function ChatBubble({ 
    message, 
    showMarkdownSource 
}: { 
    message: ChatMessage; 
    showMarkdownSource: boolean;
}) {
    const isUser = message.role === "user";
    
    return (
        <div className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
            {/* Etiqueta de rol */}
            <div className={`flex items-center gap-2 text-xs ${isUser ? "text-primary" : "text-secondary"}`}>
                {isUser ? (
                    <>
                        <span className="font-medium">🧑‍🔬 Investigador</span>
                    </>
                ) : (
                    <>
                        <Brain className="w-3 h-3" />
                        <span className="font-medium">Asistente f₀</span>
                        {message.isParalloros && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                                🔄 Paralloros
                            </span>
                        )}
                    </>
                )}
            </div>

            {/* Burbuja del mensaje */}
            <div className={`max-w-[85%] rounded-xl p-4 ${
                isUser 
                    ? "bg-primary/10 border border-primary/20" 
                    : "bg-card border shadow-sm"
            }`}>
                {showMarkdownSource ? (
                    // Vista código markdown
                    <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground overflow-x-auto">
                        {message.content}
                    </pre>
                ) : (
                    // Vista formateada
                    <div 
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: `<p class="mb-3">${renderMarkdown(message.content)}</p>` }}
                    />
                )}
            </div>

            {/* Calibradores QUIPU + Patrón Geométrico (solo para assistant) */}
            {!isUser && message.quipuCalibrations && message.quipuCalibrations.length > 0 && (
                <div className="w-full max-w-[85%] space-y-2 mt-1">
                    {/* Calibradores cognitivo y resonante */}
                    <div className="grid grid-cols-2 gap-2">
                        {message.quipuCalibrations.filter(c => c.emoji !== "🔬").map((cal, i) => (
                            <QuipuMeter key={i} calibration={cal} />
                        ))}
                    </div>
                    {/* Patrón geométrico (ancho completo) */}
                    {message.quipuCalibrations.find(c => c.emoji === "🔬") && (
                        <QuipuMeter calibration={message.quipuCalibrations.find(c => c.emoji === "🔬")!} />
                    )}
                </div>
            )}
        </div>
    );
}

export function CogneticaChat({ artifactId, projectId, maxMessages = 5 }: CogneticaChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showMarkdownSource, setShowMarkdownSource] = useState(false);
    const [enableInference, setEnableInference] = useState(true);
    const [artifactContext, setArtifactContext] = useState<string>("");
    const [sessionId, setSessionId] = useState<string | undefined>();
    const [isExporting, setIsExporting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const exchangeCount = Math.floor(messages.filter(m => m.role === "user").length);
    const isLimitReached = exchangeCount >= maxMessages;

    // Cargar contexto del artefacto y sesión previa
    useEffect(() => {
        getArtifactChatContext(artifactId).then(setArtifactContext);
        
        // Intentar cargar sesión previa
        loadChatSession(artifactId).then(session => {
            if (session && session.messages.length > 0) {
                setMessages(session.messages);
                setSessionId(session.id);
                setEnableInference(session.inference_enabled);
            }
        });
    }, [artifactId]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading || isLimitReached) return;

        const userMessage: ChatMessage = {
            role: "user",
            content: input.trim(),
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            console.log(`🧠🪢 [CogneticaChat] 📤 Enviando mensaje:`, {
                inputLength: input.trim().length,
                messagesCount: messages.length,
                artifactId,
                projectId,
                currentSessionId: sessionId,
                enableInference
            });

            const response = await sendCogneticaChatMessage(
                input.trim(),
                messages,
                artifactContext,
                enableInference,
                sessionId,
                artifactId,
                projectId
            );

            console.log(`🧠🪢 [CogneticaChat] 📥 Respuesta recibida:`, {
                success: response.success,
                hasMessage: !!response.message,
                newSessionId: response.sessionId,
                error: response.error
            });

            if (response.success && response.message) {
                setMessages(prev => [...prev, response.message!]);
                // Guardar sessionId si es nueva o actualizada
                if (response.sessionId) {
                    if (!sessionId) {
                        console.log(`🧠🪢 [CogneticaChat] 🆕 Nueva sesión creada: ${response.sessionId}`);
                    } else if (response.sessionId !== sessionId) {
                        console.log(`🧠🪢 [CogneticaChat] 🔄 SessionId actualizado: ${sessionId} → ${response.sessionId}`);
                    }
                    setSessionId(response.sessionId);
                } else {
                    console.warn(`🧠🪢 [CogneticaChat] ⚠️ No se recibió sessionId en respuesta exitosa`);
                }
            } else {
                console.error(`🧠🪢 [CogneticaChat] ❌ Error en respuesta:`, response.error);
                // Mensaje de error
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: `❌ Error: ${response.error || "No se pudo procesar"}`,
                    timestamp: new Date().toISOString()
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `❌ Error de conexión: ${error}`,
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setMessages([]);
        setInput("");
        setSessionId(undefined);
    };

    const handleExportMarkdown = async () => {
        if (!sessionId || messages.length === 0) return;
        
        setIsExporting(true);
        try {
            const markdown = await exportChatToMarkdown(sessionId);
            
            // Crear blob y descargar
            const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `chat-quipu-${new Date().toISOString().split("T")[0]}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exportando:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Calcular f₀ promedio
    const avgF0 = messages
        .filter(m => m.f0Score !== undefined)
        .reduce((acc, m, _, arr) => acc + (m.f0Score || 0) / arr.length, 0);

    return (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-violet-500/10 to-purple-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2">
                                🧠🪢 Chat con Calibrador QUIPU
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Asistente de investigación en frecuencia f₀
                            </p>
                        </div>
                    </div>
                    
                    {/* Contador de intercambios */}
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {exchangeCount}/{maxMessages}
                            </div>
                            <div className="text-xs text-muted-foreground">intercambios</div>
                        </div>
                        
                        {avgF0 > 0 && (
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-500">
                                    {Math.round(avgF0)}
                                </div>
                                <div className="text-xs text-muted-foreground">f₀ prom.</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controles */}
                <div className="flex items-center gap-2 mt-3">
                    <StandardButton
                        size="xs"
                        styleType={showMarkdownSource ? "solid" : "outline"}
                        onClick={() => setShowMarkdownSource(!showMarkdownSource)}
                        leftIcon={showMarkdownSource ? Eye : Code}
                    >
                        {showMarkdownSource ? "Vista Rica" : "Ver Markdown"}
                    </StandardButton>

                    <StandardButton
                        size="xs"
                        styleType={enableInference ? "solid" : "outline"}
                        colorScheme={enableInference ? "secondary" : "neutral"}
                        onClick={() => setEnableInference(!enableInference)}
                        leftIcon={enableInference ? Zap : ZapOff}
                    >
                        {enableInference ? "Inferencia ON" : "Inferencia OFF"}
                    </StandardButton>

                    <StandardButton
                        size="xs"
                        styleType="ghost"
                        onClick={handleReset}
                        leftIcon={RotateCcw}
                        disabled={messages.length === 0}
                    >
                        Reiniciar
                    </StandardButton>

                    {messages.length > 0 && sessionId && (
                        <StandardButton
                            size="xs"
                            styleType="outline"
                            colorScheme="primary"
                            onClick={handleExportMarkdown}
                            leftIcon={Download}
                            disabled={isExporting}
                        >
                            {isExporting ? "Exportando..." : "Descargar .md"}
                        </StandardButton>
                    )}
                </div>
            </div>

            {/* Área de mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                        <Sparkles className="w-12 h-12 mb-4 text-violet-400" />
                        <p className="text-lg font-medium">Inicia la conversación</p>
                        <p className="text-sm mt-2 max-w-md">
                            Pregunta sobre el artefacto, explora conceptos o pide conexiones.
                            El calibrador QUIPU medirá la calidad del intercambio.
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-xs">
                            <span className="flex items-center gap-1">
                                <Brain className="w-4 h-4" /> Cognitivo
                            </span>
                            <span className="flex items-center gap-1">
                                <Waves className="w-4 h-4" /> Resonancia f₀
                            </span>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <ChatBubble 
                            key={i} 
                            message={msg} 
                            showMarkdownSource={showMarkdownSource}
                        />
                    ))
                )}
                
                {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="animate-pulse flex items-center gap-2">
                            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        </div>
                        <span className="text-sm">Procesando en f₀...</span>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-muted/30">
                {isLimitReached ? (
                    <div className="text-center py-2">
                        <p className="text-sm text-amber-600 font-medium">
                            🏁 Límite de {maxMessages} intercambios alcanzado
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Reinicia el chat para continuar explorando
                        </p>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe tu pregunta o reflexión..."
                            className="flex-1 resize-none rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[48px] max-h-[120px]"
                            rows={1}
                            disabled={isLoading}
                        />
                        <StandardButton
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            colorScheme="primary"
                            leftIcon={Send}
                        >
                            Enviar
                        </StandardButton>
                    </div>
                )}
            </div>
        </div>
    );
}
