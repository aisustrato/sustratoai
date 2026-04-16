"use client";

// 📍 app/cognetica/[id]/ChroniclePanel.tsx
// 🎯 PROPÓSITO: Botón de activación, dialog de confirmación y visualización
//              de la Crónica Forense (Metabolización Crónica Micelio) de un artefacto.
// 🔧 DECISIÓN: Client Component que llama a POST /api/cognetica/chronicle/[artifactId]
//              y muestra el resultado en 3 pestañas: Extendida / Destilada / Crónica.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardDialog } from "@/components/ui/StandardDialog";

interface ChronicleData {
  ejecutado_en: string;
  version_extendida: string;
  version_destilada: string;
  cronica: string;
  semillas_clave: string[];
  tension_central: string;
  nota_cronista: string;
  stats: {
    semillas_input: number;
    pensadores_input: number;
    disciplinas_input: number;
    chars_texto: number;
  };
}

interface ChroniclePanelProps {
  artifactId: string;
  hasTextContent: boolean;
  initialChronicle: ChronicleData | null;
}

type TabKey = "extendida" | "destilada" | "cronica";

export function ChroniclePanel({
  artifactId,
  hasTextContent,
  initialChronicle,
}: ChroniclePanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [chronicle, setChronicle] = useState<ChronicleData | null>(initialChronicle);
  const [activeTab, setActiveTab] = useState<TabKey>("cronica");
  const [showResult, setShowResult] = useState(!!initialChronicle);
  const router = useRouter();

  const handleRunChronicle = async () => {
    setIsRunning(true);
    toast.info("🍄 Iniciando metabolización crónica forense...", {
      id: "chronicle-toast",
      duration: 30000,
    });

    try {
      const res = await fetch(`/api/cognetica/chronicle/${artifactId}`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(`Error: ${json.error || "Fallo desconocido"}`, { id: "chronicle-toast" });
        return;
      }

      setChronicle(json.data);
      setShowResult(true);
      setActiveTab("cronica");
      toast.success("✅ Crónica forense completada", { id: "chronicle-toast" });
      router.refresh();
    } catch (err) {
      toast.error(`Error inesperado: ${err}`, { id: "chronicle-toast" });
    } finally {
      setIsRunning(false);
    }
  };

  const tabs: { key: TabKey; label: string; emoji: string }[] = [
    { key: "cronica", label: "Crónica", emoji: "📜" },
    { key: "destilada", label: "Destilada", emoji: "💧" },
    { key: "extendida", label: "Extendida", emoji: "🔬" },
  ];

  const tabContent: Record<TabKey, string> = {
    cronica: chronicle?.cronica || "",
    destilada: chronicle?.version_destilada || "",
    extendida: chronicle?.version_extendida || "",
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">🍄</span>
          <div>
            <p className="font-semibold text-emerald-900">
              Micelio Cronista Forense
            </p>
            <p className="text-sm text-emerald-700">
              Metabolización crónica del corpus completo del artefacto
            </p>
          </div>
        </div>

        {/* Botón debajo del título */}
        {chronicle ? (
          <StandardDialog>
            <StandardDialog.Trigger asChild>
              <StandardButton
                colorScheme="success"
                styleType="outline"
                size="sm"
                leftIcon={RefreshCw}
                disabled={isRunning || !hasTextContent}
              >
                Re-metabolizar
              </StandardButton>
            </StandardDialog.Trigger>
            <StandardDialog.Content colorScheme="warning" size="sm">
              <StandardDialog.Header>
                <StandardDialog.Title>⚠️ Re-ejecutar Crónica Forense</StandardDialog.Title>
                <StandardDialog.Description>
                  Ya existe una crónica generada el{" "}
                  {new Date(chronicle.ejecutado_en).toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                  . Re-ejecutar la sobreescribirá con una nueva versión.
                </StandardDialog.Description>
              </StandardDialog.Header>
              <StandardDialog.Footer>
                <StandardDialog.Close asChild>
                  <StandardButton colorScheme="neutral" styleType="outline" size="sm">
                    Cancelar
                  </StandardButton>
                </StandardDialog.Close>
                <StandardDialog.Close asChild>
                  <StandardButton
                    colorScheme="warning"
                    styleType="solid"
                    size="sm"
                    leftIcon={RefreshCw}
                    onClick={handleRunChronicle}
                  >
                    Sí, re-metabolizar
                  </StandardButton>
                </StandardDialog.Close>
              </StandardDialog.Footer>
            </StandardDialog.Content>
          </StandardDialog>
        ) : (
          <StandardButton
            colorScheme="success"
            styleType="solid"
            size="sm"
            leftIcon={Loader2}
            onClick={handleRunChronicle}
            disabled={isRunning || !hasTextContent}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Metabolizando...
              </>
            ) : (
              "Escándalo epistemológico"
            )}
          </StandardButton>
        )}
      </div>

      {/* Aviso si no hay contenido textual */}
      {!hasTextContent && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ El artefacto necesita transcripción o texto procesado antes de poder metabolizarse.
        </p>
      )}

      {/* Spinner mientras corre */}
      {isRunning && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-100 rounded-lg px-3 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          La red subterránea está metabolizando el corpus...
        </div>
      )}

      {/* Resultado visible */}
      {chronicle && showResult && !isRunning && (
        <div className="space-y-3">
          {/* Tensión central */}
          {chronicle.tension_central && (
            <div className="bg-white/80 border border-emerald-200 rounded-lg px-4 py-3">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                Tensión Central
              </p>
              <p className="text-sm text-slate-800 italic">{chronicle.tension_central}</p>
            </div>
          )}

          {/* Semillas clave */}
          {chronicle.semillas_clave?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {chronicle.semillas_clave.map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded-full border border-emerald-200"
                >
                  🌱 {s}
                </span>
              ))}
            </div>
          )}

          {/* Pestañas */}
          <div className="bg-white/90 border border-emerald-200 rounded-xl overflow-hidden">
            {/* Tab headers */}
            <div className="flex border-b border-emerald-200">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-emerald-600 text-white"
                      : "text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {tab.emoji} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4 max-h-72 overflow-y-auto">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {tabContent[activeTab]}
              </p>
            </div>
          </div>

          {/* Nota del cronista */}
          {chronicle.nota_cronista && (
            <div className="flex items-start gap-2 text-xs text-emerald-700 italic">
              <span>🍄</span>
              <span>{chronicle.nota_cronista}</span>
            </div>
          )}

          {/* Stats + toggle */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3 text-xs text-emerald-600">
              <span>📅 {new Date(chronicle.ejecutado_en).toLocaleDateString("es-CL")}</span>
              <span>🌱 {chronicle.stats.semillas_input} semillas</span>
              <span>👤 {chronicle.stats.pensadores_input} pensadores</span>
            </div>
            <button
              onClick={() => setShowResult(false)}
              className="text-xs text-emerald-500 hover:text-emerald-700 flex items-center gap-1"
            >
              <ChevronUp className="w-3 h-3" /> Colapsar
            </button>
          </div>
        </div>
      )}

      {/* Mostrar resultado colapsado */}
      {chronicle && !showResult && !isRunning && (
        <button
          onClick={() => setShowResult(true)}
          className="w-full text-xs text-emerald-600 hover:text-emerald-800 flex items-center justify-center gap-1 py-1"
        >
          <ChevronDown className="w-3 h-3" />
          Ver crónica generada el{" "}
          {new Date(chronicle.ejecutado_en).toLocaleDateString("es-CL")}
        </button>
      )}
    </div>
  );
}
