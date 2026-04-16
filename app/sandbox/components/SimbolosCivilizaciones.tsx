// 📍 app/sandbox/components/SimbolosCivilizaciones.tsx
// 🍄👁️ Símbolos únicos por civilización - Identidad visual reconocible
// v0.01 - Hipatia Nexus

import React from "react";

interface SymbolProps {
	size?: number;
	color?: string;
	opacity?: number;
}

// 🏺 CHINCHORRO - Momia envuelta (primera momificación conocida)
export const SymbolChinchorro: React.FC<SymbolProps> = ({ size = 24, color = "#8B4513", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		{/* Cuerpo momificado envuelto */}
		<ellipse cx="12" cy="14" rx="5" ry="8" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.5} />
		{/* Cabeza */}
		<circle cx="12" cy="5" r="4" fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1.5} />
		{/* Vendas horizontales */}
		<line x1="7" y1="10" x2="17" y2="10" stroke={color} strokeWidth={1} />
		<line x1="7" y1="14" x2="17" y2="14" stroke={color} strokeWidth={1} />
		<line x1="8" y1="18" x2="16" y2="18" stroke={color} strokeWidth={1} />
		{/* Ojos cerrados */}
		<line x1="10" y1="4" x2="11" y2="4" stroke={color} strokeWidth={1.5} />
		<line x1="13" y1="4" x2="14" y2="4" stroke={color} strokeWidth={1.5} />
	</svg>
);

// 🗿 RAPA NUI - Moai estilizado
export const SymbolRapaNui: React.FC<SymbolProps> = ({ size = 24, color = "#5D6D7E", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		{/* Cabeza alargada del Moai */}
		<path d="M8 22L7 8C7 4 9 2 12 2C15 2 17 4 17 8L16 22H8Z" fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1.5} />
		{/* Ceja prominente */}
		<path d="M8 7H16" stroke={color} strokeWidth={2} />
		{/* Ojos hundidos */}
		<ellipse cx="10" cy="10" rx="1.5" ry="2" fill={color} />
		<ellipse cx="14" cy="10" rx="1.5" ry="2" fill={color} />
		{/* Nariz larga */}
		<line x1="12" y1="9" x2="12" y2="15" stroke={color} strokeWidth={1.5} />
		{/* Labios */}
		<line x1="10" y1="17" x2="14" y2="17" stroke={color} strokeWidth={1.5} />
	</svg>
);

// 🐍 MAYA - Serpiente emplumada (Kukulkán) simplificada
export const SymbolMaya: React.FC<SymbolProps> = ({ size = 24, color = "#27AE60", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		{/* Cuerpo serpentino */}
		<path 
			d="M4 18C6 14 8 16 10 12C12 8 14 10 16 6C18 2 20 4 22 2" 
			stroke={color} 
			strokeWidth={2.5} 
			strokeLinecap="round"
			fill="none"
		/>
		{/* Cabeza */}
		<circle cx="4" cy="18" r="3" fill={color} />
		{/* Ojo */}
		<circle cx="3.5" cy="17.5" r="1" fill="white" />
		{/* Plumas estilizadas */}
		<path d="M6 15L8 13M8 17L10 15M10 19L12 17" stroke={color} strokeWidth={1} strokeLinecap="round" />
	</svg>
);

// 🔺 EGIPTO - Pirámide con ojo
export const SymbolEgipto: React.FC<SymbolProps> = ({ size = 24, color = "#F1C40F", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		{/* Pirámide */}
		<path d="M12 2L2 22H22L12 2Z" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.5} />
		{/* Ojo de Horus simplificado */}
		<ellipse cx="12" cy="12" rx="4" ry="2.5" stroke={color} strokeWidth={1.5} fill="none" />
		<circle cx="12" cy="12" r="1.5" fill={color} />
		{/* Lágrima del ojo */}
		<path d="M12 14.5L12 17" stroke={color} strokeWidth={1.5} />
	</svg>
);

// 🏛️ GOBEKLI TEPE - Pilares en T
export const SymbolGobekliTepe: React.FC<SymbolProps> = ({ size = 24, color = "#95A5A6", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		{/* Pilar T izquierdo */}
		<path d="M4 6H10V8H8V20H6V8H4V6Z" fill={color} fillOpacity={0.6} stroke={color} strokeWidth={1} />
		{/* Pilar T derecho */}
		<path d="M14 6H20V8H18V20H16V8H14V6Z" fill={color} fillOpacity={0.6} stroke={color} strokeWidth={1} />
		{/* Símbolos animales (simplificados) */}
		<circle cx="7" cy="12" r="1" fill={color} />
		<circle cx="17" cy="12" r="1" fill={color} />
	</svg>
);

// 🌸 TEOTIHUACAN - Pirámide escalonada con sol
export const SymbolTeotihuacan: React.FC<SymbolProps> = ({ size = 24, color = "#E74C3C", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		{/* Pirámide escalonada */}
		<path d="M2 22H22L20 18H4L2 22Z" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1} />
		<path d="M4 18H20L18 14H6L4 18Z" fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1} />
		<path d="M6 14H18L16 10H8L6 14Z" fill={color} fillOpacity={0.5} stroke={color} strokeWidth={1} />
		<path d="M8 10H16L12 4L8 10Z" fill={color} fillOpacity={0.6} stroke={color} strokeWidth={1} />
		{/* Sol sobre pirámide */}
		<circle cx="12" cy="4" r="2" fill={color} />
	</svg>
);

// 🌀 INCA - Inti (sol) con rostro
export const SymbolInca: React.FC<SymbolProps> = ({ size = 24, color = "#F39C12", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		{/* Sol central */}
		<circle cx="12" cy="12" r="6" fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1.5} />
		{/* Rayos */}
		{[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
			<line 
				key={i}
				x1={12 + 7 * Math.cos(angle * Math.PI / 180)} 
				y1={12 + 7 * Math.sin(angle * Math.PI / 180)}
				x2={12 + 11 * Math.cos(angle * Math.PI / 180)} 
				y2={12 + 11 * Math.sin(angle * Math.PI / 180)}
				stroke={color} 
				strokeWidth={2}
				strokeLinecap="round"
			/>
		))}
		{/* Rostro simplificado */}
		<circle cx="10" cy="11" r="1" fill={color} />
		<circle cx="14" cy="11" r="1" fill={color} />
		<path d="M10 14C11 15 13 15 14 14" stroke={color} strokeWidth={1} fill="none" />
	</svg>
);

// 🐶 DOGON - Máscara Kanaga
export const SymbolDogon: React.FC<SymbolProps> = ({ size = 24, color = "#8B4513", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		{/* Máscara rectangular */}
		<rect x="8" y="8" width="8" height="12" rx="1" fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1.5} />
		{/* Cruz Kanaga superior */}
		<line x1="12" y1="2" x2="12" y2="8" stroke={color} strokeWidth={2} />
		<line x1="6" y1="4" x2="18" y2="4" stroke={color} strokeWidth={2} />
		{/* Ojos */}
		<rect x="9" y="10" width="2" height="3" fill={color} />
		<rect x="13" y="10" width="2" height="3" fill={color} />
	</svg>
);

// 🏯 ANGKOR / KHMER - Templo con torres
export const SymbolKhmer: React.FC<SymbolProps> = ({ size = 24, color = "#9B59B6", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		{/* Base */}
		<rect x="2" y="18" width="20" height="4" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1} />
		{/* Torres laterales */}
		<path d="M4 18L4 12L6 8L8 12L8 18" fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1} />
		<path d="M16 18L16 12L18 8L20 12L20 18" fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1} />
		{/* Torre central (más alta) */}
		<path d="M9 18L9 10L12 2L15 10L15 18" fill={color} fillOpacity={0.5} stroke={color} strokeWidth={1} />
	</svg>
);

// 📚 SONGHAI - Libro/manuscrito abierto
export const SymbolSonghai: React.FC<SymbolProps> = ({ size = 24, color = "#27AE60", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		{/* Libro abierto */}
		<path d="M2 6C2 6 6 4 12 4C18 4 22 6 22 6V20C22 20 18 18 12 18C6 18 2 20 2 20V6Z" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.5} />
		{/* Lomo central */}
		<line x1="12" y1="4" x2="12" y2="18" stroke={color} strokeWidth={1.5} />
		{/* Líneas de texto */}
		<line x1="4" y1="9" x2="10" y2="9" stroke={color} strokeWidth={0.5} />
		<line x1="4" y1="12" x2="10" y2="12" stroke={color} strokeWidth={0.5} />
		<line x1="14" y1="9" x2="20" y2="9" stroke={color} strokeWidth={0.5} />
		<line x1="14" y1="12" x2="20" y2="12" stroke={color} strokeWidth={0.5} />
	</svg>
);

// 🌳 KUHIKUGU / AMAZONÍA - Árbol con raíces (terra preta)
export const SymbolKuhikugu: React.FC<SymbolProps> = ({ size = 24, color = "#27AE60", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		{/* Copa del árbol */}
		<circle cx="12" cy="7" r="6" fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1.5} />
		{/* Tronco */}
		<rect x="10" y="13" width="4" height="5" fill={color} fillOpacity={0.6} />
		{/* Raíces (terra preta) */}
		<path d="M8 18L6 22M12 18L12 22M16 18L18 22" stroke={color} strokeWidth={1.5} />
		{/* Suelo negro */}
		<ellipse cx="12" cy="22" rx="8" ry="2" fill="#2C3E50" fillOpacity={0.3} />
	</svg>
);

// 👑 SUTTON HOO - Casco anglo
export const SymbolSuttonHoo: React.FC<SymbolProps> = ({ size = 24, color = "#F39C12", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		{/* Casco */}
		<path d="M4 14C4 8 8 4 12 4C16 4 20 8 20 14L18 18H6L4 14Z" fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1.5} />
		{/* Nasal */}
		<line x1="12" y1="6" x2="12" y2="16" stroke={color} strokeWidth={2} />
		{/* Protector de mejillas */}
		<path d="M6 14L4 18" stroke={color} strokeWidth={1.5} />
		<path d="M18 14L20 18" stroke={color} strokeWidth={1.5} />
		{/* Ojos */}
		<circle cx="9" cy="12" r="1.5" stroke={color} strokeWidth={1} fill="none" />
		<circle cx="15" cy="12" r="1.5" stroke={color} strokeWidth={1} fill="none" />
		{/* Cresta */}
		<path d="M8 4C10 2 14 2 16 4" stroke={color} strokeWidth={1.5} fill="none" />
	</svg>
);

// 🪶 AKSUM - Obelisco estilizado
export const SymbolAksum: React.FC<SymbolProps> = ({ size = 24, color = "#5D6D7E", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		{/* Obelisco */}
		<path d="M10 22L9 4L12 2L15 4L14 22H10Z" fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1.5} />
		{/* Ventanas decorativas */}
		<rect x="11" y="6" width="2" height="3" fill={color} />
		<rect x="11" y="11" width="2" height="3" fill={color} />
		<rect x="11" y="16" width="2" height="3" fill={color} />
		{/* Base */}
		<rect x="8" y="22" width="8" height="2" fill={color} fillOpacity={0.6} />
	</svg>
);

// 🏯 GOGURYEO - Tumba con murales
export const SymbolGoguryeo: React.FC<SymbolProps> = ({ size = 24, color = "#3498DB", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		{/* Túmulo */}
		<path d="M2 20C2 20 6 8 12 8C18 8 22 20 22 20H2Z" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.5} />
		{/* Entrada */}
		<rect x="10" y="14" width="4" height="6" fill={color} fillOpacity={0.6} />
		{/* Estrellas (astronomía en murales) */}
		<circle cx="8" cy="12" r="1" fill={color} />
		<circle cx="16" cy="12" r="1" fill={color} />
		<circle cx="12" cy="10" r="1" fill={color} />
	</svg>
);

// ⛵ SRIVIJAYA - Barco con vela
export const SymbolSrivijaya: React.FC<SymbolProps> = ({ size = 24, color = "#3498DB", opacity = 1 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
		{/* Casco del barco */}
		<path d="M2 16C2 16 4 20 12 20C20 20 22 16 22 16L20 14H4L2 16Z" fill={color} fillOpacity={0.4} stroke={color} strokeWidth={1.5} />
		{/* Mástil */}
		<line x1="12" y1="4" x2="12" y2="14" stroke={color} strokeWidth={2} />
		{/* Vela */}
		<path d="M12 4L18 10L12 12Z" fill={color} fillOpacity={0.5} stroke={color} strokeWidth={1} />
		{/* Olas */}
		<path d="M2 22C4 20 6 20 8 22C10 24 12 24 14 22C16 20 18 20 20 22" stroke={color} strokeWidth={1} fill="none" />
	</svg>
);

// Mapeo de civilización a símbolo
export const civilizationSymbols: Record<string, React.FC<SymbolProps>> = {
	chinchorro: SymbolChinchorro,
	rapa_nui: SymbolRapaNui,
	maya: SymbolMaya,
	egipto: SymbolEgipto,
	gobekli_tepe: SymbolGobekliTepe,
	teotihuacan: SymbolTeotihuacan,
	inca: SymbolInca,
	dogon: SymbolDogon,
	khmer: SymbolKhmer,
	songhai: SymbolSonghai,
	kuhikugu: SymbolKuhikugu,
	sutton_hoo: SymbolSuttonHoo,
	aksum: SymbolAksum,
	goguryeo: SymbolGoguryeo,
	srivijaya: SymbolSrivijaya,
};

// Componente que renderiza el símbolo correcto
export const SimboloCivilizacion: React.FC<{
	civId: string;
	size?: number;
	color?: string;
	opacity?: number;
	fallbackEmoji?: string;
}> = ({ civId, size = 24, color, opacity = 1, fallbackEmoji }) => {
	const Symbol = civilizationSymbols[civId];
	
	if (Symbol) {
		return <Symbol size={size} color={color} opacity={opacity} />;
	}
	
	// Fallback a emoji si no hay símbolo específico
	if (fallbackEmoji) {
		return <span style={{ fontSize: size * 0.8, opacity }}>{fallbackEmoji}</span>;
	}
	
	// Default: círculo con inicial
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity}>
			<circle cx="12" cy="12" r="10" fill={color || "#95A5A6"} fillOpacity={0.3} stroke={color || "#95A5A6"} strokeWidth={1.5} />
			<text x="12" y="16" textAnchor="middle" fontSize="12" fill={color || "#95A5A6"} fontWeight="bold">
				{civId.charAt(0).toUpperCase()}
			</text>
		</svg>
	);
};

export default SimboloCivilizacion;
