"use client";

import React, { useMemo } from 'react';
import { useTheme } from '@/app/theme-provider';
import type { AppColorTokens } from '@/lib/theme/ColorToken';

interface TextHighlighterProps {
	text: string;
	keyword: string | null;
	className?: string;
}

/**
 * Genera los estilos de resaltado usando el color accent del tema
 */
function generateHighlightStyle(appColorTokens: AppColorTokens): React.CSSProperties {
	const accentTokens = appColorTokens.accent;
	return {
		backgroundColor: accentTokens.bg,
		color: accentTokens.text,
		border: `1px solid ${accentTokens.pure}`,
		padding: '2px 6px',
		borderRadius: '4px',
		fontWeight: '600',
	};
}

/**
 * Componente que resalta una palabra clave específica en un texto
 * usando el color accent del tema activo
 */
export const TextHighlighter: React.FC<TextHighlighterProps> = ({
	text,
	keyword,
	className = ''
}) => {
	const { appColorTokens } = useTheme();
	
	// Generar el estilo de resaltado usando los tokens del tema
	const highlightStyle = useMemo(() => {
		if (!appColorTokens) return {};
		return generateHighlightStyle(appColorTokens);
	}, [appColorTokens]);
	
	// Si no hay keyword, devolver el texto sin modificar
	if (!keyword || !keyword.trim()) {
		return <span className={className}>{text}</span>;
	}

	const trimmedKeyword = keyword.trim();
	
	// Crear regex para buscar la palabra (case-insensitive, palabra completa o parcial)
	const regex = new RegExp(`(${trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
	
	// Dividir el texto en partes
	const parts = text.split(regex);
	
	// Si no hay coincidencias, devolver el texto original
	if (parts.length === 1) {
		return <span className={className}>{text}</span>;
	}

	return (
		<span className={className}>
			{parts.map((part, index) => {
				// Si la parte coincide con el keyword (case-insensitive), resaltarla
				if (part.toLowerCase() === trimmedKeyword.toLowerCase()) {
					return (
						<span
							key={index}
							style={highlightStyle}
						>
							{part}
						</span>
					);
				}
				return part;
			})}
		</span>
	);
};
