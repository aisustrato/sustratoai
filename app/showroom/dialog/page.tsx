//. 📍 app/showroom/standard-dialog/page.tsx

"use client";

import * as React from "react";
import {
  StandardDialog,
} from "@/components/ui/StandardDialog";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardLabel } from "@/components/ui/StandardLabel";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";


export default function StandardDialogShowroomPage() {

  return (
    <div className="container mx-auto py-10 px-4">
      <header className="mb-12 text-center">
        <StandardText preset="heading" asElement="h1">
          StandardDialog Showroom
        </StandardText>
        <StandardText preset="subtitle" asElement="p" className="max-w-2xl mx-auto">
          Un sistema de modales componible, flexible y coherente con nuestro ecosistema.
        </StandardText>
        <div className="mt-4"><ThemeSwitcher /></div>
      </header>

      <main className="flex flex-wrap items-center justify-center gap-4">

        {/* --- EJEMPLO 1: Diálogo Neutral por Defecto --- */}
        <StandardDialog>
          <StandardDialog.Trigger asChild>
            <StandardButton>Diálogo Simple</StandardButton>
          </StandardDialog.Trigger>
          <StandardDialog.Content>
            <StandardDialog.Header>
              <StandardDialog.Title>¿Estás absolutamente seguro?</StandardDialog.Title>
              <StandardDialog.Description>
                Esta acción no se puede deshacer. Esto eliminará permanentemente los datos de nuestros servidores.
              </StandardDialog.Description>
            </StandardDialog.Header>
            <StandardDialog.Footer>
              <StandardDialog.Close asChild>
                <StandardButton styleType="outline">Cancelar</StandardButton>
              </StandardDialog.Close>
              <StandardButton>Confirmar</StandardButton>
            </StandardDialog.Footer>
          </StandardDialog.Content>
        </StandardDialog>

        {/* --- EJEMPLO 2: Diálogo Destructivo --- */}
        <StandardDialog>
          <StandardDialog.Trigger asChild>
            <StandardButton colorScheme="danger">Diálogo Destructivo</StandardButton>
          </StandardDialog.Trigger>
          <StandardDialog.Content colorScheme="danger">
            <StandardDialog.Header>
              <StandardDialog.Title>Eliminar Usuario</StandardDialog.Title>
            </StandardDialog.Header>
            <StandardDialog.Body>
              <StandardText>
                ¿Realmente deseas eliminar al usuario &apos;Rodolfo Leiva&apos;? Esta acción es irreversible.
              </StandardText>
            </StandardDialog.Body>
            <StandardDialog.Footer>
              <StandardDialog.Close asChild>
                <StandardButton styleType="outline">No, mantener usuario</StandardButton>
              </StandardDialog.Close>
              <StandardButton colorScheme="danger">Sí, eliminar</StandardButton>
            </StandardDialog.Footer>
          </StandardDialog.Content>
        </StandardDialog>

        {/* --- EJEMPLO 3: Diálogo de Éxito --- */}
        <StandardDialog>
          <StandardDialog.Trigger asChild>
            <StandardButton colorScheme="success">Diálogo de Éxito</StandardButton>
          </StandardDialog.Trigger>
          <StandardDialog.Content colorScheme="success" size="sm">
            <StandardDialog.Header>
              <StandardDialog.Title>¡Operación Completada!</StandardDialog.Title>
            </StandardDialog.Header>
            <StandardDialog.Body>
              <StandardText>Tu perfil ha sido actualizado correctamente.</StandardText>
            </StandardDialog.Body>
            <StandardDialog.Footer>
              <StandardDialog.Close asChild>
                <StandardButton colorScheme="success">¡Genial!</StandardButton>
              </StandardDialog.Close>
            </StandardDialog.Footer>
          </StandardDialog.Content>
        </StandardDialog>

        {/* --- EJEMPLO 4: Diálogo con Formulario --- */}
        <StandardDialog>
          <StandardDialog.Trigger asChild>
            <StandardButton colorScheme="secondary">Diálogo con Formulario</StandardButton>
          </StandardDialog.Trigger>
          <StandardDialog.Content colorScheme="secondary" size="lg">
            <StandardDialog.Header>
              <StandardDialog.Title>Crear Nuevo Perfil</StandardDialog.Title>
              <StandardDialog.Description>
                Completa los siguientes campos para crear un nuevo perfil de usuario.
              </StandardDialog.Description>
            </StandardDialog.Header>
            <StandardDialog.Body className="space-y-4">
              <div className="space-y-2">
                <StandardLabel htmlFor="name">Nombre</StandardLabel>
                <StandardInput id="name" placeholder="Ej: Rodolfo Leiva" />
              </div>
              <div className="space-y-2">
                <StandardLabel htmlFor="email">Correo Electrónico</StandardLabel>
                <StandardInput id="email" type="email" placeholder="Ej: rodolfo@sustrato.ai" />
              </div>
            </StandardDialog.Body>
            <StandardDialog.Footer>
                <StandardButton styleType="outline">Cancelar</StandardButton>
                <StandardButton colorScheme="secondary">Guardar Perfil</StandardButton>
            </StandardDialog.Footer>
          </StandardDialog.Content>
        </StandardDialog>

      </main>
    </div>
  );
}