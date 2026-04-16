# 🐛 Bug Crítico: Filtrado Multifase Compuesto con Múltiples Iteraciones

**Fecha:** 6 Abril 2026  
**Estado:** SOLUCIONADO (Intento 4)  
**Severidad:** CRÍTICA - Afecta análisis de preclasificación multifase

---

## 📋 Descripción del Problema

Al aplicar **filtros compuestos** (múltiples dimensiones de diferentes fases), el sistema muestra resultados incorrectos:

### Escenario de Prueba

- **Filtro 1:** "Personas mayores como población objetivo" = **Sí** (Fase 1) → 56 artículos esperados
- **Filtro 2:** "Operadores" = **Adultos Mayores** (Fase 2) → 67 artículos esperados
- **Resultado esperado:** 56 artículos (intersección AND - artículos que cumplen AMBOS)
- **Resultado actual:** 1 artículo ❌

### Síntomas Observados

1. Con un solo filtro activo, las dimensiones de otras fases muestran (0)
2. Con dos filtros activos, solo muestra 1 artículo en lugar de 56
3. El conteo no cuadra entre fases

---

## 🔍 Causa Raíz Identificada

### Problema de Múltiples Iteraciones

Los artículos pueden tener **múltiples clasificaciones** para la misma dimensión:

- **Iteración 1:** Clasificación de IA
- **Iteración 2:** Revisión humana (puede diferir de la IA)
- **Iteración 3:** Reconciliación (en caso de desacuerdo)

**Estructura en BD:**

```typescript
// article_dimension_reviews
{
	article_batch_item_id: string;
	dimension_id: string;
	classification_value: string;
	iteration: number; // 1, 2, o 3
	confidence_score: number;
}
```

**Problema:** El filtrado debe usar **SIEMPRE** la clasificación de la **iteración más alta** (última decisión), pero la lógica actual no lo garantiza consistentemente en todos los casos.

---

## 🔄 Iteraciones de Solución Intentadas

### Intento 1: Corrección de Lógica de Items Sin Clasificación

**Archivo:** `lib/actions/preclassification-actions.ts:4008-4016`

**Problema detectado:** Artículos sin clasificación en una dimensión se agregaban incorrectamente.

**Solución aplicada:**

```typescript
if (!data || !data.value) {
	// Si hay filtros de inclusión, el item NO pasa
	if (includeValues.length > 0) continue;
	// Solo si hay filtros de exclusión (sin inclusión), SÍ pasa
	if (excludeValues.length > 0 && includeValues.length === 0) {
		newCandidates.add(itemId as string);
	}
	continue;
}
```

**Resultado:** Parcialmente correcto, pero no resolvió el problema principal.

---

### Intento 2: Eliminación de Expansión Multifase

**Archivo:** `lib/actions/preclassification-actions.ts:4375-4390`

**Problema detectado:** La expansión multifase re-incluía batch_items que NO pasaron el filtro.

**Solución aplicada:**

```typescript
// Usar EXACTAMENTE los batch_items que pasaron el filtro
itemIdsToUse = filteredItemIds;
```

**Resultado:** Causó que dimensiones de otras fases mostraran (0). Solución incorrecta.

---

### Intento 3: Expansión Multifase Dentro de getFilteredArticleIds

**Archivo:** `lib/actions/preclassification-actions.ts:4057-4079`

**Problema detectado:** Necesitamos filtrar a nivel de artículo (AND) pero expandir a todos los batch_items.

**Solución aplicada:**

```typescript
// Extraer article_ids únicos de los batch_items que pasaron
const filteredArticleIds = new Set(
	allItems
		.filter((item: any) => candidateItemIds.has(item.id))
		.map((item: any) => item.article_id),
);

// Expandir a TODOS los batch_items de esos artículos
const expandedItemIds = allItems
	.filter((item: any) => filteredArticleIds.has(item.article_id))
	.map((item: any) => item.id);
```

**Resultado:** Las dimensiones de otras fases ahora muestran datos, pero el filtrado compuesto sigue fallando (solo 1 artículo en lugar de 56).

---

### Intento 4: Reescritura Completa a Nivel de article_id (SOLUCIÓN DEFINITIVA)

**Archivo:** `lib/actions/preclassification-actions.ts:3919-4103`

**Diagnóstico riguroso paso a paso del bug:**

```
Estructura de datos:
  Artículo X:
    ├── Fase 1 → batch_item_AAA
    │     └── review: dim="Personas mayores", value="Sí"
    └── Fase 2 → batch_item_BBB
          └── review: dim="Operadores", value="Adultos Mayores"

Flujo del código ANTERIOR (roto):
  1. candidateItemIds = {AAA, BBB}
  2. Filtro 1 (dim="Personas mayores", include="Sí"):
     - Query: WHERE dimension_id=X AND batch_item_id IN (AAA, BBB)
     - Solo AAA tiene review → itemData = {AAA: "Sí"}
     - BBB NO tiene data → includeValues.length > 0 → EXCLUIDO
     - candidateItemIds = {AAA}  ← Solo Fase 1 sobrevive
  3. Filtro 2 (dim="Operadores", include="Adultos Mayores"):
     - Query: WHERE dimension_id=Y AND batch_item_id IN (AAA)
     - AAA NO tiene review de "Operadores" (está en BBB, ya eliminado)
     - reviews.length === 0 → continue (FILTRO SE SALTA)
     - candidateItemIds = {AAA}  ← Segundo filtro NUNCA SE APLICÓ
  4. Resultado: 1 artículo (solo lo que pasó filtro 1)
```

**Causa raíz:** El loop filtraba por `batch_item_id` (específico de fase). Después del primer filtro, los batch_items de otras fases se eliminaban, haciendo imposible que el segundo filtro encontrara sus reviews.

**Cambio de 56→50:** El cambio en el manejo de items sin clasificación (Intento 1) excluía artículos que antes pasaban por tener `data=null` en una dimensión.

**Solución implementada:**

```typescript
// ANTES: Candidatos = Set<batch_item_id>
let candidateItemIds = new Set(allItems.map((item) => item.id));

// AHORA: Candidatos = Set<article_id>
const articleToBatchItems = new Map<string, string[]>(); // article_id → [batch_item_ids]
let candidateArticleIds = new Set(articleToBatchItems.keys());

// Para cada filtro: buscar reviews en TODOS los batch_items del universo
// Agrupar por article_id, tomar MAX(iteration) POR ARTÍCULO
// Filtrar a nivel de article_id (intersección AND correcta)

// Al final: expandir artículos filtrados a TODOS sus batch_items
```

**Cambios clave:**

1. `candidateItemIds` (batch_item) → `candidateArticleIds` (article)
2. Reviews se buscan en TODOS los batch_items (no solo candidatos)
3. MAX(iteration) se calcula por article_id (no por batch_item_id)
4. Filtrado a nivel de artículo → intersección AND funciona entre fases
5. Al final: expandir a todos los batch_items de los artículos filtrados

**Resultado esperado:**

- Filtro 1 solo: 192 artículos (Fase 2 muestra datos de los mismos artículos)
- Filtro 1 + Filtro 2: 56 artículos (intersección AND correcta)
- Conteos idénticos en gráficos y tabla

---

## 🎯 Problema Actual No Resuelto

### Hipótesis: Inconsistencia en Selección de Iteración

**Líneas críticas:** `lib/actions/preclassification-actions.ts:3976-3984`

```typescript
// 🔥 IMPORTANTE: Filtrar solo la review con MAX(iteration) por artículo
const latestReviewsMap = new Map<string, Record<string, unknown>>();
reviews.forEach((r: any) => {
	const existing = latestReviewsMap.get(r.article_batch_item_id) as any;
	if (!existing || r.iteration > existing.iteration) {
		latestReviewsMap.set(r.article_batch_item_id, r);
	}
});
```

**Problema potencial:**

1. Este código filtra por `MAX(iteration)` **por cada dimensión** en el loop
2. Pero un artículo puede tener diferentes `batch_item_id` en diferentes fases
3. La lógica actual filtra por `article_batch_item_id`, no por `article_id`
4. Esto puede causar que se comparen iteraciones de **batch_items diferentes** del mismo artículo

### Ejemplo del Problema

**Artículo X:**

- Fase 1 (batch_item_1):
  - Dimensión "Personas mayores" → Iteración 2 = "Sí"
- Fase 2 (batch_item_2):
  - Dimensión "Operadores" → Iteración 1 = "Adultos Mayores"
  - Dimensión "Operadores" → Iteración 2 = "Personal Clínico"

**Filtrado actual:**

1. Filtro 1 evalúa batch_item_1 → Pasa ✅
2. Filtro 2 evalúa batch_item_2 → ¿Toma iteración 1 o 2?
3. Si toma iteración 1 ("Adultos Mayores") → Pasa ✅
4. Si toma iteración 2 ("Personal Clínico") → NO pasa ❌

**Resultado:** Inconsistencia en qué iteración se usa para cada batch_item.

---

## 🔬 Datos de Estructura Relevantes

### Tipos de Base de Datos (database.types.ts)

```typescript
article_dimension_reviews: {
	Row: {
		id: string;
		article_batch_item_id: string; // FK a article_batch_items
		dimension_id: string;
		classification_value: string | null;
		option_id: string | null;
		confidence_score: number | null;
		iteration: number | null; // 1, 2, o 3
		is_final: boolean | null;
		status: Database["public"]["Enums"]["batch_preclass_status"] | null;
		created_at: string | null;
		updated_at: string | null;
	}
}

article_batch_items: {
	Row: {
		id: string;
		batch_id: string;
		article_id: string; // El mismo artículo puede tener múltiples batch_items
		status: Database["public"]["Enums"]["batch_preclass_status"] | null;
		created_at: string | null;
		updated_at: string | null;
	}
}
```

### Relaciones Clave

- Un `article` puede tener múltiples `article_batch_items` (uno por fase)
- Cada `article_batch_item` puede tener múltiples `article_dimension_reviews` (una por iteración)
- El filtrado debe considerar **el mismo artículo** a través de diferentes `batch_item_id`

---

## 🚨 Problema Crítico Identificado

**La lógica actual filtra por `article_batch_item_id` (específico de fase), pero debería filtrar por `article_id` (transversal a fases) cuando hay filtros compuestos.**

### Flujo Actual (INCORRECTO)

1. Filtro 1 (Fase 1): Filtra batch_items de Fase 1 → Set A
2. Filtro 2 (Fase 2): Filtra batch_items de Fase 2 → Set B
3. Intersección: Set A ∩ Set B = **VACÍO** (porque son batch_items diferentes)

### Flujo Correcto (NECESARIO)

1. Filtro 1 (Fase 1): Filtra batch_items de Fase 1 → Extrae article_ids → Set A
2. Filtro 2 (Fase 2): Filtra batch_items de Fase 2 → Extrae article_ids → Set B
3. Intersección: Set A ∩ Set B = **Artículos que cumplen ambos**
4. Expandir: Obtener TODOS los batch_items de los artículos en la intersección

---

## 💡 Solución Propuesta

### Refactorización de `getFilteredArticleIds`

**Cambio conceptual:** Trabajar a nivel de `article_id` en lugar de `batch_item_id` durante el filtrado.

```typescript
async function getFilteredArticleIds(
	supabase: any,
	batchIds: string[],
	dimensionFilters: Record<string, Record<string, "include" | "exclude">>,
	confidenceFilters?: number[],
): Promise<string[]> {
	// 1. Obtener todos los batch_items con sus article_ids
	const { data: allItems } = await supabase
		.from("article_batch_items")
		.select("id, article_id")
		.in("batch_id", batchIds);

	// 2. Crear mapa: article_id -> [batch_item_ids]
	const articleToBatchItems = new Map<string, string[]>();
	allItems.forEach((item: any) => {
		if (!articleToBatchItems.has(item.article_id)) {
			articleToBatchItems.set(item.article_id, []);
		}
		articleToBatchItems.get(item.article_id)!.push(item.id);
	});

	// 3. Iniciar con TODOS los article_ids
	let candidateArticleIds = new Set(articleToBatchItems.keys());

	// 4. Aplicar cada filtro a nivel de ARTÍCULO
	for (const [dimensionId, filterMap] of Object.entries(dimensionFilters)) {
		const newCandidates = new Set<string>();

		for (const articleId of candidateArticleIds) {
			const batchItemIds = articleToBatchItems.get(articleId)!;

			// Obtener TODAS las reviews de este artículo para esta dimensión
			const { data: reviews } = await supabase
				.from("article_dimension_reviews")
				.select("article_batch_item_id, classification_value, iteration")
				.eq("dimension_id", dimensionId)
				.in("article_batch_item_id", batchItemIds);

			if (!reviews || reviews.length === 0) {
				// Artículo sin clasificación en esta dimensión
				if (includeValues.length > 0) continue;
				if (excludeValues.length > 0 && includeValues.length === 0) {
					newCandidates.add(articleId);
				}
				continue;
			}

			// Obtener la review con MAX(iteration) de TODAS las fases
			const latestReview = reviews.reduce((latest, current) => {
				return (current.iteration ?? 0) > (latest.iteration ?? 0) ?
						current
					:	latest;
			});

			const value = (latestReview.classification_value || "").trim();

			// Aplicar lógica de filtro include/exclude
			// ... (igual que antes)

			if (pasaFiltro) {
				newCandidates.add(articleId);
			}
		}

		candidateArticleIds = newCandidates;
		if (candidateArticleIds.size === 0) break;
	}

	// 5. Expandir a TODOS los batch_items de los artículos filtrados
	const expandedItemIds = allItems
		.filter((item: any) => candidateArticleIds.has(item.article_id))
		.map((item: any) => item.id);

	return expandedItemIds;
}
```

---

## 🧪 Casos de Prueba

### Test 1: Filtro Simple (Una Dimensión)

- **Input:** "Personas mayores = Sí"
- **Esperado:** 192 artículos
- **Verificar:** Dimensiones de otras fases muestran datos de esos 192 artículos

### Test 2: Filtro Compuesto (Dos Dimensiones, Misma Fase)

- **Input:** "Personas mayores = Sí" + "Aspectos éticos = Sí"
- **Esperado:** Intersección correcta (ej: 43 artículos)
- **Verificar:** Solo artículos que cumplen AMBOS

### Test 3: Filtro Compuesto (Dos Dimensiones, Diferentes Fases)

- **Input:** "Personas mayores = Sí" (Fase 1) + "Operadores = Adultos Mayores" (Fase 2)
- **Esperado:** 56 artículos (intersección)
- **Verificar:** Gráficos y tabla muestran 56

### Test 4: Artículo con Múltiples Iteraciones

- **Setup:** Artículo con Iteración 1 = "Sí", Iteración 2 = "No"
- **Filtro:** "Dimensión = Sí"
- **Esperado:** NO debe aparecer (última iteración es "No")
- **Verificar:** Solo se usa iteración más alta

---

## 📊 Métricas de Éxito

- ✅ Filtro simple muestra dimensiones de todas las fases con datos
- ✅ Filtro compuesto (misma fase) muestra intersección correcta
- ✅ Filtro compuesto (diferentes fases) muestra intersección correcta
- ✅ Artículos con múltiples iteraciones usan siempre la última
- ✅ Conteos consistentes entre gráficos, leyendas y tabla

---

## 📁 Archivos Involucrados

- `/lib/actions/preclassification-actions.ts` - Lógica de filtrado
  - `getFilteredArticleIds()` (líneas 3924-4079)
  - `getDimensionStatisticsFiltered()` (líneas 4203-4520)
- `/lib/database.types.ts` - Tipos de base de datos
- `/app/articulos/analisis-preclasificacion/page.tsx` - UI de filtros

---

## 🔧 Próximos Pasos

1. **Validar hipótesis:** Confirmar que el problema es la comparación a nivel de `batch_item_id` vs `article_id`
2. **Implementar solución:** Refactorizar `getFilteredArticleIds` para trabajar a nivel de artículo
3. **Optimizar queries:** Reducir número de queries a BD (actualmente hace una query por artículo)
4. **Testing exhaustivo:** Validar todos los casos de prueba
5. **Logging detallado:** Agregar logs para debugging de iteraciones

---

## 📝 Notas Técnicas

### Performance Considerations

- La solución propuesta hace una query por artículo → puede ser lenta con muchos artículos
- **Optimización necesaria:** Hacer una sola query con JOIN y GROUP BY para obtener MAX(iteration)

### SQL Optimizado (Propuesta)

```sql
WITH latest_reviews AS (
  SELECT DISTINCT ON (adr.dimension_id, abi.article_id)
    abi.article_id,
    adr.dimension_id,
    adr.classification_value,
    adr.iteration
  FROM article_dimension_reviews adr
  JOIN article_batch_items abi ON abi.id = adr.article_batch_item_id
  WHERE abi.batch_id = ANY($1)
  ORDER BY adr.dimension_id, abi.article_id, adr.iteration DESC
)
SELECT * FROM latest_reviews;
```

---

**Última actualización:** 6 Abril 2026, 12:43 PM
