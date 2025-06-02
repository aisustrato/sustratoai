"use client";

import React, { createContext, useContext } from "react";
import { useAuth } from "@/app/auth-provider";

// Tipo para los permisos del proyecto
export interface ProjectPermissions {
  role_name?: string | null;
  can_manage_master_data?: boolean | null;
  can_create_batches?: boolean | null;
  can_upload_files?: boolean | null;
  can_bulk_edit_master_data?: boolean | null;
}

interface ProyectoContextType {
  proyectoActual: any | null; // Usamos any por ahora, idealmente debería ser un tipo más específico
  permisos: ProjectPermissions | null;
  cargandoProyecto: boolean;
}

const ProyectoContext = createContext<ProyectoContextType | undefined>(
  undefined
);

export function ProyectoProvider({ children }: { children: React.ReactNode }) {
  // Utilizamos el contexto de autenticación para obtener información del proyecto actual
  const { proyectoActual, loadingProyectos } = useAuth();

  // Extraer los permisos del proyecto actual para fácil acceso
  const permisos: ProjectPermissions | null =
    proyectoActual?.permissions || null;

  const value = {
    proyectoActual,
    permisos,
    cargandoProyecto: loadingProyectos,
  };

  return (
    <ProyectoContext.Provider value={value}>
      {children}
    </ProyectoContext.Provider>
  );
}

export function useProyectoActual() {
  const context = useContext(ProyectoContext);
  if (context === undefined) {
    throw new Error(
      "useProyectoActual debe ser usado dentro de un ProyectoProvider"
    );
  }
  return context;
}
