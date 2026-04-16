// 📍 app/sandbox/components/IconosNexus.tsx
// 🍄👁️ Iconografía SVG resonante - Geometría simple, significado profundo
// v0.01 - Hipatia Nexus

import React from "react";

interface IconProps {
	size?: number;
	color?: string;
	opacity?: number;
}

// 🔺 PIRÁMIDE - Civilizaciones monumentales, estructura hacia el cielo
export const IconPiramide: React.FC<IconProps> = ({ size = 20, color = "#2C3E50", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		<path d="M12 2L2 22H22L12 2Z" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.5} />
		<line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth={0.5} strokeDasharray="2,2" />
	</svg>
);

// 🌀 ESPIRAL - Glitches, anomalías, conocimiento emergente
export const IconEspiral: React.FC<IconProps> = ({ size = 20, color = "#9B59B6", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		<path 
			d="M12 12C12 10 14 8 16 8C18 8 20 10 20 12C20 16 16 20 12 20C6 20 2 16 2 12C2 6 8 2 12 2" 
			stroke={color} 
			strokeWidth={2} 
			strokeLinecap="round"
			fill="none"
		/>
		<circle cx="12" cy="12" r="2" fill={color} />
	</svg>
);

// ⭕ CÍRCULOS CONCÉNTRICOS - Abundancia, épocas doradas, radiación cultural
export const IconConcentrico: React.FC<IconProps> = ({ size = 20, color = "#F39C12", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		<circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1} fill="none" />
		<circle cx="12" cy="12" r="6" stroke={color} strokeWidth={1.5} fill="none" />
		<circle cx="12" cy="12" r="2" fill={color} />
	</svg>
);

// 👁️ OJO - Glitch civilization, conocimiento oculto/prohibido
export const IconOjo: React.FC<IconProps> = ({ size = 20, color = "#E74C3C", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		<path 
			d="M2 12C2 12 6 4 12 4C18 4 22 12 22 12C22 12 18 20 12 20C6 20 2 12 2 12Z" 
			stroke={color} 
			strokeWidth={1.5}
			fill={color}
			fillOpacity={0.15}
		/>
		<circle cx="12" cy="12" r="3" fill={color} />
		<circle cx="12" cy="12" r="1" fill="white" />
	</svg>
);

// 🌊 ONDAS - Imperios marítimos, navegación, comercio oceánico
export const IconOndas: React.FC<IconProps> = ({ size = 20, color = "#3498DB", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		<path d="M2 8C4 6 6 6 8 8C10 10 12 10 14 8C16 6 18 6 20 8" stroke={color} strokeWidth={2} strokeLinecap="round" />
		<path d="M2 14C4 12 6 12 8 14C10 16 12 16 14 14C16 12 18 12 20 14" stroke={color} strokeWidth={2} strokeLinecap="round" />
	</svg>
);

// ⛰️ MONTAÑA - Andes, altiplano, civilizaciones de altura
export const IconMontana: React.FC<IconProps> = ({ size = 20, color = "#8B5CF6", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		<path d="M2 20L8 8L12 14L16 6L22 20H2Z" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.5} />
	</svg>
);

// ☀️ SOL - Astronomía de precisión, calendarios, solsticios
export const IconSol: React.FC<IconProps> = ({ size = 20, color = "#F1C40F", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		<circle cx="12" cy="12" r="5" fill={color} />
		{[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
			<line 
				key={i}
				x1={12 + 7 * Math.cos(angle * Math.PI / 180)} 
				y1={12 + 7 * Math.sin(angle * Math.PI / 180)}
				x2={12 + 10 * Math.cos(angle * Math.PI / 180)} 
				y2={12 + 10 * Math.sin(angle * Math.PI / 180)}
				stroke={color} 
				strokeWidth={2}
				strokeLinecap="round"
			/>
		))}
	</svg>
);

// 📚 LIBRO - Bibliotecas, conocimiento, educación masiva
export const IconLibro: React.FC<IconProps> = ({ size = 20, color = "#27AE60", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		<path d="M4 4V20L12 16L20 20V4H4Z" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.5} />
		<line x1="12" y1="4" x2="12" y2="16" stroke={color} strokeWidth={1} />
	</svg>
);

// 💀 CRÁNEO - Momificación, rituales funerarios, preservación
export const IconCraneo: React.FC<IconProps> = ({ size = 20, color = "#7F8C8D", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		<ellipse cx="12" cy="10" rx="8" ry="9" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.5} />
		<circle cx="9" cy="9" r="2" fill={color} />
		<circle cx="15" cy="9" r="2" fill={color} />
		<path d="M9 18V22M12 18V22M15 18V22" stroke={color} strokeWidth={1.5} />
	</svg>
);

// 🌳 ÁRBOL - Amazonía, agricultura, simbiosis tierra
export const IconArbol: React.FC<IconProps> = ({ size = 20, color = "#27AE60", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		<circle cx="12" cy="8" r="6" fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1.5} />
		<rect x="10" y="14" width="4" height="8" fill={color} fillOpacity={0.6} />
	</svg>
);

// 👑 CORONA - Reinos, poder centralizado, tesoros
export const IconCorona: React.FC<IconProps> = ({ size = 20, color = "#F39C12", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		<path d="M4 18L6 8L12 12L18 8L20 18H4Z" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.5} />
		<circle cx="6" cy="8" r="2" fill={color} />
		<circle cx="12" cy="6" r="2" fill={color} />
		<circle cx="18" cy="8" r="2" fill={color} />
	</svg>
);

// 🏛️ TEMPLO - Arquitectura monumental, megalitismo
export const IconTemplo: React.FC<IconProps> = ({ size = 20, color = "#E67E22", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		<path d="M12 2L2 8V10H22V8L12 2Z" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.5} />
		<rect x="4" y="10" width="3" height="10" fill={color} fillOpacity={0.5} />
		<rect x="10.5" y="10" width="3" height="10" fill={color} fillOpacity={0.5} />
		<rect x="17" y="10" width="3" height="10" fill={color} fillOpacity={0.5} />
		<rect x="2" y="20" width="20" height="2" fill={color} />
	</svg>
);

// ⚔️ ESPADAS - Conflicto, colapso militar, resistencia
export const IconEspadas: React.FC<IconProps> = ({ size = 20, color = "#95A5A6", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		<line x1="4" y1="4" x2="14" y2="14" stroke={color} strokeWidth={2} />
		<line x1="20" y1="4" x2="10" y2="14" stroke={color} strokeWidth={2} />
		<circle cx="12" cy="16" r="3" stroke={color} strokeWidth={1.5} fill="none" />
	</svg>
);

// 🗿 MONOLITO - Piedras gigantes, megalitos, misterio
export const IconMonolito: React.FC<IconProps> = ({ size = 20, color = "#5D6D7E", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		<path d="M8 22L6 4C6 2 8 2 12 2C16 2 18 2 18 4L16 22H8Z" fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1.5} />
		<ellipse cx="10" cy="8" rx="1.5" ry="2" fill={color} fillOpacity={0.8} />
		<ellipse cx="14" cy="8" rx="1.5" ry="2" fill={color} fillOpacity={0.8} />
	</svg>
);

// 💧 GOTA - Hidráulica, irrigación, sistemas de agua
export const IconGota: React.FC<IconProps> = ({ size = 20, color = "#3498DB", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		<path d="M12 2L6 14C6 18 8.68 22 12 22C15.32 22 18 18 18 14L12 2Z" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.5} />
	</svg>
);

// 🎯 Mapeo de tipo/patternTag a icono
export type IconoNexusType = 
	| "piramide" | "espiral" | "concentrico" | "ojo" | "ondas" 
	| "montana" | "sol" | "libro" | "craneo" | "arbol" 
	| "corona" | "templo" | "espadas" | "monolito" | "gota"
	| "default";

// Función para obtener el icono correcto basado en datos del nodo
export const getIconoNexus = (
	type?: string, 
	glitchType?: string, 
	patternTags?: string[]
): IconoNexusType => {
	// Primero por glitchType
	if (glitchType === "conocimiento_imposible" || glitchType === "aparicion_prematura") return "ojo";
	if (glitchType === "narrativa_rota" || glitchType === "narrativa_eurocentrica") return "espiral";
	
	// Por tipo de nodo
	if (type === "abundance_epoch") return "concentrico";
	if (type === "glitch_civilization") return "ojo";
	
	// Por patternTags
	if (patternTags?.some(t => t.includes("piramide"))) return "piramide";
	if (patternTags?.some(t => t.includes("astronomia"))) return "sol";
	if (patternTags?.some(t => t.includes("megalit") || t.includes("monolito"))) return "monolito";
	if (patternTags?.some(t => t.includes("momificacion") || t.includes("funerario"))) return "craneo";
	if (patternTags?.some(t => t.includes("maritim") || t.includes("navegacion"))) return "ondas";
	if (patternTags?.some(t => t.includes("biblioteca") || t.includes("educacion"))) return "libro";
	if (patternTags?.some(t => t.includes("hidraulic") || t.includes("irrigacion"))) return "gota";
	if (patternTags?.some(t => t.includes("urbanismo"))) return "templo";
	if (patternTags?.some(t => t.includes("agricult") || t.includes("terra_preta"))) return "arbol";
	if (patternTags?.some(t => t.includes("resistencia") || t.includes("colapso"))) return "espadas";
	
	return "concentrico"; // default
};

// Componente renderizador de iconos
export const IconoNexus: React.FC<{
	tipo: IconoNexusType;
	size?: number;
	color?: string;
	opacity?: number;
}> = ({ tipo, size = 20, color, opacity = 1 }) => {
	const iconMap: Record<IconoNexusType, React.FC<IconProps>> = {
		piramide: IconPiramide,
		espiral: IconEspiral,
		concentrico: IconConcentrico,
		ojo: IconOjo,
		ondas: IconOndas,
		montana: IconMontana,
		sol: IconSol,
		libro: IconLibro,
		craneo: IconCraneo,
		arbol: IconArbol,
		corona: IconCorona,
		templo: IconTemplo,
		espadas: IconEspadas,
		monolito: IconMonolito,
		gota: IconGota,
		default: IconConcentrico,
	};

	const Icon = iconMap[tipo] || iconMap.default;
	return <Icon size={size} color={color} opacity={opacity} />;
};

export default IconoNexus;
