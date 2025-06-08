//. 📍 app/datos-maestros/lote/components/BatchItem.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
import React from "react";
import { motion } from "framer-motion";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
interface BatchItemProps {
	color: string;
	border: string;
	textColor: string;
	number: number;
	size?: number | string; // px o %
	animate?: boolean;
}
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export const BatchItem: React.FC<BatchItemProps> = ({
	color,
	border,
	textColor,
	number,
	size = 48,
	animate = false,
}) => {
	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		<motion.div
			whileHover={{ scale: 1.08 }}
			animate={animate ? { scale: [1, 1.05, 1] } : false}
			transition={{
				duration: 2,
				repeat: Infinity,
				repeatType: "reverse",
				ease: "easeInOut",
			}}
			style={{
				width: typeof size === "number" ? size : size,
				height: typeof size === "number" ? size : size,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: color,
				borderRadius: "50%",
				border: `2.5px solid ${border}`,
				boxShadow: `0 2px 8px 0 rgba(0,0,0,0.07)`,
			}}>
			<span
				style={{
					color: textColor,
					fontWeight: 700,
					fontSize: typeof size === "number" ? size * 0.45 : "1.2em",
					userSelect: "none",
				}}>
				{number}
			</span>
		</motion.div>
	);
	//#endregion ![render]
};
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Export is part of the component declaration
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// Considerar si se necesitan más opciones de personalización (ej. forma, fuente).
// Evaluar la complejidad de las animaciones para rendimiento en listas grandes.
//#endregion ![todo]
