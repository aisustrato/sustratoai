# Cognética Forense — Módulo `lib/cognetica-forense/`

Infraestructura compartida de **Cognética Forense v2** (Oleada 1 en curso).

## Propósito

Aloja utilidades puras y tipos del dominio. Los **Server Actions** viven en
`/lib/actions/cognetica-forense-*.ts` (uno por dominio: ingesta, transcripción,
pdf, metabolización, grupos, consulta). Las **rutas UI** en `/app/cognetica/`.

## Contratos de referencia

| Artefacto | Ubicación |
|-----------|-----------|
| Esquema SQL | `/docs/standard-UI/cognetica_v2_oleada_1.sql` |
| Firmas de Server Actions | `/lib/actions/cognetica_forense_actions.ts` |
| Requerimiento completo | `/docs/cognetica2` |

## Estructura

```
lib/cognetica-forense/
├── types.ts                ← tipos TS alineados al SQL (Result<T>, enums)
├── hash.ts                 ← SHA-256 sobre JSON canónico
├── triada.ts               ← generación md + yaml + json
├── prompts/                ← system prompts (placeholders hasta que
│   ├── cronica-prompt.ts     Hongo/Calibrador entregue los finales)
│   ├── destilado-prompt.ts
│   ├── germinal-prompt.ts
│   └── contracalibracion-prompt.ts
└── utils/
    ├── json-canonical.ts   ← serialización determinística (hash reproducible)
    └── token-counter.ts    ← estimación de tokens por tipo de artefacto
```

## Principios (no-negociables)

1. **Código elegante antes que rápido** (§0.1 del requerimiento).
2. **SQL es el contrato**. Si TS ≠ SQL, gana SQL.
3. **Deuda técnica declarada sí, oculta no**.
4. **Componentes Standard** en toda la UI. Sin CSS inline ni Tailwind en
   componentes que exponen props de estilo.

## Convivencia con v1

El módulo anterior vive en `/app/cognetica_old/` y `/lib/actions/cognetica-old-*.ts`.
Permanece funcional hasta que Oleada 1 sea aceptada.
