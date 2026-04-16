# Problemas del Visor PDF y Sanitización de Markdown en Cognética

## 🎯 Contexto

El sistema Cognética procesa artefactos multimedia (audio, video, PDF) y genera ensayos destilados en formato Markdown. Estos ensayos se visualizan en un visor PDF generado dinámicamente. Sin embargo, existen **problemas persistentes de sanitización de Markdown** que el algoritmo actual no ha logrado resolver completamente, requiriendo intervención manual del usuario.

---

## 🐛 Problemas Identificados

### **1. Caracteres Especiales y Encoding**

**Síntoma:**
- Caracteres acentuados aparecen corruptos: `ó` → `\u00f3`, `á` → `\u00e1`
- Emojis y símbolos Unicode mal renderizados
- Saltos de línea inconsistentes (`\n` vs `\r\n`)

**Ejemplo Real:**
```markdown
# La Inteligencia Artificial como Espejo Implacable y Tercer Bailar\u00edn
```

**Causa:**
- Conversión incorrecta entre UTF-8 y otros encodings
- Escape de caracteres Unicode en lugar de renderizado directo
- Procesamiento de IA que introduce escapes innecesarios

**Código Afectado:**
- `/lib/actions/cognetica-distillation-actions.ts` - Función `generateDistilledEssay`
- `/app/api/cognetica/distilled-essay/route.ts` - Endpoint de generación de PDF

---

### **2. Formato de Títulos y Jerarquía**

**Síntoma:**
- Títulos con múltiples `#` sin espacios: `##Introducción`
- Jerarquía inconsistente (saltos de H1 a H4)
- Títulos con caracteres especiales mal escapados

**Ejemplo Real:**
```markdown
##Introducción: El Marco de una Disputa Metafísica
### **La IA como Espejo Implacable**
####Subtítulo sin espacio
```

**Debería ser:**
```markdown
## Introducción: El Marco de una Disputa Metafísica
### La IA como Espejo Implacable
#### Subtítulo con espacio
```

**Causa:**
- Prompt de IA no especifica formato estricto de Markdown
- Falta de validación post-generación
- Sanitización que elimina espacios necesarios

---

### **3. Listas y Viñetas Malformadas**

**Síntoma:**
- Listas sin espacio después del marcador: `-Item` en lugar de `- Item`
- Mezcla de marcadores (`-`, `*`, `+`) en la misma lista
- Indentación incorrecta en listas anidadas

**Ejemplo Real:**
```markdown
-Primera viñeta sin espacio
* Segunda con asterisco
  -Anidada sin espacio
```

**Debería ser:**
```markdown
- Primera viñeta con espacio
- Segunda con guion
  - Anidada con espacio
```

**Causa:**
- IA genera formato inconsistente
- Sanitizador no normaliza marcadores de lista

---

### **4. Énfasis y Formato Inline**

**Síntoma:**
- Negritas y cursivas mal cerradas: `**texto sin cerrar`
- Mezcla de sintaxis: `**texto*` (abre con doble, cierra con simple)
- Código inline sin backticks: `variable` en lugar de `` `variable` ``

**Ejemplo Real:**
```markdown
El concepto de **espejo implacable* es fundamental.
La función `generateDistilledEssay no está cerrada.
```

**Debería ser:**
```markdown
El concepto de **espejo implacable** es fundamental.
La función `generateDistilledEssay` no está cerrada.
```

---

### **5. Bloques de Código y Citas**

**Síntoma:**
- Bloques de código sin especificar lenguaje
- Citas con `>` sin espacio: `>Cita`
- Bloques de código mal cerrados (falta ` ``` `)

**Ejemplo Real:**
```markdown
```
código sin lenguaje
```

>Cita sin espacio
```

**Debería ser:**
```markdown
```typescript
código con lenguaje
```

> Cita con espacio
```

---

### **6. Enlaces y Referencias**

**Síntoma:**
- Enlaces con espacios en URL: `[texto](url con espacios)`
- Referencias rotas: `[texto][ref]` sin definir `[ref]`
- Sintaxis mezclada: `[texto](url "título sin cerrar`

**Ejemplo Real:**
```markdown
[Ver más](https://ejemplo.com/url con espacios)
[Referencia][1]
<!-- Falta definir [1]: url -->
```

---

### **7. Tablas Malformadas**

**Síntoma:**
- Columnas desalineadas
- Falta de separador de encabezado (`|---|---|`)
- Celdas con pipes sin escapar

**Ejemplo Real:**
```markdown
| Columna 1 | Columna 2 |
| Valor con | pipe interno |
```

**Debería ser:**
```markdown
| Columna 1 | Columna 2 |
|-----------|-----------|
| Valor con \| pipe escapado |
```

---

## 🔧 Algoritmo de Sanitización Actual

### **Ubicación:**
`/lib/utils/markdown-sanitizer.ts` (si existe) o integrado en:
- `/lib/actions/cognetica-distillation-actions.ts`
- `/app/api/cognetica/distilled-essay/route.ts`

### **Limitaciones Detectadas:**

1. **No normaliza encoding UTF-8**
   - No convierte escapes Unicode a caracteres reales
   - No maneja BOM (Byte Order Mark)

2. **No valida jerarquía de títulos**
   - No verifica que H2 siga a H1, etc.
   - No agrega espacios después de `#`

3. **No normaliza listas**
   - No unifica marcadores (`-`, `*`, `+`)
   - No corrige indentación

4. **No valida pares de énfasis**
   - No cierra `**` o `*` abiertos
   - No detecta mezcla de sintaxis

5. **No valida bloques de código**
   - No agrega lenguaje por defecto
   - No cierra bloques abiertos

6. **No escapa caracteres especiales en tablas**
   - No escapa pipes internos
   - No valida estructura de tabla

---

## 🛠️ Solución Implementada: Editor Manual

### **Componente:**
`/app/cognetica/[id]/components/DistilledEssayPanel.tsx`

### **Funcionalidad:**
- Botón "Editar Manualmente" en el panel del ensayo
- `StandardDialog` con `size="full"` (95% del viewport)
- `StandardNote` para edición de texto crudo
- Sistema de versionado append-only en `cog_essay_edit_history`

### **Flujo:**
1. Usuario detecta problema en el ensayo
2. Click en "Editar Manualmente"
3. Dialog amplio muestra Markdown crudo
4. Usuario corrige manualmente
5. Guarda con razón de edición
6. Sistema crea nueva versión (append-only)
7. Si es primera edición, guarda versión original como v0

### **Server Actions:**
`/lib/actions/cognetica-essay-edit-actions.ts`
- `getCurrentEssayVersion()` - Obtiene versión actual
- `saveManualEssayEdit()` - Guarda nueva versión
- `getEssayVersionHistory()` - Obtiene historial completo

### **Base de Datos:**
Tabla: `cog_essay_edit_history`
```sql
CREATE TABLE cog_essay_edit_history (
  id UUID PRIMARY KEY,
  transcription_id UUID REFERENCES cog_transcriptions(id),
  version_number INTEGER,
  content TEXT,
  edit_reason TEXT,
  changes_summary TEXT,
  edited_by UUID REFERENCES auth.users(id),
  edited_at TIMESTAMPTZ,
  is_ai_generated BOOLEAN
);
```

---

## 🚀 Solución Propuesta: Algoritmo de Sanitización Robusto

### **Estrategia:**

Crear un sanitizador de Markdown en múltiples pasadas que corrija todos los problemas identificados.

### **Archivo Propuesto:**
`/lib/utils/markdown-sanitizer.ts`

### **Estructura:**

```typescript
export interface SanitizationResult {
  sanitized: string;
  issues: SanitizationIssue[];
  wasModified: boolean;
}

export interface SanitizationIssue {
  type: 'encoding' | 'heading' | 'list' | 'emphasis' | 'code' | 'link' | 'table';
  line: number;
  original: string;
  fixed: string;
  severity: 'error' | 'warning' | 'info';
}

export function sanitizeMarkdown(markdown: string): SanitizationResult {
  let content = markdown;
  const issues: SanitizationIssue[] = [];

  // Pasada 1: Encoding y caracteres especiales
  content = fixEncoding(content, issues);

  // Pasada 2: Títulos y jerarquía
  content = fixHeadings(content, issues);

  // Pasada 3: Listas y viñetas
  content = fixLists(content, issues);

  // Pasada 4: Énfasis y formato inline
  content = fixEmphasis(content, issues);

  // Pasada 5: Bloques de código
  content = fixCodeBlocks(content, issues);

  // Pasada 6: Enlaces
  content = fixLinks(content, issues);

  // Pasada 7: Tablas
  content = fixTables(content, issues);

  return {
    sanitized: content,
    issues,
    wasModified: content !== markdown
  };
}
```

### **Funciones Específicas:**

#### **1. fixEncoding**
```typescript
function fixEncoding(content: string, issues: SanitizationIssue[]): string {
  // Convertir escapes Unicode a caracteres reales
  content = content.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
    const char = String.fromCharCode(parseInt(code, 16));
    issues.push({
      type: 'encoding',
      line: -1,
      original: match,
      fixed: char,
      severity: 'warning'
    });
    return char;
  });

  // Normalizar saltos de línea
  content = content.replace(/\r\n/g, '\n');

  // Eliminar BOM si existe
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  return content;
}
```

#### **2. fixHeadings**
```typescript
function fixHeadings(content: string, issues: SanitizationIssue[]): string {
  const lines = content.split('\n');
  const fixed: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const headingMatch = line.match(/^(#{1,6})([^\s#].*)/);

    if (headingMatch) {
      const hashes = headingMatch[1];
      const text = headingMatch[2];
      const fixedLine = `${hashes} ${text}`;

      if (line !== fixedLine) {
        issues.push({
          type: 'heading',
          line: i + 1,
          original: line,
          fixed: fixedLine,
          severity: 'warning'
        });
        line = fixedLine;
      }
    }

    fixed.push(line);
  }

  return fixed.join('\n');
}
```

#### **3. fixLists**
```typescript
function fixLists(content: string, issues: SanitizationIssue[]): string {
  const lines = content.split('\n');
  const fixed: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Detectar lista sin espacio: -Item, *Item, +Item
    const listMatch = line.match(/^(\s*)([-*+])([^\s].*)/);

    if (listMatch) {
      const indent = listMatch[1];
      const marker = listMatch[2];
      const text = listMatch[3];
      const fixedLine = `${indent}- ${text}`; // Normalizar a -

      if (line !== fixedLine) {
        issues.push({
          type: 'list',
          line: i + 1,
          original: line,
          fixed: fixedLine,
          severity: 'warning'
        });
        line = fixedLine;
      }
    }

    fixed.push(line);
  }

  return fixed.join('\n');
}
```

#### **4. fixEmphasis**
```typescript
function fixEmphasis(content: string, issues: SanitizationIssue[]): string {
  // Cerrar negritas abiertas
  content = content.replace(/\*\*([^*]+)$/gm, '**$1**');
  
  // Cerrar cursivas abiertas
  content = content.replace(/\*([^*]+)$/gm, '*$1*');

  // Corregir mezcla de sintaxis: **texto*
  content = content.replace(/\*\*([^*]+)\*/g, '**$1**');

  return content;
}
```

#### **5. fixCodeBlocks**
```typescript
function fixCodeBlocks(content: string, issues: SanitizationIssue[]): string {
  const lines = content.split('\n');
  const fixed: string[] = [];
  let inCodeBlock = false;
  let codeBlockStart = -1;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        // Inicio de bloque
        inCodeBlock = true;
        codeBlockStart = i;
        
        // Si no tiene lenguaje, agregar 'text'
        if (line.trim() === '```') {
          line = '```text';
          issues.push({
            type: 'code',
            line: i + 1,
            original: '```',
            fixed: '```text',
            severity: 'info'
          });
        }
      } else {
        // Fin de bloque
        inCodeBlock = false;
      }
    }

    fixed.push(line);
  }

  // Si quedó un bloque abierto, cerrarlo
  if (inCodeBlock) {
    fixed.push('```');
    issues.push({
      type: 'code',
      line: codeBlockStart + 1,
      original: 'Bloque de código sin cerrar',
      fixed: 'Agregado cierre ```',
      severity: 'error'
    });
  }

  return fixed.join('\n');
}
```

#### **6. fixLinks**
```typescript
function fixLinks(content: string, issues: SanitizationIssue[]): string {
  // Escapar espacios en URLs
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    if (url.includes(' ')) {
      const fixedUrl = url.replace(/ /g, '%20');
      issues.push({
        type: 'link',
        line: -1,
        original: match,
        fixed: `[${text}](${fixedUrl})`,
        severity: 'warning'
      });
      return `[${text}](${fixedUrl})`;
    }
    return match;
  });

  return content;
}
```

#### **7. fixTables**
```typescript
function fixTables(content: string, issues: SanitizationIssue[]): string {
  const lines = content.split('\n');
  const fixed: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Detectar inicio de tabla
    if (line.includes('|')) {
      inTable = true;

      // Escapar pipes internos (excepto delimitadores)
      const cells = line.split('|');
      const escapedCells = cells.map(cell => {
        // Si la celda tiene pipes internos, escaparlos
        return cell.replace(/\|/g, '\\|');
      });

      line = escapedCells.join('|');
    } else if (inTable && line.trim() === '') {
      inTable = false;
    }

    fixed.push(line);
  }

  return fixed.join('\n');
}
```

---

## 🧪 Testing del Sanitizador

### **Casos de Prueba:**

```typescript
// test/markdown-sanitizer.test.ts

describe('Markdown Sanitizer', () => {
  test('Debe convertir escapes Unicode', () => {
    const input = 'T\u00edtulo con acentos';
    const result = sanitizeMarkdown(input);
    expect(result.sanitized).toBe('Título con acentos');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].type).toBe('encoding');
  });

  test('Debe agregar espacio después de #', () => {
    const input = '##Título sin espacio';
    const result = sanitizeMarkdown(input);
    expect(result.sanitized).toBe('## Título sin espacio');
  });

  test('Debe normalizar marcadores de lista', () => {
    const input = '*Item 1\n+Item 2\n-Item 3';
    const result = sanitizeMarkdown(input);
    expect(result.sanitized).toBe('- Item 1\n- Item 2\n- Item 3');
  });

  test('Debe cerrar bloques de código abiertos', () => {
    const input = '```typescript\nconst x = 1;';
    const result = sanitizeMarkdown(input);
    expect(result.sanitized).toBe('```typescript\nconst x = 1;\n```');
  });

  test('Debe escapar espacios en URLs', () => {
    const input = '[Link](https://ejemplo.com/url con espacios)';
    const result = sanitizeMarkdown(input);
    expect(result.sanitized).toBe('[Link](https://ejemplo.com/url%20con%20espacios)');
  });
});
```

---

## 📋 Integración en el Flujo de Cognética

### **Opción 1: Sanitización Automática Post-Generación**

```typescript
// En /lib/actions/cognetica-distillation-actions.ts

const essayContent = await generateEssayWithAI(transcription);

// Sanitizar automáticamente
const sanitized = sanitizeMarkdown(essayContent);

if (sanitized.wasModified) {
  console.log('⚠️ Ensayo sanitizado automáticamente');
  console.log('Issues encontrados:', sanitized.issues.length);
  
  // Guardar issues en metadata
  metadata.sanitization_issues = sanitized.issues;
}

// Guardar versión sanitizada
await saveEssay(sanitized.sanitized, metadata);
```

### **Opción 2: Sanitización On-Demand**

```typescript
// Endpoint: /app/api/cognetica/sanitize-essay/route.ts

export async function POST(req: Request) {
  const { transcriptionId } = await req.json();

  // Obtener ensayo actual
  const essay = await getEssay(transcriptionId);

  // Sanitizar
  const result = sanitizeMarkdown(essay.content);

  // Guardar nueva versión si hubo cambios
  if (result.wasModified) {
    await saveEssayVersion({
      transcriptionId,
      content: result.sanitized,
      editReason: 'Sanitización automática',
      changesSummary: `${result.issues.length} issues corregidos`,
      isAiGenerated: true
    });
  }

  return Response.json({
    success: true,
    wasModified: result.wasModified,
    issues: result.issues
  });
}
```

---

## 🎯 Próximos Pasos

### **Fase 1: Implementación del Sanitizador**
1. Crear `/lib/utils/markdown-sanitizer.ts`
2. Implementar todas las funciones de corrección
3. Agregar tests unitarios
4. Documentar cada función

### **Fase 2: Integración**
1. Integrar en `generateDistilledEssay`
2. Crear endpoint de sanitización on-demand
3. Agregar botón "Sanitizar" en UI
4. Mostrar issues detectados al usuario

### **Fase 3: Mejora Continua**
1. Recopilar casos de fallo del sanitizador
2. Agregar nuevas reglas según necesidad
3. Mejorar prompts de IA para generar mejor Markdown
4. Considerar usar librería de parsing Markdown (remark, unified)

---

## 🤖 Consulta con "Consejo de IAs"

### **Problema a Plantear:**

> "Tenemos un sistema que genera ensayos en Markdown usando IA (DeepSeek, Gemini). Los ensayos tienen problemas recurrentes de formato:
> 
> 1. Escapes Unicode en lugar de caracteres reales
> 2. Títulos sin espacio después de #
> 3. Listas con marcadores inconsistentes
> 4. Bloques de código sin cerrar
> 5. Enlaces con espacios sin escapar
> 
> Hemos implementado un editor manual, pero queremos un sanitizador automático robusto. ¿Qué estrategia recomiendan? ¿Deberíamos usar una librería existente o crear nuestro propio sanitizador? ¿Cómo manejar casos edge sin romper contenido válido?"

### **Contexto Técnico:**
- Stack: Next.js, TypeScript, Supabase
- IAs: DeepSeek R1, Gemini 2.0
- Volumen: ~100 ensayos/día
- Longitud: 2000-10000 palabras

### **Preguntas Específicas:**
1. ¿Librería recomendada para parsing/sanitización de Markdown?
2. ¿Estrategia de múltiples pasadas vs single-pass?
3. ¿Cómo detectar y preservar contenido intencionalmente "raro"?
4. ¿Validación vs corrección automática?
5. ¿Logging de issues para mejorar prompts de IA?

---

## 📚 Referencias

### **Librerías de Markdown:**
- **remark** - Parser y procesador de Markdown
- **unified** - Ecosistema de procesamiento de texto
- **markdown-it** - Parser rápido con plugins
- **gray-matter** - Parser de frontmatter

### **Estándares:**
- CommonMark - Especificación estándar de Markdown
- GitHub Flavored Markdown (GFM)

### **Herramientas:**
- **markdownlint** - Linter de Markdown
- **prettier** - Formateador con soporte Markdown

---

## 📝 Notas Finales

Este documento debe servir como base para:
1. **Desarrolladores futuros** que trabajen en el sanitizador
2. **Consulta con IAs** para obtener soluciones robustas
3. **Documentación de decisiones** sobre por qué se eligió cierta estrategia
4. **Tracking de problemas** recurrentes en el sistema

**Última actualización:** 2026-03-06  
**Autor:** Sistema Cognética - Sustrato.AI
