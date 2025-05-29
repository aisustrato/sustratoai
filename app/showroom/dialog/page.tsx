"use client"

import { useState } from "react"
import { CustomDialog } from "@/components/ui/custom-dialog"
import { CustomButton } from "@/components/ui/custom-button"
import { Text } from "@/components/ui/text"
import { PageWrapper } from "@/components/ui/page-wrapper"

export default function EjemploDialogPage() {
  const [dialogStates, setDialogStates] = useState({
    default: false,
    destructive: false,
    success: false,
    warning: false,
    withContent: false,
    loading: false,
  })

  const openDialog = (type: keyof typeof dialogStates) => {
    setDialogStates((prev) => ({ ...prev, [type]: true }))
  }

  const closeDialog = (type: keyof typeof dialogStates) => {
    setDialogStates((prev) => ({ ...prev, [type]: false }))
  }

  const handleAsyncAction = async () => {
    // Simular una acción asíncrona
    await new Promise((resolve) => setTimeout(resolve, 2000))
    closeDialog("loading")
  }

  return (
    <PageWrapper>
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-4">
          <Text variant="heading" size="3xl" weight="bold">
            Ejemplos de Custom Dialog
          </Text>
          <Text variant="default" color="muted">
            Diferentes variantes del componente de diálogo personalizado
          </Text>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Diálogo por defecto */}
          <div className="space-y-2">
            <Text variant="label" weight="medium">
              Diálogo por defecto
            </Text>
            <CustomButton color="primary" variant="solid" onClick={() => openDialog("default")}>Abrir diálogo básico</CustomButton>
          </div>

          {/* Diálogo destructivo */}
          <div className="space-y-2">
            <Text variant="label" weight="medium">
              Diálogo destructivo
            </Text>
            <CustomButton color="danger" variant="solid" onClick={() => openDialog("destructive")}>
              Eliminar elemento
            </CustomButton>
          </div>

          {/* Diálogo de éxito */}
          <div className="space-y-2">
            <Text variant="label" weight="medium">
              Diálogo de éxito
            </Text>
            <CustomButton color="success" variant="solid" onClick={() => openDialog("success")}>Mostrar éxito</CustomButton>
          </div>

          {/* Diálogo de advertencia */}
          <div className="space-y-2">
            <Text variant="label" weight="medium">
              Diálogo de advertencia
            </Text>
            <CustomButton color="warning" variant="outline" onClick={() => openDialog("warning")}>
              Mostrar advertencia
            </CustomButton>
          </div>

          {/* Diálogo con contenido */}
          <div className="space-y-2">
            <Text variant="label" weight="medium">
              Con contenido personalizado
            </Text>
            <CustomButton color="secondary" variant="solid" onClick={() => openDialog("withContent")}>
              Diálogo con contenido
            </CustomButton>
          </div>

          {/* Diálogo con loading */}
          <div className="space-y-2">
            <Text variant="label" weight="medium">
              Con acción asíncrona
            </Text>
            <CustomButton color="primary" variant="solid" onClick={() => openDialog("loading")}>Acción con loading</CustomButton>
          </div>
        </div>

        {/* Diálogos */}
        <CustomDialog
          open={dialogStates.default}
          onOpenChange={(open) => !open && closeDialog("default")}
          title="Confirmación"
          description="¿Estás seguro de que quieres continuar con esta acción?"
          confirmText="Continuar"
          cancelText="Cancelar"
          onConfirm={() => closeDialog("default")}
          onCancel={() => closeDialog("default")}
        />

        <CustomDialog
          open={dialogStates.destructive}
          onOpenChange={(open) => !open && closeDialog("destructive")}
          title="Eliminar elemento"
          description="Esta acción no se puede deshacer. El elemento será eliminado permanentemente."
          variant="destructive"
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={() => closeDialog("destructive")}
          onCancel={() => closeDialog("destructive")}
        />

        <CustomDialog
          open={dialogStates.success}
          onOpenChange={(open) => !open && closeDialog("success")}
          title="¡Operación exitosa!"
          description="La operación se ha completado correctamente."
          variant="success"
          confirmText="Entendido"
          onConfirm={() => closeDialog("success")}
        />

        <CustomDialog
          open={dialogStates.warning}
          onOpenChange={(open) => !open && closeDialog("warning")}
          title="Advertencia"
          description="Esta acción puede tener consecuencias importantes. Por favor, revisa antes de continuar."
          variant="warning"
          confirmText="Continuar de todas formas"
          cancelText="Revisar"
          onConfirm={() => closeDialog("warning")}
          onCancel={() => closeDialog("warning")}
        />

        <CustomDialog
          open={dialogStates.withContent}
          onOpenChange={(open) => !open && closeDialog("withContent")}
          title="Configuración avanzada"
          description="Personaliza las opciones según tus necesidades."
          size="lg"
          confirmText="Guardar cambios"
          cancelText="Cancelar"
          onConfirm={() => closeDialog("withContent")}
          onCancel={() => closeDialog("withContent")}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Text variant="label" weight="medium">
                Opción 1
              </Text>
              <Text variant="default" size="sm" color="muted">
                Descripción de la primera opción de configuración.
              </Text>
            </div>
            <div className="space-y-2">
              <Text variant="label" weight="medium">
                Opción 2
              </Text>
              <Text variant="default" size="sm" color="muted">
                Descripción de la segunda opción de configuración.
              </Text>
            </div>
            <div className="space-y-2">
              <Text variant="label" weight="medium">
                Opción 3
              </Text>
              <Text variant="default" size="sm" color="muted">
                Descripción de la tercera opción de configuración.
              </Text>
            </div>
          </div>
        </CustomDialog>

        <CustomDialog
          open={dialogStates.loading}
          onOpenChange={(open) => !open && closeDialog("loading")}
          title="Procesando solicitud"
          description="Esta operación puede tardar unos segundos. Por favor, espera."
          confirmText="Procesar"
          cancelText="Cancelar"
          onConfirm={handleAsyncAction}
          onCancel={() => closeDialog("loading")}
        />
      </div>
    </PageWrapper>
  )
}
