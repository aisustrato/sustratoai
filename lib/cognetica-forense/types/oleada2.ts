//. 📍 lib/cognetica-forense/types/oleada2.ts
/**
 * Tipos de dominio — Cognética Forense v2 · Oleada 2.
 *
 * Todos los tipos se derivan de `lib/database.types.ts` (generado por
 * Supabase CLI) vía los helpers `Tables<...>` y `Enums<...>`. El propósito
 * de este archivo es:
 *
 *   1. **Naming de dominio legible**: evitar repetir el ruido
 *      `Database["public"]["Tables"]["cgt_xxx"]["Row"]` en cada import.
 *   2. **Type-safety de `campo_editado`**: los CHECK constraints de SQL
 *      (ver `SQL_COGNETICA_V2_OLEADA_2.sql §1-§5`) restringen los valores
 *      admitidos por entidad. Aquí se expresan como union types para que
 *      el compilador haga el trabajo antes de que la DB lo rechace.
 *   3. **Discriminator `TipoEntidad`**: permite escribir server actions
 *      genéricas (`listarMencionesPorArtefacto(artefactoId, tipo)`) con
 *      narrowing seguro.
 *
 * Filosofía: si el SQL cambia, se regenera `database.types.ts` y aquí
 * los tipos derivados se alinean automáticamente. Lo único que requiere
 * cuidado manual son los unions de `campo_editado` (no se derivan del
 * CHECK por Supabase; hay que mantenerlos sincronizados).
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import type { Database, Tables, Enums } from "@/lib/database.types";
//#endregion ![head]

//#region [def] - 📦 ENUMS 📦
/**
 * Decisión del Cartografiador por cada mención cruda (ver `cartografiador_prompt_v1.md §1`).
 *
 *   - `match_existente`: la mención coincide con una entidad canónica del proyecto.
 *   - `nueva_entidad`: no existía, se debe crear entidad canónica.
 *   - `ambigua`: varias candidatas o información insuficiente — requiere humano.
 *   - `sin_cartografiar`: default al insertar la mención; aún no se corrió el 2º pipeline.
 */
export type DecisionCartografiador = Enums<"cgt_decision_cartografiador">;

/**
 * Tipología de citas (ver `spec v0.3` + `SQL §5`). Distingue citas
 * académicas (DOI/ISBN) de hechos históricos (verificables sin paper),
 * obras (literarias/artísticas/fílmicas) y otras.
 */
export type TipoCita = Enums<"cgt_tipo_cita">;
//#endregion ![def]

//#region [def] - 📦 DISCRIMINATOR TipoEntidad 📦
/**
 * Discriminador de entidad usado por server actions genéricas y UI
 * compartida (ej. el Tabs de `MencionesArtefactoTabs` del Hito 4).
 *
 * Orden canónico alineado con `SQL §1–§5` y con la guía (`guia §3 HITO 4`).
 */
export type TipoEntidad =
	| "pensador"
	| "disciplina"
	| "concepto"
	| "teoria"
	| "cita";

/**
 * Subconjunto de entidades que sí tienen `<tipo>_id` propio y cuentan
 * menciones (vistas `cgt_vw_<tipo>_con_conteo` + helpers
 * `cgt_contar_menciones_<tipo>`). **Citas NO** — cada aparición de una
 * cita es conceptualmente única (ver `SQL §9` comentario).
 */
export type TipoEntidadConConteo = Exclude<TipoEntidad, "cita">;
//#endregion ![def]

//#region [def] - 📦 PENSADORES 📦
export type PensadorCanonico = Tables<"cgt_pensadores">;
export type PensadorMencion = Tables<"cgt_pensadores_menciones">;
export type PensadorEdicionHumana = Tables<"cgt_pensadores_ediciones_humanas">;
export type PensadorValorCanonico = Tables<"cgt_vw_pensadores_valor_canonico">;
export type PensadorConConteo = Tables<"cgt_vw_pensadores_con_conteo">;

/**
 * Campos editables por el humano sobre una mención de pensador.
 * Sincronizado con el CHECK `chk_pensadores_edicion_campo` en
 * `SQL §1`. Si el CHECK cambia, actualizar este union manualmente.
 */
export type CampoEdicionPensador =
	| "nombre"
	| "descripcion"
	| "reasignar_entidad_canonica";
//#endregion ![def]

//#region [def] - 📦 DISCIPLINAS 📦
export type DisciplinaCanonica = Tables<"cgt_disciplinas">;
export type DisciplinaMencion = Tables<"cgt_disciplinas_menciones">;
export type DisciplinaEdicionHumana =
	Tables<"cgt_disciplinas_ediciones_humanas">;
export type DisciplinaValorCanonico =
	Tables<"cgt_vw_disciplinas_valor_canonico">;
export type DisciplinaConConteo = Tables<"cgt_vw_disciplinas_con_conteo">;

/**
 * Sincronizado con `chk_disciplinas_edicion_campo` (SQL §2). Las
 * disciplinas admiten un campo extra — `asignar_disciplina_madre` —
 * para registrar la jerarquía madre/sub (`disciplina_madre_id`).
 */
export type CampoEdicionDisciplina =
	| "nombre"
	| "descripcion"
	| "reasignar_entidad_canonica"
	| "asignar_disciplina_madre";
//#endregion ![def]

//#region [def] - 📦 CONCEPTOS 📦
export type ConceptoCanonico = Tables<"cgt_conceptos">;
export type ConceptoMencion = Tables<"cgt_conceptos_menciones">;
export type ConceptoEdicionHumana = Tables<"cgt_conceptos_ediciones_humanas">;
export type ConceptoValorCanonico = Tables<"cgt_vw_conceptos_valor_canonico">;
export type ConceptoConConteo = Tables<"cgt_vw_conceptos_con_conteo">;

/**
 * Sincronizado con `chk_conceptos_edicion_campo` (SQL §3). El campo
 * extra `marcar_semilla_fractal` registra cuando un humano escala un
 * concepto a semilla fractal del proyecto (`es_semilla_fractal = true`).
 */
export type CampoEdicionConcepto =
	| "nombre"
	| "descripcion"
	| "reasignar_entidad_canonica"
	| "marcar_semilla_fractal";
//#endregion ![def]

//#region [def] - 📦 TEORÍAS 📦
export type TeoriaCanonica = Tables<"cgt_teorias">;
export type TeoriaMencion = Tables<"cgt_teorias_menciones">;
export type TeoriaEdicionHumana = Tables<"cgt_teorias_ediciones_humanas">;
export type TeoriaValorCanonico = Tables<"cgt_vw_teorias_valor_canonico">;
export type TeoriaConConteo = Tables<"cgt_vw_teorias_con_conteo">;

/**
 * Sincronizado con `chk_teorias_edicion_campo` (SQL §4). El campo
 * `actualizar_autores` registra modificaciones al array JSONB
 * `autores_principales` de la teoría canónica.
 */
export type CampoEdicionTeoria =
	| "nombre"
	| "descripcion"
	| "reasignar_entidad_canonica"
	| "actualizar_autores";
//#endregion ![def]

//#region [def] - 📦 CITAS 📦
export type CitaCanonica = Tables<"cgt_citas">;
export type CitaMencion = Tables<"cgt_citas_menciones">;
export type CitaEdicionHumana = Tables<"cgt_citas_ediciones_humanas">;
export type CitaValorCanonico = Tables<"cgt_vw_citas_valor_canonico">;

/**
 * Sincronizado con `chk_citas_edicion_campo` (SQL §5). Las citas tienen
 * campos distintos (texto/autor/referencia/tipo) porque su estructura
 * no sigue el patrón `nombre/descripcion` de las demás entidades.
 */
export type CampoEdicionCita =
	| "texto"
	| "autor"
	| "referencia"
	| "tipo_cita"
	| "reasignar_entidad_canonica";
//#endregion ![def]

//#region [def] - 📦 CAMPO EDICIÓN UNIFICADO 📦
/**
 * Conditional mapped type: dado un `TipoEntidad`, devuelve la unión de
 * `campo_editado` admitidos para esa entidad. Permite server actions
 * genéricas con type-safety total:
 *
 * ```ts
 * function editar<T extends TipoEntidad>(
 *   tipo: T,
 *   campo: CampoEdicionPorTipo<T>,
 *   ...
 * )
 * ```
 */
export type CampoEdicionPorTipo<T extends TipoEntidad> =
	T extends "pensador" ? CampoEdicionPensador
	: T extends "disciplina" ? CampoEdicionDisciplina
	: T extends "concepto" ? CampoEdicionConcepto
	: T extends "teoria" ? CampoEdicionTeoria
	: T extends "cita" ? CampoEdicionCita
	: never;
//#endregion ![def]

//#region [def] - 📦 BITÁCORA DEL CARTOGRAFIADOR 📦
/**
 * Log de cada corrida del 2º pipeline sobre un artefacto. Incluye
 * contadores por tipo de decisión, tamaño del universo pasado al LLM,
 * tokens y costo. Ver `SQL §6`.
 */
export type LogCartografiador = Tables<"cgt_logs_cartografiador">;
//#endregion ![def]

//#region [def] - 📦 INPUTS DE SERVER ACTIONS 📦
/**
 * Input tipado para `editarMencionHumana`. El genérico `T` garantiza
 * que `campo` es válido para el tipo de entidad pasado.
 *
 * La `justificacion` es opcional en el tipo (la DB la admite NULL) pero
 * `guia §3 HITO 4` marca que la UI debe exigirla. La validación dura
 * vive en la Server Action, no en el tipo.
 */
export interface EditarMencionHumanaInput<T extends TipoEntidad = TipoEntidad> {
	tipo: T;
	mencion_id: string;
	campo: CampoEdicionPorTipo<T>;
	valor_nuevo: string | null;
	justificacion?: string | null;
}

/**
 * Union discriminada de una mención + su tipo. Facilita pasar una
 * mención por la UI sin perder la discriminación entre schemas
 * (pensador/disciplina/concepto/teoria vs cita).
 */
export type MencionConTipo =
	| { tipo: "pensador"; mencion: PensadorMencion }
	| { tipo: "disciplina"; mencion: DisciplinaMencion }
	| { tipo: "concepto"; mencion: ConceptoMencion }
	| { tipo: "teoria"; mencion: TeoriaMencion }
	| { tipo: "cita"; mencion: CitaMencion };

/**
 * Valor canónico actual (coalesce humano → cartografiador → extractor)
 * discriminado por tipo. Deriva de las 5 vistas `cgt_vw_<tipo>_valor_canonico`.
 */
export type ValorCanonicoConTipo =
	| { tipo: "pensador"; valor: PensadorValorCanonico }
	| { tipo: "disciplina"; valor: DisciplinaValorCanonico }
	| { tipo: "concepto"; valor: ConceptoValorCanonico }
	| { tipo: "teoria"; valor: TeoriaValorCanonico }
	| { tipo: "cita"; valor: CitaValorCanonico };

/**
 * Entidad canónica del proyecto discriminada por tipo. Usado por
 * `listarEntidadesCanonicasProyecto` para poblar dropdowns de
 * reasignación (ver `guia §3 HITO 2`).
 */
export type EntidadCanonicaConTipo =
	| { tipo: "pensador"; entidad: PensadorCanonico }
	| { tipo: "disciplina"; entidad: DisciplinaCanonica }
	| { tipo: "concepto"; entidad: ConceptoCanonico }
	| { tipo: "teoria"; entidad: TeoriaCanonica }
	| { tipo: "cita"; entidad: CitaCanonica };
//#endregion ![def]

//#region [def] - 📦 RE-EXPORT Database 📦
/**
 * Re-exporta `Database` por conveniencia para módulos que necesiten
 * acceder a `Insert`/`Update` tipados sin duplicar el import.
 */
export type { Database };
//#endregion ![def]
