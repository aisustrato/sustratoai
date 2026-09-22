// 📍 eslint.config.mjs
// Flat config (ESLint 9). Reemplaza a .eslintrc.json: `next lint` se eliminó en Next 16.

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
	...nextCoreWebVitals,
	...nextTypescript,
	{
		// ESLint 8 (`next lint`) no reportaba directivas eslint-disable sin uso.
		linterOptions: { reportUnusedDisableDirectives: "off" },
		rules: {
			// Reglas del React Compiler (eslint-plugin-react-hooks v7). El proyecto
			// no usa el compilador y estas reglas marcan ~200 patrones existentes
			// (efectos con setState, refs en render, etc.). Reactivar cuando se
			// decida adoptar el compilador o refactorizar esos componentes.
			"react-hooks/set-state-in-effect": "off",
			"react-hooks/refs": "off",
			"react-hooks/preserve-manual-memoization": "off",
			"react-hooks/purity": "off",
			"react-hooks/immutability": "off",
			"react-hooks/use-memo": "off",
			"react-hooks/static-components": "off",
			"react-hooks/incompatible-library": "off",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
					destructuredArrayIgnorePattern: "^_",
				},
			],
			"import/no-unresolved": "error",
		},
		settings: {
			"import/resolver": {
				typescript: {
					alwaysTryTypes: true,
					project: "./tsconfig.json",
				},
			},
		},
	},
];

export default eslintConfig;
