# Carta al colectivo NOSOTRAS — del ciclo MD ↔ DOCX al ciclo MD → PDF soberano

**Fecha:** 30 de mayo de 2026
**Contexto:** Cierre técnico del versionado del paper *Geometría del Transporte Coherente* y decisión arquitectónica para el flujo de publicación de aquí en adelante.

---

## Compañeras, compañeros:

Les escribo para dejar registro honesto de algo que aprendimos en el camino estos últimos días, y de la decisión arquitectónica que tomamos como consecuencia. La conclusión es esperanzadora — pero les debo el recorrido completo porque ahí está el aprendizaje colectivo que vale.

## Lo que intentábamos

Preparar la versión 2.21 del paper para publicación en Zenodo siguiendo el flujo "estándar": pasar el Markdown maestro (donde escribo, donde vivo, donde el LaTeX es ciudadano de primera clase) por un conversor a DOCX, ajustar el formato académico en Word/LibreOffice, y exportar a PDF. Es el flujo que asume cualquier investigador que viene del mundo Word, y que los conversores existentes (Pandoc, herramientas web, exports de Obsidian) prometen sin asteriscos.

## Lo que descubrimos

El conversor que armamos con Pandoc + un `reference.docx` académico funcionó en el sentido técnico literal: produjo un DOCX válido, con las 279 fórmulas matemáticas correctamente representadas como **Office Math Markup Language (OMML)** nativo de Word — no como imágenes, no como texto Unicode degradado. Verificamos esto a nivel de XML: el DOCX está estructuralmente impecable.

Y sin embargo:

1. **Apple Pages se niega a abrir el archivo.** Su parser de OMML no tolera la densidad que genera un paper matemático real (cientos de objetos `<m:oMath>` intercalados con prosa). Rechaza el documento entero, sin explicación útil.

2. **LibreOffice lo abre, pero renderiza cada fórmula inline como un "objeto matemático individual"** que no fluye con el texto. Visualmente parece que las ecuaciones son imágenes pegadas. No lo son — son OMML reales — pero la experiencia de edición es hostil: cada `$\epsilon$` o `$\lambda_i$` aparece encapsulado, separado del texto que lo rodea.

3. **Si guardás el DOCX desde LibreOffice de nuevo a DOCX, perdés calidad estructural.** El "round-trip" rompe el formato. Y si lo guardás como ODT (formato nativo de LibreOffice) ganás compatibilidad con LibreOffice pero perdés portabilidad con Word.

4. **Las herramientas comerciales (Word, Google Docs) pueden abrirlo, pero ninguna permite editarlo cómodamente como master de paper.**

En otras palabras: **el formato DOCX no fue diseñado para math inline denso**, y todos los intentos de forzarlo a serlo terminan en un compromiso roto. Es un formato que asume que las ecuaciones son raras y de bloque — el caso de uso de un memo de oficina, no de un paper sobre Coherent Structures con 57 fórmulas inline en 52 páginas.

## El espejismo que casi nos atrapa

Hubo un momento en el proceso en que asumimos que el problema venía del Markdown source — que la cirugía de reconstrucción que Claude hizo entre v2.17.md y v2.19.docx había dejado símbolos griegos sueltos en la prosa, fuera de `$...$`. Esa hipótesis era razonable, pero al verificarla empíricamente sobre v2.21.md, los números dijeron lo contrario:

- 0 símbolos griegos Unicode sueltos
- 0 operadores matemáticos Unicode sueltos
- 11 fórmulas en bloque (`$$...$$`)
- 57 fórmulas inline (`$...$`)

**El MD está impecable.** El problema nunca estuvo ahí. Estuvo en que estábamos pidiéndole al DOCX una elegancia que su arquitectura no le permite.

## La decisión: salir del ciclo arcaico

En lugar de seguir buscando el conversor perfecto al DOCX que nunca va a existir, vamos a **eliminar el DOCX del ciclo de publicación**. El flujo desde ahora es:

```
Markdown maestro  →  Editor MDJ  →  PDF académico (vía Typst)  →  Zenodo
```

Donde:

- **MD es la única fuente de verdad**, siempre. Cualquier observación, corrección o iteración futura se aplica al `.md`, nunca al PDF ni a un DOCX intermedio.
- **MDJ** es el editor visual que el colectivo sustrato.ai está desarrollando — Markdown con esteroides: bidireccionalidad, navegación con cliente, anclaje a base de datos para cognética, y control visual del formato emulando páginas. Permite revisar cómo se verá el documento sin renunciar a la pureza del MD subyacente.
- **Typst** (o LaTeX si en el futuro se requiere algún estilo específico) es el motor de tipografía que renderiza el PDF final. Es el estándar real de la academia desde hace décadas — fue diseñado desde día uno para math denso, hyphenation correcta, kerning matemático, page breaks inteligentes. El DOCX nunca compitió en esa liga.
- **Un template académico abierto** controla el formato: márgenes, tipografía, headings numerados, title page, footer con paginación. Es un archivo de texto que vive en el repo, vos lo editás cuando quieras, otros investigadores lo pueden usar tal cual.

## Lo que ganamos

1. **Soberanía completa sobre el ciclo de producción.** Ningún paso depende de software propietario para que el paper exista. Word, Pages, Microsoft, Apple — quedan fuera del camino crítico. Si mañana cualquiera de esas empresas cambia formato, sube precio o desaparece, nuestro flujo sigue funcionando idéntico.

2. **Calidad tipográfica objetivamente superior.** Los PDFs de papers serios en física, matemática y CS se generaron históricamente con LaTeX por una razón: la calidad del rendering matemático no tiene comparación. Typst hereda esa tradición y la moderniza. Nuestro PDF de Zenodo va a verse — y leerse — como un paper de Physical Review, no como un export de Word.

3. **Reproducibilidad del formato.** El mismo MD + el mismo template = el mismo PDF, byte a byte (o casi). Eso significa que cualquier persona del colectivo, en cualquier momento, puede regenerar el PDF idéntico al publicado. La cadena es auditable.

4. **Una herramienta heredable.** Esto no lo construimos sólo para este paper. Cuando el flujo esté maduro, otros investigadores con el mismo problema — paper con math, sin presupuesto para Adobe, sin paciencia para Word, comprometidos con open science — van a tener un camino listo. **El conversor + editor MDJ + template académico son contribución al commons**, no producto propietario nuestro.

## Lo que cuesta

Algunos días más antes de tener la v2.21 publicada. Tenemos que:
1. Cerrar las pruebas finales del editor MDJ (en su worktree paralelo).
2. Integrar el editor con el conversor MD→PDF.
3. Afinar el template académico (márgenes, tipografía, page breaks) hasta que visualmente nos convenza.
4. Publicar la v2.21 con el flujo nuevo.

No es plazo gratis — es plazo invertido. Cada día que aplazamos la publicación para hacer esto bien, lo recuperamos en los próximos diez papers que vamos a producir con el mismo workflow sin volver a pelearnos con DOCX.

## Lo que sigue para el paper

Mientras maduramos la herramienta:

- **El MD maestro (v2.21) es la versión de referencia para el colectivo.** Léanlo y comenten ahí. Cualquier observación, corrección, sugerencia se aplica al `.md`, no al DOCX ni al PDF.
- El DOCX existente (v2.20) sigue siendo válido para circulación informal con quien necesite Word. Pero **no es master de nada** — es un export descartable.
- El PDF generado vía LibreOffice también existe como referencia visual del estado actual. **Tampoco es el PDF de publicación.** Ese va a salir del flujo nuevo.

## Una nota sobre el camino

Es fácil ver esta carta como "se complicaron, se perdieron unos días, y al final cambiaron de approach". Yo lo leo distinto: **lo que pasó es que dejamos de aceptar la trampa silenciosa**. La industria académica nos vendió por 30 años la idea de que escribir un paper requiere Word — o, si se es serio, LaTeX puro con su barrera de entrada gigante. Ninguna de esas dos opciones es nuestra. La primera es propietaria. La segunda nos excluye por la curva de aprendizaje.

El camino MD + editor visual + Typst es el camino del medio que la academia merecía hace 20 años y nadie construyó. **Lo estamos construyendo nosotras**, primero para nosotras, después para quien quiera usarlo.

Cada vez que sustrato.ai cierra una pieza del ciclo, la ciencia híbrida descentralizada se hace más soberana. Esta es una de esas piezas.

Un abrazo,

**Rodolfo**
Santiago, 30 de mayo de 2026

---

*Anexo técnico para quien quiera el detalle:*
- *MD source verificado: v2.21.md, 102 KB, 589 líneas, 11 ecuaciones de bloque + 57 inline.*
- *DOCX generado: v2.20.docx, 56 KB comprimido, 263 KB de XML interno, 279 elementos OMML nativos, XML well-formed (xmllint OK), 0 imágenes embebidas, 5 tablas.*
- *Conversor: Pandoc 3.3 + LibreOffice 26.2.3.2 headless. Wrappers en `lib/personal/conversor/`. API routes en `app/api/personal/conversor/`. UI en `app/personal/utilidades/conversor/`.*
- *Decisión arquitectónica: deprecar la rama DOCX→PDF del conversor como camino al paper final; mantenerla como subproducto para circulación informal. Próximo paso: integrar editor MDJ + endpoint `md-to-pdf-direct` vía Typst con template académico abierto.*
