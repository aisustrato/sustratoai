/**
 * Sistema de colores para Sustrato
 * Este archivo sirve como fuente única de verdad para todos los colores utilizados en la aplicación.
 */

// Tipos para mejor autocompletado y seguridad de tipos
export type ColorShade = {
  pure: string;
  pureShade: string; // alias de pureDark
  pureDark: string; // legado, alias de pureShade
  text: string;
  contrastText: string; // nuevo: color para párrafos casi blanco tintado
  textShade: string; // alias de textDark
  textDark: string; // legado, alias de textShade
  bg: string;
  bgShade: string; // alias de bgDark
  bgDark: string; // legado, alias de bgShade
};

type ThemeSet = {
  // Nuevo tipo para agrupar light y dark variants
  light: ThemeColors;
  dark: ThemeColors;
};

type SemanticSet = {
  // Nuevo tipo para agrupar light y dark variants
  light: SemanticColors;
  dark: SemanticColors;
};

export type ThemeColors = {
  primary: ColorShade;
  secondary: ColorShade;
  tertiary: ColorShade;
};

type SemanticColors = {
  accent: ColorShade;
  success: ColorShade;
  warning: ColorShade;
  danger: ColorShade;
  neutral: ColorShade;
  white: ColorShade;
};

// Tipo para las variantes oscuras semánticas
type DarkSemanticColors = {
  accentDark: ColorShade;
  successDark: ColorShade;
  warningDark: ColorShade;
  dangerDark: ColorShade;
  neutralDark: ColorShade;
  whiteDark: ColorShade;
};

// Tipo combinado para el objeto semantic exportado
// Esto es lo que realmente contiene el objeto 'semantic'
export interface AllSemanticColors extends SemanticColors {
  accentDark: ColorShade;
  successDark: ColorShade;
  warningDark: ColorShade;
  dangerDark: ColorShade;
  neutralDark: ColorShade;
  whiteDark: ColorShade;
}

// Temas de colores
export const themes = {
  blue: {
    // Contenedor para blue light
    primary: {
      pure: "#3D7DF6",
      pureShade: "#2E5EB9",
      pureDark: "#2E5EB9",
      text: "#1f4487",
      contrastText: "#ECF2FE",
      textShade: "#132951",
      textDark: "#132951",
      bg: "#DCE6F9",
      bgShade: "#CBDAF6",
      bgDark: "#A6ACBC",
    },
    secondary: {
      pure: "#516e99",
      pureShade: "#3D5373",
      pureDark: "#3D5373",
      text: "#364866",
      contrastText: "#EEF1F5",
      textShade: "#202B3D",
      textDark: "#202B3D",
      bg: "#D6E2FF",
      bgShade: "#C2D4FF",
      bgDark: "#A0B0CC",
    },
    tertiary: {
      pure: "#1EA4E9",
      pureShade: "#177BAF",
      pureDark: "#177BAF",
      text: "#115f87",
      contrastText: "#E9F6FD",
      textShade: "#0A3951",
      textDark: "#0A3951",
      bg: "#d7f1fe",
      bgShade: "#C5EAFC",
      bgDark: "#95B0BD",
    },
  } as ThemeColors,
  blueDark: {
    // Dark variant for blue
    primary: {
      pure: "#5896F8", // Lighter blue for dark bg
      pureShade: "#3D7DF6", // Corresponds to light.pure
      pureDark: "#3D7DF6",
      text: "#ADC8F9", // Tinted light blue
      contrastText: "#0A1A33", // Dark blue for light blue button
      textShade: "#8FB0EA", // Slightly darker tinted light blue
      textDark: "#BDBDBD", // Mantener como alias de textShade si es necesario, o ajustar a #8FB0EA
      bg: "#0F1A2A", // Very dark blue
      bgShade: "#0A111C", // Even darker
      bgDark: "#0A111C",
    },
    secondary: {
      pure: "#7DA0D1", // Lighter
      pureShade: "#516e99", // Corresponds to light.pure
      pureDark: "#516e99",
      text: "#BCCEE5", // Tinted light blue-gray
      contrastText: "#101C2F",
      textShade: "#A3B8D3", // Slightly darker
      textDark: "#BDBDBD", // Mantener o ajustar a #A3B8D3
      bg: "#1B283D", // Darker
      bgShade: "#121A27",
      bgDark: "#121A27",
    },
    tertiary: {
      pure: "#5DC1F0", // Lighter
      pureShade: "#1EA4E9", // Corresponds to light.pure
      pureDark: "#1EA4E9",
      text: "#A8DDF6", // Tinted light cyan-blue
      contrastText: "#07293D",
      textShade: "#8EC7E8", // Slightly darker
      textDark: "#BDBDBD", // Mantener o ajustar a #8EC7E8
      bg: "#0A2D40", // Darker
      bgShade: "#051D2B",
      bgDark: "#051D2B",
    },
  } as ThemeColors,

  green: {
    primary: {
      pure: "#0D7A73", // Cerceta oscuro y rico
      pureShade: "#095751", // Más oscuro
      pureDark: "#095751", // Legado
      text: "#042A27", // Texto oscuro para fondo claro
      contrastText: "#E0F7F6", // Texto claro para botones oscuros/primarios
      textShade: "#06403B", // Shade de texto oscuro
      textDark: "#06403B", // Legado
      bg: "#E0F7F6", // Fondo claro con tinte cerceta
      bgShade: "#B3E7E4", // Shade de fondo claro
      bgDark: "#B3E7E4", // Legado
    },
    secondary: {
      pure: "#3F683C", // Cerceta más apagado
      pureShade: "#375B34",
      pureDark: "#375B34",
      text: "#274125",
      contrastText: "#D6F0EE",
      textShade: "#101a0f",
      textDark: "#1E5753",
      bg: "#e5f7e4",
      bgShade: "#d9e9d8",
      bgDark: "#C7E0DE",
    },
    tertiary: {
      pure:       "#78C731",
  pureShade:  "#56911F",
  pureDark:   "#56911F",
  text:       "#354F18",
  contrastText:"#F8FEEB",
  textShade:  "#23370F",
  textDark:   "#23370F",
  bg:         "#ECF8D8",
  bgShade:    "#C8D7B4",
  bgDark:     "#C8D7B4",
    },
  } as ThemeColors,
  greenDark: {
    primary: {
      pure: "#1EBEB2", // Cerceta más brillante para modo oscuro
      pureShade: "#0D7A73", // Corresponde al pure del modo claro
      pureDark: "#0D7A73", // Legado
      text: "#A1E0DB", // Texto claro tintado para fondo oscuro (Green Teal Dark Text)
      contrastText: "#042A27", // Texto oscuro para botones cerceta brillantes
      textShade: "#7FD1CA", // Shade de texto claro (Green Teal Dark TextShade)
      textDark: "#7FD1CA", // Legado
      bg: "#042A27", // Fondo muy oscuro con base cerceta
      bgShade: "#021A17", // Shade de fondo oscuro
      bgDark: "#021A17", // Legado
    },
    secondary: {
      pure: "#5DB0AA",
      pureShade: "#3D8F8A",
      pureDark: "#3D8F8A",
      text: "#A1D9D5",
      contrastText: "#0A2C2A",
      textShade: "#8CCBC6",
      textDark: "#8CCBC6",
      bg: "#0E3B38",
      bgShade: "#072523",
      bgDark: "#072523",
    },
    tertiary: {
      pure: "#8BE6E0",
      pureShade: "#6ECFCA",
      pureDark: "#6ECFCA",
      text: "#C2F0ED",
      contrastText: "#0F3E3A",
      textShade: "#A1E0DB",
      textDark: "#A1E0DB",
      bg: "#103F3B",
      bgShade: "#0A2D2A",
      bgDark: "#0A2D2A",
    },
  } as ThemeColors,

  orange: {
    // Light variant
    primary: {
      pure: "#F77019",
      pureShade: "#B95413",
      pureDark: "#B95413",
      text: "#99450f",
      contrastText: "#FEF1E8",
      textShade: "#5C2909",
      textDark: "#5C2909",
      bg: "#f6ede7",
      bgShade: "#d5c6bd",
      bgDark: "#BCB1AA",
    },
    secondary: {
      pure: "#913E0F",
      pureShade: "#6D2F0B",
      pureDark: "#6D2F0B",
      text: "#5e2909",
      contrastText: "#F4ECE7",
      textShade: "#381905",
      textDark: "#381905",
      bg: "#e3d8d1",
      bgShade: "#c1b3aa",
      bgDark: "#A99D95",
    },
    tertiary: {
      pure: "#7B294E",
      pureShade: "#561C36",
      pureDark: "#561C36",
      text: "#4A1B32",
      contrastText: "#F2EAED",
      textShade: "#2C1020",
      textDark: "#2C1020",
      bg: "#F5E6ED",
      bgShade: "#e4c4d9",
      bgDark: "#BFA3B5",
    },
  } as ThemeColors,
  orangeDark: {
    // Dark variant for orange
    primary: {
      pure: "#FB8C4A", // Lighter orange
      pureShade: "#F77019", // Corresponds to light.pure
      pureDark: "#F77019",
      text: "#FCC6A4", // Tinted light orange
      contrastText: "#3D1C06", // Dark orange for light orange button
      textShade: "#F8B890", // Slightly darker
      textDark: "#BDBDBD", // Mantener o ajustar a #F8B890
      bg: "#301606", // Very dark orange
      bgShade: "#200E02",
      bgDark: "#200E02",
    },
    secondary: {
      pure: "#C26B3C", // Lighter
      pureShade: "#913E0F",
      pureDark: "#913E0F",
      text: "#D9AD99", // Tinted light brown-orange
      contrastText: "#301405",
      textShade: "#C99C86", // Slightly darker
      textDark: "#BDBDBD", // Mantener o ajustar a #C99C86
      bg: "#2A1204", // Darker
      bgShade: "#1B0B01",
      bgDark: "#1B0B01",
    },
    tertiary: {
      pure: "#B05A7F", // Lighter
      pureShade: "#7B294E",
      pureDark: "#7B294E",
      text: "#D0A7BB", // Tinted light wine/purple
      contrastText: "#300D1E",
      textShade: "#C295AB", // Slightly darker
      textDark: "#BDBDBD", // Mantener o ajustar a #C295AB
      bg: "#2F0A1D", // Darker
      bgShade: "#1F0513",
      bgDark: "#1F0513",
    },
  } as ThemeColors,
};

// Colores semánticos universales
export const semantic: AllSemanticColors = {
  accent: {
    // Light variant
    pure: "#8A4EF6",
    pureShade: "#683BB9",
    pureDark: "#683BB9",
    text: "#5A3E9C",
    contrastText: "#F3EDFE",
    textShade: "#4D2C8A",
    textDark: "#4D2C8A",
    bg: "#F0EAFA",
    bgShade: "#E8D9F9",
    bgDark: "#AEA3BB",
  },
  accentDark: {
    // Dark variant
    pure: "#A475F8",
    pureShade: "#8A4EF6",
    pureDark: "#8A4EF6",
    text: "#C6A9FA",
    contrastText: "#271347",
    textShade: "#B592F4",
    textDark: "#C6B3E7",
    bg: "#1A0F2A",
    bgShade: "#100A1B",
    bgDark: "#100A1B",
  },

  success: {
    // Light variant
    pure: "hsl(133, 80%, 38%)",
    pureShade: "#2DBF6F",
    pureDark: "#2DBF6F",
    text: "#45574d",
    contrastText: "#1f3c2b",
    textShade: "#33413A",
    textDark: "#33413A",
    bg: "#E3FAEF" ,
    bgShade: "#cffae3",
    bgDark: "#9BBDAA",
  },
  successDark: {
    // Dark variant
    pure: "#08f376",
    pureShade: "#3DFF94",
    pureDark: "#3DFF94",
    text: "#97FBC9",
    contrastText: "#0F3B22",
    textShade: "#7EEBB6",
    textDark: "#B3E7C6",
    bg: "#0A2A1A",
    bgShade: "#051B10",
    bgDark: "#051B10",
  },

  warning: {
    // Light variant
    pure: "#FFEE3D",
    pureShade: "#BFB32F",
    pureDark: "#BFB32F",
    text: "#6E671A",
    contrastText: "#3d3b27",
    textShade: "#524D13",
    textDark: "#524D13",
    bg: "#f8f2c9",
    bgShade: "#efee9a",
    bgDark: "#BBB9A7",
  },
  warningDark: {
    // Dark variant
    pure: "#FFF260",
    pureShade: "#FFEE3D",
    pureDark: "#FFEE3D",
    text: "#FFF7A0",
    contrastText: "#3B3809",
    textShade: "#FFF58C",
    textDark: "#1A1905",
    bg: "#292608",
    bgShade: "#1B1A03",
    bgDark: "#1B1A03",
  },

  danger: {
    // Light variant
    pure: "#ED3A45",
    pureShade: "#B22B34",
    pureDark: "#B22B34",
    text: "#6B1A1F",
    contrastText: "#FDEBEC",
    textShade: "#501317",
    textDark: "#501317",
    bg: "#F7ECEC",
    bgShade: "#F7DDDF",
    bgDark: "#B9A6A7",
  },
  dangerDark: {
    // Dark variant
    pure: "#F2606B",
    pureShade: "#ED3A45",
    pureDark: "#ED3A45",
    text: "#F7A0A6",
    contrastText: "#420B10",
    textShade: "#F38C93",
    textDark: "#E7B3B7",
    bg: "#2A0A0D",
    bgShade: "#1B0507",
    bgDark: "#1B0507",
  },

  neutral: {
    // Light variant (as previously defined)
    pure: "#6B7280",
    pureShade: "#4B5563",
    pureDark: "#4B5563",
    text: "#1F2937",
    contrastText: "#F0F1F3",
    textShade: "#111827",
    textDark: "#111827",
    bg: "#F9FAFB",
    bgShade: "#d9dcdf",
    bgDark: "#c6c8cb",
  },
  neutralDark: {
    // Dark variant for Neutral
    pure: "#9CA3AF",
    pureShade: "#6B7280",
    pureDark: "#6B7280",
    text: "#E5E7EB",
    contrastText: "#1F2937",
    textShade: "#D1D5DB",
    textDark: "#D1D5DB",
    bg: "#111827",
    bgShade: "#000000",
    bgDark: "#000000",
  },
  white: {
    pure: "#FFFFFF",
    pureShade: "#F3F4F6",
    pureDark: "#F3F4F6",
    text: "#1F2937",
    contrastText: "#111827",
    textShade: "#374151",
    textDark: "#374151",
    bg: "#FFFFFF",
    bgShade: "#F9FAFB",
    bgDark: "#F9FAFB",
  },
  whiteDark: {
    pure: "#E5E7EB",
    pureShade: "#D1D5DB",
    pureDark: "#D1D5DB",
    text: "#1F2937",
    contrastText: "#111827",
    textShade: "#374151",
    textDark: "#374151",
    bg: "#F3F4F6",
    bgShade: "#E5E7EB",
    bgDark: "#E5E7EB",
  },
};

// Colores neutrales
export const neutral = {
  white: "#FFFFFF",
  black: "#000000",
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
};

// Exportación del objeto completo para facilitar la importación
export const colors = {
  themes,
  semantic,
  neutral,
};

export default colors;
 /* —— Light —— */
