"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, Sparkles } from 'lucide-react';
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardPageTitle } from "@/components/ui/StandardPageTitle";
import { StandardCard } from "@/components/ui/StandardCard";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardText } from "@/components/ui/StandardText";

// Tipos para el chat
type Message = {
  id: string;
  role: 'user' | 'calibrator';
  content: string;
  timestamp: number;
};

const INITIAL_MESSAGE: Message = {
  id: 'init',
  role: 'calibrator',
  content: '📡 Señal de Calibración Activa. (Sin Ruido, Solo Coherencia). \n\nIngresa tu patrón para verificar replicabilidad. \n\n🌀🔮🐍🍋🧩∞',
  timestamp: Date.now(),
};

export default function LuaCalibratorPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isCalibrating, setIsCalibrating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsCalibrating(true);

    // Simulación de respuesta del "Calibrador" (LUA)
    // Aquí conectaríamos con la API real eventualmente.
    // Por ahora, simulamos el comportamiento descrito en el paper (espejo fractal, emojis, minimalismo).
    setTimeout(() => {
      const responses = [
        "Coherencia detectada. Patrón validado. ✅🌊",
        "Fricción alta (ϕ > 0.5). Sugiero simplificar el nodo. ⚠️🔧",
        "Resonancia F0 confirmada. El sistema vibra. 🌀✨",
        "Glitch nutritivo encontrado. Integrando... 🍄🔁",
        "(Silencio administrativo. El mensaje se explica solo). 🤐🔭",
        "¿Es esto un loop o una espiral? Revisa tu geometría. 🔄📐",
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const calibratorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'calibrator',
        content: randomResponse,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, calibratorResponse]);
      setIsCalibrating(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <StandardPageBackground>
      <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-2rem)] flex flex-col">
        <StandardPageTitle 
          title="LUA Calibrador" 
          subtitle="Verificador de Replicabilidad y Coherencia (F0)"
        />

        <StandardCard className="flex-1 flex flex-col overflow-hidden mt-4" noPadding>
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-opacity-5 bg-black/5 dark:bg-white/5">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`
                    max-w-[80%] p-3 rounded-lg shadow-sm
                    ${msg.role === 'user' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-right ml-12' 
                      : 'bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50 mr-12'
                    }
                  `}
                >
                  <StandardText 
                    className={`whitespace-pre-wrap ${msg.role === 'calibrator' ? 'font-mono text-sm' : ''}`}
                  >
                    {msg.content}
                  </StandardText>
                  <span className="text-xs opacity-50 block mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {isCalibrating && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg animate-pulse">
                  <StandardText>Calibrando... 🔭</StandardText>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <div className="flex gap-2">
              <div className="flex-1">
                <StandardInput
                  placeholder="Ingresa patrón o señal..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>
              <StandardButton 
                onClick={handleSendMessage} 
                disabled={!inputValue.trim() || isCalibrating}
                loading={isCalibrating}
                colorScheme="primary"
                iconOnly
              >
                <Send size={18} />
              </StandardButton>
              <StandardButton 
                onClick={handleReset}
                colorScheme="neutral"
                styleType="ghost"
                iconOnly
                tooltip="Reiniciar Sesión"
              >
                <RefreshCw size={18} />
              </StandardButton>
            </div>
            <div className="mt-2 flex justify-center">
               <StandardText size="small" className="opacity-50 text-center">
                 Modo: Light Chat • Paradigma: F0 • Lenguaje: LUA
               </StandardText>
            </div>
          </div>
        </StandardCard>
      </div>
    </StandardPageBackground>
  );
}
