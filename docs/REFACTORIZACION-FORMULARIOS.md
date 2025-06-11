📖 Manual de Refactorización: Migración de Formularios a "Standard" (v1.0)
Propósito: Este documento contiene instrucciones pragmáticas para que un agente de IA reemplace los componentes de formulario legacy por sus contrapartes "Standard".

Capítulo I: FormField ➔ StandardFormField
1. Objetivo
Reemplazar el componente contenedor FormField por su versión Standard.

2. Instrucción Principal
La refactorización es un reemplazo directo del nombre y la ruta de importación. La API de props (label, htmlFor, error, hint, children) se ha mantenido idéntica.

Reemplazar: import { FormField } from "@/components/ui/form-field";

Con: import { StandardFormField } from "@/components/ui/StandardFormField";

En el JSX: Cambiar <FormField ...> por <StandardFormField ...>.

Ejemplo de Código Legacy:

JavaScript

<FormField label="Correo" htmlFor="email" error={errors.email}>
  <Input id="email" />
</FormField>
Ejemplo de Código Refactorizado:

JavaScript

<StandardFormField label="Correo" htmlFor="email" error={errors.email}>
  <StandardInput id="email" />
</StandardFormField>
Capítulo II: Input y TextArea ➔ StandardInput y StandardTextarea
1. Objetivo
Reemplazar los componentes Input y TextArea por sus versiones Standard.

2. Instrucción Principal
Las reglas son idénticas para ambos componentes.

Reemplaza la Importación y el Nombre: Cambia Input por StandardInput o TextArea por StandardTextarea.
Elimina la Prop variant: La prop legacy variant (ej: "default", "primary") ya no existe.
Usa colorScheme para Estilo: Si el componente legacy tenía una variant diferente a "default", usa la nueva prop colorScheme con el mismo valor.
Regla del "Default": Si el componente legacy no tenía la prop variant, el nuevo componente Standard no debe tener la prop colorScheme. Su estilo por defecto es implícito.
Ejemplo de Código Legacy:
JavaScript

<Input variant="secondary" />
<TextArea /> 
Ejemplo de Código Refactorizado:
JavaScript

<StandardInput colorScheme="secondary" />
<StandardTextarea /> 
Capítulo III: SelectCustom ➔ StandardSelect
1. Objetivo
Reemplazar el componente SelectCustom por su versión Standard.

2. Instrucción Principal
Reemplaza la Importación y el Nombre: Cambia SelectCustom por StandardSelect.
Aplica la misma lógica que para Input: Elimina la prop variant y utiliza colorScheme cuando sea necesario, respetando el "Default" implícito.
Atención a onChange: Si encuentras la prop onValueChange, reemplázala por onChange para mantener la consistencia con la nueva API.
Ejemplo de Código Legacy:
JavaScript

<SelectCustom variant="primary" onValueChange={...} />
Ejemplo de Código Refactorizado:
JavaScript

<StandardSelect colorScheme="primary" onChange={...} />
Capítulo IV: CustomCheck ➔ StandardCheckbox
1. Objetivo
Reemplazar el componente CustomCheck por su versión Standard.

2. Instrucción Principal
Este componente tiene dos props de estilo.

Reemplaza la Importación y el Nombre: Cambia CustomCheck por StandardCheckbox.
Mapea las props:
La prop legacy variant (que define el color) se reemplaza por colorScheme.
La prop legacy visualVariant (que define la apariencia) se reemplaza por styleType.
Regla del "Default": Si no se especifican colorScheme ni styleType, el componente usará sus valores por defecto (primary y default respectivamente).
Ejemplo de Código Legacy:
JavaScript

<CustomCheck variant="success" visualVariant="outline" />
Ejemplo de Código Refactorizado:
JavaScript

<StandardCheckbox colorScheme="success" styleType="outline" />
