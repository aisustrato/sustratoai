//#region [head] - 🏷️ IMPORTS 🏷️
import type { AppColorTokens, Mode } from "../ColorToken";
import { neutral } from "../colors";
import tinycolor from "tinycolor2";
//#endregion

//#region [def] - 📦 TYPES & INTERFACES 📦
export interface StandardDropdownMenuTokens {
	content: {
		backgroundColor: string;
		borderColor: string;
		boxShadow: string;
	};
	item: {
		backgroundColor: string;
		foregroundColor: string;
		hoverBackgroundColor: string;
		hoverForegroundColor: string;
		disabledForegroundColor: string;
		iconColor: string;
	};
	label: {
		foregroundColor: string;
	};
	separator: {
		backgroundColor: string;
	};
	arrow: {
		fill: string;
	};
}
//#endregion

//#region [main] - 🏭 TOKEN GENERATOR FUNCTION 🏭
export function generateDropdownMenuTokens(
	appColorTokens: AppColorTokens,
	mode: Mode
): StandardDropdownMenuTokens {
	const isDark = mode === "dark";

	const contentBg = isDark ? neutral.gray[800] : neutral.white;
	const contentBorder = isDark ? neutral.gray[700] : neutral.gray[200];
	
	const itemText = isDark ? neutral.gray[200] : neutral.gray[800];
	const itemTextDisabled = isDark ? neutral.gray[500] : neutral.gray[400];
	const itemIcon = isDark ? neutral.gray[400] : neutral.gray[500];

	// Usamos el color primario para los estados de hover/focus para dar un feedback claro.
	const primaryScheme = appColorTokens.primary;
	const hoverBg = isDark 
		? tinycolor(primaryScheme.pure).setAlpha(0.15).toRgbString()
		: tinycolor(primaryScheme.pure).setAlpha(0.1).toRgbString();
	
	const hoverText = isDark ? primaryScheme.text : primaryScheme.pure;

	const labelText = isDark ? neutral.gray[400] : neutral.gray[600];

	const separatorBg = isDark ? neutral.gray[700] : neutral.gray[200];

	return {
		content: {
			backgroundColor: contentBg,
			borderColor: contentBorder,
			boxShadow: isDark
				? `0 8px 16px -4px ${tinycolor(neutral.black).setAlpha(0.4).toRgbString()}`
				: `0 8px 16px -4px ${tinycolor(neutral.black).setAlpha(0.1).toRgbString()}`,
		},
		item: {
			backgroundColor: "transparent", // El fondo por defecto es el del `content`
			foregroundColor: itemText,
			hoverBackgroundColor: hoverBg,
			hoverForegroundColor: hoverText, // El texto cambia a un tono primario en hover
			disabledForegroundColor: itemTextDisabled,
			iconColor: itemIcon,
		},
		label: {
			foregroundColor: labelText,
		},
		separator: {
			backgroundColor: separatorBg,
		},
		arrow: {
			fill: contentBorder,
		},
	};
}
//#endregion