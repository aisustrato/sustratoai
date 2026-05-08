# Bug Report — DimensionesToolbar Toggle No Funciona
## Hito 5 · Navegación por Entidad · Oleada 2

**Fecha:** 24 abril 2026  
**Reportado por:** eRRRe  
**Asignado a:** Nodo Hongo / Calibrador  
**Severidad:** 🔴 Alta — bloquea funcionalidad core del hito  
**Estatus:** 🟡 En investigación  

---

## 1. Resumen ejecutivo

Los botones de la `DimensionesToolbar` en `/cognetica` (raíz) no responden al click. El usuario espera que al hacer click en un botón de dimensión (ej: "Pensadores"), esta se oculte de las tarjetas y el botón cambie de `solid` a `outline`. Actualmente: el click registra pero el estado no persiste visualmente — parece que el toggle se ejecuta y luego se revierte inmediatamente.

---

## 2. Comportamiento esperado vs actual

### ✅ Esperado (según mini-requerimiento §3.4)

> "Por defecto están todos marcados pero uno los podría desmarcar ejemplo apretar pensadores y que los pensadores se oculten y el botón se vuelva outline... dale persistencia local a esas preferencias de botón"

**Flujo correcto:**
1. Usuario hace click en botón "Pensadores" (actualmente `solid`)
2. Botón cambia a `outline`
3. Badges de pensadores desaparecen de todas las tarjetas
4. Preferencia se guarda en `localStorage`
5. Al recargar, el estado se restaura

### ❌ Actual

1. Usuario hace click en botón "Pensadores"
2. (Internamente) el toggle parece ejecutarse dos veces
3. Estado visual no cambia — botón sigue `solid`
4. Badges siguen visibles
5. No hay persistencia aparente

---

## 3. Evidencia técnica

### 3.1 Logs de consola (capturados por eRRRe)

```
useDimensionesVisibles.ts:164 [useDimensionesVisibles] Toggle: conceptos estaba: true nuevo count: 4
useDimensionesVisibles.ts:164 [useDimensionesVisibles] Toggle: conceptos estaba: false nuevo count: 5

page.tsx:369 [DimensionesToolbar] Click en: pensadores
useDimensionesVisibles.ts:155 [useDimensionesVisibles] toggleDimension llamado con key: pensadores
useDimensionesVisibles.ts:164 [useDimensionesVisibles] Toggle: pensadores estaba: true nuevo count: 4
useDimensionesVisibles.ts:164 [useDimensionesVisibles] Toggle: pensadores estaba: false nuevo count: 5
```

**Observación clave:** Cada click genera DOS ejecuciones del callback de estado:
- Primera: `estaba: true` → elimina → `count: 4`
- Segunda: `estaba: false` → agrega → `count: 5`

El resultado neto es que el estado vuelve al original.

### 3.2 Hipótesis de causa raíz

| Hipótesis | Probabilidad | Evidencia |
|-----------|--------------|-----------|
| React StrictMode re-ejecutando el callback | Alta | Patrón de doble ejecución es característico |
| Pub-sub del hook sincronizando instancias duplicadas | Media | El hook tiene sistema de broadcast entre instancias |
| Evento bubbling/clicks duplicados en StandardButton | Media | Podría haber múltiples handlers registrados |
| Closure stale en `actualizar` callback | Baja | Ya se intentó fix con `useRef` |

---

## 4. Intentos de fix realizados

### 4.1 Fix 1: Protección con `togglingRef` (FALLIDO)

```typescript
const togglingRef = useRef<Set<DimensionKey>>(new Set());

const toggleDimension = useCallback((key: DimensionKey) => {
  if (togglingRef.current.has(key)) return;
  togglingRef.current.add(key);
  // ... lógica ...
  setTimeout(() => togglingRef.current.delete(key), 100);
}, [actualizar]);
```

**Resultado:** El problema persistió. Los logs mostraron que la protección no se activaba — las dos ejecuciones ocurrian antes de que el `add` se procesara.

### 4.2 Fix 2: Debounce temporal con `lastToggleRef` (FALLIDO)

```typescript
const lastToggleRef = useRef<{ key: string; time: number } | null>(null);

const toggleDimension = useCallback((key: DimensionKey) => {
  const now = Date.now();
  if (lastToggleRef.current?.key === key && now - lastToggleRef.current.time < 200) {
    return;
  }
  lastToggleRef.current = { key, time: now };
  // ... lógica ...
}, [actualizar]);
```

**Resultado:** El problema persistió. El usuario reportó "no sigue sin pasar nada".

### 4.3 Fixes secundarios aplicados (NO RELACIONADOS)

- **Hydration error `<a>` dentro de `<a>`**: Arreglado convirtiendo `EntidadBadge` a `onClick` + `router.push`
- **Duplicate keys `cita`**: Arreglado con keys únicos incluyendo índice

Estos fixes resolvieron warnings de consola pero NO el bug principal del toggle.

---

## 5. Código involucrado

### 5.1 Hook principal

**Archivo:** `app/cognetica/useDimensionesVisibles.ts`

```typescript
export function useDimensionesVisibles() {
  const [estado, setEstado] = useState<PreferenciasDimensiones>(() => {
    const guardado = leerStorage();
    return guardado ?? estadoDefault();
  });

  const actualizar = useCallback(
    (mutator: (prev: PreferenciasDimensiones) => PreferenciasDimensiones) => {
      setEstado((prev) => {
        const siguiente = mutator(prev);
        escribirStorage(siguiente);
        broadcast(siguiente);
        return siguiente;
      });
    },
    []
  );

  const toggleDimension = useCallback(
    (key: DimensionKey) => {
      const now = Date.now();
      // 🛡️ Debounce de 200ms
      if (
        lastToggleRef.current?.key === key &&
        now - lastToggleRef.current.time < 200
      ) {
        return;
      }
      lastToggleRef.current = { key, time: now };

      actualizar((prev) => {
        const nextVisibles = new Set(prev.visibles);
        if (nextVisibles.has(key)) nextVisibles.delete(key);
        else nextVisibles.add(key);
        return { ...prev, visibles: nextVisibles };
      });
    },
    [actualizar]
  );

  // ... resto del hook
}
```

### 5.2 Componente Toolbar

**Archivo:** `app/cognetica/page.tsx` (líneas ~353-365)

```typescript
{DIMENSIONES.map((d) => {
  const activa = visibles.has(d.key);
  return (
    <StandardButton
      key={d.key}
      size="sm"
      styleType={activa ? "solid" : "outline"}
      colorScheme={d.colorScheme}
      onClick={() => onToggleDimension(d.key)}>
      <span className="mr-1">{d.emoji}</span>
      {d.labelPlural}
    </StandardButton>
  );
})}
```

### 5.3 Uso del hook

**Archivo:** `app/cognetica/page.tsx` (línea ~138)

```typescript
const prefsDimensiones = useDimensionesVisibles();
```

Y el paso a `DimensionesToolbar`:

```typescript
<DimensionesToolbar
  visibles={prefsDimensiones.visibles}
  modo={prefsDimensiones.modo}
  onToggleDimension={prefsDimensiones.toggleDimension}
  onSetModo={prefsDimensiones.setModo}
  onMostrarTodas={prefsDimensiones.mostrarTodas}
  onOcultarTodas={prefsDimensiones.ocultarTodas}
/>
```

---

## 6. Análisis del Nodo Hongo

### 6.1 Patrones observados

1. **Doble ejecución síncrona**: Las dos llamadas a `toggleDimension` ocurren en el mismo tick de event loop (mismo timestamp en logs).

2. **No es StrictMode**: La ejecución duplicada persiste incluso después de que React desmonta/remonta en producción.

3. **El estado SÍ cambia internamente**: Los logs muestran que el `Set` se modifica, pero el componente no re-renderiza con el nuevo estado o re-renderiza con el estado viejo.

### 6.2 Preguntas para investigación

- [ ] ¿Es `broadcast` del pub-sub causando un re-render que revierte el estado?
- [ ] ¿Hay múltiples instancias del hook montadas que se están pisando entre sí?
- [ ] ¿El problema es específico de `toggleDimension` o también afecta `setModo`, `mostrarTodas`, etc.?
- [ ] ¿Ocurre el mismo comportamiento con los botones "Todas" / "Ninguna"?
- [ ] ¿Qué pasa si se elimina completamente el sistema de pub-sub (`broadcast`/`suscribirse`)?

---

## 7. Posibles soluciones a evaluar

### Opción A: Eliminar pub-sub completamente

El pub-sub fue diseñado para sincronizar múltiples instancias del hook, pero quizás es overkill y está causando el problema. Simplificar a solo `localStorage` + `setState`.

### Opción B: Usar `useReducer` en lugar de múltiple `useState` + callbacks

La lógica de estado está distribuida en varios `useCallback`. Un reducer centralizado podría eliminar los problemas de closure.

### Opción C: Implementar debounce a nivel de UI en lugar de lógica

En lugar de proteger en el hook, proteger en el componente `StandardButton` o envolver `onToggleDimension` con `useCallback` + debounce.

### Opción D: Debug exhaustivo con React DevTools Profiler

Grabar una sesión con Profiler para ver exactamente qué está causando los re-renders duplicados.

---

## 8. Próximos pasos

1. **Confirmar scope**: Verificar si el bug afecta SOLO `toggleDimension` o también `setModo`, `mostrarTodas`, etc.

2. **Prueba de aislamiento**: Crear un componente mínimo que use el hook fuera del contexto de `/cognetica` para ver si el problema es del hook o de la interacción con el componente padre.

3. **Decisión de approach**: El nodo hongo debe recomendar cuál de las Opciones A-D (o alternativa) explorar.

4. **Implementación**: Una vez decidido, implementar y verificar con eRRRe en tiempo real.

---

## 9. Notas de sesión

**eRRRe (24 abril 2026, 11:43am):**
> "mira el console log es como si aprieto ejemplo pensadores sale que lo aproieto estado anteroio y ahora pero leiugo de inmedito se reptie en inversa y en la pantalla nop se ven cambios"

**eRRRe (24 abril 2026, 1:13pm):**
> "no sigue sin pasar nada.. crea un documeto con el bug y reporte para nodo hongo"

**Cascade:** Ya se intentaron 2 aproximaciones de fix sin éxito. El bug persiste y requiere análisis más profundo del nodo hongo.

---

## 10. Referencias

- Mini-requerimiento Hito 5: `mini_requerimiento_hito_5_para_kimi.md` §3.4 (persistencia de preferencias)
- Hook: `app/cognetica/useDimensionesVisibles.ts`
- Componente raíz: `app/cognetica/page.tsx`
- Componentes UI: `components/ui/StandardButton.tsx`
