// 📍 lib/mdj/index.ts
// Barrel export del módulo MDJ

export { parsearMDJ } from "./parser";
export { transformarMDASTaMDJ } from "./transformer";
export { exportarMDPuro } from "./exportador";
export { extraerTextoPlano } from "./texto-plano";
export {
  indexarNodos,
  agruparAnotacionesPorNodo,
  filtrarHuerfanas,
} from "./anotaciones";
export { crearGeneradorIds, idLocal, idCompleto } from "./id-generator";
export type * from "./types";
export type { GeneradorIds } from "./id-generator";
