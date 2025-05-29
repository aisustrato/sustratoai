import type { Meta, StoryObj } from "@storybook/react";
import { Text, type TextProps } from "./text"

const meta = {
  title: "UI/Text",
  component: Text,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "heading", "subheading", "title", "subtitle", "label", "caption", "muted"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"],
    },
    weight: {
      control: "select",
      options: ["normal", "medium", "semibold", "bold"],
    },
    align: {
      control: "select",
      options: ["left", "center", "right", "justify"],
    },
    as: {
      control: "select",
      options: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "div"],
    },
    truncate: {
      control: "boolean",
    },
    gradient: {
      control: "boolean",
    },
  },
  args: {
    children: "Este es un texto de ejemplo",
    variant: "default",
  },
} satisfies Meta<typeof Text>

export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: {
    children: "Este es un texto de ejemplo",
    variant: "default",
  },
};

export const Heading: Story = {
  args: {
    children: "Este es un encabezado",
    variant: "heading",
    as: "h1",
  },
};

export const Subheading: Story = {
  args: {
    children: "Este es un subencabezado",
    variant: "subheading",
    as: "h2",
  },
};

export const Title: Story = {
  args: {
    children: "Este es un título",
    variant: "title",
    as: "h2",
  },
};

export const Subtitle: Story = {
  args: {
    children: "Este es un subtítulo",
    variant: "subtitle",
  },
};

export const Label: Story = {
  args: {
    children: "Esta es una etiqueta",
    variant: "label",
  },
};

export const Caption: Story = {
  args: {
    children: "Este es un texto de ayuda",
    variant: "caption",
  },
};

export const Muted: Story = {
  args: {
    children: "Este es un texto secundario",
    variant: "muted",
  },
};

export const Gradient: Story = {
  args: {
    children: "Este es un texto con gradiente",
    variant: "heading",
    gradient: true,
    size: "4xl",
  },
}

export const Truncated: Story = {
  args: {
    children: "Este es un texto muy largo que se truncará con puntos suspensivos al final si es necesario.",
    variant: "default",
    truncate: true,
    className: "w-64",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Text variant="heading" as="h1">
        Heading (h1)
      </Text>
      <Text variant="subheading" as="h2">
        Subheading (h2)
      </Text>
      <Text variant="title" as="h3">
        Title (h3)
      </Text>
      <Text variant="subtitle">Subtitle</Text>
      <Text variant="default">Default text</Text>
      <Text variant="label">Label</Text>
      <Text variant="caption">Caption</Text>
      <Text variant="muted">Muted text</Text>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <Text size="xs">Extra Small (xs)</Text>
      </div>
      <div>
        <Text size="sm">Small (sm)</Text>
      </div>
      <div>
        <Text size="base">Base (base)</Text>
      </div>
      <div>
        <Text size="lg">Large (lg)</Text>
      </div>
      <div>
        <Text size="xl">Extra Large (xl)</Text>
      </div>
    </div>
  ),
};

export const AllWeights: Story = {
  render: () => (
    <div className="space-y-2">
      <div>
        <Text weight="normal">Normal weight</Text>
      </div>
      <div>
        <Text weight="medium">Medium weight</Text>
      </div>
      <div>
        <Text weight="semibold">Semibold weight</Text>
      </div>
      <div>
        <Text weight="bold">Bold weight</Text>
      </div>
    </div>
  ),
};

export const AllAlignments: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <Text as="div" className="mb-2 text-sm text-muted-foreground">
          Align Left (default)
        </Text>
        <Text align="left" className="border p-4">
          Este texto está alineado a la izquierda. Es la alineación predeterminada para la mayoría de los textos en
          español.
        </Text>
      </div>

      <div>
        <Text as="div" className="mb-2 text-sm text-muted-foreground">
          Align Center
        </Text>
        <Text align="center" className="border p-4">
          Este texto está centrado. Útil para títulos y encabezados que necesitan destacar en la página.
        </Text>
      </div>

      <div>
        <Text as="div" className="mb-2 text-sm text-muted-foreground">
          Align Right
        </Text>
        <Text align="right" className="border p-4">
          Este texto está alineado a la derecha. A menudo se usa para fechas, precios o información secundaria.
        </Text>
      </div>

      <div>
        <Text as="div" className="mb-2 text-sm text-muted-foreground">
          Justify
        </Text>
        <Text align="justify" className="border p-4">
          Este texto está justificado, lo que significa que se alinea tanto al margen izquierdo como al derecho.
          Crea un bloque de texto uniforme y ordenado, ideal para párrafos largos en documentos formales o artículos.
        </Text>
      </div>
    </div>
  ),
};
