// 📍 lib/svg/components.tsx
// 🎯 PROPÓSITO: Componentes React para SVGs del home con currentColor
// 🔧 DECISIÓN: Usar currentColor para que sigan el tema automáticamente

import React from "react";

export const LotesIcon = ({
	width = 80,
	height = 80,
	...props
}: React.SVGProps<SVGSVGElement>) => (
	<svg
		width={width}
		height={height}
		viewBox="0 0 80 80"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...props}>
		<rect
			x="8"
			y="10"
			width="14"
			height="14"
			rx="3"
			fill="currentColor"
			opacity="0.3"
		/>
		<rect
			x="25"
			y="10"
			width="14"
			height="14"
			rx="3"
			fill="currentColor"
			opacity="0.45"
		/>
		<rect
			x="42"
			y="10"
			width="14"
			height="14"
			rx="3"
			fill="currentColor"
			opacity="0.3"
		/>
		<rect
			x="59"
			y="10"
			width="14"
			height="14"
			rx="3"
			fill="currentColor"
			opacity="0.4"
		/>
		<rect
			x="8"
			y="28"
			width="14"
			height="14"
			rx="3"
			fill="currentColor"
			opacity="0.4"
		/>
		<rect
			x="25"
			y="28"
			width="14"
			height="14"
			rx="3"
			fill="currentColor"
			opacity="0.55"
		/>
		<rect
			x="42"
			y="28"
			width="14"
			height="14"
			rx="3"
			fill="currentColor"
			opacity="0.45"
		/>
		<rect
			x="59"
			y="28"
			width="14"
			height="14"
			rx="3"
			fill="currentColor"
			opacity="0.3"
		/>
		<rect
			x="8"
			y="46"
			width="14"
			height="14"
			rx="3"
			fill="currentColor"
			opacity="0.3"
		/>
		<rect
			x="25"
			y="46"
			width="14"
			height="14"
			rx="3"
			fill="currentColor"
			opacity="0.4"
		/>
		<rect
			x="42"
			y="46"
			width="14"
			height="14"
			rx="3"
			fill="currentColor"
			opacity="0.55"
		/>
		<rect
			x="59"
			y="46"
			width="14"
			height="14"
			rx="3"
			fill="currentColor"
			opacity="0.45"
		/>
		<rect
			x="8"
			y="64"
			width="14"
			height="8"
			rx="2"
			fill="currentColor"
			opacity="0.2"
		/>
		<rect
			x="25"
			y="64"
			width="14"
			height="8"
			rx="2"
			fill="currentColor"
			opacity="0.25"
		/>
		<rect
			x="42"
			y="64"
			width="14"
			height="8"
			rx="2"
			fill="currentColor"
			opacity="0.2"
		/>
	</svg>
);

export const FasesIcon = ({
	width = 80,
	height = 80,
	...props
}: React.SVGProps<SVGSVGElement>) => (
	<svg
		width={width}
		height={height}
		viewBox="0 0 80 80"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...props}>
		<path
			d="M10 18 L70 18 L58 38 L70 38 L58 58 L22 58 L10 38 L22 38 Z"
			stroke="currentColor"
			stroke-width="1.5"
			opacity="0.25"
		/>
		<path
			d="M18 24 L62 24 L53 38 L62 38 L53 52 L27 52 L18 38 L27 38 Z"
			fill="currentColor"
			opacity="0.2"
		/>
		<path
			d="M26 30 L54 30 L48 38 L54 38 L48 46 L32 46 L26 38 L32 38 Z"
			fill="currentColor"
			opacity="0.35"
		/>
		<path
			d="M34 35 L46 35 L43 40 L46 40 L43 45 L37 45 L34 40 L37 40 Z"
			fill="currentColor"
			opacity="0.55"
		/>
		<circle cx="40" cy="68" r="3" fill="currentColor" opacity="0.7" />
		<line
			x1="40"
			y1="52"
			x2="40"
			y2="65"
			stroke="currentColor"
			stroke-width="0.5"
			opacity="0.4"
			stroke-dasharray="2 2"
		/>
	</svg>
);

export const EquipoIcon = ({
	width = 80,
	height = 80,
	...props
}: React.SVGProps<SVGSVGElement>) => (
	<svg
		width={width}
		height={height}
		viewBox="0 0 80 80"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...props}>
		<circle cx="40" cy="28" r="10" fill="currentColor" opacity="0.8" />
		<circle cx="22" cy="52" r="8" fill="currentColor" opacity="0.45" />
		<circle cx="58" cy="52" r="8" fill="currentColor" opacity="0.45" />
		<line
			x1="40"
			y1="36"
			x2="26"
			y2="46"
			stroke="currentColor"
			stroke-width="1"
			opacity="0.5"
		/>
		<line
			x1="40"
			y1="36"
			x2="54"
			y2="46"
			stroke="currentColor"
			stroke-width="1"
			opacity="0.5"
		/>
		<line
			x1="28"
			y1="56"
			x2="52"
			y2="56"
			stroke="currentColor"
			stroke-width="0.5"
			opacity="0.3"
			stroke-dasharray="3 3"
		/>
	</svg>
);

export const AnalisisIcon = ({
	width = 80,
	height = 80,
	...props
}: React.SVGProps<SVGSVGElement>) => (
	<svg
		width={width}
		height={height}
		viewBox="0 0 80 80"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...props}>
		<rect
			x="12"
			y="58"
			width="8"
			height="14"
			rx="2"
			fill="currentColor"
			opacity="0.25"
		/>
		<rect
			x="24"
			y="48"
			width="8"
			height="24"
			rx="2"
			fill="currentColor"
			opacity="0.3"
		/>
		<rect
			x="36"
			y="38"
			width="8"
			height="34"
			rx="2"
			fill="currentColor"
			opacity="0.25"
		/>
		<rect
			x="48"
			y="30"
			width="8"
			height="42"
			rx="2"
			fill="currentColor"
			opacity="0.35"
		/>
		<rect
			x="60"
			y="22"
			width="8"
			height="50"
			rx="2"
			fill="currentColor"
			opacity="0.3"
		/>
		<path
			d="M16 55 Q30 35, 40 38 Q50 40, 52 28 Q56 20, 64 18"
			stroke="currentColor"
			stroke-width="1.5"
			opacity="0.6"
		/>
		<circle cx="64" cy="18" r="3" fill="currentColor" opacity="0.7" />
	</svg>
);

export const ArticulosIcon = ({
	width = 80,
	height = 80,
	...props
}: React.SVGProps<SVGSVGElement>) => (
	<svg
		width={width}
		height={height}
		viewBox="0 0 80 80"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...props}>
		<rect
			x="12"
			y="14"
			width="18"
			height="24"
			rx="2"
			fill="currentColor"
			opacity="0.3"
		/>
		<rect
			x="20"
			y="10"
			width="18"
			height="24"
			rx="2"
			fill="currentColor"
			opacity="0.4"
		/>
		<rect
			x="28"
			y="6"
			width="18"
			height="24"
			rx="2"
			fill="currentColor"
			opacity="0.5"
		/>
		<rect
			x="36"
			y="18"
			width="18"
			height="24"
			rx="2"
			fill="currentColor"
			opacity="0.3"
		/>
		<rect
			x="44"
			y="12"
			width="18"
			height="24"
			rx="2"
			fill="currentColor"
			opacity="0.4"
		/>
		<rect
			x="52"
			y="8"
			width="18"
			height="24"
			rx="2"
			fill="currentColor"
			opacity="0.35"
		/>
		<rect
			x="16"
			y="42"
			width="18"
			height="24"
			rx="2"
			fill="currentColor"
			opacity="0.4"
		/>
		<rect
			x="26"
			y="46"
			width="18"
			height="24"
			rx="2"
			fill="currentColor"
			opacity="0.3"
		/>
		<rect
			x="36"
			y="48"
			width="18"
			height="24"
			rx="2"
			fill="currentColor"
			opacity="0.25"
		/>
		<rect
			x="46"
			y="44"
			width="18"
			height="24"
			rx="2"
			fill="currentColor"
			opacity="0.35"
		/>
	</svg>
);

export const DimensionesIcon = ({
	width = 80,
	height = 80,
	...props
}: React.SVGProps<SVGSVGElement>) => (
	<svg
		width={width}
		height={height}
		viewBox="0 0 80 80"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...props}>
		<line
			x1="10"
			y1="40"
			x2="70"
			y2="40"
			stroke="currentColor"
			stroke-width="0.5"
			opacity="0.2"
		/>
		<line
			x1="40"
			y1="10"
			x2="40"
			y2="70"
			stroke="currentColor"
			stroke-width="0.5"
			opacity="0.2"
		/>
		<line
			x1="15"
			y1="15"
			x2="65"
			y2="65"
			stroke="currentColor"
			stroke-width="0.5"
			opacity="0.15"
		/>
		<line
			x1="65"
			y1="15"
			x2="15"
			y2="65"
			stroke="currentColor"
			stroke-width="0.5"
			opacity="0.15"
		/>
		<circle cx="40" cy="18" r="4" fill="currentColor" opacity="0.45" />
		<circle cx="58" cy="24" r="3.5" fill="currentColor" opacity="0.4" />
		<circle cx="64" cy="40" r="4" fill="currentColor" opacity="0.5" />
		<circle cx="58" cy="56" r="3.5" fill="currentColor" opacity="0.4" />
		<circle cx="40" cy="62" r="4" fill="currentColor" opacity="0.45" />
		<circle cx="22" cy="56" r="3.5" fill="currentColor" opacity="0.4" />
		<circle cx="16" cy="40" r="4" fill="currentColor" opacity="0.5" />
		<circle cx="22" cy="24" r="3.5" fill="currentColor" opacity="0.4" />
		<circle cx="40" cy="40" r="6" fill="currentColor" opacity="0.2" />
	</svg>
);
