"use client";

import { useState } from "react";
import { SelectCustom } from "@/components/ui/select-custom";
import { ProCard } from "@/components/ui/pro-card";
import { Text } from "@/components/ui/text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Building, User, Briefcase } from "lucide-react";

export default function ShowroomSelect() {
  const [variant, setVariant] = useState("default");
  const [size, setSize] = useState("md");
  const [singleValue, setSingleValue] = useState("");
  const [multiValue, setMultiValue] = useState<string[]>([]);
  const [errorValue, setErrorValue] = useState("");
  const [successValue, setSuccessValue] = useState("");
  const [editingValue, setEditingValue] = useState("preset");

  // Opciones para los ejemplos
  const countryOptions = [
    { value: "mx", label: "México", icon: Globe },
    { value: "us", label: "Estados Unidos", icon: Globe },
    { value: "ca", label: "Canadá", icon: Globe },
    { value: "es", label: "España", icon: Globe },
    { value: "ar", label: "Argentina", icon: Globe },
  ];

  const companyOptions = [
    {
      value: "small",
      label: "Pequeña",
      description: "1-50 empleados",
      icon: Building,
    },
    {
      value: "medium",
      label: "Mediana",
      description: "51-250 empleados",
      icon: Building,
    },
    {
      value: "large",
      label: "Grande",
      description: "251+ empleados",
      icon: Building,
    },
  ];

  const userOptions = [
    { value: "admin", label: "Administrador", icon: User },
    { value: "editor", label: "Editor", icon: User },
    { value: "viewer", label: "Visualizador", icon: User },
  ];

  const departmentOptions = [
    { value: "it", label: "Tecnología", icon: Briefcase },
    { value: "hr", label: "Recursos Humanos", icon: Briefcase },
    { value: "sales", label: "Ventas", icon: Briefcase },
    { value: "marketing", label: "Marketing", icon: Briefcase },
  ];

  // Variantes disponibles
  const variants = [
    "default",
    "primary",
    "secondary",
    "tertiary",
    "accent",
    "neutral",
  ];

  // Tamaños disponibles
  const sizes = ["sm", "md", "lg"];

  return (
    <div className="container mx-auto py-10">
      <ProCard variant="primary" border="top">
        <ProCard.Header>
          <Text variant="heading" size="xl" fontType="heading">
            Select
          </Text>
        </ProCard.Header>
        <ProCard.Content>
          <Text variant="default" color="neutral" className="mb-6">
            Este showroom muestra las diferentes variantes y configuraciones del
            componente SelectCustom.
          </Text>

          <Tabs defaultValue="variants" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="variants">Variantes</TabsTrigger>
              <TabsTrigger value="sizes">Tamaños</TabsTrigger>
              <TabsTrigger value="states">Estados</TabsTrigger>
              <TabsTrigger value="examples">Ejemplos</TabsTrigger>
            </TabsList>

            {/* Variantes */}
            <TabsContent value="variants" className="space-y-6">
              {variants.map((v) => (
                <div key={v} className="space-y-2">
                  <Text variant="subtitle" color="neutral">
                    Variante: {v}
                  </Text>
                  <SelectCustom
                    options={countryOptions}
                    placeholder={`Selecciona un país (${v})`}
                    variant={v as any}
                    leadingIcon={Globe}
                  />
                </div>
              ))}
            </TabsContent>

            {/* Tamaños */}
            <TabsContent value="sizes" className="space-y-6">
              {sizes.map((s) => (
                <div key={s} className="space-y-2">
                  <Text variant="subtitle" color="neutral">
                    Tamaño: {s}
                  </Text>
                  <SelectCustom
                    options={countryOptions}
                    placeholder={`Selecciona un país (${s})`}
                    size={s as any}
                    leadingIcon={Globe}
                  />
                </div>
              ))}
            </TabsContent>

            {/* Estados */}
            <TabsContent value="states" className="space-y-6">
              {/* Normal */}
              <div className="space-y-2">
                <Text variant="subtitle" color="neutral">
                  Normal
                </Text>
                <SelectCustom
                  options={countryOptions}
                  placeholder="Selecciona un país"
                  leadingIcon={Globe}
                />
              </div>

              {/* Con valor */}
              <div className="space-y-2">
                <Text variant="subtitle" color="neutral">
                  Con valor seleccionado
                </Text>
                <SelectCustom
                  options={countryOptions}
                  value="mx"
                  placeholder="Selecciona un país"
                  leadingIcon={Globe}
                />
              </div>

              {/* Con error */}
              <div className="space-y-2">
                <Text variant="subtitle" color="neutral">
                  Con error
                </Text>
                <SelectCustom
                  options={countryOptions}
                  placeholder="Selecciona un país"
                  leadingIcon={Globe}
                  error="Debes seleccionar un país"
                />
              </div>

              {/* Con éxito */}
              <div className="space-y-2">
                <Text variant="subtitle" color="neutral">
                  Con éxito
                </Text>
                <SelectCustom
                  options={countryOptions}
                  value="mx"
                  placeholder="Selecciona un país"
                  leadingIcon={Globe}
                  success
                />
              </div>

              {/* Deshabilitado */}
              <div className="space-y-2">
                <Text variant="subtitle" color="neutral">
                  Deshabilitado
                </Text>
                <SelectCustom
                  options={countryOptions}
                  placeholder="Selecciona un país"
                  leadingIcon={Globe}
                  disabled
                />
              </div>

              {/* En edición */}
              <div className="space-y-2">
                <Text variant="subtitle" color="neutral">
                  En edición
                </Text>
                <SelectCustom
                  options={countryOptions}
                  value="mx"
                  placeholder="Selecciona un país"
                  leadingIcon={Globe}
                  isEditing
                />
              </div>
            </TabsContent>

            {/* Ejemplos */}
            <TabsContent value="examples" className="space-y-6">
              {/* Selección única */}
              <div className="space-y-2">
                <Text variant="subtitle" color="neutral">
                  Selección única
                </Text>
                <SelectCustom
                  options={countryOptions}
                  value={singleValue}
                  onChange={(value) => setSingleValue(value as string)}
                  placeholder="Selecciona un país"
                  leadingIcon={Globe}
                  clearable
                />
                <Text variant="caption" color="neutral">
                  Valor seleccionado: {singleValue || "Ninguno"}
                </Text>
              </div>

              {/* Selección múltiple */}
              <div className="space-y-2">
                <Text variant="subtitle" color="neutral">
                  Selección múltiple
                </Text>
                <SelectCustom
                  options={departmentOptions}
                  value={multiValue}
                  onChange={(value) => setMultiValue(value as string[])}
                  placeholder="Selecciona departamentos"
                  leadingIcon={Briefcase}
                  multiple
                  clearable
                />
                <Text variant="caption" color="neutral">
                  Valores seleccionados:{" "}
                  {multiValue.length > 0 ? multiValue.join(", ") : "Ninguno"}
                </Text>
              </div>

              {/* Con descripciones */}
              <div className="space-y-2">
                <Text variant="subtitle" color="neutral">
                  Con descripciones
                </Text>
                <SelectCustom
                  options={companyOptions}
                  placeholder="Selecciona el tamaño de empresa"
                  leadingIcon={Building}
                />
              </div>

              {/* Con etiqueta y pista */}
              <div className="space-y-2">
                <div className="space-y-1">
                  <Text variant="subtitle" color="neutral">
                    Rol de usuario
                  </Text>
                  <Text variant="caption" color="neutral" className="text-neutral-500">
                    El rol determina los permisos del usuario
                  </Text>
                </div>
                <SelectCustom
                  options={userOptions}
                  placeholder="Selecciona un rol"
                  leadingIcon={User}
                />
              </div>
            </TabsContent>
          </Tabs>
        </ProCard.Content>
      </ProCard>
    </div>
  );
}
