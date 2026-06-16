// 📍 components/mdj-viewer/ClienteFalso.tsx
// Simula un cliente externo (Cognética u otro módulo) para pruebas del MDJViewer.
//
// Uso en showroom:
//   import { crearClienteFalso } from "@/components/mdj-viewer/ClienteFalso";
//   const cliente = crearClienteFalso({ debeFallar: false });
//
// Cada función retorna Promise<{ ok: boolean }> con delay de 800ms.
// Toggle `debeFallar` para probar el flujo de reintento.

import type { Anotacion } from "@/lib/mdj/types";

interface ClienteFalsoConfig {
  debeFallar?: boolean;
  delayMs?: number;
}

export function crearClienteFalso(config: ClienteFalsoConfig = {}) {
  const { debeFallar = false, delayMs = 800 } = config;

  const delay = () => new Promise<void>((resolve) => setTimeout(resolve, delayMs));

  return {
    async agregarFraseNotable(anotacion: Anotacion): Promise<{ ok: boolean }> {
      await delay();
      console.log("[ClienteFalso] ✅ Frase notable agregada:", anotacion.id, anotacion.fragmento.slice(0, 40));
      return { ok: !debeFallar };
    },

    async borrarFraseNotable(id: string): Promise<{ ok: boolean }> {
      await delay();
      console.log("[ClienteFalso] 🗑️ Frase notable borrada:", id);
      return { ok: !debeFallar };
    },

    async agregarReferencia(anotacion: Anotacion): Promise<{ ok: boolean }> {
      await delay();
      console.log(
        "[ClienteFalso] ✅ Referencia agregada:",
        anotacion.id,
        "link:", anotacion.entidad_id,
        "semaforo:", anotacion.semaforo ?? "rojo",
        "validado:", anotacion.validado ?? false,
        "fragmento:", anotacion.fragmento.slice(0, 40)
      );
      return { ok: !debeFallar };
    },

    async borrarReferencia(id: string): Promise<{ ok: boolean }> {
      await delay();
      console.log("[ClienteFalso] 🗑️ Referencia borrada:", id);
      return { ok: !debeFallar };
    },

    async editarReferencia(anotacion: Anotacion): Promise<{ ok: boolean }> {
      await delay();
      console.log("[ClienteFalso] ✏️ Referencia editada:", anotacion.id, anotacion.entidad_id);
      return { ok: !debeFallar };
    },

    async agregarNota(anotacion: Anotacion): Promise<{ ok: boolean }> {
      await delay();
      console.log("[ClienteFalso] ✅ Nota agregada:", anotacion.id, anotacion.fragmento.slice(0, 40));
      return { ok: !debeFallar };
    },
  };
}
