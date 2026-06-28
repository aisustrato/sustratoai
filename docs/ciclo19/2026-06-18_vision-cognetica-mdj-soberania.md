# Sustrato — investigar con IA sin perder soberanía

> La visión detrás de Cognética, el visor MDJ y la trazabilidad.
> Ciclo 19 · 2026-06-18 · borrador vivo

Este no es un documento técnico. Es el "para qué". Si más adelante alguien
quiere entender por qué Sustrato está hecho como está hecho —y no de la forma
"normal"— esto es lo que hay que leer primero.

---

## La idea en una frase

Un espacio para investigar con ayuda de IA donde **el humano y la IA trabajan
sobre exactamente la misma información**, esa información **se puede ver,
personalizar y auditar**, y **nada de eso depende de la buena voluntad de una
empresa**.

Todo lo demás —los formatos, los colores, los hashes, los nodos— son medios
para sostener esa idea.

---

## 1. Personalizar al humano vale más que automatizar

Sustrato tiene temas y tipografías propias. No es decoración: leer mucho rato,
investigar, comparar, anotar, es un acto físico y cansa. Que cada quien pueda
ajustar **cómo se ve** su material de trabajo —colores, par tipográfico, más
sobrio o más ecléctico— no es un lujo, es respeto por la persona que está horas
ahí adentro.

El visor MDJ se suma a eso: el mismo documento se puede ver **resaltado a todo
color**, en **modo mono**, o **sin marcas** si uno quiere leer limpio. Y cuando
hay más de un proyecto, **el color sirve para diferenciarlos de un vistazo**
(medio a lo *vista de estudio*, sí, pero en serio ayuda). La regla de fondo:
**primero el humano**. Automatizar viene después.

---

## 2. El MDJ: leer y moverse, no solo mirar

Sobre el texto curado, el MDJ agrega **ayudas visuales**: los autores, las
ideas, las teorías, las citas aparecen **marcados dentro del propio texto**, con
su ficha a un toque y un camino fácil para **saltar entre apariciones** o ir a
**todo lo que el proyecto sabe de esa entidad**. La información deja de estar
suelta: queda **correlacionada y a la mano**.

La gracia es que ese resaltado no es un adorno calculado al vuelo y olvidado:
**se ancla a una dirección estable del documento**, así el humano y la IA pueden
señalar el mismo pedazo de texto y entenderse sin ambigüedad.

---

## 3. Multiformato de entrada, soberanía sobre la conversión

Nadie se pone de acuerdo con los formatos. Las casas no facilitan bajar tus
cosas de sus formatos propietarios, y el PDF —ese formato infame, lo más
anti-humano y anti-IA que existe— sigue siendo el estándar de facto.

Cognética es **multiformato desde la entrada** justamente por eso. La idea no es
depender de la API de visión de turno ni del conversor de cada empresa (que
además casi nunca aceptan audios largos). Ejemplo concreto: en Sustrato se puede
**metabolizar un audio de 30 minutos** (vía Whisper en un distribuidor) por
**centavos** para un uso personal intenso. Con los PDF, el usuario puede mirar
la página original y **cambiar al texto** —y ver el nodo con el que la IA
interactúa.

El punto: **después de que el humano cura la información, humano e IA comparten
la misma versión.** No dos lecturas distintas del mismo PDF; **una sola**.

---

## 4. Distribuidores y control del gasto

Una apuesta de fondo: el futuro pasa por **distribuidores** tipo Replicate. Ahí
tenés **opciones, control de tus gastos y nuevos lanzamientos** sin atarte. Si
una semana no lo usás, **nadie te cobró una mensualidad** por nada.

Sustrato **trae tu propia llave**, tiene un **gestor de trabajos** y un
**contador de tokens**: todo prueba de concepto, pero ya bastante robusto.
Pasarlo a "llave en mano" debería ser trivial el día que tenga sentido. Hoy no
hay fecha de salida pública; lo que sí existe es el respaldo: **ORCID,
artículos bajo sustrato.ai, investigador independiente, ciencia libre, en
Zenodo**.

---

## 5. Determinismo sin bases vectoriales

Sustrato **no usa bases vectoriales**, y es una decisión de **soberanía**, no
una limitación. Lo que da garantías es el **determinismo**: **formatos fijos que
tanto el humano como la IA pueden ver, adoptar y relacionar**. Mismo documento,
mismas direcciones, siempre.

Ahí recién cobra sentido el MDJ: es la capa donde ese texto determinista se
vuelve **navegable y señalable** por ambos.

---

## 6. Trazabilidad: ciencia replicable y abierta

El SHA-256 no está por moda. Está para que **todo el proceso de investigación
pueda auditarse**, con el espíritu de la **ciencia replicable y abierta**. La
intención es que Sustrato pueda algún día ser **open science** de verdad.

En concreto:

- Los documentos de Cognética son **terreno de trabajo común** del humano y de
  los agentes que ayudaron en la investigación.
- Las **modificaciones son append-only**: se agregan para **corregir errores**
  (generalmente nombres), nunca para borrar el rastro.
- Al publicar, si alguien quiere **auditar el uso de IA**, la auditoría está **a
  un clic**: se baja el artefacto con **hash y timestamps claros**, e incluso se
  pueden incluir los **chats** si hace falta.
- La tríada se puede exportar también en **YAML y JSON** —pensado, de nuevo,
  para ser **legible por humanos y por IA** a la vez.

Compartir un artefacto = compartir su procedencia verificable.

---

## 7. El horizonte: escribir y pensar *con* los nodos

Lo anterior es la base. El siguiente paso es un **contexto de escritura/trabajo
híbrido**, donde el investigador **actúe junto a los nodos** y comparta con
ellos las referencias de su proyecto de Cognética.

Ejemplo real: el proyecto trata sobre el **corazón helicoidal** de Francisco
Torrent-Guasp. Estoy conversando de un tema y aparece la cardiología; en ese
momento puedo **acceder a los documentos del proyecto que hablan de eso**,
elegir el artefacto, **el párrafo justo que necesito**, y **traerlo a la
conversación**. Sin salir, sin perder el hilo, sin perder la procedencia.

Eso es lo que el MDJ y la trazabilidad están preparando: que investigar con IA
sea **soberano, auditable y profundamente humano**.

---

*Borrador vivo. Se corrige append-only, como todo acá.*
