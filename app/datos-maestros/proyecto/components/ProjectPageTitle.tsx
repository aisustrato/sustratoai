"use client";

import { StandardPageTitle, type StandardPageTitleProps } from "@/components/ui/StandardPageTitle";
import { FileText } from "lucide-react";

// 📚 DOCUMENTACIÓN 📚
/**
 * Componente "puente" para la página de edición de proyectos.
 * Su única responsabilidad es actuar como un Componente de Cliente que puede
 * importar y pasar correctamente la referencia del icono `FileText` al
 * componente `StandardPageTitle`.
 * Esto resuelve el conflicto de pasar funciones (referencias de componentes)
 * desde un Componente de Servidor (`page.tsx`) a un Componente de Cliente (`StandardPageTitle`).
 */
export function ProjectPageTitle(props: Omit<StandardPageTitleProps, 'mainIcon'>) {
  return (
    <StandardPageTitle
      {...props}
      mainIcon={FileText} // Pasamos la referencia al icono aquí, de cliente a cliente.
    />
  );
}
