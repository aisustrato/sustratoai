// 📍 components/mdj-viewer/entidad-servicios-context.ts
// Servicios de entidad que el HOST (Cognética) inyecta al visor para la Capa 2
// (interacción viva): el tooltip lee el nombre/descripción ACTUALES de la entidad
// desde la DB (no el nota_texto congelado del MDJ) y puede ofrecer acciones como
// eliminar. Es opcional: el showroom no lo provee → el tooltip cae al dato del MDJ.

"use client";

import { createContext } from "react";

export interface EntidadInfoViva {
	nombre: string;
	descripcion: string | null;
}

/** Tipos de entidad creables desde una selección de texto. */
export type TipoEntidadCreable = "pensador" | "disciplina" | "concepto" | "teoria";

export interface EntidadServicios {
	/** Info ACTUAL de la entidad por su id (nombre/descripción canónicos vivos). */
	infoEntidad?: (entidadId: string) => EntidadInfoViva | undefined;
	/** Elimina la mención de esa entidad en el artefacto (con confirmación en el host). */
	onEliminar?: (entidadId: string) => void;
	/** Crea una entidad a partir del texto seleccionado (el host confirma/re-hornea). */
	onCrearEntidad?: (tipo: TipoEntidadCreable, texto: string) => void;
}

/** `null` cuando no hay host que provea servicios (ej. showroom). */
export const EntidadServiciosContext = createContext<EntidadServicios | null>(null);
