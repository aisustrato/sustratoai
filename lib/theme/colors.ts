/**
 * Sistema de colores para Sustrato
 * Este archivo sirve como fuente única de verdad para todos los colores utilizados en la aplicación.
 */

// Tipos para mejor autocompletado y seguridad de tipos
export type ColorShade = {
  pure: string;
  pureShade: string;    // Variante más oscura/intensa de 'pure'
  text: string;
  contrastText: string; // Color de texto para usar sobre 'pure'
  textShade: string;    // Variante más oscura/intensa de 'text'
  bg: string;
  bgShade: string;    // Variante más oscura/intensa de 'bg'
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

// Tipo combinado para el objeto semantic exportado
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
    primary: {
      pure: "#3D7DF6",
      pureShade: "#2E5EB9",
      text: "#1f4487", // Oscuro para fondo claro
      contrastText: "#ECF2FE", // Claro para pure
      textShade: "#132951",
      bg: "#DCE6F9",
      bgShade: "#CBDAF6",
    },
    secondary: {
      pure: "#516e99",
      pureShade: "#3D5373",
      text: "#364866", // Oscuro para fondo claro
      contrastText: "#EEF1F5", // Claro para pure
      textShade: "#202B3D",
      bg: "#D6E2FF",
      bgShade: "#C2D4FF",
    },
    tertiary: {
      pure: "#1EA4E9",
      pureShade: "#177BAF",
      text: "#115f87", // Oscuro para fondo claro
      contrastText: "#E9F6FD", // Claro para pure
      textShade: "#0A3951",
      bg: "#d7f1fe",
      bgShade: "#C5EAFC",
    },
  } as ThemeColors,
  blueDark: {
    primary: {
      pure: "#5896F8",
      pureShade: "#3D7DF6",
      text: "#ADC8F9", // Claro para fondo oscuro
      contrastText: "#0A1A33", // Oscuro para pure
      textShade: "#8FB0EA",
      bg: "#0F1A2A",
      bgShade: "#0A111C",
    },
    secondary: {
      pure: "#7DA0D1",
      pureShade: "#516e99",
      text: "#BCCEE5", // Claro para fondo oscuro
      contrastText: "#101C2F", // Oscuro para pure
      textShade: "#A3B8D3",
      bg: "#1B283D",
      bgShade: "#121A27",
    },
    tertiary: {
      pure: "#5DC1F0",
      pureShade: "#1EA4E9",
      text: "#A8DDF6", // Claro para fondo oscuro
      contrastText: "#07293D", // Oscuro para pure
      textShade: "#8EC7E8",
      bg: "#0A2D40",
      bgShade: "#051D2B",
    },
  } as ThemeColors,

  green: {
    primary: {
      pure: "#0D7A73",
      pureShade: "#095751",
      text: "#042A27", // Oscuro para fondo claro
      contrastText: "#E0F7F6", // Claro para pure
      textShade: "#06403B",
      bg: "#E0F7F6",
      bgShade: "#B3E7E4",
    },
    secondary: {
      pure: "#3F683C",
      pureShade: "#375B34",
      text: "#274125", // Oscuro para fondo claro
      contrastText: "#D6F0EE", // Claro para pure
      textShade: "#101a0f",
      bg: "#e5f7e4",
      bgShade: "#d9e9d8",
    },
    tertiary: {
      pure: "#78C731",
      pureShade: "#56911F",
      text: "#354F18", // Oscuro para fondo claro
      contrastText: "#F8FEEB", // Claro para pure
      textShade: "#23370F",
      bg: "#ECF8D8",
      bgShade: "#C8D7B4",
    },
  } as ThemeColors,
  greenDark: {
    primary: {
      pure: "#1EBEB2",
      pureShade: "#0D7A73",
      text: "#A1E0DB", // Claro para fondo oscuro
      contrastText: "#042A27", // Oscuro para pure
      textShade: "#7FD1CA",
      bg: "#042A27",
      bgShade: "#021A17",
    },
    secondary: {
      pure: "#5DB0AA",
      pureShade: "#3D8F8A",
      text: "#A1D9D5", // Claro para fondo oscuro
      contrastText: "#0A2C2A", // Oscuro para pure
      textShade: "#8CCBC6",
      bg: "#0E3B38",
      bgShade: "#072523",
    },
    tertiary: {
      pure: "#8BE6E0",
      pureShade: "#6ECFCA",
      text: "#C2F0ED", // Claro para fondo oscuro
      contrastText: "#0F3E3A", // Oscuro para pure
      textShade: "#A1E0DB",
      bg: "#103F3B",
      bgShade: "#0A2D2A",
    },
  } as ThemeColors,

  orange: {
    primary: {
      pure: "#F77019",
      pureShade: "#B95413",
      text: "#99450f", // Oscuro para fondo claro
      contrastText: "#FEF1E8", // Claro para pure
      textShade: "#5C2909",
      bg: "#f6ede7",
      bgShade: "#d5c6bd",
    },
    secondary: {
      pure: "#913E0F",
      pureShade: "#6D2F0B",
      text: "#5e2909", // Oscuro para fondo claro
      contrastText: "#F4ECE7", // Claro para pure
      textShade: "#381905",
      bg: "#e3d8d1",
      bgShade: "#c1b3aa",
    },
    tertiary: {
      pure: "#7B294E",
      pureShade: "#561C36",
      text: "#4A1B32", // Oscuro para fondo claro
      contrastText: "#F2EAED", // Claro para pure
      textShade: "#2C1020",
      bg: "#F5E6ED",
      bgShade: "#e4c4d9",
    },
  } as ThemeColors,
  orangeDark: {
    primary: {
      pure: "#FB8C4A",
      pureShade: "#F77019",
      text: "#FCC6A4", // Claro para fondo oscuro
      contrastText: "#3D1C06", // Oscuro para pure
      textShade: "#F8B890",
      bg: "#301606",
      bgShade: "#200E02",
    },
    secondary: {
      pure: "#C26B3C",
      pureShade: "#913E0F",
      text: "#D9AD99", // Claro para fondo oscuro
      contrastText: "#301405", // Oscuro para pure
      textShade: "#C99C86",
      bg: "#2A1204",
      bgShade: "#1B0B01",
    },
    tertiary: {
      pure: "#B05A7F",
      pureShade: "#7B294E",
      text: "#D0A7BB", // Claro para fondo oscuro
      contrastText: "#300D1E", // Oscuro para pure
      textShade: "#C295AB",
      bg: "#2F0A1D",
      bgShade: "#1F0513",
    },
  } as ThemeColors,
  artisticGreen: {
    primary: {
      pure: "#006A4E", // Verde Esmeralda
      pureShade: "#00523D",
      text: "#003D2D", // Oscuro para fondo claro
      contrastText: "#E0F2EC", // Claro para pure
      textShade: "#002A1F",
      bg: "#D9F0E9",
      bgShade: "#C5E8DC",
    },
    secondary: {
      pure: "#B58A3F", // Ocre / Dorado Terroso
      pureShade: "#916E32",
      text: "#443418", // Oscuro para fondo claro
      contrastText: "#FDFBF6", // Claro para pure
      textShade: "#2E220F",
      bg: "#F7F2E8",
      bgShade: "#EFEADF",
    },
    tertiary: {
      pure: "#A0B8AF", // Salvia / Gris Verdoso
      pureShade: "#80938C",
      text: "#3E4A45", // Oscuro para fondo claro
      contrastText: "#FBFCFB", // Claro para pure
      textShade: "#2A322E",
      bg: "#EFF4F2",
      bgShade: "#E3EAE7",
    },
  } as ThemeColors,
  artisticGreenDark: {
    primary: {
      pure: "#008D6E", // Verde Esmeralda (Dark)
      pureShade: "#006A4E",
      text: "#A6D9CB", // Claro para fondo oscuro
      contrastText: "#002F1F", // Oscuro para pure
      textShade: "#8BCBB9",
      bg: "#002A1E",
      bgShade: "#001F15",
    },
    secondary: {
      pure: "#D4A25A", // Bronce (Dark)
      pureShade: "#B58A3F",
      text: "#F5E9D6", // Claro para fondo oscuro
      contrastText: "#5A4526", // Oscuro para pure
      textShade: "#F8F0E3",
      bg: "#362A17",
      bgShade: "#292011",
    },
    tertiary: {
      pure: "#7da297", // Teal Desaturado (Dark)
      pureShade: "#567068",
      text: "#E0E8E5", // Claro para fondo oscuro
      contrastText: "#212A27", // Oscuro para pure
      textShade: "#FFFFFF", // Ajustado para mayor claridad
      bg: "#212A27",
      bgShade: "#19201D",
    },
  } as ThemeColors,
  graphite: {
    primary: {
      pure: "#4B5563", // Gris Neutro
      pureShade: "#374151",
      text: "#111827", // Oscuro para fondo claro
      contrastText: "#F9FAFB", // Claro para pure
      textShade: "#000000",
      bg: "#F3F4F6",
      bgShade: "#E5E7EB",
    },
    secondary: {
      pure: "#64748B", // Gris Pizarra (Azulado)
      pureShade: "#475569",
      text: "#1E293B", // Oscuro para fondo claro
      contrastText: "#F8FAFC", // Claro para pure
      textShade: "#0F172A",
      bg: "#F1F5F9",
      bgShade: "#E2E8F0",
    },
    tertiary: {
      pure: "#6B7A72", // Gris Reseda (Verdoso)
      pureShade: "#525E57",
      text: "#2A332E", // Oscuro para fondo claro
      contrastText: "#F8FAF9", // Claro para pure
      textShade: "#1B211D",
      bg: "#F1F5F3",
      bgShade: "#E4EAE6",
    },
  } as ThemeColors,
  graphiteDark: {
    primary: {
      pure: "#9CA3AF", // Gris Neutro (Dark)
      pureShade: "#6B7280",
      text: "#F3F4F6", // Claro para fondo oscuro
      contrastText: "#111827", // Oscuro para pure
      textShade: "#FFFFFF", // Ajustado para mayor claridad
      bg: "#1F2937",
      bgShade: "#111827",
    },
    secondary: {
      pure: "#94A3B8", // Gris Pizarra (Azulado, Dark)
      pureShade: "#64748B",
      text: "#E2E8F0", // Claro para fondo oscuro
      contrastText: "#0F172A", // Oscuro para pure
      textShade: "#F1F5F9",
      bg: "#1E293B",
      bgShade: "#0F172A",
    },
    tertiary: {
      pure: "#98A79F", // Gris Reseda (Verdoso, Dark)
      pureShade: "#6B7A72",
      text: "#E4EAE6", // Claro para fondo oscuro
      contrastText: "#1B211D", // Oscuro para pure
      textShade: "#F1F5F3",
      bg: "#1E2925",
      bgShade: "#141A17",
    },
  } as ThemeColors,
  roseGold: {
    primary: {
      pure: "#dba491", // Oro Rosado
      pureShade: "#C39E90",
      text: "#5f4b46", // Oscuro para fondo claro
      contrastText: "#FFFFFF", // Claro para pure
      textShade: "#4A352F",
      bg: "#F9F3F1",
      bgShade: "#F2EAE7",
    },
    secondary: {
      pure: "#a67b72",        // Caramelo Suave (Dark theme pure - color claro)
      pureShade: "#816E5D",    // Corresponde al pure del tema claro
      text: "#483A2D",        // Texto claro para fondo oscuro (#5A4939)
      contrastText: "#F8F4EF",  // Texto oscuro para pure claro (#E1CBB8)
      textShade: "#564747",     // Variante más clara de text
      bg: "#dcd3cb",           // Fondo oscuro
      bgShade: "#cec0be",      // Fondo aún más oscuro
  
    },
    tertiary: {
      pure: "#a89477", // Gris Pardo (Taupe)
      pureShade: "#8A736A",
      text: "#4E342E", // Oscuro para fondo claro
      contrastText: "#FFFFFF", // Claro para pure
      textShade: "#3E2723",
      bg: "#F2ECE9",
      bgShade: "#E9E0DC",
    },
  } as ThemeColors,
  roseGoldDark: {
    primary: {
      pure: "#E6C4B9", // Oro Rosado (Dark)
      pureShade: "#D9AFA0",
      text: "#F9F3F1", // Claro para fondo oscuro
      contrastText: "#5C423B", // Oscuro para pure
      textShade: "#FFFFFF", // Ajustado
      bg: "#4A352F",
      bgShade: "#3E2723",
    },
    secondary: {
      pure: "#E1CBB8", // Caramelo Suave (Dark)
      pureShade: "#D5BBA1",
      text: "#F8F4EF", // Claro para fondo oscuro
      contrastText: "#6F5B48", // Oscuro para pure
      textShade: "#FFFFFF", // Ajustado
      bg: "#5A4939",
      bgShade: "#483A2D",
    },
    tertiary: {
      pure: "#BCAAA4", // Gris Pardo (Taupe, Dark)
      pureShade: "#A1887F",
      text: "#F2ECE9", // Claro para fondo oscuro
      contrastText: "#4E342E", // Oscuro para pure
      textShade: "#FFFFFF", // Ajustado
      bg: "#4E342E",
      bgShade: "#3E2723",
    },
  } as ThemeColors,
  midnight: { // Tema claro con 'pure' primario muy oscuro (lógica de contraste invertida)
    primary: {
      pure: "#192A51", // Azul Medianoche (muy oscuro)
      pureShade: "#111D38",
      text: "#3F51B5", // Texto oscuro (relativo al pure) pero legible sobre 'bg' claro (Contraste 5.15:1 vs #E8EAF6)
      contrastText: "#E8EAF6", // Texto claro para usar sobre 'pure'
      textShade: "#2c3880", // Más oscuro que 'text'
      bg: "#E8EAF6", // Fondo claro
      bgShade: "#DDE0F1",
    },
    secondary: {
      pure: "#65747A", // Plata (Contraste Corregido para fondos claros)
      pureShade: "#455A64",
      text: "#263238", // Texto oscuro para legibilidad sobre 'bg' claro
      contrastText: "#FFFFFF", // Texto claro para usar sobre 'pure'
      textShade: "#000000", // Variante más oscura de 'text'
      bg: "#ECEFF1", // Fondo claro
      bgShade: "#CFD8DC",
    },
    tertiary: {
      pure: "#5C6BC0", // Índigo
      pureShade: "#3F51B5",
      text: "#1A237E", // Texto oscuro para legibilidad sobre 'bg' claro
      contrastText: "#E8EAF6", // Texto claro para usar sobre 'pure'
      textShade: "#0D134A", // Variante más oscura de 'text'
      bg: "#E8EAF6", // Fondo claro
      bgShade: "#DDE0F1",
    },
  } as ThemeColors,
  midnightDark: { // Tema oscuro tradicional
    primary: {
      pure: "#536DFE", // Azul Medianoche (Dark) - Brillante
      pureShade: "#3D5AFE",
      text: "#E8EAF6", // Texto claro para fondo oscuro
      contrastText: "#1A237E", // Texto oscuro para contraste sobre 'pure'
      textShade: "#C5CAE9", // Variante de 'text'
      bg: "#1A237E", // Fondo oscuro
      bgShade: "#0D134A",
    },
    secondary: {
      pure: "#B0BEC5", // Plata (Dark) - Claro
      pureShade: "#90A4AE",
      text: "#ECEFF1", // Texto claro para fondo oscuro
      contrastText: "#263238", // Texto oscuro para contraste sobre 'pure'
      textShade: "#CFD8DC", // Variante de 'text'
      bg: "#263238", // Fondo oscuro
      bgShade: "#1A2226",
    },
    tertiary: {
      pure: "#7986CB", // Índigo (Dark) - Brillante
      pureShade: "#5C6BC0",
      text: "#E8EAF6", // Texto claro para fondo oscuro
      contrastText: "#1A237E", // Texto oscuro para contraste sobre 'pure'
      textShade: "#C5CAE9", // Variante de 'text'
      bg: "#283593", // Fondo oscuro
      bgShade: "#1A237E",
    },
  } as ThemeColors,
  burgundy: {
    primary: { // Burdeos Profundo
      pure: "#8D0027",
      pureShade: "#6A001D",
      text: "#4F0016", // Oscuro para fondo claro
      contrastText: "#FFE5EB", // Claro para pure
      textShade: "#3B0010",
      bg: "#FDEFF2", // Fondo rosado muy pálido
      bgShade: "#FADCE3",
    },
    secondary: { // Gris Taupe Cálido (Contraste Mejorado)
      pure: "#6B5F64",
      pureShade: "#524A4E",
      text: "#423B3F", // Oscuro para fondo claro
      contrastText: "#FCFAFB", // Claro para pure
      textShade: "#2E292C",
      bg: "#F5F3F4", // Fondo grisáceo muy pálido
      bgShade: "#EBE7E9",
    },
    tertiary: { // Bronce Apagado
      pure: "#B08D57",
      pureShade: "#8C7045",
      text: "#665133", // Oscuro para fondo claro
      contrastText: "#FFFBF5", // Claro para pure
      textShade: "#4D3D26",
      bg: "#FAF6EF", // Fondo beige muy pálido
      bgShade: "#F5EDDE",
    },
  } as ThemeColors,
  burgundyDark: {
    primary: { // Burdeos Profundo (Dark)
      pure: "#C43C5F", // Burdeos más claro y vibrante para modo oscuro
      pureShade: "#A71E42",
      text: "#FDD8E0", // Claro para fondo oscuro
      contrastText: "#4F0016", // Oscuro para pure
      textShade: "#FFB0C1",
      bg: "#2A000C", // Fondo burdeos muy oscuro
      bgShade: "#1F0009",
    },
    secondary: { // Gris Taupe Cálido (Dark, Contraste Mejorado)
      pure: "#B5ADB1",
      pureShade: "#6B5F64",
      text: "#EAE5E7", // Claro para fondo oscuro
      contrastText: "#423B3F", // Oscuro para pure
      textShade: "#D5CFD2",
      bg: "#423B3F", // Fondo gris oscuro
      bgShade: "#2E292C",
    },
    tertiary: { // Bronce Apagado (Dark)
      pure: "#D1B380",
      pureShade: "#B08D57",
      text: "#FAEED9", // Claro para fondo oscuro
      contrastText: "#4D3D26", // Oscuro para pure
      textShade: "#F0DFC3",
      bg: "#3D321F", // Fondo bronce oscuro
      bgShade: "#2E2517",
    },
  } as ThemeColors,
  zenith: {
    primary: {
      pure: "#51abbb", // Soft, desaturated Teal
      pureShade: "#3a9daf",
      text: "#3A5F66", 
      contrastText: "#F0FAFB",
      textShade: "#2A454A",
      bg: "#E6F5F7", 
      bgShade: "#D9EFF2",
    },
    secondary: {
      pure: "#b3836d", // Muted Terracotta/Peach
      pureShade: "#b28772",
      text: "#6B4E3F", 
      contrastText: "#FAF3EF",
      textShade: "#50392F",
      bg: "#f9efe7", 
      bgShade: "#ead9ce",
    },
    tertiary: {
      pure: "#9e9ed2", // Desaturated Lavender/Grey
      pureShade: "#9191ba",
      text: "#505060", 
      contrastText: "#F5F5FA",
      textShade: "#3A3A48",
      bg: "#f0ecfb", 
      bgShade: "#cacae3",
    },
  } as ThemeColors,
  zenithDark: {
    primary: {
      pure: "#5F9EA0", // Deeper Desaturated Teal
      pureShade: "#4A7C7E",
      text: "#CDE5E8", 
      contrastText: "#1A2C2E",
      textShade: "#B8DADE",
      bg: "#1F3A3D", 
      bgShade: "#15282A",
    },
    secondary: {
      pure: "#B08A78", // Muted Brown/Terracotta
      pureShade: "#967362",
      text: "#E8DCD3", 
      contrastText: "#3D2E26",
      textShade: "#DBCBC0",
      bg: "#382A23", 
      bgShade: "#2A1F1A",
    },
    tertiary: {
      pure: "#787890", // Dark Desaturated Lavender/Grey
      pureShade: "#606078",
      text: "#D3D3E0", 
      contrastText: "#262630",
      textShade: "#C0C0D0",
      bg: "#2A2A38", 
      bgShade: "#1F1F2A",
    },
  } as ThemeColors,
};

// Colores semánticos universales
export const semantic: AllSemanticColors = {
  accent: {
    pure: "#8A4EF6", // Púrpura corporativo
    pureShade: "#683BB9",
    text: "#5A3E9C", // Oscuro para fondo claro
    contrastText: "#F3EDFE", // Claro para pure
    textShade: "#4D2C8A",
    bg: "#F0EAFA",
    bgShade: "#E8D9F9",
  },
  accentDark: {
    pure: "#A475F8", // Púrpura corporativo (Dark)
    pureShade: "#8A4EF6",
    text: "#C6A9FA", // Claro para fondo oscuro
    contrastText: "#271347", // Oscuro para pure
    textShade: "#B592F4",
    bg: "#1A0F2A",
    bgShade: "#100A1B",
  },

  success: {
    pure: "hsl(133, 80%, 38%)", // Verde éxito
    pureShade: "#2DBF6F", // Pure más oscuro
    text: "#1A4D32", // Texto oscuro para fondo claro
    contrastText: "#E3FAEF", // Texto claro para pure
    textShade: "#0E2A1B",
    bg: "#E3FAEF",
    bgShade: "#cffae3",
  },
  successDark: {
    pure: "#08f376", // Verde éxito (Dark)
    pureShade: "#3DFF94",
    text: "#97FBC9", // Texto claro para fondo oscuro
    contrastText: "#0F3B22", // Texto oscuro para pure
    textShade: "#7EEBB6",
    bg: "#0A2A1A",
    bgShade: "#051B10",
  },

  warning: {
    pure: "#E5D30C", // Amarillo advertencia (sólido, sin alpha)
    pureShade: "#BFB32F",
    text: "#6E671A", // Texto oscuro para fondo claro
    contrastText: "#3d3b27", // Texto oscuro para pure (amarillo es claro)
    textShade: "#524D13",
    bg: "#f8f2c9",
    bgShade: "#efee9a",
  },
  warningDark: {
    pure: "#FFF260", // Amarillo advertencia (Dark)
    pureShade: "#FFEE3D",
    text: "#FFF7A0", // Texto claro para fondo oscuro
    contrastText: "#3B3809", // Texto oscuro para pure
    textShade: "#FFF58C",
    bg: "#292608",
    bgShade: "#1B1A03",
  },

  danger: {
    pure: "#ED3A45", // Rojo peligro
    pureShade: "#B22B34",
    text: "#6B1A1F", // Texto oscuro para fondo claro
    contrastText: "#FDEBEC", // Texto claro para pure
    textShade: "#501317",
    bg: "#F7ECEC",
    bgShade: "#F7DDDF",
  },
  dangerDark: {
    pure: "#F2606B", // Rojo peligro (Dark)
    pureShade: "#ED3A45",
    text: "#F7A0A6", // Texto claro para fondo oscuro
    contrastText: "#420B10", // Texto oscuro para pure
    textShade: "#F38C93",
    bg: "#2A0A0D",
    bgShade: "#1B0507",
  },

  neutral: { // Usado para elementos UI neutrales, no confundir con const neutral más abajo
    pure: "#6B7280", // Gris medio
    pureShade: "#4B5563",
    text: "#1F2937", // Texto oscuro para fondo claro
    contrastText: "#F0F1F3", // Texto claro para pure
    textShade: "#111827",
    bg: "#F9FAFB", // Fondo muy claro
    bgShade: "#d9dcdf",
  },
  neutralDark: {
    pure: "#9CA3AF", // Gris medio (Dark)
    pureShade: "#6B7280",
    text: "#E5E7EB", // Texto claro para fondo oscuro
    contrastText: "#1F2937", // Texto oscuro para pure
    textShade: "#D1D5DB",
    bg: "#111827", // Fondo muy oscuro
    bgShade: "#000000",
  },
  white: { // Para elementos explícitamente blancos
    pure: "#FFFFFF",
    pureShade: "#F3F4F6", // Gris muy claro
    text: "#1F2937", // Texto oscuro para fondo blanco
    contrastText: "#111827", // Texto oscuro para pure (que es blanco)
    textShade: "#374151",
    bg: "#FFFFFF",
    bgShade: "#F9FAFB",
  },
  whiteDark: { // Variante "blanca" para temas oscuros (generalmente un gris muy claro)
    pure: "#E5E7EB", // Gris muy claro
    pureShade: "#D1D5DB",
    text: "#1F2937", // Texto oscuro para este fondo claro
    contrastText: "#111827", // Texto oscuro para pure
    textShade: "#374151",
    bg: "#F3F4F6", // Fondo gris aún más claro
    bgShade: "#E5E7EB",
  },
};

// Colores neutrales (escala de grises)
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