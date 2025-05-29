# PLAN DE REFACTORIZACIÓN DEL SISTEMA VISUAL

## PROBLEMA ACTUAL

El sistema actual de estilos está fragmentado en múltiples archivos CSS con variables globales:

- `globals.css`
- `globals.css.additions`
- `globals.css.color-classes`
- `globals.css.dark-theme-fixes`
- `globals.css.new-section`
- `globals.css.simplified`
- `globals.css.variables`

Esta fragmentación ha creado un sistema **imposible de mantener** donde:

1. Los cambios en un archivo pueden afectar inesperadamente a otros componentes
2. No hay una fuente única de verdad para los colores y estilos
3. El debugging es extremadamente difícil
4. Cada nuevo desarrollador debe entender todo el sistema para hacer cambios simples
5. Los temas oscuros y claros no funcionan consistentemente

## DECISIÓN: MUERTE A LAS VARIABLES CSS GLOBALES

**Hemos decidido abandonar completamente el enfoque de variables CSS globales** en favor de un sistema basado en JavaScript/TypeScript con las siguientes características:

### Nuevo enfoque:

1. **Fuente única de verdad**: Todos los colores y tokens de diseño se definirán en archivos TypeScript (`lib/theme/colors.ts`, etc.)

2. **Componentes autónomos**: Cada componente importará directamente los tokens que necesita:
   \`\`\`tsx
   import { colors } from '@/lib/theme/colors';
   
   function Button() {
     return <button style={{ backgroundColor: colors.primary[500] }}>Click me</button>;
   }
   \`\`\`

3. **Tipado fuerte**: TypeScript proporcionará autocompletado y verificación de tipos para todos los tokens de diseño

4. **Temas coherentes**: El sistema de temas se implementará a nivel de aplicación, no a través de CSS

## PLAN DE IMPLEMENTACIÓN

### Fase 1: Establecer la nueva estructura

1. Crear un sistema completo de tokens de diseño en TypeScript:
   - `colors.ts` - Paletas de colores y semántica
   - `spacing.ts` - Sistema de espaciado
   - `typography.ts` - Fuentes, tamaños, pesos
   - `shadows.ts` - Sistema de sombras
   - `breakpoints.ts` - Puntos de quiebre para responsive

2. Implementar un ThemeProvider mejorado que use Context API para proporcionar estos tokens a toda la aplicación

### Fase 2: Migrar componentes existentes

1. Comenzar con los componentes más básicos (Text, Button, Card)
2. Eliminar todas las dependencias de variables CSS
3. Usar directamente los tokens de diseño importados
4. Implementar soporte para temas oscuros/claros a nivel de componente

### Fase 3: Eliminar archivos CSS globales

1. Mover estilos base necesarios a un único archivo CSS mínimo
2. Eliminar gradualmente todos los archivos CSS fragmentados
3. Documentar el nuevo sistema para futuros desarrolladores

## BENEFICIOS ESPERADOS

1. **Mantenibilidad**: Sistema más fácil de entender y mantener
2. **Consistencia**: Todos los componentes usarán los mismos tokens
3. **Rendimiento**: Menos CSS para cargar y procesar
4. **Developer Experience**: Mejor autocompletado y detección de errores
5. **Escalabilidad**: Más fácil añadir nuevos temas o variantes

## COMPONENTES YA MIGRADOS

- ✅ ProCard: Usa directamente colores de `colors.ts`
- ✅ Text: Migrado para usar colores directamente sin variables CSS

## PRÓXIMOS COMPONENTES A MIGRAR

- Button
- Card
- Input
- Select
- Navbar

---

**NOTA IMPORTANTE PARA FUTUROS DESARROLLADORES:**

No añadas nuevas variables CSS globales. Sigue el nuevo enfoque basado en TypeScript para cualquier nuevo componente o modificación. Estamos en proceso de eliminar completamente las variables CSS globales.

Si encuentras un componente que aún usa variables CSS, considera migrarlo al nuevo sistema como parte de tu trabajo.
