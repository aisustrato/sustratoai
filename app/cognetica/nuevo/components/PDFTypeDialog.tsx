// 📍 app/cognetica/nuevo/components/PDFTypeDialog.tsx
"use client";

import { useState } from "react";
import { StandardDialog } from "@/components/ui/StandardDialog";
import { StandardButton } from "@/components/ui/StandardButton";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
import { FileText, Presentation } from "lucide-react";

export interface PDFTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (type: "informe" | "presentacion") => Promise<void>;
  fileName?: string;
}

type ProcessingState = "selecting" | "processing" | "success" | "error";

export function PDFTypeDialog({
  open,
  onClose,
  onSelectType,
  fileName = "documento.pdf",
}: PDFTypeDialogProps) {
  const [processingState, setProcessingState] =
    useState<ProcessingState>("selecting");
  const [selectedType, setSelectedType] = useState<
    "informe" | "presentacion" | null
  >(null);
  const [processingMessage, setProcessingMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSelectType = async (type: "informe" | "presentacion") => {
    setSelectedType(type);
    setProcessingState("processing");
    setProcessingMessage(
      type === "informe"
        ? "Procesando informe con Marker..."
        : "Dividiendo presentación en páginas..."
    );

    try {
      await onSelectType(type);
      setProcessingState("success");
      setProcessingMessage(
        type === "informe"
          ? "¡Informe procesado exitosamente!"
          : "¡Presentación dividida exitosamente!"
      );

      // Auto-cerrar después de mostrar éxito
      setTimeout(() => {
        onClose();
        resetState();
      }, 2000);
    } catch (error) {
      setProcessingState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Error al procesar el documento"
      );
    }
  };

  const resetState = () => {
    setProcessingState("selecting");
    setSelectedType(null);
    setProcessingMessage("");
    setErrorMessage("");
  };

  const handleClose = () => {
    if (processingState !== "processing") {
      onClose();
      resetState();
    }
  };

  return (
    <StandardDialog open={open} onOpenChange={handleClose}>
      <StandardDialog.Content
        colorScheme="primary"
        size="md"
        className="max-w-lg"
      >
        {/* ESTADO: Selección de tipo */}
        {processingState === "selecting" && (
          <>
            <StandardDialog.Header>
              <StandardDialog.Title>
                ¿Qué tipo de documento es?
              </StandardDialog.Title>
              <StandardDialog.Description>
                Selecciona cómo deseas procesar: <strong>{fileName}</strong>
              </StandardDialog.Description>
            </StandardDialog.Header>

            <StandardDialog.Body className="space-y-4">
              {/* Opción: Informe */}
              <button
                onClick={() => handleSelectType("informe")}
                className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-gray-100">
                      Informe o Documento
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Procesa el PDF completo como un solo documento. Ideal
                      para informes, artículos, papers.
                    </p>
                  </div>
                </div>
              </button>

              {/* Opción: Presentación */}
              <button
                onClick={() => handleSelectType("presentacion")}
                className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-accent-500 dark:hover:border-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950/30 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-accent-100 dark:group-hover:bg-accent-900/40 transition-colors">
                    <Presentation className="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:text-accent-600 dark:group-hover:text-accent-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-gray-100">
                      Presentación (Slides)
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Divide el PDF en páginas individuales. Ideal para
                      presentaciones, slides, diapositivas.
                    </p>
                  </div>
                </div>
              </button>
            </StandardDialog.Body>

            <StandardDialog.Footer>
              <StandardButton
                styleType="ghost"
                colorScheme="neutral"
                onClick={handleClose}
              >
                Cancelar
              </StandardButton>
            </StandardDialog.Footer>
          </>
        )}

        {/* ESTADO: Procesando */}
        {processingState === "processing" && (
          <>
            <StandardDialog.Header>
              <StandardDialog.Title>Procesando...</StandardDialog.Title>
            </StandardDialog.Header>

            <StandardDialog.Body className="py-12">
              <div className="flex flex-col items-center justify-center space-y-6">
                <SustratoLoadingLogo
                  size={80}
                  variant="spin-pulse"
                  speed="normal"
                  showText={true}
                  text={processingMessage}
                  breathingEffect={true}
                  colorTransition={true}
                />
                <div className="text-center max-w-md space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedType === "presentacion"
                      ? "Dividiendo PDF en páginas individuales y guardando cada una..."
                      : "Extrayendo contenido del documento con Marker API..."}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {selectedType === "presentacion"
                      ? "Este proceso puede tomar 1-2 minutos para PDFs grandes. Por favor espera..."
                      : "Esto puede tomar unos momentos..."}
                  </p>
                </div>
              </div>
            </StandardDialog.Body>
          </>
        )}

        {/* ESTADO: Éxito */}
        {processingState === "success" && (
          <>
            <StandardDialog.Header>
              <StandardDialog.Title>¡Listo!</StandardDialog.Title>
            </StandardDialog.Header>

            <StandardDialog.Body className="py-12">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-center text-gray-700 dark:text-gray-300 font-medium">
                  {processingMessage}
                </p>
              </div>
            </StandardDialog.Body>
          </>
        )}

        {/* ESTADO: Error */}
        {processingState === "error" && (
          <>
            <StandardDialog.Header>
              <StandardDialog.Title>Error al procesar</StandardDialog.Title>
            </StandardDialog.Header>

            <StandardDialog.Body className="py-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <p className="text-center text-gray-700 dark:text-gray-300">
                  {errorMessage}
                </p>
              </div>
            </StandardDialog.Body>

            <StandardDialog.Footer>
              <StandardButton
                styleType="solid"
                colorScheme="primary"
                onClick={handleClose}
              >
                Cerrar
              </StandardButton>
            </StandardDialog.Footer>
          </>
        )}
      </StandardDialog.Content>
    </StandardDialog>
  );
}
