// ─────────────────────────────────────────────────────────
// Ejemplo de uso: SVGs reactivos al tema de Sustrato
// ─────────────────────────────────────────────────────────
//
// Todos los SVGs usan "currentColor" en lugar de colores
// hardcodeados. Esto significa que heredan el color del
// contenedor padre via CSS `color: ...`.
//
// Para conectarlos al tema de tu sitio:
//
// ┌──────────────────────────────────────────────────────┐
// │  <div style={{ color: '#0F6E56' }}>                  │
// │    <EquipoSvg />   ← se pinta en teal               │
// │  </div>                                              │
// │                                                      │
// │  <div style={{ color: 'var(--mi-variable-css)' }}>   │
// │    <ArticulosSvg /> ← sigue tu tema                  │
// │  </div>                                              │
// └──────────────────────────────────────────────────────┘
//
// Para escalar el tamaño, simplemente cambia width/height:
//
//   <EquipoSvg width={120} height={120} />
//
// ─────────────────────────────────────────────────────────

// Opción A: Importar como componentes React (Next.js con SVGR)
// import EquipoSvg from './equipo.svg';
// import ArticulosSvg from './articulos.svg';
// etc.

// Opción B: Componentes inline (copiar el SVG directamente)
// Ejemplo con Equipo:

export const EquipoIcon = ({ width = 80, height = 80, ...props }) => (
  <svg width={width} height={height} viewBox="0 0 80 80" fill="none" {...props}>
    <circle cx="40" cy="28" r="10" fill="currentColor" opacity="0.8"/>
    <circle cx="22" cy="52" r="8" fill="currentColor" opacity="0.45"/>
    <circle cx="58" cy="52" r="8" fill="currentColor" opacity="0.45"/>
    <line x1="40" y1="36" x2="26" y2="46" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="40" y1="36" x2="54" y2="46" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="28" y1="56" x2="52" y2="56" stroke="currentColor" strokeWidth="0.5" opacity="0.3" strokeDasharray="3 3"/>
  </svg>
);

// ─────────────────────────────────────────────────────────
// Ejemplo de card completa con SVG reactivo
// ─────────────────────────────────────────────────────────

/*
<div className="card" style={{ color: '#0F6E56' }}>
  <div className="card-content">
    <h3>Equipo</h3>
    <span className="number">2</span>
    <p>1 rol: Asesor Metodológico</p>
  </div>
  <EquipoIcon width={100} height={100} />
</div>
*/

// Paleta sugerida por sección (los mismos colores del preview):
//
// Equipo:      #0F6E56 (teal)
// Artículos:   #185FA5 (blue)
// Fases:       #534AB7 (purple)
// Dimensiones: #D85A30 (coral)
// Lotes:       #0F6E56 (teal)
// Análisis:    #534AB7 (purple)
