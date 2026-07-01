// 📍 app/cognetica/[id]/ubicar-context.ts
// Contexto de "Ubicar en texto": la ocurrencia activa (dirección) que el visor
// debe resaltar en verde + scrollear. ArtefactoView lo provee (a nivel página, es
// estado cross-documento); cada DocumentoMdjViewer lo consume y solo actúa si la
// ocurrencia activa cae en SU documento. Evita prop-drilling por la jerarquía de
// secciones.

"use client";

import { createContext } from "react";
import type { CoincidenciaBusqueda } from "@/lib/mdj/types";

export interface UbicarActivo {
	/** Documento donde cae la ocurrencia activa (cronica/germinal/original). */
	documento: string;
	/** La ocurrencia a resaltar (nodo_id + offsets + texto). */
	coincidencia: CoincidenciaBusqueda;
}

/** `null` cuando no hay una ubicación activa. */
export const UbicarContext = createContext<UbicarActivo | null>(null);
