# Snippet: botón "Ver en modo grafo" en /cognetica

Este snippet se aplica manualmente en `app/cognetica/page.tsx` cuando la rama de Cognética esté lista para integrar el grafo. Es la **única modificación** necesaria sobre un archivo compartido con `feat/cognetica-forense-oleada-1`.

## Por qué un snippet y no un commit

La rama `feat/grafo-cognetica` (donde se desarrolló `StandardGrafo`) no tiene `app/cognetica/page.tsx` — fue removido en la limpieza `ed3db23`. Tocar ese archivo acá rompería el merge con oleada-1, donde el archivo está siendo desarrollado activamente. Aplicar este snippet a mano evita el conflicto.

## Qué hace

Agregar un `StandardButton` con ícono `Network` que navega a `/cognetica/grafo`. Esa página está creada y funciona — solo falta el botón de acceso.

## Dónde pegarlo

Dentro del `<StandardPageTitle>` actions, o como acción principal arriba del listado de artefactos. Tu llamada, donde mejor encaje en el layout de oleada-1.

## Imports a agregar

```tsx
import { Network } from "lucide-react";
```

(Los demás imports — `Link`, `StandardButton` — ya existen en `app/cognetica/page.tsx`.)

## Snippet del botón

### Variante 1: como Link (recomendado para navegación simple)

```tsx
<Link href="/cognetica/grafo">
  <StandardButton
    colorScheme="accent"
    styleType="outline"
    leftIcon={Network}
  >
    Ver en modo grafo
  </StandardButton>
</Link>
```

### Variante 2: con router (si necesitás lógica antes de navegar)

```tsx
const router = useRouter(); // ya existe en el componente

<StandardButton
  colorScheme="accent"
  styleType="outline"
  leftIcon={Network}
  onClick={() => router.push("/cognetica/grafo")}
>
  Ver en modo grafo
</StandardButton>
```

## Pasos para aplicar

1. Pull/merge `feat/grafo-cognetica` a `feat/cognetica-forense-oleada-1` cuando termine tu pipeline.
2. Resolver conflictos triviales si los hay (esperable: ninguno, porque `app/cognetica/page.tsx` no se tocó en `feat/grafo-cognetica`).
3. Abrir `app/cognetica/page.tsx` y pegar el snippet donde quede natural en el layout.
4. Agregar `Network` al `import { ... } from "lucide-react"` existente.
5. Verificar build + lint.

## Verificación post-merge

- `/cognetica` muestra el botón "Ver en modo grafo"
- Click en el botón → navega a `/cognetica/grafo`
- La página de grafo carga los artefactos del proyecto activo
- Doble click sobre un nodo → navega a `/cognetica/<id-artefacto>`

## Archivos nuevos que vienen con el merge

- `app/cognetica/grafo/page.tsx` — la página
- `components/grafo/GrafoCoocurrenciaCognetica.tsx` — wrapper con el catálogo de tipos
- `components/ui/StandardGrafo.tsx` — componente agnóstico
- `lib/grafo/*` — tipos, layout, render, animación, mock
- `app/api/graph/artefactos/` y `app/api/graph/artefactos/cooccurrence/` — handlers nuevos
- `app/showroom/grafo-coocurrencia/page.tsx` — preview (puede quedar o no, no estorba)

Nada de esto pisa archivos de Cognética actual; todo es additive.
