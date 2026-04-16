# 🌸 Standard UI - Ecosistema de Componentes SUSTRATO.AI

> Ontología Visual para interfaces que respiran

## Filosofía

Los componentes `Standard*` siguen cinco principios fundamentales:

### 1. 💎 Tokens Precalculados
Consumen del `DesignTokensProvider` - NO recalculan en cada render.

### 2. 🏛️ Soberanía de Animación (Patrón Flex)
- **Inline styles**: Colores y dimensiones
- **CSS dinámico**: Animaciones (:hover, :active, @keyframes)
- **Sin conflictos**: Las animaciones nunca chocan con estilos inline

### 3. 🌍 i18n-Ready
Preparados para `next-intl`. Textos externalizables.

### 4. ♿ Accesibilidad (ARIA)
Cumplen estándares internacionales de accesibilidad.

### 5. 🎨 Coherencia Visual
Respetan la ontología visual de SUSTRATO.AI.

---

## Componentes

| Componente | Estado | Docs |
|------------|--------|------|
| [StandardButton](./StandardButton.md) | ✅ v4.2 | Completo |
| [StandardInput](./StandardInput.md) | ✅ v4.3 | Completo |
| [StandardTextarea](./StandardTextarea.md) | ✅ v4.3 | Completo |
| [StandardSelect](./StandardSelect.md) | ✅ v4.3 | Completo |
| [StandardCard](./StandardCard.md) | ✅ v4.3 | Completo |
| [StandardText](./StandardText.md) | ✅ v4.3 | Completo + i18n |
| [StandardIcon](./StandardIcon.md) | ✅ v2.3 | Completo |
| [StandardTooltip](./StandardTooltip.md) | ✅ v2.1 | Completo + isLongText |
| StandardTabs | 🔄 Pendiente | - |

---

## Proceso de Refactorización

Para cada componente:

```
1. 💎 Migrar a DesignTokensProvider
2. 🏛️ Implementar Patrón Flex (CSS dinámico)
3. 🌍 Agregar soporte i18n
4. ♿ Auditar ARIA/accesibilidad
5. 🎨 Aplicar ontología visual
6. 📝 Documentar en este directorio
7. 🧪 Agregar al showroom
```

---

## Showroom

Pruebas interactivas:
- `/showroom/standard-button`
- `/showroom/standard-input`
- `/showroom/standard-textarea`
- `/showroom/standard-select`
- `/showroom/form` - 🌸 **Los 4 componentes en armonía**

---

📍 `docs/standard-UI/`  
🎯 Documentación técnica para humanos y AI  
🌊🏄🏽 SUSTRATO.AI
