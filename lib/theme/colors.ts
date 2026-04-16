/**
 * Sistema de colores para Sustrato
 * Este archivo sirve como fuente única de verdad para todos los colores utilizados en la aplicación.
 */

// Tipos para mejor autocompletado y seguridad de tipos
export type ColorShade = {
	pure: string;
	pureShade: string; // Variante más oscura/intensa de 'pure'
	text: string;
	contrastText: string; // Color de texto para usar sobre 'pure'
	textShade: string; // Variante más oscura/intensa de 'text'
	bg: string;
	bgShade: string; // Variante más oscura/intensa de 'bg'
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
			text: "#1f4487",
			contrastText: "#ECF2FE",
			textShade: "#132951",
			bg: "#DCE6F9",
			bgShade: "#CBDAF6",
		},
		secondary: {
			pure: "#7B8FA8", // 🎨 Gris-azulado más claro y neutro
			pureShade: "#5A6D85",
			text: "#3A4A5E",
			contrastText: "#F0F3F7",
			textShade: "#252F3D",
			bg: "#E8ECF1",
			bgShade: "#D5DCE5",
		},
		tertiary: {
			pure: "#1EA4E9",
			pureShade: "#177BAF",
			text: "#115f87",
			contrastText: "#E9F6FD",
			textShade: "#0A3951",
			bg: "#d7f1fe",
			bgShade: "#C5EAFC",
		},
	} as ThemeColors,
	blueDark: {
		primary: {
			pure: "#5896F8",
			pureShade: "#3D7DF6",
			text: "#ADC8F9",
			contrastText: "#0A1A33",
			textShade: "#8FB0EA",
			bg: "#0F1A2A",
			bgShade: "#0A111C",
		},
		secondary: {
			pure: "#9BAEC4", // Gris-azulado claro (Dark) - coherente con light
			pureShade: "#7B8FA8",
			text: "#D5DCE5",
			contrastText: "#252F3D",
			textShade: "#C2CBDB",
			bg: "#252F3D",
			bgShade: "#1A2229",
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
			text: "#042A27",
			contrastText: "#E0F7F6",
			textShade: "#06403B",
			bg: "#E0F7F6",
			bgShade: "#B3E7E4",
		},
		secondary: {
			pure: "#3F683C",
			pureShade: "#375B34",
			text: "#2F4D2A", // Ligeramente más claro para mejor legibilidad
			contrastText: "#D6F0EE",
			textShade: "#1A2E17",
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
			text: "#99450f",
			contrastText: "#FEF1E8",
			textShade: "#5C2909",
			bg: "#f6ede7",
			bgShade: "#d5c6bd",
		},
		secondary: {
			pure: "#D4A574", // Ocre dorado - paleta cálida coherente
			pureShade: "#B88A5A",
			text: "#6B4E2F",
			contrastText: "#FFF9F3",
			textShade: "#4A3520",
			bg: "#F5EDE3",
			bgShade: "#E8DDD0",
		},
		tertiary: {
			pure: "#C85A3B", // Terracota - completa armonía cálida
			pureShade: "#A4462E",
			text: "#6B2E1E",
			contrastText: "#FFF3EF",
			textShade: "#4A1F14",
			bg: "#F9E8E3",
			bgShade: "#EDD9D2",
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
			pure: "#E8C49A", // Ocre dorado claro (Dark) - coherente con light
			pureShade: "#D4A574",
			text: "#F5EDE3",
			contrastText: "#4A3520",
			textShade: "#EBE0D0",
			bg: "#4A3520",
			bgShade: "#332512",
		},
		tertiary: {
			pure: "#E08A6E", // Terracota claro (Dark) - coherente con light
			pureShade: "#C85A3B",
			text: "#F9E8E3",
			contrastText: "#4A1F14",
			textShade: "#EDD9D2",
			bg: "#4A1F14",
			bgShade: "#33140D",
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
			pure: "#8FB8A8", // Salvia más saturado - más presencia visual
			pureShade: "#72A090",
			text: "#3E5A4E",
			contrastText: "#F8FCFB",
			textShade: "#2A3D35",
			bg: "#EDF5F2",
			bgShade: "#E0EBE7",
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
			pure: "#E0B4A3", // Oro rosado más saturado - mejor diferenciación
			pureShade: "#C89B88",
			text: "#6B4B42",
			contrastText: "#FFFBF9",
			textShade: "#4F3630",
			bg: "#F9F3F1",
			bgShade: "#F2EAE7",
		},
		secondary: {
			pure: "#B89080", // Caramelo más diferenciado - coherencia mejorada
			pureShade: "#9A7568",
			text: "#5A4238",
			contrastText: "#FAF5F2",
			textShade: "#3E2E26",
			bg: "#F0E8E3",
			bgShade: "#E4D9D3",
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
			pure: "#F0CEC0", // Oro rosado claro (Dark) - coherente con light
			pureShade: "#E0B4A3",
			text: "#FFFBF9",
			contrastText: "#4F3630",
			textShade: "#F9F3F1",
			bg: "#4F3630",
			bgShade: "#3A2621",
		},
		secondary: {
			pure: "#D4AFA0", // Caramelo claro (Dark) - coherente con light
			pureShade: "#B89080",
			text: "#FAF5F2",
			contrastText: "#3E2E26",
			textShade: "#F0E8E3",
			bg: "#3E2E26",
			bgShade: "#2D1F1A",
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
	midnight: {
		primary: {
			pure: "#2C4A7C", // Azul medianoche más claro - funcional en modo light
			pureShade: "#1F3559",
			text: "#4A6BA8",
			contrastText: "#E8EAF6",
			textShade: "#2F4780",
			bg: "#E8EAF6",
			bgShade: "#DDE0F1",
		},
		secondary: {
			pure: "#7A8C9E", // Plata azulada más saturada - mejor diferenciación
			pureShade: "#5F7080",
			text: "#3A4A5A",
			contrastText: "#F5F7FA",
			textShade: "#252F3D",
			bg: "#EDF0F4",
			bgShade: "#DFE4EA",
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
	midnightDark: {
		// Tema oscuro tradicional
		primary: {
			pure: "#4A6BA8", // Azul medianoche brillante (Dark) - coherente con light
			pureShade: "#2C4A7C",
			text: "#E8EAF6",
			contrastText: "#1F3559",
			textShade: "#DDE0F1",
			bg: "#1F3559",
			bgShade: "#152440",
		},
		secondary: {
			pure: "#A3B5C7", // Plata azulada clara (Dark) - coherente con light
			pureShade: "#7A8C9E",
			text: "#F5F7FA",
			contrastText: "#252F3D",
			textShade: "#EDF0F4",
			bg: "#252F3D",
			bgShade: "#1A2229",
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
		primary: {
			// Burdeos Profundo
			pure: "#8D0027",
			pureShade: "#6A001D",
			text: "#4F0016", // Oscuro para fondo claro
			contrastText: "#FFE5EB", // Claro para pure
			textShade: "#3B0010",
			bg: "#FDEFF2", // Fondo rosado muy pálido
			bgShade: "#FADCE3",
		},
		secondary: {
			pure: "#8A7278", // Taupe más saturado - más presencia visual
			pureShade: "#6B5A5F",
			text: "#4A3A3E",
			contrastText: "#FAF8F9",
			textShade: "#322A2D",
			bg: "#F5F3F4",
			bgShade: "#EBE7E9",
		},
		tertiary: {
			// Bronce Apagado
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
		primary: {
			// Burdeos Profundo (Dark)
			pure: "#C43C5F", // Burdeos más claro y vibrante para modo oscuro
			pureShade: "#A71E42",
			text: "#FDD8E0", // Claro para fondo oscuro
			contrastText: "#4F0016", // Oscuro para pure
			textShade: "#FFB0C1",
			bg: "#2A000C", // Fondo burdeos muy oscuro
			bgShade: "#1F0009",
		},
		secondary: {
			// Gris Taupe Cálido (Dark, Contraste Mejorado)
			pure: "#B5ADB1",
			pureShade: "#6B5F64",
			text: "#EAE5E7", // Claro para fondo oscuro
			contrastText: "#423B3F", // Oscuro para pure
			textShade: "#D5CFD2",
			bg: "#423B3F", // Fondo gris oscuro
			bgShade: "#2E292C",
		},
		tertiary: {
			// Bronce Apagado (Dark)
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
			pure: "#51abbb",
			pureShade: "#3D8FA0", // 🎨 Más oscuro - mejor progresión
			text: "#3A5F66",
			contrastText: "#F0FAFB",
			textShade: "#2A454A",
			bg: "#E6F5F7",
			bgShade: "#D9EFF2",
		},
		secondary: {
			pure: "#b3836d",
			pureShade: "#956C58", // 🎨 Más oscuro - mejor progresión
			text: "#6B4E3F",
			contrastText: "#FAF3EF",
			textShade: "#50392F",
			bg: "#f9efe7",
			bgShade: "#ead9ce",
		},
		tertiary: {
			pure: "#9e9ed2",
			pureShade: "#8282B8", // 🎨 Más oscuro - mejor progresión
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
	coral: {
		primary: {
			pure: "#FF6B6B", // Coral vibrante
			pureShade: "#E85555",
			text: "#8B2E2E",
			contrastText: "#FFF5F5",
			textShade: "#6B1F1F",
			bg: "#FFE8E8",
			bgShade: "#FFD4D4",
		},
		secondary: {
			pure: "#FFA07A", // Salmón suave
			pureShade: "#E88A64",
			text: "#8B4513",
			contrastText: "#FFF9F5",
			textShade: "#6B3410",
			bg: "#FFF0E8",
			bgShade: "#FFE0CC",
		},
		tertiary: {
			pure: "#FFD93D", // Amarillo cálido
			pureShade: "#E6C235",
			text: "#8B7500",
			contrastText: "#FFFDF0",
			textShade: "#6B5A00",
			bg: "#FFFAEB",
			bgShade: "#FFF4D4",
		},
	} as ThemeColors,
	coralDark: {
		primary: {
			pure: "#FF8787", // Coral brillante (Dark)
			pureShade: "#FF6B6B",
			text: "#FFD4D4",
			contrastText: "#6B1F1F",
			textShade: "#FFC2C2",
			bg: "#6B1F1F",
			bgShade: "#4A1515",
		},
		secondary: {
			pure: "#FFB89A", // Salmón claro (Dark)
			pureShade: "#FFA07A",
			text: "#FFE0CC",
			contrastText: "#6B3410",
			textShade: "#FFD4BA",
			bg: "#6B3410",
			bgShade: "#4A240B",
		},
		tertiary: {
			pure: "#FFE566", // Amarillo cálido brillante (Dark)
			pureShade: "#FFD93D",
			text: "#FFF4D4",
			contrastText: "#6B5A00",
			textShade: "#FFEFBA",
			bg: "#6B5A00",
			bgShade: "#4A3E00",
		},
	} as ThemeColors,
	ocean: {
		primary: {
			pure: "#0EA5E9", // Cyan tech
			pureShade: "#0284C7",
			text: "#075985",
			contrastText: "#F0F9FF",
			textShade: "#0C4A6E",
			bg: "#E0F2FE",
			bgShade: "#BAE6FD",
		},
		secondary: {
			pure: "#06B6D4", // Turquesa brillante
			pureShade: "#0891B2",
			text: "#155E75",
			contrastText: "#ECFEFF",
			textShade: "#164E63",
			bg: "#CFFAFE",
			bgShade: "#A5F3FC",
		},
		tertiary: {
			pure: "#8B5CF6", // Violeta tech
			pureShade: "#7C3AED",
			text: "#5B21B6",
			contrastText: "#F5F3FF",
			textShade: "#4C1D95",
			bg: "#EDE9FE",
			bgShade: "#DDD6FE",
		},
	} as ThemeColors,
	oceanDark: {
		primary: {
			pure: "#38BDF8", // Cyan brillante (Dark)
			pureShade: "#0EA5E9",
			text: "#BAE6FD",
			contrastText: "#0C4A6E",
			textShade: "#7DD3FC",
			bg: "#0C4A6E",
			bgShade: "#082F49",
		},
		secondary: {
			pure: "#22D3EE", // Turquesa brillante (Dark)
			pureShade: "#06B6D4",
			text: "#A5F3FC",
			contrastText: "#164E63",
			textShade: "#67E8F9",
			bg: "#164E63",
			bgShade: "#0E3A4A",
		},
		tertiary: {
			pure: "#A78BFA", // Violeta tech brillante (Dark)
			pureShade: "#8B5CF6",
			text: "#DDD6FE",
			contrastText: "#4C1D95",
			textShade: "#C4B5FD",
			bg: "#4C1D95",
			bgShade: "#3B1575",
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
		pure: "#10B981", // Verde esmeralda más vibrante
		pureShade: "#059669",
		text: "#065F46",
		contrastText: "#D1FAE5",
		textShade: "#064E3B",
		bg: "#D1FAE5",
		bgShade: "#A7F3D0",
	},
	successDark: {
		pure: "#34D399", // Verde esmeralda brillante (Dark)
		pureShade: "#10B981",
		text: "#A7F3D0",
		contrastText: "#064E3B",
		textShade: "#6EE7B7",
		bg: "#064E3B",
		bgShade: "#022C22",
	},

	warning: {
		pure: "#F59E0B", // Ámbar - mejor legibilidad que amarillo
		pureShade: "#D97706",
		text: "#78350F",
		contrastText: "#FFFBEB",
		textShade: "#451A03",
		bg: "#FEF3C7",
		bgShade: "#FDE68A",
	},
	warningDark: {
		pure: "#FBBF24", // Ámbar brillante (Dark)
		pureShade: "#F59E0B",
		text: "#FEF3C7",
		contrastText: "#78350F",
		textShade: "#FDE68A",
		bg: "#78350F",
		bgShade: "#451A03",
	},

	danger: {
		pure: "#EF4444", // Rojo más puro e intenso
		pureShade: "#DC2626",
		text: "#991B1B",
		contrastText: "#FEE2E2",
		textShade: "#7F1D1D",
		bg: "#FEE2E2",
		bgShade: "#FECACA",
	},
	dangerDark: {
		pure: "#F87171", // Rojo brillante (Dark)
		pureShade: "#EF4444",
		text: "#FECACA",
		contrastText: "#7F1D1D",
		textShade: "#FCA5A5",
		bg: "#7F1D1D",
		bgShade: "#450A0A",
	},

	neutral: {
		// Usado para elementos UI neutrales, no confundir con const neutral más abajo
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
	white: {
		// Para elementos explícitamente blancos
		pure: "#FFFFFF",
		pureShade: "#F3F4F6", // Gris muy claro
		text: "#1F2937", // Texto oscuro para fondo blanco
		contrastText: "#111827", // Texto oscuro para pure (que es blanco)
		textShade: "#374151",
		bg: "#FFFFFF",
		bgShade: "#F9FAFB",
	},
	whiteDark: {
		// Variante "blanca" para temas oscuros (generalmente un gris muy claro)
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
