import React from "react";
import { motion } from "framer-motion";

interface BatchItemProps {
	color: string;
	border: string;
	textColor: string;
	number: number;
	size?: number | string; // px o %
	animate?: boolean;
}

export const BatchItem: React.FC<BatchItemProps> = ({
	color,
	border,
	textColor,
	number,
	size = 48,
	animate = false,
}) => {
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
};
