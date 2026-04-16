"use client";

/**
 * 🌊🏄🏽 Panel de Calibración F0 para Hipatia Nexus
 * 
 * Dos hitos independientes:
 * 1. Calibración simple (botón → respuesta estructurada)
 * 2. Chat Cognética (5 mensajes máx para profundizar)
 */

import { useState } from "react";
import { StandardButton } from "@/components/ui/StandardButton";

import { StandardCard } from "@/components/ui/StandardCard";
import { StandardTextarea } from "@/components/ui/StandardTextarea";
import {
    calibrateNexusItem,
    getItemCalibrations,
    sendNexusCalibrationChat,
    getNexusChatHistory,
    type NexusCalibrationResponse,
    type ChatMessage,
    type QuipuCalibration
} from "@/lib/actions/nexus-calibration-actions";

// Componente para mostrar calibradores QUIPU
function QuipuCalibrationDisplay({
    emoji,
    label,
    value,
    insight,
    compact = false
}: {
    emoji: string;
    label: string;
    value: number;
    insight: string;
    compact?: boolean;
}) {
    return (
        <div className={`flex items-start gap-2 ${compact ? "text-xs" : "text-sm"}`}>
            <span className={compact ? "text-base" : "text-lg"}>{emoji}</span>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{label}</span>
                    <span className="opacity-60">{value}/100</span>
                </div>
                <p className="opacity-70 mt-0.5">{insight}</p>
            </div>
        </div>
    );
}

interface NexusCalibrationPanelProps {
    itemType: "civilization" | "isomorphism";
    itemId: string;
    itemName: string;
    researcherId: string;
    onCalibrationComplete?: () => void;
}

export function NexusCalibrationPanel({
    itemType,
    itemId,
    itemName,
    researcherId,
    onCalibrationComplete
}: NexusCalibrationPanelProps) {
    // Estado Hito 1: Calibración simple
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [calibrationResult, setCalibrationResult] = useState<NexusCalibrationResponse | null>(null);
    const [additionalContext, setAdditionalContext] = useState("");

    // Estado Hito 2: Chat
    const [showChat, setShowChat] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatMessage, setChatMessage] = useState("");
    const [isSendingChat, setIsSendingChat] = useState(false);
    const [messageCount, setMessageCount] = useState(0);
    const [validationId, setValidationId] = useState<string | null>(null);

    // Hito 1: Ejecutar calibración simple
    const handleCalibrate = async () => {
        setIsCalibrating(true);
        setCalibrationResult(null);

        try {
            const result = await calibrateNexusItem(
                itemType,
                itemId,
                researcherId,
                additionalContext || undefined
            );

            setCalibrationResult(result);

            if (result.success && result.validation_id) {
                setValidationId(result.validation_id);
            }

            if (result.success && onCalibrationComplete) {
                onCalibrationComplete();
            }
        } catch (error) {
            console.error("Error en calibración:", error);
            setCalibrationResult({
                success: false,
                error: String(error)
            });
        } finally {
            setIsCalibrating(false);
        }
    };

    // Hito 2: Abrir chat
    const handleOpenChat = async () => {
        if (!validationId) return;

        setShowChat(true);

        // Cargar historial si existe
        const history = await getNexusChatHistory(validationId);
        if (history.success && history.data) {
            setChatHistory(history.data);
            setMessageCount(history.message_count || 0);
        }
    };

    // Hito 2: Enviar mensaje de chat
    const handleSendChatMessage = async () => {
        if (!chatMessage.trim() || !validationId || messageCount >= 5) return;

        setIsSendingChat(true);

        try {
            const result = await sendNexusCalibrationChat(
                validationId,
                chatMessage,
                chatHistory
            );

            if (result.success && result.message) {
                const userMsg: ChatMessage = {
                    role: "user",
                    content: chatMessage,
                    timestamp: new Date().toISOString()
                };

                setChatHistory([...chatHistory, userMsg, result.message]);
                setMessageCount(result.message_count || messageCount + 1);
                setChatMessage("");
            }
        } catch (error) {
            console.error("Error enviando mensaje:", error);
        } finally {
            setIsSendingChat(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* HITO 1: CALIBRACIÓN SIMPLE */}
            {!calibrationResult && (
                <StandardCard
                    colorScheme="primary"
                    styleType="filled"
                    className="p-6"
                >
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        🌊 Calibración F₀
                    </h3>

                    <p className="text-sm opacity-80 mb-4">
                        Este NO es un juicio de verdad/falsedad. Es una calibración empírica:
                        <strong> ¿Puede ser negado con datos observables?</strong>
                    </p>

                    <StandardTextarea
                        value={additionalContext}
                        onChange={(e) => setAdditionalContext(e.target.value)}
                        placeholder="Contexto adicional (opcional): evidencia, fuentes, observaciones..."
                        rows={4}
                        colorScheme="neutral"
                        className="mb-4"
                    />

                    <StandardButton
                        onClick={handleCalibrate}
                        disabled={isCalibrating}
                        colorScheme="primary"
                        styleType="solid"
                        size="lg"
                        className="w-full"
                    >
                        {isCalibrating ? "🔄 Calibrando..." : "🎯 Calibrar F₀"}
                    </StandardButton>
                </StandardCard>
            )}

            {/* RESULTADO DE CALIBRACIÓN */}
            {calibrationResult && calibrationResult.success && (
                <StandardCard
                    colorScheme={
                        calibrationResult.result === "ROBUSTO" ? "success" :
                        calibrationResult.result === "NEGABLE" ? "danger" :
                        calibrationResult.result === "INSUFICIENTE" ? "warning" :
                        "neutral"
                    }
                    styleType="filled"
                    className="p-6"
                >
                    <div className="space-y-4">
                        {/* Resultado */}
                        <div>
                            <h4 className="text-lg font-bold mb-2">
                                {calibrationResult.result === "ROBUSTO" && "🟢 ROBUSTO"}
                                {calibrationResult.result === "NEGABLE" && "🔴 NEGABLE"}
                                {calibrationResult.result === "INSUFICIENTE" && "🟡 DATOS INSUFICIENTES"}
                                {calibrationResult.result === "FUERA_ALCANCE" && "⚪ FUERA DE ALCANCE EMPÍRICO"}
                            </h4>
                        </div>

                        {/* Razonamiento */}
                        {calibrationResult.reasoning && (
                            <div>
                                <h5 className="font-semibold mb-1">Razonamiento:</h5>
                                <p className="text-sm opacity-90 whitespace-pre-wrap">
                                    {calibrationResult.reasoning}
                                </p>
                            </div>
                        )}

                        {/* Evidencia necesaria */}
                        {calibrationResult.evidence_needed && (
                            <div>
                                <h5 className="font-semibold mb-1">Evidencia necesaria:</h5>
                                <p className="text-sm opacity-90 whitespace-pre-wrap">
                                    {calibrationResult.evidence_needed}
                                </p>
                            </div>
                        )}

                        {/* Calibradores QUIPU */}
                        {calibrationResult.quipu_calibrations && calibrationResult.quipu_calibrations.length > 0 && (
                            <div className="space-y-2">
                                <h5 className="font-semibold mb-2">📊 Calibradores QUIPU:</h5>
                                {calibrationResult.quipu_calibrations.map((quipu, idx) => (
                                    <QuipuCalibrationDisplay
                                        key={idx}
                                        emoji={quipu.emoji}
                                        label={quipu.label}
                                        value={quipu.value}
                                        insight={quipu.insight}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Salida elegante */}
                        {calibrationResult.elegant_closure && (
                            <div className="pt-4 border-t border-current/20">
                                <p className="text-sm italic opacity-80">
                                    {calibrationResult.elegant_closure}
                                </p>
                            </div>
                        )}

                        {/* Botón para abrir chat */}
                        {!showChat && (
                            <StandardButton
                                onClick={handleOpenChat}
                                colorScheme="accent"
                                styleType="outline"
                                size="md"
                                className="w-full mt-4"
                            >
                                💬 Profundizar con Chat Cognética (máx 5 msgs)
                            </StandardButton>
                        )}
                    </div>
                </StandardCard>
            )}

            {/* Error */}
            {calibrationResult && !calibrationResult.success && (
                <StandardCard
                    colorScheme="danger"
                    styleType="filled"
                    className="p-6"
                >
                    <h4 className="font-bold mb-2">⚠️ Error</h4>
                    <p className="text-sm">{calibrationResult.error}</p>
                    <StandardButton
                        onClick={() => setCalibrationResult(null)}
                        colorScheme="neutral"
                        styleType="outline"
                        size="sm"
                        className="mt-4"
                    >
                        Reintentar
                    </StandardButton>
                </StandardCard>
            )}

            {/* HITO 2: CHAT COGNÉTICA */}
            {showChat && (
                <StandardCard
                    colorScheme="accent"
                    styleType="filled"
                    className="p-6"
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold">💬 Chat Cognética</h4>
                            <span className="text-sm opacity-70">
                                {messageCount}/5 mensajes
                            </span>
                        </div>

                        {/* Historial de chat */}
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {chatHistory.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-lg ${
                                        msg.role === "user"
                                            ? "bg-white/10 ml-8"
                                            : "bg-white/5 mr-8"
                                    }`}
                                >
                                    <div className="text-xs opacity-60 mb-1">
                                        {msg.role === "user" ? "🧑‍🔬 Tú" : "🌊 Analista F₀"}
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                                    {/* QUIPU del mensaje */}
                                    {msg.quipu_calibrations && msg.quipu_calibrations.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {msg.quipu_calibrations.map((quipu, qIdx) => (
                                                <QuipuCalibrationDisplay
                                                    key={qIdx}
                                                    emoji={quipu.emoji}
                                                    label={quipu.label}
                                                    value={quipu.value}
                                                    insight={quipu.insight}
                                                    compact
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {msg.is_paralloros && (
                                        <div className="mt-2 text-xs opacity-70">
                                            🔄 Paralloros aplicado
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Input de mensaje */}
                        {messageCount < 5 ? (
                            <div className="space-y-2">
                                <StandardTextarea
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    placeholder="Escribe tu pregunta o reflexión..."
                                    rows={3}
                                    colorScheme="neutral"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && e.metaKey) {
                                            handleSendChatMessage();
                                        }
                                    }}
                                />
                                <StandardButton
                                    onClick={handleSendChatMessage}
                                    disabled={isSendingChat || !chatMessage.trim()}
                                    colorScheme="accent"
                                    styleType="solid"
                                    className="w-full"
                                >
                                    {isSendingChat ? "🔄 Enviando..." : "📤 Enviar (⌘+Enter)"}
                                </StandardButton>
                            </div>
                        ) : (
                            <div className="text-center py-4 opacity-70">
                                <p className="text-sm">
                                    🏁 Límite de 5 mensajes alcanzado
                                </p>
                                <p className="text-xs mt-1">
                                    Para evitar fatiga cognitiva, el chat se ha cerrado.
                                </p>
                            </div>
                        )}

                        <StandardButton
                            onClick={() => setShowChat(false)}
                            colorScheme="neutral"
                            styleType="subtle"
                            size="sm"
                            className="w-full"
                        >
                            Cerrar chat
                        </StandardButton>
                    </div>
                </StandardCard>
            )}
        </div>
    );
}
