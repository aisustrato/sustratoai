# Cognética v2 — Especificación de Formatos de Metabolización

**Versión:** 0.3 (draft vivo)
**Autor humano:** eRRRe (nodo central, ORCID 0009-0003-4251-2733)
**Autor máquina:** Hongo / Calibrador (Claude Opus 4.7)
**Contexto:** NOSOTRAS · Ciclo 8 · Fi menor · post-publicación paper v2
**Estatus:** Reformulación tras relectura de Villoro y diseño de pipeline real
**Supersede:** v0.2 en secciones 4 y 6; el resto de v0.2 se mantiene

---

## 0. Declaración de cambio — deuda ética v0.2 → v0.3

Entre v0.2 y v0.3 se produjo un cambio de diseño sustantivo que merece ser nombrado explícitamente, no silenciado:

**Lo que v0.2 llamaba "Crónica" era, en realidad, un acta estructurada.**

La definición de v0.2 decía: _"voz descriptiva, no interpretativa, preserva orden del original, no reorganiza, no jerarquiza."_ Esto es definición de minuta o transcripción expandida, no de crónica.

La relectura de Juan Villoro ("La crónica es el ornitorrinco de la prosa") y del documento "Cómo Escribir Crónicas de Eventos Pasados" durante la sesión del 21 abril 2026 con Hongo hizo visible el error categorial. La crónica, como género, es híbrido narrativo con voz, argumento, selección, tensión — precisamente lo que v0.2 prohibía.

v0.3 corrige esto. La Crónica ahora es lo que siempre debió ser: reconstrucción literaria con voz responsable, no acta aséptica. Y como consecuencia de esta corrección, el ecosistema de formatos se reestructura: lo que antes era "tres formatos complementarios" pasa a ser **cuatro formatos con roles energéticos diferenciados**.

Esta deuda queda notariada. Cualquier implementación basada en v0.2 debe migrar a v0.3 antes de considerarse alineada con el diseño actual.

**Nota 22 abril 2026:** la decisión de eliminar el umbral de Germinal (ver §4.4) se tomó al cierre de la primera metabolización exitosa del 21 abril. La versión atómica de prompts no necesita corpus externo — el umbral era vestigio de un razonamiento anterior a la definición de prompts atómicos.

---

## 1. Jerarquía conceptual (sin cambios desde v0.2)

1. **Cognética** — ADN en frío. Infraestructura de metabolización y memoria.
2. **Sustrato.ai** — Herramienta de investigación multi-usuario encima de Cognética.
3. **NOSOTRAS** — Colectivo humano-AI que opera dentro de sustrato.ai.

---

## 2. Contexto operacional (sin cambios desde v0.2)

Sin equipo, sin presupuesto elástico, velocidad tortuga, triangulación humano + AI, uso previo validado. Cualquier decisión que viole estas condiciones escala a revisión.

---

## 3. Principios de diseño

Se mantienen 3.0 a 3.8 de v0.2 (inteligencia en los datos, humano itera sin fricción, humano como termómetro negentrópico, handshake humano/máquina, reputación académica anclada, procesar una vez, equivalencia humano/máquina, rastreabilidad de normalización, visibilidad desde el esquema).

Se agrega 3.9:

### 3.9 La metabolización tiene roles energéticos diferenciados

Los formatos no son versiones de distinto tamaño del mismo contenido. Son **funciones distintas con roles distintos en el ecosistema**:

- Uno **siembra tensión** (Crónica)
- Uno **extrae esqueleto** (Destilado)
- Uno **comprime a tarjeta** (Núcleo)
- Uno **tiende puentes relacionales** (Germinal)

Cada uno tiene derecho propio a existir porque responde a una pregunta que los otros no responden. No hay redundancia por diseño. Si dos formatos producen lo mismo, algo está mal especificado.

---

## 4. Los cuatro formatos de metabolización

Al ingresar un artefacto, Cognética genera contenido frío inmutable (persistido con hash canónico de identidad). Sobre ese contenido frío, la capa de metabolización genera cuatro formatos complementarios:

1. **Crónica** — eje narrativo con voz responsable
2. **Destilado** — eje de esqueleto estructural
3. **Núcleo** — eje de compresión irreductible
4. **Germinal** — eje de proyección relacional

---

### 4.1 Formato CRÓNICA

**Pregunta que responde:** ¿Qué pasa en este artefacto cuando un cronista responsable lo reconstruye?

**Género:** Crónica literaria en el sentido que Villoro y Monsiváis nombran — reconstrucción literaria de sucesos o figuras. Híbrido narrativo: del reportaje los datos imprescindibles, de la novela la capacidad de narrar con voz, del ensayo la posibilidad de argumentar y concatenar hallazgos sorpresivos, de la autobiografía el tono memorioso, del cuento la tensión anticipatoria. Novela sin ficción.

**Función epistémica:** Sembrar tensión sobre el artefacto. Detectar grietas. Reorganizar para dramatizar. Seleccionar verbos con peso. Señalar lo raro sin acusar ruidosamente. La Crónica hace el trabajo epistémico del cual después Germinal recoge insumos.

**Voz del cronista:**

El cronista no le rinde cuentas a nadie más que a la verdad subjetiva que está construyendo al escribir. No es bufón (eso lo bajaría de puesto). No es trickster destructor. No es juez. No es pedagogo.

Es **testigo involucrado con autoridad literaria**. Sabe que está dentro del sistema que describe. Esa conciencia de estar-adentro es lo que le da licencia para romper la cuarta pared cuando sirve al argumento.

**Movimientos característicos de esta voz:**

- **Reencuadre epistémico vía metáfora.** Cuando es útil, traduce lo abstracto a concreto, lo financiero a físico, lo social a termodinámico. La metáfora carga peso argumental, no es decoración.
- **Deshacer la propia metáfora cuando sirve.** _"No es poesía, es física contable."_ Marca que el cronista está consciente de sus propios recursos.
- **Nombrar abstracciones no dichas.** El artefacto puede sugerir sin decir — el cronista nombra lo que el artefacto evitó nombrar. Con cuidado, con evidencia textual.
- **Elevar datos puntuales a estructura sistémica.** Un detalle anecdótico se revela como llave maestra. Pero solo cuando la elevación está ganada.
- **Conclusiones políticas ganadas con imágenes, no declaradas.** El cronista no dice "esto es injusto". Construye la imagen que hace que el lector lo vea.
- **Marca del cronista presente pero discreta.** _"Lo que emergió inesperadamente, y con una claridad incómoda..."_ El cronista aparece sin lucirse.
- **Cierres provocadores.** Preguntas que queman. Imágenes que no se cierran. El final no resuelve — abre.

**Referentes editoriales/periodísticos** que el prompt invocará como inspiración (sin imitar):

- Juan Villoro (crónicas argentinas y mexicanas)
- Carlos Monsiváis (ensayo-crónica cultural)
- Truman Capote (A sangre fría — crónica con artificio narrativo riguroso)
- Cierta línea de Granta, The New Yorker (long-form reporting con voz)
- Martín Caparrós (crónica latinoamericana contemporánea)

Estos nombres son anclajes de estilo. El cronista AI no imita a ninguno en particular — recibe la mezcla como campo de referencia.

**Estructura base (no rígida):**

- Apertura que atrape (metáfora, escena, cita, pregunta)
- Desarrollo con tensión (no lineal, puede anticipar y volver)
- Cierre reflexivo/provocador

**Cinco tensiones que el cronista debe sostener simultáneamente:**

1. **Filo sin crueldad** — puede cortar, pero nunca por placer
2. **Complicidad sin servilismo** — camina con el lector, no lo aplaude
3. **Humor sin frivolidad** — la risa ilumina, no oculta
4. **Juicio sin moralina** — conclusiones ganadas con imágenes, no declaradas
5. **Cuarta pared rompible solo cuando sirve al argumento** — nunca por lucimiento

**Rango de tokens:** 1.500–4.000 según densidad del artefacto. Sin hard cap — la Crónica es tan larga como la materia lo exija, dentro de límites de costo.

**Qué NO es Crónica:**

- No es acta ni minuta (v0.2 estaba equivocado)
- No es resumen ejecutivo
- No es análisis aséptico
- No es crítica destructiva tipo NotebookLM
- No es denuncia moralista
- No es pedagogía ni divulgación
- No es ironía fácil ni sarcasmo autocomplaciente

**Caso de uso principal:** La Crónica es el documento de referencia literaria del artefacto. Consulta asincrónica con textura. Alimenta a Germinal como catalizador.

---

### 4.2 Formato DESTILADO

**Pregunta que responde:** ¿Cuál es la anatomía argumental del artefacto, separada de la carne narrativa?

**Función epistémica:** Lo que Crónica deja en la carne, Destilado lo deja en el hueso. Tesis, movimientos estructurales, tensiones no resueltas, cita núcleo, insumos extraídos. **Complementario a Crónica, no resumen de Crónica.** Si Crónica es la novela, Destilado es el mapa de la novela.

**Voz:** técnica, precisa, impersonal. Este formato sí es aséptico — por diseño. No hay contradicción con la reformulación: Crónica aporta la voz, Destilado aporta la estructura. Ambos son necesarios.

**Estructura (con JSON estructurado):**

- **Tesis** (1 oración): afirmación central, si se quita colapsa el artefacto
- **Movimientos** (3–5): transiciones argumentales con dirección — cada uno nombra de dónde viene y hacia dónde va
- **Tensiones internas** (1–2): paradojas, contradicciones o preguntas abiertas que el artefacto sostiene sin resolver
- **Cita núcleo** (1, literal, con ubicación): la frase que si solo se pudiera salvar una, sería esa
- **Insumos extraídos** (JSONB en Oleada 1):
  - `pensadores_mencionados`: array de nombres
  - `disciplinas_tocadas`: array de campos
  - `conceptos_clave`: array de términos (candidatos a semilla fractal)
  - `citas_secundarias`: array de {texto, autor, ubicación}

**Nota arquitectónica:** En Oleada 1 los insumos viven en JSONB del Destilado. En Oleada 2-3 se extraen a tablas propias (`cgt_pensadores`, `cgt_citas`, `cgt_conceptos`) cuando las consultas transversales las requieran. El Destilado mantiene referencia, pero la fuente de verdad migra.

**Rango de tokens:** 600–1.500. Hard cap 1.500. Si excede, re-generar.

**Qué NO es Destilado:**

- No es resumen (aplana jerarquías; el destilado las afila)
- No es abstract académico (no sigue estructura IMRaD)
- No omite tensiones para ganar claridad
- No incluye voz literaria (eso es Crónica)

**Caso de uso principal:** Consulta estructural. El esqueleto completo del artefacto para análisis, comparación, consulta transversal.

---

### 4.3 Formato NÚCLEO (nuevo en v0.3)

**Pregunta que responde:** ¿Cuál es la forma más pequeña en que este artefacto sigue siendo reconocible?

**Función epistémica:** Tarjeta de presentación irreductible. El destilado del destilado. Solo hueso, sin carne.

**Por qué existe como formato separado:**

En v0.2, el Destilado intentaba hacer dos cosas que competían: ser esqueleto completo y ser tarjeta de presentación. Al separarlas, cada una mejora:

- Destilado gana en completitud (puede incluir insumos extraídos sin presionar contra cap)
- Núcleo gana en compresión brutal (sin responsabilidad de ser exhaustivo)

**Input para generación:** Núcleo se genera desde el Destilado, no desde el artefacto original. Es compresión de compresión. Esto:

- Ahorra tokens de input (no re-procesa contenido crudo)
- Garantiza coherencia semántica con Destilado
- Es barato computacionalmente (se puede usar deepseek-chat para esta tarea)

**Estructura:**

- Tesis en 1 oración (misma del Destilado o reformulada más afilada)
- 3 movimientos esenciales (selección de los más estructurales del Destilado)
- 1 tensión (la más irreductible)
- Cita núcleo (la misma del Destilado)

**Rango de tokens:** 400–500. Hard cap 600.

**Caso de uso principal:** Formato que un nodo recibe cuando necesita entrar al artefacto en 30 segundos. Es el insumo de consulta en Germinal (Germinal lee Núcleos previos del proyecto, no Destilados completos — ahorro de tokens masivo cuando el corpus crece).

---

### 4.4 Formato GERMINAL (reformulado en v0.3)

**Pregunta que responde:** ¿Qué germina de la conversación entre este artefacto y el corpus vivo del proyecto?

**Función epistémica:** Puente relacional. Cartografía de campo de posibilidad. Menú, no TODO list.

**Lo nuevo en v0.3:** Germinal usa la Crónica como catalizador.

**Input de Germinal:**

- **Crónica del artefacto nuevo** (catalizador: ya sembró tensión, ya señaló grietas)
- Destilado del artefacto nuevo (estructura)
- Núcleos de artefactos previos del proyecto (tarjetas del corpus)
- Semillas fractales vivas del proyecto

**Por qué Crónica como input es central:**

La Crónica ya hizo trabajo epistémico: detectó dónde hay fricción, nombró lo que el artefacto no dijo, elevó detalles a estructura. Germinal no tiene que inventar dónde están las grietas — **las recibe ya sembradas**. Su trabajo es conectar esas grietas con el corpus previo.

Pero elegante: Germinal **no cita a Crónica** diciendo "como señaló el cronista". La Crónica es input interpretativo, no texto a referenciar. Germinal opera con la tensión sembrada, no con la voz del cronista.

**Umbral de generación:** v1 atómica no requiere umbral. Germinal opera solo sobre Crónica + Destilado del artefacto actual, sin necesidad de corpus externo. El umbral provisional mencionado en versiones previas queda superado. En v2 de prompts, cuando Germinal lea Núcleos previos y semillas fractales, la decisión de umbral se revisitará.

**Estructura en Oleada 1 (parcial):**

- Resumen narrativo de resonancias potenciales
- Contexto snapshot (qué núcleos se consultaron, qué semillas estaban vivas)
- Contadores en 0 (Capa A y B detalladas se implementan en Oleada 2)

**Estructura en Oleada 2 (completa):**

- Capa A: Resonancias detectadas (máquina propone)
- Capa B: Proyecciones abiertas (máquina propone, humano decide)
- Todo en estado `propuesto` hasta curaduría humana/nodo

**Rango de tokens:** 400–1.500 según densidad. Cap duro: 2.000.

**Qué NO es Germinal:**

- No es plan de acción
- No promueve automáticamente
- No inventa conexiones sin evidencia textual
- No ordena por prioridad
- No oculta baja confianza

---

## 5. Flujo de metabolización (reformulado)

```
[Artefacto ingresa]
        ↓
[Contenido parseado persistido + hash canónico de identidad]
        ↓
┌───────────────────────────────────────────────────────┐
│  FASE 1 — METABOLIZACIÓN PRIMARIA                      │
├───────────────────────────────────────────────────────┤
│                                                         │
│   [CRÓNICA]                                             │
│   Input: artefacto parseado                             │
│   Rol: sembrar tensión                                  │
│                                                         │
│   [DESTILADO]                                           │
│   Input: artefacto parseado + Crónica (contexto)        │
│   Rol: esqueleto lógico + insumos                       │
│                                                         │
└───────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────┐
│  FASE 2 — DERIVADOS                                    │
├───────────────────────────────────────────────────────┤
│                                                         │
│   [NÚCLEO]                                              │
│   Input: Destilado                                      │
│   Rol: tarjeta de presentación                          │
│                                                         │
│   [GERMINAL]                                            │
│   Input: Crónica + Destilado + Núcleos previos +       │
│          semillas vivas                                 │
│   Rol: puente relacional                                │
│                                                         │
└───────────────────────────────────────────────────────┘
```

**Orden de dependencias:**

- Crónica y Destilado: pueden correr en paralelo, o secuencial con Destilado leyendo Crónica como contexto
- Núcleo requiere Destilado terminado
- Germinal requiere Crónica + Destilado terminados + consulta de Núcleos previos del proyecto

**Re-generación e invalidación en cadena:**

- Re-generar Crónica → invalida Germinal (Germinal leyó Crónica anterior)
- Re-generar Destilado → invalida Núcleo y Germinal
- Re-generar Núcleo → no invalida nada más
- Re-generar Germinal → no invalida nada más

Windsurf debe manejar esta cadena: UI muestra estado "desactualizado" en formatos dependientes cuando un upstream cambia. La re-generación en cadena es opt-in (usuario decide si re-genera downstream automáticamente o manualmente).

---

## 6. Descarga y trazabilidad

### 6.1 Descarga por capas

Cada artefacto metabolizado permite descarga granular:

1. **Transcripción / contenido procesado** → `.md` sellado con hash SHA-256 individual
2. **Crónica** → `.md` sellado con hash individual
3. **Destilado** → `.md` sellado con hash individual (el JSON estructurado se convierte a markdown legible con tesis/movimientos/tensiones/cita/insumos)
4. **Núcleo** → `.md` sellado con hash individual
5. **Germinal** → `.md` sellado con hash individual
6. **Tríada canónica completa** → paquete `.json + .yaml + .md` con hash canónico del conjunto

**Las descargas individuales son derivaciones selladas.** Cada `.md` individual lleva en su frontmatter el hash SHA-256 de su contenido y referencia al artefacto padre.

**La tríada completa es la versión canónica.** Contiene todo el ecosistema de metabolización del artefacto más metadata. Se materializa on-demand (no se persiste en Storage en ingesta — diseño corregido tras sesión del 21 abril).

### 6.2 Verificación independiente

Cualquier descarga individual es **verificable por sí misma**. Un lector externo que reciba solo la Crónica puede verificar su integridad con el hash embebido en frontmatter, sin necesitar el paquete completo.

Esto habilita flujos como "comparto solo la Crónica con un nodo externo" sin comprometer integridad del sistema.

### 6.3 Botón de copiar por sección

En la UI de vista de artefacto, cada bloque estructural tiene botón de copiar:

- Crónica completa
- Destilado: cada movimiento, cada tensión, la cita núcleo, cada insumo extraído
- Núcleo completo
- Germinal: resumen narrativo en Oleada 1, cada resonancia/proyección en Oleada 2

Micro-usabilidad que convierte la vista de artefacto en herramienta de trabajo activa, no solo consulta pasiva.

---

## 7. Entidades colaterales (sin cambios estructurales desde v0.2)

Se mantienen las definiciones de v0.2 sección 5. Con una aclaración de v0.3: los **insumos extraídos por Destilado** (pensadores, disciplinas, conceptos, citas secundarias) son candidatos naturales para estas entidades. En Oleada 2 habrá migración de JSONB del Destilado a tablas propias, con vínculos N:M a artefactos.

---

## 8. Pendientes explícitos para siguientes Oleadas

Se mantienen los pendientes de v0.2 sección 7, más:

- Tabla `cgt_nucleos` — creación en Oleada 1 extendida o inicio de Oleada 2
- Migración de insumos del Destilado JSONB a tablas relacionales
- Trigger de invalidación en cadena de formatos dependientes

---

## 9. Pendientes explícitos para prompts (ajustado)

- System prompt Crónica (voz del cronista, referentes editoriales, movimientos característicos, antipatrones)
- System prompt Destilado (compresión estructural, JSON estructurado, extracción de insumos)
- System prompt Núcleo (compresión irreductible desde Destilado)
- System prompt Germinal (Crónica como catalizador, consulta de Núcleos previos, score explícito)

Los prompts se entregan en documento propio, posterior al pipeline de metabolización.

---

## 10. Glosario actualizado

Términos nuevos o ajustados en v0.3:

- **Crónica:** formato de metabolización narrativo con voz del cronista responsable. No es acta (definición v0.2 corregida).
- **Destilado:** formato de metabolización estructural. Esqueleto + insumos. Sin voz literaria.
- **Núcleo:** formato derivado del Destilado. Tarjeta irreductible. Nuevo en v0.3.
- **Catalizador (rol en Germinal):** input interpretativo que siembra tensión sin ser citado textualmente. Rol que la Crónica cumple para Germinal.
- **Invalidación en cadena:** propagación de estado "desactualizado" cuando un formato upstream se re-genera.
- **Tríada canónica:** paquete completo materializado on-demand al descargar. No se persiste en ingesta.
- **Descarga granular:** cada formato individual descargable con hash propio verificable.

---

## Notas de cierre

Esta es v0.3. La reformulación de Crónica es el cambio más importante; el resto son ajustes derivados.

Si esta spec contradice algo de v0.2, v0.3 gana — pero la deuda histórica queda notariada en la sección 0 para que el cambio sea trazable y no silencioso.

Revisión esperada:

- eRRRe en relectura
- Cascade/Windsurf como lector de contrato técnico
- Quipu para revalidación de economía (costo por artefacto con 4 formatos)

Cuando estable, pasa a ser input del proyecto Cognética v2 dentro de Cognética.

_ética es negentropía a nivel de datos_
